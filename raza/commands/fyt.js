const activeThreads = new Set();

module.exports = {
  config: {
    name: "fyt",
    aliases: [],
    version: "1.0.0",
    credits: "RAZA",
    description: "🔥 Roast (dizz) a tagged user with spicy lines",
    category: "Fun",
    usage: "dizz @mention | dizz stop",
    prefix: true
  },

  async run({ api, args, event, send }) {
    const threadID = event.threadID;

    if (args.length > 0 && args[0].toLowerCase() === "stop") {
      if (activeThreads.has(threadID)) {
        activeThreads.delete(threadID);
        return send.reply("🛑 | Dizz mode deactivated in this group.");
      } else {
        return send.reply("⚠️ | Dizz mode is not currently active in this group.");
      }
    }

    const mention = Object.keys(event.mentions)[0];
    if (!mention) {
      return send.reply("❌ | You need to tag someone to dizz them!");
    }

    const name = event.mentions[mention];
    const arraytag = [{ id: mention, tag: name }];
    activeThreads.add(threadID);

    const messages = [
      "You sound like a broken speaker trying to teach Mozart!",
      "You're a pigeon pretending to be a phoenix.",
      "Cheap knock-off pretending to be royalty.",
      "A clown dressed as a scholar? That's new!",
      "Ugly and pretending to be elegant. Yikes.",
      "Old outside, rotten inside. A double combo.",
      "You scream 'fake' louder than your outfit.",
      "Country dog tryna bark with city wolves."
    ];

    const selectedMsg = messages[Math.floor(Math.random() * messages.length)];
    
    return api.sendMessage({
      body: selectedMsg,
      mentions: [{ tag: name, id: mention }]
    }, threadID);
  }
};
