// config/db.js

const mongoose = require('mongoose');

// Tu URI de ATLAS guardada
const ATLAS_URI = "mongodb+srv://surenfxs:surenfxs@cluster0.sxw813x.mongodb.net/miniRPG?retryWrites=true&w=majority"; 

const connectDB = async () => {
    try {
        await mongoose.connect(ATLAS_URI); 
        // 🚨 Se eliminaron las opciones obsoletas (useNewUrlParser, useUnifiedTopology, etc.)

        console.log('MongoDB Atlas: Conexión exitosa a la base de datos miniRPG.');

    } catch (err) {
        console.error('ERROR AL CONECTAR CON MONGO ATLAS:', err.message);
        // Salir del proceso con fallo (código 1)
        process.exit(1); 
    }
};

module.exports = connectDB;