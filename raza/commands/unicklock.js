const fs = require('fs-extra');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/nicklock.json');

function getNicklockData() {
  try {
    fs.ensureDirSync(path.dirname(DATA_FILE));
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeJsonSync(DATA_FILE, { locks: {} }, { spaces: 2 });
    }
    return fs.readJsonSync(DATA_FILE);
  } catch {
    return { locks: {} };
  }
}

function saveNicklockData(data) {
  try {
    fs.ensureDirSync(path.dirname(DATA_FILE));
    fs.writeJsonSync(DATA_FILE, data, { spaces: 2 });
  } catch (err) {
    console.error('Failed to save nicklock data:', err);
  }
}

module.exports = {
  config: {
    name: 'unicklock',
    aliases: ['unlocknick', 'rmnicklock'],
    description: 'Unlock a user nickname',
    usage: 'unicklock [@user]',
    category: 'Moderation',
    adminOnly: true,
    prefix: true
  },

  async run({ api, event, args, send, config }) {
    const { threadID, senderID, mentions } = event;

    try {
      const data = getNicklockData();
      
      let targetUID = '';

      // Parse mention or args
      if (Object.keys(mentions).length > 0) {
        targetUID = Object.keys(mentions)[0];
      } else if (args[0]) {
        targetUID = args[0].replace(/[<>@!]/g, '').trim();
      }

      if (!targetUID) {
        return send.reply('Usage: .unicklock @user\nExample: .unicklock @john');
      }

      const lockKey = `${threadID}_${targetUID}`;

      if (!data.locks || !data.locks[lockKey]) {
        return send.reply('This user does not have a locked nickname.');
      }

      const userInfo = await api.getUserInfo(targetUID);
      const userName = userInfo[targetUID]?.name || 'User';
      const nickname = data.locks[lockKey].nickname;

      // Remove the lock
      delete data.locks[lockKey];
      saveNicklockData(data);

      console.log(`[NICKLOCK] Unlocked ${targetUID} - was: "${nickname}"`);
      return send.reply(`🔓 Nickname Unlocked!\n${userName}\nNickname "${nickname}" is no longer locked`);
    } catch (error) {
      console.error('unicklock error:', error);
      return send.reply(`Error: ${error.message}`);
    }
  }
};
