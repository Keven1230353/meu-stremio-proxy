const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;

// Sua chave secreta (deve ser a mesma do jwt.io)
const SEGREDO = 'SUA_CHAVE_SUPER_SECRETA_E_UNICA_123';

// Addons base configurados
const ADDONS = [
  'https://torrentio.strem.fun/brazuca',
  'https://froststream.cloudatteam.com',
  'https://comet.elfhosted.com',
  'https://cyberflix.1337x.b33p.club'
];

// Anti-cache e liberação de CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private, max-age=0');
  next();
});

// 1. Rota do Manifest
app.get('/:token/manifest.json', (req, res) => {
  const token = req.params.token;

  // Validação rápida do JWT
  try {
    jwt.verify(token, SEGREDO);
  } catch (err) {
    return res.status(401).json({ err: 'Token inválido ou expirado' });
  }

  res.json({
    id: 'org.meustremio.multiproxy',
    version: '1.0.0',
    name: 'Meu Proxy Multi-Addon',
    description: 'Proxy unificado de streaming',
    resources: ['stream'],
    types: ['movie', 'series', 'anime'],
    idPrefixes: ['tt', 'kitsu'],
    catalogs: []
  });
});

// 2. Rota dos Streams
app.get('/:token/stream/:type/:id.json', async (req, res) => {
  const token = req.params.token;
  const { type, id } = req.params;

  // Validação do JWT
  try {
    jwt.verify(token, SEGREDO);
  } catch (err) {
    console.log('❌ Token inválido ou expirado na stream:', err.message);
    return res.json({ streams: [] });
  }

  const requests = ADDONS.map(async (baseUrl) => {
    try {
      const response = await axios.get(`${baseUrl}/stream/${type}/${id}.json`, {
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        }
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
    res.json({ streams: allStreams });
  } catch (err) {
    res.json({ streams: [] });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor proxy rodando na porta ${PORT}`);
});

