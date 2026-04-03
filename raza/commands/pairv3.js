const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const jimp = require("jimp");

module.exports = {
  config: {
    name: "pairv3",
    aliases: [],
    version: "1.0.0",
    credits: "RAZA",
    description: "fun",
    category: "fun",
    prefix: true,
    usage: ""
  },

  async run({ args, Users, api, event, send }) {
    const fs = require("fs-extra");
    const axios = require("axios");
    let pathImg = __dirname + "/cache/background.png";
    let pathAvt1 = __dirname + "/cache/Avtmot.png";
    let pathAvt2 = __dirname + "/cache/Avthai.png";

    var id1 = event.senderID;
    var name1 = await Users.getNameUser(id1);
    var ThreadInfo = await new Promise((resolve) => {
      api.getThreadInfo(event.threadID, (err, info) => {
        if (err || !info) return resolve(null);
        resolve(info);
      });
    });
    if (!ThreadInfo || !ThreadInfo.userInfo) {
      return send.reply("❌ Could not get group info. Try again later.");
    }
    var all = ThreadInfo.userInfo
    for (let c of all) {
      if (c.id == id1) var gender1 = c.gender;
    }
    const botID = api.getCurrentUserID();
    let ungvien = [];
    if(gender1 == "FEMALE"){
      for (let u of all) {
        if (u.gender == "MALE") {
          if (u.id !== id1 && u.id !== botID) ungvien.push(u.id)
        }
      }
    }
    else if(gender1 == "MALE"){
      for (let u of all) {
        if (u.gender == "FEMALE") {
          if (u.id !== id1 && u.id !== botID) ungvien.push(u.id)
        }
      }
    }
    else {
      for (let u of all) {
        if (u.id !== id1 && u.id !== botID) ungvien.push(u.id)
      }
    }

    if (ungvien.length === 0) {
      return send.reply("❌ Not enough users in the group to pair!");
    }

    var id2 = ungvien[Math.floor(Math.random() * ungvien.length)];
    var name2 = await Users.getNameUser(id2);
    var rd1 = Math.floor(Math.random() * 100) + 1;
    var cc = ["0", "-1", "99,99", "-99", "-100", "101", "0,01"];
    var rd2 = cc[Math.floor(Math.random() * cc.length)];

    send.reply(`💑 Pairing ${name1} with ${name2}...\nCompatibility: ${rd1}%`);
  }
};
