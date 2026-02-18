const db = require("../db/database");

exports.getSessions = (req, res) => {
  db.all("SELECT * FROM sessions", [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
};

exports.createSession = (req, res) => {
  const { title, description, year, downloadUrl } = req.body;

  if (!title || !year || !downloadUrl) {
    return res.status(400).json({ error: "Faltan campos obligatorios" });
  }

  const sql = `
    INSERT INTO sessions (title, description, year, downloadUrl)
    VALUES (?, ?, ?, ?)
  `;

  db.run(sql, [title, description, year, downloadUrl], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.status(201).json({
      id: this.lastID,
      title,
      description,
      year,
      downloadUrl,
    });
  });
};

exports.createSession = (req, res) => {
  const { title, description, year, downloadUrl } = req.body;

  if (!title || !year || !downloadUrl) {
    return res.status(400).json({ error: "Faltan campos obligatorios" });
  }

  const sql = `
    INSERT INTO sessions (title, description, year, downloadUrl)
    VALUES (?, ?, ?, ?)
  `;

  db.run(sql, [title, description, year, downloadUrl], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.status(201).json({
      id: this.lastID,
      title,
      description,
      year,
      downloadUrl,
    });
  });
};


exports.deleteSession = (req, res) => {
  const { id } = req.params;

  db.run("DELETE FROM sessions WHERE id = ?", [id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: "Sesión no encontrada" });
    }

    res.json({ message: "Sesión eliminada correctamente" });
  });
};


exports.updateSession = (req, res) => {
  const { id } = req.params;
  const { title, description, year, downloadUrl } = req.body;

  const sql = `
    UPDATE sessions
    SET title = ?, description = ?, year = ?, downloadUrl = ?
    WHERE id = ?
  `;

  db.run(sql, [title, description, year, downloadUrl, id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: "Sesión no encontrada" });
    }

    res.json({ message: "Sesión actualizada correctamente" });
  });
};
