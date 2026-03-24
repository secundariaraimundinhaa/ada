const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const emojis = require('../DataBaseJson/emojis.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('panel')
    .setDescription('Envia o painel com botões de acesso rápido.'),
  async execute(interaction) {
    const embed = {
      color: 0x2b2d31,
      title: `${emojis._star_emoji || '⭐'} Painel Central` ,
      description: `${emojis._diamond_emoji || '💎'} Bem-vindo ao painel de controle!

${emojis._support_emoji || '🛠️'} Use os botões abaixo para acessar as principais funções do bot.`
    };
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('panel_atendimento')
        .setLabel('Atendimento')
        .setStyle(ButtonStyle.Primary)
        .setEmoji(emojis._support_emoji),
      new ButtonBuilder()
        .setCustomId('panel_perms')
        .setLabel('Perms')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji(emojis.permissions_emoji),
      new ButtonBuilder()
        .setCustomId('panel_meubot')
        .setLabel('Meu Bot Design')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji(emojis._diamond_emoji),
      new ButtonBuilder()
        .setCustomId('panel_config')
        .setLabel('Definições')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji(emojis._settings_emoji || '⚙️')
    );
    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('panel_backup')
        .setLabel('Sistema de Backup')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji(emojis.confirmed_backup_emoji)
    );
    await interaction.reply({
      embeds: [embed],
      components: [row, row2],
      ephemeral: true
    });
  }
}; 