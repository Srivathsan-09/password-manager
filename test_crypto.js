const { encrypt, decrypt } = require('./utils/encryption');
require('dotenv').config();

console.log('Testing Encryption...');
const text = 'Srivathsan2006@';
try {
    const encrypted = encrypt(text);
    console.log('Encrypted:', encrypted);

    if (!encrypted) {
        console.error('Encryption returned null');
        process.exit(1);
    }

    const decrypted = decrypt(encrypted);
    console.log('Decrypted:', decrypted);

    if (decrypted === text) {
        console.log('SUCCESS: Decryption matches original text.');
    } else {
        console.error('FAILURE: Decrypted text does not match.');
    }
} catch (e) {
    console.error('ERROR:', e.message);
}
