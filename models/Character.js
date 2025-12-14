// models/Character.js

const mongoose = require('mongoose');

// Función de validación: Asegura que el array tenga EXACTAMENTE 2 elementos.
function arrayLimit(val) {
    return val.length === 2;
}

const CharacterSchema = new mongoose.Schema({
    // 🚨 Referencia al usuario propietario
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: [20, 'El nombre no puede exceder los 20 caracteres.']
    },

    playerAtk: {
        type: [String], 
        required: true,
        validate: [arrayLimit, 'playerAtk debe contener exactamente 2 elementos'],
    },

    playerDef: {
        type: [String], 
        required: true,
        validate: [arrayLimit, 'playerDef debe contener exactamente 2 elementos'],
    },

    hp: {
        type: Number,
        default: 10,
    },

    // 🔧 Estadísticas de trabajo / progreso
    stats: {
        workshop: { type: Number, default: 1 },
        fields: { type: Number, default: 1 },
        laboratory: { type: Number, default: 1 },
        arena: { type: Number, default: 1 },

        expedition: {
            woodcutting: { type: Number, default: 1 },
            leather: { type: Number, default: 1 },
            mining: { type: Number, default: 1 },
            quarry: { type: Number, default: 1 }
        }
    },

    // 🎨 Apariencia del personaje (avatar modular, sin imágenes)
    appearance: {
        hair: { type: Number, default: 0 },
        face: { type: Number, default: 0 },
        hoodie: { type: Number, default: 0 },
        pants: { type: Number, default: 0 },
        shoes: { type: Number, default: 0 }
    },

    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Character', CharacterSchema);
