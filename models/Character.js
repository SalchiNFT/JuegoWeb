// models/Character.js

const mongoose = require('mongoose');

// Función de validación: Asegura que el array tenga EXACTAMENTE 2 elementos.
function arrayLimit(val) {
    return val.length === 2;
}

const CharacterSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: [20, 'El nombre no puede exceder los 20 caracteres.']
    },
    // 🚨 VALIDACIÓN ACTUALIZADA: Requiere 2 elementos
    playerAtk: {
        type: [String], 
        required: true,
        validate: [arrayLimit, 'playerAtk debe contener exactamente 2 elementos'],
    },
    // 🚨 VALIDACIÓN ACTUALIZADA: Requiere 2 elementos
    playerDef: {
        type: [String], 
        required: true,
        validate: [arrayLimit, 'playerDef debe contener exactamente 2 elementos'],
    },
    hp: {
        type: Number,
        default: 10,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});


module.exports = mongoose.model('Character', CharacterSchema);