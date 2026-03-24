const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');

const emojisPath = path.join(__dirname, '../DataBaseJson/emojis.json');
const configPath = path.join(__dirname, '../config.json');
const permsPath = path.join(__dirname, '../DataBaseJson/perms.json');

function isOwnerOrPermitted(userId) {
  try {
    const config = JSON.parse(fs.readFileSync(configPath));
    if (config.ownerId === userId) return true;
    if (fs.existsSync(permsPath)) {
      const perms = JSON.parse(fs.readFileSync(permsPath));
      return Object.keys(perms).includes(userId);
    }
    return false;
  } catch {
    return false;
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('blank_config')
    .setDescription('Exibe o painel de configuração do Blank.'),
  async execute(interaction) {
    if (!isOwnerOrPermitted(interaction.user.id)) {
      return interaction.reply({ content: '❌ Apenas o dono do bot ou quem tem permissão pode usar este comando!', ephemeral: true });
    }
    
    let emojis = {};
    if (fs.existsSync(emojisPath)) emojis = JSON.parse(fs.readFileSync(emojisPath));

    const embed = new EmbedBuilder()
      .setColor(0x7289DA)
      .setTitle(`${emojis._settings_emoji || '⚙️'} Painel Blank Config`)
      .setDescription('Gerencie as principais funções do Blank de forma rápida.')
      .setThumbnail(interaction.guild.iconURL() || null);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('blank_filas')
        .setLabel('Filas')
        .setStyle(ButtonStyle.Primary)
        .setEmoji(emojis._people_emoji || '👥'),
      new ButtonBuilder()
        .setCustomId('blank_blacklist')
        .setLabel('Blacklist')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji(emojis._ban_emoji || '🚫'),
      new ButtonBuilder()
        .setCustomId('blank_logs')
        .setLabel('Logs')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji(emojis._messages_emoji || '📄'),
      new ButtonBuilder()
        .setCustomId('blank_analista')
        .setLabel('Analista')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji(emojis._staff_emoji || '🕵️')
    );

    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
  }
}; 