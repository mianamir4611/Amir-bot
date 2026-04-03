const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: {
    name: "imagine",
    aliases: ["gen", "img"],
    version: "1.0.0",
    credits: "RAZA",
    description: "Generate images from text prompt",
    category: "AI",
    usage: "imagine <prompt>",
    prefix: true
  },

  async run({ api, event, args, send }) {
    const { threadID, messageID } = event;
    const prompt = args.join(' ').trim();

    if (!prompt) {
      return api.sendMessage("❌ Usage: imagine <description>\n\nExample: imagine a cute cat in the rain", threadID, messageID);
    }

    try {
      api.sendMessage("🎨 Generating image... please wait", threadID);

      const cacheDir = path.join(__dirname, 'cache');
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

      const imageBuffer = await generateImage(prompt);
      const imagePath = path.join(cacheDir, `imagine_${Date.now()}.png`);
      fs.writeFileSync(imagePath, imageBuffer);

      return api.sendMessage({
        body: `✨ Generated Image\n\nPrompt: ${prompt}`,
        attachment: fs.createReadStream(imagePath)
      }, threadID, () => {
        if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
      }, messageID);

    } catch (error) {
      console.error("Imagine command error:", error);
      return api.sendMessage(`❌ Error: ${error.message}`, threadID, messageID);
    }
  }
};

async function generateImage(prompt) {
  const FormData = require('form-data');
  const https = require('https');
  const form = new FormData();
  form.append('Prompt', prompt);
  form.append('Language', 'eng_Latn');
  form.append('Size', '1024x1024');
  form.append('Upscale', '2');
  form.append('Batch_Index', '0');

  const agent = new https.Agent({ rejectUnauthorized: false });
  const response = await axios.post('https://api.zonerai.com/zoner-ai/txt2img', form, {
    httpsAgent: agent,
    headers: {
      ...form.getHeaders(),
      'Origin': 'https://zonerai.com',
      'Referer': 'https://zonerai.com/',
      'User-Agent': 'Mozilla/5.0'
    },
    responseType: 'arraybuffer'
  });

  return Buffer.from(response.data);
}
