// models/Character.js

const mongoose = require('mongoose');

const CharacterSchema = new mongoose.Schema({
    // Identificador único generado por MongoDB (_id)

    name: {
        type: String,
        required: true,
        trim: true,
    },
    playerAtk: {
        type: [String], // Array de strings (ej: ["Fuego", "Agua", "Tierra"])
        required: true,
        validate: [arrayLimit, 'playerAtk debe contener exactamente 3 elementos'],
    },
    playerDef: {
        type: [String], // Array de strings (ej: ["Escudo Fuego", "Escudo Agua", "Escudo Tierra"])
        required: true,
        validate: [arrayLimit, 'playerDef debe contener exactamente 3 elementos'],
    },
    hp: {
        type: Number,
        default: 10,
    },
    // Añadiremos más campos aquí a medida que el juego evolucione (inventario, nivel, etc.)
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

function arrayLimit(val) {
    return val.length === 3;
}

module.exports = mongoose.model('Character', CharacterSchema);