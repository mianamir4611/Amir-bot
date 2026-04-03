const fs = require('fs-extra');
const axios = require('axios');
const path = require('path');
const { Jimp, JimpMime } = require('jimp');

module.exports = {
  config: {
    name: 'plove',
    aliases: [],
    version: '3.1.0',
    credits: 'Raza',
    description: 'Pairing',
    category: 'fun',
    prefix: true,
    usage: '[@tag]'
  },

  async run({ event, api, args, send }) {
    const dirMaterial = __dirname + `/cache/canvas/`;
    const filePath = path.resolve(__dirname, 'cache/canvas', 'pairlv.jpeg');
    
    if (!fs.existsSync(dirMaterial)) fs.mkdirSync(dirMaterial, { recursive: true });
    if (!fs.existsSync(filePath)) {
      try {
        const response = await axios.get("https://i.ibb.co/gZKWkVwb/OUKnbB6.jpg", { responseType: 'arraybuffer' });
        fs.writeFileSync(filePath, Buffer.from(response.data));
      } catch (error) {
        console.log("Error downloading pairing background image:", error.message);
      }
    }

    const mention = Object.keys(event.mentions)[0];
    if (!mention) {
      return api.sendMessage("❌ Please tag someone to pair with!", event.threadID, event.messageID);
    }

    const id2 = mention;
    const id1 = event.senderID;

    try {
      const image = await makeImage({ one: id1, two: id2 });
      return api.sendMessage({
        body: "💑 Perfect Match!",
        attachment: fs.createReadStream(image)
      }, event.threadID, () => {
        if (fs.existsSync(image)) fs.unlinkSync(image);
      }, event.messageID);
    } catch (error) {
      console.error(error);
      return api.sendMessage("❌ Error creating pairing image.", event.threadID, event.messageID);
    }
  }
};

async function makeImage({ one, two }) {
  const fs = require('fs-extra');
  const path = require('path');
  const axios = require('axios');
  const { Jimp, JimpMime } = require('jimp');
  const __root = path.resolve(__dirname, "cache", "canvas");

  let batgiam_img = await Jimp.read(__root + "/pairlv.jpeg");
  let pathImg = __root + `/batman${one}_${two}.png`;
  let avatarOne = __root + `/avt_${one}.png`;
  let avatarTwo = __root + `/avt_${two}.png`;
  
  let getAvatarOne = (await axios.get(`https://graph.facebook.com/${one}/picture?width=200&height=200&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: 'arraybuffer' })).data;
  fs.writeFileSync(avatarOne, Buffer.from(getAvatarOne));
  
  let getAvatarTwo = (await axios.get(`https://graph.facebook.com/${two}/picture?width=400&height=400&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: 'arraybuffer' })).data;
  fs.writeFileSync(avatarTwo, Buffer.from(getAvatarTwo));
  
  let circleOne = await Jimp.read(await circle(avatarOne));
  let circleTwo = await Jimp.read(await circle(avatarTwo));
  batgiam_img.composite(circleOne.resize({ w: 190, h: 200 }), 62, 90).composite(circleTwo.resize({ w: 199, h: 210 }), 405, 90);
  
  let raw = await batgiam_img.getBuffer(JimpMime.png);
  
  fs.writeFileSync(pathImg, raw);
  fs.unlinkSync(avatarOne);
  fs.unlinkSync(avatarTwo);
  
  return pathImg;
}

async function circle(imagePath) {
  const image = await Jimp.read(imagePath);
  image.circle();
  return await image.getBuffer(JimpMime.png);
}
