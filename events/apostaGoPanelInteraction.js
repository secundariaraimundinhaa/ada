const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');

function calcularValorTotal(valor) {
  let v = parseFloat(valor.replace(',', '.'));
  let total = (v * 2) - 0.90;
  return total.toFixed(2).replace('.', ',');
}

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    if (!interaction.isButton() && !interaction.isModalSubmit()) return;
    if (
      !/^copiar_id_aposta|alterar_valor_aposta$/.test(interaction.customId) &&
      interaction.customId !== 'modal_alterar_valor_aposta'
    ) return;
    const panel = global.apostaGoPanel && global.apostaGoPanel[interaction.channel.id];
    if (!panel) return;
    if (interaction.isButton() && interaction.customId === 'copiar_id_aposta') {
      await interaction.reply({ content: `ID: ${panel.id}`, ephemeral: true });
      return;
    }
    if (interaction.isButton() && interaction.customId === 'alterar_valor_aposta') {
      const modal = new ModalBuilder()
        .setCustomId('modal_alterar_valor_aposta')
        .setTitle('Alterar Valor da Aposta');
      const input = new TextInputBuilder()
        .setCustomId('novo_valor')
        .setLabel('Novo valor da aposta (ex: 2,90)')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);
      const row = new ActionRowBuilder().addComponents(input);
      modal.addComponents(row);
      await interaction.showModal(modal);
      return;
    }
    if (interaction.isModalSubmit() && interaction.customId === 'modal_alterar_valor_aposta') {
      const novoValor = interaction.fields.getTextInputValue('novo_valor');
      const novoValorTotal = calcularValorTotal(novoValor);
      let emojis = {};
      try {
        emojis = JSON.parse(fs.readFileSync(path.join(__dirname, '../DataBaseJson/emojis.json')));
      } catch {}
      let tempoRestante = `${emojis.time_emoji || '⏰'}  tempo restante: 5m 0s`;
      const embed = new EmbedBuilder()
        .setColor(0x2ecc71)
        .setTitle(`${emojis._star_emoji || '⭐'} go em 5 minutos`)
        .setDescription(`${emojis._money_emoji || '💰'} valor: R$ ${novoValor}\n- ${emojis._mail_emoji || '📧'} id: ${panel.id}\n- ${emojis._lock_emoji || '🔒'} senha: ${panel.senha}\n-# ${tempoRestante}`);
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('copiar_id_aposta')
          .setLabel('Copiar ID')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji(emojis._mail_emoji || '📧'),
        new ButtonBuilder()
          .setCustomId('alterar_valor_aposta')
          .setLabel('Alterar Valor')
          .setStyle(ButtonStyle.Primary)
          .setEmoji(emojis._change_emoji || '💱')
      );
      await interaction.message.edit({ embeds: [embed], components: [row] });
      await interaction.channel.setName(`pagar - ${novoValorTotal}`).catch(() => {});
      global.apostaGoPanel[interaction.channel.id] = { ...panel, valor: novoValor, valorTotal: novoValorTotal, createdAt: Date.now(), msgId: interaction.message.id };
      await interaction.reply({ content: 'Valor alterado com sucesso!', ephemeral: true });
    }
  }
}; 