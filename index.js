const express = require('express');
const jwt = require('jsonwebtoken');
const app = express();

// Sua chave secreta
const JWT_SECRET = process.env.JWT_SECRET || "SUA_CHAVE_SUPER_SECRETA_E_UNICA_123";

app.get('/manifest.json', (req, res) => {
  const token = req.query.token;

  if (!token) {
    return res.status(401).json({ error: "Token não fornecido" });
  }

  try {
    // O jwt.verify checa a chave E verifica se o 'exp' (tempo) já venceu
    const decoded = jwt.verify(token, JWT_SECRET);

    // Se o token for válido e NÃO tiver expirado, entrega o manifest do Stremio
    return res.json({
      id: "org.meustremio.proxy",
      version: "1.0.0",
      name: "Meu Proxy Stremio",
      description: "Addon privado com autenticação",
      resources: ["catalog", "stream"],
      types: ["movie", "series"],
      catalogs: []
    });

  } catch (err) {
    // Se o token tiver expirado ou for inválido, cai AQUI e bloqueia!
    return res.status(401).send("Acesso negado: Token expirado ou inválido.");
  }
});
