const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: {
    name: "eraser",
    aliases: ["erase", "remove"],
    version: "1.0.0",
    credits: "RAZA",
    description: "Remove objects from image using AI (Magic Eraser)",
    category: "Image",
    usage: "reply to image with: eraser <description of what to remove>",
    prefix: true
  },

  async run({ api, event, args, send }) {
    const { threadID, messageID, type, messageReply } = event;

    if (type !== "message_reply" || !messageReply.attachments || !messageReply.attachments[0] || messageReply.attachments[0].type !== "photo") {
      return api.sendMessage("❌ Please reply to an image with 'eraser <description>'", threadID, messageID);
    }

    const prompt = args.join(' ').trim();
    if (!prompt) {
      return api.sendMessage("❌ Please provide what to remove\nExample: eraser person in background", threadID, messageID);
    }

    try {
      api.sendMessage("⏳ Processing image... this may take 10-30 seconds", threadID);

      const imageUrl = messageReply.attachments[0].url;
      const resultUrl = await magicEraser(imageUrl, prompt);

      const cacheDir = path.join(__dirname, 'cache');
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

      const resultImg = await axios.get(resultUrl, { responseType: 'arraybuffer', timeout: 60000 });
      const imagePath = path.join(cacheDir, `erased_${Date.now()}.png`);
      fs.writeFileSync(imagePath, Buffer.from(resultImg.data));

      return api.sendMessage({
        body: `✨ Object Removed\n\nRemoved: ${prompt}`,
        attachment: fs.createReadStream(imagePath)
      }, threadID, () => {
        if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
      }, messageID);

    } catch (error) {
      console.error("Eraser command error:", error);
      return api.sendMessage(`❌ Error: ${error.message}`, threadID, messageID);
    }
  }
};

async function magicEraser(imageUrl, prompt) {
  const FormData = require('form-data');
  const { tmpdir } = require('os');
  
  const imgRes = await axios.get(imageUrl, { responseType: 'arraybuffer' });
  const tmpInput = path.join(tmpdir(), `nano-${Date.now()}.jpg`);
  fs.writeFileSync(tmpInput, Buffer.from(imgRes.data));

  try {
    const filename = path.basename(tmpInput);
    const up = await uploadFile(filename);
    await uploadToOSS(up.url, tmpInput);

    const cdn = "https://cdn.imgupscaler.ai/" + up.object_name;
    const jobId = await createJob(cdn, prompt);

    let result;
    let attempts = 0;
    do {
      await new Promise((r) => setTimeout(r, 3000));
      result = await checkJob(jobId);
      attempts++;
      if (attempts > 10) throw new Error("Timeout waiting for processing");
    } while (result.code === 300006);

    if (!result.result?.output_url?.[0]) {
      throw new Error("Failed to process image");
    }

    return result.result.output_url[0];
  } finally {
    if (fs.existsSync(tmpInput)) fs.unlinkSync(tmpInput);
  }
}

async function uploadFile(filename) {
  const FormData = require('form-data');
  const form = new FormData();
  form.append("file_name", filename);

  const res = await axios.post("https://api.imgupscaler.ai/api/common/upload/upload-image", form, {
    headers: { ...form.getHeaders(), origin: "https://imgupscaler.ai", referer: "https://imgupscaler.ai/" }
  });

  return res.data.result;
}

async function uploadToOSS(putUrl, filePath) {
  const file = fs.readFileSync(filePath);
  const ext = path.extname(filePath);
  const type = ext === ".png" ? "image/png" : "image/jpeg";

  await axios.put(putUrl, file, {
    headers: { "Content-Type": type, "Content-Length": file.length },
    maxBodyLength: Infinity
  });
}

async function createJob(imageUrl, prompt) {
  const FormData = require('form-data');
  const form = new FormData();
  form.append("model_name", "magiceraser_v4");
  form.append("original_image_url", imageUrl);
  form.append("prompt", prompt);
  form.append("ratio", "match_input_image");
  form.append("output_format", "jpg");

  function genserial() {
    let s = "";
    for (let i = 0; i < 32; i++) s += Math.floor(Math.random() * 16).toString(16);
    return s;
  }

  const res = await axios.post("https://api.magiceraser.org/api/magiceraser/v2/image-editor/create-job", form, {
    headers: {
      ...form.getHeaders(),
      "product-code": "magiceraser",
      "product-serial": genserial(),
      origin: "https://imgupscaler.ai",
      referer: "https://imgupscaler.ai/"
    }
  });

  return res.data.result.job_id;
}

async function checkJob(jobId) {
  const res = await axios.get(
    `https://api.magiceraser.org/api/magiceraser/v1/ai-remove/get-job/${jobId}`,
    {
      headers: {
        origin: "https://imgupscaler.ai",
        referer: "https://imgupscaler.ai/"
      }
    }
  );

  return res.data;
}
