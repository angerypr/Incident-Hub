const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const User = require('./models/user');

const app = express();
const PORT = 3000;

app.use(express.json());

mongoose.connect('mongodb://127.0.0.1:27017/incidenthub')
.then(() => console.log("MongoDB conectado"))
.catch(err => console.log(err));

app.use(express.static(path.join(__dirname, '../frontend/public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/public/login.html'));
});

// REGISTER
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({ message: "El usuario ya existe" });
        }

        const newUser = new User({ name, email, password });
        await newUser.save();

        res.status(201).json({ message: "Usuario registrado exitosamente" });

    } catch (error) {
        res.status(500).json({ message: "Error al registrar usuario" });
    }
});

// LOGIN
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (!user || user.password !== password) {
            return res.status(401).json({ message: "Credenciales inválidas" });
        }

        res.json({
            message: "Login exitoso",
            token: "token-simple"
        });

    } catch (error) {
        res.status(500).json({ message: "Error en login" });
    }
});

// Servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
