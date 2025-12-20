const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Credential = require('../models/Credential');
const { encrypt, decrypt } = require('../utils/encryption');

// Middleware to verify JWT
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).json({ error: 'No token provided' });

    try {
        const decoded = jwt.verify(token.split(' ')[1], process.env.JWT_SECRET);
        req.userId = decoded.id;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
};

router.use(verifyToken);

// Get all credentials (passwords masked)
router.get('/', async (req, res) => {
    try {
        const credentials = await Credential.find().sort({ createdAt: -1 });
        const safeCredentials = credentials.map(c => ({
            _id: c._id,
            appName: c.appName,
            username: c.username,
            notes: c.notes,
            updatedAt: c.updatedAt
        }));
        res.json(safeCredentials);
    } catch (err) {
        res.status(500).json({ error: 'Error fetching credentials' });
    }
});

// Add new credential
router.post('/', async (req, res) => {
    try {
        console.log('=== ADD CREDENTIAL REQUEST ===');
        console.log('Request body:', req.body);

        const { appName, username, password, notes } = req.body;

        console.log('Extracted fields:', { appName, username, hasPassword: !!password, notes });

        if (!appName || !username || !password) {
            console.log('Missing required fields');
            return res.status(400).json({ error: 'Missing required fields' });
        }

        console.log('Encrypting password...');
        const encryptedData = encrypt(password);
        console.log('Encryption result:', { hasIv: !!encryptedData.iv, hasContent: !!encryptedData.content });

        console.log('Creating credential document...');
        const newCredential = new Credential({
            appName,
            username,
            encryptedPassword: encryptedData.content,
            iv: encryptedData.iv,
            notes
        });

        console.log('Saving to database...');
        await newCredential.save();
        console.log('Save successful! ID:', newCredential._id);

        res.json({ message: 'Credential saved', _id: newCredential._id });
    } catch (err) {
        console.error('=== ERROR SAVING CREDENTIAL ===');
        console.error('Error name:', err.name);
        console.error('Error message:', err.message);
        console.error('Full error:', err);
        res.status(500).json({ error: 'Error saving credential: ' + err.message });
    }
});

// Reveal password
router.post('/:id/reveal', async (req, res) => {
    try {
        const credential = await Credential.findById(req.params.id);
        if (!credential) return res.status(404).json({ error: 'Not found' });

        const originalPassword = decrypt({
            iv: credential.iv,
            content: credential.encryptedPassword
        });

        res.json({ password: originalPassword });
    } catch (err) {
        res.status(500).json({ error: 'Error decrypting' });
    }
});

// Update credential
router.put('/:id', async (req, res) => {
    try {
        const { appName, username, password, notes } = req.body;
        const updateData = { appName, username, notes };

        if (password) {
            const encryptedData = encrypt(password);
            updateData.encryptedPassword = encryptedData.content;
            updateData.iv = encryptedData.iv;
        }

        await Credential.findByIdAndUpdate(req.params.id, updateData);
        res.json({ message: 'Updated successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Update failed' });
    }
});

// Delete credential
router.delete('/:id', async (req, res) => {
    try {
        await Credential.findByIdAndDelete(req.params.id);
        res.json({ message: 'Deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Delete failed' });
    }
});

module.exports = router;
