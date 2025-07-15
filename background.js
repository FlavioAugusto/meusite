// Background Service Worker para Google Maps Data Extractor

class BackgroundService {
    constructor() {
        this.setupMessageHandlers();
        this.setupInstallHandler();
    }

    setupInstallHandler() {
        chrome.runtime.onInstalled.addListener((details) => {
            console.log('Google Maps Data Extractor instalado/atualizado');
            
            if (details.reason === 'install') {
                // Primeira instalação
                this.showWelcomeNotification();
            }
        });
    }

    setupMessageHandlers() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            try {
                switch (message.action) {
                    case 'dataExtracted':
                        this.handleDataExtracted(message.data, sender);
                        break;
                    
                    case 'extractionProgress':
                        this.handleExtractionProgress(message, sender);
                        break;
                    
                    case 'extractionComplete':
                        this.handleExtractionComplete(message, sender);
                        break;
                    
                    case 'saveData':
                        this.saveExtractedData(message.data);
                        break;
                    
                    case 'loadData':
                        this.loadExtractedData().then(data => {
                            sendResponse({ data });
                        });
                        return true; // Manter canal aberto para resposta assíncrona
                    
                    default:
                        console.log('Ação não reconhecida:', message.action);
                }
            } catch (error) {
                console.error('Erro no background script:', error);
                sendResponse({ error: error.message });
            }
        });
    }

    handleDataExtracted(data, sender) {
        console.log(`Dados extraídos recebidos: ${data.length} itens`);
        
        // Repassar dados para popup se estiver aberto
        this.forwardToPopup('dataExtracted', { data });
        
        // Salvar dados automaticamente
        this.appendToStoredData(data);
    }

    handleExtractionProgress(message, sender) {
        console.log(`Progresso da extração: ${message.current}/${message.total}`);
        
        // Repassar progresso para popup
        this.forwardToPopup('extractionProgress', message);
    }

    handleExtractionComplete(message, sender) {
        console.log('Extração concluída');
        
        // Repassar conclusão para popup
        this.forwardToPopup('extractionComplete', message);
        
        // Mostrar notificação
        this.showExtractionCompleteNotification(message.totalExtracted || 0);
    }

    async forwardToPopup(action, data) {
        try {
            // Tentar enviar para todas as abas da extensão (popup, options, etc.)
            const extensionViews = chrome.extension.getViews({ type: 'popup' });
            
            extensionViews.forEach(view => {
                if (view.chrome && view.chrome.runtime) {
                    view.postMessage({ action, ...data });
                }
            });
        } catch (error) {
            console.log('Popup não está aberto:', error);
        }
    }

    async saveExtractedData(data) {
        try {
            await chrome.storage.local.set({ 
                extractedData: data,
                lastUpdated: Date.now()
            });
            console.log('Dados salvos no storage');
        } catch (error) {
            console.error('Erro ao salvar dados:', error);
        }
    }

    async loadExtractedData() {
        try {
            const result = await chrome.storage.local.get(['extractedData']);
            return result.extractedData || [];
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            return [];
        }
    }

    async appendToStoredData(newData) {
        try {
            const existingData = await this.loadExtractedData();
            
            // Evitar duplicatas baseado no nome e endereço
            const filteredNewData = newData.filter(newItem => {
                return !existingData.some(existing => 
                    existing.nome === newItem.nome && 
                    existing.endereco === newItem.endereco
                );
            });

            if (filteredNewData.length > 0) {
                const updatedData = [...existingData, ...filteredNewData];
                await this.saveExtractedData(updatedData);
                console.log(`${filteredNewData.length} novos itens adicionados ao storage`);
            }
        } catch (error) {
            console.error('Erro ao adicionar dados ao storage:', error);
        }
    }

    showWelcomeNotification() {
        if (chrome.notifications) {
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><text y="32" font-size="32">🗺️</text></svg>',
                title: 'Maps Data Extractor',
                message: 'Extensão instalada com sucesso! Acesse o Google Maps e clique no ícone da extensão para começar.'
            });
        }
    }

    showExtractionCompleteNotification(totalExtracted) {
        if (chrome.notifications && totalExtracted > 0) {
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><text y="32" font-size="32">✅</text></svg>',
                title: 'Extração Concluída',
                message: `${totalExtracted} locais extraídos com sucesso! Clique na extensão para baixar os dados.`
            });
        }
    }
}

// Inicializar service worker
new BackgroundService();

// Manter service worker ativo
chrome.runtime.onStartup.addListener(() => {
    console.log('Service worker iniciado');
});

// Handler para limpeza periódica de dados antigos (opcional)
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'cleanupOldData') {
        // Implementar limpeza de dados antigos se necessário
        console.log('Executando limpeza de dados antigos...');
    }
});

// Configurar alarme para limpeza (executar uma vez por semana)
chrome.runtime.onInstalled.addListener(() => {
    chrome.alarms.create('cleanupOldData', {
        delayInMinutes: 10080, // 1 semana
        periodInMinutes: 10080
    });
});