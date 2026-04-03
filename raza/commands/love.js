const fs = require('fs-extra');
const axios = global.nodemodule['axios'];
const path = require('path');

/**
 * File paths for data and images
 */
const DATA_PATH = path.resolve(__dirname, 'data', 'setlove.json');
const IMAGES_PATH = path.resolve(__dirname, 'data', 'setlove');

/**
 * Module configuration
 */
module.exports.config = {
  name: 'setlove',
  version: '2.0.0',
  hasPermssion: 0,
  credits: 'RAZA',
  description: 'Manage romantic relationships with your partner',
  category: 'Love',
  prefix: true,
  premium: false,
  usages: 'setlove [set @tag | check | del]',
  cooldowns: 5,
  dependencies: {
    'fs-extra': '',
    axios: '',
  },
};

/**
 * Initialize directories and files on module load
 */
module.exports.onLoad = async () => {
  try {
    if (!(await fs.pathExists(DATA_PATH))) {
      await fs.ensureFile(DATA_PATH);
      await fs.writeFile(DATA_PATH, JSON.stringify([]));
    }
    if (!(await fs.pathExists(IMAGES_PATH))) {
      await fs.mkdir(IMAGES_PATH);
    }
  } catch (error) {
    console.error('🚨 Error initializing setlove module:', error);
  }
};

/**
 * Main command execution logic
 */
module.exports.run = async ({ event, api, args }) => {
  const { threadID, messageID, senderID, mentions } = event;
  const now = Date.now();

  let loveData = [];
  try {
    loveData = JSON.parse(await fs.readFile(DATA_PATH));
  } catch (error) {
    console.error('🚨 Error reading setlove.json:', error);
  }

  const command = args[0]?.toLowerCase();

  switch (command) {
    case 'set':
      await handleSetLove({ api, threadID, messageID, senderID, mentions, loveData });
      break;
    case 'check':
      await handleCheckLove({ api, threadID, messageID, senderID, loveData, now });
      break;
    case 'del':
    case 'delete':
      await handleDeleteLove({ api, threadID, messageID, senderID, loveData });
      break;
    default:
      api.sendMessage(
        '💕 [SET LOVE COMMANDS] 💕\n\n' +
          '🔸 setlove set @tag - Set a love relationship with someone\n' +
          '🔸 setlove check - Check your relationship status and duration\n' +
          '🔸 setlove del - Delete your current relationship\n\n' +
          '💖 Find your perfect match and track your love journey!',
        threadID,
        messageID
      );
  }
};

/**
 * Handle setting a new love relationship
 */
async function handleSetLove({ api, threadID, messageID, senderID, mentions, loveData }) {
  if (Object.keys(mentions).length === 0) {
    return api.sendMessage('❌ Please tag someone to start a relationship with!\nUsage: setlove set @username', threadID, messageID);
  }

  const taggedUserID = Object.keys(mentions)[0];
  const taggedUserName = mentions[taggedUserID];

  // Check if sender is already in a relationship
  const senderRelationship = loveData.find(
    (rel) => rel.person1 === senderID || rel.person2 === senderID
  );

  if (senderRelationship) {
    const partnerID = senderRelationship.person1 === senderID ? senderRelationship.person2 : senderRelationship.person1;
    const partnerInfo = await api.getUserInfo(partnerID);
    const partnerName = partnerInfo[partnerID].name;
    return api.sendMessage(`❌ You are already in a relationship with ${partnerName}!\nUse 'setlove del' to end your current relationship first.`, threadID, messageID);
  }

  // Check if tagged user is already in a relationship
  const taggedUserRelationship = loveData.find(
    (rel) => rel.person1 === taggedUserID || rel.person2 === taggedUserID
  );

  if (taggedUserRelationship) {
    return api.sendMessage(`❌ ${taggedUserName} is already in a relationship with someone else!`, threadID, messageID);
  }

  // Send confirmation message
  api.sendMessage(
    {
      body: `💕 ${taggedUserName}, someone wants to be in a relationship with you!\n\n💖 React with ❤️ to accept this love request!\n⏰ You have 60 seconds to respond.`,
      mentions: [{ tag: taggedUserName, id: taggedUserID }],
    },
    threadID,
    (error, info) => {
      if (!error) {
        const botID = api.getCurrentUserID();
        
        // Initialize handleReaction Map if it doesn't exist
        if (!global.client.handleReaction) {
          global.client.handleReaction = new Map();
        }
        
        // Get or initialize the array for this bot
        if (!global.client.handleReaction.has(botID)) {
          global.client.handleReaction.set(botID, []);
        }
        
        const handleReactionData = global.client.handleReaction.get(botID);
        
        handleReactionData.push({
          name: module.exports.config.name,
          messageID: info.messageID,
          author: senderID,
          taggedUserID,
          taggedUserName,
          type: 'awaitConfirmation',
          timeout: setTimeout(() => {
            // Remove from handleReaction after timeout
            const updatedData = handleReactionData.filter(
              item => item.messageID !== info.messageID
            );
            global.client.handleReaction.set(botID, updatedData);
            api.sendMessage('⏰ Love request timed out. Please try again!', threadID);
          }, 60000)
        });
      }
    },
    messageID
  );
}

/**
 * Handle checking the duration of a love relationship
 */
