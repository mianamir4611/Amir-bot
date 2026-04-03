const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const FormData = require("form-data");

module.exports = {
  config: {
    name: "catbox",
    aliases: ["cb"],
    version: "1.1.0",
    credits: "RAZA",
    description: "Upload files to Catbox",
    category: "utility",
    usage: "reply to video/audio/image with: catbox",
    prefix: true
  },

  async run({ api, event }) {
    const { threadID, messageID, type, messageReply } = event;

    if (type !== "message_reply" || !messageReply.attachments || messageReply.attachments.length === 0) {
      return api.sendMessage("❌ Reply to a video, audio, or image with: catbox", threadID, messageID);
    }

    try {
      const attachment = messageReply.attachments[0];
      const fileUrl = attachment.url;

      if (!fileUrl) {
        return api.sendMessage("❌ File URL not found", threadID, messageID);
      }

      await api.sendMessage("⏳ Uploading to Catbox...", threadID, messageID);

      // download file
      const fileRes = await axios.get(fileUrl, {
        responseType: "arraybuffer"
      });

      const ext = attachment.type || "file";
      const fileName = `upload_${Date.now()}.${ext}`;

      const form = new FormData();
      form.append("reqtype", "fileupload");
      form.append("fileToUpload", Buffer.from(fileRes.data), {
        filename: fileName,
        contentType: attachment.mimeType || "application/octet-stream"
      });

      const uploadRes = await axios.post(
        "https://catbox.moe/user/api.php",
        form,
        {
          headers: {
            ...form.getHeaders()
          },
          maxBodyLength: Infinity,
          maxContentLength: Infinity
        }
      );

      const uploadedUrl = uploadRes.data.trim();

      if (!uploadedUrl || uploadedUrl.includes("error")) {
        return api.sendMessage(`❌ Upload failed\n${uploadRes.data}`, threadID, messageID);
      }

      return api.sendMessage(
        `✅ Uploaded Successfully\n\n📁 ${uploadedUrl}`,
        threadID,
        messageID
      );

    } catch (err) {
      console.error("Catbox error:", err.response?.data || err.message);
      return api.sendMessage(`❌ Upload Error: ${err.message}`, threadID, messageID);
    }
  }
};