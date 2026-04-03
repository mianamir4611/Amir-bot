
module.exports = {
  config: {
    name: 'help',
    aliases: ['h', 'menu', 'cmds'],
    description: 'Show all commands',
    usage: 'help [command] | help [page] | help all',
    category: 'Utility',
    prefix: true
  },
  
  async run({ api, event, args, send, client, config }) {
    const { threadID, senderID } = event;
    
    if (args[0]) {
      const input = args[0].toLowerCase();
      
      if (input === 'all') {
        return showAllCommands({ api, event, send, client, config });
      }
      
      if (!isNaN(input)) {
        const page = parseInt(input);
        return showPagedCommands({ api, event, send, client, config, page });
      }
      
      let command = client.commands.get(input);
      
      if (!command) {
        for (const [name, cmd] of client.commands) {
          if (cmd.config.aliases && cmd.config.aliases.includes(input)) {
            command = cmd;
            break;
          }
        }
      }
      
      if (!command) {
        return send.reply(`Command "${input}" not found.`);
      }
      
      const cfg = command.config;
      return send.reply(`COMMAND: ${cfg.name}
─────────────────
Description: ${cfg.description || 'No description'}
Usage: ${config.PREFIX}${cfg.usage || cfg.name}
Aliases: ${cfg.aliases?.join(', ') || 'None'}
Category: ${cfg.category || 'Other'}
Admin Only: ${cfg.adminOnly ? 'Yes' : 'No'}
Group Only: ${cfg.groupOnly ? 'Yes' : 'No'}`);
    }
    
    return showPagedCommands({ api, event, send, client, config, page: 1 });
  }
};

function showPagedCommands({ api, event, send, client, config, page }) {
  const uniqueCommands = new Map();
  
  for (const [name, cmd] of client.commands) {
    if (!uniqueCommands.has(cmd.config.name)) {
      uniqueCommands.set(cmd.config.name, cmd.config);
    }
  }
  
  const commandsArray = Array.from(uniqueCommands.values());
  const commandsPerPage = 10;
  const totalPages = Math.ceil(commandsArray.length / commandsPerPage);
  
  if (page < 1 || page > totalPages) {
    return send.reply(`Invalid page number. Please use page 1-${totalPages}`);
  }
  
  const startIdx = (page - 1) * commandsPerPage;
  const endIdx = startIdx + commandsPerPage;
  const pageCommands = commandsArray.slice(startIdx, endIdx);
  
  let msg = `${config.BOTNAME} COMMANDS
─────────────────
Page ${page}/${totalPages}
Total: ${commandsArray.length} commands
Prefix: ${config.PREFIX}
─────────────────\n\n`;
  
  pageCommands.forEach(cmd => {
    msg += `╰┈➤ ${cmd.name}\n`;
  });
  
  msg += `\n─────────────────
Use ${config.PREFIX}help [page] for more
Use ${config.PREFIX}help all for all commands
Use ${config.PREFIX}help [command] for details`;
  
  return send.reply(msg);
}

function showAllCommands({ api, event, send, client, config }) {
  const categories = {};
  const uniqueCommands = new Map();
  
  for (const [name, cmd] of client.commands) {
    if (!uniqueCommands.has(cmd.config.name)) {
      uniqueCommands.set(cmd.config.name, cmd.config);
    }
  }
  
  for (const [name, cfg] of uniqueCommands) {
    const cat = cfg.category || 'Other';
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(cfg);
  }
  
  let msg = `${config.BOTNAME} COMMANDS
─────────────────
Prefix: ${config.PREFIX}
Total: ${uniqueCommands.size} commands
─────────────────\n`;
  
  const categoryOrder = ['Admin', 'Group', 'Friend', 'Economy', 'Media', 'Fun', 'Profile', 'Utility', 'Other'];
  
  const categoryEmojis = {
    'Admin': '👑',
    'Group': '👥',
    'Friend': '🤝',
    'Economy': '💰',
    'Media': '🎵',
    'Fun': '💕',
    'Profile': '👤',
    'Utility': '🔧',
    'Other': '📋'
  };
  
  for (const cat of categoryOrder) {
    if (!categories[cat]) continue;
    
    const emoji = categoryEmojis[cat] || '📋';
    
    msg += `\n${emoji} ${cat.toUpperCase()}\n`;
    categories[cat].forEach(c => {
      msg += `╰┈➤ ${c.name}\n`;
    });
  }
  
  for (const cat in categories) {
    if (!categoryOrder.includes(cat)) {
      msg += `\n📋 ${cat.toUpperCase()}\n`;
      categories[cat].forEach(c => {
        msg += `╰┈➤ ${c.name}\n`;
      });
    }
  }
  
  msg += `\n─────────────────
Type ${config.PREFIX}help [command] for details`;
  
  return send.reply(msg);
}
