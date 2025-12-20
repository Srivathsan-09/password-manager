const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const MasterConfig = require('./models/MasterConfig');
require('dotenv').config();

const uri = process.env.MONGO_URI;

async function testAuth() {
    try {
        console.log('Connecting to DB...');
        await mongoose.connect(uri);
        console.log('Connected.');

        console.log('Testing Bcrypt...');
        const plain = 'password123';
        const hash = await bcrypt.hash(plain, 10);
        console.log('Hash created:', hash);
        const match = await bcrypt.compare(plain, hash);
        console.log('Compare result:', match);

        console.log('Testing MasterConfig save...');
        // Clear existing to avoid dupes/logic errors
        await MasterConfig.deleteMany({});

        const config = new MasterConfig({
            masterPasswordHash: hash,
            securityQuestion: 'Test Q',
            securityAnswerHash: hash
        });

        const saved = await config.save();
        console.log('MasterConfig Saved:', saved._id);

        console.log('Cleanup...');
        await MasterConfig.deleteMany({});

    } catch (e) {
        console.error('TEST FAILED:', e);
    } finally {
        mongoose.connection.close();
    }
}

testAuth();
