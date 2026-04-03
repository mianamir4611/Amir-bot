module.exports = {
  config: {
    name: 'threadlist',
    aliases: ['threads', 'tlist'],
    description: 'List threads from Facebook',
    usage: 'threadlist [limit]',
    category: 'Utility',
    adminOnly: true,
    prefix: true
  },
  
  async run({ api, event, args, send }) {
    const limit = parseInt(args[0]) || 10;
    
    try {
      await send.reply(`Fetching ${limit} threads...`);
      
      const threads = await api.getThreadList(limit, null, ['INBOX']);
      
      let msg = `THREAD LIST (${threads.length})
─────────────────\n`;
      
      for (let i = 0; i < threads.length; i++) {
        const thread = threads[i];
        const type = thread.isGroup ? '👥' : '👤';
        const name = thread.name || thread.threadName || 'Unknown';
        msg += `${i + 1}. ${type} ${name}\n   ID: ${thread.threadID}\n`;
      }
      
      return send.reply(msg);
    } catch (error) {
      return send.reply('Failed to get thread list.');
    }
  }
};
