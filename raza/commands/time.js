module.exports = {
  config: {
    name: "time",
    aliases: [],
    version: "1.0.0",
    credits: "Raza",
    description: "Display current date and time of countries",
    category: "utility",
    usage: "",
    prefix: true
  },

  async run({ api, event, send }) {
    try {
      const moment = require("moment-timezone");

      const countries = {
        "Pakistan 🇵🇰": "Asia/Karachi",
        "United States 🇺🇸": "America/New_York",
        "India 🇮🇳": "Asia/Kolkata",
        "Bangladesh 🇧🇩": "Asia/Dhaka"
      };

      let messages = Object.entries(countries).map(([country, tz]) => {
        const time = moment.tz(tz).format("hh:mm:ss A");
        const date = moment.tz(tz).format("dddd, DD MMMM YYYY");
        return `🌍 Country: ${country}\n⏰ Time: 🕒  ${time}\n📅 Date:  ${date}`;
      });

      const message = 
`✨──────────────✨
       TIME INFORMATION
✨──────────────✨

${messages.join('\n\n')}

━━━━━━━━━━━━━━━━━━
⏳ updated at: ${moment().format("hh:mm A, DD/MM/YYYY")}
━━━━━━━━━━━━━━━━━━`;

      return send.reply(message);

    } catch (error) {
      return send.reply(`⚠️ Error: ${error.message}`);
    }
  }
};
