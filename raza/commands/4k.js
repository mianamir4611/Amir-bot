const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "4k",
    aliases: [],
    description: "Enhance image to 4k using Remini API",
    usage: "reply to an image with 4k",
    category: "Image",
    prefix: true
  },

  async run({ api, event, send }) {
    const { threadID, messageID, type, messageReply } = event;

    if (type !== "message_reply" || !messageReply.attachments || messageReply.attachments.length == 0 || messageReply.attachments[0].type !== "photo") {
      return send.reply("❌ Please reply to an image with '4k'");
    }

    try {
      send.reply("⏳ Enhancing image to 4k... please wait.");

      const imageUrl = messageReply.attachments[0].url;
      const res = await axios.get(`https://api.kraza.qzz.io/imagecreator/remini?url=${encodeURIComponent(imageUrl)}`);

      if (!res.data.status || !res.data.result) return send.reply("❌ Failed to enhance image.");

      const resultUrl = res.data.result;
      const cacheDir = path.join(__dirname, "cache");
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
      const outputPath = path.join(cacheDir, `remini_${Date.now()}.jpg`);

      const imageRes = await axios.get(resultUrl, { responseType: 'arraybuffer' });
      fs.writeFileSync(outputPath, Buffer.from(imageRes.data));

      return api.sendMessage({
        body: "✨ Image enhanced to 4k!",
        attachment: fs.createReadStream(outputPath)
      }, threadID, () => {
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      }, messageID);

    } catch (error) {
      console.error(error);
      return send.reply("❌ An error occurred.");
    }
  }
};
