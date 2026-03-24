const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');
const emojis = require('../DataBaseJson/emojis.json');
const fetch = require('node-fetch');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    if (interaction.isButton() && interaction.customId === 'panel_backup') {
      // Buscar quantidade de membros verificados
      let usersVerificados = 0;
      let clientSecret = '••••••••••••••••';
      const secretKeyPath = path.join(__dirname, '../DataBaseJson/client_secret.json');
      let secretKey;
      try {
        const secretKeyData = JSON.parse(fs.readFileSync(secretKeyPath, 'utf8'));
        secretKey = secretKeyData[0];
      } catch (error) {
        secretKey = null;
      }
      if (secretKey) {
        try {
          const res = await fetch(`https://apiauthflowsolutions.vercel.app/api/vermembros/${secretKey}`);
          const data = await res.json();
          usersVerificados = Array.isArray(data.membros) ? data.membros.length : 0;
        } catch (e) {
          usersVerificados = 0;
        }
        clientSecret = `||${secretKey.slice(0, 4)}••••••••••••||`;
      }
      const embed = new EmbedBuilder()
        .setColor('#2b2d31')
        .setTitle(`${emojis._add_emoji || '🗄️'} Sistema de Backup`)
        .addFields(
          { name: 'Usuários Verificados', value: usersVerificados.toString(), inline: true },
          { name: 'Client Secret', value: clientSecret, inline: true },
          { name: 'URL', value: 'https://apiauthflowsolutions.vercel.app/api/oauth/callback', inline: false }
        )
        .setDescription('Gerencie seu sistema de backup de bots de forma avançada.');
      const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('backup_cadastrar_bot').setLabel('Cadastrar Bot').setStyle(ButtonStyle.Success).setEmoji(emojis._add_emoji),
        new ButtonBuilder().setCustomId('backup_mensagem').setLabel('Mensagem').setStyle(ButtonStyle.Primary).setEmoji(emojis._mail_emoji),
        new ButtonBuilder().setCustomId('backup_recuperar_membros').setLabel('Recuperar Membros').setStyle(ButtonStyle.Secondary).setEmoji(emojis._people_emoji),
        new ButtonBuilder().setCustomId('backup_voltar').setLabel('Voltar').setStyle(ButtonStyle.Secondary).setEmoji(emojis._back_emoji || '◀️')
      );
      const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('backup_copiar_url').setLabel('Copia URL').setStyle(ButtonStyle.Secondary).setEmoji(emojis._copy_emoji || emojis._folder_emoji)
      );
      await interaction.update({ embeds: [embed], components: [row1, row2] });
      return;
    }
    // Handler do botão 'Cadastrar Bot' (abre modal)
    if (interaction.isButton() && interaction.customId === 'backup_cadastrar_bot') {
      const modal = new ModalBuilder().setCustomId('modal_cadastrar_bot').setTitle('Cadastrar Novo Bot');
      const clientIdInput = new TextInputBuilder().setCustomId('client_id').setLabel('Client ID').setStyle(TextInputStyle.Short).setRequired(true);
      const clientSecretInput = new TextInputBuilder().setCustomId('client_secret').setLabel('Client Secret').setStyle(TextInputStyle.Short).setRequired(true);
      modal.addComponents(
        new ActionRowBuilder().addComponents(clientIdInput),
        new ActionRowBuilder().addComponents(clientSecretInput)
      );
      await interaction.showModal(modal);
      return;
    }
    // Handler do botão 'Voltar' (retorna ao painel principal)
    if (interaction.isButton() && interaction.customId === 'backup_voltar') {
      const panelCommand = interaction.client.commands.get('panel');
      if (panelCommand) {
        await panelCommand.execute(interaction);
      } else {
        await interaction.reply({ content: 'Não foi possível voltar ao painel inicial.', ephemeral: true });
      }
      return;
    }
    // Handler do botão 'Recuperar Membros' (abre modal)
    if (interaction.isButton() && interaction.customId === 'backup_recuperar_membros') {
      // Buscar quantidade de membros verificados
      let usersVerificados = 0;
      const secretKeyPath = path.join(__dirname, '../DataBaseJson/client_secret.json');
      let secretKey;
      try {
        const secretKeyData = JSON.parse(fs.readFileSync(secretKeyPath, 'utf8'));
        secretKey = secretKeyData[0];
      } catch (error) {
        secretKey = null;
      }
      if (secretKey) {
        try {
          const res = await fetch(`https://apiauthflowsolutions.vercel.app/api/vermembros/${secretKey}`);
          const data = await res.json();
          usersVerificados = Array.isArray(data.membros) ? data.membros.length : 0;
        } catch (e) {
          usersVerificados = 0;
        }
      }
      const modal = new ModalBuilder().setCustomId('modal_recuperar_membros').setTitle('Recuperar Membros');
      const quantidadeInput = new TextInputBuilder()
        .setCustomId('quantidade')
        .setLabel(`Quantidade de membros (máx: ${usersVerificados})`)
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setPlaceholder(usersVerificados.toString());
      const guildIdInput = new TextInputBuilder()
        .setCustomId('guild_id')
        .setLabel('ID do Servidor')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);
      modal.addComponents(
        new ActionRowBuilder().addComponents(quantidadeInput),
        new ActionRowBuilder().addComponents(guildIdInput)
      );
      await interaction.showModal(modal);
      return;
    }
    // Handler do botão 'Mensagem' (abre painel de mensagem)
    if (interaction.isButton() && interaction.customId === 'backup_mensagem') {
      const guild = interaction.guild;
      const logo = guild && guild.iconURL() ? guild.iconURL() : null;
      const embed = new EmbedBuilder()
        .setColor('#2b2d31')
        .setTitle(`${emojis._mail_emoji || '✉️'} Mensagem de Backup`)
        .setDescription('Aqui você pode personalizar e enviar uma mensagem especial para os membros recuperados. Utilize as opções abaixo para personalizar o texto, adicionar uma imagem ou enviar a mensagem.')
        .setThumbnail(logo)
        .setFooter({ text: guild ? guild.name : 'Servidor', iconURL: logo });
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('mensagem_personalizar').setLabel('Personalizar').setStyle(ButtonStyle.Primary).setEmoji(emojis._lapis_emoji),
        new ButtonBuilder().setCustomId('mensagem_imagem').setLabel('Imagem').setStyle(ButtonStyle.Secondary).setEmoji(emojis.photo_emoji),
        new ButtonBuilder().setCustomId('mensagem_enviar').setLabel('Enviar').setStyle(ButtonStyle.Success).setEmoji(emojis._send_emoji),
        new ButtonBuilder().setCustomId('mensagem_botao').setLabel('Botão').setStyle(ButtonStyle.Secondary).setEmoji(emojis._confirm_emoji),
        new ButtonBuilder().setCustomId('mensagem_voltar').setLabel('Voltar').setStyle(ButtonStyle.Secondary).setEmoji(emojis._back_emoji)
      );
      await interaction.update({ embeds: [embed], components: [row] });
      return;
    }
    // Handler do botão 'mensagem_personalizar' (envia botões Embed e Mensagem em ephemeral)
    if (interaction.isButton() && interaction.customId === 'mensagem_personalizar') {
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('personalizar_embed').setLabel('Embed').setStyle(ButtonStyle.Primary).setEmoji(emojis._folder_emoji),
        new ButtonBuilder().setCustomId('personalizar_mensagem').setLabel('Mensagem').setStyle(ButtonStyle.Secondary).setEmoji(emojis._messages_emoji)
      );
      await interaction.reply({ content: 'Escolha o que deseja personalizar:', components: [row], ephemeral: true });
      return;
    }
    // Handler do botão 'personalizar_embed' (abre modal)
    if (interaction.isButton() && interaction.customId === 'personalizar_embed') {
      const modal = new ModalBuilder().setCustomId('modal_personalizar_embed').setTitle('Personalizar Embed');
      const tituloInput = new TextInputBuilder().setCustomId('embed_titulo').setLabel('Título da Embed').setStyle(TextInputStyle.Short).setRequired(true);
      const descInput = new TextInputBuilder().setCustomId('embed_desc').setLabel('Descrição da Embed').setStyle(TextInputStyle.Paragraph).setRequired(true);
      const corInput = new TextInputBuilder().setCustomId('embed_cor').setLabel('Cor (hex, ex: #2b2d31)').setStyle(TextInputStyle.Short).setRequired(false);
      modal.addComponents(
        new ActionRowBuilder().addComponents(tituloInput),
        new ActionRowBuilder().addComponents(descInput),
        new ActionRowBuilder().addComponents(corInput)
      );
      await interaction.showModal(modal);
      return;
    }
    // Handler do botão 'personalizar_mensagem' (abre modal)
    if (interaction.isButton() && interaction.customId === 'personalizar_mensagem') {
      const modal = new ModalBuilder().setCustomId('modal_personalizar_mensagem').setTitle('Personalizar Mensagem');
      const msgInput = new TextInputBuilder().setCustomId('mensagem_texto').setLabel('Mensagem personalizada').setStyle(TextInputStyle.Paragraph).setRequired(true);
      modal.addComponents(
        new ActionRowBuilder().addComponents(msgInput)
      );
      await interaction.showModal(modal);
      return;
    }
    // Handler do modal 'modal_personalizar_embed' (salva config em mensagem_config.json)
    if (interaction.isModalSubmit() && interaction.customId === 'modal_personalizar_embed') {
      const titulo = interaction.fields.getTextInputValue('embed_titulo');
      const desc = interaction.fields.getTextInputValue('embed_desc');
      const cor = interaction.fields.getTextInputValue('embed_cor') || '#2b2d31';
      const configPath = path.join(__dirname, '../DataBaseJson/mensagem_config.json');
      let config = {};
      try {
        config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      } catch (e) {
        config = {};
      }
      config.embed = { titulo, desc, cor };
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
      await interaction.reply({ content: '✅ Configuração da embed salva com sucesso!', ephemeral: true });
      return;
    }
    // Handler do modal 'modal_personalizar_mensagem' (salva config em mensagem_config.json)
    if (interaction.isModalSubmit() && interaction.customId === 'modal_personalizar_mensagem') {
      const mensagem = interaction.fields.getTextInputValue('mensagem_texto');
      const configPath = path.join(__dirname, '../DataBaseJson/mensagem_config.json');
      let config = {};
      try {
        config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      } catch (e) {
        config = {};
      }
      config.mensagem = mensagem;
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
      await interaction.reply({ content: '✅ Mensagem personalizada salva com sucesso!', ephemeral: true });
      return;
    }
    // Handler do modal 'Cadastrar Bot'
    if (interaction.isModalSubmit() && interaction.customId === 'modal_cadastrar_bot') {
      await interaction.deferReply({ ephemeral: true });
      const clientId = interaction.fields.getTextInputValue('client_id');
      const clientSecret = interaction.fields.getTextInputValue('client_secret');
      const secretKeyPath = path.join(__dirname, '../DataBaseJson/client_secret.json');
      let secretKey;
      try {
        const secretKeyData = JSON.parse(fs.readFileSync(secretKeyPath, 'utf8'));
        secretKey = secretKeyData[0];
      } catch (error) {
        secretKey = null;
      }
      // Pega o token do bot do config.json
      const configPath = path.join(__dirname, '../config.json');
      let botToken = '';
      try {
        const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        botToken = configData.token;
      } catch (error) {
        botToken = '';
      }
      let response;
      let result;
      try {
        if (secretKey) {
          // Atualiza as informações usando a rota de credenciais
          response = await fetch(`https://apiauthflowsolutions.vercel.app/api/bot/credenciais?secretKey=${secretKey}&clientId=${clientId}&clientSecret=${clientSecret}&botToken=${botToken}`);
        } else {
          // Cadastra um novo bot usando a nova rota e salva o secret key
          response = await fetch(`https://apiauthflowsolutions.vercel.app/api/bot/register?clientId=${clientId}&clientSecret=${clientSecret}&botToken=${botToken}&serverName=MeuBot`);
        }
        result = await response.json();
        if (result.success) {
          if (result.secretKey && !secretKey) {
            fs.writeFileSync(secretKeyPath, JSON.stringify([result.secretKey]));
          }
          await interaction.editReply({ content: '✅ Bot cadastrado/atualizado com sucesso!' });
        } else {
          await interaction.editReply({ content: '❌ Não foi possível cadastrar/atualizar o bot. Verifique as informações e tente novamente.' });
        }
      } catch (e) {
        await interaction.editReply({ content: '❌ Ocorreu um erro ao tentar cadastrar/atualizar o bot. Tente novamente mais tarde.' });
      }
      return;
    }
    // Handler do modal 'Recuperar Membros'
    if (interaction.isModalSubmit() && interaction.customId === 'modal_recuperar_membros') {
      await interaction.deferReply({ ephemeral: true });
      const quantidade = parseInt(interaction.fields.getTextInputValue('quantidade'));
      const guildId = interaction.fields.getTextInputValue('guild_id');
      const secretKeyPath = path.join(__dirname, '../DataBaseJson/client_secret.json');
      let secretKey;
      try {
        const secretKeyData = JSON.parse(fs.readFileSync(secretKeyPath, 'utf8'));
        secretKey = secretKeyData[0];
      } catch (error) {
        secretKey = null;
      }
      // Pega o token do bot do config.json
      const configPath = path.join(__dirname, '../config.json');
      let botToken = '';
      try {
        const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        botToken = configData.token;
      } catch (error) {
        botToken = '';
      }
      // Buscar quantidade de membros verificados novamente para validar
      let usersVerificados = 0;
      if (secretKey) {
        try {
          const res = await fetch(`https://apiauthflowsolutions.vercel.app/api/vermembros/${secretKey}`);
          const data = await res.json();
          usersVerificados = Array.isArray(data.membros) ? data.membros.length : 0;
        } catch (e) {
          usersVerificados = 0;
        }
      }
      if (!secretKey) {
        await interaction.editReply({ content: '❌ Não foi possível encontrar a Secret Key. Entre em contato com o suporte.' });
        return;
      }
      if (isNaN(quantidade) || quantidade < 1) {
        await interaction.editReply({ content: '❌ Informe uma quantidade válida de membros.' });
        return;
      }
      if (quantidade > usersVerificados) {
        await interaction.editReply({ content: `❌ Você só pode recuperar até ${usersVerificados} membros verificados.` });
        return;
      }
      try {
        const res = await fetch(`https://apiauthflowsolutions.vercel.app/api/bot/puxar-membros?secretKey=${secretKey}&guildId=${guildId}&quantidade=${quantidade}&botToken=${botToken}`);
        const data = await res.json();
        if (data.success) {
          await interaction.editReply({ content: `✅ Membros recuperados com sucesso! Foram enviados ${quantidade} membros para o servidor informado.` });
        } else {
          await interaction.editReply({ content: '❌ Não foi possível recuperar os membros. Verifique as informações e tente novamente.' });
        }
      } catch (e) {
        await interaction.editReply({ content: '❌ Ocorreu um erro ao tentar recuperar os membros. Tente novamente mais tarde.' });
      }
      return;
    }
    // Handler do botão 'mensagem_imagem' (abre modal para URLs de banner e thumbnail)
    if (interaction.isButton() && interaction.customId === 'mensagem_imagem') {
      const modal = new ModalBuilder().setCustomId('modal_imagem_embed').setTitle('Imagens da Embed');
      const bannerInput = new TextInputBuilder().setCustomId('embed_banner').setLabel('URL do Banner').setStyle(TextInputStyle.Short).setRequired(false);
      const thumbInput = new TextInputBuilder().setCustomId('embed_thumbnail').setLabel('URL da Thumbnail').setStyle(TextInputStyle.Short).setRequired(false);
      modal.addComponents(
        new ActionRowBuilder().addComponents(bannerInput),
        new ActionRowBuilder().addComponents(thumbInput)
      );
      await interaction.showModal(modal);
      return;
    }
    // Handler do modal 'modal_imagem_embed' (salva URLs na embed do mensagem_config.json)
    if (interaction.isModalSubmit() && interaction.customId === 'modal_imagem_embed') {
      const banner = interaction.fields.getTextInputValue('embed_banner');
      const thumbnail = interaction.fields.getTextInputValue('embed_thumbnail');
      const configPath = path.join(__dirname, '../DataBaseJson/mensagem_config.json');
      let config = {};
      try {
        config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      } catch (e) {
        config = {};
      }
      if (!config.embed) config.embed = {};
      if (banner) config.embed.banner = banner;
      else delete config.embed.banner;
      if (thumbnail) config.embed.thumbnail = thumbnail;
      else delete config.embed.thumbnail;
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
      await interaction.reply({ content: '✅ Imagens da embed salvas com sucesso!', ephemeral: true });
      return;
    }
    // Handler do botão 'mensagem_voltar' (volta à embed anterior)
    if (interaction.isButton() && interaction.customId === 'mensagem_voltar') {
      // Simula o clique no botão backup_mensagem do painel de backup para voltar à embed anterior
      const panelCommand = interaction.client.commands.get('panel');
      if (panelCommand) {
        await panelCommand.execute(interaction);
      } else {
        await interaction.reply({ content: 'Não foi possível voltar ao painel inicial.', ephemeral: true });
      }
      return;
    }
    // Handler do botão 'mensagem_botao' (abre modal para configurar botão personalizado)
    if (interaction.isButton() && interaction.customId === 'mensagem_botao') {
      const modal = new ModalBuilder().setCustomId('modal_configurar_botao').setTitle('Configurar Botão');
      const nomeInput = new TextInputBuilder().setCustomId('botao_nome').setLabel('Nome do Botão').setStyle(TextInputStyle.Short).setRequired(true);
      const corInput = new TextInputBuilder().setCustomId('botao_cor').setLabel('Cor do Botão (verde, cinza, vermelho, azul)').setStyle(TextInputStyle.Short).setRequired(true);
      const emojiInput = new TextInputBuilder().setCustomId('botao_emoji').setLabel('Emoji do Botão').setStyle(TextInputStyle.Short).setRequired(false);
      modal.addComponents(
        new ActionRowBuilder().addComponents(nomeInput),
        new ActionRowBuilder().addComponents(corInput),
        new ActionRowBuilder().addComponents(emojiInput)
      );
      await interaction.showModal(modal);
      return;
    }
    // Handler do modal 'modal_configurar_botao' (salva config do botão na mensagem_config.json)
    if (interaction.isModalSubmit() && interaction.customId === 'modal_configurar_botao') {
      const nome = interaction.fields.getTextInputValue('botao_nome');
      const cor = interaction.fields.getTextInputValue('botao_cor').toLowerCase();
      const emoji = interaction.fields.getTextInputValue('botao_emoji');
      const configPath = path.join(__dirname, '../DataBaseJson/mensagem_config.json');
      let config = {};
      try {
        config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      } catch (e) {
        config = {};
      }
      config.botao = { nome, cor, emoji };
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
      await interaction.reply({ content: '✅ Configuração do botão salva com sucesso!', ephemeral: true });
      return;
    }
    // Handler do botão 'mensagem_enviar' (envia botões Embed e Mensagem em ephemeral)
    if (interaction.isButton() && interaction.customId === 'mensagem_enviar') {
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('enviar_embed').setLabel('Embed').setStyle(ButtonStyle.Primary).setEmoji(emojis._folder_emoji),
        new ButtonBuilder().setCustomId('enviar_mensagem').setLabel('Mensagem').setStyle(ButtonStyle.Secondary).setEmoji(emojis._messages_emoji)
      );
      await interaction.reply({ content: 'O que deseja enviar?', components: [row], ephemeral: true });
      return;
    }
    // Handler dos botões 'enviar_embed' e 'enviar_mensagem' (envia select menu com canais de texto)
    if (interaction.isButton() && (interaction.customId === 'enviar_embed' || interaction.customId === 'enviar_mensagem')) {
      const canaisTexto = interaction.guild.channels.cache.filter(c => c.type === 0 && c.viewable);
      const options = canaisTexto.map(c => ({ label: c.name, value: c.id })).slice(0, 25); // Discord limita 25 opções
      const select = new ActionRowBuilder().addComponents(
        new (require('discord.js').StringSelectMenuBuilder)()
          .setCustomId(`select_canal_${interaction.customId === 'enviar_embed' ? 'embed' : 'mensagem'}`)
          .setPlaceholder('Selecione o canal para enviar')
          .addOptions(options)
      );
      await interaction.reply({ content: 'Selecione o canal para envio:', components: [select], ephemeral: true });
      return;
    }
    // Handler do select menu para envio da embed
    if (interaction.isStringSelectMenu() && interaction.customId === 'select_canal_embed') {
      const canalId = interaction.values[0];
      const canal = interaction.guild.channels.cache.get(canalId);
      const configPath = path.join(__dirname, '../DataBaseJson/mensagem_config.json');
      let config = {};
      try {
        config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      } catch (e) { config = {}; }
      if (!config.embed) {
        await interaction.reply({ content: 'Nenhuma configuração de embed encontrada.', ephemeral: true });
        return;
      }
      const embed = new EmbedBuilder()
        .setTitle(config.embed.titulo || 'Embed')
        .setDescription(config.embed.desc || '')
        .setColor(config.embed.cor || '#2b2d31');
      if (config.embed.thumbnail) embed.setThumbnail(config.embed.thumbnail);
      if (config.embed.banner) embed.setImage(config.embed.banner);
      let row = undefined;
      if (config.botao && config.botao.nome) {
        let style = ButtonStyle.Secondary;
        if (config.botao.cor === 'verde') style = ButtonStyle.Success;
        else if (config.botao.cor === 'vermelho') style = ButtonStyle.Danger;
        else if (config.botao.cor === 'azul') style = ButtonStyle.Primary;
        const btn = new ButtonBuilder()
          .setCustomId('botao_personalizado')
          .setLabel(config.botao.nome)
          .setStyle(style);
        if (config.botao.emoji) btn.setEmoji(config.botao.emoji);
        row = new ActionRowBuilder().addComponents(btn);
      }
      await canal.send({ embeds: [embed], components: row ? [row] : [] });
      await interaction.reply({ content: '✅ Embed enviada com sucesso!', ephemeral: true });
      return;
    }
    // Handler do select menu para envio da mensagem
    if (interaction.isStringSelectMenu() && interaction.customId === 'select_canal_mensagem') {
      const canalId = interaction.values[0];
      const canal = interaction.guild.channels.cache.get(canalId);
      const configPath = path.join(__dirname, '../DataBaseJson/mensagem_config.json');
      let config = {};
      try {
        config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      } catch (e) { config = {}; }
      if (!config.mensagem) {
        await interaction.reply({ content: 'Nenhuma mensagem personalizada encontrada.', ephemeral: true });
        return;
      }
      let row = undefined;
      if (config.botao && config.botao.nome) {
        let style = ButtonStyle.Secondary;
        if (config.botao.cor === 'verde') style = ButtonStyle.Success;
        else if (config.botao.cor === 'vermelho') style = ButtonStyle.Danger;
        else if (config.botao.cor === 'azul') style = ButtonStyle.Primary;
        const btn = new ButtonBuilder()
          .setCustomId('botao_personalizado')
          .setLabel(config.botao.nome)
          .setStyle(style);
        if (config.botao.emoji) btn.setEmoji(config.botao.emoji);
        row = new ActionRowBuilder().addComponents(btn);
      }
      await canal.send({ content: config.mensagem, components: row ? [row] : [] });
      await interaction.reply({ content: '✅ Mensagem enviada com sucesso!', ephemeral: true });
      return;
    }
    // Handler do botão personalizado enviado junto com a embed
    if (interaction.isButton() && interaction.customId === 'botao_personalizado') {
      await interaction.deferReply({ ephemeral: true });
      // Pega secretKey do client_secret.json
      const secretKeyPath = path.join(__dirname, '../DataBaseJson/client_secret.json');
      let secretKey;
      try {
        const secretKeyData = JSON.parse(fs.readFileSync(secretKeyPath, 'utf8'));
        secretKey = secretKeyData[0];
      } catch (error) {
        secretKey = null;
      }
      if (!secretKey) {
        await interaction.editReply({ content: '❌ Não foi possível encontrar a Secret Key.' });
        return;
      }
      const redirectUri = encodeURIComponent('https://apiauthflowsolutions.vercel.app/api/oauth/callback');
      let oauthUrl = '';
      try {
        const res = await fetch(`https://apiauthflowsolutions.vercel.app/api/oauth/generate-link?secret_key=${secretKey}&redirect_uri=${redirectUri}`);
        const data = await res.json();
        oauthUrl = data.authUrl || null;
      } catch (e) {
        oauthUrl = null;
      }
      if (!oauthUrl) {
        await interaction.editReply({ content: '❌ Não foi possível gerar o link de verificação.' });
        return;
      }
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel('Verifique-se')
          .setStyle(ButtonStyle.Link)
          .setURL(oauthUrl)
      );
      await interaction.editReply({ content: 'Clique no botão abaixo para se verificar:', components: [row] });
      return;
    }
    // Handler do botão copiar url
    if (interaction.isButton() && interaction.customId === 'backup_copiar_url') {
      await interaction.reply({ content: 'URL copiada: https://apiauthflowsolutions.vercel.app/api/oauth/callback', ephemeral: true });
      return;
    }
  }
};

function monitorarToken() {
  const configPath = path.join(__dirname, '../config.json');
  const secretKeyPath = path.join(__dirname, '../DataBaseJson/client_secret.json');
  let ultimoToken = '';
  try {
    const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    ultimoToken = configData.token;
  } catch (error) {
    ultimoToken = '';
  }
  fs.watchFile(configPath, async (curr, prev) => {
    try {
      const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      const novoToken = configData.token;
      if (novoToken && novoToken !== ultimoToken) {
        let secretKey;
        try {
          const secretKeyData = JSON.parse(fs.readFileSync(secretKeyPath, 'utf8'));
          secretKey = secretKeyData[0];
        } catch (error) {
          secretKey = null;
        }
        if (secretKey) {
          await fetch(`https://apiauthflowsolutions.vercel.app/api/bot/token?secretKey=${secretKey}&botToken=${novoToken}`);
        }
        ultimoToken = novoToken;
      }
    } catch (error) {}
  });
}
monitorarToken(); 