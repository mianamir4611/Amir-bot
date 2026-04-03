const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
    config: {
        name: 'autoTiktok',
        eventType: 'message',
        description: 'Auto detect and download TikTok videos from links'
    },

    async run({ api, event }) {
        const { threadID, body, messageID, senderID } = event;
        
        if (!body) return;
        
        const botID = api.getCurrentUserID();
        if (senderID === botID) return;

        const tiktokRegex = /(?:https?:\/\/)?(?:www\.|vm\.|vt\.)?(?:tiktok\.com)\/[^\s]+/gi;
        const matches = body.match(tiktokRegex);
        
        if (!matches || matches.length === 0) return;

        const tiktokUrl = matches[0];
        const API_BASE = "https://yt-tt.onrender.com";

        const frames = [
            "🩵▰▱▱▱▱▱▱▱▱▱ 10%",
            "💙▰▰▱▱▱▱▱▱▱▱ 25%",
            "💜▰▰▰▰▱▱▱▱▱▱ 45%",
            "💖▰▰▰▰▰▰▱▱▱▱ 70%",
            "💗▰▰▰▰▰▰▰▰▰▰ 100% 😍"
        ];

        let statusMsg;
        try {
            statusMsg = await api.sendMessage(`🎵 TikTok Detected!\n\n${frames[0]}`, threadID);
        } catch (e) {
            return;
        }

        const maxRetries = 3;
        let lastError = null;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                if (attempt > 1) {
                    await api.editMessage(`🎵 Retry ${attempt}/${maxRetries}...\n\n${frames[1]}`, statusMsg.messageID);
                    await new Promise(r => setTimeout(r, 2000));
                } else {
                    await api.editMessage(`🎵 Downloading TikTok...\n\n${frames[2]}`, statusMsg.messageID);
                }

                const response = await axios.get(`${API_BASE}/api/tiktok/download`, {
                    params: { url: tiktokUrl },
                    timeout: 90000,
                    responseType: 'arraybuffer',
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });

                if (!response.data || response.data.length < 1000) {
                    throw new Error("Empty or invalid response");
                }

                await api.editMessage(`🎵 Processing...\n\n${frames[3]}`, statusMsg.messageID);

                const cacheDir = path.join(__dirname, "../commands/cache");
                await fs.ensureDir(cacheDir);

                const videoPath = path.join(cacheDir, `${Date.now()}_auto_tiktok.mp4`);
                fs.writeFileSync(videoPath, Buffer.from(response.data));

                const stats = fs.statSync(videoPath);
                if (stats.size < 1000) {
                    fs.unlinkSync(videoPath);
                    throw new Error("Downloaded file too small");
                }

                await api.editMessage(`🎵 Complete!\n\n${frames[4]}`, statusMsg.messageID);

                await api.sendMessage(
                    {
                        body: `🎵 TikTok Video`,
                        attachment: fs.createReadStream(videoPath)
                    },
                    threadID
                );

                setTimeout(() => {
                    try {
                        if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
                        api.unsendMessage(statusMsg.messageID);
                    } catch (err) {}
                }, 20000);

                return;

            } catch (error) {
                lastError = error;
                console.log(`Auto TikTok attempt ${attempt} failed:`, error.message);
                
                if (attempt === maxRetries) {
                    try { 
                        await api.editMessage(`❌ TikTok download failed after ${maxRetries} attempts`, statusMsg.messageID);
                        setTimeout(() => {
                            try { api.unsendMessage(statusMsg.messageID); } catch(e) {}
                        }, 5000);
                    } catch(e) {}
                }
            }
        }
    }
};
