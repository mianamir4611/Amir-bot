const fs = require('fs-extra');
const path = require('path');

const dataDir = path.join(__dirname, 'data');
const lockNameFile = path.join(dataDir, 'lockname.json');

function getLockData() {
  try {
    fs.ensureDirSync(dataDir);
    if (!fs.existsSync(lockNameFile)) {
      fs.writeJsonSync(lockNameFile, {});
    }
    return fs.readJsonSync(lockNameFile);
  } catch {
    return {};
  }
}

function saveLockData(data) {
  try {
    fs.ensureDirSync(dataDir);
    fs.writeJsonSync(lockNameFile, data, { spaces: 2 });
  } catch (err) {
    console.error('Failed to save lock data:', err);
  }
}

module.exports = {
  config: {
    name: 'lockname',
    aliases: ['lockgroupname'],
    description: 'Lock group name',
    usage: 'lockname [on/off]',
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
      return send.reply('Only group admins can lock group name.');
    }
    
    const data = getLockData();
    const groupLocks = data[threadID] || {};
    const action = args[0]?.toLowerCase();
    
    if (!action) {
      return send.reply(`📛 Group Name Lock Status: ${groupLocks.lockName ? '✅ ON' : '❌ OFF'}${groupLocks.originalName ? '\n\nOriginal Name: ' + groupLocks.originalName : ''}\n\nUsage: lockname [on/off]`);
    }
    
    const enable = action === 'on' || action === 'enable' || action === 'true';
    
    groupLocks.lockName = enable;
    if (enable) {
      groupLocks.originalName = threadInfo.threadName;
      groupLocks.lockNameAt = new Date().toISOString();
    }
    
    data[threadID] = groupLocks;
    saveLockData(data);
    return send.reply(`📛 Group Name Lock: ${enable ? '✅ ENABLED' : '❌ DISABLED'}${enable ? '\n\nOriginal Name: ' + threadInfo.threadName : ''}`);
  }
};
