/**
 * Client-side image compression using Canvas API.
 * Reduces file size while maintaining reasonable quality.
 */

const MAX_DIMENSION = 1280;
const COMPRESSION_QUALITY = 0.6;

/**
 * Compresses an image file using a canvas element.
 * PDFs are returned as-is since they can't be canvas-compressed.
 * 
 * @param file - The image file to compress
 * @param maxSizeMB - Target max size in MB (default 2)
 * @returns Compressed file or original if already small enough / not an image
 */
export async function compressImage(file: File, maxSizeMB = 1): Promise<File> {
  // Skip non-image files (e.g., PDFs)
  if (!file.type.startsWith('image/')) {
    return file;
  }

  // Already under limit
  if (file.size <= maxSizeMB * 1024 * 1024) {
    return file;
  }

  return new Promise<File>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let { width, height } = img;

          // Scale down if too large
          if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
            const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            console.warn('[ImageCompression] Canvas context unavailable, returning original');
            resolve(file);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                console.warn('[ImageCompression] Blob creation failed, returning original');
                resolve(file);
                return;
              }

              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });

              console.log(
                `[ImageCompression] ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`
              );

              resolve(compressedFile);
            },
            'image/jpeg',
            COMPRESSION_QUALITY
          );
        } catch (err) {
          console.error('[ImageCompression] Compression error:', err);
          resolve(file); // Fallback to original
        }
      };

      img.onerror = () => {
        console.warn('[ImageCompression] Image load failed, returning original');
        resolve(file);
      };

      img.src = event.target?.result as string;
    };

    reader.onerror = () => {
      console.warn('[ImageCompression] FileReader failed, returning original');
      resolve(file);
    };

    reader.readAsDataURL(file);
  });
}
