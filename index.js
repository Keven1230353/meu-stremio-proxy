const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;

// Sua chave secreta
const SEGREDO = 'SUA_CHAVE_SUPER_SECRETA_E_UNICA_123';

// Lista dos Addons
const ADDONS = [
  'https://torrentio.strem.fun/brazuca',
  'https://froststream.clouatteam.com',
  'https://comet.elfhosted.com',
  'https://frostview.clouatteam.com',
  'https://cyberflix.1337x.b33p.club',
  'https://anime-kitsu.strem.fun'
];

// Anti-cache e CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// Função de validação para as rotas de stream
function verificarAcessoStream(req, res, next) {
  const token = req.query.token;

  if (!token) {
    return res.json({ streams: [] }); // Bloqueia se não tiver token
  }

  try {
    jwt.verify(token, SEGREDO);
    next(); // Token válido, deixa passar
  } catch (err) {
    return res.json({ streams: [] }); // Token vencido ou inválido, bloqueia
  }
}

// 1. O Manifest fica limpo e acessível para o Stremio carregar sempre
app.get('/manifest.json', (req, res) => {
  res.json({
    id: 'org.meustremio.multiproxy',
    version: '1.0.0',
    name: 'Meu Proxy Multi-Addon',
    description: 'Proxy unificado de streaming',
    resources: ['stream', 'catalog', 'meta'],
    types: ['movie', 'series', 'anime'],
    catalogs: []
  });
});

// 2. A segurança real acontece na hora que o usuário clica no filme (passando o token na query)
app.get('/stream/:type/:id.json', verificarAcessoStream, async (req, res) => {
  const { type, id } = req.params;
  let allStreams = [];

  const requests = ADDONS.map(async (baseUrl) => {
    try {
      const response = await axios.get(`${baseUrl}/stream/${type}/${id}.json`);
      if (response.data && response.data.streams) {
        return response.data.streams;
      }
    } catch (e) {
      return [];
    }
    return [];
  });

  const results = await Promise.all(requests);
  results.forEach((streams) => {
    allStreams = allStreams.concat(streams);
  });

  res.json({ streams: allStreams });
});

app.listen(PORT, () => {
  console.log(`Servidor proxy rodando na porta ${PORT}`);
});
