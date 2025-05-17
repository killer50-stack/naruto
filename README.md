# BrownBox - Sistema de Armazenamento de Arquivos

Um sistema completo para armazenamento e gerenciamento de arquivos (imagens, vídeos e PDFs), com interface de usuário moderna e tema marrom.

## Características

- Interface com tema marrom, intuitiva e responsiva
- Upload de arquivos (imagens, vídeos e PDFs)
- Visualização integrada de arquivos diretamente no navegador
- Limite de 999 GB de armazenamento por usuário
- Limite de 29 GB por arquivo enviado
- Filtragem e busca de arquivos
- Estatísticas de uso de armazenamento
- Banco de dados SQLite para metadados

## Requisitos do Sistema

- PHP 8.0 ou superior
- Extensão SQLite para PHP
- XAMPP, WAMP, MAMP ou servidor web similar
- Navegador web moderno

## Instalação

1. Clone ou baixe este repositório para o diretório de seu servidor web local (ex: `htdocs` para XAMPP)

2. Certifique-se de que o PHP tenha permissão de escrita nos diretórios:
   - `database/`
   - `uploads/`

3. Configure o PHP para permitir uploads grandes. No arquivo `php.ini`:
   ```ini
   upload_max_filesize = 29G
   post_max_size = 29G
   max_execution_time = 3600
   memory_limit = 1G
   ```

4. Acesse o sistema pelo navegador:
   ```
   http://localhost/[pasta-do-projeto]/
   ```

5. Na primeira execução, o sistema inicializará automaticamente o banco de dados SQLite com um usuário de teste:
   - Usuário: demo
   - Senha: demo123

## Estrutura do Projeto

```
/
├── index.html                # Interface principal do usuário
├── css/
│   └── styles.css            # Estilos CSS com tema marrom
├── js/
│   └── script.js             # Códigos JavaScript
├── database/
│   └── init.php              # Inicialização do banco SQLite
│   └── storage.db            # Arquivo de banco de dados (criado automaticamente)
├── uploads/                  # Diretório para armazenamento dos arquivos
├── api.php                   # API para listar e gerenciar arquivos
├── upload.php                # Processador de uploads
└── view.php                  # Visualizador de arquivos
```

## Uso

1. Acesse a página inicial para visualizar os arquivos já enviados
2. Use o botão "Upload" para enviar novos arquivos
3. Filtre arquivos por tipo (imagens, vídeos, PDFs)
4. Use a busca para encontrar arquivos pelo nome
5. Clique em um arquivo para visualizá-lo, baixá-lo ou excluí-lo
6. Verifique estatísticas de uso na seção "Estatísticas"

## Considerações de Segurança

Este é um projeto de demonstração e não deve ser usado em produção sem revisão adicional:

1. Implemente autenticação adequada para usuários
2. Adicione validação de arquivos mais rigorosa
3. Implemente controle de acesso a arquivos
4. Configure limites adequados de uploads no servidor

## Ajustes para Produção

Para um ambiente de produção, considere:

1. Migrar para um banco de dados mais robusto (MySQL, PostgreSQL)
2. Implementar armazenamento em nuvem para arquivos grandes
3. Adicionar compressão de imagens e vídeos
4. Implementar processamento assíncrono para uploads grandes
5. Adicionar backup automático de dados

## Licença

Este projeto é fornecido apenas para fins educacionais e de demonstração.