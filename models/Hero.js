const mongoose = require('mongoose');

const heroSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    nickname: {
        type: String,
        required: true,
        trim: true
    },
    birthDate: {
        type: String,
        required: true
    },
    deathDate: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    values: [{
        type: String,
        trim: true
    }]
}, { timestamps: true });

// Add text index for search functionality
heroSchema.index({ name: 'text', nickname: 'text', description: 'text' });

module.exports = mongoose.model('Hero', heroSchema);
