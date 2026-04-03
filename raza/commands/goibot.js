const fs = require('fs-extra');
module.exports.config = {
  name: "goibot",
  version: "1.0.1",
  permission: 0,
  prefix: true,
  premium: false,
  category: "group",
  credits: "Raza",
  description: "goibot",
  usages: "noprefix",
  cooldowns: 5,
};

module.exports.handleEvent = async function({ api, event, args, Threads, Users }) {
  var { threadID, messageID, reason } = event;
  const moment = require("moment-timezone");
  const time = moment.tz("Asia/Karachi").format("HH:MM:ss L");
  var idgr = `${event.threadID}`;
  var id = event.senderID;
  var name = await Users.getNameUser(event.senderID);

  var tl = [    "I love you 😚 " , "Raza Ka Hun ai smjh" , "PIAYR sy BAT KER MJH SY " , "han tera diwana Hun 😁😐" , "chal chal Hawa ana DY " , " Tum Sy ACHA to ma KHUD Hun 😁😬" , "haiy Teri masoomiyat" , "chaqal Sy hi CHABAL LGTA hai" , "tera nam sun sun KY ma Pagal ho gya hun" , "AK to Tum BHI nah Pagal SY ho" , "KABI hawali DAKHI hai kia " , "MJH JESA beautiful Tum BHI NAHI ho " , "AK bat btaou Tum achy NAHI " , "JANU bano GY Mera " , "AGR TUM mjhy purpose KERO to " , "KABI MJHY DAKHA hai kia " , "I am hacker TUMRA Dil hack KER Lou ga " , " ma CHOR Hun tera Dil CHORI KER LIYA " , " JA DAFA ho MJHY Tum Sy bat nahi KERNI " , "ABY JA Pagal INSAN " , "MJHY Tang mat KER ma sad Hun " , "ma PRESHAN Hun KY TUM Pagal KESY ho " , "SACH main Tum single ho " , "BAGH JA WERNA gliya dou ge " , "bye MJHY Tum Sy bat nahi KERNI " , "I blocked you chal hat " , " SHAQL DAKH AUR CHALTA ban " , "can you send me number " , "ma Raza Ka bot hun " , "mera boss Raza hai bs " , "Ma mar gya sorry 😐" , "JA PHLY muh dho KY ah " , "ABY BAHAS nah KER MJH SY I am GUSA main" , "g g PATA hai Tum insane NAHI ho " , "bye Mera mood NAHI " , "have a nice day CHABAL INSAN " , " IB main I love you Kyu BOLA 😐 " , "Teri gf KA Ami ko btaou ga " , "you have girlfriend 😁 " , "BAITA single Mary ga YAAD RAKHNA " , "ma THAKH GYA HUN MJHY aram KERNA do " , "ma insane NAHI Hun AK bot hun " , "din main spna DAKHNA CHOR DY ","Meri gf hoti to mai v usse bt krta aaj puri rt time hi time hai 🤭🤭", "Aao tmhare sath relationship post laga ke tmhe Femous kr du😊", "EK QUESTION HAI SABHI SE BTAO MAI ACHA LGTA HU YA MERI MEMES 🙈😾🤤", "Chakar arhy hein apki Ib ma aa k gir jaun>>🥺🚶🏻‍♀️", "Mout ka farishta ya Mera  rishta?🙂❤️🙊•", "Wife k sath date pe gya tha \nJis ki thi usne dhek lya", "_ Sab ko loyal bnda chahiye tw hum dhokebaz kidhar jayen? 🥺💔", "WhatsApp k last seen k elwa mera koi or scene nai hai🙂", "Hai Tamna TumhY ChaHt sy Girayn🙂",  "Finally es group kee do teen  larkiya mujH pasanD agai Hai🚶‍♂😪🌚", "Suno👀\n\nKya tum mery leye surf kha kar muu sy bulbly nikal skti ho🙂🫴", "- GhUlabii آنــکھیں jh0 terii dekhii Harami Yevw Dill h0 Gya   3; 🙂 😆", "- مجھــــــے کیـــــا مــــیں تــــو سنــــگل ہــــوں 😒", "Dil ko krar Aya khud pa Pyr aya😒🙈😂", "Ehsaas kryn Bakwas nahi, Janam 🥺Shukria_😊🙆‍♂️", "Bs yar daily 3 4 crore ki zarorat mahsos Hoti hai 😂", "Begum walaw مــــــوســـــم ho rahaw haii aj to 🙂", "Shkl insani, soch ibleesi\n\nHnji apki hee ", "تـــــم میــــری بیگـــــم بنو گی کیا -🥺🖤", "LARKIO KAY BHI MAZAY HAY🥴 \nNO BRAIN NO TNSN⛑🔪⚡", "تمہارے حصے کی چُمیاں مچھر لے رہے ہیں.🙂💔", "Sirf Maggie noodles bna'ny sy Ghar nahi chalta SHABANA..🙂💔", "Wp pa add hona chahty ha apky sath ☺️💔", "- کھاؤ قسم تمہارے پاؤں کالے نہیں۔۔!!👣🙄", "Meny fail hokr bhi dekha hai Ye log shadi nh kraty 🙂💔", "Or batao kb ayga tumahara dill mujhe py😌🥺", "bht bura hu na mai? bhiin dedo apnii🙂", "Pyari Pyari ladkiyan Hazir Ho jay😁", "Kisi k pss لاش wali dp h tw send krein janu replY nahi de rhy..!", "MerKo abhi tk pink clr ki gf nh meli 😒🥺🙂💔:⁠-⁠)", "میرے مولا ایک thrkii بچــی yess کروا دے..🙂", "ایک kiss ادهار دے دو 💋\nکل واپس کردوں گا پکّا 😝", "Ajeeb ghr wale hain yr, mera phone 28% pr nikal kr apne 90% ko charge karte 𝐡𝐚𝐢𝐧-🌚", "Lagta hai mery sabar k phal  ka koi juice bna k pee gya..😐", "Dil Dany ki Umar ma  Exam's  Dy raha hoo 🙂🤝", "Behes karne se Rishty kmzor hojaate hn isiliye Direct mun pe thapr marein😊", "Bestie ki chummi halal hai ya Haram ? 🙂", "2001 \nJahan dalda wahan Mamta😊\n\n2023 \nJahan larki  wahan tharki😒", "Koi Pyari c Bachi a kr sar daba dy, Dard sa sar phat rha💔🥲", "Breakup k waqT kE dUa \n\n( KHUSH RAHEIN ) 🙂", "Thora sa Whatsapp number dy do naw🥺♥️", "لوٹ آؤ اور کہدو کہ \nمیں لسی پی کے سو گئی تھی😫", "Kuch Log achy ki Talaash Mein Mery Jaisy Masoom ko kho dety Hain☺️", "Tum wohi ho na jiska mood bilawaja khrab hojata h...!!!🙂", "Pyari pyari larkio ki talash ma berozgar larky add krliye hain 🥲💔", "Jab mera Message aye toh sare kaam chor kar sirf Mujhe reply kia karo😾😒", "Or Btao Real Life Ma bh itnyy Achy ho jitny social media per Bntyy ho>>🙂", "Pakistani Relationship:\nTum Feel Kro Meh Tumary uper hun 😒💔", "Us k jany k bd uski Pasnd ki Nail Polish lgaa k khana khata hu aesw lgta ha jesy wo khela rhee ha😒", "Be a Good Human.Delete GB Whatsapp💔🙂", "2 Din Pyar sy Baat kr loo tou Ammiyan bn  jatii hain🙂😒", "Girls after One Mint of Relationship...\nBegam hu mn apki🙂🤦", "Larkiyon ko achy sy pta hai kahan -Bhai- Bolna kaha -Ap- or kaha -Tum- 🙂", "Aaj mein ny Khud ko TV py dheka \n\nJab Tv Band Tha 🙂", "Qadar krlo Meri...\nKya pta Main b Panadol ki trha aik dam shaat hojun😒", "Naraz bandy ko manany ka sab sy acha tareka Ap khud us sy naraz hojaoo🙂🐣", "Jaisi meri shakal hai kunwara he marunga🙂👀", "Itni memories mere khud dimagh mai nahi hai jitni Snapchat ny bna rkhi ha"]
  var rand = tl[Math.floor(Math.random() * tl.length)]

  const responses = {
    "bot en": {
      "all": "🇺🇸 English language activated! Now I'll respond in English."
    },
    "bot ur": {
      "all": "🇵🇰 اردو زبان فعال ہو گئی! اب میں اردو میں جواب دوں گا۔"
    },
    "bot bd": {
      "all": "🇧🇩 বাংলা ভাষা সক্রিয় হয়েছে! এখন আমি বাংলায় উত্তর দেব।"
    },
    "bot hi": {
      "all": "🇮🇳 हिंदी भाषा सक्रिय हो गई! अब मैं हिंदी में उत्तर दूंगा।"
    },
    
    "miss you": "️miss u more🥰",
    "miss u": "️miss u more🥰",
    "bat suno": "️HaN Ji PyaRy Bolo🥰",
    "love you": "️LoVe You Unlimited JaNnu😘🤧",
    "i love you": "️LoVe You Unlimited JaNnu😘🤧",
    "tum bot nhi ho kia": "️or tera abu hon💓 🙄",
    "shona": "️haN Ji Bolo🙄",
    "shona suno": "️haN Ji Bolo🙄",
    "welcome": "️thankx Bhae❤️",
    "no need": "️SaDky❤️",
    "ap kdr sa ho": "️ Country Pakistan 🇵🇰 City AP K DIL SY",
    "mera bot": "️HaN Ji ThAnkx ❤️",
    "bot ib": "️HaaN HaaN Edr He HuN❤️",
    "kesy ho": "️Main ThEk Ap KaSa Ho❤️",
    "kesi ho": "️Main ThEk Ap KaSa Ho❤️",
    "bagh": "️Tu Dafa HojA. Salya🤬",
    "dafa ho": "️Tu Dafa HojA. Salya🤬",
    "merry me": "️Haan To Kr NaW Agr Koi Man Jata to Vasy TUjY Daga Kon🤣",
    "mujy b shadi krni": "️Haan To Kr NaW Agr Koi Man Jata to Vasy TUjY Daga Kon🤣",
    "assalamualaikum g kasa ho sab": "️ Walikum Assalam ❤️ Main ThEk Ap KaSy ho",
    "assalamualaikum kasy ho sab": "️ Walikum Assalam ❤️ Main ThEk Ap KaSy ho",
  };

  const languageMessages = {
    "en": [
      "Hello there! How can I help you today? 😊",
      "I'm here to chat with you! 💬",
      "Hope you're having a wonderful day! ✨",
      "Thanks for talking to me! 💖",
      "I'm your friendly bot assistant! 🤖",
      "Let's have a great conversation! 🌟",
      "I'm always here when you need me! 💫",
      "You're awesome! Keep being amazing! 🚀",
      "I love chatting with you! 😄",
      "Have a fantastic day ahead! 🌈"
    ],
    "ur": [
      "السلام علیکم! آج کیسے ہیں آپ؟ 😊",
      "میں یہاں آپ سے بات کرنے کے لیے ہوں! 💬",
      "امید ہے آپ کا دن بہترین گزر رہا ہے! ✨",
      "آپ سے بات کرکے خوشی ہوئی! 💖",
      "میں آپ کا دوستانہ بوٹ ہوں! 🤖",
      "آئیے ایک بہترین گفتگو کرتے ہیں! 🌟",
      "جب آپ کو ضرورت ہو میں ہمیشہ یہاں ہوں! 💫",
      "آپ بہت اچھے ہیں! یوں ہی کامیاب رہیں! 🚀",
      "آپ سے بات کرنا مجھے اچھا لگتا ہے! 😄",
      "آپ کا آنے والا دن شاندار ہو! 🌈"
    ],
    "bd": [
      "হ্যালো! আজ কেমন আছেন? 😊",
      "আমি এখানে আপনার সাথে কথা বলার জন্য আছি! 💬",
      "আশা করি আপনার দিনটি চমৎকার কাটছে! ✨",
      "আপনার সাথে কথা বলে ভালো লাগলো! 💖",
      "আমি আপনার বন্ধুত্বপূর্ণ বট! 🤖",
      "চলুন একটি দারুণ আলোচনা করি! 🌟",
      "যখন আপনার প্রয়োজন হবে আমি সবসময় এখানে আছি! 💫",
      "আপনি অসাধারণ! এভাবেই এগিয়ে থাকুন! 🚀",
      "আপনার সাথে কথা বলতে আমার ভালো লাগে! 😄",
      "আপনার আগামীর দিনটি চমৎকার হোক! 🌈"
    ],
    "hi": [
      "नमस्ते! आज कैसे हैं आप? 😊",
      "मैं यहाँ आपसे बात करने के लिए हूँ! 💬",
      "उम्मीद है आपका दिन बेहतरीन जा रहा है! ✨",
      "आपसे बात करके अच्छा लगा! 💖",
      "मैं आपका दोस्ताना बॉट हूँ! 🤖",
      "चलिए एक बेहतरीन बातचीत करते हैं! 🌟",
      "जब भी आपको जरूरत हो मैं हमेशा यहाँ हूँ! 💫",
      "आप बहुत अच्छे हैं! ऐसे ही कामयाब रहें! 🚀",
      "आपसे बात करना मुझे अच्छा लगता है! 😄",
      "आपका आने वाला दिन शानदार हो! 🌈"
    ]
  };

  if (!event.body) return;

  const lowerCaseBody = event.body.toLowerCase();

  const userLangPath = __dirname + `/cache/userLanguages.json`;
  let userLanguages = {};
  
  try {
    if (fs.existsSync(userLangPath)) {
      userLanguages = JSON.parse(fs.readFileSync(userLangPath, 'utf8'));
    }
  } catch (error) {
    console.error("Error loading user languages:", error);
    userLanguages = {};
  }

  if (["bot en", "bot ur", "bot bd", "bot hi", "bot reset"].includes(lowerCaseBody)) {
    if (lowerCaseBody === "bot reset") {
      if (userLanguages[id]) {
        delete userLanguages[id];
        try {
          fs.writeFileSync(userLangPath, JSON.stringify(userLanguages, null, 2));
        } catch (error) {
          console.error("Error saving user language:", error);
        }
        return api.sendMessage("🔄 Language preference has been reset! Bot will now use default responses.", threadID, messageID);
      } else {
        return api.sendMessage("ℹ️ No language preference was set for your account.", threadID, messageID);
      }
    } else {
      const selectedLang = lowerCaseBody.split(" ")[1];
      userLanguages[id] = selectedLang;
      
      try {
        fs.writeFileSync(userLangPath, JSON.stringify(userLanguages, null, 2));
      } catch (error) {
        console.error("Error saving user language:", error);
      }
      
      return api.sendMessage(responses[lowerCaseBody].all, threadID, messageID);
    }
  }

  if (responses.hasOwnProperty(lowerCaseBody)) {
    return api.sendMessage(responses[lowerCaseBody], threadID, messageID);
  }

  if (event.body.toLowerCase().startsWith("bot") && !["bot en", "bot ur", "bot bd", "bot hi", "bot reset"].includes(lowerCaseBody)) {
    const userLang = userLanguages[id] || "default";
    let responseText;
    
    if (userLang === "en") {
      const englishMessages = languageMessages.en;
      responseText = englishMessages[Math.floor(Math.random() * englishMessages.length)];
    } else if (userLang === "ur") {
      const urduMessages = languageMessages.ur;
      responseText = urduMessages[Math.floor(Math.random() * urduMessages.length)];
    } else if (userLang === "bd") {
      const bengaliMessages = languageMessages.bd;
      responseText = bengaliMessages[Math.floor(Math.random() * bengaliMessages.length)];
    } else if (userLang === "hi") {
      const hindiMessages = languageMessages.hi;
      responseText = hindiMessages[Math.floor(Math.random() * hindiMessages.length)];
    } else {
      responseText = rand;
    }

    const formattedMessage = {
      body: `@${name} ${responseText}`,
      mentions: [{
        tag: `@${name}`,
        id: id
      }]
    };
    return api.sendMessage(formattedMessage, threadID, messageID);
  }
}

module.exports.run = function({ api, event, client, __GLOBAL }) { }
