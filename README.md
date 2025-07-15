# 🗺️ Google Maps Data Extractor

Uma extensão do Chrome que extrai dados de empresas/locais do Google Maps e exporta para Excel.

## 📋 Características

- ✅ Extrai dados de múltiplos locais do Google Maps automaticamente
- 📊 Exporta dados para arquivo CSV (compatível com Excel)
- 🔄 Scroll automático para coletar mais resultados
- 💾 Armazena dados localmente para recuperação posterior
- 🎨 Interface moderna e intuitiva
- 🚀 Rápido e eficiente

## 📊 Dados Extraídos

A extensão coleta as seguintes informações de cada local:

- **Nome** do estabelecimento
- **Rating** (avaliação com estrelas)
- **Número de avaliações**
- **Endereço** completo
- **Telefone** (quando disponível)
- **Website** (quando disponível)
- **Categoria** do negócio
- **Horário** de funcionamento
- **Faixa de preço** (quando disponível)

## 🚀 Como Instalar

### Método 1: Instalação Manual (Desenvolvedor)

1. **Baixe os arquivos** da extensão para uma pasta no seu computador

2. **Abra o Chrome** e vá para:
   ```
   chrome://extensions/
   ```

3. **Ative o "Modo do desenvolvedor"** (toggle no canto superior direito)

4. **Clique em "Carregar sem compactação"**

5. **Selecione a pasta** onde você baixou os arquivos da extensão

6. **Pronto!** A extensão aparecerá na sua barra de ferramentas

## 📖 Como Usar

### Passo a Passo:

1. **Vá para o Google Maps**
   ```
   https://maps.google.com
   ```

2. **Faça uma pesquisa** por empresas/locais
   - Exemplo: "restaurantes em São Paulo"
   - Exemplo: "hotéis no Rio de Janeiro"
   - Exemplo: "academias em Belo Horizonte"

3. **Aguarde** os resultados aparecerem na lateral esquerda

4. **Clique no ícone da extensão** 🗺️ na barra de ferramentas

5. **Clique em "🚀 Iniciar Extração"**

6. **Aguarde** a extração automática dos dados
   - A extensão vai rolar automaticamente pela lista
   - O progresso será mostrado em tempo real

7. **Clique em "📊 Baixar Excel"** quando concluído

8. **Abra o arquivo CSV** baixado no Excel ou Google Sheets

### 💡 Dicas de Uso:

- **Aguarde** a página carregar completamente antes de iniciar
- **Mantenha a aba ativa** durante a extração
- **Não navegue** para outras páginas durante o processo
- **Use pesquisas específicas** para melhores resultados
- **Limpe os dados** entre extrações diferentes

## 🔧 Funcionalidades

### Interface Principal
- **Status em tempo real** da extração
- **Contador de dados** coletados
- **Barra de progresso** visual
- **Botões intuitivos** para todas as ações

### Extração Inteligente
- **Scroll automático** para carregar mais resultados
- **Detecção automática** de novos dados
- **Filtragem de duplicatas** baseada em nome e endereço
- **Múltiplos seletores** para diferentes layouts do Maps

### Armazenamento
- **Persistência local** dos dados extraídos
- **Recuperação automática** ao reabrir a extensão
- **Função de limpeza** para remover dados antigos

## 📁 Estrutura de Arquivos

```
google-maps-extractor/
├── manifest.json          # Configuração da extensão
├── popup.html             # Interface do usuário
├── popup.js               # Lógica da interface
├── content.js             # Script de extração
├── background.js          # Service worker
└── README.md              # Esta documentação
```

## 🔒 Privacidade e Segurança

- ✅ **Dados locais apenas** - nenhum dado é enviado para servidores externos
- ✅ **Código aberto** - você pode revisar todo o código
- ✅ **Permissões mínimas** - apenas acesso ao Google Maps
- ✅ **Sem rastreamento** - nenhuma analítica ou tracking

## ⚠️ Limitações e Considerações

### Limitações Técnicas:
- **Apenas dados visíveis** - extrai apenas o que aparece na interface
- **Layout dependente** - pode precisar de ajustes se o Google Maps mudar
- **Velocidade da internet** - conexões lentas podem afetar a extração

### Uso Responsável:
- ⚖️ **Respeite os termos** de uso do Google Maps
- 🎯 **Use para fins legítimos** (pesquisa, análise de mercado, etc.)
- 📊 **Não sobrecarregue** os servidores com muitas requisições
- 🔄 **Aguarde intervalos** entre extrações massivas

### Formato de Saída:
- **Arquivo CSV** compatível com Excel, Google Sheets, etc.
- **Codificação UTF-8** para suporte a caracteres especiais
- **Separadores padrão** (vírgulas) para compatibilidade

## 🐛 Resolução de Problemas

### Problemas Comuns:

**"Nenhum dado encontrado"**
- Certifique-se de que há resultados visíveis no Maps
- Aguarde a página carregar completamente
- Tente uma pesquisa diferente

**"Erro ao iniciar extração"**
- Verifique se está numa página do Google Maps
- Recarregue a página e tente novamente
- Verifique se a extensão está ativada

**"Download não funciona"**
- Verifique as configurações de download do navegador
- Desative bloqueadores de pop-up para o site
- Tente usar outro navegador

**"Dados incompletos"**
- Alguns campos podem estar vazios no próprio Google Maps
- Nem todos os estabelecimentos têm todas as informações
- A extração depende dos dados disponíveis publicamente

### Suporte:
- Verifique se está usando a versão mais recente
- Tente desativar outras extensões temporariamente
- Limpe o cache do navegador se necessário

## 🔄 Atualizações

A extensão é compatível com:
- ✅ Chrome 88+
- ✅ Edge Chromium
- ✅ Outros navegadores baseados em Chromium

## 📄 Licença

Este projeto é fornecido "como está" para fins educacionais e de pesquisa.

---

**⚡ Desenvolvido para facilitar a extração de dados do Google Maps de forma eficiente e responsável!**