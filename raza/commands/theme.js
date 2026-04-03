module.exports = {
  config: {
    name: 'theme',
    aliases: ['atheme', 'aitheme', 'themea', 'gentheme'],
    description: 'Generate and apply AI theme or change group theme',
    usage: 'theme [ai:prompt] or theme [color name]',
    category: 'Group Management',
    adminOnly: true,
    groupOnly: true,
    prefix: true
  },

  async run({ api, event, args, send }) {
    const { threadID } = event;

    if (!args.length) {
      return send.reply(`🎨 Theme Command Help
━━━━━━━━━━━━━━━━━━━━━

📌 AI Theme Generation:
.theme ai:describe your theme idea
Example: .theme ai:dark purple with stars

📌 Color Themes:
.color [color_name]
Example: .color blue, .color red

🎨 Available Colors:
DefaultBlue, Red, TealBlue, Yellow, Orange, Green,
LavenderPurple, HotPink, AquaBlue, BrightPurple,
CoralPink, Aqua, Mango, Berry, Citrus, Candy,
Earth, Support, Music, Pride, DoctorStrange, LoFi,
Sky, LunarNewYear, Celebration, Chill, StrangerThings,
Dune, Care, Astrology, Birthday, Cottagecore, Ocean,
Love, TieDye, Monochrome, Rocket, Unicorn, Tropical,
Maple, Sushi, Shadow, Rose, Lavender, Tulip, Peach,
Honey, Kiwi, Grape, Autumn, Cyberpunk2077, & more!`);
    }

    const input = args.join(' ').toLowerCase();

    // Check if AI theme
    if (input.startsWith('ai:')) {
      const prompt = args.join(' ').substring(3).trim();
      
      if (!prompt) {
        return send.reply('❌ Please provide a prompt for AI theme generation.\n\nUsage: .theme ai:your theme description');
      }

      try {
        send.reply('🎨 Generating AI theme... Please wait (this may take up to 30 seconds)');
        
        const theme = await api.createThemeAI(prompt);
        
        if (theme && theme.id) {
          // Apply the theme
          await api.changeThreadColor(theme.id, threadID);
          
          let response = `✅ AI Theme Applied Successfully!
━━━━━━━━━━━━━━━━━━━━━
🎨 Theme: ${theme.accessibility_label || 'Custom AI Theme'}`;
          
          if (theme.background_asset?.image?.url) {
            response += `\n🖼️ Image: ${theme.background_asset.image.url}`;
          }
          
          return send.reply(response);
        } else {
          return send.reply('❌ Failed to generate theme. Please try again with a different prompt.');
        }
      } catch (error) {
        return send.reply(`❌ AI Theme Generation Failed: ${error.message || 'Unknown error'}`);
      }
    }

    // Regular color theme
    try {
      return send.reply('💡 Use .color command for color themes instead.\n\nExample: .color blue');
    } catch (error) {
      return send.reply(`Error: ${error.message}`);
    }
  }
};
