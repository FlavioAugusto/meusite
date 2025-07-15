// Content Script para Google Maps Data Extractor
class GoogleMapsDataExtractor {
    constructor() {
        this.isExtracting = false;
        this.extractedData = [];
        this.setupMessageListener();
    }

    setupMessageListener() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.action === 'startExtraction') {
                this.startExtraction();
                sendResponse({ success: true });
            }
            return true;
        });
    }

    async startExtraction() {
        if (this.isExtracting) return;
        
        this.isExtracting = true;
        console.log('Iniciando extração de dados do Google Maps...');

        try {
            // Aguardar página carregar completamente
            await this.waitForPageLoad();
            
            // Extrair dados visíveis
            await this.extractVisibleData();
            
            // Tentar carregar mais resultados rolando
            await this.scrollAndExtractMore();
            
        } catch (error) {
            console.error('Erro durante extração:', error);
        } finally {
            this.isExtracting = false;
            this.sendMessage('extractionComplete', { totalExtracted: this.extractedData.length });
        }
    }

    async waitForPageLoad() {
        return new Promise((resolve) => {
            const checkLoad = () => {
                if (document.readyState === 'complete' && 
                    document.querySelector('[role="main"], .m6QErb, .siAUzd')) {
                    resolve();
                } else {
                    setTimeout(checkLoad, 500);
                }
            };
            checkLoad();
        });
    }

    async extractVisibleData() {
        const places = this.findPlaceElements();
        const extractedPlaces = [];

        for (let i = 0; i < places.length; i++) {
            try {
                const placeData = this.extractPlaceData(places[i]);
                if (placeData && placeData.nome) {
                    extractedPlaces.push(placeData);
                }
            } catch (error) {
                console.error('Erro ao extrair dados do local:', error);
            }

            // Enviar progresso
            this.sendMessage('extractionProgress', {
                current: i + 1,
                total: places.length,
                progress: ((i + 1) / places.length) * 50 // 50% para dados visíveis
            });
        }

        if (extractedPlaces.length > 0) {
            this.extractedData.push(...extractedPlaces);
            this.sendMessage('dataExtracted', extractedPlaces);
        }

        return extractedPlaces;
    }

    findPlaceElements() {
        // Múltiplos seletores para diferentes layouts do Google Maps
        const selectors = [
            '[data-result-index]',
            '[jsaction*="pane"] [role="article"]',
            '.Nv2PK',
            '[role="article"]',
            '.lI9IFe',
            '.bfdHYd',
            '[class*="THOPZb"]'
        ];

        let elements = [];
        
        for (const selector of selectors) {
            const found = document.querySelectorAll(selector);
            if (found.length > 0) {
                elements = Array.from(found);
                break;
            }
        }

        // Filtrar elementos válidos
        return elements.filter(el => {
            const text = el.textContent.trim();
            return text.length > 10 && !text.includes('Anúncio');
        });
    }

    extractPlaceData(element) {
        const data = {
            nome: '',
            rating: '',
            avaliacoes: '',
            endereco: '',
            telefone: '',
            website: '',
            categoria: '',
            horario: '',
            preco: ''
        };

        try {
            // Nome do estabelecimento
            data.nome = this.extractText(element, [
                '[class*="fontHeadlineSmall"]',
                '.qBF1Pd',
                '.DUwDvf',
                'h3',
                '[class*="title"]',
                '[aria-label]'
            ]);

            // Rating
            data.rating = this.extractText(element, [
                '[class*="MW4etd"]',
                '.yi40Hd',
                '[aria-label*="star"]',
                '[class*="rating"]'
            ]);

            // Número de avaliações
            data.avaliacoes = this.extractText(element, [
                '[class*="UY7F9"]',
                '.RDApEe',
                '[class*="review"]'
            ]);

            // Endereço
            data.endereco = this.extractText(element, [
                '[data-value="Address"]',
                '[class*="W4Efsd"]:nth-child(2)',
                '.W4Efsd',
                '[class*="address"]'
            ]);

            // Telefone
            data.telefone = this.extractText(element, [
                '[data-value="Phone"]',
                '[aria-label*="phone"]',
                '[href^="tel:"]',
                '[class*="phone"]'
            ]);

            // Website
            const websiteElement = element.querySelector('[data-value="Website"], a[href*="http"]:not([href*="maps.google"]), [class*="website"]');
            if (websiteElement) {
                data.website = websiteElement.href || websiteElement.textContent.trim();
            }

            // Categoria/Tipo
            data.categoria = this.extractText(element, [
                '[class*="W4Efsd"]:first-child',
                '[data-value="Category"]',
                '[class*="category"]'
            ]);

            // Horário de funcionamento
            data.horario = this.extractText(element, [
                '[data-value="Open hours"]',
                '[class*="ZDu9vd"]',
                '[class*="hours"]',
                '[class*="open"]'
            ]);

            // Faixa de preço
            data.preco = this.extractText(element, [
                '[aria-label*="Price"]',
                '[class*="price"]',
                '[data-value="Price"]'
            ]);

        } catch (error) {
            console.error('Erro ao extrair dados:', error);
        }

        return data;
    }

    extractText(element, selectors) {
        for (const selector of selectors) {
            const el = element.querySelector(selector);
            if (el && el.textContent.trim()) {
                return el.textContent.trim();
            }
        }
        return '';
    }

    async scrollAndExtractMore() {
        const scrollContainer = this.findScrollContainer();
        if (!scrollContainer) return;

        const maxScrollAttempts = 10;
        let scrollAttempts = 0;
        let lastDataCount = this.extractedData.length;

        while (scrollAttempts < maxScrollAttempts) {
            // Rolar para baixo
            scrollContainer.scrollBy(0, 800);
            
            // Aguardar carregamento
            await this.sleep(2000);

            // Extrair novos dados
            const newData = await this.extractVisibleData();
            
            // Verificar se encontrou novos dados
            if (this.extractedData.length === lastDataCount) {
                scrollAttempts++;
            } else {
                scrollAttempts = 0; // Reset se encontrou novos dados
                lastDataCount = this.extractedData.length;
            }

            // Enviar progresso
            this.sendMessage('extractionProgress', {
                current: this.extractedData.length,
                total: this.extractedData.length + 10,
                progress: 50 + (scrollAttempts / maxScrollAttempts) * 50
            });
        }
    }

    findScrollContainer() {
        const selectors = [
            '[role="main"]',
            '.m6QErb',
            '.siAUzd',
            '[class*="scrollable"]',
            '.maps-searchbox-results'
        ];

        for (const selector of selectors) {
            const container = document.querySelector(selector);
            if (container && container.scrollHeight > container.clientHeight) {
                return container;
            }
        }

        return window;
    }

    sendMessage(action, data = {}) {
        try {
            chrome.runtime.sendMessage({
                action: action,
                ...data
            });
        } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Inicializar o extrator quando a página carregar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new GoogleMapsDataExtractor();
    });
} else {
    new GoogleMapsDataExtractor();
}