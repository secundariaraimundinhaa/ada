const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const emojis = require('../DataBaseJson/emojis.json');
const { criarSalaAposta } = require('./matchRoomCreator');

const filasDadosPath = path.join(__dirname, '../DataBaseJson/filasDados.json');

function getFilaDadosByMsgId(msgId) {
  if (!fs.existsSync(filasDadosPath)) return null;
  const db = JSON.parse(fs.readFileSync(filasDadosPath));
  return db[msgId] || null;
}

const matchConfirms = {};

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    if (!interaction.isButton()) return;
    const customId = interaction.customId;
    if (!['match_confirmar', 'match_recusar'].includes(customId)) return;

    const thread = interaction.channel;
    const userId = interaction.user.id;
    const matchKey = `${thread.id}`;

    if (customId === 'match_confirmar') {
      if (!matchConfirms[matchKey]) matchConfirms[matchKey] = [];
      if (matchConfirms[matchKey].includes(userId)) {
        await interaction.reply({ content: `${emojis.failuser_emoji || '❌'} Você já confirmou!`, ephemeral: true });
        return;
      }
      matchConfirms[matchKey].push(userId);
      // Pega os membros do tópico
      const members = await thread.members.fetch();
      const outros = members.filter(m => m.id !== userId && !m.user.bot);
      // Mensagem igual ao exemplo
      const embed = new EmbedBuilder()
        .setColor(0x2ecc71)
        .setTitle(`${emojis.confirmed_emoji || '✅'} Aposta confirmada`)
        .setDescription(`<@${userId}>, confirmou esta aposta.\n${outros.size > 0 ? `Aguardando confirmação dos demais jogadores.` : ''}`);
      await interaction.reply({ embeds: [embed] });

      // Fila misto: só cria a sala quando todos confirmarem
      const allConfirmed = members.filter(m => !m.user.bot).every(m => matchConfirms[matchKey].includes(m.id));
      if (allConfirmed) {
        // Extrai modo, formato e valor do nome do tópico
        let modo = 'misto';
        let formato = '2x2';
        let valorReal = '0,00';
        // Para misto: fila <modo> <formato> <valor> <time>
        let match = thread.name.match(/^fila (.+) (2x2|3x3|4x4) ([0-9]+,[0-9]+)(?: ([123] emu))?$/i);
        let timeLabel = null;
        if (match) {
          modo = match[1];
          formato = match[2];
          valorReal = match[3];
          timeLabel = match[4] || null;
        } else {
          // Para 1v1: fila <modo> <tipoGel> <valor>
          match = thread.name.match(/^fila (.+) (Gel Normal|Gel Infinito) ([0-9]+,[0-9]+)$/i);
          if (match) {
            modo = match[1];
            formato = match[2]; // tipoGel
            valorReal = match[3];
          } else {
            // Para normal: fila <modo> <valor>
            match = thread.name.match(/^fila (.+) ([0-9]+,[0-9]+)$/i);
            if (match) {
              modo = match[1];
              valorReal = match[2];
              formato = 'Normal';
            }
          }
        }
        // Pega todos os jogadores humanos do tópico
        const jogadores = members.filter(m => !m.user.bot).map(m => m.user);
        await criarSalaAposta(interaction.guild, ...jogadores, modo, formato, valorReal, timeLabel);
        matchConfirms[matchKey] = [];
        setTimeout(() => {
          thread.delete('Tópico apagado após criação da sala de aposta');
        }, 2000);
      }
    }
    if (customId === 'match_recusar') {
      // Mensagem de recusa
      const embed = new EmbedBuilder()
        .setColor(0xED4245)
        .setTitle(`${emojis.failuser_emoji || '❌'} Aposta recusada`)
        .setDescription(`<@${userId}> recusou a aposta. O tópico será fechado.`);
      await interaction.reply({ embeds: [embed] });
      // Aguarda um pouco para garantir que a mensagem seja enviada antes de deletar
      setTimeout(() => {
        thread.delete('Aposta recusada por um dos jogadores');
      }, 2000);
    }
  }
}; 