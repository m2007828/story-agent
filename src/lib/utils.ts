import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 将上传的图片文件压缩/缩放为适合播放器使用的 data URI。
 * - 最大宽度 1200px，最大高度 900px（等比缩放）
 * - JPEG 质量 0.85
 * - 返回 data:image/jpeg;base64,... 格式
 */
export function compressImageToDataUri(
  file: File,
  maxWidth = 1200,
  maxHeight = 900,
  quality = 0.85,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;
      // 等比缩放
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);

      const dataUri = canvas.toDataURL('image/jpeg', quality);
      resolve(dataUri);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('图片加载失败'));
    };

    img.src = url;
  });
}
