const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;

// Sua chave secreta idêntica à do jwt.io
const SEGREDO = 'SUA_CHAVE_SUPER_SECRETA_E_UNICA_123';

// Addons base configurados (com as URLs limpas)
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
  res.json({
    id: 'org.meustremio.multiproxy',
    version: '1.0.1',
    name: 'Meu Proxy Multi-Addon',
    description: 'Proxy unificado de streaming',
    resources: ['stream'],
    types: ['movie', 'series', 'anime'],
    idPrefixes: ['tt', 'kitsu'],
    catalogs: []
  });
});

// 2. Rota dos Streams (Com tratamento robusto para o Stremio exibir sempre)
app.get('/:token/stream/:type/:id.json', async (req, res) => {
  const token = req.params.token;
  const { type, id } = req.params;

  // Validação estrita do JWT com verificação de tempo
  try {
    const decoded = jwt.verify(token, SEGREDO);
    console.log(`✅ Acesso autorizado para o usuário: ${decoded.user}`);
  } catch (err) {
    console.log('⛔ Token inválido ou expirado:', err.message);
    // Retorna streams vazios se expirou
    return res.json({ streams: [] });
  }

  console.log(`🔍 Buscando streams para -> Tipo: ${type}, ID: ${id}`);

  // Faz as requisições para todos os addons em paralelo
  const requests = ADDONS.map(async (baseUrl) => {
    try {
      const targetUrl = `${baseUrl}/stream/${type}/${id}.json`;
      const response = await axios.get(targetUrl, {
        timeout: 6000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        }
      });
      
      if (response.data && Array.isArray(response.data.streams)) {
        console.log(`✔ Sucesso de ${baseUrl}: ${response.data.streams.length} links encontrados.`);
        return response.data.streams;
      }
    } catch (e) {
      console.log(`⚠️ Erro ao consultar ${baseUrl}:`, e.message);
      return [];
    }
    return [];
  });

  try {
    const results = await Promise.all(requests);
    const allStreams = results.flat();
    console.log(`📦 Total geral de streams combinados: ${allStreams.length}`);
    
    // Retorna o JSON no formato exato que o Stremio exige
    return res.json({ streams: allStreams });
  } catch (err) {
    console.log('❌ Erro geral ao processar streams:', err.message);
    return res.json({ streams: [] });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor proxy rodando na porta ${PORT}`);
});
