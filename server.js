// server.js

const express = require('express');
const path = require('path');
const connectDB = require('./config/db'); 

// 🚨 LIBRERÍAS DE SEGURIDAD (Nuevas)
const session = require('express-session');
const passport = require('passport'); 

const app = express();
const authRoutes = require('./routes/authRoutes'); 
const characterRoutes = require('./routes/characterRoutes'); 

// 1. Conectar a MongoDB Atlas
connectDB();

// 2. Middleware para parsear JSON
app.use(express.json());

// 🚨 3. CONFIGURACIÓN DE SESIÓN
app.use(session({
    secret: 'CLAVE_SECRETA_MUY_LARGA_Y_COMPLEJA', // CLAVE MUY IMPORTANTE
    resave: false, 
    saveUninitialized: false, 
    cookie: { maxAge: 1000 * 60 * 60 * 24 } 
}));

// 🚨 4. CONFIGURACIÓN DE PASSPORT
app.use(passport.initialize());
app.use(passport.session());

// 5. Servir archivos estáticos del Frontend
app.use(express.static(path.join(__dirname, 'public')));


// 6. Configurar las rutas de la API
app.use('/api/auth', authRoutes); 
app.use('/api/characters', characterRoutes);


// 7. Configurar la página de inicio (ruta /)
app.get('/', (req, res) => {
    // 🚨 Nueva lógica: Si hay una sesión activa de Passport, va a Village. Si no, va a Login.
    if (req.isAuthenticated && req.isAuthenticated()) {
        res.sendFile(path.join(__dirname, 'public', 'Village', 'Village.html'));
    } else {
        res.sendFile(path.join(__dirname, 'public', 'Auth', 'Login.html'));
    }
});


// 8. Iniciar el servidor
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor Express corriendo en el puerto ${PORT}`);
    console.log(`Accede al juego en: http://localhost:${PORT}`);
});