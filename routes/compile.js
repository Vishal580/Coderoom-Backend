const express = require("express");
const router = express.Router();
const { compile } = require("../controllers/compileController");

// Compile route
router.post("/", compile);

module.exports = router;