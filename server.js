
const express = require('express');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');
const axios = require('axios');
const path = require('path');

const app = express();

// High-compatibility CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Accept']
}));
app.use(express.json());

// In-Memory Server State
let state = {
  config: {
    geminiKey: process.env.API_KEY || "",
    tgToken: "",
    tgChatId: "",
    autoPilot: false
  },
  signals: [],
  logs: []
};

const addLog = (type, content) => {
  const log = { id: Date.now(), time: new Date().toLocaleTimeString(), type, content };
  state.logs.unshift(log);
  if (state.logs.length > 50) state.logs.pop();
  console.log(`[${log.time}] ${type}: ${content}`);
};

// --- Always-On Engine ---
const runAutomation = async (isManual = false) => {
  if (!state.config.autoPilot && !isManual) return;
  
  const key = state.config.geminiKey || process.env.API_KEY;
  if (!key) {
    addLog('ERROR', 'No Gemini API Key provided.');
    return;
  }

  addLog('SYSTEM', `${isManual ? 'Manual' : 'Scheduled'} scan pulse...`);

  try {
    const binanceRes = await axios.get('https://api.binance.com/api/v3/ticker/24hr');
    const symbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "PEPEUSDT", "SHIBUSDT", "DOGEUSDT"];
    const market = binanceRes.data.filter(d => symbols.includes(d.symbol));
    const target = market.sort((a,b) => Math.abs(parseFloat(b.priceChangePercent)) - Math.abs(parseFloat(a.priceChangePercent)))[0];

    const ai = new GoogleGenAI({ apiKey: key });
    const prompt = `ASSET: ${target.symbol} at ${target.lastPrice}. Move: ${target.priceChangePercent}%.
    Generate a trading signal and viral video hook in JSON: { "action": "LONG"|"SHORT", "entry": number, "tp": number, "sl": number, "reasoning": "string", "videoHook": "string" }`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    const data = JSON.parse(response.text);
    const signal = { ...data, id: Math.random().toString(36).substr(2, 5).toUpperCase(), pair: target.symbol, timestamp: Date.now() };
    
    state.signals.unshift(signal);
    if (state.signals.length > 15) state.signals.pop();
    addLog('RESPONSE', `Alpha Pulse: ${signal.action} ${signal.pair}`);

  } catch (e) {
    addLog('ERROR', `Engine Fault: ${e.message}`);
  }
};

// Automation Loop
setInterval(() => runAutomation(false), 15 * 60 * 1000);

// API Routes
app.get('/api/status', (req, res) => res.json(state));
app.post('/api/config', (req, res) => {
  const wasOff = !state.config.autoPilot;
  state.config = { ...state.config, ...req.body };
  addLog('SYSTEM', 'Registry updated.');
  if (wasOff && state.config.autoPilot) runAutomation(false);
  res.json({ success: true });
});
app.post('/api/manual-scan', async (req, res) => {
  await runAutomation(true);
  res.json({ success: true });
});

// Serve the consolidated index.html
app.use(express.static(__dirname));
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({error: 'Not found'});
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n--- ALPHA SERVER ACTIVE ON PORT ${PORT} ---\n`);
});
