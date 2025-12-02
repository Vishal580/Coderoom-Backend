const express = require("express");
const router = express.Router();
const axios = require("axios");

const languageConfig = {
  python3: { versionIndex: "3" },
  java: { versionIndex: "3" },
  javascript: { versionIndex: "3" },
  cpp: { versionIndex: "4" },
  nodejs: { versionIndex: "3" },
  c: { versionIndex: "4" },
  ruby: { versionIndex: "3" },
  go: { versionIndex: "3" },
  scala: { versionIndex: "3" },
  bash: { versionIndex: "3" },
  sql: { versionIndex: "3" },
  pascal: { versionIndex: "2" },
  csharp: { versionIndex: "3" },
  php: { versionIndex: "3" },
  swift: { versionIndex: "3" },
  rust: { versionIndex: "3" },
  r: { versionIndex: "3" },
};

const compile = async (req, res) => {
  const { code, language } = req.body;

  // normalize and validate language (frontend may send "c++" and "nodejs/javascript")
  const normalizedLanguage =
    language === "c++" ? "cpp" : language === "nodejs/javascript" ? "nodejs" : language;
  if (!languageConfig[normalizedLanguage]) {
    return res.status(400).json({ error: "Unsupported language" });
  }

  // use correct env var names — ensure these exist in backend/.env
  const clientId = process.env.jDoodle_clientId1 || process.env.jDoodle_clientId2;
  const clientSecret = process.env.jDoodle_clientSecret1 || process.env.jDoodle_clientSecret2;
  if (!clientId || !clientSecret) {
    console.error("Missing JDoodle credentials (check backend/.env)");
    return res.status(500).json({ error: "Server configuration error" });
  }

  try {
    const response = await axios.post("https://api.jdoodle.com/v1/execute", {
      script: code,
      language: normalizedLanguage,
      versionIndex: languageConfig[normalizedLanguage].versionIndex,
      clientId,
      clientSecret,
    });

    return res.json(response.data);
  } catch (error) {
    // log JDoodle response body when available to help debugging
    console.error("JDoodle error:", error.response?.data || error.message);
    const status = error.response?.status || 500;
    return res
      .status(status)
      .json({ error: error.response?.data?.error || "Failed to compile code" });
  }
}

module.exports = { compile };