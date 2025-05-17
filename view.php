<?php
// Inicializar sessão
session_start();

// Verificar autenticação (simplificada para o exemplo)
$user_id = 1; // Normalmente seria obtido da sessão

// Incluir arquivo de configuração do banco de dados
require_once 'database/init.php';

// Verificar se um ID foi fornecido
if (!isset($_GET['id']) || empty($_GET['id'])) {
    header('HTTP/1.1 400 Bad Request');
    echo 'ID do arquivo é necessário';
    exit;
}

$file_id = (int) $_GET['id'];
$download = isset($_GET['download']) && $_GET['download'] === '1';

try {
    // Buscar informações do arquivo
    $stmt = $db->prepare("SELECT * FROM files WHERE id = :id AND user_id = :user_id");
    $stmt->bindParam(':id', $file_id, PDO::PARAM_INT);
    $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
    $stmt->execute();
    
    $file = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$file) {
        header('HTTP/1.1 404 Not Found');
        echo 'Arquivo não encontrado';
        exit;
    }
    
    // Verificar se o arquivo existe no sistema
    if (!file_exists($file['path'])) {
        header('HTTP/1.1 404 Not Found');
        echo 'Arquivo não encontrado no sistema';
        exit;
    }
    
    // Definir cabeçalhos com base no tipo MIME
    header('Content-Type: ' . $file['mime_type']);
    
    // Para download forçado
    if ($download) {
        header('Content-Disposition: attachment; filename="' . $file['name'] . '"');
    } else {
        // Para visualização inline
        header('Content-Disposition: inline; filename="' . $file['name'] . '"');
    }
    
    header('Content-Length: ' . $file['size']);
    
    // Desabilitar cache
    header('Cache-Control: no-cache, no-store, must-revalidate');
    header('Pragma: no-cache');
    header('Expires: 0');
    
    // Saída do arquivo
    readfile($file['path']);

} catch(PDOException $e) {
    header('HTTP/1.1 500 Internal Server Error');
    echo 'Erro no banco de dados: ' . $e->getMessage();
}
?> 