const mongoose = require('mongoose');

const credentialSchema = new mongoose.Schema({
    appName: {
        type: String,
        required: true,
        trim: true
    },
    username: {
        type: String,
        required: true,
        trim: true
    },
    encryptedPassword: {
        type: String,
        required: true
    },
    iv: {
        type: String, // Store IV alongside for decryption
        required: true
    },
    notes: {
        type: String,
        default: ''
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

credentialSchema.pre('save', async function () {
    this.updatedAt = Date.now();
});

module.exports = mongoose.model('Credential', credentialSchema);
