const path = require("path");


const express = require("express");
const cors = require("cors");
const sessionsRoutes = require("./routes/sessions.routes");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../client")));

const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const SECRET_KEY = "supersecreto";

// Usuario admin fijo
const adminUser = {
  username: "admin",
  passwordHash: bcrypt.hashSync("1234", 10)
};

// Ruta login
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (username !== adminUser.username) {
    return res.status(401).json({ message: "Credenciales incorrectas" });
  }

  const validPassword = await bcrypt.compare(password, adminUser.passwordHash);

  if (!validPassword) {
    return res.status(401).json({ message: "Credenciales incorrectas" });
  }

  const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: "1h" });

  res.json({ token });
});

app.get("/", (req, res) => {
  res.json({ message: "Servidor DJ funcionando 🎧" });
});

app.use("/sessions", sessionsRoutes);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
