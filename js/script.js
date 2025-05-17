document.addEventListener('DOMContentLoaded', function() {
    // Constantes
    const MAX_STORAGE_GB = 999; // Limite máximo de armazenamento em GB
    const MAX_FILE_SIZE_GB = 29; // Tamanho máximo de arquivo em GB
    const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_GB * 1024 * 1024 * 1024;
    
    // Variáveis de estado
    let selectedFiles = []; // Array para armazenar arquivos selecionados para upload
    let userFiles = []; // Array para armazenar arquivos do usuário
    let totalStorageUsed = 0; // Total de armazenamento usado em bytes
    let currentFilter = 'all'; // Filtro atual da galeria
    let currentPage = 1; // Página atual da galeria
    let itemsPerPage = 12; // Itens por página
    let searchTerm = ''; // Termo de busca
    
    // Elementos DOM
    const dropArea = document.getElementById('drop-area');
    const fileInput = document.getElementById('file-input');
    const fileList = document.getElementById('file-list');
    const uploadBtn = document.getElementById('start-upload');
    const totalSizeElem = document.getElementById('total-size');
    const progressContainer = document.getElementById('progress-container');
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    const uploadPreview = document.getElementById('upload-preview');
    const filesContainer = document.getElementById('files-container');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const paginationContainer = document.getElementById('pagination');
    const storageBar = document.getElementById('storage-bar');
    const usedStorageElem = document.getElementById('used-storage');
    const availableStorageElem = document.getElementById('available-storage');
    const totalFilesElem = document.getElementById('total-files');
    const totalImagesElem = document.getElementById('total-images');
    const totalVideosElem = document.getElementById('total-videos');
    const totalPdfsElem = document.getElementById('total-pdfs');
    const avgSizeElem = document.getElementById('avg-size');
    const storageUsedHeader = document.getElementById('storage-used');
    const fileModal = document.getElementById('file-modal');
    const closeModal = document.querySelector('.close-modal');
    const modalFileContainer = document.getElementById('modal-file-container');
    const fileTitle = document.getElementById('file-title');
    const fileSize = document.getElementById('file-size');
    const fileDate = document.getElementById('file-date');
    const downloadBtn = document.getElementById('download-btn');
    const deleteBtn = document.getElementById('delete-btn');
    const uploadBtnHero = document.getElementById('upload-btn');
    
    // Inicialização
    initEventListeners();
    loadUserFiles();
    updateStorageStats();
    
    // Configurar event listeners
    function initEventListeners() {
        // Event listeners para upload de arquivos
        dropArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropArea.classList.add('highlight');
        });
        
        dropArea.addEventListener('dragleave', () => {
            dropArea.classList.remove('highlight');
        });
        
        dropArea.addEventListener('drop', handleFileDrop);
        dropArea.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', handleFileSelect);
        uploadBtn.addEventListener('click', handleUpload);
        uploadBtnHero.addEventListener('click', scrollToUpload);
        
        // Event listeners para filtros e pesquisa
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentFilter = btn.getAttribute('data-filter');
                currentPage = 1;
                renderFiles();
            });
        });
        
        searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                searchFiles();
            }
        });
        
        searchBtn.addEventListener('click', searchFiles);
        
        // Event listeners para modal
        closeModal.addEventListener('click', () => {
            fileModal.style.display = 'none';
        });
        
        window.addEventListener('click', (e) => {
            if (e.target === fileModal) {
                fileModal.style.display = 'none';
            }
        });
        
        deleteBtn.addEventListener('click', deleteSelectedFile);
        downloadBtn.addEventListener('click', downloadSelectedFile);
    }
    
    function searchFiles() {
        searchTerm = searchInput.value.toLowerCase().trim();
        currentPage = 1;
        renderFiles();
    }
    
    function scrollToUpload() {
        document.getElementById('upload').scrollIntoView({ behavior: 'smooth' });
    }
    
    function handleFileDrop(e) {
        e.preventDefault();
        dropArea.classList.remove('highlight');
        
        if (e.dataTransfer.items) {
            processFiles(e.dataTransfer.files);
        }
    }
    
    function handleFileSelect(e) {
        processFiles(e.target.files);
    }
    
    function processFiles(fileList) {
        for (let file of fileList) {
            // Verificar tipo de arquivo (imagem, vídeo ou PDF)
            if (!file.type.match('image.*') && 
                !file.type.match('video.*') && 
                file.type !== 'application/pdf') {
                showNotification('Somente imagens, vídeos e PDFs são permitidos.', 'error');
                continue;
            }
            
            // Verificar tamanho máximo
            if (file.size > MAX_FILE_SIZE_BYTES) {
                showNotification(`O arquivo ${file.name} excede o limite de ${MAX_FILE_SIZE_GB}GB.`, 'error');
                continue;
            }
            
            // Verificar duplicatas
            if (selectedFiles.some(f => f.name === file.name && f.size === file.size)) {
                showNotification(`O arquivo ${file.name} já foi selecionado.`, 'info');
                continue;
            }
            
            // Adicionar arquivo à lista
            selectedFiles.push(file);
            addFileToList(file);
            addFilePreview(file);
        }
        
        updateTotalSize();
        checkUploadButton();
    }
    
    function getFileType(file) {
        if (file.type.startsWith('image/')) {
            return 'image';
        } else if (file.type.startsWith('video/')) {
            return 'video';
        } else if (file.type === 'application/pdf') {
            return 'pdf';
        }
        return 'unknown';
    }
    
    function getFileIcon(fileType) {
        switch(fileType) {
            case 'image': return 'fa-image';
            case 'video': return 'fa-video';
            case 'pdf': return 'fa-file-pdf';
            default: return 'fa-file';
        }
    }
    
    function addFileToList(file) {
        const listItem = document.createElement('li');
        const fileType = getFileType(file);
        const fileIcon = getFileIcon(fileType);
        const fileSize = formatFileSize(file.size);
        
        listItem.innerHTML = `
            <div class="file-info">
                <div class="file-icon">
                    <i class="fas ${fileIcon}"></i>
                </div>
                <div class="file-details">
                    <h4>${file.name}</h4>
                    <p>${fileSize}</p>
                </div>
            </div>
            <button class="remove-file" data-index="${selectedFiles.length - 1}">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        listItem.querySelector('.remove-file').addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            removeFile(index);
        });
        
        fileList.appendChild(listItem);
    }
    
    function addFilePreview(file) {
        const reader = new FileReader();
        const previewItem = document.createElement('div');
        previewItem.className = 'preview-item';
        const fileType = getFileType(file);
        
        if (fileType === 'image') {
            reader.onload = function(e) {
                const img = document.createElement('img');
                img.src = e.target.result;
                previewItem.appendChild(img);
            };
            reader.readAsDataURL(file);
        } else if (fileType === 'video') {
            reader.onload = function(e) {
                const video = document.createElement('video');
                video.src = e.target.result;
                video.setAttribute('controls', 'true');
                video.setAttribute('muted', 'true');
                video.setAttribute('playsinline', 'true');
                
                // Mostrar thumb do vídeo
                video.addEventListener('loadeddata', function() {
                    video.currentTime = 1;
                });
                
                previewItem.appendChild(video);
            };
            reader.readAsDataURL(file);
        } else if (fileType === 'pdf') {
            // Para PDF, mostrar ícone em vez de prévia
            const pdfIcon = document.createElement('div');
            pdfIcon.innerHTML = '<i class="fas fa-file-pdf"></i><span>PDF</span>';
            pdfIcon.className = 'pdf-preview';
            pdfIcon.style.backgroundColor = 'var(--primary-light)';
            pdfIcon.style.color = 'white';
            pdfIcon.style.display = 'flex';
            pdfIcon.style.flexDirection = 'column';
            pdfIcon.style.alignItems = 'center';
            pdfIcon.style.justifyContent = 'center';
            pdfIcon.style.height = '100%';
            pdfIcon.style.width = '100%';
            pdfIcon.querySelector('i').style.fontSize = '36px';
            pdfIcon.querySelector('span').style.marginTop = '5px';
            
            previewItem.appendChild(pdfIcon);
        }
        
        uploadPreview.appendChild(previewItem);
    }
    
    function removeFile(index) {
        selectedFiles.splice(index, 1);
        updateFileList();
        updateTotalSize();
        checkUploadButton();
    }
    
    function updateFileList() {
        fileList.innerHTML = '';
        uploadPreview.innerHTML = '';
        
        selectedFiles.forEach((file, index) => {
            addFileToList(file);
            addFilePreview(file);
        });
    }
    
    function updateTotalSize() {
        const totalSize = selectedFiles.reduce((sum, file) => sum + file.size, 0);
        totalSizeElem.textContent = formatFileSize(totalSize);
    }
    
    function checkUploadButton() {
        // Verificar espaço disponível
        const pendingUploadSize = selectedFiles.reduce((sum, file) => sum + file.size, 0);
        const totalPotentialSize = totalStorageUsed + pendingUploadSize;
        const maxStorageBytes = MAX_STORAGE_GB * 1024 * 1024 * 1024;
        
        // Habilitar botão se houver arquivos selecionados e espaço suficiente
        uploadBtn.disabled = selectedFiles.length === 0 || totalPotentialSize > maxStorageBytes;
        
        if (pendingUploadSize > 0 && totalPotentialSize > maxStorageBytes) {
            showNotification('Espaço de armazenamento insuficiente.', 'error');
        }
    }
    
    function handleUpload() {
        if (selectedFiles.length === 0) return;
        
        // Mostrar progresso
        progressContainer.classList.remove('hidden');
        uploadBtn.disabled = true;
        
        // Simular upload com backend
        simulateFileUpload();
    }
    
    function simulateFileUpload() {
        let progress = 0;
        const totalFiles = selectedFiles.length;
        let filesUploaded = 0;
        
        const uploadInterval = setInterval(() => {
            progress += 1;
            progressBar.style.width = `${progress}%`;
            progressText.textContent = `${progress}%`;
            
            if (progress >= 100) {
                filesUploaded++;
                
                if (filesUploaded === totalFiles) {
                    clearInterval(uploadInterval);
                    finishUpload();
                } else {
                    progress = 0;
                }
            }
        }, 50);
    }
    
    function finishUpload() {
        // Processar cada arquivo do upload
        const uploadedFiles = selectedFiles.map(file => {
            const fileId = generateUniqueId();
            const fileUrl = URL.createObjectURL(file);
            
            // Em um app real, aqui seria feito o upload para o servidor
            const fileObj = {
                id: fileId,
                name: file.name,
                type: getFileType(file),
                mimeType: file.type,
                size: file.size,
                url: fileUrl,
                path: `/uploads/${fileId}_${file.name}`, // Simulação de caminho no servidor
                dateUploaded: new Date().toISOString()
            };
            
            return fileObj;
        });
        
        // Adicionar à lista de arquivos e salvar
        userFiles = [...userFiles, ...uploadedFiles];
        saveUserFiles();
        
        // Atualizar interface
        renderFiles();
        updateStorageStats();
        
        // Limpar seleção
        selectedFiles = [];
        fileList.innerHTML = '';
        uploadPreview.innerHTML = '';
        totalSizeElem.textContent = '0 MB';
        
        // Esconder progresso
        progressContainer.classList.add('hidden');
        progressBar.style.width = '0%';
        progressText.textContent = '0%';
        uploadBtn.disabled = true;
        
        // Notificação e navegação
        showNotification('Upload concluído com sucesso!', 'success');
        document.getElementById('files').scrollIntoView({ behavior: 'smooth' });
    }
    
    function generateUniqueId() {
        return 'file_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
    }
    
    function loadUserFiles() {
        // Em um app real, isso seria uma chamada AJAX para o backend
        const savedFiles = localStorage.getItem('userFiles');
        if (savedFiles) {
            userFiles = JSON.parse(savedFiles);
            renderFiles();
        } else {
            // Inicializar como array vazio
            userFiles = [];
        }
    }
    
    function saveUserFiles() {
        // Em um app real, isso seria uma chamada AJAX para o backend
        localStorage.setItem('userFiles', JSON.stringify(userFiles));
    }
    
    function renderFiles() {
        filesContainer.innerHTML = '';
        
        // Aplicar filtro e pesquisa
        let filteredFiles = userFiles;
        
        // Aplicar filtro por tipo
        if (currentFilter !== 'all') {
            filteredFiles = filteredFiles.filter(file => file.type === currentFilter);
        }
        
        // Aplicar pesquisa
        if (searchTerm) {
            filteredFiles = filteredFiles.filter(file => 
                file.name.toLowerCase().includes(searchTerm)
            );
        }
        
        // Paginação
        const totalPages = Math.ceil(filteredFiles.length / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const filesToShow = filteredFiles.slice(startIndex, endIndex);
        
        // Renderizar arquivos
        if (filesToShow.length === 0) {
            filesContainer.innerHTML = `
                <div class="empty-files">
                    <i class="fas fa-folder-open"></i>
                    <p>Nenhum arquivo encontrado.</p>
                </div>
            `;
        } else {
            filesToShow.forEach(file => renderFileItem(file));
        }
        
        // Renderizar paginação
        renderPagination(totalPages);
    }
    
    function renderFileItem(file) {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.setAttribute('data-id', file.id);
        
        const previewContainer = document.createElement('div');
        previewContainer.className = `file-item-preview ${file.type}`;
        
        if (file.type === 'image') {
            const img = document.createElement('img');
            img.src = file.url;
            img.alt = file.name;
            previewContainer.appendChild(img);
        } else if (file.type === 'video') {
            const video = document.createElement('video');
            video.src = file.url;
            video.setAttribute('controls', 'true');
            video.setAttribute('muted', 'true');
            video.setAttribute('playsinline', 'true');
            
            // Mostrar primeiro frame
            video.addEventListener('loadeddata', () => {
                video.currentTime = 1;
            });
            
            // Evitar propagação do clique
            video.addEventListener('click', (e) => {
                e.stopPropagation();
            });
            
            previewContainer.appendChild(video);
        } else if (file.type === 'pdf') {
            // Ícone e nome para PDFs
            previewContainer.innerHTML = `
                <i class="fas fa-file-pdf"></i>
                <span>${file.name.length > 20 ? file.name.substring(0, 20) + '...' : file.name}</span>
            `;
        }
        
        const infoContainer = document.createElement('div');
        infoContainer.className = 'file-item-info';
        infoContainer.innerHTML = `
            <h3>${file.name.length > 20 ? file.name.substring(0, 20) + '...' : file.name}</h3>
            <p>${formatFileSize(file.size)} • ${formatDate(file.dateUploaded)}</p>
        `;
        
        fileItem.appendChild(previewContainer);
        fileItem.appendChild(infoContainer);
        
        // Adicionar evento de clique para abrir o modal
        fileItem.addEventListener('click', () => openFileModal(file));
        
        filesContainer.appendChild(fileItem);
    }
    
    function renderPagination(totalPages) {
        paginationContainer.innerHTML = '';
        
        if (totalPages <= 1) return;
        
        // Botão anterior
        if (currentPage > 1) {
            const prevBtn = document.createElement('button');
            prevBtn.className = 'page-btn prev-btn';
            prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
            prevBtn.addEventListener('click', () => {
                currentPage--;
                renderFiles();
            });
            paginationContainer.appendChild(prevBtn);
        }
        
        // Páginas
        const maxPagesToShow = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
        let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
        
        if (endPage - startPage + 1 < maxPagesToShow) {
            startPage = Math.max(1, endPage - maxPagesToShow + 1);
        }
        
        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = `page-btn ${i === currentPage ? 'active' : ''}`;
            pageBtn.textContent = i;
            
            pageBtn.addEventListener('click', () => {
                currentPage = i;
                renderFiles();
            });
            
            paginationContainer.appendChild(pageBtn);
        }
        
        // Botão próximo
        if (currentPage < totalPages) {
            const nextBtn = document.createElement('button');
            nextBtn.className = 'page-btn next-btn';
            nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
            nextBtn.addEventListener('click', () => {
                currentPage++;
                renderFiles();
            });
            paginationContainer.appendChild(nextBtn);
        }
    }
    
    function openFileModal(file) {
        // Limpar container
        modalFileContainer.innerHTML = '';
        
        // Criar elemento baseado no tipo de arquivo
        if (file.type === 'image') {
            const img = document.createElement('img');
            img.src = file.url;
            img.alt = file.name;
            modalFileContainer.appendChild(img);
        } else if (file.type === 'video') {
            const video = document.createElement('video');
            video.src = file.url;
            video.setAttribute('controls', 'true');
            modalFileContainer.appendChild(video);
        } else if (file.type === 'pdf') {
            // Usar iframe para PDFs
            const iframe = document.createElement('iframe');
            iframe.src = file.url;
            iframe.style.width = '100%';
            iframe.style.height = '70vh';
            iframe.style.border = 'none';
            modalFileContainer.appendChild(iframe);
        }
        
        // Atualizar informações
        fileTitle.textContent = file.name;
        fileSize.textContent = formatFileSize(file.size);
        fileDate.textContent = formatDate(file.dateUploaded);
        
        // Configurar botões com ID do arquivo
        downloadBtn.setAttribute('data-id', file.id);
        deleteBtn.setAttribute('data-id', file.id);
        
        // Mostrar modal
        fileModal.style.display = 'block';
    }
    
    function downloadSelectedFile() {
        const fileId = this.getAttribute('data-id');
        const file = userFiles.find(f => f.id === fileId);
        
        if (file) {
            const a = document.createElement('a');
            a.href = file.url;
            a.download = file.name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
    }
    
    function deleteSelectedFile() {
        const fileId = this.getAttribute('data-id');
        
        // Remover arquivo da lista
        userFiles = userFiles.filter(file => file.id !== fileId);
        
        // Salvar mudanças
        saveUserFiles();
        
        // Atualizar interface
        fileModal.style.display = 'none';
        renderFiles();
        updateStorageStats();
        
        showNotification('Arquivo excluído com sucesso.', 'success');
    }
    
    function updateStorageStats() {
        // Calcular espaço usado
        totalStorageUsed = userFiles.reduce((sum, file) => sum + file.size, 0);
        
        // Converter para GB
        const usedGB = (totalStorageUsed / (1024 * 1024 * 1024)).toFixed(2);
        const availableGB = (MAX_STORAGE_GB - usedGB).toFixed(2);
        const usagePercentage = (usedGB / MAX_STORAGE_GB) * 100;
        
        // Atualizar elementos na interface
        storageBar.style.width = `${usagePercentage}%`;
        usedStorageElem.textContent = `${usedGB} GB`;
        availableStorageElem.textContent = `${availableGB} GB`;
        storageUsedHeader.textContent = `${usedGB} GB`;
        
        // Contagens por tipo
        const totalFiles = userFiles.length;
        const totalImages = userFiles.filter(file => file.type === 'image').length;
        const totalVideos = userFiles.filter(file => file.type === 'video').length;
        const totalPdfs = userFiles.filter(file => file.type === 'pdf').length;
        
        // Tamanho médio
        const avgSize = totalFiles > 0 ? totalStorageUsed / totalFiles : 0;
        
        // Atualizar elementos de estatísticas
        totalFilesElem.textContent = totalFiles;
        totalImagesElem.textContent = totalImages;
        totalVideosElem.textContent = totalVideos;
        totalPdfsElem.textContent = totalPdfs;
        avgSizeElem.textContent = formatFileSize(avgSize);
    }
    
    // Utilidades
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        
        return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    }
    
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
});