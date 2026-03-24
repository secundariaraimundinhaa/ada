const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const emojis = require('../DataBaseJson/emojis.json');
const { tentarParear } = require('./filaMatchmaker');

const filasPath = path.join(__dirname, '../DataBaseJson/filasMisto.json');

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
  return modoField.value.trim();
}

function getFormatoFromEmbed(embed) {
  const formatoField = embed.fields.find(f => f.name === 'Formato');
  if (!formatoField) return null;
  return formatoField.value.trim();
}

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    if (!interaction.isButton()) return;
    const customId = interaction.customId;
    if (!['emu_1', 'emu_2', 'emu_3', 'sair_fila_misto'].includes(customId)) return;

    // Pega embed e valor
    const embed = interaction.message.embeds[0];
    if (!embed) return interaction.reply({ content: 'Embed não encontrada.', ephemeral: true });
    const valor = getValorFromEmbed(embed);
    if (!valor) return interaction.reply({ content: 'Valor não encontrado.', ephemeral: true });
    const modo = getModoFromEmbed(embed) || '';
    const formato = getFormatoFromEmbed(embed) || '';
    let filasDB = getFilasDB();
    if (!filasDB[valor]) filasDB[valor] = [];
    let jogadores = filasDB[valor];
    const userId = interaction.user.id;
    let mudou = false;
    if (['emu_1', 'emu_2', 'emu_3'].includes(customId)) {
      // Impede entrar em mais de um time
      if (jogadores.some(j => j.id === userId)) {
        await interaction.reply({ content: `${emojis.failuser_emoji || '❌'} Você já está em um time!`, ephemeral: true });
        return;
      }
      jogadores.push({ id: userId, time: customId });
      mudou = true;
      await interaction.reply({ content: `${emojis.confirmed_emoji || '✅'} Você entrou no time!`, ephemeral: true });
      saveFilasDB(filasDB);
      // Novo pareamento: se houver 2 jogadores no mesmo time, cria o match
      const jogadoresTime = jogadores.filter(j => j.time === customId);
      if (jogadoresTime.length === 2) {
        // Remove os dois jogadores do banco
        filasDB[valor] = jogadores.filter(j => !(j.time === customId && (j.id === jogadoresTime[0].id || j.id === jogadoresTime[1].id)));
        saveFilasDB(filasDB);
        // Chama o pareamento só para esses dois jogadores
        await require('./filaMatchmaker').tentarParear(
          interaction,
          valor,
          modo,
          formato,
          interaction.message,
          'misto',
          jogadoresTime // passa os dois jogadores do time
        );
        // Recarrega o banco e jogadores após parear
        filasDB = getFilasDB();
        jogadores = filasDB[valor] || [];
      }
    } else if (customId === 'sair_fila_misto') {
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
        ? filasDB[valor].map(j => `<@${j.id}> | ${j.time.replace('emu_', '')} emu`).join('\n')
        : 'Nenhum jogador na fila.';
      const newEmbed = EmbedBuilder.from(embed)
        .setFields([
          { name: `${emojis.command_emoji || '🎮'} MODO`, value: modo, inline: false },
          { name: `${emojis._money_emoji || '💰'} VALOR`, value: `R$ ${valor}`, inline: false },
          { name: `Formato`, value: formato, inline: false },
          { name: `${emojis._people_emoji || '👥'} JOGADORES`, value: jogadoresStr, inline: false }
        ]);
      await interaction.message.edit({ embeds: [newEmbed] });
    }
  }
}; 