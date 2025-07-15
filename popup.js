class GoogleMapsExtractor {
    constructor() {
        this.extractedData = [];
        this.isExtracting = false;
        this.initializeElements();
        this.setupEventListeners();
        this.loadStoredData();
    }

    initializeElements() {
        this.elements = {
            status: document.getElementById('status'),
            progressBar: document.getElementById('progressBar'),
            dataCount: document.getElementById('dataCount'),
            startBtn: document.getElementById('startExtraction'),
            downloadBtn: document.getElementById('downloadExcel'),
            clearBtn: document.getElementById('clearData')
        };
    }

    setupEventListeners() {
        this.elements.startBtn.addEventListener('click', () => this.startExtraction());
        this.elements.downloadBtn.addEventListener('click', () => this.downloadExcel());
        this.elements.clearBtn.addEventListener('click', () => this.clearData());
    }

    async loadStoredData() {
        try {
            const result = await chrome.storage.local.get(['extractedData']);
            if (result.extractedData) {
                this.extractedData = result.extractedData;
                this.updateUI();
            }
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        }
    }

    async saveData() {
        try {
            await chrome.storage.local.set({ extractedData: this.extractedData });
        } catch (error) {
            console.error('Erro ao salvar dados:', error);
        }
    }

    updateStatus(message, type = 'normal') {
        this.elements.status.textContent = message;
        this.elements.status.className = `status ${type}`;
    }

    updateProgress(progress) {
        this.elements.progressBar.style.width = `${progress}%`;
    }

    updateDataCount() {
        this.elements.dataCount.textContent = this.extractedData.length;
        this.elements.downloadBtn.disabled = this.extractedData.length === 0;
    }

    updateUI() {
        this.updateDataCount();
        if (this.extractedData.length > 0) {
            this.updateStatus(`${this.extractedData.length} locais extraídos`, 'success');
            this.updateProgress(100);
        }
    }

    async startExtraction() {
        if (this.isExtracting) return;

        try {
            // Verificar se estamos no Google Maps
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!tab.url.includes('maps.google.com')) {
                this.updateStatus('Por favor, vá para o Google Maps primeiro', 'error');
                return;
            }

            this.isExtracting = true;
            this.elements.startBtn.disabled = true;
            this.updateStatus('Iniciando extração...', 'warning');
            this.updateProgress(0);

            // Injetar script de extração
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: this.extractDataFromPage
            });

            // Escutar dados extraídos
            this.listenForExtractedData();

        } catch (error) {
            console.error('Erro na extração:', error);
            this.updateStatus('Erro ao iniciar extração', 'error');
            this.isExtracting = false;
            this.elements.startBtn.disabled = false;
        }
    }

    listenForExtractedData() {
        const messageListener = (message, sender, sendResponse) => {
            if (message.action === 'dataExtracted') {
                this.handleExtractedData(message.data);
            } else if (message.action === 'extractionProgress') {
                this.updateProgress(message.progress);
                this.updateStatus(`Extraindo... ${message.current}/${message.total}`, 'warning');
            } else if (message.action === 'extractionComplete') {
                this.handleExtractionComplete();
            }
        };

        chrome.runtime.onMessage.addListener(messageListener);

        // Remover listener após 5 minutos
        setTimeout(() => {
            chrome.runtime.onMessage.removeListener(messageListener);
            if (this.isExtracting) {
                this.handleExtractionComplete();
            }
        }, 300000);
    }

    handleExtractedData(newData) {
        // Evitar duplicatas baseado no nome e endereço
        newData.forEach(item => {
            const exists = this.extractedData.some(existing => 
                existing.nome === item.nome && existing.endereco === item.endereco
            );
            if (!exists) {
                this.extractedData.push(item);
            }
        });

        this.updateDataCount();
        this.saveData();
    }

    handleExtractionComplete() {
        this.isExtracting = false;
        this.elements.startBtn.disabled = false;
        this.updateProgress(100);
        
        if (this.extractedData.length > 0) {
            this.updateStatus(`Extração concluída! ${this.extractedData.length} locais encontrados`, 'success');
        } else {
            this.updateStatus('Nenhum dado encontrado', 'warning');
        }
    }

    extractDataFromPage() {
        // Esta função será injetada na página
        let extractedItems = [];
        let currentIndex = 0;

        function extractVisibleData() {
            const results = [];
            
            // Selecionar elementos de resultado do Maps
            const placeElements = document.querySelectorAll('[data-result-index], [jsaction*="pane"], .Nv2PK, [role="article"]');
            
            placeElements.forEach((element, index) => {
                try {
                    const data = extractPlaceData(element);
                    if (data && data.nome) {
                        results.push(data);
                    }
                } catch (error) {
                    console.error('Erro ao extrair dados do elemento:', error);
                }
            });

            return results;
        }

        function extractPlaceData(element) {
            const data = {};

            // Nome do local
            const nameElement = element.querySelector('[class*="fontHeadlineSmall"], .qBF1Pd, .DUwDvf, h3, [class*="title"]');
            data.nome = nameElement ? nameElement.textContent.trim() : '';

            // Rating
            const ratingElement = element.querySelector('[class*="MW4etd"], .yi40Hd, [aria-label*="star"]');
            data.rating = ratingElement ? ratingElement.textContent.trim() : '';

            // Número de avaliações
            const reviewsElement = element.querySelector('[class*="UY7F9"], .RDApEe');
            data.avaliacoes = reviewsElement ? reviewsElement.textContent.trim() : '';

            // Endereço
            const addressElement = element.querySelector('[class*="W4Efsd"], .W4Efsd, [data-value="Address"]');
            data.endereco = addressElement ? addressElement.textContent.trim() : '';

            // Telefone
            const phoneElement = element.querySelector('[data-value="Phone"], [aria-label*="phone"], [class*="phone"]');
            data.telefone = phoneElement ? phoneElement.textContent.trim() : '';

            // Website
            const websiteElement = element.querySelector('[data-value="Website"], a[href*="http"]');
            data.website = websiteElement ? websiteElement.href : '';

            // Categoria
            const categoryElement = element.querySelector('[class*="W4Efsd"]:nth-of-type(2), .W4Efsd:not([data-value="Address"])');
            data.categoria = categoryElement ? categoryElement.textContent.trim() : '';

            // Horário
            const hoursElement = element.querySelector('[data-value="Open hours"], [class*="ZDu9vd"]');
            data.horario = hoursElement ? hoursElement.textContent.trim() : '';

            return data;
        }

        function scrollAndExtract() {
            const newData = extractVisibleData();
            
            if (newData.length > 0) {
                // Enviar dados para a extensão
                chrome.runtime.sendMessage({
                    action: 'dataExtracted',
                    data: newData
                });

                currentIndex += newData.length;
                
                chrome.runtime.sendMessage({
                    action: 'extractionProgress',
                    current: currentIndex,
                    total: currentIndex + 20,
                    progress: Math.min((currentIndex / (currentIndex + 20)) * 100, 90)
                });
            }

            // Tentar rolar para baixo para carregar mais resultados
            const scrollContainer = document.querySelector('[role="main"], .m6QErb, .siAUzd');
            if (scrollContainer) {
                scrollContainer.scrollBy(0, 1000);
                
                // Aguardar carregamento e continuar
                setTimeout(() => {
                    const moreResults = extractVisibleData();
                    if (moreResults.length > newData.length) {
                        scrollAndExtract();
                    } else {
                        // Finalizar extração
                        chrome.runtime.sendMessage({
                            action: 'extractionComplete'
                        });
                    }
                }, 2000);
            } else {
                chrome.runtime.sendMessage({
                    action: 'extractionComplete'
                });
            }
        }

        // Iniciar extração
        setTimeout(scrollAndExtract, 1000);
    }

    downloadExcel() {
        if (this.extractedData.length === 0) {
            this.updateStatus('Nenhum dado para baixar', 'error');
            return;
        }

        try {
            // Criar conteúdo CSV (que pode ser aberto no Excel)
            const headers = ['Nome', 'Rating', 'Avaliações', 'Endereço', 'Telefone', 'Website', 'Categoria', 'Horário'];
            let csvContent = headers.join(',') + '\n';

            this.extractedData.forEach(item => {
                const row = [
                    this.escapeCsv(item.nome || ''),
                    this.escapeCsv(item.rating || ''),
                    this.escapeCsv(item.avaliacoes || ''),
                    this.escapeCsv(item.endereco || ''),
                    this.escapeCsv(item.telefone || ''),
                    this.escapeCsv(item.website || ''),
                    this.escapeCsv(item.categoria || ''),
                    this.escapeCsv(item.horario || '')
                ];
                csvContent += row.join(',') + '\n';
            });

            // Criar e baixar arquivo
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            
            link.setAttribute('href', url);
            link.setAttribute('download', `google_maps_dados_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            this.updateStatus('Download concluído!', 'success');

        } catch (error) {
            console.error('Erro no download:', error);
            this.updateStatus('Erro ao baixar arquivo', 'error');
        }
    }

    escapeCsv(str) {
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    }

    async clearData() {
        this.extractedData = [];
        await chrome.storage.local.clear();
        this.updateUI();
        this.updateStatus('Dados limpos', 'success');
        this.updateProgress(0);
    }
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    new GoogleMapsExtractor();
});