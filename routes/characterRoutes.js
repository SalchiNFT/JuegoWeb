// routes/characterRoutes.js

const express = require('express');
const router = express.Router();

const Character = require('../models/Character'); 

const MAX_CHARACTERS = 10; // 🚨 Límite máximo de personajes por cuenta

// ------------------------------------------
// RUTA 1: CREAR un nuevo personaje (POST /api/characters)
// ------------------------------------------
router.post('/', async (req, res) => {
    try {
        // 🚨 VALIDACIÓN DE LÍMITE DE SLOTS (Nueva Lógica)
        const characterCount = await Character.countDocuments();
        if (characterCount >= MAX_CHARACTERS) {
            return res.status(403).json({ 
                message: `Límite máximo de personajes alcanzado (${MAX_CHARACTERS}).`
            });
        }
        
        // Si no supera el límite, procede con la creación
        const newCharacter = new Character(req.body);
        const character = await newCharacter.save();
        
        res.status(201).json({ 
            message: "Personaje creado exitosamente",
            characterId: character._id,
            name: character.name
        });

    } catch (error) {
        // Manejar errores de validación (ej: no 2 elementos, nombre demasiado largo)
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ 
                message: "Error de validación al crear el personaje", 
                errors: messages 
            });
        }

        console.error('Error al crear personaje:', error);
        res.status(500).json({ 
            message: "Error interno del servidor", 
            error: error.message 
        });
    }
});


// ------------------------------------------
// RUTA 3: OBTENER TODOS los personajes (GET /api/characters) - Necesario para el Frontend
// ------------------------------------------
router.get('/', async (req, res) => {
    try {
        // Busca todos los personajes y los ordena por fecha de creación
        const characters = await Character.find().sort({ createdAt: 1 });
        
        res.json(characters);

    } catch (error) {
        console.error('Error al obtener personajes:', error);
        res.status(500).json({ 
            message: 'Error en el servidor', 
            error: error.message 
        });
    }
});

// ------------------------------------------
// RUTA 4: OBTENER un personaje por ID (GET /api/characters/:id) - Se mantiene
// ------------------------------------------
router.get('/:id', async (req, res) => {
    try {
        const character = await Character.findById(req.params.id);
        
        if (!character) {
            return res.status(404).json({ message: 'Personaje no encontrado' });
        }
        
        res.json(character);

    } catch (error) {
        console.error('Error al obtener personaje:', error);
        res.status(500).json({ 
            message: 'Error en el servidor', 
            error: error.message 
        });
    }
});


// ------------------------------------------
// RUTA 5: ACTUALIZAR el HP de un personaje (PUT /api/characters/:id) - Se mantiene
// ------------------------------------------
router.put('/:id', async (req, res) => {
    try {
        const { hp } = req.body; 

        const character = await Character.findByIdAndUpdate(
            req.params.id,
            { hp: hp },
            { new: true }
        );
        
        if (!character) {
            return res.status(404).json({ message: 'Personaje no encontrado para actualizar' });
        }
        
        res.json({
            message: "HP actualizado correctamente",
            newHP: character.hp
        });

    } catch (error) {
        console.error('Error al actualizar personaje:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});


module.exports = router;