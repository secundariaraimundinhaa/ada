const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');
const emojis = require('../DataBaseJson/emojis.json');

const analistaPath = path.join(__dirname, '../DataBaseJson/analista.json');

function getAnalistas() {
  try {
    const data = fs.readFileSync(analistaPath);
    const ids = JSON.parse(data);
    return ids.length ? ids.map(id => `<@&${id}>`).join(', ') : 'Nenhum definido';
  } catch {
    return 'Nenhum definido';
  }
}

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    // Botão Analista do painel principal
    if (interaction.isButton() && interaction.customId === 'blank_analista') {
      const embed = new EmbedBuilder()
        .setColor(0x7289DA)
        .setTitle(`${emojis._staff_emoji || '🕵️'} Painel Analista`)
        .setDescription('Gerencie o cargo de analista do servidor.')
        .addFields({ name: 'Cargo Analista', value: getAnalistas() })
        .setFooter({ text: 'Use os botões abaixo para alterar o cargo de analista.', iconURL: 'https://cdn.discordapp.com/emojis/1378534194849775647.png' });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('config_analista_cargo')
          .setLabel('Definir Cargo')
          .setStyle(ButtonStyle.Primary)
          .setEmoji(emojis._staff_emoji || '🕵️'),
        new ButtonBuilder()
          .setCustomId('voltar_painel_principal')
          .setLabel('Voltar')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji(emojis._back_emoji || '⬅️')
      );
      await interaction.update({ embeds: [embed], components: [row] });
      return;
    }

    // Botão Definir Cargo
    if (interaction.isButton() && interaction.customId === 'config_analista_cargo') {
      const modal = new ModalBuilder()
        .setCustomId('modal_analista_cargo')
        .setTitle('Definir Cargo de Analista');
      const input = new TextInputBuilder()
        .setCustomId('analista_id')
        .setLabel('ID do cargo de analista')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Ex: 123456789012345678')
        .setRequired(true);
      const row = new ActionRowBuilder().addComponents(input);
      modal.addComponents(row);
      await interaction.showModal(modal);
      return;
    }

    // Modal submit para definir cargo
    if (interaction.isModalSubmit() && interaction.customId === 'modal_analista_cargo') {
      const id = interaction.fields.getTextInputValue('analista_id');
      fs.writeFileSync(analistaPath, JSON.stringify([id], null, 2));
      const embed = new EmbedBuilder()
        .setColor(0x7289DA)
        .setTitle(`${emojis._staff_emoji || '🕵️'} Painel Analista`)
        .setDescription('Gerencie o cargo de analista do servidor.')
        .addFields({ name: 'Cargo Analista', value: getAnalistas() })
        .setFooter({ text: 'Use os botões abaixo para alterar o cargo de analista.', iconURL: 'https://cdn.discordapp.com/emojis/1378534194849775647.png' });
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('config_analista_cargo')
          .setLabel('Definir Cargo')
          .setStyle(ButtonStyle.Primary)
          .setEmoji(emojis._staff_emoji || '🕵️'),
        new ButtonBuilder()
          .setCustomId('voltar_painel_principal')
          .setLabel('Voltar')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji(emojis._back_emoji || '⬅️')
      );
      await interaction.update({ embeds: [embed], components: [row] });
      return;
    }

    // Botão Voltar
    if (interaction.isButton() && interaction.customId === 'voltar_painel_principal') {
      let emojis = require('../DataBaseJson/emojis.json');
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
      await interaction.update({ embeds: [embed], components: [row] });
      return;
    }
  }
}; 