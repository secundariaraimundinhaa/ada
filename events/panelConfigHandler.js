const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');
const emojis = require('../DataBaseJson/emojis.json');

const configPath = path.join(__dirname, '../DataBaseJson/configuracoes.json');

function getConfig() {
  try {
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch {
    return {};
  }
}

function saveConfig(config) {
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    if (interaction.isButton() && interaction.customId === 'panel_config') {
      const config = getConfig();
      const embed = new EmbedBuilder()
        .setColor('#2b2d31')
        .setTitle(`${emojis._settings_emoji || '⚙️'} Definições do Bot`)
        .setDescription(`${emojis._diamond_emoji || '💎'} Aqui você pode visualizar e alterar as configurações do bot.

${emojis._star_emoji || '⭐'} Use o select menu abaixo para alterar as configurações.`);
      const select = new StringSelectMenuBuilder()
        .setCustomId('config_select')
        .setPlaceholder('Selecione uma configuração para alterar')
        .addOptions([
          { label: 'Administrador', value: 'administrador', description: 'ID do cargo de administrador' },
          { label: 'Suporte', value: 'suporte', description: 'ID do cargo de suporte' },
          { label: 'Logs', value: 'logs', description: 'ID do canal de logs' }
        ]);
      const row = new ActionRowBuilder().addComponents(select);
      await interaction.update({ embeds: [embed], components: [row] });
      return;
    }

    if (interaction.isStringSelectMenu() && interaction.customId === 'config_select') {
      const config = getConfig();
      const selected = interaction.values[0];
      const modal = new ModalBuilder().setCustomId(`modal_config_${selected}`).setTitle(`Alterar ${selected}`);
      const input = new TextInputBuilder().setCustomId('config_value').setLabel(`Novo valor para ${selected}`).setStyle(TextInputStyle.Short).setRequired(true).setValue(config[selected] || '');
      modal.addComponents(new ActionRowBuilder().addComponents(input));
      await interaction.showModal(modal);
      return;
    }

    if (interaction.isModalSubmit() && interaction.customId.startsWith('modal_config_')) {
      const config = getConfig();
      const field = interaction.customId.replace('modal_config_', '');
      const value = interaction.fields.getTextInputValue('config_value');
      config[field] = value;
      saveConfig(config);
      await interaction.reply({ content: `${emojis.confirmed_emoji || '✅'} Configuração '${field}' alterada para: ${value}`, ephemeral: true });
      return;
    }
  }
}; 