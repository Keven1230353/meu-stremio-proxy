const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;

const SEGREDO = 'SUA_CHAVE_SUPER_SECRETA_E_UNICA_123';

// Addons principais (URLs diretas e rápidas)
const ADDONS = [
  'https://torrentio.strem.fun',
  'https://froststream.cloudatteam.com',
  'https://thepiratebay.strem.fun'
];

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private, max-age=0');
  next();
});

// 1. MANIFESTO
app.get('/:token/manifest.json', (req, res) => {
  res.json({
    id: 'org.meustremio.superproxy.v4', // ID atualizado para limpar o cache
    version: '4.0.0',
    name: 'Super Proxy All-in-One',
    description: 'Proxy unificado de streaming',
    resources: ['stream'],
    types: ['movie', 'series', 'anime', 'tv'],
    idPrefixes: ['tt', 'kitsu'],
    catalogs: []
  });
});

// 2. ROTA DE STREAMS COM RESPOSTA RÁPIDA (MAX 2 SEGUNDOS)
app.get('/:token/stream/:type/:id.json', async (req, res) => {
  const { token, type, id } = req.params;

  // Validação do Token JWT
  try {
    jwt.verify(token, SEGREDO);
  } catch (err) {
    return res.json({ streams: [] });
  }

  // Requisição paralela rápida com timeout severo de 1500ms
  const fetchStreams = ADDONS.map(async (baseUrl) => {
    try {
      const response = await axios.get(`${baseUrl}/stream/${type}/${id}.json`, {
        timeout: 1500, // Força a resposta em no máximo 1.5s
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
    // Retorna o que estiver pronto imediatamente sem travar o Stremio
    const results = await Promise.allSettled(fetchStreams);
    const allStreams = results
      .filter(r => r.status === 'fulfilled')
      .flatMap(r => r.value);

    // Se nenhum addon respondeu a tempo, envia um aviso interativo em vez de tela vazia
    if (allStreams.length === 0) {
      return res.json({
        streams: [
          {
            name: 'Super Proxy',
            title: '⚠️ Servidores ocupados no momento. Tente novamente em alguns segundos.',
            url: 'https://localhost'
          }
        ]
      });
    }

    return res.json({ streams: allStreams });
  } catch (err) {
    return res.json({ streams: [] });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor otimizado rodando na porta ${PORT}`);
});
