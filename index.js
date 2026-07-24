const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;

// DEFINA UMA SENHA SECRETA PARA O SEU TOKEN
// Lembre-se de usar exatamente essa mesma palavra no jwt.io no campo VERIFY SIGNATURE
const SEGREDO = 'SUA_CHAVE_SUPER_SECRETA_E_UNICA_123';

// Lista dos seus Addons
const ADDONS = [
  'https://torrentio.strem.fun/brazuca',
  'https://froststream.clouatteam.com',
  'https://comet.elfhosted.com',
  'https://frostview.clouatteam.com',
  'https://cyberflix.1337x.b33p.club',
  'https://anime-kitsu.strem.fun'
];

// Configuração de CORS e Desativação Total de Cache
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  
  // Impede o celular do cliente de guardar em cache os links do Stremio
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  next();
});

// Checa a validação e expiração do Token
function verificarAcesso(req, res, next) {
  const token = req.query.token;

  if (!token) {
    return res.json({ streams: [] });
  }

  try {
    jwt.verify(token, SEGREDO);
    next();
  } catch (err) {
    // Retorna a lista vazia para o Stremio entender o bloqueio na hora
    return res.json({ streams: [] });
  }
}

app.get('/manifest.json', verificarAcesso, (req, res) => {
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

app.get('/stream/:type/:id.json', verificarAcesso, async (req, res) => {
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
