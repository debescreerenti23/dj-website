const express = require("express");
const router = express.Router();
const sessionsController = require("../controllers/sessions.controller");

router.get("/", sessionsController.getSessions);

module.exports = router;

router.post("/", sessionsController.createSession);

router.delete("/:id", sessionsController.deleteSession);

router.put("/:id", sessionsController.updateSession);
