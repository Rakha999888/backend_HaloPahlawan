const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Hero = require('../models/Hero');

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads/images');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|gif/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb('Error: Images only!');
        }
    }
});

// GET all heroes
router.get('/', async (req, res) => {
    try {
        const heroes = await Hero.find().sort({ name: 1 });
        res.json(heroes);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET single hero
router.get('/:id', getHero, (req, res) => {
    res.json(res.hero);
});

// CREATE hero
router.post('/', upload.single('image'), async (req, res) => {
    try {
        const { name, nickname, birthDate, deathDate, description, values } = req.body;
        
        if (!req.file) {
            return res.status(400).json({ message: 'Please upload an image' });
        }

        const hero = new Hero({
            name,
            nickname,
            birthDate,
            deathDate,
            image: 'images/' + req.file.filename,
            description,
            values: values.split(',').map(v => v.trim())
        });

        const newHero = await hero.save();
        res.status(201).json(newHero);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// UPDATE hero
router.patch('/:id', upload.single('image'), getHero, async (req, res) => {
    try {
        const { name, nickname, birthDate, deathDate, description, values } = req.body;
        
        if (name) res.hero.name = name;
        if (nickname) res.hero.nickname = nickname;
        if (birthDate) res.hero.birthDate = birthDate;
        if (deathDate) res.hero.deathDate = deathDate;
        if (description) res.hero.description = description;
        if (values) res.hero.values = values.split(',').map(v => v.trim());
        
        if (req.file) {
            // Delete old image if exists
            const oldImagePath = path.join(__dirname, '../uploads', res.hero.image);
            if (fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath);
            }
            res.hero.image = 'images/' + req.file.filename;
        }

        const updatedHero = await res.hero.save();
        res.json(updatedHero);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE hero
router.delete('/:id', getHero, async (req, res) => {
    try {
        // Delete the image file
        const imagePath = path.join(__dirname, '../uploads', res.hero.image);
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }
        
        await res.hero.remove();
        res.json({ message: 'Hero deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Middleware to get hero by ID
async function getHero(req, res, next) {
    let hero;
    try {
        hero = await Hero.findById(req.params.id);
        if (hero == null) {
            return res.status(404).json({ message: 'Cannot find hero' });
        }
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }

    res.hero = hero;
    next();
}

module.exports = router;
