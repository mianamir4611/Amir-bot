const fca = require('./Data/fca-unofficial');
const fs = require('fs-extra');
const path = require('path');
const cron = require('node-cron');
const moment = require('moment-timezone');
const axios = require('axios');

const logs = require('./Data/utility/logs');
const listen = require('./Data/system/listen');
const { loadCommands, loadEvents } = require('./Data/system/handle/handleRefresh');
const UsersController = require('./Data/system/controllers/users');
const ThreadsController = require('./Data/system/controllers/threads');
const CurrenciesController = require('./Data/system/controllers/currencies');
const { addUser, createUser, deleteUser, rmStates, readBots } = require('./Data/system/editconfig');

const commandsPath = path.join(__dirname, 'raza/commands');
const eventsPath = path.join(__dirname, 'raza/events');
const statesDir = path.join(__dirname, 'states');

let globalConfig = {};
try {
  globalConfig = require('./config.json');
} catch {
  globalConfig = {};
}

const accounts = new Map();
const client = {
  commands: new Map(),
  events: new Map(),
  cooldowns: new Map(),
  accounts: accounts,
  handleReply: new Map(),
  handleReaction: new Map(),
  replies: new Map()
};

global.client = client;
global.config = globalConfig;
global.accounts = accounts;
global.startTime = Date.now();

const quranPics = [
  'https://i.ibb.co/8gWzFpqV/bbc9bf12376e.jpg',
  'https://i.ibb.co/DgGmLMTL/2a27f2cecc80.jpg',
  'https://i.ibb.co/Kz8CBZBD/db27a4756c35.jpg',
  'https://i.ibb.co/zTKnLMq9/c52345ec3639.jpg',
  'https://i.ibb.co/8gfGBHDr/8e3226ab3861.jpg',
  'https://i.ibb.co/WNK2Dbbq/ffed087e09a5.jpg',
  'https://i.ibb.co/hRVXMQhz/fe5e09877fa8.jpg'
];

const namazPics = [
  'https://i.ibb.co/sp39k0CY/e2630b0f2713.jpg',
  'https://i.ibb.co/BKdttjgN/8cd831a43211.jpg',
  'https://i.ibb.co/Q3hVDVMr/c0de33430ba4.jpg',
  'https://i.ibb.co/7td1kK7W/6d713bbe5418.jpg'
];

const quranAyats = [
  { arabic: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ", urdu: "اللہ کے نام سے جو بڑا مہربان نہایت رحم والا ہے", surah: "Surah Al-Fatiha: 1" },
  { arabic: "إِنَّ مَعَ الْعُسْرِ يُسْرًا", urdu: "بے شک مشکل کے ساتھ آسانی ہے", surah: "Surah Ash-Sharh: 6" },
  { arabic: "وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ", urdu: "اور جو اللہ پر توکل کرے تو وہ اسے کافی ہے", surah: "Surah At-Talaq: 3" },
  { arabic: "فَاذْكُرُونِي أَذْكُرْكُمْ", urdu: "پس تم مجھے یاد کرو میں تمہیں یاد کروں گا", surah: "Surah Al-Baqarah: 152" },
  { arabic: "وَاصْبِرْ وَمَا صَبْرُكَ إِلَّا بِاللَّهِ", urdu: "اور صبر کرو اور تمہارا صبر اللہ ہی کی توفیق سے ہے", surah: "Surah An-Nahl: 127" },
  { arabic: "إِنَّ اللَّهَ مَعَ الصَّابِرِينَ", urdu: "بے شک اللہ صبر کرنے والوں کے ساتھ ہے", surah: "Surah Al-Baqarah: 153" },
  { arabic: "وَلَا تَيْأَسُوا مِن رَّوْحِ اللَّهِ", urdu: "اور اللہ کی رحمت سے مایوس نہ ہو", surah: "Surah Yusuf: 87" },
  { arabic: "رَبِّ اشْرَحْ لِي صَدْرِي", urdu: "اے میرے رب میرے سینے کو کھول دے", surah: "Surah Ta-Ha: 25" },
  { arabic: "حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ", urdu: "اللہ ہمیں کافی ہے اور وہ بہترین کارساز ہے", surah: "Surah Al-Imran: 173" },
  { arabic: "وَقُل رَّبِّ زِدْنِي عِلْمًا", urdu: "اور کہو کہ اے میرے رب میرے علم میں اضافہ فرما", surah: "Surah Ta-Ha: 114" },
  { arabic: "إِنَّ اللَّهَ لَا يُضِيعُ أَجْرَ الْمُحْسِنِينَ", urdu: "بے شک اللہ نیکی کرنے والوں کا اجر ضائع نہیں کرتا", surah: "Surah Yusuf: 90" },
  { arabic: "وَتُوبُوا إِلَى اللَّهِ جَمِيعًا أَيُّهَ الْمُؤْمِنُونَ", urdu: "اور اے مومنو تم سب اللہ کے حضور توبہ کرو", surah: "Surah An-Nur: 31" }
];

async function downloadImage(url, filePath) {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 10000 });
    fs.writeFileSync(filePath, Buffer.from(response.data));
    return true;
  } catch { return false; }
}

