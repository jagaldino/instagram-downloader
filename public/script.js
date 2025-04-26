document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('download-form');
    const urlInput = document.getElementById('instagram-url');
    const downloadBtn = document.getElementById('download-btn');
    const loadingElement = document.getElementById('loading');
    const errorMessage = document.getElementById('error-message');
    const previewContainer = document.getElementById('preview-container');
    const mediaPreview = document.getElementById('media-preview');
    const downloadLink = document.getElementById('download-link');
    
    // Contador para limitar requisições
    let requestCount = 0;
    const MAX_REQUESTS = 10; // Limite de requisições por sessão
    
    // Função para validar URL do Instagram
    function isValidInstagramUrl(url) {
        const regex = /^https?:\/\/(www\.)?instagram\.com\/(p|reel|stories)\/[^\/]+\/?/;
        return regex.test(url);
    }
    
    // Função para mostrar mensagem de erro
    function showError(message) {
        hideAllSections();
        errorMessage.textContent = message || 'Ocorreu um erro. Verifique se o URL é válido e tente novamente.';
        errorMessage.classList.remove('hidden');
    }
    
    // Função para esconder todas as seções
    function hideAllSections() {
        loadingElement.classList.add('hidden');
        errorMessage.classList.add('hidden');
        previewContainer.classList.add('hidden');
    }
    
    // Função para mostrar o carregamento
    function showLoading() {
        hideAllSections();
        loadingElement.classList.remove('hidden');
    }
    
    // Função para mostrar a prévia
    function showPreview(mediaData) {
        hideAllSections();
        
        // Limpar prévia anterior
        mediaPreview.innerHTML = '';
        
        // Criar elemento baseado no tipo de mídia
        let mediaElement;
        
        if (mediaData.type === 'image') {
            mediaElement = document.createElement('img');
            mediaElement.src = mediaData.url;
            mediaElement.alt = 'Prévia da imagem do Instagram';
        } else if (mediaData.type === 'video') {
            mediaElement = document.createElement('video');
            mediaElement.src = mediaData.url;
            mediaElement.controls = true;
            mediaElement.autoplay = false;
            mediaElement.muted = true;
            mediaElement.loop = false;
        } else {
            return showError('Tipo de mídia não suportado');
        }
        
        // Adicionar elemento à prévia
        mediaPreview.appendChild(mediaElement);
        
        // Configurar link de download
        downloadLink.href = mediaData.url;
        downloadLink.download = mediaData.filename || 'instagram-media';
        
        // Mostrar container de prévia
        previewContainer.classList.remove('hidden');
    }
    
    // Função para processar o URL do Instagram
    async function processInstagramUrl(url) {
        if (requestCount >= MAX_REQUESTS) {
            return showError('Você atingiu o limite de downloads. Tente novamente mais tarde.');
        }
        
        requestCount++;
        showLoading();
        
        try {
            // Fazer requisição para a API serverless
            const response = await fetch('/api/download', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ url })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erro ao processar o URL');
            }
            
            const data = await response.json();
            
            if (!data.url) {
                throw new Error('Não foi possível obter a mídia');
            }
            
            showPreview({
                type: data.type,
                url: data.url,
                filename: data.filename
            });
            
        } catch (error) {
            console.error('Erro:', error);
            showError(error.message);
        }
    }
    
    // Event listener para o formulário
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const url = urlInput.value.trim();
        
        if (!url) {
            return showError('Por favor, insira um URL do Instagram');
        }
        
        if (!isValidInstagramUrl(url)) {
            return showError('Por favor, insira um URL válido do Instagram');
        }
        
        processInstagramUrl(url);
    });
    
    // Limpar mensagens de erro quando o usuário começa a digitar
    urlInput.addEventListener('input', () => {
        if (!urlInput.value.trim()) {
            hideAllSections();
        } else if (errorMessage.classList.contains('hidden') === false) {
            errorMessage.classList.add('hidden');
        }
    });
});
