const photoLimit = 2 * 1024 * 1024;
const photoTypes = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
} as const;

export type PhotoRejection = {
  kind: 'format' | 'contents' | 'size' | 'format-and-size';
  filename: string;
  extension: string;
  sizeMb: string;
};

export type PhotoSelection = { image: HTMLImageElement; url: string } | { error: PhotoRejection };
export type CropPosition = { x: number; y: number };

function readPhoto(file: File, mimeType: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Photo read failed'));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file.slice(0, file.size, mimeType));
  });
}

function identifyPhoto(header: Uint8Array) {
  const startsWith = (signature: number[]) => signature.every((byte, index) => header[index] === byte);
  if (startsWith([0xff, 0xd8, 0xff])) return 'image/jpeg';
  if (startsWith([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'image/png';
  if (startsWith([0x52, 0x49, 0x46, 0x46]) && String.fromCharCode(...header.slice(8, 12)) === 'WEBP') return 'image/webp';
  return null;
}

export async function selectPhoto(file: File): Promise<PhotoSelection> {
  const extension = /\.([^.]+)$/.exec(file.name)?.[1].toLowerCase() ?? '';
  const expected = Object.hasOwn(photoTypes, extension) ? photoTypes[extension as keyof typeof photoTypes] : null;
  const tooLarge = file.size > photoLimit;
  const details = { filename: file.name, extension, sizeMb: (file.size / (1024 * 1024)).toFixed(1) };
  if (!expected) return { error: { ...details, kind: tooLarge ? 'format-and-size' : 'format' } };
  if (tooLarge) return { error: { ...details, kind: 'size' } };

  try {
    const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    if (identifyPhoto(header) === expected) {
      const url = await readPhoto(file, expected);
      const image = new Image();
      image.src = url;
      await image.decode();
      return { image, url };
    }
  } catch {
    // A matching header still needs to decode to a valid image.
  }

  return { error: { ...details, kind: 'contents' } };
}

export function photoCrop(image: HTMLImageElement, zoom: number, position: CropPosition) {
  const width = image.naturalWidth;
  const height = image.naturalHeight;
  const size = Math.min(width, height) / zoom;
  return { x: (width - size) * position.x, y: (height - size) * position.y, size, width, height };
}

export function renderPhotoCrop(image: HTMLImageElement, zoom: number, position: CropPosition): string | null {
  const { x, y, size } = photoCrop(image, zoom, position);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const context = canvas.getContext('2d');
  if (!context) return null;
  context.drawImage(image, x, y, size, size, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/webp', 0.9);
}
