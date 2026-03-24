const { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const emojis = require('../DataBaseJson/emojis.json');

function getMediadores() {
  try {
    const data = fs.readFileSync(path.join(__dirname, '../DataBaseJson/mediadores.json'));
    const ids = JSON.parse(data);
    return ids.length ? ids.map(id => `<@&${id}>`).join(', ') : 'Nenhum definido';
  } catch {
    return 'Nenhum definido';
  }
}

function getCategoria() {
  try {
    const data = fs.readFileSync(path.join(__dirname, '../DataBaseJson/categoria.json'));
    const ids = JSON.parse(data);
    return ids.length ? `<#${ids[0]}>` : 'Nenhuma definida';
  } catch {
    return 'Nenhuma definida';
  }
}

function getStatusFilas() {
  function countFila(file) {
    try {
      const data = fs.readFileSync(path.join(__dirname, `../DataBaseJson/${file}`));
      const filas = JSON.parse(data);
      return Object.values(filas).reduce((acc, arr) => acc + arr.length, 0);
    } catch {
      return 0;
    }
  }
  return {
    '1v1': countFila('filas1v1.json'),
    'Normal': countFila('filasNormal.json'),
    'Misto': countFila('filasMisto.json')
  };
}

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    // Botão para abrir modal de mediador
    if (interaction.isButton() && interaction.customId === 'config_mediador') {
      const modal = new ModalBuilder()
        .setCustomId('modal_mediador')
        .setTitle('Adicionar Cargo de Mediador');
      const input = new TextInputBuilder()
        .setCustomId('mediador_id')
        .setLabel('ID do cargo de mediador')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Ex: 123456789012345678')
        .setRequired(true);
      const row = new ActionRowBuilder().addComponents(input);
      modal.addComponents(row);
      await interaction.showModal(modal);
      return;
    }
    // Modal de mediador
    if (interaction.isModalSubmit() && interaction.customId === 'modal_mediador') {
      const id = interaction.fields.getTextInputValue('mediador_id');
      fs.writeFileSync(path.join(__dirname, '../DataBaseJson/mediador.json'), JSON.stringify([id], null, 2));
      // Atualiza embed de configuração
      const status = getStatusFilas();
      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle(`${emojis._settings_emoji || '⚙️'} Configurações de Filas`)
        .setDescription(`Veja e altere as configurações principais das filas do servidor.\n\n${emojis._people_emoji || '👥'} **Mediador:** ${getMediadores()}\n${emojis._folder_emoji || '📁'} **Categoria:** ${getCategoria()}`)
        .setFooter({ text: 'Use os botões abaixo para alterar as configurações.', iconURL: 'https://cdn.discordapp.com/emojis/1378534194849775647.png' });
      await interaction.reply({ content: `${emojis.confirmed_emoji || '✅'} Cargo de mediador atualizado!`, embeds: [embed], components: [], ephemeral: true });
    }
  }
}; 