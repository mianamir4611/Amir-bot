const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const FormData = require('form-data');
const { tmpdir } = require('os');
const { basename, extname } = require('path');

function genserial() {
    let s = "";
    for (let i = 0; i < 32; i++) s += Math.floor(Math.random() * 16).toString(16);
    return s;
}

async function upload(filename) {
    const form = new FormData();
    form.append("file_name", filename);

    const res = await axios.post(
        "https://api.imgupscaler.ai/api/common/upload/upload-image",
        form,
        {
            headers: {
                ...form.getHeaders(),
                origin: "https://imgupscaler.ai",
                referer: "https://imgupscaler.ai/",
            },
        }
    );

    return res.data.result;
}

async function uploadtoOSS(putUrl, filePath) {
    const file = fs.readFileSync(filePath);
    const type = extname(filePath) === ".png" ? "image/png" : "image/jpeg";

    const res = await axios.put(putUrl, file, {
        headers: {
            "Content-Type": type,
            "Content-Length": file.length,
        },
        maxBodyLength: Infinity,
    });

    return res.status === 200;
}

async function createJob(imageUrl, prompt) {
    const form = new FormData();
    form.append("model_name", "magiceraser_v4");
    form.append("original_image_url", imageUrl);
    form.append("prompt", prompt);
    form.append("ratio", "match_input_image");
    form.append("output_format", "jpg");

    const res = await axios.post(
        "https://api.magiceraser.org/api/magiceraser/v2/image-editor/create-job",
        form,
        {
            headers: {
                ...form.getHeaders(),
                "product-code": "magiceraser",
                "product-serial": genserial(),
                origin: "https://imgupscaler.ai",
                referer: "https://imgupscaler.ai/",
            },
        }
    );

    return res.data.result.job_id;
}

async function cekjob(jobId) {
    const res = await axios.get(
        `https://api.magiceraser.org/api/magiceraser/v1/ai-remove/get-job/${jobId}`,
        {
            headers: {
                origin: "https://imgupscaler.ai",
                referer: "https://imgupscaler.ai/",
            },
        }
    );

    return res.data;
}

async function magicEraser(imagePath, prompt) {
    const filename = basename(imagePath);
    const up = await upload(filename);

    await uploadtoOSS(up.url, imagePath);

    const cdn = "https://cdn.imgupscaler.ai/" + up.object_name;
    const jobId = await createJob(cdn, prompt);

    let result;
    do {
        await new Promise((r) => setTimeout(r, 3000));
        result = await cekjob(jobId);
    } while (result.code === 300006);

    return result.result.output_url[0];
}

async function nanobanana(imageUrl, prompt) {
    try {
        const imgRes = await axios.get(imageUrl, { responseType: "arraybuffer" });
        const tmpInput = path.join(tmpdir(), `nano-${Date.now()}.jpg`);
        fs.writeFileSync(tmpInput, Buffer.from(imgRes.data));

        const resultUrl = await magicEraser(tmpInput, prompt);

        if (fs.existsSync(tmpInput)) fs.unlinkSync(tmpInput);

        return resultUrl;
    } catch (error) {
        throw new Error(error.message);
    }
}

module.exports = {
  config: {
    name: "edit",
    aliases: [],
    version: "3.0.0",
    credits: "Raza Engineering",
    description: "AI Image Editor - Remove/Edit images with a prompt",
    usage: "reply to an image with: edit [prompt]",
    category: "AI Tools",
    prefix: true
  },

  async run({ api, event, args, send }) {
    const { threadID, messageID, type, messageReply } = event;
    const prompt = args.join(" ").trim();

    if (!prompt) {
      return send.reply("❌ Please provide a prompt.\nExample: reply to an image with 'edit remove background'");
    }

    if (type !== "message_reply" || !messageReply.attachments || messageReply.attachments.length == 0 || messageReply.attachments[0].type !== "photo") {
      return send.reply("❌ Please reply to an image with 'edit <prompt>'");
    }

    try {
      send.reply("🎨 Editing your image... please wait a moment. ✨");

      const cacheDir = path.join(__dirname, "cache");
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

      const attachment = messageReply.attachments[0];
      const resultUrl = await nanobanana(attachment.url, prompt);

      const outputPath = path.join(cacheDir, `edited_${Date.now()}.jpg`);
      const editedImage = await axios.get(resultUrl, { responseType: 'arraybuffer' });
      fs.writeFileSync(outputPath, Buffer.from(editedImage.data));

      return api.sendMessage({
        body: "✨ Image edited successfully!",
        attachment: fs.createReadStream(outputPath)
      }, threadID, () => {
        setTimeout(() => {
          try { if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath); } catch (e) {}
        }, 2000);
      }, messageID);

    } catch (error) {
      console.error(error);
      return send.reply("❌ An error occurred while editing the image: " + error.message);
    }
  }
};
