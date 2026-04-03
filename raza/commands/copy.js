const fs = require("fs");
const path = require("path");
const axios = require("axios");

const dataFolder = path.join(__dirname, "cache", "data");

const getUserJsonPath = (userID) => {
  return path.join(dataFolder, `copiedMessage_${userID}.json`);
};

const scheduleCacheCleanup = (userID, filePaths) => {
  setTimeout(() => {
    try {
      const userJsonPath = getUserJsonPath(userID);
      
      if (fs.existsSync(userJsonPath)) {
        const data = JSON.parse(fs.readFileSync(userJsonPath, 'utf-8'));
        
        data.attachments.forEach(attPath => {
          if (fs.existsSync(attPath)) {
            fs.unlinkSync(attPath);
            console.log(`🗑️ Deleted cached attachment: ${attPath}`);
          }
        });
        
        fs.unlinkSync(userJsonPath);
        console.log(`🗑️ Deleted user cache: ${userJsonPath}`);
      }
      
      console.log(`🕐 Cache auto-cleanup completed for user ${userID} after 1 hour`);
    } catch (error) {
      console.error(`❌ Cache cleanup error for user ${userID}:`, error);
    }
  }, 3600000);
  
  console.log(`⏰ Scheduled cache cleanup for user ${userID} in 1 hour`);
};

module.exports = {
  config: {
    name: "copy",
    aliases: [],
    version: "1.0.1",
    credits: "RAZA",
    description: "📋 Copy a message (text + media) and save it",
    category: "Utility",
    usage: "Reply to a message to copy it",
    prefix: true
  },

  async run({ api, event, send }) {
    const { messageReply, threadID, senderID } = event;
    const userJsonPath = getUserJsonPath(senderID);

    if (!messageReply) {
      return send.reply("⚠️ | Please reply to a message to copy it.");
    }

    const { body, attachments } = messageReply;

    if (!fs.existsSync(dataFolder)) fs.mkdirSync(dataFolder, { recursive: true });

    let savedData = {
      body: body || '',
      attachments: []
    };

    const downloadPromises = attachments.map(async (att, index) => {
      const ext = att.type === "photo" ? ".jpg" :
                  att.type === "video" ? ".mp4" :
                  att.type === "audio" ? ".mp3" : "";
      const filename = `copied_${senderID}_${Date.now()}_${index}${ext}`;
      const filePath = path.join(dataFolder, filename);

      const response = await axios.get(att.url, { responseType: "stream" });
      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });

      savedData.attachments.push(filePath);
    });

    await Promise.all(downloadPromises);

    savedData.timestamp = Date.now();
    savedData.userID = senderID;
    
    fs.writeFileSync(userJsonPath, JSON.stringify(savedData, null, 2));
    
    scheduleCacheCleanup(senderID, savedData.attachments);

    return send.reply("✅ | Message copied and saved successfully! (Auto-delete in 1 hour)");
  }
};
