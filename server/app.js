const express = require("express");
const cors = require("cors");
const path = require("path");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");

const app = express();

// --- CONFIGURACIÓN DE VARIABLES DE ENTORNO ---
// En Render/Railway configurarás MONGO_URI y JWT_SECRET
const MONGO_URI = process.env.MONGO_URI; 
const SECRET_KEY = process.env.JWT_SECRET || "clave_temporal_local";
const PORT = process.env.PORT || 3000;

// --- CONEXIÓN A MONGODB ---
if (!MONGO_URI) {
    console.error("❌ ERROR: La variable MONGO_URI no está definida.");
} else {
    mongoose.connect(MONGO_URI)
        .then(() => console.log("✅ Conectado a MongoDB Atlas"))
        .catch(err => console.error("❌ Error de conexión a MongoDB:", err));
}

// --- MODELO DE DATOS (SCHEMA) ---
const sessionSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: String,
    year: { type: String, required: true },
    downloadUrl: { type: String, required: true },
    downloads: { type: Number, default: 0 }
});

const Session = mongoose.model("Session", sessionSchema);

// --- MIDDLEWARES ---
app.use(cors());
app.use(express.json());
// Servir estáticos desde la carpeta client (ajusta la ruta si es necesario)
app.use(express.static(path.join(__dirname, "..", "client")));

// --- USUARIO ADMIN (Estático por ahora) ---
const adminUser = {
    username: "admin",
    passwordHash: bcrypt.hashSync("1234", 10) // Cambia "1234" por tu pass preferida
};

// --- MIDDLEWARE DE AUTENTICACIÓN ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: "No autorizado" });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ message: "Token expirado o inválido" });
        req.user = user;
        next();
    });
};

// --- RUTAS DE AUTENTICACIÓN ---
app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    if (username !== adminUser.username) {
        return res.status(401).json({ message: "Usuario no encontrado" });
    }
    const validPassword = await bcrypt.compare(password, adminUser.passwordHash);
    if (!validPassword) {
        return res.status(401).json({ message: "Contraseña incorrecta" });
    }
    const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: "24h" });
    res.json({ token });
});

// --- RUTAS DE SESIONES (CRUD) ---

// 1. Obtener todas (Pública)
app.get("/sessions", async (req, res) => {
    try {
        const sessions = await Session.find().sort({ year: -1 });
        // Transformamos _id a id para que el frontend no sufra cambios
        const formattedSessions = sessions.map(s => ({
            id: s._id,
            title: s.title,
            description: s.description,
            year: s.year,
            downloadUrl: s.downloadUrl,
            downloads: s.downloads
        }));
        res.json(formattedSessions);
    } catch (err) {
        res.status(500).json({ message: "Error al obtener sesiones" });
    }
});

// 2. Crear nueva (Protegida)
app.post("/sessions", authenticateToken, async (req, res) => {
    try {
        const newSession = new Session(req.body);
        await newSession.save();
        res.status(201).json(newSession);
    } catch (err) {
        res.status(400).json({ message: "Error al crear sesión" });
    }
});

// 3. Editar sesión (Protegida)
app.put("/sessions/:id", authenticateToken, async (req, res) => {
    try {
        const updatedSession = await Session.findByIdAndUpdate(
            req.params.id, 
            req.body, 
            { new: true }
        );
        res.json(updatedSession);
    } catch (err) {
        res.status(400).json({ message: "Error al actualizar" });
    }
});

// 4. Eliminar sesión (Protegida)
app.delete("/sessions/:id", authenticateToken, async (req, res) => {
    try {
        await Session.findByIdAndDelete(req.params.id);
        res.json({ message: "Sesión eliminada de la base de datos" });
    } catch (err) {
        res.status(400).json({ message: "Error al eliminar" });
    }
});

// 5. Incrementar descargas (Pública)
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