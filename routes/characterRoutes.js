// routes/characterRoutes.js

const express = require('express');
const router = express.Router();
// 💡 RUTA CORREGIDA: ../models/Character 
// (Sale de routes/ y entra en models/, evitando cualquier prefijo 'Backend')
const Character = require('../models/Character'); 


// ------------------------------------------
// RUTA 1: CREAR un nuevo personaje (POST /api/characters)
// ------------------------------------------
router.post('/', async (req, res) => {
    try {
        const newCharacter = new Character(req.body);
        const character = await newCharacter.save();
        
        res.status(201).json({ 
            message: "Personaje creado exitosamente",
            characterId: character._id,
            name: character.name
        });

    } catch (error) {
        console.error('Error al crear personaje:', error);
        res.status(400).json({ 
            message: "Error al crear el personaje", 
            error: error.message 
        });
    }
});


// ------------------------------------------
// RUTA 2: OBTENER un personaje por ID (GET /api/characters/:id)
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
// RUTA 3: ACTUALIZAR el HP de un personaje (PUT /api/characters/:id)
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