async function sendQuranAyat() {
  if (!globalConfig.AUTO_ISLAMIC_POST) return;
  for (const [botID, account] of accounts) {
    if (!account.api) continue;
    try {
      const threads = require('./Data/system/database/models/threads').getAll();
      const approvedThreads = threads.filter(t => t.approved === 1 && t.banned !== 1);
      if (approvedThreads.length === 0) continue;
      const randomAyat = quranAyats[Math.floor(Math.random() * quranAyats.length)];
      const randomPic = quranPics[Math.floor(Math.random() * quranPics.length)];
      const time = moment().tz('Asia/Karachi').format('hh:mm A');
      const bots = readBots();
      const botInfo = bots.find(b => b.uid === botID) || {};
      const botname = botInfo.botname || 'RAZA-BoT';
      const message = `📖 𝐐𝐔𝐑𝐀𝐍 𝐀𝐘𝐀𝐓\n\n${randomAyat.arabic}\n\n𝐔𝐫𝐝𝐮 𝐓𝐫𝐚𝐧𝐬𝐥𝐚𝐭𝐢𝐨𝐧:\n${randomAyat.urdu}\n\n📍 ${randomAyat.surah}\n\n🕌 ${botname} | ${time} PKT`;
      const cacheDir = path.join(__dirname, 'raza/commands/cache');
      fs.ensureDirSync(cacheDir);
      const imgPath = path.join(cacheDir, `quran_${Date.now()}.jpg`);
      const downloaded = await downloadImage(randomPic, imgPath);
      for (const thread of approvedThreads) {
        try {
          if (downloaded && fs.existsSync(imgPath)) {
            await account.api.sendMessage({ body: message, attachment: fs.createReadStream(imgPath) }, thread.id);
          } else {
            await account.api.sendMessage(message, thread.id);
          }
          await new Promise(r => setTimeout(r, 2000));
        } catch {}
      }
      try { fs.unlinkSync(imgPath); } catch {}
    } catch {}
  }
}

