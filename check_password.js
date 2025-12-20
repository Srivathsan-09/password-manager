const mongoose = require('mongoose');
const MasterConfig = require('./models/MasterConfig');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function checkPassword() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const config = await MasterConfig.findOne();
        if (!config) {
            console.log('No master config found - app not initialized');
            process.exit(0);
        }

        console.log('Security Question:', config.securityQuestion);

        // Test common passwords
        const testPasswords = ['password123', 'admin', 'test123', ''];

        for (const pwd of testPasswords) {
            const match = await bcrypt.compare(pwd, config.masterPasswordHash);
            if (match) {
                console.log(`✓ FOUND! Master password is: "${pwd}"`);
                process.exit(0);
            }
        }

        console.log('None of the test passwords matched');
        console.log('Hash stored:', config.masterPasswordHash);

    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await mongoose.disconnect();
    }
}

checkPassword();
