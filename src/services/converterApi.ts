import { API_CONFIG, getApiUrl, isApiConfigured } from '../config/api';

export interface ConverterResponse {
  success: boolean;
  html?: string;
  error?: string;
}

export interface HtmlToDocxResponse {
  success: boolean;
  blob?: Blob;
  error?: string;
}

/**
 * Converte um arquivo DOCX para HTML usando a API convert-docx-html
 * @param file Arquivo DOCX a ser convertido
 * @returns HTML convertido ou erro
 */
export async function convertDocxToHtml(file: File): Promise<ConverterResponse> {
  try {
    // Validar tipo de arquivo
    if (!file.name.toLowerCase().endsWith('.docx')) {
      return {
        success: false,
        error: 'O arquivo deve ser um documento DOCX (.docx)',
      };
    }

    // Verificar se a API está configurada
    if (!isApiConfigured()) {
      console.warn('⚠️ API não configurada corretamente. Verifique o arquivo .env');
    }

    // Criar FormData para enviar o arquivo
    const formData = new FormData();
    formData.append('file', file);

    const apiUrl = getApiUrl(API_CONFIG.ENDPOINTS.DOCX_TO_HTML);
    console.log('📤 Configuração da API:', {
      'BASE_URL': API_CONFIG.BASE_URL,
      'ENDPOINT': API_CONFIG.ENDPOINTS.DOCX_TO_HTML,
      'URL completa': apiUrl,
    });

    // Fazer requisição para a API
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'x-api-key': API_CONFIG.API_KEY,
      },
      body: formData,
    });

    // Verificar se a requisição foi bem-sucedida
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Erro na conversão: ${response.status} - ${errorText || response.statusText}`;
      
      // Mensagens mais específicas para erros comuns
      if (response.status === 401) {
        errorMessage = 'Erro de autenticação: API Key inválida. Verifique REACT_APP_CONVERTER_API_KEY no arquivo .env';
      } else if (response.status === 404) {
        errorMessage = `Endpoint não encontrado. Verifique se a URL está correta: ${apiUrl}`;
      } else if (response.status === 0 || response.status === 500) {
        errorMessage = 'Erro ao conectar com o servidor. Verifique se o backend convert-docx-html está rodando e se REACT_APP_CONVERTER_API_URL está correto no arquivo .env';
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }

    // Obter o HTML da resposta
    const html = await response.text();

    return {
      success: true,
      html,
    };
  } catch (error) {
    console.error('Erro ao converter DOCX para HTML:', error);
    
    let errorMessage = 'Erro desconhecido ao converter arquivo';
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      errorMessage = `Erro de conexão: Não foi possível conectar ao servidor. Verifique se:
- O backend convert-docx-html está rodando
- A URL no arquivo .env está correta: ${API_CONFIG.BASE_URL}
- Não há problemas de CORS ou firewall bloqueando a conexão`;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Converte HTML para DOCX usando a API convert-docx-html
 * @param html Conteúdo HTML a ser convertido
 * @param fileName Nome do arquivo (sem extensão)
 * @returns Blob do arquivo DOCX ou erro
 */
export async function convertHtmlToDocx(
  html: string,
  fileName: string = 'documento'
): Promise<HtmlToDocxResponse> {
  try {
    // Verificar se a API está configurada
    if (!isApiConfigured()) {
      console.warn('⚠️ API não configurada corretamente. Verifique o arquivo .env');
    }

    const apiUrl = getApiUrl(API_CONFIG.ENDPOINTS.DOCX_TO_HTML);
    console.log('📤 Enviando HTML para conversão:', apiUrl);

    // Fazer requisição para a API
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_CONFIG.API_KEY,
      },
      body: JSON.stringify({ html }),
    });

    // Verificar se a requisição foi bem-sucedida
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Erro na conversão: ${response.status} - ${errorText || response.statusText}`;
      
      // Mensagens mais específicas para erros comuns
      if (response.status === 401) {
        errorMessage = 'Erro de autenticação: API Key inválida. Verifique REACT_APP_CONVERTER_API_KEY no arquivo .env';
      } else if (response.status === 404) {
        errorMessage = `Endpoint não encontrado. Verifique se a URL está correta: ${apiUrl}`;
      } else if (response.status === 0 || response.status === 500) {
        errorMessage = 'Erro ao conectar com o servidor. Verifique se o backend convert-docx-html está rodando e se REACT_APP_CONVERTER_API_URL está correto no arquivo .env';
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }

    // Obter o blob do arquivo DOCX
    const blob = await response.blob();

    return {
      success: true,
      blob,
    };
  } catch (error) {
    console.error('Erro ao converter HTML para DOCX:', error);
    
    let errorMessage = 'Erro desconhecido ao converter arquivo';
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      errorMessage = `Erro de conexão: Não foi possível conectar ao servidor. Verifique se:
- O backend convert-docx-html está rodando
- A URL no arquivo .env está correta: ${API_CONFIG.BASE_URL}
- Não há problemas de CORS ou firewall bloqueando a conexão`;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

