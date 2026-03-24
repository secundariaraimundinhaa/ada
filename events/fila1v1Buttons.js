const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const emojis = require('../DataBaseJson/emojis.json');
const { tentarParear } = require('./filaMatchmaker');

const filasPath = path.join(__dirname, '../DataBaseJson/filas1v1.json');

function getFilasDB() {
  if (!fs.existsSync(filasPath)) {
    fs.writeFileSync(filasPath, JSON.stringify({}));
  }
  return JSON.parse(fs.readFileSync(filasPath));
}

function saveFilasDB(db) {
  fs.writeFileSync(filasPath, JSON.stringify(db, null, 2));
}

function getValorFromEmbed(embed) {
  const valorField = embed.fields.find(f => f.name.includes('VALOR'));
  if (!valorField) return null;
  return valorField.value.replace('R$ ', '').trim();
}

function getModoFromEmbed(embed) {
  const modoField = embed.fields.find(f => f.name.includes('MODO'));
  if (!modoField) return null;
  return modoField.value.replace('fila ', '').trim();
}

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    if (!interaction.isButton()) return;
    const customId = interaction.customId;
    if (!['gel_normal', 'gel_infinito', 'sair_fila_1v1'].includes(customId)) return;

    // Pega embed e valor
    const embed = interaction.message.embeds[0];
    if (!embed) return interaction.reply({ content: 'Embed não encontrada.', ephemeral: true });
    const valor = getValorFromEmbed(embed);
    if (!valor) return interaction.reply({ content: 'Valor não encontrado.', ephemeral: true });
    const modo = getModoFromEmbed(embed) || '';
    let filasDB = getFilasDB();
    if (!filasDB[valor]) filasDB[valor] = [];
    let jogadores = filasDB[valor];
    const userId = interaction.user.id;
    let mudou = false;
    if (customId === 'gel_normal' || customId === 'gel_infinito') {
      // Verifica mediadores disponíveis
      const mediadoresPath = path.join(__dirname, '../DataBaseJson/mediadores.json');
      let mediadores = [];
      if (fs.existsSync(mediadoresPath)) {
        try {
          mediadores = JSON.parse(fs.readFileSync(mediadoresPath));
        } catch (e) { mediadores = []; }
      }
      if (!Array.isArray(mediadores) || mediadores.length === 0) {
        await interaction.reply({ content: `${emojis.failuser_emoji || '❌'} Não há mediadores disponíveis no momento. Tente novamente mais tarde!`, ephemeral: true });
        return;
      }
      // Se já está na fila, não adiciona de novo
      if (jogadores.some(j => j.id === userId)) {
        await interaction.reply({ content: `${emojis.failuser_emoji || '❌'} Você já está na fila!`, ephemeral: true });
        return;
      }
      const tipoGel = customId === 'gel_normal' ? 'Gel Normal' : 'Gel Infinito';
      jogadores.push({ id: userId, tipo: tipoGel });
      mudou = true;
      await interaction.reply({ content: `${emojis.confirmed_emoji || '✅'} Você entrou na fila!`, ephemeral: true });
      saveFilasDB(filasDB);
      // Tenta parear
      await tentarParear(interaction, valor, modo, tipoGel, interaction.message);
      // Recarrega o banco e jogadores após parear
      filasDB = getFilasDB();
      jogadores = filasDB[valor] || [];
    } else if (customId === 'sair_fila_1v1') {
      if (!jogadores.some(j => j.id === userId)) {
        await interaction.reply({ content: `${emojis.failuser_emoji || '❌'} Você não está na fila!`, ephemeral: true });
        return;
      }
      filasDB[valor] = jogadores.filter(j => j.id !== userId);
      mudou = true;
      await interaction.reply({ content: `${emojis.confirmed_emoji || '✅'} Você saiu da fila!`, ephemeral: true });
    }
    if (mudou) {
      saveFilasDB(filasDB);
      // Atualiza embed
      let jogadoresStr = filasDB[valor].length > 0
        ? filasDB[valor].map(j => `<@${j.id}> | ${j.tipo}`).join('\n')
        : 'Nenhum jogador na fila.';
      const newEmbed = EmbedBuilder.from(embed)
        .setFields([
          { name: `${emojis.command_emoji || '🎮'} MODO`, value: `fila ${modo}`, inline: false },
          { name: `${emojis._money_emoji || '💰'} VALOR`, value: `R$ ${valor}`, inline: false },
          { name: `${emojis._people_emoji || '👥'} JOGADORES`, value: jogadoresStr, inline: false }
        ]);
      await interaction.message.edit({ embeds: [newEmbed] });
    }
  }
}; 