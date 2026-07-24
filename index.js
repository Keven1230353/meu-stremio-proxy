const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;

// Sua chave secreta (deve ser a mesma usada no jwt.io)
const SEGREDO = 'SUA_CHAVE_SUPER_SECRETA_E_UNICA_123';

// Lista dos 6 Addons Unificados
const ADDONS = [
  'https://torrentio.strem.fun/brazuca',
  'https://froststream.cloudatteam.com',
  'https://comet.elfhosted.com',
  'https://cyberflix.1337x.b33p.club',
  'https://thepiratebay.strem.fun',
  'https://frostview.cloudatteam.com'
];

// Anti-cache e liberação de CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private, max-age=0');
  next();
});

// 1. MANIFESTO COM NOVO ID (org.meustremio.superproxy.v5)
app.get('/:token/manifest.json', (req, res) => {
  res.json({
    id: 'org.meustremio.superproxy.v5',
    version: '5.0.0',
    name: 'Super Proxy All-in-One',
    description: 'Proxy unificado de streaming (Filmes, Séries, Animes e TV ao Vivo)',
    resources: ['stream'],
    types: ['movie', 'series', 'anime', 'tv'],
    idPrefixes: ['tt', 'kitsu', 'tv'],
    catalogs: []
  });
});

// 2. ROTA DE STREAMS COM RESPOSTA RÁPIDA (TIMEOUT DE 1.8s)
app.get('/:token/stream/:type/:id.json', async (req, res) => {
  const { token, type, id } = req.params;

  // Validação do Token JWT (Corta o acesso se estiver expirado)
  try {
    jwt.verify(token, SEGREDO);
  } catch (err) {
    console.log('⛔ Token expirado ou inválido!');
    return res.json({ streams: [] });
  }

  // Requisições paralelas rápidas para não estourar o tempo limite do Stremio
  const fetchStreams = ADDONS.map(async (baseUrl) => {
    try {
      const response = await axios.get(`${baseUrl}/stream/${type}/${id}.json`, {
        timeout: 1800, // Limite de 1.8 segundos por addon
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
    const results = await Promise.allSettled(fetchStreams);
    const allStreams = results
      .filter(r => r.status === 'fulfilled')
      .flatMap(r => r.value);

    return res.json({ streams: allStreams });
  } catch (err) {
    return res.json({ streams: [] });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Super Proxy v5 rodando na porta ${PORT}`);
});