async function sendNamazAlert(namazName) {
  for (const [botID, account] of accounts) {
    if (!account.api) continue;
    try {
      const threads = require('./Data/system/database/models/threads').getAll();
      const approvedThreads = threads.filter(t => t.approved === 1 && t.banned !== 1);
      if (approvedThreads.length === 0) continue;
      const randomPic = namazPics[Math.floor(Math.random() * namazPics.length)];
      const time = moment().tz('Asia/Karachi').format('hh:mm A');
      const bots = readBots();
      const botInfo = bots.find(b => b.uid === botID) || {};
      const botname = botInfo.botname || 'RAZA-BoT';
      const message = `🕌 𝐍𝐀𝐌𝐀𝐙 𝐀𝐋𝐄𝐑𝐓\n\n⏰ ${namazName.toUpperCase()} کا وقت ہو گیا!\n\n"إِنَّ الصَّلَاةَ كَانَتْ عَلَى\nالْمُؤْمِنِينَ كِتَابًا مَّوْقُوتًا"\n\nبے شک نماز مومنوں پر وقت\nمقررہ پر فرض ہے۔\n\n📍 نماز پڑھیں - جنت کی چابی\n\n🕌 ${botname} | ${time} PKT`;
      const cacheDir = path.join(__dirname, 'raza/commands/cache');
      fs.ensureDirSync(cacheDir);
      const imgPath = path.join(cacheDir, `namaz_${Date.now()}.jpg`);
      const downloaded = await downloadImage(randomPic, imgPath);
      for (const thread of approvedThreads) {
        try {
          if (downloaded && fs.existsSync(imgPath)) {
            await account.api.sendMessage({ body: message, attachment: fs.createReadStream(imgPath) }, thread.id);
          } else {
            await account.api.sendMessage(message, thread.id);
          }
          await new Promise(r => setTimeout(r, 2000));
        } catch {}
      }
      try { fs.unlinkSync(imgPath); } catch {}
    } catch {}
  }
}

function setupSchedulers() {
  cron.schedule('0 * * * *', () => sendQuranAyat(), { timezone: 'Asia/Karachi' });
  cron.schedule('43 5 * * *', () => sendNamazAlert('Fajr'), { timezone: 'Asia/Karachi' });
  cron.schedule('23 12 * * *', () => sendNamazAlert('Dhuhr'), { timezone: 'Asia/Karachi' });
  cron.schedule('7 16 * * *', () => sendNamazAlert('Asr'), { timezone: 'Asia/Karachi' });
  cron.schedule('43 17 * * *', () => sendNamazAlert('Maghrib'), { timezone: 'Asia/Karachi' });
  cron.schedule('4 19 * * *', () => sendNamazAlert('Isha'), { timezone: 'Asia/Karachi' });
  logs.success('SCHEDULER', 'Quran Ayat + Namaz Alerts schedulers started');
}

async function initializeCommands() {
  await loadCommands(client, commandsPath);
  await loadEvents(client, eventsPath);
  logs.success('INIT', `Commands: ${client.commands.size}, Events: ${client.events.size}`);
}

function getBotConfig(botID) {
  const bots = readBots();
  const bot = bots.find(b => b.uid === botID);
  if (!bot) {
    return {
      BOTNAME: 'RAZA-BoT',
      PREFIX: '.',
      ADMINBOT: globalConfig.operators || [],
      PREFIX_ENABLED: true,
      ADMIN_ONLY_MODE: globalConfig.adminonly || false,
      REACT_DELETE_EMOJI: globalConfig.REACT_DELETE_EMOJI || '😡',
      TIMEZONE: 'Asia/Karachi'
    };
  }
  return {
    BOTNAME: bot.botname || 'RAZA-BoT',
    PREFIX: bot.prefix || '.',
    ADMINBOT: [...(bot.admins || []), ...(globalConfig.operators || [])],
    PREFIX_ENABLED: true,
    ADMIN_ONLY_MODE: globalConfig.adminonly || false,
    REACT_DELETE_EMOJI: globalConfig.REACT_DELETE_EMOJI || '😡',
    TIMEZONE: 'Asia/Karachi',
    AUTO_ISLAMIC_POST: globalConfig.AUTO_ISLAMIC_POST !== false,
    AUTO_GROUP_MESSAGE: globalConfig.AUTO_GROUP_MESSAGE !== false
  };
}

async function cleanupDeadBot(userId, reason) {
  logs.warn('CLEANUP', `Removing dead bot ${userId}: ${reason}`);
  accounts.delete(userId);
  client.handleReply.delete(userId);
  client.handleReaction.delete(userId);
  try { await rmStates(userId); } catch {}
  try { await deleteUser(userId); } catch {}
}

function isDeadSessionError(error) {
  const errStr = JSON.stringify(error).toLowerCase();
  return errStr.includes('not logged in') ||
    errStr.includes('login_blocked') ||
    errStr.includes('auth_error') ||
    errStr.includes('account_inactive') ||
    errStr.includes('session is dead') ||
    (errStr.includes('login') && errStr.includes('blocked'));
}

