const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;

// Chave secreta
const SEGREDO = 'SUA_CHAVE_SUPER_SECRETA_E_UNICA_123';

// APENAS A FONTE MAIS RÁPIDA (Sem sobrecarregar o Render)
const ADDON_FONTE = 'https://torrentio.strem.fun/brazuca';

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private, max-age=0');
  next();
});

// Manifesto
app.get('/:token/manifest.json', (req, res) => {
  res.json({
    id: 'org.meustremio.superproxy.v5',
    version: '5.0.0',
    name: 'Super Proxy All-in-One',
    description: 'Proxy direto e rápido de streaming',
    resources: ['stream'],
    types: ['movie', 'series', 'anime', 'tv'],
    idPrefixes: ['tt', 'kitsu', 'tv'],
    catalogs: []
  });
});

// Rota de busca de filmes com repasse ultra-rápido
app.get('/:token/stream/:type/:id.json', async (req, res) => {
  const { token, type, id } = req.params;

  // Validação do Token
  try {
    jwt.verify(token, SEGREDO);
  } catch (err) {
    return res.json({ streams: [] });
  }

  // Busca direta em 1 única fonte rápida
  try {
    const response = await axios.get(`${ADDON_FONTE}/stream/${type}/${id}.json`, {
      timeout: 3500,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    if (response.data && Array.isArray(response.data.streams)) {
      return res.json({ streams: response.data.streams });
    }
  } catch (error) {
    console.log('Erro ao buscar streams:', error.message);
  }

  return res.json({ streams: [] });
});

app.listen(PORT, () => {
  console.log(`🚀 Proxy ultra-rápido rodando na porta ${PORT}`);
});
