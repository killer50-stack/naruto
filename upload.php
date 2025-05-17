<?php
// Configurações
header('Content-Type: application/json');
session_start();

// Verificar autenticação (simplificada para o exemplo)
$user_id = 1; // Normalmente seria obtido da sessão

// Incluir arquivo de configuração do banco de dados
require_once 'database/init.php';

// Verificar se é uma requisição POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['error' => 'Método não permitido']);
    exit;
}

// Verificar se há arquivo
if (empty($_FILES['file'])) {
    echo json_encode(['error' => 'Nenhum arquivo enviado']);
    exit;
}

$file = $_FILES['file'];
$name = $file['name'];
$size = $file['size'];
$tmp_path = $file['tmp_name'];
$error = $file['error'];
$type = $file['type'];

// Verificar erros de upload
if ($error !== UPLOAD_ERR_OK) {
    $message = match($error) {
        UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE => 'Arquivo excede o limite de tamanho permitido',
        UPLOAD_ERR_PARTIAL => 'O upload foi interrompido',
        UPLOAD_ERR_NO_FILE => 'Nenhum arquivo enviado',
        default => 'Erro desconhecido no upload'
    };
    echo json_encode(['error' => $message]);
    exit;
}

// Verificar tamanho máximo do arquivo (29GB em bytes)
$max_file_size = $max_file_size_gb * 1024 * 1024 * 1024;
if ($size > $max_file_size) {
    echo json_encode(['error' => "O arquivo excede o limite de $max_file_size_gb GB"]);
    exit;
}

// Verificar espaço disponível do usuário
try {
    $stmt = $db->prepare("SELECT storage_used FROM users WHERE id = :user_id");
    $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
    $stmt->execute();
    $user_storage = $stmt->fetchColumn();
    
    $max_storage = $max_storage_gb * 1024 * 1024 * 1024;
    if ($user_storage + $size > $max_storage) {
        echo json_encode(['error' => 'Espaço de armazenamento insuficiente']);
        exit;
    }
    
    // Verificar tipo de arquivo
    $allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/webm', 'application/pdf'];
    if (!in_array($type, $allowed_types)) {
        echo json_encode(['error' => 'Tipo de arquivo não permitido']);
        exit;
    }
    
    // Determinar o tipo de categoria
    $category = 'unknown';
    if (strpos($type, 'image/') === 0) {
        $category = 'image';
    } elseif (strpos($type, 'video/') === 0) {
        $category = 'video';
    } elseif ($type === 'application/pdf') {
        $category = 'pdf';
    }
    
    // Criar pasta de uploads se não existir
    $upload_dir = __DIR__ . '/uploads/' . $user_id;
    if (!is_dir($upload_dir)) {
        mkdir($upload_dir, 0755, true);
    }
    
    // Gerar nome único para o arquivo
    $unique_filename = uniqid() . '_' . $name;
    $upload_path = $upload_dir . '/' . $unique_filename;
    
    // Mover arquivo para o destino
    if (!move_uploaded_file($tmp_path, $upload_path)) {
        echo json_encode(['error' => 'Falha ao salvar o arquivo']);
        exit;
    }
    
    // Salvar informações no banco de dados
    $db->beginTransaction();
    
    // Salvar arquivo no banco
    $stmt = $db->prepare("INSERT INTO files (user_id, name, type, mime_type, size, path) 
                          VALUES (:user_id, :name, :type, :mime_type, :size, :path)");
    $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
    $stmt->bindParam(':name', $name);
    $stmt->bindParam(':type', $category);
    $stmt->bindParam(':mime_type', $type);
    $stmt->bindParam(':size', $size, PDO::PARAM_INT);
    $stmt->bindParam(':path', $upload_path);
    $stmt->execute();
    $file_id = $db->lastInsertId();
    
    // Atualizar espaço utilizado pelo usuário
    $stmt = $db->prepare("UPDATE users SET storage_used = storage_used + :size WHERE id = :user_id");
    $stmt->bindParam(':size', $size, PDO::PARAM_INT);
    $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
    $stmt->execute();
    
    $db->commit();
    
    // Retornar sucesso com informações do arquivo
    echo json_encode([
        'success' => true,
        'file' => [
            'id' => $file_id,
            'name' => $name,
            'type' => $category,
            'mime_type' => $type,
            'size' => $size,
            'url' => 'view.php?id=' . $file_id
        ]
    ]);
    
} catch(PDOException $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    echo json_encode(['error' => 'Erro no banco de dados: ' . $e->getMessage()]);
}
?> 