async function startLogin(appstateData, filename) {
  return new Promise((resolve, reject) => {
    const loginOptions = globalConfig.loginoptions || {
      listenEvents: true,
      selfListen: false,
      autoMarkRead: true,
      forceLogin: true
    };

    fca({ appState: appstateData }, loginOptions, async (err, api) => {
      if (err) {
        logs.error('LOGIN', `Failed to login ${filename}:`, err.message || JSON.stringify(err));
        try {
          await rmStates(filename);
          await deleteUser(filename);
        } catch {}
        return reject(err);
      }

      const userId = await api.getCurrentUserID();
      try {
        const userInfo = await api.getUserInfo(userId);
        if (!userInfo || !userInfo[userId]?.name) {
          throw new Error('Account suspended or locked');
        }
        const { name, profileUrl, thumbSrc } = userInfo[userId];

        await addUser(name, userId);

        const bots = readBots();
        let time = (bots.find(b => b.uid === userId) || {}).time || 0;

        accounts.set(userId, {
          api,
          name,
          profileUrl: profileUrl || '',
          thumbSrc: thumbSrc || '',
          botid: userId,
          time: time
        });

        const intervalId = setInterval(() => {
          const account = accounts.get(userId);
          if (!account) { clearInterval(intervalId); return; }
          accounts.set(userId, { ...account, time: account.time + 1 });
        }, 1000);

        client.handleReply.set(userId, []);
        client.handleReaction.set(userId, []);

        const Users = new UsersController(api);
        const Threads = new ThreadsController(api);
        const Currencies = new CurrenciesController(api);

        const botConfig = getBotConfig(userId);

        const listener = listen({
          api,
          client,
          Users,
          Threads,
          Currencies,
          config: botConfig,
          botID: userId
        });

        api.listenMqtt((error, event) => {
          if (error) {
            if (isDeadSessionError(error)) {
              logs.error('MQTT', `Bot ${userId} session dead, cleaning up...`);
              clearInterval(intervalId);
              cleanupDeadBot(userId, 'session expired');
              return;
            }
            logs.error('MQTT', `Error for ${userId}: ${error.message || error}`);
            return;
          }
          listener(null, event);
        });

        logs.success('LOGIN', `${name} (${userId}) is now online!`);
        resolve({ userId, name });
      } catch (error) {
        logs.error('LOGIN', `Failed to get info for ${userId}:`, error.message);
        reject(error);
      }
    });
  });
}

async function loginAllStates() {
  logs.banner();
  fs.ensureDirSync(statesDir);

  await initializeCommands();
  setupSchedulers();

  const stateFiles = fs.readdirSync(statesDir).filter(f => f.endsWith('.json'));
  logs.info('STARTUP', `Found ${stateFiles.length} saved state(s)`);

  for (const file of stateFiles) {
    const filename = file.replace('.json', '');
    try {
      const appstate = fs.readJsonSync(path.join(statesDir, file));
      await startLogin(appstate, filename);
      await new Promise(r => setTimeout(r, 3000));
    } catch (error) {
      logs.error('STARTUP', `Failed to login ${filename}: ${error.message}`);
    }
  }

  logs.success('STARTUP', `${accounts.size} bot(s) online`);

  setInterval(async () => {
    try {
      const bots = readBots();
      for (const bot of bots) {
        if (!bot.uid) continue;
        if (!accounts.has(bot.uid)) {
          const stateFile = path.join(statesDir, `${bot.uid}.json`);
          if (!fs.existsSync(stateFile)) {
            logs.warn('CLEANUP', `Bot ${bot.uid} has no state file, removing from bots.json...`);
            await cleanupDeadBot(bot.uid, 'no state file found');
          }
        }
      }

      const stateFiles = fs.readdirSync(statesDir).filter(f => f.endsWith('.json'));
      for (const file of stateFiles) {
        const uid = file.replace('.json', '');
        if (!accounts.has(uid)) {
          const bots2 = readBots();
          const botEntry = bots2.find(b => b.uid === uid);
          if (!botEntry) {
            logs.warn('CLEANUP', `Orphan state file ${file}, removing...`);
            try { fs.unlinkSync(path.join(statesDir, file)); } catch {}
          }
        }
      }
    } catch (err) {
      logs.error('CLEANUP', `Periodic cleanup error: ${err.message}`);
    }
  }, 5 * 60 * 1000);
}

