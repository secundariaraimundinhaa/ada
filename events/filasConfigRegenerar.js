const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
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

function limparFilas() {
  const arquivos = ['filas1v1.json', 'filasNormal.json', 'filasMisto.json'];
  for (const arquivo of arquivos) {
    try {
      const data = fs.readFileSync(path.join(__dirname, `../DataBaseJson/${arquivo}`));
      let filas = JSON.parse(data);
      // Limpa todos os arrays de jogadores
      for (const key in filas) {
        if (Array.isArray(filas[key])) {
          filas[key] = [];
        } else if (typeof filas[key] === 'object' && filas[key] !== null && 'jogadores' in filas[key]) {
          filas[key].jogadores = [];
        }
      }
      fs.writeFileSync(path.join(__dirname, `../DataBaseJson/${arquivo}`), JSON.stringify(filas, null, 2));
    } catch {}
  }
}

async function atualizarEmbedsFilas(client) {
  const filasDadosPath = path.join(__dirname, '../DataBaseJson/filasDados.json');
  if (!fs.existsSync(filasDadosPath)) return;
  const filasDados = JSON.parse(fs.readFileSync(filasDadosPath));
  for (const msgId in filasDados) {
    const dados = filasDados[msgId];
    if (!dados.status || dados.status !== 'aberta') continue;
    // Descobrir canal pelo id da mensagem (precisa de um campo canalId em dados, se não tiver, ignorar)
    if (!dados.canalId) continue;
    try {
      const canal = await client.channels.fetch(dados.canalId);
      if (!canal) continue;
      const msg = await canal.messages.fetch(msgId).catch(() => null);
      if (!msg) continue;
      // Montar embed conforme tipo
      let embed = msg.embeds[0];
      if (!embed) continue;
      let newEmbed;
      if (dados.formato) {
        // Normal ou Misto
        let jogadoresStr = 'Nenhum jogador na fila.';
        if (dados.formato && embed.fields.some(f => f.name === 'Formato')) {
          newEmbed = EmbedBuilder.from(embed).setFields([
            { name: `${emojis.command_emoji || '🎮'} MODO`, value: dados.modo || '', inline: false },
            { name: `${emojis._money_emoji || '💰'} VALOR`, value: `R$ ${dados.valor}`, inline: false },
            { name: `Formato`, value: dados.formato, inline: false },
            { name: `${emojis._people_emoji || '👥'} JOGADORES`, value: jogadoresStr, inline: false }
          ]);
        }
      } else {
        // 1v1
        let jogadoresStr = 'Nenhum jogador na fila.';
        newEmbed = EmbedBuilder.from(embed).setFields([
          { name: `${emojis.command_emoji || '🎮'} MODO`, value: `fila ${dados.modo || ''}`, inline: false },
          { name: `${emojis._money_emoji || '💰'} VALOR`, value: `R$ ${dados.valor}`, inline: false },
          { name: `${emojis._people_emoji || '👥'} JOGADORES`, value: jogadoresStr, inline: false }
        ]);
      }
      await msg.edit({ embeds: [newEmbed] });
    } catch {}
  }
}

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    if (interaction.isButton() && interaction.customId === 'config_regenerar') {
      limparFilas();
      await atualizarEmbedsFilas(interaction.client);
      const status = getStatusFilas();
      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle(`${emojis._settings_emoji || '⚙️'} Configurações de Filas`)
        .setDescription(`Veja e altere as configurações principais das filas do servidor.\n\n${emojis._people_emoji || '👥'} **Mediador:** ${getMediadores()}\n${emojis._folder_emoji || '📁'} **Categoria:** ${getCategoria()}`)
        .setFooter({ text: 'Use os botões abaixo para alterar as configurações.', iconURL: 'https://cdn.discordapp.com/emojis/1378534194849775647.png' });
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('config_mediador')
          .setLabel('Mediador')
          .setStyle(ButtonStyle.Primary)
          .setEmoji(emojis._people_emoji || '👥'),
        new ButtonBuilder()
          .setCustomId('config_categoria')
          .setLabel('Categoria')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji(emojis._folder_emoji || '📁'),
        new ButtonBuilder()
          .setCustomId('config_regenerar')
          .setLabel('Regenerar')
          .setStyle(ButtonStyle.Danger)
          .setEmoji(emojis._clean_emoji || '🧹')
      );
      await interaction.update({ content: `${emojis.confirmed_emoji || '✅'} Todas as filas foram limpas!`, embeds: [embed], components: [row] });
    }
  }
}; 