// Configuração da API convert-docx-html
// As variáveis de ambiente são lidas do arquivo .env na raiz do projeto
// Certifique-se de que o arquivo .env existe e contém:
// REACT_APP_CONVERTER_API_URL=http://localhost:3005/api
// REACT_APP_CONVERTER_API_KEY=sua-api-key-secreta

// Valores padrão para desenvolvimento local
const DEFAULT_API_URL = 'http://localhost:3005/api';
const DEFAULT_API_KEY = 'sua-api-key-secreta';

// Lê as variáveis de ambiente (devem começar com REACT_APP_)
// Garante que sempre use a porta 3005 se não houver variável de ambiente configurada
const envUrl = process.env.REACT_APP_CONVERTER_API_URL;
const API_URL = envUrl || DEFAULT_API_URL;
const API_KEY = process.env.REACT_APP_CONVERTER_API_KEY || DEFAULT_API_KEY;

// Debug: Log da configuração em desenvolvimento
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 Configuração da API:', {
    'REACT_APP_CONVERTER_API_URL': process.env.REACT_APP_CONVERTER_API_URL,
    'API_URL (usado)': API_URL,
    'DEFAULT_API_URL': DEFAULT_API_URL,
    'API_KEY configurada': API_KEY !== DEFAULT_API_KEY,
  });
}

// Validação e avisos em desenvolvimento
if (process.env.NODE_ENV === 'development') {
  if (!process.env.REACT_APP_CONVERTER_API_URL) {
    console.warn(
      '⚠️ REACT_APP_CONVERTER_API_URL não configurada no .env. Usando valor padrão:',
      DEFAULT_API_URL
    );
  }
  if (!process.env.REACT_APP_CONVERTER_API_KEY || API_KEY === DEFAULT_API_KEY) {
    console.warn(
      '⚠️ REACT_APP_CONVERTER_API_KEY não configurada ou usando valor padrão. Configure no arquivo .env'
    );
  }
}

export const API_CONFIG = {
  BASE_URL: API_URL,
  API_KEY: API_KEY,
  ENDPOINTS: {
    DOCX_TO_HTML: '/converter/docx-to-html',
  },
};

/**
 * Retorna a URL completa do endpoint
 */
export const getApiUrl = (endpoint: string): string => {
  const baseUrl = API_CONFIG.BASE_URL.endsWith('/') 
    ? API_CONFIG.BASE_URL.slice(0, -1) 
    : API_CONFIG.BASE_URL;
  const endpointPath = endpoint.startsWith('/') 
    ? endpoint 
    : `/${endpoint}`;
  return `${baseUrl}${endpointPath}`;
};

/**
 * Verifica se a configuração da API está válida
 * Retorna true se pelo menos uma das configurações foi alterada do padrão
 */
export const isApiConfigured = (): boolean => {
  return (
    API_CONFIG.BASE_URL !== DEFAULT_API_URL &&
    API_CONFIG.API_KEY !== DEFAULT_API_KEY
  );
};

