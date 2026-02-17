const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.json([
    {
      id: 1,
      title: "Session Tech House 2025",
      year: 2025,
      downloadUrl: "https://drive.google.com/..."
    }
  ]);
});

module.exports = router;
