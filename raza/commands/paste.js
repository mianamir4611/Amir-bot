const fs = require("fs");
const path = require("path");

const dataFolder = path.join(__dirname, "cache", "data");

const getUserJsonPath = (userID) => {
  return path.join(dataFolder, `copiedMessage_${userID}.json`);
};

module.exports = {
  config: {
    name: "paste",
    aliases: [],
    version: "1.0.1",
    credits: "RazA",
    description: "📤 Paste the copied message into this thread",
    category: "Utility",
    usage: "Use in any thread to paste last copied message",
    prefix: true
  },

  async run({ api, event, send }) {
    const { threadID, senderID } = event;
    const userJsonPath = getUserJsonPath(senderID);

    if (!fs.existsSync(userJsonPath)) {
      return send.reply("❌ | No copied message found. Use `copy` first!");
    }

    const data = JSON.parse(fs.readFileSync(userJsonPath, "utf-8"));
    
    if (data.timestamp && (Date.now() - data.timestamp) > 3600000) {
      data.attachments.forEach(attPath => {
        if (fs.existsSync(attPath)) {
          fs.unlinkSync(attPath);
        }
      });
      fs.unlinkSync(userJsonPath);
      return send.reply("❌ | Your copied message has expired (1 hour limit). Please copy again!");
    }

    const attachments = [];

    for (const attPath of data.attachments) {
      if (fs.existsSync(attPath)) {
        attachments.push(fs.createReadStream(attPath));
      }
    }

    const message = {};
    if (data.body) message.body = data.body;
    if (attachments.length > 0) message.attachment = attachments;

    api.sendMessage(message, threadID);
  }
};
