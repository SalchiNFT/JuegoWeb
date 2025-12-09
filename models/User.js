// models/User.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'El nombre de usuario es obligatorio.'],
        unique: true, // El nombre de usuario debe ser único
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
        // Este campo es opcional, solo se usa si se registran con Google
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// 🚨 PRE-SAVE HOOK: Hashear la contraseña antes de guardar
UserSchema.pre('save', async function (next) {
    // Solo hasheamos si la contraseña ha sido modificada (o es nueva)
    if (!this.isModified('password')) {
        return next();
    }
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

// 🚨 MÉTODO PARA COMPARAR CONTRASEÑAS
UserSchema.methods.matchPassword = async function (enteredPassword) {
    // Compara la contraseña ingresada con la contraseña hasheada en la BD
    return await bcrypt.compare(enteredPassword, this.password);
};


module.exports = mongoose.model('User', UserSchema);