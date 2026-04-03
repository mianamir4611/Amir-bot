module.exports = {
  config: {
    name: 'approve',
    aliases: ['approvee', 'allow'],
    description: 'Approve or unapprove a group',
    usage: 'approve [threadID] / unapprove [threadID]',
    category: 'Admin',
    adminOnly: true,
    prefix: true
  },
  
  async run({ api, event, args, send, Threads, commandName }) {
    const { threadID } = event;
    const targetThread = args[0] || threadID;
    
    if (!/^\d+$/.test(targetThread)) {
      return send.reply('Please provide a valid thread ID.');
    }
    
    const isUnapprove = commandName === 'unapprove' || args.includes('unapprove');
    
    if (isUnapprove) {
      if (!Threads.isApproved(targetThread)) {
        return send.reply('This group is not approved.');
      }
      
      Threads.unapprove(targetThread);
      
      let groupName = 'Unknown';
      try {
        const info = await api.getThreadInfo(targetThread);
        groupName = info.threadName || 'Unknown';
      } catch {}
      
      if (targetThread !== threadID) {
        api.sendMessage(`This group has been unapproved by bot admin.`, targetThread);
      }
      
      return send.reply(`Unapproved group: ${groupName} (${targetThread})`);
    } else {
      if (Threads.isApproved(targetThread)) {
        return send.reply('This group is already approved.');
      }
      
      Threads.approve(targetThread);
      
      let groupName = 'Unknown';
      try {
        const info = await api.getThreadInfo(targetThread);
        groupName = info.threadName || 'Unknown';
      } catch {}
      
      if (targetThread !== threadID) {
        const config = global.config || {};
        api.sendMessage(`This group has been approved! You can now use ${config.BOTNAME || 'the bot'}.`, targetThread);
      }
      
      return send.reply(`Approved group: ${groupName} (${targetThread})`);
    }
  }
};
