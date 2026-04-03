module.exports = {
  config: {
    name: 'work',
    aliases: ['job', 'earn'],
    description: 'Work to earn money',
    usage: 'work',
    category: 'Economy',
    prefix: true
  },
  
  async run({ api, event, send, Currencies, Users }) {
    const { senderID } = event;
    
    const result = Currencies.work(senderID);
    const name = await Users.getNameUser(senderID);
    
    if (!result.success) {
      return send.reply(`${name}, you need to rest!\n\nYou can work again in ${result.remaining} minutes.`);
    }
    
    const balance = Currencies.getBalance(senderID);
    
    return send.reply(`WORK COMPLETE!
─────────────────
User: ${name}
Job: ${result.job}
Earnings: $${result.earnings.toLocaleString()}
─────────────────
New Balance: $${balance.toLocaleString()}

You can work again in 30 minutes.`);
  }
};
