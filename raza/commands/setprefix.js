module.exports = {
  config: {
    name: 'setprefix',
    aliases: ['changeprefix'],
    description: 'Change the bot prefix',
    usage: 'setprefix [new prefix]',
    category: 'Utility',
    adminOnly: true,
    prefix: true
  },
  
  async run({ api, event, args, send }) {
    const fs = require('fs-extra');
    const path = require('path');
    const configPath = path.join(__dirname, '../../config.js');
    
    const newPrefix = args[0];
    
    if (!newPrefix) {
      return send.reply('Please provide a new prefix.');
    }
    
    if (newPrefix.length > 5) {
      return send.reply('Prefix cannot be longer than 5 characters.');
    }
    
    try {
      // Read the config.js and parse it
      const configFile = fs.readFileSync(configPath, 'utf8');
      const configMatch = configFile.match(/module\.exports\s*=\s*({[\s\S]*});/);
      
      if (!configMatch) {
        return send.reply('Error: Could not parse config file.');
      }
      
      const config = JSON.parse(configMatch[1]);
      const oldPrefix = config.PREFIX;
      config.PREFIX = newPrefix;
      
      // Write back with proper module.exports syntax
      const configContent = `module.exports = ${JSON.stringify(config, null, 2)};\n`;
      fs.writeFileSync(configPath, configContent);
      
      // Reload the config module
      delete require.cache[configPath];
      global.config = require(configPath);
      
      return send.reply(`✅ Prefix changed!
─────────────────
Old: ${oldPrefix}
New: ${newPrefix}`);
    } catch (error) {
      return send.reply('❌ Error changing prefix: ' + error.message);
    }
  }
};
