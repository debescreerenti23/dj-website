const express = require("express");
const cors = require("cors");
const sessionsRoutes = require("./routes/sessions.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Servidor DJ funcionando 🎧" });
});

app.use("/sessions", sessionsRoutes);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
