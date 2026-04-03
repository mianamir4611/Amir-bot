module.exports = {
  config: {
    name: "convert",
    aliases: [],
    description: "Convert video (mp4) to audio (mp3)",
    usage: "[reply to a video or provide URL]",
    category: "Utility",
    prefix: true
  },

  async run({ api, args, event, send }) {
    const axios = require("axios");
    const fs = require("fs-extra");
    const path = __dirname + "/cache/video_to_audio.mp3";

    try {
      let url;

      if (args[0]) {
        url = args[0];
      } else if (event.messageReply?.attachments[0]?.type === "video") {
        url = event.messageReply.attachments[0].url;
      } else {
        return send.reply("❌ Please reply to a video or provide a valid video URL.");
      }

      const response = await axios.get(url, { responseType: "arraybuffer" });
      fs.writeFileSync(path, Buffer.from(response.data, "utf-8"));

      const msg = {
        body: "✅ Successfully converted video to audio (MP3)!",
        attachment: fs.createReadStream(path)
      };

      api.sendMessage(msg, event.threadID, () => fs.unlinkSync(path), event.messageID);

    } catch (error) {
      console.error("CONVERT ERROR:", error);
      return send.reply("❌ An error occurred during conversion. Please try again.");
    }
  }
};
