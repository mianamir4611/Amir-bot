module.exports = {
  config: {
    name: "virustext",
    aliases: ["zalgo"],
    version: "1.0.0",
    credits: "Raza",
    description: "Converts your text to Zalgo",
    category: "font",
    usage: "zalgo <text>",
    prefix: true
  },

  async run({ api, event, args, send }) {
    const Zalgo = require("to-zalgo");
    const text = args.join(" ");
    if (!text) return send.reply("❌ Please enter some text to convert.");
    return send.reply(Zalgo(text));
  }
};
