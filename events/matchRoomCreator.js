const { ChannelType, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const emojis = require('../DataBaseJson/emojis.json');

const categoriaPath = path.join(__dirname, '../DataBaseJson/categoria.json');
const mediadoresPath = path.join(__dirname, '../DataBaseJson/mediadores.json');
const pagamentosPath = path.join(__dirname, '../DataBaseJson/pagamentos.json');

function getCategoriaId() {
  if (!fs.existsSync(categoriaPath)) return null;
  const arr = JSON.parse(fs.readFileSync(categoriaPath));
  return arr[0];
}

function getPagamentoInfo(mediadorId) {
  if (!fs.existsSync(pagamentosPath)) return null;
  const data = JSON.parse(fs.readFileSync(pagamentosPath));
  return data[mediadorId] || null;
}

function escolherMediadorPorHash(mediadores, idPartida) {
  if (!Array.isArray(mediadores) || mediadores.length === 0) return null;
  let hash = 0;
  for (let i = 0; i < idPartida.length; i++) {
    hash = (hash * 31 + idPartida.charCodeAt(i)) % mediadores.length;
  }
  return mediadores[hash];
}

async function criarSalaAposta(guild, jogador1, jogador2, modo, tipoGel, valor, time = null) {
  const categoriaId = getCategoriaId();
  // Carrega mediadores
  let mediadores = [];
  if (fs.existsSync(mediadoresPath)) mediadores = JSON.parse(fs.readFileSync(mediadoresPath));
  // Cria o canal privado primeiro para pegar o id
  const canal = await guild.channels.create({
    name: `aposta-${jogador1.username || jogador1.id}-${jogador2.username || jogador2.id}`,
    type: ChannelType.GuildText,
    parent: categoriaId,
    permissionOverwrites: [
      { id: guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] },
      { id: jogador1.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
      { id: jogador2.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
    ]
  });
  // Escolhe o mediador determinístico pelo id do canal
  const mediadorId = escolherMediadorPorHash(mediadores, canal.id);
  if (!categoriaId || !mediadorId) return null;
  // Adiciona permissão do mediador
  await canal.permissionOverwrites.edit(mediadorId, { ViewChannel: true, SendMessages: true });
  // Menciona os dois jogadores e o mediador
  await canal.send({ content: `<@${jogador1.id}> <@${jogador2.id}> <@${mediadorId}>` });

  // Log do valor recebido
  console.log('[DEBUG] Valor recebido para aposta:', valor);

  // Embed igual à da imagem
  const estiloJogo = time ? `${modo} | ${tipoGel} | ${time}` : `${modo} | ${tipoGel}`;
  const embed = new EmbedBuilder()
    .setTitle('Partida Iniciada')
    .setColor(0xF59E42)
    .setThumbnail(guild.iconURL() || null)
    .addFields(
      { name: 'Estilo de Jogo', value: estiloJogo, inline: false },
      { name: 'Informações da Partida', value: `Mediador: <@${mediadorId}>\nTaxa de Serviço: R$ 1,80`, inline: false },
      { name: 'Valor da Aposta', value: `R$ ${valor}`, inline: false },
      { name: 'Jogadores', value: `<@${jogador1.id}>\n<@${jogador2.id}>`, inline: false },
      { name: 'Horário', value: `<t:${Math.floor(Date.now() / 1000)}:f>`, inline: false }
    )
    .setFooter({ text: 'Selecione a ação que deseja realizar.' });

  // Select menu
  const select = new StringSelectMenuBuilder()
    .setCustomId('match_action')
    .setPlaceholder('Selecione a ação que deseja realizar.')
    .addOptions([
      {
        label: 'Finalizar Aposta',
        description: 'Clique aqui para fechar esta aposta.',
        value: 'finalizar',
        emoji: emojis._fixe_emoji || '🛑'
      },
      {
        label: 'Definir Vencedor',
        description: 'Clique aqui para definir o vencedor desta aposta.',
        value: 'vencedor',
        emoji: emojis._star_emoji || '⭐'
      }
    ]);

  const row = new ActionRowBuilder().addComponents(select);
  await canal.send({ embeds: [embed], components: [row] });

  // Busca info de pagamento do mediador
  const pagamento = getPagamentoInfo(mediadorId);
  if (pagamento) {
    // 1. Embed com QR code
    const qrEmbed = new EmbedBuilder()
      .setTitle('QR Code para Pagamento')
      .setImage(pagamento.qr_code.replace(/^@/, ''));
    await canal.send({ embeds: [qrEmbed] });
    // 2. Mensagem com chave pix
    await canal.send(`Chave Pix: \n${pagamento.chave_pix}`);
    // 3. Mensagem com aviso
    await canal.send(`# ${pagamento.aviso}`);
  }

  // Salva o id do mediador na database da partida
  const filasDadosPath = path.join(__dirname, '../DataBaseJson/filasDados.json');
  let filasDados = {};
  if (fs.existsSync(filasDadosPath)) filasDados = JSON.parse(fs.readFileSync(filasDadosPath));
  filasDados[canal.id] = {
    valor,
    modo,
    tipo: tipoGel,
    jogadores: [jogador1.id, jogador2.id],
    status: 'iniciada',
    id_mediador: mediadorId,
    ...(time ? { time } : {})
  };
  fs.writeFileSync(filasDadosPath, JSON.stringify(filasDados, null, 2));

  return canal;
}

module.exports = { criarSalaAposta }; 