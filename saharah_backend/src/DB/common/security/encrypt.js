import crypto from 'node:crypto'
// 🔑 Use 32 bytes (256 bits) for AES-256
const ENCRYPTION_KEY = Buffer.from('a8dc9e7de50004da62a9765b2c149be91b7dad4a62bc84563dfbaefb067319e0', 'hex')
const IV_LENGTH = 16; // For AES, the IV is always 16 bytes

export function Encrypt(plainText) {
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);  

    let encrypted = cipher.update(plainText, 'utf8', 'hex');

    encrypted += cipher.final('hex');

    return iv.toString('hex') + ':' + encrypted;
}


// Decrypt function
export function Decrypt(text) {

    const [ivHex, encryptedText] = text.split(':');
    
    const iv = Buffer.from(ivHex, 'hex');    

    const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY , iv);
    
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');

    decrypted += decipher.final('utf8');

    return decrypted;
}
