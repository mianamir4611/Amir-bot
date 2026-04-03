module.exports = {
  config: {
    name: 'botstatus',
    aliases: ['bs', 'allbots', 'botlist'],
    description: 'Show status of all running bots',
    usage: '',
    category: 'Utility',
    prefix: true
  },

  async run({ api, event, send }) {
    const accounts = global.accounts;

    if (!accounts || accounts.size === 0) {
      return send.reply('❌ No bots are currently online.');
    }

    function formatUptime(seconds) {
      const d = Math.floor(seconds / 86400);
      const h = Math.floor((seconds % 86400) / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = Math.floor(seconds % 60);
      const parts = [];
      if (d > 0) parts.push(`${d}d`);
      if (h > 0) parts.push(`${h}h`);
      if (m > 0) parts.push(`${m}m`);
      parts.push(`${s}s`);
      return parts.join(' ');
    }

    let msg = `╔══════════════════════╗\n`;
    msg += `║   𝐁𝐎𝐓 𝐒𝐓𝐀𝐓𝐔𝐒   ║\n`;
    msg += `╠══════════════════════╣\n`;

    let index = 1;
    for (const [uid, account] of accounts) {
      const status = '🟢 Online';
      const uptime = formatUptime(account.time || 0);
      msg += `║ ${index}. ${account.name || 'Unknown'}\n`;
      msg += `║ 🆔 ${uid}\n`;
      msg += `║ ⏰ ${uptime}\n`;
      msg += `║ ${status}\n`;
      if (index < accounts.size) {
        msg += `║ ─────────────────\n`;
      }
      index++;
    }

    const memUsage = Math.round(process.memoryUsage().rss / 1024 / 1024);
    const totalUptime = formatUptime(process.uptime());

    msg += `╠══════════════════════╣\n`;
    msg += `║ 📊 Total: ${accounts.size} bot(s)\n`;
    msg += `║ 💾 Memory: ${memUsage}MB\n`;
    msg += `║ 🕐 Server: ${totalUptime}\n`;
    msg += `╚══════════════════════╝`;

    return send.reply(msg);
  }
};
