const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;

// Sua chave secreta
const SEGREDO = 'SUA_CHAVE_SUPER_SECRETA_E_UNICA_123';

// Addons base configurados
const ADDONS = [
  'https://torrentio.strem.fun/brazuca',
  'https://froststream.clouatteam.com',
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

// Validação de acesso com Log no Terminal para depuração
function verificarAcesso(req, res, next) {
  const token = req.params.token || req.query.token;

  if (!token) {
    console.log('❌ Requisição sem token negada.');
    return res.json({ streams: [] });
  }

  try {
    jwt.verify(token, SEGREDO);
    console.log('✅ Token válido acessado!');
    next();
  } catch (err) {
    console.log('❌ Token inválido ou expirado:', err.message);
    return res.json({ streams: [] });
  }
}

// 1. Rota do Manifest (Com idPrefixes obrigatório para o Stremio reconhecer os filmes)
// 1. Rota do Manifest CORRIGIDA
app.get('/:token/manifest.json', (req, res) => {
  const token = req.params.token;

  // Validação rápida do JWT antes de entregar o Manifesto
  try {
    jwt.verify(token, SEGREDO);
  } catch (err) {
    return res.status(401).json({ err: 'Token inválido' });
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

// 2. Rota dos Streams
app.get('/:token/stream/:type/:id.json', verificarAcesso, async (req, res) => {
  const { type, id } = req.params;

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
    return res.json({ streams: allStreams });
  } catch (err) {
    return res.json({ streams: [] });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor proxy rodando na porta ${PORT}`);
});
