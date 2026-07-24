const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;

// CHAVE SECRETA (Use a mesma no jwt.io para assinar os tokens)
const SEGREDO = 'SUA_CHAVE_SUPER_SECRETA_E_UNICA_123';

// 🚀 OS MELHORES ADDONS UNIFICADOS (Filmes, Séries, Animes e TV ao Vivo)
const ADDONS = [
  // Filmes e Séries (Dublado/Legendado/Nacional)
  'https://torrentio.strem.fun/brazuca',
  'https://froststream.cloudatteam.com',
  'https://comet.elfhosted.com',
  'https://cyberflix.1337x.b33p.club',
  'https://thepiratebay.strem.fun',
  // Animes
  'https://animekitsu.strem.fun',
  // TV ao Vivo e Canais
  'https://frostview.cloudatteam.com'
];

// Anti-cache rigoroso para garantir que o corte por expiração seja imediato
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private, max-age=0');
  next();
});

// 1. MANIFESTO DO PROXY
app.get('/:token/manifest.json', (req, res) => {
  res.json({
    id: 'org.meustremio.superproxy',
    version: '3.0.0',
    name: 'Super Proxy All-in-One',
    description: 'Proxy unificado: Filmes, Séries, Animes e TV ao Vivo com corte por token',
    resources: ['stream', 'catalog'],
    types: ['movie', 'series', 'anime', 'tv'],
    idPrefixes: ['tt', 'kitsu', 'tv'],
    catalogs: []
  });
});

// 2. ROTA DE STREAMS (Validação de Tempo + União de Links)
app.get('/:token/stream/:type/:id.json', async (req, res) => {
  const token = req.params.token;
  const { type, id } = req.params;

  // 🔒 BLOQUEIO POR TEMPO: Valida se o token expirou (Minutos, Horas, Dias ou Meses)
  try {
    const decoded = jwt.verify(token, SEGREDO);
    console.log(`✅ Acesso autorizado | Usuário: ${decoded.user}`);
  } catch (err) {
    console.log('⛔ ACESSO BLOQUEADO / TOKEN EXPIRADO:', err.message);
    // Retorna zero streams quando o tempo zera, cortando a exibição no Stremio
    return res.json({ streams: [] });
  }

  console.log(`🔍 Buscando conteúdo [${type}] ID: ${id}`);

  // Consulta todos os addons configurados em paralelo
  const requests = ADDONS.map(async (baseUrl) => {
    try {
      const response = await axios.get(`${baseUrl}/stream/${type}/${id}.json`, {
        timeout: 4500, // Tempo limite rápido para o Stremio não dar timeout
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
  console.log(`🔥 Super Proxy All-in-One rodando na porta ${PORT}`);
});
