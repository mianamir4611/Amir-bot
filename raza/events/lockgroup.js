const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: {
    name: 'lockgroup',
    eventType: ['log:thread-name', 'log:thread-icon', 'log:thread-color', 'log:thread-image'],
    description: 'Auto restore locked settings (name, emoji, theme, image)'
  },
  
  async run({ api, event, Threads, logMessageType }) {
    const { threadID, author } = event;
    const settings = Threads.getSettings(threadID);
    const botID = api.getCurrentUserID();
    
    if (author === botID) return;
    
    if (logMessageType === 'log:thread-name' && settings.lockName) {
      const originalName = settings.originalName;
      if (originalName) {
        try {
          await new Promise(r => setTimeout(r, 1000));
          await api.setTitle(originalName, threadID);
          api.sendMessage('Group name is locked! Restored to original.', threadID);
        } catch (err) {
          console.log('Failed to restore name:', err.message);
        }
      }
    }
    
    if (logMessageType === 'log:thread-icon' && settings.lockEmoji) {
      const originalEmoji = settings.originalEmoji;
      if (originalEmoji) {
        try {
          await new Promise(r => setTimeout(r, 1000));
          await api.changeThreadEmoji(originalEmoji, threadID);
          api.sendMessage('Group emoji is locked! Restored to original.', threadID);
        } catch (err) {
          console.log('Failed to restore emoji:', err.message);
        }
      }
    }
    
    if (logMessageType === 'log:thread-color' && settings.lockTheme) {
      const originalTheme = settings.originalTheme;
      if (originalTheme) {
        try {
          await new Promise(r => setTimeout(r, 1000));
          await api.changeThreadColor(originalTheme, threadID);
          api.sendMessage('Group theme is locked! Restored to original.', threadID);
        } catch (err) {
          console.log('Failed to restore theme:', err.message);
        }
      }
    }
    
    if (logMessageType === 'log:thread-image' && settings.lockImage) {
      const originalImagePath = settings.originalImagePath;
      if (originalImagePath && fs.existsSync(originalImagePath)) {
        try {
          await new Promise(r => setTimeout(r, 1500));
          await api.changeGroupImage(fs.createReadStream(originalImagePath), threadID);
          api.sendMessage('Group image is locked! Restored to original.', threadID);
        } catch (err) {
          console.log('Failed to restore image:', err.message);
        }
      }
    }
  }
};
