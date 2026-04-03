const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const moment = require('moment-timezone');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const botModule = require('./raza');
const { readBots, writeBots } = require('./Data/system/editconfig');

const crypto = require('crypto');

const BRAND_NAME = 'RAZA-BoT';
const BRAND_WHATSAPP = '+923003310470';
const BRAND_EMAIL = 'kashifrazamallah22@gmail.com';

const JWT_SECRET = process.env.JWT_SECRET || (() => {
  if (process.env.NODE_ENV === 'production') {
    console.error('FATAL: JWT_SECRET environment variable is required in production');
    process.exit(1);
  }
  return '2a47fb250c81dbe35ab7c190ed442a2e676e282ae18669ba068c5a9a02090178';
})();

function verifyAuth(req, res, next) {
  const token = req.headers['authorization']?.replace('Bearer ', '') || req.body.token || req.query.token;
  const botid = req.body.botid || req.body.botId || req.query.botid;
  if (!token || !botid) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.uid !== botid) {
      return res.status(403).json({ error: 'Access denied' });
    }
    req.botid = botid;
    req.tokenData = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.get('/profile', (req, res) => {
  const { token, botid } = req.query;
  if (!token || !botid) {
    return res.status(401).sendFile(path.join(__dirname, 'public/index.html'));
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.uid !== botid) {
      return res.status(401).sendFile(path.join(__dirname, 'public/index.html'));
    }
    res.sendFile(path.join(__dirname, 'public/profile.html'));
  } catch {
    res.status(401).sendFile(path.join(__dirname, 'public/index.html'));
  }
});

app.post('/create', async (req, res) => {
  const { appstate, botname, botadmin, botprefix, username, password } = req.body;
  try {
    const appstateData = JSON.parse(appstate);
    const bots = readBots();
    if (bots.find(b => b.username === username)) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    const result = await botModule.webLogin(appstateData, botname, botprefix, username, password, botadmin);
    res.json({ data: 'Bot created successfully', token: result.token, botid: result.userId });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Invalid appstate format' });
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const bots = readBots();
    const bot = bots.find(b => b.username === username && b.password === password);
    if (!bot) {
      return res.status(400).json({ error: 'Wrong username or password' });
    }
    const token = jwt.sign({ uid: bot.uid, username }, JWT_SECRET, { expiresIn: '24h' });
    bot.token = token;
    writeBots(bots);
    res.json({ token, botid: bot.uid });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/logout', verifyAuth, async (req, res) => {
  try {
    await botModule.logoutBot(req.botid);
    res.json({ data: `Bot ${req.botid} logged out successfully` });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/profile', verifyAuth, async (req, res) => {
  try {
    const botid = req.botid;
    const bots = readBots();
    const bot = bots.find(b => b.uid === botid);
    if (!bot) return res.status(404).json({ error: 'Bot not found' });
    const accounts = botModule.getAccounts();
    const account = accounts.get(botid);
    res.json({
      name: bot.name || 'Unknown',
      uid: botid,
      thumbSrc: bot.thumbSrc || account?.thumbSrc || '',
      profileUrl: bot.profileUrl || account?.profileUrl || '',
      botname: bot.botname || 'RAZA-BoT',
      botprefix: bot.prefix || '.',
      admins: bot.admins || [],
      online: accounts.has(botid),
      uptime: account?.time || 0
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/configure', verifyAuth, async (req, res) => {
  const { content, type } = req.body;
  const botId = req.botid;
  try {
    const bots = readBots();
    const bot = bots.find(b => b.uid === botId);
    if (!bot) return res.status(404).json({ error: 'Bot not found' });

    switch (type) {
      case 'prefix':
        bot.prefix = content;
        break;
      case 'botname':
        bot.botname = content;
        break;
      case 'admin':
        if (!bot.admins) bot.admins = [];
        if (!bot.admins.includes(content)) bot.admins.push(content);
        break;
      case 'removeadmin':
        bot.admins = (bot.admins || []).filter(a => a !== content);
        break;
      default:
        return res.status(400).json({ error: 'Invalid type' });
    }
    writeBots(bots);
    res.json({ data: `Updated ${type} successfully` });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/info', (req, res) => {
  const accounts = botModule.getAccounts();
  const data = Array.from(accounts.values()).map(account => ({
    name: account.name,
    profileUrl: account.profileUrl,
    thumbSrc: account.thumbSrc,
    time: account.time,
    botid: account.botid
  }));
  res.json(data);
});

app.get('/commands', (req, res) => {
  const client = botModule.getClient();
  const seen = new Set();
  const commands = [];
  client.commands.forEach((cmd) => {
    if (cmd.config && cmd.config.name && !seen.has(cmd.config.name.toLowerCase())) {
      seen.add(cmd.config.name.toLowerCase());
      commands.push({
        name: cmd.config.name,
        category: cmd.config.category || 'General',
        description: cmd.config.description || cmd.config.shortDescription || '',
        usage: cmd.config.usage || '',
        aliases: cmd.config.aliases || [],
        adminOnly: cmd.config.adminOnly || false
      });
    }
  });
  res.json(commands);
});

app.get('/api/status', (req, res) => {
  const accounts = botModule.getAccounts();
  const client = botModule.getClient();
  res.json({
    totalBots: accounts.size,
    totalCommands: new Set(Array.from(client.commands.values())).size,
    totalEvents: client.events.size,
    uptime: process.uptime(),
    memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    brand: BRAND_NAME
  });
});

app.post('/api/reload/commands', async (req, res) => {
  try {
    await botModule.reloadCommands();
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

app.post('/api/reload/events', async (req, res) => {
  try {
    await botModule.reloadEvents();
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public/index.html'));
});

app.listen(PORT, '0.0.0.0', async () => {
  console.log(`\n${BRAND_NAME} Multi-User Panel running on http://0.0.0.0:${PORT}\n`);
  try {
    await botModule.loginAllStates();
  } catch (err) {
    console.error('Failed to auto-login states:', err.message);
  }
});
