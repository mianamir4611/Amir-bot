const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: {
    name: 'userinfov2',
    aliases: ['uinfov2', 'userv2', 'userdetails'],
    description: 'Show advanced detailed user information (v2)',
    usage: 'userinfov2 [mention/reply/uid]',
    category: 'Utility',
    prefix: true
  },
  
  async run({ api, event, args, send, Users, Currencies, Threads }) {
    const { senderID, mentions, threadID } = event;
    
    let uid = senderID;
    
    if (Object.keys(mentions).length > 0) {
      uid = Object.keys(mentions)[0];
    } else if (args[0] && /^\d+$/.test(args[0])) {
      uid = args[0];
    } else if (event.messageReply) {
      uid = event.messageReply.senderID;
    }
    
    try {
      const info = await api.getUserInfo(uid);
      const userData = info[uid];
      
      if (!userData) {
        return send.reply('Could not fetch user information.');
      }
      
      // Get thread info to check admin status
      const threadInfo = await api.getThreadInfo(threadID);
      const adminIDs = threadInfo.adminIDs.map(a => a.id);
      const isGroupAdmin = adminIDs.includes(uid);
      
      const name = userData.name || 'Unknown';
      const gender = userData.gender === 1 ? '👩 Female' : userData.gender === 2 ? '👨 Male' : '❓ Unknown';
      const vanity = userData.vanity || 'None';
      const isFriend = userData.isFriend ? '✓ Yes' : '✗ No';
      const isVerified = userData.isVerified ? '✓ Verified' : '✗ Not Verified';
      const isPageAdmin = userData.is_page_admin ? '✓ Yes' : '✗ No';
      
      const currencyData = Currencies.get(uid);
      const balance = currencyData?.money || 0;
      const bank = currencyData?.bank || 0;
      const exp = currencyData?.exp || 0;
      const level = Math.floor(exp / 1000) + 1;
      const rank = currencyData?.rank || 'No Rank';
      
      // Get user messages count in this thread
      const messageCount = Users.getUserMessageCount?.(uid, threadID) || 0;
      
      const msg = `╔════════════════════════════════╗
║  👤 USER PROFILE (v2) 👤      ║
╚════════════════════════════════╝

📱 BASIC INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 Name: ${name}
🆔 User ID: ${uid}
${gender}
🔗 Profile: ${vanity !== 'None' ? `facebook.com/${vanity}` : 'No custom URL'}
✔️ Verification: ${isVerified}

👥 RELATIONSHIP STATUS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤝 Bot Friend: ${isFriend}
👨‍💼 Page Admin: ${isPageAdmin}
👑 Group Admin (this chat): ${isGroupAdmin ? '✓ Yes' : '✗ No'}

💰 ECONOMY STATS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💵 Cash: $${balance.toLocaleString()}
🏦 Bank: $${bank.toLocaleString()}
💎 Total: $${(balance + bank).toLocaleString()}
📊 Level: ${level}
🌟 EXP: ${exp.toLocaleString()}
🏆 Rank: ${rank}

📊 GROUP ACTIVITY (THIS CHAT)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💬 Messages: ${messageCount}

╚════════════════════════════════╝`;
      
      const cacheDir = path.join(__dirname, 'cache');
      fs.ensureDirSync(cacheDir);
      
      try {
        const avatarUrl = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
        const avatarRes = await axios.get(avatarUrl, { responseType: 'arraybuffer' });
        const avatarPath = path.join(cacheDir, `userinfov2_${uid}.jpg`);
        fs.writeFileSync(avatarPath, Buffer.from(avatarRes.data));
        
        await api.sendMessage({
          body: msg,
          attachment: fs.createReadStream(avatarPath)
        }, event.threadID, event.messageID);
        
        setTimeout(() => {
          try { fs.unlinkSync(avatarPath); } catch {}
        }, 5000);
      } catch {
        return send.reply(msg);
      }
    } catch (error) {
      return send.reply('Failed to get user info: ' + error.message);
    }
  }
};
