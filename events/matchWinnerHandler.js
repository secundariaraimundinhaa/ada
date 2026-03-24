const fs = require('fs');
const path = require('path');
const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const emojis = require('../DataBaseJson/emojis.json');

const usersPath = path.join(__dirname, '../DataBaseJson/usersinfo.json');
const filasDadosPath = path.join(__dirname, '../DataBaseJson/filasDados.json');

function getUserInfo(id) {
  let db = {};
  if (fs.existsSync(usersPath)) db = JSON.parse(fs.readFileSync(usersPath));
  if (!db[id]) db[id] = { id, vitorias: 0, derrotas: 0, pontos: 0, partidas: 0 };
  return db[id];
}

function saveUserInfo(user) {
  let db = {};
  if (fs.existsSync(usersPath)) db = JSON.parse(fs.readFileSync(usersPath));
  db[user.id] = user;
  fs.writeFileSync(usersPath, JSON.stringify(db, null, 2));
}

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    if (!interaction.isStringSelectMenu()) return;
    if (!['definir_vencedor', 'definir_pontos'].includes(interaction.customId)) return;

    try {
      let replied = false;
      try {
        await interaction.deferReply({ ephemeral: true });
        replied = true;
      } catch (e) {
        console.error('Interação expirada ou já respondida:', e);
        const msgs = await interaction.channel.messages.fetch({ limit: 10 });
        const primeiraMsgBot = msgs.find(m => m.author.id === interaction.client.user.id && m.embeds.length > 0);
        let jogadores = [];
        if (primeiraMsgBot) {
          const jogadoresField = primeiraMsgBot.embeds[0].fields?.find(f => f.name.toLowerCase().includes('jogadores'));
          if (jogadoresField) {
            jogadores = (jogadoresField.value.match(/<@!?\d+>/g) || []).slice(0, 2).map(m => m.replace(/<@!?|>/g, ''));
          }
        }
        if ((!jogadores || jogadores.length < 2) && partida && Array.isArray(partida.jogadores) && partida.jogadores.length === 2) {
          jogadores = partida.jogadores;
        }
        if (jogadores.length === 2) {
          const select = new StringSelectMenuBuilder()
            .setCustomId('definir_vencedor')
            .setPlaceholder('⭐ Selecione o vencedor')
            .addOptions(jogadores.map(id => {
              const member = interaction.guild.members.cache.get(id);
              return {
                label: member ? member.displayName : id,
                value: id,
                emoji: emojis.confirmed_emoji || '✅'
              };
            }));
          const row = new ActionRowBuilder().addComponents(select);
          const embed = new EmbedBuilder()
            .setTitle(`${emojis._star_emoji || '⭐'} Definir Vencedor`)
            .setDescription(`${emojis._star_emoji || '⭐'} Selecione o vencedor da partida`)
            .setThumbnail(interaction.user.displayAvatarURL());
          await interaction.channel.send({ content: `<@${interaction.user.id}> Esta interação expirou. Selecione novamente o vencedor da partida:`, embeds: [embed], components: [row] });
        } else {
          await interaction.channel.send({ content: `<@${interaction.user.id}> Esta interação expirou. Por favor, tente novamente.` });
        }
        return;
      }

      let filasDados = {};
      if (fs.existsSync(filasDadosPath)) filasDados = JSON.parse(fs.readFileSync(filasDadosPath));
      const partida = filasDados[interaction.channel.id];

      if (!partida || !partida.id_mediador) {
        return await interaction.editReply({ content: 'Não foi possível identificar o mediador desta partida.' });
      }

      if (interaction.user.id !== partida.id_mediador) {
        return await interaction.editReply({ content: 'Apenas o mediador desta partida pode usar este menu.' });
      }

      if (interaction.customId === 'definir_vencedor') {
        const selected = interaction.values[0];
        const pontosSelect = new StringSelectMenuBuilder()
          .setCustomId('definir_pontos')
          .setPlaceholder('⭐ Escolha a quantidade de pontos')
          .addOptions([
            { label: '1 ponto', value: '1', emoji: emojis._star_emoji || '⭐' },
            { label: '2 pontos', value: '2', emoji: emojis._star_emoji || '⭐' },
            { label: '3 pontos', value: '3', emoji: emojis._star_emoji || '⭐' },
            { label: '4 pontos', value: '4', emoji: emojis._star_emoji || '⭐' },
            { label: '5 pontos', value: '5', emoji: emojis._star_emoji || '⭐' }
          ]);
        const row = new ActionRowBuilder().addComponents(pontosSelect);
        const embed = new EmbedBuilder()
          .setTitle(`${emojis._star_emoji || '⭐'} Definir Pontos`)
          .setDescription(`${emojis._star_emoji || '⭐'} Selecione a quantidade de pontos para <@${selected}>`)
          .setThumbnail(interaction.user.displayAvatarURL());
        await interaction.editReply({ embeds: [embed], components: [row] });
        interaction.channel.selectedWinner = selected;
        if (partida) {
          partida.selectedWinner = selected;
          fs.writeFileSync(filasDadosPath, JSON.stringify(filasDados, null, 2));
        }
      }
      else if (interaction.customId === 'definir_pontos') {
        const pontos = parseInt(interaction.values[0]);
        const msgs = await interaction.channel.messages.fetch({ limit: 10 });
        const primeiraMsgBot = msgs.find(m => m.author.id === interaction.client.user.id && m.embeds.length > 0);
        let jogadores = [];
        if (primeiraMsgBot) {
          const jogadoresField = primeiraMsgBot.embeds[0].fields?.find(f => f.name.toLowerCase().includes('jogadores'));
          if (jogadoresField) {
            jogadores = (jogadoresField.value.match(/<@!?\d+>/g) || []).slice(0, 2).map(m => m.replace(/<@!?|>/g, ''));
          }
        }
        if ((!jogadores || jogadores.length < 2) && partida && Array.isArray(partida.jogadores) && partida.jogadores.length === 2) {
          jogadores = partida.jogadores;
        }
        let winnerId = interaction.channel.selectedWinner;
        if (!winnerId && partida && partida.selectedWinner) winnerId = partida.selectedWinner;
        if (!winnerId) {
          await interaction.channel.send({ content: `<@${interaction.user.id}> Selecione o vencedor novamente, pois a seleção anterior expirou.` });
          return;
        }
        let loserId = jogadores.find(id => id !== winnerId);
        if (!loserId && jogadores.length === 2) {
          loserId = jogadores[0] === winnerId ? jogadores[1] : jogadores[0];
        }
        if (!loserId) {
          await interaction.channel.send({ content: `<@${interaction.user.id}> Não foi possível identificar o perdedor. Selecione o vencedor novamente.` });
          return;
        }
        let winner = getUserInfo(winnerId);
        let loser = getUserInfo(loserId);
        winner.vitorias += 1;
        winner.pontos += pontos;
        winner.partidas += 1;
        loser.derrotas += 1;
        loser.partidas += 1;
        saveUserInfo(winner);
        saveUserInfo(loser);
        const embed = new EmbedBuilder()
          .setTitle(`${emojis.confirmed_emoji || '✅'} Vencedor Definido!`)
          .setDescription(`${emojis.confirmed_emoji || '✅'} <@${winnerId}> foi definido como vencedor e recebeu ${pontos} ponto(s)\n${emojis.failuser_emoji || '❌'} <@${loserId}> recebeu uma derrota.`)
          .setThumbnail(interaction.user.displayAvatarURL())
          .setColor(0x2ecc71)
          .setFooter({ text: '🗑️ O canal será apagado em 5 segundos.' });
        await interaction.editReply({ embeds: [embed], components: [] });
        setTimeout(() => {
          interaction.channel.delete('Partida finalizada após definir vencedor');
        }, 5000);
      }
    } catch (error) {
      console.error('Erro ao processar interação:', error);
      try {
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({ content: 'Ocorreu um erro ao processar sua solicitação. Por favor, tente novamente.', ephemeral: true });
        } else {
          await interaction.editReply({ content: 'Ocorreu um erro ao processar sua solicitação. Por favor, tente novamente.' });
        }
      } catch (e) {
        console.error('Erro ao enviar mensagem de erro:', e);
      }
    }
  }
}; 