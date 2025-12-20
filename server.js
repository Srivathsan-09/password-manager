const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
const authRoutes = require('./routes/auth');
const credentialRoutes = require('./routes/credentials');
app.use('/api/auth', authRoutes);
app.use('/api/credentials', credentialRoutes);

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Database Connection & Server Start
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('MongoDB is connected');
        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });
