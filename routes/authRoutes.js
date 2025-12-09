// routes/authRoutes.js (MODIFICADO)

const express = require('express');
const router = express.Router();
const User = require('../models/User'); 
const passport = require('passport'); // 🚨 Importar Passport
const LocalStrategy = require('passport-local').Strategy; // 🚨 Importar estrategia local

// ------------------------------------------
// 🚨 CONFIGURACIÓN DE PASSPORT PARA SERIALIZAR/DESERIALIZAR
// ------------------------------------------

// Guarda el ID del usuario en la sesión
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Recupera el objeto del usuario a partir del ID guardado en la sesión
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

// ------------------------------------------
// 🚨 ESTRATEGIA LOCAL DE LOGIN (Verificación de credenciales)
// ------------------------------------------
passport.use(new LocalStrategy(
    async (username, password, done) => {
        try {
            const user = await User.findOne({ username: username });

            if (!user) {
                return done(null, false, { message: 'Usuario no encontrado.' });
            }
            if (!(await user.matchPassword(password))) {
                return done(null, false, { message: 'Contraseña incorrecta.' });
            }

            // Éxito: Retorna el objeto del usuario
            return done(null, user);

        } catch (err) {
            return done(err);
        }
    }
));

// ------------------------------------------
// RUTA 1: REGISTRAR un nuevo usuario (POST /api/auth/register) - Se mantiene igual
// ------------------------------------------
router.post('/register', async (req, res) => {
    // ... (El código de registro se mantiene igual, crea el usuario)

    // Código de registro...
    const { username, password } = req.body;
    try {
        let user = await User.findOne({ username });
        if (user) {
            return res.status(400).json({ message: 'El nombre de usuario ya está en uso.' });
        }
        user = new User({ username, password });
        await user.save();
        
        // 🚨 Tras el registro exitoso, inicia sesión inmediatamente
        req.login(user, (err) => {
            if (err) return res.status(500).json({ message: 'Error al iniciar sesión después del registro.' });
            res.status(201).json({ 
                message: 'Registro e inicio de sesión exitoso.', 
                userId: user._id, 
                username: user.username
            });
        });

    } catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: 'Error de validación', errors: messages });
        }
        console.error('Error en el registro:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});


// ------------------------------------------
// RUTA 2: INICIAR SESIÓN (POST /api/auth/login) - Usa Passport
// ------------------------------------------
router.post('/login', passport.authenticate('local', {
    failureMessage: true // Permite que la estrategia local maneje los mensajes de error
}), (req, res) => {
    // Si la autenticación con Passport fue exitosa, llegamos aquí.
    // req.user contiene el objeto del usuario
    res.json({ 
        message: 'Inicio de sesión exitoso.', 
        userId: req.user._id,
        username: req.user.username
    });
});


// ------------------------------------------
// RUTA 3: CERRAR SESIÓN (GET /api/auth/logout)
// ------------------------------------------
router.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) { return res.status(500).json({ message: 'Error al cerrar sesión.' }); }
        res.json({ message: 'Sesión cerrada exitosamente.' });
    });
});

module.exports = router;