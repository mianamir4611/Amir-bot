const fs = require('fs-extra');
const path = require('path');

const dataDir = path.join(__dirname, '../commands/data');
const lockNameFile = path.join(dataDir, 'lockname.json');

function getLockData() {
  try {
    if (!fs.existsSync(lockNameFile)) return {};
    return fs.readJsonSync(lockNameFile);
  } catch {
    return {};
  }
}

module.exports = {
  config: {
    name: 'lockname',
    eventType: ['log:thread-name'],
    description: 'Auto restore locked group name'
  },
  
  async run({ api, event, logMessageType }) {
    const { threadID, author } = event;
    const botID = api.getCurrentUserID();
    
    if (author === botID) return;
    
    if (logMessageType === 'log:thread-name') {
      const data = getLockData();
      const locks = data[threadID];
      
      if (locks && locks.lockName && locks.originalName) {
        try {
          await new Promise(r => setTimeout(r, 1200));
          const result = await api.setTitle(locks.originalName, threadID);
          await new Promise(r => setTimeout(r, 500));
          api.sendMessage('📛 Group name is locked! Restored to: ' + locks.originalName, threadID);
        } catch (err) {
          console.log('Failed to restore name:', err.message);
          try {
            api.sendMessage('⚠️ Failed to restore group name. Check admin permissions.', threadID);
          } catch {}
        }
      }
    }
  }
};
