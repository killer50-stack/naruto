<?php
// Configurações do banco de dados
$db_file = __DIR__ . '/storage.db';
$max_storage_gb = 999;
$max_file_size_gb = 29;

// Inicializar conexão com o SQLite
try {
    $db = new PDO('sqlite:' . $db_file);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Criar tabela de usuários se não existir
    $db->exec("CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        storage_used INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )");
    
    // Criar tabela de arquivos se não existir
    $db->exec("CREATE TABLE IF NOT EXISTS files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        size INTEGER NOT NULL,
        path TEXT NOT NULL,
        uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )");
    
    // Criar usuário padrão para testes
    $stmt = $db->prepare("SELECT COUNT(*) FROM users WHERE username = 'demo'");
    $stmt->execute();
    if ($stmt->fetchColumn() == 0) {
        $password_hash = password_hash('demo123', PASSWORD_DEFAULT);
        $stmt = $db->prepare("INSERT INTO users (username, password) VALUES (:username, :password)");
        $stmt->bindParam(':username', $username);
        $stmt->bindParam(':password', $password_hash);
        $username = 'demo';
        $stmt->execute();
    }
    
    echo "Banco de dados inicializado com sucesso!";
} catch(PDOException $e) {
    echo "Erro: " . $e->getMessage();
}
?> 