async function webLogin(appstateData, botname, botprefix, username, password, botadmin) {
  return new Promise((resolve, reject) => {
    const loginOptions = globalConfig.loginoptions || {
      listenEvents: true,
      selfListen: false,
      autoMarkRead: true,
      forceLogin: true
    };

    fca({ appState: appstateData }, loginOptions, async (err, api) => {
      if (err) {
        return reject(new Error('Login failed: ' + (err.message || 'Invalid appstate')));
      }

      const userId = await api.getCurrentUserID();
      try {
        const userInfo = await api.getUserInfo(userId);
        if (!userInfo || !userInfo[userId]?.name) {
          throw new Error('Account suspended or locked');
        }
        const { name, profileUrl, thumbSrc } = userInfo[userId];
        const jwt = require('jsonwebtoken');
        const JWT_SECRET = process.env.JWT_SECRET || '2a47fb250c81dbe35ab7c190ed442a2e676e282ae18669ba068c5a9a02090178';
        const token = jwt.sign({ uid: userId, username }, JWT_SECRET, { expiresIn: '24h' });

        fs.writeJsonSync(path.join(statesDir, `${userId}.json`), appstateData, { spaces: 2 });

        await createUser(name, userId, botname, botprefix, username, password, thumbSrc, profileUrl, token, botadmin);

        accounts.set(userId, {
          api,
          name,
          profileUrl: profileUrl || '',
          thumbSrc: thumbSrc || '',
          botid: userId,
          time: 0
        });

        const intervalId = setInterval(() => {
          const account = accounts.get(userId);
          if (!account) { clearInterval(intervalId); return; }
          accounts.set(userId, { ...account, time: account.time + 1 });
        }, 1000);

        client.handleReply.set(userId, []);
        client.handleReaction.set(userId, []);

        const Users = new UsersController(api);
        const Threads = new ThreadsController(api);
        const Currencies = new CurrenciesController(api);

        const botConfig = getBotConfig(userId);

        const listener = listen({
          api,
          client,
          Users,
          Threads,
          Currencies,
          config: botConfig,
          botID: userId
        });

        api.listenMqtt((error, event) => {
          if (error) {
            if (isDeadSessionError(error)) {
              logs.error('MQTT', `Web bot ${userId} session dead, cleaning up...`);
              clearInterval(intervalId);
              cleanupDeadBot(userId, 'appstate expired after creation');
              return;
            }
            return;
          }
          listener(null, event);
        });

        logs.success('WEB_LOGIN', `${name} (${userId}) logged in via web panel`);
        resolve({ userId, name, thumbSrc, profileUrl, token });
      } catch (error) {
        reject(error);
      }
    });
  });
}

async function logoutBot(botID) {
  const account = accounts.get(botID);
  if (account && account.api) {
    try { account.api.logout(() => {}); } catch {}
  }
  accounts.delete(botID);
  client.handleReply.delete(botID);
  client.handleReaction.delete(botID);
  await rmStates(botID);
  await deleteUser(botID);
  logs.info('LOGOUT', `Bot ${botID} logged out`);
}

process.on('unhandledRejection', (reason) => {
  logs.warn('UNHANDLED', 'Unhandled Promise Rejection:', reason?.message || String(reason));
});

process.on('uncaughtException', (error) => {
  logs.error('EXCEPTION', 'Uncaught Exception:', error.message);
});

module.exports = {
  loginAllStates,
  startLogin,
  webLogin,
  logoutBot,
  getBotConfig,
  getClient: () => client,
  getAccounts: () => accounts,
  reloadCommands: () => loadCommands(client, commandsPath),
  reloadEvents: () => loadEvents(client, eventsPath)
};

if (require.main === module) {
  loginAllStates();
}
