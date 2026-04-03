module.exports = {
  config: {
    name: "pakdb",
    aliases: [],
    version: "2.0.0",
    credits: "Raza + Fix",
    description: "Get Pakistani number details",
    category: "Utility",
    usage: "[number/cnic]",
    prefix: true
  },

  async run({ api, event, args, send }) {
    const axios = require("axios");
    const { threadID, messageID } = event;
    const input = args[0];

    if (!input) {
      return send.reply("⚠️ Please provide a CNIC or number!\nExample: /pakdb 4520890260257");
    }

    send.reply("🔍 Fetching details...");

    try {
      const res = await axios.get(
        `https://app.findpakjobs.pk/api.php?username=wduser1&password=112233&number=${input}`
      );

      const data = res.data;

      if (!data || !data.names || data.names.length === 0) {
        return send.reply("❌ No details found for this input.");
      }

      let msg = "👤 **Record Details** 👤\n\n";
      msg += `👤 Name: ${data.names[0] || "N/A"}\n`;
      msg += `🆔 CNIC: ${data.cnics[0] || "N/A"}\n\n`;

      msg += "📞 Numbers:\n";
      if (data.numbers && data.numbers.length > 0) {
        data.numbers.forEach((num, index) => {
          msg += `${index + 1}. ${num}\n`;
        });
      } else {
        msg += "No numbers found\n";
      }

      msg += "\n🏠 Address:\n";
      msg += data.addresses && data.addresses[0]
        ? data.addresses[0]
        : "No address found";

      api.sendMessage(msg, threadID, messageID);

    } catch (err) {
      console.error("API Error:", err.message);
      return send.reply("❌ Error fetching data. API may be down or invalid input.");
    }
  }
};
