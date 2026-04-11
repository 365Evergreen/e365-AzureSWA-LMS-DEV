import sharp from 'sharp';
import path from 'path';

const CONVERTIBLE = new Set(['image/jpeg', 'image/png']);

export interface ProcessedImage {
  buffer: Buffer;
  contentType: string;
  filename: string;
}

/**
 * Converts JPEG/PNG uploads to WebP. All other types pass through unchanged.
 * Uses lossless mode for PNG (preserves transparency), lossy q=82 for JPEG.
 */
export async function processImage(
  buffer: Buffer,
  originalFilename: string,
  contentType: string,
): Promise<ProcessedImage> {
  if (!CONVERTIBLE.has(contentType)) {
    return { buffer, contentType, filename: originalFilename };
  }

  const ext = path.extname(originalFilename);
  const base = path.basename(originalFilename, ext);
  const filename = `${base}.webp`;

  const instance = sharp(buffer);
  const converted =
    contentType === 'image/png'
      ? await instance.webp({ lossless: true }).toBuffer()
      : await instance.webp({ quality: 82 }).toBuffer();

  return { buffer: converted, contentType: 'image/webp', filename };
}
