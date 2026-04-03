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
  const templatePath = path.join(cacheDir, 'leave_template.jpg');

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
    name: 'leave',
    eventType: 'log:unsubscribe',
    description: 'Emotional goodbye with sad poetry & profile card'
  },

  async run({ api, event, send, Users, Threads }) {
    const { threadID, logMessageData } = event;
    const leftParticipantFbId = logMessageData.leftParticipantFbId;
    const botID = api.getCurrentUserID();

    if (leftParticipantFbId === botID) return;

    const settings = Threads.getSettings(threadID) || {};

    let name = 'Member';
    try {
      const info = await api.getUserInfo(leftParticipantFbId);
      const user = info?.[leftParticipantFbId];
      if (user) {
        name = user.name || user.firstName || user.alternateName || 'Member';
      }
    } catch {}

    name = (await Users.getNameUser(leftParticipantFbId)) || name;
    if (name.toLowerCase().includes('facebook') || name === 'User') name = 'Member';

    if (settings.antiout) {
      try {
        await api.addUserToGroup(leftParticipantFbId, threadID);
        await send(`🔒 ANTI-OUT ACTIVE\n\n${name}, hum tumhe jaane nahi denge!\nTum wapas add ho gaye ho. 💙`, threadID);
        return;
      } catch {}
    }

    let threadInfo;
    try {
      threadInfo = await api.getThreadInfo(threadID);
    } catch {
      threadInfo = { participantIDs: [] };
    }

    const memberCount = threadInfo.participantIDs?.length || 0;

    try {
      const cacheDir = path.join(__dirname, '../commands/cache');
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

      const templatePath = await downloadTemplate();
      if (templatePath) {
        const avatar = await getAvatar(leftParticipantFbId);
        if (avatar) {
          const circleImg = await makeCircularImage(avatar, 240); // size 240
          if (circleImg) {
            const template = await Jimp.read(templatePath);

            // Avatar position as per your request
            const rightX = 530;   // ← right side but not too far
            const topY   = 45;    // top margin
            template.composite(circleImg, rightX, topY);

            const outputPath = path.join(cacheDir, `leave_\( {leftParticipantFbId}_ \){Date.now()}.jpg`);
            await template.write(outputPath);

            // Beautiful + Sad + Left-feel message with poetry touch
            const goodbyeMsg = `✦ ━━━━━━━༺ 💔 ༻━━━━━━━ ✦

Ek dil se judaai ka dard...
Ek yaad jo kabhi na jaati...

💔  ${name}  💔

Tu chala gaya to jaise saans ruk si gayi  
Dil ke tukde bikhar gaye, khamoshi reh gayi  

"دل ٹوٹ گیا جب تو چلا گیا  
اب یاد تیری ہر پل ستاتی ہے  
خاموشی میں بھی تیرا نام گونجتا ہے  
پر اب کوئی جواب نہیں دیتا..."

Memories ab sirf aankhon mein aansuon ke saath rahengi  
Yeh group thoda sunsaan sa ho gaya hai tere bina...

────────────────────────────
Remaining stars: ${memberCount}
Group ab thodi si kami mehsoos karega...
────────────────────────────

Jahan bhi ho, khush raho... magar yaad rakhna hum yahan hain  
Allah hafiz, aur dil se... wapas aana kabhi to sahi ૮₍ ˶• ▿ •˶ ₎ა

✦ ━━━━━━━༺ 💔 ༻━━━━━━━ ✦`;

            await api.sendMessage({
              body: goodbyeMsg,
              attachment: fs.createReadStream(outputPath)
            }, threadID);

            setTimeout(() => {
              try { fs.unlinkSync(outputPath); } catch {}
            }, 5000);
            return;
          }
        }
      }
    } catch (e) {
      console.log("Leave event error:", e);
    }

    // Fallback text-only (sad vibe)
    const fallbackMsg = `༺♡༻  Sad Goodbye  ༺♡༻

${name}... tu chala gaya  
Dil ne chupke se ek cheekh maari  

"تو چلا گیا چھوڑ کے، دل کو تنہا کر گیا  
اب ہر لمحہ بس تیری کمی ستاتی ہے"

Ab yeh group thoda khali sa lagega...  
Remaining members: ${memberCount}

Jahan bhi ho, khush rehna... magar yaad rakhna  
💔 We will miss you 💔

༺♡༻  Take care  ༺♡༻`;

    await send(fallbackMsg, threadID);
  }
};