const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
    config: {
        name: 'autoYoutube',
        eventType: 'message',
        description: 'Auto detect and download YouTube videos from links'
    },

    async run({ api, event }) {
        const { threadID, body, messageID, senderID } = event;

        if (!body) return;

        const botID = api.getCurrentUserID();
        if (senderID === botID) return;

        const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)[^\s]+/gi;
        const matches = body.match(youtubeRegex);

        if (!matches) return;

        const youtubeUrl = matches[0];

        const frames = [
            "🩵▰▱▱▱▱▱▱▱▱▱ 10%",
            "💙▰▰▱▱▱▱▱▱▱▱ 25%",
            "💜▰▰▰▰▱▱▱▱▱▱ 45%",
            "💖▰▰▰▰▰▰▱▱▱▱ 70%",
            "💗▰▰▰▰▰▰▰▰▰▰ 100% 😍"
        ];

        let statusMsg;

        try {
            statusMsg = await api.sendMessage(`🎬 YouTube Detected!\n\n${frames[0]}`, threadID);
        } catch (e) {
            return;
        }

        try {

            await api.editMessage(`🎬 Getting video info...\n\n${frames[1]}`, statusMsg.messageID);

            const apiUrl = `https://api.kraza.qzz.io/download/ytdl?url=${encodeURIComponent(youtubeUrl)}`;

            const res = await axios.get(apiUrl);

            if (!res.data || !res.data.status) {
                throw new Error("API failed");
            }

            const videoUrl = res.data.result.mp4;
            const title = res.data.result.title;

            await api.editMessage(`🎬 Downloading...\n\n${frames[2]}`, statusMsg.messageID);

            const video = await axios({
                url: videoUrl,
                method: "GET",
                responseType: "arraybuffer"
            });

            const cacheDir = path.join(__dirname, "../commands/cache");
            await fs.ensureDir(cacheDir);

            const videoPath = path.join(cacheDir, `${Date.now()}_youtube.mp4`);
            fs.writeFileSync(videoPath, Buffer.from(video.data));

            await api.editMessage(`🎬 Processing...\n\n${frames[3]}`, statusMsg.messageID);

            await api.sendMessage(
                {
                    body: `🎬 ${title}`,
                    attachment: fs.createReadStream(videoPath)
                },
                threadID
            );

            await api.editMessage(`🎬 Complete!\n\n${frames[4]}`, statusMsg.messageID);

            setTimeout(() => {
                try {
                    if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
                    api.unsendMessage(statusMsg.messageID);
                } catch (e) {}
            }, 20000);

        } catch (err) {

            console.log(err);

            try {
                await api.editMessage("❌ YouTube download failed", statusMsg.messageID);
            } catch (e) {}
        }
    }
};