const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

const dataDir = path.join(__dirname, 'data');
const lockDpFile = path.join(dataDir, 'lockdp.json');

function getLockData() {
  try {
    fs.ensureDirSync(dataDir);
    if (!fs.existsSync(lockDpFile)) {
      fs.writeJsonSync(lockDpFile, {});
    }
    return fs.readJsonSync(lockDpFile);
  } catch {
    return {};
  }
}

function saveLockData(data) {
  try {
    fs.ensureDirSync(dataDir);
    fs.writeJsonSync(lockDpFile, data, { spaces: 2 });
  } catch (err) {
    console.error('Failed to save lock data:', err);
  }
}

module.exports = {
  config: {
    name: 'lockdp',
    aliases: ['lockimage', 'lockpic'],
    description: 'Lock group display picture (dp)',
    usage: 'lockdp [on/off]',
    category: 'Group',
    groupOnly: true,
    prefix: true
  },
  
  async run({ api, event, args, send, config }) {
    const { threadID, senderID } = event;
    
    const isBotAdmin = config.ADMINBOT.includes(senderID);
    
    if (!isBotAdmin) {
      return send.reply('Only bot admins can use this command.');
    }
    
    const data = getLockData();
    const groupLocks = data[threadID] || {};
    const action = args[0]?.toLowerCase();
    
    if (!action) {
      return send.reply(`🖼️ Display Picture Lock Status: ${groupLocks.lockDp ? '✅ ON' : '❌ OFF'}\n\nUsage: lockdp [on/off]`);
    }
    
    const enable = action === 'on' || action === 'enable' || action === 'true';
    
    groupLocks.lockDp = enable;
    if (enable) {
      const threadInfo = await api.getThreadInfo(threadID);
      const imageUrl = threadInfo.imageSrc;
      if (imageUrl) {
        try {
          const cacheDir = path.join(dataDir, 'lockdp');
          fs.ensureDirSync(cacheDir);
          
          const imagePath = path.join(cacheDir, `${threadID}_dp.jpg`);
          const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
          fs.writeFileSync(imagePath, Buffer.from(response.data));
          
          groupLocks.originalDpPath = imagePath;
          groupLocks.lockDpAt = new Date().toISOString();
        } catch (err) {
          return send.reply('❌ Failed to save group dp: ' + err.message);
        }
      } else {
        return send.reply('❌ No group dp found to lock.');
      }
    }
    
    data[threadID] = groupLocks;
    saveLockData(data);
    return send.reply(`🖼️ Display Picture Lock: ${enable ? '✅ ENABLED' : '❌ DISABLED'}${enable ? '\n\nGroup dp saved and will be restored if changed.' : ''}`);
  }
};
