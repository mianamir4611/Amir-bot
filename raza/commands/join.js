module.exports = {
  config: {
    name: 'join',
    aliases: ['groups', 'joingroup'],
    description: 'Show groups where bot is added (excludes left groups), join by number',
    usage: 'join [number]',
    category: 'Admin',
    adminOnly: true,
    prefix: true
  },
  
  async run({ api, event, args, send, Threads, config }) {
    const { threadID, senderID, messageID } = event;
    
    if (!config.ADMINBOT.includes(senderID)) {
      return send.reply('Only bot admins can use this command.');
    }
    
    const allThreads = Threads.getAll();
    const activeThreads = [];
    
    await send.reply('Checking active groups...');
    
    for (const thread of allThreads) {
      try {
        const info = await api.getThreadInfo(thread.id);
        if (info && info.participantIDs) {
          const botID = api.getCurrentUserID();
          if (info.participantIDs.includes(botID)) {
            activeThreads.push({
              ...thread,
              name: info.threadName || info.name || thread.name || 'Unknown'
            });
          }
        }
      } catch (err) {
      }
      await new Promise(r => setTimeout(r, 500));
    }
    
    if (activeThreads.length === 0) {
      return send.reply('No active groups found.');
    }
    
    if (!args[0]) {
      let msg = `ACTIVE GROUPS (${activeThreads.length})
═══════════════════════\n\n`;
      
      for (let i = 0; i < activeThreads.length; i++) {
        const thread = activeThreads[i];
        const approved = thread.approved === 1 ? '' : '';
        const banned = thread.banned === 1 ? ' (BANNED)' : '';
        
        msg += `${i + 1}. ${thread.name}${banned}
   Approved: ${approved}
   TID: ${thread.id}
─────────────────\n`;
      }
      
      msg += `\nReply with number to join that group.`;
      
      const sentMsg = await send.reply(msg);
      
      if (global.client && global.client.replies) {
        global.client.replies.set(sentMsg.messageID, {
          commandName: 'join',
          author: senderID,
          threads: activeThreads,
          type: 'select'
        });
      }
      
      return;
    }
    
    const num = parseInt(args[0]);
    
    if (isNaN(num) || num < 1 || num > activeThreads.length) {
      return send.reply(`Invalid number. Please choose between 1 and ${activeThreads.length}.`);
    }
    
    const selectedThread = activeThreads[num - 1];
    
    try {
      await api.sendMessage(`Bot admin joined this group.`, selectedThread.id);
      return send.reply(`Sent message to group ${num}.\nTID: ${selectedThread.id}`);
    } catch (error) {
      return send.reply('Failed to send message to group: ' + error.message);
    }
  },
  
  async onReply({ api, event, send }) {
    const { body, senderID } = event;
    const replyData = global.client.replies.get(event.messageReply.messageID);
    
    if (!replyData || replyData.commandName !== 'join') return;
    if (replyData.author !== senderID) return;
    
    const num = parseInt(body);
    
    if (isNaN(num) || num < 1 || num > replyData.threads.length) {
      return send.reply(`Invalid number. Please choose between 1 and ${replyData.threads.length}.`);
    }
    
    const selectedThread = replyData.threads[num - 1];
    
    try {
      await api.sendMessage(`Bot admin connected to this group.`, selectedThread.id);
      send.reply(`Sent message to group ${num}.\nTID: ${selectedThread.id}`);
    } catch (error) {
      send.reply('Failed to send message to group: ' + error.message);
    }
    
    global.client.replies.delete(event.messageReply.messageID);
  }
};
