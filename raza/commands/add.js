module.exports = {
  config: {
    name: 'add',
    aliases: ['adduser'],
    description: 'Add a user to the group',
    usage: 'add [uid]',
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
      return send.reply('Bot must be a group admin to add members.');
    }
    
    const isGroupAdmin = adminIDs.includes(senderID);
    const isBotAdmin = config.ADMINBOT.includes(senderID);
    
    if (!isGroupAdmin && !isBotAdmin) {
      return send.reply('Only group admins can use this command.');
    }
    
    const uid = args[0];
    
    if (!uid || !/^\d+$/.test(uid)) {
      return send.reply('Please provide a valid UID.');
    }
    
    if (threadInfo.participantIDs.includes(uid)) {
      return send.reply('User is already in the group.');
    }
    
    try {
      await api.addUserToGroup(uid, threadID);
      
      let name = 'Unknown';
      try {
        const info = await api.getUserInfo(uid);
        name = info[uid]?.name || 'Unknown';
      } catch {}
      
      return send.reply(`Added ${name} to the group.`);
    } catch (error) {
      return send.reply('Failed to add user. They may have privacy settings preventing this.');
    }
  }
};
