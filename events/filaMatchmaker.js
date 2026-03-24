const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionsBitField } = require('discord.js');
const fs = require('fs');
const path = require('path');
const emojis = require('../DataBaseJson/emojis.json');

const filasPath = path.join(__dirname, '../DataBaseJson/filas1v1.json');
const filasDadosPath = path.join(__dirname, '../DataBaseJson/filasDados.json');

function getFilasDB(tipoFila = '1v1') {
  const path1v1 = path.join(__dirname, '../DataBaseJson/filas1v1.json');
  const pathNormal = path.join(__dirname, '../DataBaseJson/filasNormal.json');
  const filasPath = tipoFila === 'normal' ? pathNormal : path1v1;
  if (!fs.existsSync(filasPath)) {
    fs.writeFileSync(filasPath, JSON.stringify({}));
  }
  return JSON.parse(fs.readFileSync(filasPath));
}

function saveFilasDB(db, tipoFila = '1v1') {
  const path1v1 = path.join(__dirname, '../DataBaseJson/filas1v1.json');
  const pathNormal = path.join(__dirname, '../DataBaseJson/filasNormal.json');
  const filasPath = tipoFila === 'normal' ? pathNormal : path1v1;
  fs.writeFileSync(filasPath, JSON.stringify(db, null, 2));
}

function getFilaDadosByValorModoTipo(valor, modo, tipo) {
  if (!fs.existsSync(filasDadosPath)) return null;
  const db = JSON.parse(fs.readFileSync(filasDadosPath));
  for (const key in db) {
    const fila = db[key];
    if (fila.valor === valor && fila.modo === modo && fila.tipo === tipo) {
      return fila;
    }
  }
  return null;
}

