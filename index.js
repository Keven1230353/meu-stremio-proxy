const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;

const SEGREDO = 'SUA_CHAVE_SUPER_SECRETA_E_UNICA_123';

// Addons base configurados
const ADDONS = [
  'https://torrentio.strem.fun/brazuca',
  'https://froststream.clouatteam.com',
  'https://comet.elfhosted.com',
  'https://cyberflix.1337x.b33p.club'
];

// Anti-cache e liberação total de CORS para a API do Stremio
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private, max-age=0');
  next();
});

// Validador de Token JWT
function verificarAcesso(req, res, next) {
  const token = req.params.token || req.query.token;

  if (!token) {
    return res.json({ streams: [] });
  }

  try {
    jwt.verify(token, SEGREDO);
    next();
  } catch (err) {
    return res.json({ streams: [] });
  }
}

// 1. Rota do Manifest
app.get('/:token/manifest.json', verificarAcesso, (req, res) => {
  res.json({
    id: 'org.meustremio.multiproxy',
    version: '1.0.0',
    name: 'Meu Proxy Multi-Addon',
    description: 'Proxy unificado de streaming',
    resources: ['stream'],
    types: ['movie', 'series', 'anime'],
    catalogs: []
  });
});

// 2. Rota dos Streams (com busca paralela rápida e tratamento de erros)
app.get('/:token/stream/:type/:id.json', verificarAcesso, async (req, res) => {
  const { type, id } = req.params;

  const requests = ADDONS.map(async (baseUrl) => {
    try {
      // Timeout de 4 segundos por addon para evitar travamento no Stremio
      const response = await axios.get(`${baseUrl}/stream/${type}/${id}.json`, {
        timeout: 4000,
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      if (response.data && Array.isArray(response.data.streams)) {
        return response.data.streams;
      }
    } catch (e) {
      return [];
    }
    return [];
  });

  try {
    const results = await Promise.all(requests);
    const allStreams = results.flat();
    return res.json({ streams: allStreams });
  } catch (err) {
    return res.json({ streams: [] });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor proxy rodando na porta ${PORT}`);
});
