# MediaVault - Armazenamento de Fotos e Vídeos

Este é um site para armazenamento e gerenciamento de fotos e vídeos, com limite total de 900GB e tamanho máximo de upload de 3GB por arquivo.

## Funcionalidades

- Upload de arquivos por drag-and-drop ou seleção
- Limite de 3GB por arquivo
- Capacidade total de armazenamento de 900GB
- Visualização de galeria com filtros (fotos/vídeos)
- Visualização detalhada de arquivos em modal
- Download de arquivos
- Exclusão de arquivos
- Estatísticas de armazenamento

## Tecnologias Utilizadas

- HTML5
- CSS3
- JavaScript (Vanilla)
- FontAwesome para ícones

## Funcionamento

Este projeto é uma demonstração front-end que simula o armazenamento de arquivos. Na implementação atual:

1. Os arquivos são armazenados temporariamente no navegador usando o localStorage
2. O upload é simulado com uma barra de progresso
3. Os arquivos permanecem disponíveis entre sessões graças ao localStorage

Em um ambiente de produção real, seria necessário:

1. Implementar um servidor backend (Node.js, PHP, etc.)
2. Configurar armazenamento em disco ou serviço de nuvem
3. Implementar autenticação de usuários
4. Adicionar validações de segurança

## Estrutura do Projeto

```
/
├── index.html          # Página principal
├── css/
│   └── styles.css      # Estilos CSS
├── js/
│   └── script.js       # Funcionalidades JavaScript
└── uploads/            # Pasta para armazenar uploads (em produção)
```

## Como Usar

1. Abra o arquivo `index.html` em um navegador moderno
2. Arraste e solte arquivos de imagem ou vídeo na área de upload
3. Clique no botão "Iniciar Upload" para processar os arquivos
4. Visualize seus arquivos na seção de galeria
5. Clique em um arquivo para ver detalhes, fazer download ou excluir

## Limitações da Versão Demo

- Os arquivos são armazenados apenas no navegador
- Os URLs dos arquivos são temporários e expiram quando o navegador é fechado
- O armazenamento real é limitado pelo localStorage do navegador (geralmente 5-10MB)

## Próximos Passos

Para transformar este projeto em um aplicativo completo, seria necessário:

1. Desenvolver um backend com autenticação
2. Implementar upload real de arquivos para servidor
3. Configurar banco de dados para metadados
4. Adicionar sistema de usuários com contas individuais
5. Implementar camada de segurança para acesso aos arquivos
6. Adicionar funcionalidades como compartilhamento e álbuns

## Licença

Este projeto é apenas para fins educacionais e demonstrativos. 