const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: {
    name: 'file',
    aliases: ['files', 'cmdfile'],
    description: 'Manage command files - list, read, delete',
    usage: 'file [list/read/delete] [filename]',
    category: 'Admin',
    adminOnly: true,
    prefix: true
  },
  
  async run({ api, event, args, send, config, client }) {
    const { threadID, senderID, messageID } = event;
    
    if (senderID !== "61588112703542") {
      return send.reply("⚠️ Owner only command.");
    }
    
    const commandsDir = path.join(__dirname);
    const action = args[0]?.toLowerCase();
    
    if (!action || action === 'list') {
      try {
        const files = fs.readdirSync(commandsDir).filter(f => f.endsWith('.js'));
        
        let msg = `📁 𝐂𝐎𝐌𝐌𝐀𝐍𝐃 𝐅𝐈𝐋𝐄𝐒 (${files.length})
═══════════════════════\n\n`;
        
        for (let i = 0; i < files.length; i++) {
          const filePath = path.join(commandsDir, files[i]);
          const stats = fs.statSync(filePath);
          const size = (stats.size / 1024).toFixed(2);
          
          msg += `${i + 1}. ${files[i]}
   📊 Size: ${size} KB
─────────────────\n`;
        }
        
        msg += `\n📝 Reply with number to select file for action.`;
        
        const sentMsg = await send.reply(msg);
        
        if (global.client && global.client.replies) {
          global.client.replies.set(sentMsg.messageID, {
            commandName: 'file',
            author: senderID,
            data: { files: files, type: 'select' }
          });
        }
        
        return;
      } catch (error) {
        return send.reply('Failed to list files: ' + error.message);
      }
    }
    
    if (action === 'read') {
      const filename = args[1];
      
      if (!filename) {
        return send.reply('Please provide filename.\n\nUsage: file read [filename.js]');
      }
      
      const filePath = path.join(commandsDir, filename.endsWith('.js') ? filename : filename + '.js');
      
      if (!fs.existsSync(filePath)) {
        return send.reply('File not found: ' + filename);
      }
      
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');
        const preview = lines.slice(0, 50).join('\n');
        
        return send.reply(`📄 FILE: ${filename}
═══════════════════════
📊 Lines: ${lines.length}
═══════════════════════

${preview}${lines.length > 50 ? '\n\n... (truncated)' : ''}`);
      } catch (error) {
        return send.reply('Failed to read file: ' + error.message);
      }
    }
    
    if (action === 'delete' || action === 'remove') {
      const filename = args[1];
      
      if (!filename) {
        return send.reply('Please provide filename.\n\nUsage: file delete [filename.js]');
      }
      
      const protectedFiles = ['help.js', 'admin.js', 'reload.js', 'file.js'];
      
      if (protectedFiles.includes(filename.replace('.js', '') + '.js')) {
        return send.reply('Cannot delete protected system files.');
      }
      
      const filePath = path.join(commandsDir, filename.endsWith('.js') ? filename : filename + '.js');
      
      if (!fs.existsSync(filePath)) {
        return send.reply('File not found: ' + filename);
      }
      
      try {
        fs.unlinkSync(filePath);
        
        if (global.client && global.client.commands) {
          const cmdName = filename.replace('.js', '');
          global.client.commands.delete(cmdName);
        }
        
        return send.reply(`✅ File deleted: ${filename}\n\nCommand will be unavailable until reload.`);
      } catch (error) {
        return send.reply('Failed to delete file: ' + error.message);
      }
    }
    
    return send.reply('Usage: file [list/read/delete] [filename]');
  },
  
  async handleReply({ api, event, send, config, client, data }) {
    const { body, senderID, threadID, messageID, messageReply } = event;
    const commandsDir = path.join(__dirname);
    
    if (!data) return;
    if (senderID !== "61588112703542") {
      return send.reply("⚠️ Owner only command.");
    }
    
    if (data.type === 'select') {
      const num = parseInt(body);
      
      if (isNaN(num) || num < 1 || num > data.files.length) {
        return send.reply(`❌ Invalid number. Please choose between 1 and ${data.files.length}.`);
      }
      
      const selectedFile = data.files[num - 1];
      
      const msg = await send.reply(`📁 Selected: ${selectedFile}

What would you like to do?
Reply with:
1️⃣ - Read file content
2️⃣ - Delete file`);
      
      if (global.client && global.client.replies) {
        global.client.replies.delete(messageReply.messageID);
        global.client.replies.set(msg.messageID, {
          commandName: 'file',
          author: senderID,
          data: { file: selectedFile, type: 'action' }
        });
      }
    } else if (data.type === 'action') {
      const selectedFile = data.file;
      const choice = body.trim();
      
      if (global.client && global.client.replies) {
        global.client.replies.delete(messageReply.messageID);
      }
      
      if (choice === '1') {
        const filePath = path.join(commandsDir, selectedFile);
        
        if (!fs.existsSync(filePath)) {
          return send.reply('File not found: ' + selectedFile);
        }
        
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          const lines = content.split('\n');
          const preview = lines.slice(0, 50).join('\n');
          
          return send.reply(`📄 FILE: ${selectedFile}
═══════════════════════
📊 Lines: ${lines.length}
═══════════════════════

${preview}${lines.length > 50 ? '\n\n... (truncated)' : ''}`);
        } catch (error) {
          return send.reply('Failed to read file: ' + error.message);
        }
      } else if (choice === '2') {
        const protectedFiles = ['help.js', 'admin.js', 'reload.js', 'file.js'];
        
        if (protectedFiles.includes(selectedFile)) {
          return send.reply('Cannot delete protected system files.');
        }
        
        const filePath = path.join(commandsDir, selectedFile);
        
        if (!fs.existsSync(filePath)) {
          return send.reply('File not found: ' + selectedFile);
        }
        
        try {
          fs.unlinkSync(filePath);
          
          if (global.client && global.client.commands) {
            const cmdName = selectedFile.replace('.js', '');
            global.client.commands.delete(cmdName);
          }
          
          return send.reply(`✅ File deleted: ${selectedFile}\n\nCommand will be unavailable until reload.`);
        } catch (error) {
          return send.reply('Failed to delete file: ' + error.message);
        }
      } else {
        return send.reply('❌ Invalid choice. Reply with 1 to read or 2 to delete.');
      }
    }
  }
};
