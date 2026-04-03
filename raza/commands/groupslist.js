module.exports = {
  config: {
    name: 'groupslist',
    aliases: ['groups', 'glist'],
    description: 'List all groups',
    usage: 'groupslist',
    category: 'Utility',
    adminOnly: true,
    prefix: true
  },
  
  async run({ api, event, send, Threads }) {
    const threads = Threads.getAll();
    
    if (threads.length === 0) {
      return send.reply('No groups in database.');
    }
    
    let msg = `GROUPS LIST (${threads.length})
─────────────────\n`;
    
    for (let i = 0; i < Math.min(threads.length, 20); i++) {
      const thread = threads[i];
      const status = thread.approved === 1 ? '✅' : '❌';
      const banned = thread.banned === 1 ? '🚫' : '';
      msg += `${i + 1}. ${status}${banned} ${thread.name || 'Unknown'}\n   ID: ${thread.id}\n`;
    }
    
    if (threads.length > 20) {
      msg += `\n... and ${threads.length - 20} more groups`;
    }
    
    msg += `\n─────────────────
✅ = Approved | ❌ = Not Approved | 🚫 = Banned`;
    
    return send.reply(msg);
  }
};
