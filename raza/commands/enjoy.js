module.exports = {
  config: {
    name: "enjoy",
    aliases: [],
    version: "1.0.2",
    credits: "RAZA",
    description: "Tag continuously",
    category: "Group",
    usage: "Tharakpan",
    prefix: true
  },

  async run({ api, args, Users, event, send }) {
    const { threadID, messageID, senderID, mentions } = event;
    var mention = Object.keys(mentions)[0];
    
    if (!mention) return send.reply("❌ Please tag someone!");

    setTimeout(() =>
      api.sendMessage({
        body: "Oye BaBe CoMe HeRe 😗 " + mentions[mention].replace("@", ""),
        mentions: [{
          tag: mentions[mention].replace("@", ""),
          id: mention
        }]
      }, threadID, messageID), 3000);

    setTimeout(() =>
      api.sendMessage("Main Uh K0o BtaTai TraRak Kya HoTi 🥵🫂", threadID), 6000);

    setTimeout(() =>
      api.sendMessage("ChaLo Ab Main STarT kRrTi Hun", threadID), 9000);

    var a = Math.floor(Math.random() * 7);
    if (a == 0) {
      setTimeout(() =>
        api.sendMessage({
          body: "Yeh DeKho BaBe Umumuaahhhhh 😘 ❤️" + mentions[mention].replace("@", ""),
          mentions: [{
            tag: mentions[mention].replace("@", ""),
            id: mention
          }]
        }, threadID), 15000);

      setTimeout(() =>
        api.sendMessage({
          body: "LiPPi PRr Umumuaahhhhh 😘 💋" + mentions[mention].replace("@", ""),
          mentions: [{
            tag: mentions[mention].replace("@", ""),
            id: mention
          }]
        }, threadID), 20000);
    }
    return send.reply("✅ Started!");
  }
};
