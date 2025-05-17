<?php
// Configurações
header('Content-Type: application/json');
session_start();

// Verificar autenticação (simplificada para o exemplo)
$user_id = 1; // Normalmente seria obtido da sessão

// Incluir arquivo de configuração do banco de dados
require_once 'database/init.php';

// Verificar qual ação realizar
$action = isset($_GET['action']) ? $_GET['action'] : '';

switch ($action) {
    case 'list-files':
        listFiles($db, $user_id);
        break;
    case 'delete-file':
        deleteFile($db, $user_id);
        break;
    case 'user-stats':
        getUserStats($db, $user_id);
        break;
    default:
        echo json_encode(['error' => 'Ação não reconhecida']);
        break;
}

function listFiles($db, $user_id) {
    try {
        // Parâmetros de paginação e filtro
        $page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
        $per_page = isset($_GET['per_page']) ? min(50, max(1, (int)$_GET['per_page'])) : 12;
        $type = isset($_GET['type']) ? $_GET['type'] : null;
        $search = isset($_GET['search']) ? $_GET['search'] : null;
        
        // Calcular offset para paginação
        $offset = ($page - 1) * $per_page;
        
        // Construir query base
        $query = "SELECT * FROM files WHERE user_id = :user_id";
        $params = [':user_id' => $user_id];
        
        // Adicionar filtro de tipo
        if ($type && $type !== 'all') {
            $query .= " AND type = :type";
            $params[':type'] = $type;
        }
        
        // Adicionar filtro de busca
        if ($search) {
            $query .= " AND name LIKE :search";
            $params[':search'] = "%$search%";
        }
        
        // Query para contagem total
        $countStmt = $db->prepare("SELECT COUNT(*) FROM (" . $query . ") as filtered");
        foreach ($params as $key => $value) {
            $countStmt->bindValue($key, $value);
        }
        $countStmt->execute();
        $total = $countStmt->fetchColumn();
        
        // Adicionar ordenação e paginação
        $query .= " ORDER BY uploaded_at DESC LIMIT :limit OFFSET :offset";
        $params[':limit'] = $per_page;
        $params[':offset'] = $offset;
        
        // Executar query principal
        $stmt = $db->prepare($query);
        foreach ($params as $key => $value) {
            if ($key === ':limit' || $key === ':offset') {
                $stmt->bindValue($key, $value, PDO::PARAM_INT);
            } else {
                $stmt->bindValue($key, $value);
            }
        }
        $stmt->execute();
        
        // Processar resultados
        $files = [];
        while ($file = $stmt->fetch(PDO::FETCH_ASSOC)) {
            // Adicionar URL para acesso ao arquivo
            $file['url'] = 'view.php?id=' . $file['id'];
            $file['download_url'] = 'view.php?id=' . $file['id'] . '&download=1';
            unset($file['path']); // Não expor o caminho físico
            $files[] = $file;
        }
        
        // Calcular total de páginas
        $total_pages = ceil($total / $per_page);
        
        // Retornar resultados
        echo json_encode([
            'files' => $files,
            'pagination' => [
                'total' => $total,
                'per_page' => $per_page,
                'current_page' => $page,
                'total_pages' => $total_pages
            ]
        ]);
        
    } catch(PDOException $e) {
        echo json_encode(['error' => 'Erro no banco de dados: ' . $e->getMessage()]);
    }
}

function deleteFile($db, $user_id) {
    // Verificar se é uma requisição POST
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        echo json_encode(['error' => 'Método não permitido']);
        return;
    }
    
    // Obter ID do arquivo
    $data = json_decode(file_get_contents('php://input'), true);
    $file_id = isset($data['file_id']) ? (int)$data['file_id'] : 0;
    
    if (!$file_id) {
        echo json_encode(['error' => 'ID do arquivo é necessário']);
        return;
    }
    
    try {
        // Iniciar transação
        $db->beginTransaction();
        
        // Buscar informações do arquivo
        $stmt = $db->prepare("SELECT * FROM files WHERE id = :id AND user_id = :user_id");
        $stmt->bindParam(':id', $file_id, PDO::PARAM_INT);
        $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
        $stmt->execute();
        
        $file = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$file) {
            echo json_encode(['error' => 'Arquivo não encontrado']);
            return;
        }
        
        // Excluir o arquivo físico
        if (file_exists($file['path'])) {
            unlink($file['path']);
        }
        
        // Atualizar espaço usado pelo usuário
        $stmt = $db->prepare("UPDATE users SET storage_used = storage_used - :size WHERE id = :user_id");
        $stmt->bindParam(':size', $file['size'], PDO::PARAM_INT);
        $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
        $stmt->execute();
        
        // Excluir registro do banco
        $stmt = $db->prepare("DELETE FROM files WHERE id = :id");
        $stmt->bindParam(':id', $file_id, PDO::PARAM_INT);
        $stmt->execute();
        
        // Confirmar transação
        $db->commit();
        
        echo json_encode(['success' => true]);
        
    } catch(PDOException $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        echo json_encode(['error' => 'Erro no banco de dados: ' . $e->getMessage()]);
    }
}

function getUserStats($db, $user_id) {
    try {
        // Buscar estatísticas de armazenamento
        $stmt = $db->prepare("
            SELECT 
                u.storage_used,
                COUNT(f.id) AS total_files,
                SUM(CASE WHEN f.type = 'image' THEN 1 ELSE 0 END) AS total_images,
                SUM(CASE WHEN f.type = 'video' THEN 1 ELSE 0 END) AS total_videos,
                SUM(CASE WHEN f.type = 'pdf' THEN 1 ELSE 0 END) AS total_pdfs
            FROM users u
            LEFT JOIN files f ON u.id = f.user_id
            WHERE u.id = :user_id
            GROUP BY u.id
        ");
        $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
        $stmt->execute();
        
        $stats = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$stats) {
            // Usuário existe mas não tem arquivos
            $stmt = $db->prepare("SELECT storage_used FROM users WHERE id = :user_id");
            $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
            $stmt->execute();
            
            $storage = $stmt->fetchColumn();
            
            $stats = [
                'storage_used' => $storage ?: 0,
                'total_files' => 0,
                'total_images' => 0,
                'total_videos' => 0,
                'total_pdfs' => 0
            ];
        }
        
        // Adicionar estatísticas derivadas
        $max_storage = $GLOBALS['max_storage_gb'] * 1024 * 1024 * 1024; // em bytes
        $stats['max_storage'] = $max_storage;
        $stats['available_storage'] = $max_storage - $stats['storage_used'];
        $stats['storage_percentage'] = $max_storage > 0 
            ? round(($stats['storage_used'] / $max_storage) * 100, 2) 
            : 0;
            
        // Calcular tamanho médio
        $stats['avg_size'] = $stats['total_files'] > 0 
            ? $stats['storage_used'] / $stats['total_files'] 
            : 0;
        
        echo json_encode(['stats' => $stats]);
        
    } catch(PDOException $e) {
        echo json_encode(['error' => 'Erro no banco de dados: ' . $e->getMessage()]);
    }
}
?> 