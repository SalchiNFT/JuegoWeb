// server.js

const express = require('express');
const path = require('path'); // Para manejar rutas estáticas
const connectDB = require('./config/db'); // Importa la función de conexión de Atlas

// 🚨 Importa las rutas de la API de personajes
const characterRoutes = require('./routes/characterRoutes'); 

const app = express();

// 1. Conectar a MongoDB Atlas
connectDB();

// 2. Middleware para parsear JSON (necesario para las peticiones POST/PUT)
app.use(express.json());

// 3. Servir archivos estáticos del Frontend
// La carpeta 'public' se convierte en la raíz del servidor web (/)
app.use(express.static(path.join(__dirname, 'public')));


// 4. Configurar las rutas de la API (Backend)
// Todas las peticiones a /api/characters serán manejadas por characterRoutes
app.use('/api/characters', characterRoutes);


// 5. Configurar la página de inicio (ruta /)
// Redirige al módulo Village, que es la página principal
app.get('/', (req, res) => {
    // Si la carpeta Village está dentro de public, la ruta absoluta funciona
    res.sendFile(path.join(__dirname, 'public', 'Village', 'Village.html'));
});


// 6. Iniciar el servidor
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor Express corriendo en el puerto ${PORT}`);
    console.log(`Accede al juego en: http://localhost:${PORT}`);
});