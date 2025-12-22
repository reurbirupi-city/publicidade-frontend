// Serviço de Upload de Imagens usando Freeimage.host (gratuito, sem necessidade de API key)
// Alternativa: salvar como base64 diretamente no Firestore para imagens pequenas

/**
 * Converte arquivo para base64 com prefixo data URL
 */
const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Converte arquivo para base64 puro (sem prefixo)
 */
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Faz upload de uma imagem para Freeimage.host (gratuito)
 * @param file Arquivo de imagem
 * @returns URL da imagem hospedada (throw error se falhar)
 */
export const uploadImage = async (file: File): Promise<string> => {
  // Validar tipo de arquivo
  if (!file.type.startsWith('image/')) {
    throw new Error('Arquivo não é uma imagem válida');
  }

  // Validar tamanho (máx 10MB para Freeimage.host)
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('Imagem deve ter no máximo 10MB');
  }

  try {
    // Converter para base64
    const base64 = await fileToBase64(file);
    
    // Preparar form data para Freeimage.host
    const formData = new FormData();
    formData.append('key', '6d207e02198a847aa98d0a2a901485a5'); // Chave pública gratuita
    formData.append('source', base64);
    formData.append('format', 'json');

    // Fazer upload
    const response = await fetch('https://freeimage.host/api/1/upload', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();

    if (data.status_code === 200 && data.image?.url) {
      console.log('✅ Imagem enviada com sucesso:', data.image.url);
      return data.image.url;
    } else {
      console.error('❌ Erro Freeimage:', data);
      // Fallback: retornar como data URL (base64)
      console.log('📦 Usando fallback base64...');
      return await fileToDataUrl(file);
    }
  } catch (error) {
    console.error('❌ Erro no upload, usando fallback base64:', error);
    // Fallback: retornar como data URL (base64) - funciona para imagens até ~1MB
    return await fileToDataUrl(file);
  }
};

/**
 * Faz upload de múltiplas imagens
 * @param files Lista de arquivos
 * @returns Array de URLs das imagens hospedadas
 */
export const uploadMultipleImages = async (files: FileList | File[]): Promise<string[]> => {
  const urls: string[] = [];
  const fileArray = Array.from(files);
  
  for (const file of fileArray) {
    try {
      const url = await uploadImage(file);
      urls.push(url);
    } catch (error) {
      console.error(`Erro ao enviar imagem ${file.name}:`, error);
      // Continua com as outras imagens
    }
  }
  
  return urls;
};
