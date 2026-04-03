const fs = require('fs-extra');
const pathFile = __dirname + '/cache/autosen.txt';
if (!fs.existsSync(pathFile))
  fs.writeFileSync(pathFile, 'true');

module.exports = {
  config: {
    name: "autoseen",
    aliases: [],
    description: "Enable/disable auto-seen for new messages",
    usage: "on/off",
    category: "Admin",
    prefix: true
  },

  async handleEvent({ api, event, args }) {
    const isEnable = fs.readFileSync(pathFile, 'utf-8');
    if (isEnable == "true")
      api.markAsReadAll(() => {});
  },

  async run({ api, event, args, send }) {
    try {
      if (args[0] == 'on') {
        fs.writeFileSync(pathFile, 'true');
        return send.reply(`༻﹡﹡﹡﹡﹡﹡﹡༺\nAuto-seen mode enabled for new messages\n༻﹡﹡﹡﹡﹡﹡﹡༺`);
      }
      else if (args[0] == 'off') {
        fs.writeFileSync(pathFile, 'false');
        return send.reply(`༻﹡﹡﹡﹡﹡﹡﹡༺\nAuto-seen mode disabled for new messages\n༻﹡﹡﹡﹡﹡﹡﹡༺`);
      }
      else {
        return send.reply(`༻﹡﹡﹡﹡﹡﹡﹡༺\nIncorrect syntax\n༻﹡﹡﹡﹡﹡﹡﹡༺`);
      }
    }
    catch(e) {
      console.log(e);
    }
  }
};
