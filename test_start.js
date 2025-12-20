try {
    console.log('Loading express...');
    require('express');
    console.log('Loading mongoose...');
    require('mongoose');
    console.log('Loading dotenv...');
    require('dotenv').config();
    console.log('Loading bcrypt...');
    require('bcrypt');
    console.log('All modules loaded!');
} catch (e) {
    console.error('Failed to load module:', e);
}
