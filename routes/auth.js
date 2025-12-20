const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const MasterConfig = require('../models/MasterConfig');
require('dotenv').config();

// Check if application is initialized
router.post('/init', async (req, res) => {
    try {
        const config = await MasterConfig.findOne();
        if (config) {
            return res.json({ initialized: true });
        }
        return res.json({ initialized: false });
    } catch (err) {
        console.error('Init Error:', err);
        return res.status(500).json({ error: 'Server error: ' + err.message });
    }
});

// Initial Setup
router.post('/setup', async (req, res) => {
    try {
        const existingConfig = await MasterConfig.findOne();
        if (existingConfig) {
            return res.status(400).json({ error: 'Application already initialized' });
        }

        const { masterPassword, securityQuestion, securityAnswer } = req.body;

        if (!masterPassword || !securityQuestion || !securityAnswer) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const masterPasswordHash = await bcrypt.hash(masterPassword, 10);
        const securityAnswerHash = await bcrypt.hash(securityAnswer.toLowerCase().trim(), 10);

        const newConfig = new MasterConfig({
            masterPasswordHash,
            securityQuestion,
            securityAnswerHash
        });

        await newConfig.save();
        res.json({ message: 'Setup complete' });
    } catch (err) {
        console.error('Setup Error:', err);
        res.status(500).json({ error: 'Setup failed: ' + err.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { masterPassword } = req.body;
        const config = await MasterConfig.findOne();

        if (!config) {
            return res.status(400).json({ error: 'Application not initialized' });
        }

        const isMatch = await bcrypt.compare(masterPassword, config.masterPasswordHash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid password' });
        }

        const token = jwt.sign({ id: config._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    } catch (err) {
        console.error('Login Error:', err);
        res.status(500).json({ error: 'Login failed: ' + err.message });
    }
});

// Recovery
router.post('/recover', async (req, res) => {
    try {
        const { securityAnswer, newMasterPassword } = req.body;
        const config = await MasterConfig.findOne();

        if (!config) {
            return res.status(400).json({ error: 'Application not initialized' });
        }

        const isMatch = await bcrypt.compare(securityAnswer.toLowerCase().trim(), config.securityAnswerHash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid security answer' });
        }

        const newHash = await bcrypt.hash(newMasterPassword, 10);
        config.masterPasswordHash = newHash;
        await config.save();

        res.json({ message: 'Password reset successful' });
    } catch (err) {
        console.error('Recovery Error:', err);
        res.status(500).json({ error: 'Recovery failed: ' + err.message });
    }
});

module.exports = router;
