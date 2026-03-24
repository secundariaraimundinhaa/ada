const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, StringSelectMenuBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const emojis = require('../DataBaseJson/emojis.json');

const designPath = path.join(__dirname, '../DataBaseJson/bot_design.json');
const colorPath = path.join(__dirname, '../DataBaseJson/bot_color.json');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    // Handler do botão Meu Bot Design
    if (interaction.isButton() && interaction.customId === 'panel_meubot') {
      const embed = new EmbedBuilder()
        .setColor('#2b2d31')
        .setTitle(`${emojis._diamond_emoji || '💎'} Meu Bot Design`)
        .setDescription('Personalize o visual do seu bot! Use os botões abaixo para editar o design ou escolher uma cor.');
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('meubot_design').setLabel('Desing').setStyle(ButtonStyle.Primary).setEmoji(emojis._folder_emoji),
        new ButtonBuilder().setCustomId('meubot_cores').setLabel('Cores').setStyle(ButtonStyle.Secondary).setEmoji(emojis._diamond_emoji),
        new ButtonBuilder().setCustomId('meubot_voltar').setLabel('Voltar').setStyle(ButtonStyle.Secondary).setEmoji(emojis._back_emoji || '◀️')
      );
      await interaction.update({ embeds: [embed], components: [row] });
      return;
    }

    // Handler do botão Desing
    if (interaction.isButton() && interaction.customId === 'meubot_design') {
      const modal = new ModalBuilder().setCustomId('modal_meubot_design').setTitle('Personalizar Design do Bot');
      const nomeInput = new TextInputBuilder().setCustomId('bot_nome').setLabel('Nome do Bot').setStyle(TextInputStyle.Short).setRequired(false);
      const avatarInput = new TextInputBuilder().setCustomId('bot_avatar').setLabel('Avatar (URL)').setStyle(TextInputStyle.Short).setRequired(false);
      const bannerInput = new TextInputBuilder().setCustomId('bot_banner').setLabel('Banner (URL)').setStyle(TextInputStyle.Short).setRequired(false);
      modal.addComponents(
        new ActionRowBuilder().addComponents(nomeInput),
        new ActionRowBuilder().addComponents(avatarInput),
        new ActionRowBuilder().addComponents(bannerInput)
      );
      await interaction.showModal(modal);
      return;
    }

    // Handler do modal de design
    if (interaction.isModalSubmit() && interaction.customId === 'modal_meubot_design') {
      const nome = interaction.fields.getTextInputValue('bot_nome');
      const avatar = interaction.fields.getTextInputValue('bot_avatar');
      const banner = interaction.fields.getTextInputValue('bot_banner');
      const data = { nome, avatar, banner };
      // Aplica as modificações no bot
      try {
        if (nome) await interaction.client.user.setUsername(nome);
      } catch (e) {}
      try {
        if (avatar) await interaction.client.user.setAvatar(avatar);
      } catch (e) {}
      try {
        if (banner) await interaction.client.user.setBanner(banner);
      } catch (e) {}
      // Banner só pode ser salvo, não aplicado
      fs.writeFileSync(designPath, JSON.stringify(data, null, 2));
      await interaction.reply({ content: `${emojis.confirmed_emoji || '✅'} Design salvo e aplicado!`, ephemeral: true });
      return;
    }

    // Handler do botão Cores
    if (interaction.isButton() && interaction.customId === 'meubot_cores') {
      const cores = [
        { label: 'Vermelho', value: '#ED4245', emoji: '🟥' },
        { label: 'Verde', value: '#57F287', emoji: '🟩' },
        { label: 'Azul', value: '#5865F2', emoji: '🟦' },
        { label: 'Amarelo', value: '#FEE75C', emoji: '🟨' },
        { label: 'Laranja', value: '#FFA500', emoji: '🟧' },
        { label: 'Rosa', value: '#EB459E', emoji: '🩷' },
        { label: 'Preto', value: '#23272A', emoji: '⬛' },
        { label: 'Branco', value: '#FFFFFF', emoji: '⬜' }
      ];
      const select = new StringSelectMenuBuilder()
        .setCustomId('meubot_select_cor')
        .setPlaceholder('Escolha uma cor para o bot')
        .addOptions(cores.map(cor => ({ label: cor.label, value: cor.value, emoji: cor.emoji })));
      const row = new ActionRowBuilder().addComponents(select);
      await interaction.reply({ content: 'Selecione uma cor para o bot:', components: [row], ephemeral: true });
      return;
    }

    // Handler do select menu de cor
    if (interaction.isStringSelectMenu() && interaction.customId === 'meubot_select_cor') {
      const cor = interaction.values[0];
      fs.writeFileSync(colorPath, JSON.stringify({ cor }, null, 2));
      await interaction.reply({ content: `${emojis.confirmed_emoji || '✅'} Cor salva: ${cor}`, ephemeral: true });
      return;
    }

    // Handler do botão Voltar
    if (interaction.isButton() && interaction.customId === 'meubot_voltar') {
      const panelCommand = interaction.client.commands.get('panel');
      if (panelCommand) {
        await panelCommand.execute(interaction);
      } else {
        await interaction.reply({ content: 'Não foi possível voltar ao painel inicial.', ephemeral: true });
      }
      return;
    }
  }
}; 