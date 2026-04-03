const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');

module.exports = {
  config: {
    name: 'setgroupimage',
    aliases: ['sgi', 'groupdp', 'groupimage', 'setgroupdp'],
    description: 'Set group profile picture/image',
    usage: 'setgroupimage [reply to image/image URL]',
    category: 'Group Management',
    adminOnly: true,
    groupOnly: true,
    prefix: true
  },

  async run({ api, event, args, send }) {
    const { threadID, senderID, messageReply, attachments } = event;

    try {
      let imagePath = null;
      const tempDir = path.join(__dirname, '../temp');
      fs.ensureDirSync(tempDir);

      // Check if replying to a message with attachment
      if (messageReply && messageReply.attachments && messageReply.attachments.length > 0) {
        const attachment = messageReply.attachments[0];
        if (attachment.type === 'photo' || attachment.url) {
          const imageUrl = attachment.url;
          const tempImagePath = path.join(tempDir, `groupimage_${Date.now()}.jpg`);
          
          const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
          fs.writeFileSync(tempImagePath, Buffer.from(response.data));
          imagePath = tempImagePath;
        }
      }
      // Check if there are attachments in current message
      else if (attachments && attachments.length > 0) {
        const attachment = attachments[0];
        if (attachment.type === 'photo' || attachment.url) {
          const imageUrl = attachment.url;
          const tempImagePath = path.join(tempDir, `groupimage_${Date.now()}.jpg`);
          
          const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
          fs.writeFileSync(tempImagePath, Buffer.from(response.data));
          imagePath = tempImagePath;
        }
      }
      // Check if URL is provided as argument
      else if (args.length > 0) {
        const urlArg = args.join(' ');
        if (urlArg.startsWith('http')) {
          const tempImagePath = path.join(tempDir, `groupimage_${Date.now()}.jpg`);
          
          const response = await axios.get(urlArg, { responseType: 'arraybuffer' });
          fs.writeFileSync(tempImagePath, Buffer.from(response.data));
          imagePath = tempImagePath;
        }
      }

      if (!imagePath) {
        return send.reply('❌ Please reply to an image, provide an image URL, or attach an image.\n\nUsage: .setgroupimage [image URL]');
      }

      // Change the group image
      try {
        const imageStream = fs.createReadStream(imagePath);
        await api.changeGroupImage(imageStream, threadID);
        
        // Clean up temp file after a delay
        setTimeout(() => {
          try { fs.unlinkSync(imagePath); } catch {}
        }, 5000);

        return send.reply('✅ Group image updated successfully!');
      } catch (apiError) {
        // Clean up temp file
        try { fs.unlinkSync(imagePath); } catch {}
        return send.reply(`❌ Failed to change group image: ${apiError.message}`);
      }

    } catch (error) {
      return send.reply(`❌ Error: ${error.message}`);
    }
  }
};
