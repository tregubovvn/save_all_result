// Простое шифрование данных перед отправкой на сервер
// Используется XOR-шифрование + Base64 кодирование

const ENCRYPTION_KEY = 'StGr@2024!SecKey';

export function encrypt(data: string): string {
  let encrypted = '';
  for (let i = 0; i < data.length; i++) {
    const charCode = data.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
    encrypted += String.fromCharCode(charCode);
  }
  return btoa(encrypted);
}

export function decrypt(encoded: string): string {
  const data = atob(encoded);
  let decrypted = '';
  for (let i = 0; i < data.length; i++) {
    const charCode = data.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
    decrypted += String.fromCharCode(charCode);
  }
  return decrypted;
}

export function generateToken(): string {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2);
  return encrypt(`${timestamp}:${random}`);
}

export function validateToken(token: string): boolean {
  try {
    const decoded = decrypt(token);
    const parts = decoded.split(':');
    if (parts.length !== 2) return false;
    const timestamp = parseInt(parts[0]);
    // Токен действителен 24 часа
    return Date.now() - timestamp < 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}
