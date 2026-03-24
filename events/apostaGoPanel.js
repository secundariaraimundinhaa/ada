const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, PermissionsBitField } = require('discord.js');
const fs = require('fs');
const path = require('path');

function userIsMediador(member) {
  try {
    const ids = JSON.parse(fs.readFileSync(path.join(__dirname, '../DataBaseJson/mediador.json')));
    return ids.some(id => member.roles.cache.has(id));
  } catch {
    return false;
  }
}

function calcularValorTotal(valor) {
  let v = parseFloat(valor.replace(',', '.'));
  let total = (v * 2) - 0.90;
  total = Math.floor(total);
  return total.toFixed(2).replace('.', ',');
}

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    if (message.author.bot) return;
    if (!message.guild) return;
    if (!message.channel.isTextBased()) return;
    // Só em canais privados de aposta (thread ou canal com nome começando com 'aposta-' ou 'pagar -')
    if (!/^aposta-|^pagar -/i.test(message.channel.name)) return;
    if (!userIsMediador(message.member)) return;

    // Carrega emojis atualizados
    let emojis = {};
    try {
      emojis = JSON.parse(fs.readFileSync(path.join(__dirname, '../DataBaseJson/emojis.json')));
    } catch {}

    const match = message.content.match(/(\d{4,})\D+(\d{2})/);
    if (!match) return;
    const id = match[1];
    const senha = match[2];

    // Busca valor da aposta no filasDados.json
    let filasDados = {};
    if (fs.existsSync(path.join(__dirname, '../DataBaseJson/filasDados.json'))) filasDados = JSON.parse(fs.readFileSync(path.join(__dirname, '../DataBaseJson/filasDados.json')));
    const partida = filasDados[message.channel.id];
    if (!partida || !partida.valor) return;
    const valor = partida.valor;
    const valorTotal = calcularValorTotal(valor);

    // Altera nome do canal
    const valorTotalNome = valorTotal.replace(',', '-');
    await message.channel.setName(`pagar-${valorTotalNome}`).catch(() => {});

    // Monta embed
    const embed = new EmbedBuilder()
      .setColor(0x2ecc71)
      .setTitle(`${emojis._star_emoji || '⭐'} go em 5 minutos`)
      .setDescription(`${emojis._money_emoji || '💰'} valor: R$ ${valor}\n- ${emojis._mail_emoji || '📧'} id: ${id}\n- ${emojis._lock_emoji || '🔒'} senha: ${senha}\n- ${emojis.time_emoji || '⏰'} tempo restante`);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('copiar_id_aposta')
        .setLabel('Copiar ID')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji(emojis._copy_emoji || '📋'),
      new ButtonBuilder()
        .setCustomId('alterar_valor_aposta')
        .setLabel('Alterar Valor')
        .setStyle(ButtonStyle.Primary)
        .setEmoji(emojis._change_emoji || '💱')
    );

    // Salva info temporária para os botões
    if (!global.apostaGoPanel) global.apostaGoPanel = {};
    const createdAt = Date.now();
    global.apostaGoPanel[message.channel.id] = { id, senha, valor, valorTotal, createdAt, msgId: null };

    // Função para atualizar embed de tempo restante
    async function atualizarTempoRestante(msg, createdAt) {
      let emojis = {};
      try {
        emojis = JSON.parse(fs.readFileSync(path.join(__dirname, '../DataBaseJson/emojis.json')));
      } catch {}
      const agora = Date.now();
      const diff = Math.floor((agora - createdAt) / 1000);
      let tempoRestante;
      if (diff < 300) {
        const min = Math.floor((300 - diff) / 60);
        const seg = (300 - diff) % 60;
        tempoRestante = `${min > 0 ? min + 'm ' : ''}${seg}s`;
        tempoRestante = `${emojis.time_emoji || '⏰'}  tempo restante: ${tempoRestante}`;
      } else {
        tempoRestante = `${emojis.time_emoji || '⏰'}  partida iniciada`;
      }
      const embed = new EmbedBuilder()
        .setColor(0x2ecc71)
        .setTitle(`${emojis._star_emoji || '⭐'} a partida sera iniciada em 5 minutos`)
        .setDescription(`${emojis._money_emoji || '💰'} valor: R$ ${valor}\n- ${emojis._mail_emoji || '📧'} id: ${id}\n- ${emojis._lock_emoji || '🔒'} senha: ${senha}\n-# ${tempoRestante}`);
      await msg.edit({ embeds: [embed], components: msg.components });
    }

    const sentMsg = await message.channel.send({ embeds: [embed], components: [row] });
    global.apostaGoPanel[message.channel.id].msgId = sentMsg.id;

    // Atualiza a cada segundo
    let interval = setInterval(async () => {
      const panel = global.apostaGoPanel[message.channel.id];
      if (!panel || !panel.msgId) return clearInterval(interval);
      const msg = await message.channel.messages.fetch(panel.msgId).catch(() => null);
      if (!msg) return clearInterval(interval);
      await atualizarTempoRestante(msg, panel.createdAt);
      // Para de atualizar após 6 minutos
      if (Date.now() - panel.createdAt > 360000) clearInterval(interval);
    }, 1000);
  }
}; 