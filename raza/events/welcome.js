const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const { Jimp } = require('jimp');

const templateUrl = "https://i.ibb.co/JFkxjm3W/36094c2d0d1d.jpg";

async function getAvatar(uid) {
  try {
    const url = `https://graph.facebook.com/${uid}/picture?width=300&height=300&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
    const response = await axios.get(url, { responseType: "arraybuffer", timeout: 5000 });
    return Buffer.from(response.data);
  } catch (e) {
    return null;
  }
}

async function downloadTemplate() {
  const cacheDir = path.join(__dirname, '../commands/cache');
  const templatePath = path.join(cacheDir, 'join_template.jpg');

  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

  if (!fs.existsSync(templatePath)) {
    try {
      const response = await axios.get(templateUrl, { responseType: "arraybuffer", timeout: 10000 });
      fs.writeFileSync(templatePath, Buffer.from(response.data));
    } catch (e) {
      return null;
    }
  }
  return templatePath;
}

async function makeCircularImage(buffer, size) {
  try {
    const image = await Jimp.read(buffer);
    image.resize({ w: size, h: size });

    const mask = new Jimp({ width: size, height: size, color: 0x00000000 });
    const center = size / 2;
    const radius = size / 2;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dist = Math.sqrt((x - center) ** 2 + (y - center) ** 2);
        if (dist <= radius) {
          mask.setPixelColor(0xFFFFFFFF, x, y);
        }
      }
    }

    image.mask(mask, 0, 0);
    return image;
  } catch (e) {
    return null;
  }
}

module.exports = {
  config: {
    name: 'welcome',
    eventType: 'log:subscribe',
    description: 'Welcome new members with beautiful card'
  },

  async run({ api, event, send, Users, Threads }) {
    const { threadID, logMessageData } = event;
    const addedParticipants = logMessageData.addedParticipants || [];
    const botID = api.getCurrentUserID();

    const settings = Threads.getSettings(threadID) || {};

    if (settings.antijoin) {
      for (const participant of addedParticipants) {
        if (participant.userFbId === botID) continue;
        try {
          await api.removeUserFromGroup(participant.userFbId, threadID);
        } catch {}
      }
      return;
    }

    const newMembers = addedParticipants.filter(p => p.userFbId !== botID);
    if (newMembers.length === 0) return;

    let threadInfo;
    try {
      threadInfo = await api.getThreadInfo(threadID);
    } catch {
      threadInfo = { threadName: 'our family' };
    }

    const groupName = threadInfo.threadName || 'our family';
    const memberCount = threadInfo.participantIDs?.length || 0;

    try {
      const cacheDir = path.join(__dirname, '../commands/cache');
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

      const templatePath = await downloadTemplate();

      for (const member of newMembers) {
        let name = member.fullName || 'New Star';

        // Better name fallback logic
        if (!name || name.toLowerCase().includes('facebook') || name.toLowerCase() === 'user') {
          try {
            const info = await api.getUserInfo(member.userFbId);
            const user = info?.[member.userFbId];
            if (user) {
              name = user.name || user.firstName || user.alternateName || 'New Friend';
            }
          } catch {}
          name = name || await Users.getNameUser(member.userFbId) || 'New Soul';
        }

        if (name.toLowerCase().includes('facebook') || name === 'User') name = 'New Star';

        await Users.create(member.userFbId, name);

        if (templatePath) {
          const avatar = await getAvatar(member.userFbId);
          if (avatar) {
            const circleImg = await makeCircularImage(avatar, 240);
            if (circleImg) {
              const template = await Jimp.read(templatePath);

              // ─── PROFILE PICTURE MOVED TO RIGHT SIDE ───
              // Assuming template width ≈ 1080–1200px → adjust 750–850 as needed
              // You can fine-tune this number after testing
              const rightX = 530;   // ← change this value to move left/right
              const topY   = 45;    // vertical position

              template.composite(circleImg, rightX, topY);

              const outputPath = path.join(cacheDir, `welcome_\( {member.userFbId}_ \){Date.now()}.jpg`);
              await template.write(outputPath);

              // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
              //          BEAUTIFUL WELCOME MESSAGE
              // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
              const welcomeMsg = `✧ ⋆ ˚｡⋆୨୧˚  Welcome ˚୨୧⋆｡˚ ⋆ ✧

A new heartbeat just joined our little universe ♡

💫  ${name}  💫

May your days here be filled with laughter,
warm conversations, and people who feel like home.

You’re not just a member — you’re a new sparkle in our sky.

──────────────────────────────
Current stars in the group:  ${memberCount}
Group: ${groupName}
──────────────────────────────

We’re so happy you’re here ૮₍ ˶ᵔ ᵕ ᵔ˶ ₎ა`;

              await api.sendMessage({
                body: welcomeMsg,
                attachment: fs.createReadStream(outputPath)
              }, threadID);

              // Clean up
              setTimeout(() => {
                try { fs.unlinkSync(outputPath); } catch {}
              }, 4000);
            }
          }
        } else {
          // Fallback text-only message
          const fallbackMsg = `✦ ───────༺𓆩♡𓆪༻─────── ✦

A beautiful soul just entered our world

✨  ${name}  ✨

May every moment here feel like magic for you

Total hearts now: ${memberCount}
Group: ${groupName}

Welcome with love ♡

✦ ───────༺𓆩♡𓆪༻─────── ✦`;

          await send(fallbackMsg, threadID);
        }
      }
    } catch (err) {
      console.log("Welcome command error:", err);
      await send(`👋 Welcome ${name || 'new friend'} to ${groupName}!`, threadID);
    }
  }
};