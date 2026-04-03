const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const yts = require("yt-search");

module.exports = {
  config: {
    name: "song",
    aliases: [],
    version: "4.0.0",
    credits: "Kashif Raza",
    description: "Download song/audio/video from YouTube",
    category: "media",
    usage: "song despacito [optional: video]",
    prefix: true
  },

  async run({ api, event, args, send }) {
    const { threadID, messageID } = event;
    const query = args.join(" ");
    if (!query) return send.reply("❌ Please provide a song name.");

    const wantVideo = query.toLowerCase().endsWith(" video");
    const searchTerm = wantVideo ? query.replace(/ video$/i, "").trim() : query.trim();
    const format = wantVideo ? "video" : "audio";
    const frames = [
      "🩵▰▱▱▱▱▱▱▱▱▱ 10%",
      "💙▰▰▱▱▱▱▱▱▱▱ 25%",
      "💜▰▰▰▰▱▱▱▱▱▱ 45%",
      "💖▰▰▰▰▰▰▱▱▱▱ 70%",
      "💗▰▰▰▰▰▰▰▰▰▰ 100% 😍"
    ];

    const loadingMsg = await api.sendMessage(`🔍 Searching for **${searchTerm}**...\n${frames[0]}`, threadID);

    try {
      const searchResults = await yts(searchTerm);
      const videos = searchResults.videos;

      if (!videos || videos.length === 0) {
        api.unsendMessage(loadingMsg.messageID);
        return send.reply("❌ No results found.");
      }

      const first = videos[0];
      const title = first.title;
      const videoUrl = first.url;
      const thumbnail = first.thumbnail;
      const author = first.author.name;

      await api.editMessage(`🎵 Found!\n\n${frames[1]}`, loadingMsg.messageID);
      await api.editMessage(`🎵 Downloading...\n\n${frames[2]}`, loadingMsg.messageID);

      let fetchRes;
      try {
        const apiUrl = `https://api.kraza.qzz.io/download/ytdl?url=${encodeURIComponent(videoUrl)}`;
        fetchRes = await axios.get(apiUrl, {
          headers: { 'Accept': 'application/json' },
          timeout: 60000
        });
      } catch (fetchError) {
        api.unsendMessage(loadingMsg.messageID);
        return send.reply(`❌ Failed to fetch download link: ${fetchError.message}`);
      }

      const downloadKey = wantVideo ? 'mp4' : 'mp3';
      if (!fetchRes.data.status || !fetchRes.data.result || !fetchRes.data.result[downloadKey]) {
        api.unsendMessage(loadingMsg.messageID);
        return send.reply(`❌ Failed to get ${format} download URL`);
      }

      const downloadUrl = fetchRes.data.result[downloadKey];

      await api.editMessage(`🎵 Processing...\n\n${frames[3]}`, loadingMsg.messageID);

      let mediaRes;
      try {
        mediaRes = await axios.get(downloadUrl, {
          responseType: 'arraybuffer',
          timeout: 180000
        });
      } catch (downloadError) {
        api.unsendMessage(loadingMsg.messageID);
        return send.reply(`❌ Download failed: ${downloadError.message}\n\nPlease try again later.`);
      }

      const cacheDir = path.join(__dirname, "cache");
      await fs.ensureDir(cacheDir);

      const ext = wantVideo ? 'mp4' : 'mp3';
      const mediaPath = path.join(cacheDir, `${Date.now()}_${format}.${ext}`);
      fs.writeFileSync(mediaPath, mediaRes.data);

      setTimeout(() => {
        api.editMessage(`🎵 Complete!\n\n${frames[4]}`, loadingMsg.messageID);
      }, 500);

      await api.sendMessage(
        {
          body: `🎵 ${title}\n📺 ${author}`,
          attachment: fs.createReadStream(mediaPath)
        },
        threadID
      );

      setTimeout(() => {
        try {
          if (fs.existsSync(mediaPath)) fs.unlinkSync(mediaPath);
          api.unsendMessage(loadingMsg.messageID);
        } catch (err) {
          console.log("Cleanup error:", err);
        }
      }, 10000);

    } catch (error) {
      console.error("Song command error:", error.message);
      api.unsendMessage(loadingMsg.messageID);
      return send.reply("❌ An error occurred while processing your request");
    }
  }
};