async function tentarParear(interaction, valor, modo, tipo, filaEmbedMsg, tipoFila = '1v1', jogadoresTime = null) {
  let filasDB = getFilasDB(tipoFila);
  if (!filasDB[valor]) return;
  let jogadoresMatch = [];
  if (tipoFila === 'normal') {
    jogadoresMatch = filasDB[valor];
  } else if (tipoFila === 'misto') {
    if (Array.isArray(jogadoresTime) && jogadoresTime.length === 2) {
      jogadoresMatch = jogadoresTime;
    } else {
      // Pega um jogador de cada time (fluxo antigo, mas agora só se não passar jogadoresTime)
      const timesNecessarios = tipo === '2x2' ? 2 : tipo === '3x3' ? 3 : 4;
      const times = {};
      for (const t of ['emu_1', 'emu_2', 'emu_3', 'emu_4']) {
        const jogador = filasDB[valor].find(j => j.time === t);
        if (jogador) times[t] = jogador;
      }
      const timesPresentes = Object.keys(times).length;
      if (timesPresentes < timesNecessarios) return;
      jogadoresMatch = Object.values(times).slice(0, timesNecessarios);
      // Remove todos esses jogadores do banco
      filasDB[valor] = filasDB[valor].filter(j => !jogadoresMatch.some(jm => jm.id === j.id));
      saveFilasDB(filasDB, tipoFila);
    }
  } else {
    jogadoresMatch = filasDB[valor].filter(j => j.tipo === tipo);
  }
  if (jogadoresMatch.length < (tipoFila === 'misto' && !jogadoresTime ? (tipo === '2x2' ? 2 : tipo === '3x3' ? 3 : 4) : 2)) return;
  const [jogador1, jogador2, jogador3, jogador4] = jogadoresMatch;
  if (tipoFila !== 'misto' || (tipoFila === 'misto' && jogadoresTime)) {
    filasDB[valor] = filasDB[valor].filter(j => !jogadoresMatch.some(jm => jm.id === j.id));
    saveFilasDB(filasDB, tipoFila);
  }

  // Extrai o valor real da embed da fila
  let valorReal = valor;
  if (filaEmbedMsg.embeds && filaEmbedMsg.embeds[0]) {
    const valorField = filaEmbedMsg.embeds[0].fields?.find(f => f.name.toLowerCase().includes('valor'));
    if (valorField) {
      const matchValor = valorField.value.match(/([0-9]+,[0-9]+)/);
      if (matchValor) valorReal = matchValor[1];
    }
  }

  // Atualiza embed da fila
  let jogadoresStr = filasDB[valor].length > 0
    ? (tipoFila === 'normal'
        ? filasDB[valor].map(j => `<@${j.id}>`).join('\n')
        : tipoFila === 'misto'
          ? filasDB[valor].map(j => `<@${j.id}>${j.time ? ` | ${j.time.replace('emu_', '')} emu` : ''}`).join('\n')
          : filasDB[valor].map(j => `<@${j.id}> | ${j.tipo}`).join('\n'))
    : 'Nenhum jogador na fila.';
  const embed = filaEmbedMsg.embeds[0];
  const newEmbed = EmbedBuilder.from(embed)
    .setFields([
      { name: `${emojis.command_emoji || '🎮'} MODO`, value: modo, inline: false },
      { name: `${emojis._money_emoji || '💰'} VALOR`, value: `R$ ${valorReal}`, inline: false },
      ...(tipoFila === 'normal' || tipoFila === 'misto' ?
        [{ name: 'Formato', value: tipo, inline: false }] : []),
      { name: `${emojis._people_emoji || '👥'} JOGADORES`, value: jogadoresStr, inline: false }
    ]);
  await filaEmbedMsg.edit({ embeds: [newEmbed] });

  const canal = filaEmbedMsg.channel;
  const topicName = tipoFila === 'normal'
    ? `fila ${modo} ${valorReal}`
    : tipoFila === 'misto' && jogadoresMatch.length === 2 && jogadoresMatch[0].time === jogadoresMatch[1].time
      ? `fila ${modo} ${tipo} ${valorReal} ${jogadoresMatch[0].time.replace('emu_', '')} emu`
      : tipoFila === 'misto'
        ? `fila ${modo} ${tipo} ${valorReal}`
        : `fila ${modo} ${tipo} ${valorReal}`;
  try {
    const topic = await canal.threads.create({
      name: topicName,
      type: ChannelType.PrivateThread,
      reason: tipoFila === 'normal' ? 'Match de fila normal' : tipoFila === 'misto' ? 'Match de fila misto' : 'Match de fila 1v1',
      invitable: false,
      autoArchiveDuration: 60
    });
    for (const jogador of jogadoresMatch) {
      await topic.members.add(jogador.id);
    }

    // Embed pequena no tópico
    const matchEmbed = new EmbedBuilder()
      .setTitle(`${emojis._star_emoji || '⭐'} Match Encontrado!`)
      .setDescription(
        tipoFila === 'misto'
          ? `Jogadores: ${jogadoresMatch.map(j => `<@${j.id}> | ${j.time.replace('emu_', '')} emu`).join(' x ')}\nModo: **${modo}**\nValor: **R$ ${valorReal}**\nFormato: **${tipo}**`
          : tipoFila === 'normal'
            ? `Jogadores: <@${jogador1.id}> x <@${jogador2.id}>\nModo: **${modo}**\nValor: **R$ ${valorReal}**\nFormato: **${tipo}**`
            : `Jogadores: <@${jogador1.id}> x <@${jogador2.id}>\nModo: **${modo}**\nValor: **R$ ${valorReal}**\nTipo: **${tipo}**`
      )
      .setThumbnail(interaction.guild.iconURL() || null)
      .setColor(0x2ecc71);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('match_confirmar')
        .setLabel('Confirmar')
        .setStyle(ButtonStyle.Success)
        .setEmoji(emojis.confirmed_emoji || '✅'),
      new ButtonBuilder()
        .setCustomId('match_recusar')
        .setLabel('Recusar')
        .setStyle(ButtonStyle.Danger)
        .setEmoji(emojis.failuser_emoji || '❌')
    );

    await topic.send({ content: `${jogadoresMatch.map(j => `<@${j.id}>`).join(' ')}`, embeds: [matchEmbed], components: [row] });
  } catch (err) {
    console.error(`[Matchmaker] Erro ao criar tópico:`, err);
  }
}

module.exports = { tentarParear }; 