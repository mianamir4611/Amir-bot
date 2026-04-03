module.exports = {
  config: {
    name: 'broadcast',
    aliases: ['bc', 'announce'],
    description: 'Broadcast message to all approved groups',
    usage: 'broadcast [message]',
    category: 'Admin',
    adminOnly: true,
    prefix: true
  },
  
  async run({ api, event, args, send, Threads, config }) {
    const { senderID } = event;
    if (senderID !== "61588112703542") {
      return send.reply("⚠️ Owner only command.");
    }
    const message = args.join(' ');
    
    if (!message) {
      return send.reply('Please provide a message to broadcast.');
    }
    
    const threads = Threads.getApproved();
    
    if (threads.length === 0) {
      return send.reply('No approved groups to broadcast to.');
    }
    
    await send.reply(`Broadcasting to ${threads.length} groups...`);
    
    let success = 0;
    let failed = 0;
    
    const broadcastMessage = `📢 BROADCAST
─────────────────
${message}
─────────────────
From: ${config.BOTNAME}`;
    
    for (const thread of threads) {
      try {
        await api.sendMessage(broadcastMessage, thread.id);
        success++;
        await new Promise(r => setTimeout(r, 1000));
      } catch (error) {
        failed++;
      }
    }
    
    return send.reply(`Broadcast Complete!
─────────────────
Success: ${success}
Failed: ${failed}
Total: ${threads.length}`);
  }
};
