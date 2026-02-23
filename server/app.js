const express = require("express");
const cors = require("cors");
const path = require("path");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");

const app = express();

// --- CONFIGURACIÓN ---
const MONGO_URI = process.env.MONGO_URI; 
const SECRET_KEY = process.env.JWT_SECRET || "clave_secreta_javilindj_2024";
const PORT = process.env.PORT || 3000;

// --- MIDDLEWARES (Importante: express.json() debe ir antes de las rutas) ---
app.use(cors());
app.use(express.json());

// Servir archivos estáticos del cliente
// Subimos un nivel (..) porque app.js está en /server y queremos ir a /client
app.use(express.static(path.join(__dirname, "..", "client")));

// --- CONEXIÓN A MONGODB ATLAS ---
if (!MONGO_URI) {
    console.error("❌ ERROR: La variable de entorno MONGO_URI no está configurada.");
} else {
    mongoose.connect(MONGO_URI)
        .then(() => console.log("✅ Conectado a MongoDB Atlas con éxito"))
        .catch(err => console.error("❌ Error de conexión a MongoDB:", err));
}

// --- MODELO DE DATOS (Ajustado a tu main.js) ---
const sessionSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, default: "" },
    year: { type: String, required: true },
    downloadUrl: { type: String, required: true }, // Coincide con main.js
    downloads: { type: Number, default: 0 }
});

const Session = mongoose.model("Session", sessionSchema);

// --- USUARIO ADMIN (Cámbialo si quieres) ---
const adminUser = {
    username: "admin",
    passwordHash: bcrypt.hashSync("1234", 10) 
};

// --- MIDDLEWARE DE PROTECCIÓN ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: "No autorizado: falta token" });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ message: "Sesión expirada o inválida" });
        req.user = user;
        next();
    });
};

// --- RUTAS DE API ---

// Login
app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    if (username !== adminUser.username) {
        return res.status(401).json({ message: "Usuario incorrecto" });
    }
    const validPassword = await bcrypt.compare(password, adminUser.passwordHash);
    if (!validPassword) {
        return res.status(401).json({ message: "Password incorrecta" });
    }
    const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: "24h" });
    res.json({ token });
});

// Obtener todas las sesiones
app.get("/sessions", async (req, res) => {
    try {
        const sessions = await Session.find().sort({ year: -1 });
        // Mapeamos para que _id de Mongo sea id en el frontend
        const result = sessions.map(s => ({
            id: s._id,
            title: s.title,
            description: s.description,
            year: s.year,
            downloadUrl: s.downloadUrl,
            downloads: s.downloads
        }));
        res.json(result);
    } catch (err) {
        res.status(500).json({ message: "Error al leer la base de datos" });
    }
});

// Crear sesión (POST)
app.post("/sessions", authenticateToken, async (req, res) => {
    try {
        console.log("Datos recibidos en POST:", req.body); // Log para depurar
        const newSession = new Session(req.body);
        await newSession.save();
        res.status(201).json(newSession);
    } catch (err) {
        console.error("Error al crear sesión:", err.message);
        res.status(400).json({ message: "Error: Campos incompletos o incorrectos", error: err.message });
    }
});

// Actualizar sesión (PUT)
app.put("/sessions/:id", authenticateToken, async (req, res) => {
    try {
        const updated = await Session.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updated);
    } catch (err) {
        res.status(400).json({ message: "Error al actualizar" });
    }
});

// Borrar sesión (DELETE)
app.delete("/sessions/:id", authenticateToken, async (req, res) => {
    try {
        await Session.findByIdAndDelete(req.params.id);
        res.json({ message: "Sesión eliminada" });
    } catch (err) {
        res.status(400).json({ message: "Error al eliminar" });
    }
});

// Contador de descargas
app.post("/sessions/:id/download", async (req, res) => {
    try {
        await Session.findByIdAndUpdate(req.params.id, { $inc: { downloads: 1 } });
        res.json({ success: true });
    } catch (err) {
        res.status(500).send("Error");
    }
});

// --- SERVIR FRONTEND ---
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "client", "index.html"));
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor Pro corriendo en puerto ${PORT}`);
});