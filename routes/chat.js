const express = require("express")
const router = express.Router();
const { chat } = require("../controllers/chatController")

// Chat route
router.post("/", chat);

module.exports = router;