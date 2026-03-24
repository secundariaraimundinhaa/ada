const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');
const emojis = require('../DataBaseJson/emojis.json');

const filasPath = path.join(__dirname, '../DataBaseJson/filasMisto.json');
const filasDadosPath = path.join(__dirname, '../DataBaseJson/filasDados.json');

function getFilasDB() {
  if (!fs.existsSync(filasPath)) {
    fs.writeFileSync(filasPath, JSON.stringify({}));
  }
  return JSON.parse(fs.readFileSync(filasPath));
}

function saveFilasDB(db) {
  fs.writeFileSync(filasPath, JSON.stringify(db, null, 2));
}

function saveFilaDados(msgId, dados) {
  let db = {};
  if (fs.existsSync(filasDadosPath)) db = JSON.parse(fs.readFileSync(filasDadosPath));
  db[msgId] = dados;
  fs.writeFileSync(filasDadosPath, JSON.stringify(db, null, 2));
  console.log('[DEBUG] Salvando dados da fila misto:', msgId, dados);
}

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    if (!interaction.isModalSubmit() || interaction.customId !== 'modal_fila_misto') return;

    const canalId = interaction.fields.getTextInputValue('canal_id');
    const modo = interaction.fields.getTextInputValue('modo_fila');
    const formato = interaction.fields.getTextInputValue('formato_fila').trim();
    const valores = ['100,90', '50,90', '20,90', '10,90', '5,90', '2,90', '1,90'];

    // Validação do formato
    if (!['2x2', '3x3', '4x4'].includes(formato)) {
      await interaction.reply({ content: `${emojis.failuser_emoji || '❌'} Formato inválido! Só é permitido: 2x2, 3x3 ou 4x4.`, ephemeral: true });
      return;
    }

    // Botões de acordo com o formato
    let buttons = [];
    if (formato === '2x2') {
      buttons = [
        new ButtonBuilder()
          .setCustomId('emu_1')
          .setLabel('1 emu')
          .setStyle(ButtonStyle.Primary)
          .setEmoji(emojis.emu_liox || '🦙'),
        new ButtonBuilder()
          .setCustomId('sair_fila_misto')
          .setLabel('Sair da Fila')
          .setStyle(ButtonStyle.Danger)
          .setEmoji(emojis._ban_emoji || '❌')
      ];
    } else if (formato === '3x3') {
      buttons = [
        new ButtonBuilder()
          .setCustomId('emu_1')
          .setLabel('1 emu')
          .setStyle(ButtonStyle.Primary)
          .setEmoji(emojis.emu_liox || '🦙'),
        new ButtonBuilder()
          .setCustomId('emu_2')
          .setLabel('2 emu')
          .setStyle(ButtonStyle.Primary)
          .setEmoji(emojis.emu_liox || '🦙'),
        new ButtonBuilder()
          .setCustomId('sair_fila_misto')
          .setLabel('Sair da Fila')
          .setStyle(ButtonStyle.Danger)
          .setEmoji(emojis._ban_emoji || '❌')
      ];
    } else if (formato === '4x4') {
      buttons = [
        new ButtonBuilder()
          .setCustomId('emu_1')
          .setLabel('1 emu')
          .setStyle(ButtonStyle.Primary)
          .setEmoji(emojis.emu_liox || '🦙'),
        new ButtonBuilder()
          .setCustomId('emu_2')
          .setLabel('2 emu')
          .setStyle(ButtonStyle.Primary)
          .setEmoji(emojis.emu_liox || '🦙'),
        new ButtonBuilder()
          .setCustomId('emu_3')
          .setLabel('3 emu')
          .setStyle(ButtonStyle.Primary)
          .setEmoji(emojis.emu_liox || '🦙'),
        new ButtonBuilder()
          .setCustomId('sair_fila_misto')
          .setLabel('Sair da Fila')
          .setStyle(ButtonStyle.Danger)
          .setEmoji(emojis._ban_emoji || '❌')
      ];
    }
    const row = new ActionRowBuilder().addComponents(buttons);

    await interaction.deferReply({ ephemeral: true });
    const canal = await interaction.guild.channels.fetch(canalId);
    let filasDB = {};
    if (fs.existsSync(filasPath)) filasDB = JSON.parse(fs.readFileSync(filasPath));
    for (const valor of valores) {
      if (!filasDB[valor]) filasDB[valor] = [];
      let jogadores = filasDB[valor];
      let jogadoresStr = jogadores.length > 0
        ? jogadores.map(j => `<@${j.id}>`).join('\n')
        : 'Nenhum jogador na fila.';
      const embed = new EmbedBuilder()
        .setTitle(`${emojis._star_emoji || '⭐'} FILA MISTO 0% DE TAXA`)
        .setThumbnail(interaction.guild.iconURL() || null)
        .setColor(0x7289DA)
        .addFields(
          { name: `${emojis.command_emoji || '🎮'} MODO`, value: modo, inline: false },
          { name: `${emojis._money_emoji || '💰'} VALOR`, value: `R$ ${valor}`, inline: false },
          { name: `Formato`, value: formato, inline: false },
          { name: `${emojis._people_emoji || '👥'} JOGADORES`, value: jogadoresStr, inline: false }
        )
        .setFooter({ text: `@${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });
      const msg = await canal.send({ embeds: [embed], components: [row] });
      // Salva os dados da fila na database
      saveFilaDados(msg.id, {
        valor,
        modo,
        formato,
        jogadores: [],
        status: 'aberta'
      });
    }
    fs.writeFileSync(filasPath, JSON.stringify(filasDB, null, 2));
    await interaction.editReply({ content: `${emojis.confirmed_emoji || '✅'} Filas misto criadas com sucesso no canal <#${canalId}>!` });
  }
}; 