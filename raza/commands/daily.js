module.exports = {
  config: {
    name: 'daily',
    aliases: ['claim', 'reward'],
    description: 'Claim daily reward with streak bonus',
    usage: 'daily',
    category: 'Economy',
    prefix: true
  },
  
  async run({ api, event, send, Currencies, Users }) {
    const { senderID } = event;
    
    const result = Currencies.claimDaily(senderID);
    const name = await Users.getNameUser(senderID);
    
    if (!result.success) {
      if (result.reason === 'already_claimed') {
        return send.reply(`${name}, you have already claimed your daily reward today!\n\nCome back tomorrow.`);
      }
    }
    
    const balance = Currencies.getBalance(senderID);
    
    return send.reply(`DAILY REWARD CLAIMED!
─────────────────
User: ${name}
Reward: $${result.reward.toLocaleString()}
Streak: ${result.streak} days
─────────────────
New Balance: $${balance.toLocaleString()}

Keep claiming daily to increase your streak bonus!`);
  }
};
