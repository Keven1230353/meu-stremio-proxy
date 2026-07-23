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
  'https://froststream.cloutteam.com',
  'https://comet.elfhosted.com',
  'https://frostview.cloutteam.com',
  'https://cyberflix.1337x.b33p.club',
  'https://anime-kitsu.strem.fun'
];

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  next();
});

// Middleware de verificação de Token
function verificarAcesso(req, res, next) {
  const token = req.query.token;

  if (!token) {
    return res.status(401).send('Acesso negado: Token nao fornecido.');
  }

  try {
    jwt.verify(token, SEGREDO);
    next();
  } catch (err) {
    return res.status(403).send('Link invalido ou chave incorreta.');
  }
}

app.get('/manifest.json', verificarAcesso, (req, res) => {
  res.json({
    id: 'org.meustremio.multiproxy',
    version: '1.0.0',
    name: 'Meu Proxy Multi-Addon',
    description: 'Proxy unificado',
    resources: ['stream', 'catalog', 'meta'],
    types: ['movie', 'series', 'anime'],
    catalogs: []
  });
});

app.get('/stream/:type/:id.json', verificarAcesso, async (req, res) => {
  const { type, id } = req.params;
  let allStreams = [];

  const requests = ADDONS.map(async (baseUrl) => {
    try {
      const response = await axios.get(`${baseUrl}/stream/${type}/${id}.json`, { timeout: 4000 });
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
  console.log(`Servidor rodando na porta ${PORT}`);
});
