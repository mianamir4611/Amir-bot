const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: {
    name: "upscale",
    aliases: ["enhance", "hd"],
    version: "1.0.0",
    credits: "RAZA",
    description: "Upscale/enhance image quality",
    category: "Image",
    usage: "reply to image with: upscale [method:1-5, default 3]",
    prefix: true
  },

  async run({ api, event, args, send }) {
    const { threadID, messageID, type, messageReply } = event;

    if (type !== "message_reply" || !messageReply.attachments || !messageReply.attachments[0] || messageReply.attachments[0].type !== "photo") {
      return api.sendMessage("❌ Please reply to an image with 'upscale'", threadID, messageID);
    }

    const method = parseInt(args[0]) || 3;
    if (method < 1 || method > 5) {
      return api.sendMessage("❌ Method must be between 1-5", threadID, messageID);
    }

    try {
      api.sendMessage("🔧 Upscaling image... please wait", threadID);

      const cacheDir = path.join(__dirname, 'cache');
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

      const imageUrl = messageReply.attachments[0].url;
      const imageBuffer = await enhanceImage(imageUrl, method);
      const imagePath = path.join(cacheDir, `upscaled_${Date.now()}.jpg`);
      fs.writeFileSync(imagePath, imageBuffer);

      return api.sendMessage({
        body: `✨ Image Upscaled (Method ${method})`,
        attachment: fs.createReadStream(imagePath)
      }, threadID, () => {
        if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
      }, messageID);

    } catch (error) {
      console.error("Upscale command error:", error);
      return api.sendMessage(`❌ Error: ${error.message}`, threadID, messageID);
    }
  }
};

async function enhanceImage(imageUrl, method) {
  const FormData = require('form-data');
  const img = await axios.get(imageUrl, { responseType: 'arraybuffer' });

  const form = new FormData();
  form.append('method', method.toString());
  form.append('is_pro_version', 'false');
  form.append('is_enhancing_more', 'false');
  form.append('max_image_size', 'high');
  form.append('file', Buffer.from(img.data), 'image.jpg');

  const res = await axios.post('https://ihancer.com/api/enhance', form, {
    headers: { ...form.getHeaders(), 'user-agent': 'Dart/3.5 (dart:io)' },
    responseType: 'arraybuffer'
  });

  return Buffer.from(res.data);
}
