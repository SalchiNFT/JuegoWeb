// routes/characterRoutes.js

const express = require('express');
const router = express.Router();
const Character = require('../models/Character'); 
const { protect } = require('../middlewares/authMiddleware'); // Importar el Middleware de protección

const MAX_CHARACTERS = 10; 

// ------------------------------------------
// RUTA 1: CREAR un nuevo personaje (POST /api/characters)
// PROTEGIDA: Solo usuarios autenticados pueden usarla.
// ------------------------------------------
router.post('/', protect, async (req, res) => {
    // 🚨 OBTENEMOS userId DIRECTAMENTE DE LA SESIÓN DE PASSPORT
    const userId = req.user._id; 
    
    // El Frontend solo envía los datos del personaje
    const { name, playerAtk, playerDef } = req.body; 

    // Validación básica de datos
    if (!name || !playerAtk || !playerDef) {
         return res.status(400).json({ message: 'Faltan campos obligatorios para crear el personaje.' });
    }

    try {
        // VALIDACIÓN DE LÍMITE DE SLOTS POR USUARIO
        const characterCount = await Character.countDocuments({ userId: userId });
        if (characterCount >= MAX_CHARACTERS) {
            return res.status(403).json({ 
                message: `Límite máximo de personajes alcanzado (${MAX_CHARACTERS}) para este usuario.`
            });
        }
        
        // Creación con el userId seguro inyectado
        const newCharacter = new Character({
            userId,
            name,
            playerAtk,
            playerDef,
            hp: 10 // Valor por defecto
        });
        
        const character = await newCharacter.save();
        
        res.status(201).json({ 
            message: "Personaje creado exitosamente",
            characterId: character._id,
            name: character.name
        });

    } catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ 
                message: "Error de validación al crear el personaje", 
                errors: messages 
            });
        }
        console.error('Error al crear personaje:', error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
});


// ------------------------------------------
// RUTA 2: OBTENER TODOS los personajes de UN USUARIO (GET /api/characters)
// PROTEGIDA: Obtiene el userId de la sesión.
// ------------------------------------------
router.get('/', protect, async (req, res) => {
    // 🚨 OBTENEMOS userId DIRECTAMENTE DE LA SESIÓN DE PASSPORT
    const userId = req.user._id; 
    
    try {
        // FILTRO POR USUARIO: Busca solo los personajes que coinciden con el userId
        const characters = await Character.find({ userId: userId }).sort({ createdAt: 1 });
        
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
// RUTA 3: OBTENER un personaje por ID (GET /api/characters/:id)
// PROTEGIDA: Asegura que el personaje solicitado pertenezca al usuario.
// ------------------------------------------
router.get('/:id', protect, async (req, res) => {
    const userId = req.user._id; 
    
    try {
        // Buscar por ID Y por userId
        const character = await Character.findOne({ 
            _id: req.params.id, 
            userId: userId 
        });
        
        if (!character) {
            // Si no lo encuentra, es 404 o 403 (No existe o no es tuyo)
            return res.status(404).json({ message: 'Personaje no encontrado o no autorizado' });
        }
        
        res.json(character);

    } catch (error) {
        console.error('Error al obtener personaje:', error);
        // Error común si el ID es malformado (ej: 500)
        res.status(500).json({ 
            message: 'Error interno del servidor', 
            error: error.message 
        });
    }
});


// ------------------------------------------
// RUTA 4: ACTUALIZAR el HP de un personaje (PUT /api/characters/:id)
// PROTEGIDA: Asegura que el personaje solicitado pertenezca al usuario.
// ------------------------------------------
router.put('/:id', protect, async (req, res) => {
    const userId = req.user._id;
    const { hp } = req.body; 

    // Validar que el HP sea un número
    if (typeof hp !== 'number' || hp < 0) {
        return res.status(400).json({ message: 'HP inválido.' });
    }

    try {
        // Actualizar buscando por ID Y por userId
        const character = await Character.findOneAndUpdate(
            { _id: req.params.id, userId: userId }, // Criterios de búsqueda
            { hp: hp }, // Datos a actualizar
            { new: true } // Devolver el documento actualizado
        );
        
        if (!character) {
            return res.status(404).json({ message: 'Personaje no encontrado o no autorizado para actualizar' });
        }
        
        res.json({
            message: "HP actualizado correctamente",
            newHP: character.hp
        });

    } catch (error) {
        console.error('Error al actualizar personaje:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});


module.exports = router;