export const SUPPORTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif"
] as const;

export const GLOBAL_MAX_BYTES = 20 * 1024 * 1024;

const SUPPORTED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"];

export function isSupportedImageType(type: string): boolean {
  return (SUPPORTED_IMAGE_TYPES as readonly string[]).includes(type);
}

export function isSupportedImageFile(file: { name: string; type: string }): boolean {
  if (isSupportedImageType(file.type)) {
    return true;
  }
  const lowerName = file.name.toLowerCase();
  return SUPPORTED_EXTENSIONS.some((extension) => lowerName.endsWith(extension));
}

export function sniffImageMime(bytes: Uint8Array): string | undefined {
  if (bytes.length < 12) {
    return undefined;
  }
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "image/png";
  }
  if (
    bytes[0] === 0x47 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x38
  ) {
    return "image/gif";
  }
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }
  const header = String.fromCharCode(...bytes.subarray(4, 12));
  if (header.startsWith("ftypavif") || header.startsWith("ftypavis")) {
    return "image/avif";
  }
  return undefined;
}

export async function sniffBlobMime(blob: Blob): Promise<string | undefined> {
  const bytes = new Uint8Array(await blob.slice(0, 12).arrayBuffer());
  return sniffImageMime(bytes);
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const match = /^data:([^;,]+)?(;base64)?,(.*)$/s.exec(dataUrl);
  if (!match) {
    throw new Error("Invalid data URL");
  }
  const mime = match[1] || "application/octet-stream";
  const isBase64 = Boolean(match[2]);
  const payload = match[3];
  if (isBase64) {
    const binary = atob(payload);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return new Blob([bytes], { type: mime });
  }
  return new Blob([decodeURIComponent(payload)], { type: mime });
}

export function base64ToBlob(base64: string, type: string): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new Blob([bytes], { type: type || "application/octet-stream" });
}

export function isValidImageUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function basename(value: string): string {
  const cleaned = value.split(/[\\/]/).pop() ?? "image";
  let safe = "";
  for (const character of cleaned) {
    const code = character.codePointAt(0) ?? 0;
    if (code >= 32 && code !== 127 && character !== '"') {
      safe += character;
    }
  }
  return safe.slice(0, 120) || "image";
}
