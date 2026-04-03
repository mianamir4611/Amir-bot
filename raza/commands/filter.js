module.exports = {
  config: {
    name: "filter",
    aliases: [],
    version: "2.0.0",
    credits: "RAZA",
    description: "Remove fbuser",
    category: "moderation",
    prefix: true,
    usage: ""
  },

  async run({ api, event, send }) {
    const { userInfo, adminIDs } = await api.getThreadInfo(event.threadID);
    let successCount = 0;
    let failCount = 0;
    let fbUsers = [];
    
    for (const user of userInfo) {
      if (user.gender === undefined) {
        fbUsers.push(user.id);
      }
    }
    
    const isBotAdmin = adminIDs.map(admin => admin.id).some(id => id == api.getCurrentUserID());
    
    if (fbUsers.length === 0) {
      return send.reply("In your group does not exist 'Facebook User'.");
    }
    
    api.sendMessage(`Existing group of friends ${fbUsers.length} 'Facebook users'.`, event.threadID, function() {
      if (isBotAdmin) {
        return api.sendMessage("🚀 RocKet Launch", event.threadID, async function() {
          for (const userId of fbUsers) {
            try {
              await new Promise(resolve => setTimeout(resolve, 1000));
              await api.removeUserFromGroup(parseInt(userId), event.threadID);
              successCount++;
            } catch (error) {
              failCount++;
            }
          }
          
          api.sendMessage(`Nyc MoVe \n${successCount} ✈️`, event.threadID, function() {
            if (failCount !== 0) {
              return api.sendMessage(`😜${failCount} 🤳`, event.threadID);
            }
          });
        });
      } else {
        return api.sendMessage("MaKe Me ADmin B0Ss 🤧", event.threadID);
      }
    });
  }
};
