module.exports = {
  config: {
    name: 'unapprove',
    aliases: ['reject', 'disapprove'],
    description: 'Unapprove a group',
    usage: 'unapprove [threadID]',
    category: 'Admin',
    adminOnly: true,
    prefix: true
  },
  
  async run({ api, event, args, send, Threads }) {
    const { threadID } = event;
    const targetThread = args[0] || threadID;
    
    if (!/^\d+$/.test(targetThread)) {
      return send.reply('Please provide a valid thread ID.');
    }
    
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
  }
};
