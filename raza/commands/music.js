const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const yts = require('yt-search');

module.exports = {
  config: {
    name: "music",
    aliases: [],
    version: "3.0.0",
    credits: "Kashif Raza",
    description: "Download music from YouTube",
    usage: "music [song name]",
    category: "media",
    prefix: true
  },

  async run({ api, event, args, send }) {
    const query = args.join(" ");
    
    if (!query) {
      return send.reply("❌ Please provide a song name");
    }

    const frames = [
      "🩵▰▱▱▱▱▱▱▱▱▱ 10%",
      "💙▰▰▱▱▱▱▱▱▱▱ 25%",
      "💜▰▰▰▰▱▱▱▱▱▱ 45%",
      "💖▰▰▰▰▰▰▱▱▱▱ 70%",
      "💗▰▰▰▰▰▰▰▰▰▰ 100% 😍"
    ];

    const searchMsg = await api.sendMessage(`🔍 Searching...\n\n${frames[0]}`, event.threadID);

    try {
      const searchResults = await yts(query);
      const videos = searchResults.videos;
      
      if (!videos || videos.length === 0) {
        api.unsendMessage(searchMsg.messageID);
        return send.reply("❌ No results found");
      }

      const firstResult = videos[0];
      const videoUrl = firstResult.url;
      const title = firstResult.title;
      const author = firstResult.author.name;

      await api.editMessage(`🎵 Music found!\n\n${frames[1]}`, searchMsg.messageID);
      await api.editMessage(`🎵 Downloading...\n\n${frames[2]}`, searchMsg.messageID);

      let fetchRes;
      try {
        const apiUrl = `https://api.kraza.qzz.io/download/ytdl?url=${encodeURIComponent(videoUrl)}`;
        fetchRes = await axios.get(apiUrl, {
          headers: {
            'Accept': 'application/json'
          },
          timeout: 60000
        });
      } catch (fetchError) {
        api.unsendMessage(searchMsg.messageID);
        return send.reply(`❌ Failed to fetch download link: ${fetchError.message}`);
      }

      if (!fetchRes.data.status || !fetchRes.data.result || !fetchRes.data.result.mp3) {
        api.unsendMessage(searchMsg.messageID);
        return send.reply("❌ Failed to get mp3 download URL");
      }

      const downloadUrl = fetchRes.data.result.mp3;
      const thumbnail = firstResult.thumbnail;

      await api.editMessage(`🎵 Processing...\n\n${frames[3]}`, searchMsg.messageID);

      let audioRes;
      try {
        audioRes = await axios.get(downloadUrl, {
          responseType: 'arraybuffer',
          timeout: 180000
        });
      } catch (downloadError) {
        api.unsendMessage(searchMsg.messageID);
        return send.reply(`❌ Download failed: ${downloadError.message}\n\nPlease try again later.`);
      }

      const cacheDir = path.join(__dirname, "cache");
      await fs.ensureDir(cacheDir);

      const tempPath = path.join(cacheDir, `${Date.now()}_audio.mpeg`);
      const audioPath = path.join(cacheDir, `${Date.now()}_audio.mp3`);
      fs.writeFileSync(tempPath, audioRes.data);
      fs.renameSync(tempPath, audioPath);

      setTimeout(() => {
        api.editMessage(`🎵 Complete!\n\n${frames[4]}`, searchMsg.messageID);
      }, 500);

      let thumbPath = null;
      if (thumbnail) {
        try {
          const thumbRes = await axios.get(thumbnail, { responseType: 'arraybuffer' });
          thumbPath = path.join(cacheDir, `${Date.now()}_thumb.jpg`);
          fs.writeFileSync(thumbPath, Buffer.from(thumbRes.data));
        } catch (thumbError) {
          console.log("Thumbnail download failed:", thumbError.message);
        }
      }

      if (thumbPath) {
        await api.sendMessage(
          {
            body: `🎵 ${title}\n📺 ${author}`,
            attachment: fs.createReadStream(thumbPath)
          },
          event.threadID
        );
      }

      await api.sendMessage(
        {
          body: `🎵 Audio File`,
          attachment: fs.createReadStream(audioPath)
        },
        event.threadID
      );

      setTimeout(() => {
        try {
          if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
          if (thumbPath && fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
          api.unsendMessage(searchMsg.messageID);
        } catch (err) {
          console.log("Cleanup error:", err);
        }
      }, 10000);

    } catch (error) {
      console.error("Music command error:", error.message);
      api.unsendMessage(searchMsg.messageID);
      return send.reply("❌ An error occurred while processing your request");
    }
  }
};
