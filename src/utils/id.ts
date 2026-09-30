export function generateSecureId(): string {
  if (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  if (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.getRandomValues) {
    const array = new Uint32Array(4);
    globalThis.crypto.getRandomValues(array);
    let hex = '';
    for (let i = 0; i < array.length; i++) {
      hex += array[i].toString(16).padStart(8, '0');
    }
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-8${hex.slice(17, 20)}-${hex.slice(20, 32)}`; // roughly match UUID v4 format
  }

  // Fallback for extremely old environments or tests without crypto
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}
