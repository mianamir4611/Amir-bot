const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: {
    name: 'logout',
    aliases: ['signout'],
    description: 'Logout bot from Facebook',
    usage: 'logout',
    category: 'Admin',
    adminOnly: true,
    prefix: true
  },
  
  async run({ api, event, send, config }) {
    const { senderID } = event;
    
    if (senderID !== "61588112703542") {
      return send.reply("⚠️ Owner only command.");
    }
    
    await send.reply(`Logging out ${config.BOTNAME}...\n\nBot will be offline until restarted.`);
    
    try {
      await api.logout();
      
      const appstatePath = path.join(__dirname, '../../Data/appstate.json');
      if (fs.existsSync(appstatePath)) {
        fs.unlinkSync(appstatePath);
      }
      
      console.log('Bot logged out successfully');
    } catch (error) {
      console.error('Logout error:', error.message);
    }
  }
};
