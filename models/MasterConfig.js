const mongoose = require('mongoose');

const masterConfigSchema = new mongoose.Schema({
    masterPasswordHash: {
        type: String,
        required: true
    },
    securityQuestion: {
        type: String,
        required: false
    },
    securityAnswerHash: {
        type: String,
        required: false
    },
    recoveryKeyHash: {
        type: String,
        required: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('MasterConfig', masterConfigSchema);
