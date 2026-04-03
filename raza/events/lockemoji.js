const fs = require('fs-extra');
const path = require('path');

const dataDir = path.join(__dirname, '../commands/data');
const lockEmojiFile = path.join(dataDir, 'lockemoji.json');

function getLockData() {
  try {
    if (!fs.existsSync(lockEmojiFile)) return {};
    return fs.readJsonSync(lockEmojiFile);
  } catch {
    return {};
  }
}

module.exports = {
  config: {
    name: 'lockemoji',
    eventType: ['log:thread-icon', 'log:thread-emoji'],
    description: 'Auto restore locked group emoji'
  },
  
  async run({ api, event, logMessageType }) {
    const { threadID, author } = event;
    const botID = api.getCurrentUserID();
    
    if (author === botID) return;
    
    if (logMessageType === 'log:thread-icon' || logMessageType === 'log:thread-emoji') {
      const data = getLockData();
      const locks = data[threadID];
      
      if (locks && locks.lockEmoji && locks.originalEmoji) {
        try {
          await new Promise(r => setTimeout(r, 1200));
          const result = await api.changeThreadEmoji(locks.originalEmoji, threadID);
          await new Promise(r => setTimeout(r, 500));
          api.sendMessage('😀 Group emoji is locked! Restored to: ' + locks.originalEmoji, threadID);
        } catch (err) {
          console.log('Failed to restore emoji:', err.message);
          try {
            api.sendMessage('⚠️ Failed to restore group emoji. Check admin permissions.', threadID);
          } catch {}
        }
      }
    }
  }
};
