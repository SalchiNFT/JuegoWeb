// models/User.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'El nombre de usuario es obligatorio.'],
        unique: true, 
        trim: true,
        minlength: [3, 'El nombre de usuario debe tener al menos 3 caracteres.']
    },
    password: {
        type: String,
        required: [true, 'La contraseña es obligatoria.'],
        minlength: [6, 'La contraseña debe tener al menos 6 caracteres.']
    },
    googleId: {
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// 🚨 HOOK DE PRE-GUARDADO (ASÍNCRONO): Usa async/await, no llama a next()
// Mongoose detecta la función sin 'next' y la espera automáticamente.
UserSchema.pre('save', async function() {
    // Solo hasheamos si la contraseña ha sido modificada (o es nueva)
    if (!this.isModified('password')) {
        return;
    }
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    } catch (err) {
        // En un hook asíncrono, lanzar el error detiene el proceso de guardado.
        throw new Error('Error al hashear la contraseña: ' + err.message);
    }
});


// MÉTODO PARA COMPARAR CONTRASEÑAS (Se mantiene igual)
UserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};


module.exports = mongoose.model('User', UserSchema);