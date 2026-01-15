// Serviço de Upload de Imagens via backend (Firebase Storage via Admin SDK)
// Motivo: upload direto para terceiros (ex: freeimage.host) pode falhar por CORS,
// e fallback base64 estoura limites do Firestore (10MB) e do localStorage.

import api from './api';

/**
 * Converte arquivo para base64 com prefixo data URL
 */
type CompressOptions = {
  maxBytes: number;
  maxDimension: number;
  quality: number;
  minQuality: number;
};

const defaultCompress: CompressOptions = {
  maxBytes: 3.5 * 1024 * 1024, // mantemos abaixo do limite do backend (4MB)
  maxDimension: 1920,
  quality: 0.82,
  minQuality: 0.55,
};

const blobToFile = (blob: Blob, originalName: string) => {
  const base = (originalName || 'image').replace(/\.[^.]+$/, '');
  const name = `${base}.jpg`;
  return new File([blob], name, { type: blob.type || 'image/jpeg' });
};

const compressImageToJpeg = async (file: File, opts: CompressOptions = defaultCompress): Promise<File> => {
  // Se já estiver pequeno, não mexe.
  if (file.size <= opts.maxBytes) return file;

  // SVG geralmente já é leve e pode quebrar ao rasterizar.
  if (file.type === 'image/svg+xml') return file;

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = (e) => reject(e);
    image.src = dataUrl;
  });

  const scale = Math.min(1, opts.maxDimension / Math.max(img.width, img.height));
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return file;
  ctx.drawImage(img, 0, 0, width, height);

  let quality = opts.quality;
  let blob: Blob | null = null;

  // Ajusta quality até caber
  for (let i = 0; i < 6; i++) {
    blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
    if (!blob) break;
    if (blob.size <= opts.maxBytes) break;
    quality = Math.max(opts.minQuality, quality - 0.1);
  }

  if (!blob) return file;
  return blobToFile(blob, file.name);
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

  try {
    // Compressão para evitar limites de payload em serverless/Firestore.
    const fileToUpload = await compressImageToJpeg(file);

    if (fileToUpload.size > 4 * 1024 * 1024) {
      throw new Error('Imagem muito grande para upload (máx 4MB). Tente uma imagem menor.');
    }

    const formData = new FormData();
    formData.append('file', fileToUpload);

    const resp = await api.post('/uploads/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    const url = resp?.data?.url as string | undefined;
    if (!url) throw new Error('Upload não retornou URL');

    console.log('✅ Imagem enviada com sucesso:', url);
    return url;
  } catch (error) {
    console.error('❌ Erro no upload:', error);
    throw error;
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
