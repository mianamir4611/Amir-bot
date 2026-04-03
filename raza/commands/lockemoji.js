const fs = require('fs-extra');
const path = require('path');

const dataDir = path.join(__dirname, 'data');
const lockEmojiFile = path.join(dataDir, 'lockemoji.json');

function getLockData() {
  try {
    fs.ensureDirSync(dataDir);
    if (!fs.existsSync(lockEmojiFile)) {
      fs.writeJsonSync(lockEmojiFile, {});
    }
    return fs.readJsonSync(lockEmojiFile);
  } catch {
    return {};
  }
}

function saveLockData(data) {
  try {
    fs.ensureDirSync(dataDir);
    fs.writeJsonSync(lockEmojiFile, data, { spaces: 2 });
  } catch (err) {
    console.error('Failed to save lock data:', err);
  }
}

module.exports = {
  config: {
    name: 'lockemoji',
    aliases: ['lockicon'],
    description: 'Lock group emoji/icon',
    usage: 'lockemoji [on/off]',
    category: 'Group',
    groupOnly: true,
    prefix: true
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
      return send.reply('Only group admins can lock group emoji.');
    }
    
    const data = getLockData();
    const groupLocks = data[threadID] || {};
    const action = args[0]?.toLowerCase();
    
    if (!action) {
      return send.reply(`😀 Group Emoji Lock Status: ${groupLocks.lockEmoji ? '✅ ON' : '❌ OFF'}${groupLocks.originalEmoji ? '\n\nOriginal Emoji: ' + groupLocks.originalEmoji : ''}\n\nUsage: lockemoji [on/off]`);
    }
    
    const enable = action === 'on' || action === 'enable' || action === 'true';
    
    groupLocks.lockEmoji = enable;
    if (enable) {
      groupLocks.originalEmoji = threadInfo.emoji;
      groupLocks.lockEmojiAt = new Date().toISOString();
    }
    
    data[threadID] = groupLocks;
    saveLockData(data);
    return send.reply(`😀 Group Emoji Lock: ${enable ? '✅ ENABLED' : '❌ DISABLED'}${enable ? '\n\nOriginal Emoji: ' + threadInfo.emoji : ''}`);
  }
};
