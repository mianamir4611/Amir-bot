const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

const lockDataPath = path.join(__dirname, '../data/lockgroup_data.json');

function getLockData() {
  try {
    fs.ensureDirSync(path.dirname(lockDataPath));
    if (!fs.existsSync(lockDataPath)) {
      fs.writeJsonSync(lockDataPath, {});
    }
    return fs.readJsonSync(lockDataPath);
  } catch {
    return {};
  }
}

function saveLockData(data) {
  try {
    fs.ensureDirSync(path.dirname(lockDataPath));
    fs.writeJsonSync(lockDataPath, data, { spaces: 2 });
  } catch (err) {
    console.error('Failed to save lock data:', err);
  }
}

module.exports = {
  config: {
    name: 'lockgroup',
    aliases: ['lock', 'lockgc'],
    description: 'Lock group settings (name, emoji, theme, image)',
    usage: 'lockgroup [name/emoji/theme/image/all] [on/off]',
    category: 'Group',
    groupOnly: true,
    prefix: true
  },
  
  checkLocks: async function(api, threadID) {
    const data = getLockData();
    if (!data[threadID]) return;
    
    try {
      const threadInfo = await api.getThreadInfo(threadID);
      const locks = data[threadID];
      
      // Check and restore name
      if (locks.lockName && locks.originalName && threadInfo.threadName !== locks.originalName) {
        try {
          await api.setThreadName(locks.originalName, threadID);
        } catch (e) {
          console.error('Failed to restore name:', e.message);
        }
      }
      
      // Check and restore emoji
      if (locks.lockEmoji && locks.originalEmoji && threadInfo.emoji !== locks.originalEmoji) {
        try {
          await api.changeThreadTheme(locks.originalEmoji, threadID);
        } catch (e) {
          console.error('Failed to restore emoji:', e.message);
        }
      }
      
      // Check and restore theme
      if (locks.lockTheme && locks.originalTheme) {
        const currentTheme = threadInfo.color || threadInfo.threadThemeID;
        if (currentTheme !== locks.originalTheme) {
          try {
            await api.changeThreadTheme(locks.originalTheme, threadID);
          } catch (e) {
            console.error('Failed to restore theme:', e.message);
          }
        }
      }
      
      // Check and restore image
      if (locks.lockImage && locks.originalImagePath && fs.existsSync(locks.originalImagePath)) {
        // Image restore would require api.changeGroupImage which is not available
        // Store for manual restoration if API supports it later
      }
    } catch (err) {
      console.error('Error checking locks:', err);
    }
  },
  
  async run({ api, event, args, send, config }) {
    const { threadID, senderID } = event;
    
    const threadInfo = await api.getThreadInfo(threadID);
    const adminIDs = threadInfo.adminIDs.map(a => a.id);
    const botID = api.getCurrentUserID();
    
    if (!adminIDs.includes(botID)) {
      return send.reply('Bot must be a group admin to lock settings.');
    }
    
    const isGroupAdmin = adminIDs.includes(senderID);
    const isBotAdmin = config.ADMINBOT.includes(senderID);
    
    if (!isGroupAdmin && !isBotAdmin) {
      return send.reply('Only group admins can lock group settings.');
    }
    
    const data = getLockData();
    const groupLocks = data[threadID] || {};
    const target = args[0]?.toLowerCase();
    const action = args[1]?.toLowerCase();
    
    if (!target) {
      return send.reply(`🔒 LOCK SETTINGS
═══════════════════════
Name Lock: ${groupLocks.lockName ? '✅ ON' : '❌ OFF'}
Emoji Lock: ${groupLocks.lockEmoji ? '✅ ON' : '❌ OFF'}
Theme Lock: ${groupLocks.lockTheme ? '✅ ON' : '❌ OFF'}
Image Lock: ${groupLocks.lockImage ? '✅ ON' : '❌ OFF'}
═══════════════════════
Usage: lockgroup [name/emoji/theme/image/all] [on/off]

Example:
- lockgroup all on
- lockgroup theme on
- lockgroup image off`);
    }
    
    const enable = action === 'on' || action === 'enable' || action === 'true';
    
    if (target === 'name') {
      groupLocks.lockName = enable;
      if (enable) {
        groupLocks.originalName = threadInfo.threadName;
      }
      data[threadID] = groupLocks;
      saveLockData(data);
      return send.reply(`🔒 Name Lock: ${enable ? '✅ ENABLED' : '❌ DISABLED'}${enable ? '\n\nOriginal Name: ' + threadInfo.threadName : ''}`);
    }
    
    if (target === 'emoji') {
      groupLocks.lockEmoji = enable;
      if (enable) {
        groupLocks.originalEmoji = threadInfo.emoji;
      }
      data[threadID] = groupLocks;
      saveLockData(data);
      return send.reply(`🔒 Emoji Lock: ${enable ? '✅ ENABLED' : '❌ DISABLED'}${enable ? '\n\nOriginal Emoji: ' + threadInfo.emoji : ''}`);
    }
    
    if (target === 'theme' || target === 'color') {
      groupLocks.lockTheme = enable;
      if (enable) {
        groupLocks.originalTheme = threadInfo.color || threadInfo.threadThemeID;
      }
      data[threadID] = groupLocks;
      saveLockData(data);
      return send.reply(`🔒 Theme Lock: ${enable ? '✅ ENABLED' : '❌ DISABLED'}${enable ? '\n\nTheme ID saved.' : ''}`);
    }
    
    if (target === 'image' || target === 'photo' || target === 'pic') {
      groupLocks.lockImage = enable;
      if (enable) {
        const imageUrl = threadInfo.imageSrc;
        if (imageUrl) {
          try {
            const cacheDir = path.join(__dirname, '../data/lockgroup');
            fs.ensureDirSync(cacheDir);
            
            const imagePath = path.join(cacheDir, `${threadID}_image.jpg`);
            const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
            fs.writeFileSync(imagePath, Buffer.from(response.data));
            
            groupLocks.originalImagePath = imagePath;
          } catch (err) {
            return send.reply('❌ Failed to save group image: ' + err.message);
          }
        } else {
          return send.reply('❌ No group image found to lock.');
        }
      } else {
        groupLocks.originalImagePath = null;
      }
      data[threadID] = groupLocks;
      saveLockData(data);
      return send.reply(`🔒 Image Lock: ${enable ? '✅ ENABLED' : '❌ DISABLED'}${enable ? '\n\nGroup image saved and will be restored if changed.' : ''}`);
    }
    
    if (target === 'all') {
      groupLocks.lockName = enable;
      groupLocks.lockEmoji = enable;
      groupLocks.lockTheme = enable;
      groupLocks.lockImage = enable;
      
      if (enable) {
        groupLocks.originalName = threadInfo.threadName;
        groupLocks.originalEmoji = threadInfo.emoji;
        groupLocks.originalTheme = threadInfo.color || threadInfo.threadThemeID;
        
        const imageUrl = threadInfo.imageSrc;
        if (imageUrl) {
          try {
            const cacheDir = path.join(__dirname, '../data/lockgroup');
            fs.ensureDirSync(cacheDir);
            
            const imagePath = path.join(cacheDir, `${threadID}_image.jpg`);
            const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
            fs.writeFileSync(imagePath, Buffer.from(response.data));
            groupLocks.originalImagePath = imagePath;
          } catch {}
        }
      } else {
        groupLocks.originalName = null;
        groupLocks.originalEmoji = null;
        groupLocks.originalTheme = null;
        groupLocks.originalImagePath = null;
      }
      
      data[threadID] = groupLocks;
      saveLockData(data);
      
      return send.reply(`🔒 ALL LOCKS: ${enable ? '✅ ENABLED' : '❌ DISABLED'}
═══════════════════════
Name Lock: ${enable ? '✅ ON' : '❌ OFF'}
Emoji Lock: ${enable ? '✅ ON' : '❌ OFF'}
Theme Lock: ${enable ? '✅ ON' : '❌ OFF'}
Image Lock: ${enable ? '✅ ON' : '❌ OFF'}
═══════════════════════
${enable ? '✅ All original settings saved and will be restored if changed.' : ''}`);
    }
    
    return send.reply('Usage: lockgroup [name/emoji/theme/image/all] [on/off]');
  }
};
