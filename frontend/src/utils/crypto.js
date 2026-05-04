export const encryptId = (id) => {
  if (!id) return '';
  const str = id.toString();
  // Simple obfuscation: add a prefix and base64 encode
  // We also replace some characters to make it URL safe if needed, 
  // but standard base64 is mostly fine if we don't have + or /
  return btoa(`pid-${str}`).replace(/=/g, '');
};

export const decryptId = (encryptedId) => {
  if (!encryptedId) return '';
  try {
    // Add back padding if missing
    let b64 = encryptedId;
    while (b64.length % 4 !== 0) {
      b64 += '=';
    }
    const decoded = atob(b64);
    if (decoded.startsWith('pid-')) {
      return decoded.substring(4);
    }
    return decoded;
  } catch (e) {
    console.error('Failed to decrypt ID:', e);
    return null;
  }
};
