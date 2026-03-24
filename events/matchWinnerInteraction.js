const { ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder } = require('discord.js');
const emojis = require('../DataBaseJson/emojis.json');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    if (!interaction.isStringSelectMenu() || interaction.customId !== 'match_action') return;
    const selected = interaction.values[0];
    if (selected !== 'vencedor') return;

    try {
      let replied = false;
      try {
        await interaction.deferReply({ ephemeral: true });
        replied = true;
      } catch (e) {
        console.error('Interação expirada ou já respondida:', e);
        const partidaEmbed = interaction.message.embeds[0];
        const jogadoresField = partidaEmbed.fields.find(f => f.name.toLowerCase().includes('jogadores'));
        let jogadores = [];
        if (jogadoresField) {
          jogadores = (jogadoresField.value.match(/<@!?\d+>/g) || []).slice(0, 2).map(m => m.replace(/<@!?|>/g, ''));
        }
        const fs = require('fs');
        const path = require('path');
        const filasDadosPath = path.join(__dirname, '../DataBaseJson/filasDados.json');
        let filasDados = {};
        if (fs.existsSync(filasDadosPath)) filasDados = JSON.parse(fs.readFileSync(filasDadosPath));
        const partida = filasDados[interaction.channel.id];
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
          const selectEmbed = new EmbedBuilder()
            .setTitle(`${emojis._star_emoji || '⭐'} Definir Vencedor`)
            .setDescription(`${emojis._star_emoji || '⭐'} Selecione o vencedor da partida`)
            .setThumbnail(interaction.user.displayAvatarURL());
          await interaction.channel.send({ content: `<@${interaction.user.id}> Esta interação expirou. Selecione novamente o vencedor da partida:`, embeds: [selectEmbed], components: [row] });
        } else {
          await interaction.channel.send({ content: `<@${interaction.user.id}> Esta interação expirou. Por favor, tente novamente.` });
        }
        return;
      }

      // Busca o id do mediador na database
      const fs = require('fs');
      const path = require('path');
      const filasDadosPath = path.join(__dirname, '../DataBaseJson/filasDados.json');
      let filasDados = {};
      if (fs.existsSync(filasDadosPath)) filasDados = JSON.parse(fs.readFileSync(filasDadosPath));
      const partida = filasDados[interaction.channel.id];

      if (!partida || !partida.id_mediador) {
        return await interaction.editReply({ content: 'Não foi possível identificar o mediador desta partida.' });
      }

      if (interaction.user.id !== partida.id_mediador) {
        return await interaction.editReply({ content: 'Apenas o mediador desta partida pode usar este menu.' });
      }

      // Buscar jogadores do campo da embed
      const partidaEmbed = interaction.message.embeds[0];
      const jogadoresField = partidaEmbed.fields.find(f => f.name.toLowerCase().includes('jogadores'));
      let jogadores = [];
      if (jogadoresField) {
        jogadores = (jogadoresField.value.match(/<@!?\d+>/g) || []).slice(0, 2).map(m => {
          return interaction.guild.members.cache.get(m.replace(/<@!?|>/g, ''))?.user;
        }).filter(Boolean);
      }

      // Verificação para evitar erro de opções vazias
      if (!jogadores || jogadores.length === 0) {
        return await interaction.editReply({ content: 'Não foi possível encontrar jogadores para definir o vencedor.' });
      }

      // Select menu de jogadores com emoji
      const select = new StringSelectMenuBuilder()
        .setCustomId('definir_vencedor')
        .setPlaceholder('⭐ Selecione o vencedor')
        .addOptions(jogadores.map(u => ({ label: u.username, value: u.id, emoji: emojis.confirmed_emoji || '✅' })));
      const row = new ActionRowBuilder().addComponents(select);

      // Embed curta com emoji
      const selectEmbed = new EmbedBuilder()
        .setTitle(`${emojis._star_emoji || '⭐'} Definir Vencedor`)
        .setDescription(`${emojis._star_emoji || '⭐'} Selecione o vencedor da partida`)
        .setThumbnail(interaction.user.displayAvatarURL());

      await interaction.editReply({ embeds: [selectEmbed], components: [row] });
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