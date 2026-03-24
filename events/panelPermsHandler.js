const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');
const emojis = require('../DataBaseJson/emojis.json');

const permsPath = path.join(__dirname, '../DataBaseJson/perms.json');

function getPerms() {
  try {
    return JSON.parse(fs.readFileSync(permsPath, 'utf8'));
  } catch {
    return {};
  }
}
function savePerms(perms) {
  fs.writeFileSync(permsPath, JSON.stringify(perms, null, 2));
}

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    if (interaction.isButton() && interaction.customId === 'panel_perms') {
      const embed = new EmbedBuilder()
        .setColor('#2b2d31')
        .setTitle(`${emojis.permissions_emoji || '🔑'} Gerenciar Permissões`)
        .setDescription(`${emojis._diamond_emoji || '💎'} Adicione ou remova permissões especiais para usuários do bot.

${emojis._star_emoji || '⭐'} Use os botões abaixo para gerenciar as permissões.`);
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('perms_add').setLabel('Adicionar Perm').setStyle(ButtonStyle.Success).setEmoji(emojis._add_emoji),
        new ButtonBuilder().setCustomId('perms_remove').setLabel('Remover Perm').setStyle(ButtonStyle.Danger).setEmoji(emojis._trash_emoji),
        new ButtonBuilder().setCustomId('perms_voltar').setLabel('Voltar').setStyle(ButtonStyle.Secondary).setEmoji(emojis._back_emoji || '◀️')
      );
      await interaction.update({ embeds: [embed], components: [row] });
      return;
    }

    if (interaction.isButton() && interaction.customId === 'perms_add') {
      const modal = new ModalBuilder().setCustomId('modal_perms_add').setTitle('Adicionar Permissão');
      const userIdInput = new TextInputBuilder().setCustomId('perms_userid').setLabel('ID do Usuário').setStyle(TextInputStyle.Short).setRequired(true);
      modal.addComponents(
        new ActionRowBuilder().addComponents(userIdInput)
      );
      await interaction.showModal(modal);
      return;
    }

    if (interaction.isModalSubmit() && interaction.customId === 'modal_perms_add') {
      const userId = interaction.fields.getTextInputValue('perms_userid');
      const perm = 'admin';
      const perms = getPerms();
      if (!perms[userId]) perms[userId] = [];
      if (!perms[userId].includes(perm)) perms[userId].push(perm);
      savePerms(perms);
      await interaction.reply({ content: `${emojis.confirmed_emoji || '✅'} Permissão 'admin' adicionada para o usuário ${userId}`, ephemeral: true });
      return;
    }

    if (interaction.isButton() && interaction.customId === 'perms_remove') {
      const modal = new ModalBuilder().setCustomId('modal_perms_remove').setTitle('Remover Permissão');
      const userIdInput = new TextInputBuilder().setCustomId('perms_userid').setLabel('ID do Usuário').setStyle(TextInputStyle.Short).setRequired(true);
      modal.addComponents(
        new ActionRowBuilder().addComponents(userIdInput)
      );
      await interaction.showModal(modal);
      return;
    }

    if (interaction.isModalSubmit() && interaction.customId === 'modal_perms_remove') {
      const userId = interaction.fields.getTextInputValue('perms_userid');
      const perm = 'admin';
      const perms = getPerms();
      if (perms[userId]) {
        perms[userId] = perms[userId].filter(p => p !== perm);
        if (perms[userId].length === 0) delete perms[userId];
        savePerms(perms);
        await interaction.reply({ content: `${emojis.confirmed_emoji || '✅'} Permissão 'admin' removida do usuário ${userId}`, ephemeral: true });
      } else {
        await interaction.reply({ content: `${emojis.negative_emoji || '❌'} Usuário não possui essa permissão.`, ephemeral: true });
      }
      return;
    }

    if (interaction.isButton() && interaction.customId === 'perms_voltar') {
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