const fs = require('fs-extra');
const path = require('path');

const dataDir = path.join(__dirname, 'data');
const nicknameFile = path.join(dataDir, 'nickname.json');

function getNicknameData() {
  try {
    fs.ensureDirSync(dataDir);
    if (!fs.existsSync(nicknameFile)) {
      fs.writeJsonSync(nicknameFile, {});
    }
    return fs.readJsonSync(nicknameFile);
  } catch {
    return {};
  }
}

function saveNicknameData(data) {
  try {
    fs.ensureDirSync(dataDir);
    fs.writeJsonSync(nicknameFile, data, { spaces: 2 });
  } catch (err) {
    console.error('Failed to save nickname data:', err);
  }
}

module.exports = {
  config: {
    name: 'nickname',
    aliases: ['nick', 'setnick'],
    description: 'Change nickname of a user',
    usage: 'nickname @user [nickname]',
    category: 'Group',
    groupOnly: true,
    prefix: true
  },
  
  async run({ api, event, args, send, config }) {
    const { threadID, senderID, mentions } = event;
    
    const threadInfo = await api.getThreadInfo(threadID);
    const adminIDs = threadInfo.adminIDs.map(a => a.id);
    
    const isGroupAdmin = adminIDs.includes(senderID);
    const isBotAdmin = config.ADMINBOT.includes(senderID);
    
    let uid = '';
    let nickname = '';
    
    if (Object.keys(mentions).length > 0) {
      uid = Object.keys(mentions)[0];
      const mentionText = mentions[uid];
      nickname = args.join(' ').replace(mentionText, '').trim();
    } else if (event.messageReply) {
      uid = event.messageReply.senderID;
      nickname = args.join(' ');
    } else if (args.length > 0) {
      uid = senderID;
      nickname = args.join(' ');
    } else {
      return send.reply('Usage: nickname @user [new nickname] or reply to a message');
    }
    
    if (uid !== senderID && !isGroupAdmin && !isBotAdmin) {
      return send.reply('Only group admins can change others nicknames.');
    }
    
    try {
      await api.changeNickname(nickname, threadID, uid);
      
      let name = 'Unknown';
      try {
        const info = await api.getUserInfo(uid);
        name = info[uid]?.name || 'Unknown';
      } catch {}
      
      // Store nickname in data for restoration
      const data = getNicknameData();
      if (!data[threadID]) data[threadID] = {};
      if (!data[threadID][uid]) data[threadID][uid] = {};
      
      data[threadID][uid].nickname = nickname;
      data[threadID][uid].changedAt = new Date().toISOString();
      saveNicknameData(data);
      
      if (nickname) {
        return send.reply(`Changed ${name}'s nickname to: ${nickname}`);
      } else {
        return send.reply(`Removed ${name}'s nickname.`);
      }
    } catch (error) {
      return send.reply('Failed to change nickname.');
    }
  }
};
