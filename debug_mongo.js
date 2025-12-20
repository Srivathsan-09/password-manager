const mongoose = require('mongoose');
require('dotenv').config();

const uri = process.env.MONGO_URI;
console.log('Connecting to:', uri);

mongoose.connect(uri)
    .then(async () => {
        console.log('Connected!');

        // Define simple schema for test
        const TestSchema = new mongoose.Schema({ name: String });
        const TestModel = mongoose.model('Test', TestSchema);

        try {
            console.log('Attempting to save document...');
            const doc = new TestModel({ name: 'Debug Test' });
            await doc.save();
            console.log('Document saved successfully!');

            console.log('Attempting to find document...');
            const found = await TestModel.findOne({ name: 'Debug Test' });
            console.log('Found:', found);

            await TestModel.deleteMany({});
            console.log('Cleanup successful');
        } catch (e) {
            console.error('Operation failed:', e);
        } finally {
            mongoose.connection.close();
        }
    })
    .catch(err => {
        console.error('Connection failed:', err);
    });
