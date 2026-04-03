const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
    name: "tiktok",
    version: "1.0.0",
    permission: 0,
    prefix: true,
    premium: false,
    category: "media",
    credits: "Kashif Raza",
    description: "Download TikTok video",
    commandCategory: "media",
    usages: ".tiktok [TikTok URL]",
    aliases: ["tt", "tik"],
    cooldowns: 5
};

const API_BASE = "https://api.kraza.qzz.io";

async function downloadTikTok(tiktokUrl) {
    try {
        const response = await axios.get(`${API_BASE}/download/tiktok`, {
            params: { url: tiktokUrl },
            timeout: 60000
        });
        
        if (response.data && response.data.status && response.data.result) {
            const videoUrl = response.data.result.video_nowm;
            const videoRes = await axios.get(videoUrl, {
                timeout: 60000,
                responseType: 'arraybuffer'
            });
            return { success: true, data: videoRes.data };
        }
        return null;
    } catch (err) {
        console.log("TikTok download failed:", err.message);
        return null;
    }
}

module.exports.run = async function ({ api, event, args }) {
    const url = args[0];
    
    if (!url) {
        return api.sendMessage("❌ Please provide a TikTok URL\n\nUsage: .tiktok [URL]", event.threadID, event.messageID);
    }

    const tiktokRegex = /(?:https?:\/\/)?(?:www\.|vm\.|vt\.)?(?:tiktok\.com)\/.+/i;
    
    if (!tiktokRegex.test(url)) {
        return api.sendMessage("❌ Invalid TikTok URL. Please provide a valid TikTok link.", event.threadID, event.messageID);
    }

    const frames = [
        "🩵▰▱▱▱▱▱▱▱▱▱ 10%",
        "💙▰▰▱▱▱▱▱▱▱▱ 25%",
        "💜▰▰▰▰▱▱▱▱▱▱ 45%",
        "💖▰▰▰▰▰▰▱▱▱▱ 70%",
        "💗▰▰▰▰▰▰▰▰▰▰ 100% 😍"
    ];

    const searchMsg = await api.sendMessage(`🎵 TikTok Downloader\n\n${frames[0]}`, event.threadID);

    try {
        await api.editMessage(`🎵 Fetching video...\n\n${frames[1]}`, searchMsg.messageID);
        await api.editMessage(`🎵 Downloading...\n\n${frames[2]}`, searchMsg.messageID);

        const downloadResult = await downloadTikTok(url);
        
        if (!downloadResult || !downloadResult.success) {
            api.unsendMessage(searchMsg.messageID);
            return api.sendMessage("❌ Download failed. Please check the URL and try again.", event.threadID, event.messageID);
        }

        await api.editMessage(`🎵 Processing...\n\n${frames[3]}`, searchMsg.messageID);

        const cacheDir = path.join(__dirname, "cache");
        await fs.ensureDir(cacheDir);

        const videoPath = path.join(cacheDir, `${Date.now()}_tiktok.mp4`);
        fs.writeFileSync(videoPath, Buffer.from(downloadResult.data));

        await api.editMessage(`🎵 Complete!\n\n${frames[4]}`, searchMsg.messageID);

        await api.sendMessage(
            {
                body: `🎵 TikTok Video Downloaded`,
                attachment: fs.createReadStream(videoPath)
            },
            event.threadID
        );

        setTimeout(() => {
            try {
                if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
                api.unsendMessage(searchMsg.messageID);
            } catch (err) {
                console.log("Cleanup error:", err);
            }
        }, 15000);

    } catch (error) {
        console.error("TikTok command error:", error.message);
        try { api.unsendMessage(searchMsg.messageID); } catch(e) {}
        return api.sendMessage("❌ An error occurred. Please try again.", event.threadID, event.messageID);
    }
};
