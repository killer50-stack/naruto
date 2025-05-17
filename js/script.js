document.addEventListener('DOMContentLoaded', function() {
    // Variáveis globais
    const MAX_STORAGE_GB = 900; // Limite máximo de armazenamento em GB
    const MAX_FILE_SIZE_GB = 3; // Tamanho máximo de arquivo em GB
    const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_GB * 1024 * 1024 * 1024;
    let selectedFiles = []; // Array para armazenar arquivos selecionados
    let totalStorageUsed = 0; // Armazenamento total usado em bytes
    let mediaItems = []; // Array para armazenar itens da mídia

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
    const galleryContainer = document.getElementById('gallery-container');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const storageBar = document.getElementById('storage-bar');
    const usedStorageElem = document.getElementById('used-storage');
    const availableStorageElem = document.getElementById('available-storage');
    const totalFilesElem = document.getElementById('total-files');
    const totalImagesElem = document.getElementById('total-images');
    const totalVideosElem = document.getElementById('total-videos');
    const avgSizeElem = document.getElementById('avg-size');
    const storageUsedHeader = document.getElementById('storage-used');
    const mediaModal = document.getElementById('media-modal');
    const closeModal = document.querySelector('.close-modal');
    const modalMediaContainer = document.getElementById('modal-media-container');
    const mediaTitle = document.getElementById('media-title');
    const mediaSize = document.getElementById('media-size');
    const mediaDate = document.getElementById('media-date');
    const downloadBtn = document.getElementById('download-btn');
    const deleteBtn = document.getElementById('delete-btn');
    const uploadBtnHero = document.getElementById('upload-btn');

    // Funções de inicialização
    initEventListeners();
    loadExistingMedia();
    updateStorageStats();

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

        // Event listeners para filtros de galeria
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                filterGallery(btn.getAttribute('data-filter'));
            });
        });

        // Event listeners para modal
        closeModal.addEventListener('click', () => {
            mediaModal.style.display = 'none';
        });

        window.addEventListener('click', (e) => {
            if (e.target === mediaModal) {
                mediaModal.style.display = 'none';
            }
        });

        deleteBtn.addEventListener('click', deleteSelectedMedia);
        downloadBtn.addEventListener('click', downloadSelectedMedia);
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
            // Verificar se o arquivo é mídia (imagem ou vídeo)
            if (!file.type.match('image.*') && !file.type.match('video.*')) {
                showNotification('Somente arquivos de imagem e vídeo são permitidos.', 'error');
                continue;
            }

            // Verificar tamanho do arquivo
            if (file.size > MAX_FILE_SIZE_BYTES) {
                showNotification(`O arquivo ${file.name} excede o limite de ${MAX_FILE_SIZE_GB}GB.`, 'error');
                continue;
            }

            // Verificar se o arquivo já foi selecionado
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

    function addFileToList(file) {
        const listItem = document.createElement('li');
        const fileType = file.type.startsWith('image/') ? 'image' : 'video';
        const fileIcon = fileType === 'image' ? 'fa-image' : 'fa-video';
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

        // Adicionar event listener para remover arquivo
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

        reader.onload = function(e) {
            if (file.type.startsWith('image/')) {
                const img = document.createElement('img');
                img.src = e.target.result;
                previewItem.appendChild(img);
            } else if (file.type.startsWith('video/')) {
                const video = document.createElement('video');
                video.src = e.target.result;
                video.setAttribute('controls', 'true');
                video.setAttribute('muted', 'true');
                video.setAttribute('playsinline', 'true');
                previewItem.appendChild(video);
                
                // Mostrar uma thumb do vídeo
                video.addEventListener('loadeddata', function() {
                    video.currentTime = 1;
                });
                
                video.addEventListener('seeked', function() {
                    // Não reproduzir automaticamente, apenas mostrar o frame
                });
            }
        };

        reader.readAsDataURL(file);
        uploadPreview.appendChild(previewItem);
    }

    function removeFile(index) {
        selectedFiles.splice(index, 1);
        updateFileList();
        updateTotalSize();
        checkUploadButton();
    }

    function updateFileList() {
        // Limpar lista e preview
        fileList.innerHTML = '';
        uploadPreview.innerHTML = '';

        // Readicionar arquivos à lista
        selectedFiles.forEach((file, index) => {
            const listItem = document.createElement('li');
            const fileType = file.type.startsWith('image/') ? 'image' : 'video';
            const fileIcon = fileType === 'image' ? 'fa-image' : 'fa-video';
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
                <button class="remove-file" data-index="${index}">
                    <i class="fas fa-times"></i>
                </button>
            `;

            listItem.querySelector('.remove-file').addEventListener('click', function() {
                const idx = parseInt(this.getAttribute('data-index'));
                removeFile(idx);
            });

            fileList.appendChild(listItem);
            addFilePreview(file);
        });
    }

    function updateTotalSize() {
        let totalSize = 0;
        selectedFiles.forEach(file => {
            totalSize += file.size;
        });
        
        totalSizeElem.textContent = formatFileSize(totalSize);
    }

    function checkUploadButton() {
        // Calcular espaço total que seria usado após o upload
        const potentialTotalSize = calculateTotalStorageUsed() + selectedFiles.reduce((total, file) => total + file.size, 0);
        const maxStorageBytes = MAX_STORAGE_GB * 1024 * 1024 * 1024;

        // Habilitar botão se houver arquivos selecionados e espaço suficiente
        uploadBtn.disabled = selectedFiles.length === 0 || potentialTotalSize > maxStorageBytes;

        // Mostrar aviso se não houver espaço suficiente
        if (potentialTotalSize > maxStorageBytes) {
            showNotification('Espaço de armazenamento insuficiente para completar o upload.', 'error');
        }
    }

    function handleUpload() {
        if (selectedFiles.length === 0) return;

        // Mostrar container de progresso
        progressContainer.classList.remove('hidden');
        
        // Desabilitar botão de upload durante o processo
        uploadBtn.disabled = true;

        // Simular upload com progresso
        let progress = 0;
        const totalFiles = selectedFiles.length;
        let filesUploaded = 0;

        const uploadInterval = setInterval(() => {
            progress += 1;
            progressBar.style.width = `${progress}%`;
            progressText.textContent = `${progress}%`;

            if (progress >= 100) {
                filesUploaded++;
                
                // Se todos os arquivos foram "enviados"
                if (filesUploaded === totalFiles) {
                    clearInterval(uploadInterval);
                    completeUpload();
                } else {
                    // Resetar para próximo arquivo
                    progress = 0;
                }
            }
        }, 50); // Ajustar velocidade de simulação conforme necessário
    }

    function completeUpload() {
        // Processar arquivos enviados
        selectedFiles.forEach(file => {
            // Em uma aplicação real, aqui você salvaria os arquivos no servidor
            // e receberia URLs ou IDs como resposta
            
            // Simular upload bem-sucedido
            const fileId = 'file_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
            const fileUrl = URL.createObjectURL(file);
            
            // Criar objeto de mídia
            const mediaItem = {
                id: fileId,
                name: file.name,
                type: file.type.startsWith('image/') ? 'image' : 'video',
                size: file.size,
                url: fileUrl, // Em uma aplicação real, seria a URL do servidor
                date: new Date().toISOString()
            };
            
            // Adicionar à lista de mídia
            mediaItems.push(mediaItem);
            
            // Salvar no armazenamento local (simulação)
            saveMediaToStorage();
        });

        // Atualizar galeria e estatísticas
        renderGallery();
        updateStorageStats();
        
        // Resetar interface de upload
        selectedFiles = [];
        fileList.innerHTML = '';
        uploadPreview.innerHTML = '';
        totalSizeElem.textContent = '0 MB';
        progressContainer.classList.add('hidden');
        progressBar.style.width = '0%';
        progressText.textContent = '0%';
        
        // Re-habilitar botão de upload
        uploadBtn.disabled = true;
        
        // Mostrar notificação de sucesso
        showNotification('Upload concluído com sucesso!', 'success');
        
        // Rolar para a galeria
        document.getElementById('galeria').scrollIntoView({ behavior: 'smooth' });
    }

    function loadExistingMedia() {
        // Em uma aplicação real, isso faria uma requisição ao servidor
        // Para esta demo, usaremos localStorage
        const savedMedia = localStorage.getItem('mediaItems');
        if (savedMedia) {
            mediaItems = JSON.parse(savedMedia);
            renderGallery();
        }
    }

    function saveMediaToStorage() {
        // Em uma aplicação real, isso salvaria no servidor
        localStorage.setItem('mediaItems', JSON.stringify(mediaItems));
    }

    function renderGallery(filter = 'all') {
        galleryContainer.innerHTML = '';
        
        const filteredItems = filter === 'all' 
            ? mediaItems 
            : mediaItems.filter(item => item.type === filter);
        
        filteredItems.forEach(item => {
            const galleryItem = document.createElement('div');
            galleryItem.className = 'gallery-item';
            galleryItem.setAttribute('data-id', item.id);
            
            const mediaContainer = document.createElement('div');
            mediaContainer.className = 'gallery-item-media';
            
            if (item.type === 'image') {
                const img = document.createElement('img');
                img.src = item.url;
                img.alt = item.name;
                mediaContainer.appendChild(img);
                
                // Adicionar evento de clique para abrir o modal apenas nas imagens
                img.addEventListener('click', (e) => {
                    e.stopPropagation();
                    openMediaModal(item);
                });
            } else {
                const video = document.createElement('video');
                video.src = item.url;
                video.setAttribute('controls', 'true');
                video.setAttribute('muted', 'true');
                video.setAttribute('playsinline', 'true');
                // Mostrar o primeiro frame
                video.addEventListener('loadeddata', () => {
                    video.currentTime = 1;
                });
                mediaContainer.appendChild(video);
                
                // Prevenir que o clique no vídeo propague para o container
                video.addEventListener('click', (e) => {
                    e.stopPropagation();
                });
            }
            
            const infoContainer = document.createElement('div');
            infoContainer.className = 'gallery-item-info';
            infoContainer.innerHTML = `
                <h3>${item.name.length > 20 ? item.name.substring(0, 20) + '...' : item.name}</h3>
                <p>${formatFileSize(item.size)} • ${formatDate(item.date)}</p>
            `;
            
            galleryItem.appendChild(mediaContainer);
            galleryItem.appendChild(infoContainer);
            
            // Adicionar evento de clique para abrir o modal no item inteiro
            galleryItem.addEventListener('click', () => openMediaModal(item));
            
            galleryContainer.appendChild(galleryItem);
        });
        
        if (filteredItems.length === 0) {
            galleryContainer.innerHTML = `
                <div class="empty-gallery">
                    <p>Nenhuma mídia encontrada.</p>
                </div>
            `;
        }
    }

    function filterGallery(filter) {
        renderGallery(filter);
    }

    function openMediaModal(item) {
        // Limpar conteúdo anterior
        modalMediaContainer.innerHTML = '';
        
        // Adicionar mídia ao modal
        if (item.type === 'image') {
            const img = document.createElement('img');
            img.src = item.url;
            img.alt = item.name;
            modalMediaContainer.appendChild(img);
        } else {
            const video = document.createElement('video');
            video.src = item.url;
            video.setAttribute('controls', 'true');
            modalMediaContainer.appendChild(video);
        }
        
        // Atualizar informações da mídia
        mediaTitle.textContent = item.name;
        mediaSize.textContent = formatFileSize(item.size);
        mediaDate.textContent = formatDate(item.date);
        
        // Armazenar ID do item selecionado nos botões
        downloadBtn.setAttribute('data-id', item.id);
        deleteBtn.setAttribute('data-id', item.id);
        
        // Exibir modal
        mediaModal.style.display = 'block';
    }

    function downloadSelectedMedia() {
        const mediaId = this.getAttribute('data-id');
        const item = mediaItems.find(m => m.id === mediaId);
        
        if (item) {
            // Criar um link de download
            const a = document.createElement('a');
            a.href = item.url;
            a.download = item.name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
    }

    function deleteSelectedMedia() {
        const mediaId = this.getAttribute('data-id');
        
        // Remover o item do array
        mediaItems = mediaItems.filter(item => item.id !== mediaId);
        
        // Salvar alterações
        saveMediaToStorage();
        
        // Atualizar interface
        renderGallery(document.querySelector('.filter-btn.active').getAttribute('data-filter'));
        updateStorageStats();
        
        // Fechar modal
        mediaModal.style.display = 'none';
        
        // Mostrar notificação
        showNotification('Arquivo excluído com sucesso!', 'success');
    }

    function updateStorageStats() {
        const totalUsedBytes = calculateTotalStorageUsed();
        const totalUsedGB = (totalUsedBytes / (1024 * 1024 * 1024)).toFixed(2);
        const availableGB = (MAX_STORAGE_GB - totalUsedGB).toFixed(2);
        
        // Porcentagem de uso
        const usagePercentage = (totalUsedGB / MAX_STORAGE_GB) * 100;
        
        // Atualizar barra de progresso
        storageBar.style.width = `${usagePercentage}%`;
        
        // Atualizar textos
        usedStorageElem.textContent = `${totalUsedGB} GB`;
        availableStorageElem.textContent = `${availableGB} GB`;
        storageUsedHeader.textContent = `${totalUsedGB} GB`;
        
        // Estatísticas de arquivos
        const totalFiles = mediaItems.length;
        const totalImages = mediaItems.filter(item => item.type === 'image').length;
        const totalVideos = mediaItems.filter(item => item.type === 'video').length;
        
        // Tamanho médio
        const avgSizeBytes = totalFiles > 0 ? totalUsedBytes / totalFiles : 0;
        
        totalFilesElem.textContent = totalFiles;
        totalImagesElem.textContent = totalImages;
        totalVideosElem.textContent = totalVideos;
        avgSizeElem.textContent = formatFileSize(avgSizeBytes);
    }

    function calculateTotalStorageUsed() {
        return mediaItems.reduce((total, item) => total + item.size, 0);
    }

    // Funções utilitárias
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    }

    function showNotification(message, type = 'info') {
        // Criar elemento de notificação
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // Adicionar ao DOM
        document.body.appendChild(notification);
        
        // Mostrar com fade-in
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Remover após alguns segundos
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
    
    // Adicionar CSS para notificações
    const notificationStyles = document.createElement('style');
    notificationStyles.textContent = `
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 5px;
            color: white;
            opacity: 0;
            transform: translateY(-20px);
            transition: all 0.3s;
            z-index: 5000;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        }
        
        .notification.show {
            opacity: 1;
            transform: translateY(0);
        }
        
        .notification.success {
            background-color: var(--success-color);
        }
        
        .notification.error {
            background-color: var(--danger-color);
        }
        
        .notification.info {
            background-color: var(--primary-color);
        }
    `;
    
    document.head.appendChild(notificationStyles);
}); 