async function handleCheckLove({ api, threadID, messageID, senderID, loveData, now }) {
  const relationship = loveData.find(
    (rel) => rel.person1 === senderID || rel.person2 === senderID
  );

  if (!relationship) {
    return api.sendMessage('💔 You are not currently in a relationship.\nUse "setlove set @username" to start one!', threadID, messageID);
  }

  const partnerID = relationship.person1 === senderID ? relationship.person2 : relationship.person1;
  const partnerInfo = await api.getUserInfo(partnerID);
  const partnerName = partnerInfo[partnerID].name;
  const setLoveDate = new Date(relationship.date);
  const duration = Math.floor((now - setLoveDate.getTime()) / (1000 * 60));

  const days = Math.floor(duration / (60 * 24));
  const hours = Math.floor((duration % (60 * 24)) / 60);
  const minutes = duration % 60;

  let durationText = '';
  if (days > 0) durationText += `${days} day${days > 1 ? 's' : ''}, `;
  if (hours > 0) durationText += `${hours} hour${hours > 1 ? 's' : ''}, `;
  durationText += `${minutes} minute${minutes > 1 ? 's' : ''}`;

  api.sendMessage(
    `💖 RELATIONSHIP STATUS 💖\n\n` +
    `👫 You and ${partnerName}\n` +
    `💕 Together for: ${durationText}\n` +
    `📅 Since: ${setLoveDate.toLocaleDateString()}\n\n` +
    `🌟 Keep your love strong! 🌟`,
    threadID,
    messageID
  );
}

/**
 * Handle deleting a love relationship
 */
async function handleDeleteLove({ api, threadID, messageID, senderID, loveData }) {
  const relationship = loveData.find(
    (rel) => rel.person1 === senderID || rel.person2 === senderID
  );

  if (!relationship) {
    return api.sendMessage('❌ You are not in a relationship to delete.', threadID, messageID);
  }

  const partnerID = relationship.person1 === senderID ? relationship.person2 : relationship.person1;
  const partnerInfo = await api.getUserInfo(partnerID);
  const partnerName = partnerInfo[partnerID].name;

  api.sendMessage(
    {
      body: `💔 ${partnerName}, your partner wants to end the relationship.\n\n💔 React with 💔 to confirm the breakup.\n⏰ You have 60 seconds to respond.`,
      mentions: [{ tag: partnerName, id: partnerID }],
    },
    threadID,
    (error, info) => {
      if (!error) {
        const botID = api.getCurrentUserID();
        
        // Initialize handleReaction Map if it doesn't exist
        if (!global.client.handleReaction) {
          global.client.handleReaction = new Map();
        }
        
        // Get or initialize the array for this bot
        if (!global.client.handleReaction.has(botID)) {
          global.client.handleReaction.set(botID, []);
        }
        
        const handleReactionData = global.client.handleReaction.get(botID);
        
        handleReactionData.push({
          name: module.exports.config.name,
          messageID: info.messageID,
          author: senderID,
          partnerID,
          partnerName,
          type: 'awaitBreakup',
          timeout: setTimeout(() => {
            // Auto-delete after timeout
            let updatedLoveData = loveData.filter(
              (rel) =>
                !(rel.person1 === senderID && rel.person2 === partnerID) &&
                !(rel.person1 === partnerID && rel.person2 === senderID)
            );
            fs.writeFile(DATA_PATH, JSON.stringify(updatedLoveData));
            const currentData = global.client.handleReaction.get(botID);
            const filteredData = currentData.filter(
              item => item.messageID !== info.messageID
            );
            global.client.handleReaction.set(botID, filteredData);
            api.sendMessage('💔 Relationship ended due to timeout.', threadID);
          }, 60000)
        });
      }
    },
    messageID
  );
}

/**
 * Handle reaction events for love confirmation or breakup
 */
module.exports.handleReaction = async ({ api, event, handleReaction }) => {
  const { threadID, messageID, userID, reaction } = event;

  if (handleReaction.type === 'awaitConfirmation') {
    if (userID === handleReaction.taggedUserID && reaction === '❤') {
      // Clear timeout
      clearTimeout(handleReaction.timeout);

      let loveData = [];
      try {
        loveData = JSON.parse(await fs.readFile(DATA_PATH));
      } catch (error) {
        console.error('🚨 Error reading setlove.json:', error);
      }

      loveData.push({
        person1: handleReaction.author,
        person2: handleReaction.taggedUserID,
        date: new Date().toISOString(),
      });

      await fs.writeFile(DATA_PATH, JSON.stringify(loveData, null, 2));
      api.sendMessage(
        {
          body: `🎉 CONGRATULATIONS! 🎉\n\n💖 You and ${handleReaction.taggedUserName} are now officially in a relationship!\n\n💕 May your love story be filled with happiness and joy! 💕`,
          mentions: [{ tag: handleReaction.taggedUserName, id: handleReaction.taggedUserID }],
        },
        threadID,
        messageID
      );
    }
  } else if (handleReaction.type === 'awaitBreakup') {
    if ((userID === handleReaction.author || userID === handleReaction.partnerID) && reaction === '💔') {
      // Clear timeout
      clearTimeout(handleReaction.timeout);

      let loveData = [];
      try {
        loveData = JSON.parse(await fs.readFile(DATA_PATH));
      } catch (error) {
        console.error('🚨 Error reading setlove.json:', error);
      }

      loveData = loveData.filter(
        (rel) =>
          !(rel.person1 === handleReaction.author && rel.person2 === handleReaction.partnerID) &&
          !(rel.person1 === handleReaction.partnerID && rel.person2 === handleReaction.author)
      );

      await fs.writeFile(DATA_PATH, JSON.stringify(loveData, null, 2));
      api.sendMessage('💔 Relationship ended successfully. Take care!', threadID, messageID);
    }
  }
};