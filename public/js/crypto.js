/**
 * Модуль шифрования данных
 * Используется XOR-шифрование + Base64 кодирование
 */

const CryptoModule = (function() {
  const ENCRYPTION_KEY = 'StGr@2024!SecKey';

  /**
   * Шифрование строки
   * @param {string} data - данные для шифрования
   * @returns {string} - зашифрованная строка в Base64
   */
  function encrypt(data) {
    let encrypted = '';
    for (let i = 0; i < data.length; i++) {
      const charCode = data.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
      encrypted += String.fromCharCode(charCode);
    }
    return btoa(encrypted);
  }

  /**
   * Дешифрование строки
   * @param {string} encoded - зашифрованная строка в Base64
   * @returns {string} - расшифрованная строка
   */
  function decrypt(encoded) {
    const data = atob(encoded);
    let decrypted = '';
    for (let i = 0; i < data.length; i++) {
      const charCode = data.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
      decrypted += String.fromCharCode(charCode);
    }
    return decrypted;
  }

  /**
   * Генерация токена для запроса
   * @returns {string} - зашифрованный токен
   */
  function generateToken() {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2);
    return encrypt(timestamp + ':' + random);
  }

  /**
   * Валидация токена
   * @param {string} token - токен для проверки
   * @returns {boolean}
   */
  function validateToken(token) {
    try {
      const decoded = decrypt(token);
      const parts = decoded.split(':');
      if (parts.length !== 2) return false;
      const timestamp = parseInt(parts[0]);
      // Токен действителен 24 часа
      return Date.now() - timestamp < 24 * 60 * 60 * 1000;
    } catch (e) {
      return false;
    }
  }

  /**
   * Экранирование значения для CSV
   * @param {string} value
   * @returns {string}
   */
  function escapeCSV(value) {
    if (!value) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  }

  return {
    encrypt: encrypt,
    decrypt: decrypt,
    generateToken: generateToken,
    validateToken: validateToken,
    escapeCSV: escapeCSV
  };
})();
