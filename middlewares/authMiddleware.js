// middlewares/authMiddleware.js

// Middleware para verificar si un usuario está autenticado
const protect = (req, res, next) => {
    // Passport añade la función isAuthenticated() al objeto req
    if (req.isAuthenticated()) {
        // Si el usuario está logueado, continuamos con la siguiente función (next())
        // El req.user ahora contiene los datos del usuario logueado (incluido el _id)
        next();
    } else {
        // Si el usuario no está logueado, denegamos el acceso (Código 401 Unauthorized)
        res.status(401).json({ message: 'No autorizado, debe iniciar sesión.' });
        // En el Frontend, esto debería redirigir a la página de login.
    }
};

module.exports = { protect };