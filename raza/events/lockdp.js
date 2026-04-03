const fs = require('fs-extra');
const path = require('path');
const { createReadStream } = require('fs');

const dataDir = path.join(__dirname, '../commands/data');
const lockDpFile = path.join(dataDir, 'lockdp.json');

function getLockData() {
  try {
    if (!fs.existsSync(lockDpFile)) return {};
    return fs.readJsonSync(lockDpFile);
  } catch {
    return {};
  }
}

module.exports = {
  config: {
    name: 'lockdp',
    eventType: ['log:thread-image'],
    description: 'Auto restore locked display picture'
  },
  
  async run({ api, event, logMessageType }) {
    const { threadID } = event;
    
    if (logMessageType === 'log:thread-image') {
      const data = getLockData();
      const locks = data[threadID];
      
      if (locks && locks.lockDp && locks.originalDpPath) {
        try {
          await new Promise(r => setTimeout(r, 1200));
          const imagePath = locks.originalDpPath;
          if (fs.existsSync(imagePath)) {
            const imageStream = createReadStream(imagePath);
            await api.changeGroupImage(imageStream, threadID);
            await new Promise(r => setTimeout(r, 500));
            api.sendMessage('🖼️ Group dp is locked! Restored to original image.', threadID);
          } else {
            api.sendMessage('🖼️ Group dp is locked! But saved image not found.', threadID);
          }
        } catch (err) {
          console.log('Failed to restore dp:', err.message);
          try {
            api.sendMessage('⚠️ Failed to restore group dp. Check admin permissions.', threadID);
          } catch {}
        }
      }
    }
  }
};
