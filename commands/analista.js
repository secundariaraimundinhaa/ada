const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Carrega os emojis e cargos
const emojis = require('../DataBaseJson/emojis.json');
const mediadorCargo = require('../DataBaseJson/mediador.json')[0]; // ID do cargo de mediador
const analistaCargo = require('../DataBaseJson/analista.json')[0]; // ID do cargo de analista

module.exports = {
    data: new SlashCommandBuilder()
        .setName('analista')
        .setDescription('Solicita análise de um usuário')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Usuário a ser analisado')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('motivo')
                .setDescription('Motivo da análise')
                .setRequired(true)),

    async execute(interaction) {
        // Verifica se o usuário tem cargo de mediador
        if (!interaction.member.roles.cache.has(mediadorCargo)) {
            return interaction.reply({
                content: `${emojis.negative_emoji} Você não tem permissão para usar este comando!`,
                ephemeral: true
            });
        }

        const user = interaction.options.getUser('user');
        const motivo = interaction.options.getString('motivo');

        // Embed principal
        const embedAnalise = new EmbedBuilder()
            .setColor('#2b2d31')
            .setTitle(`${emojis._staff_emoji} Solicitação de Análise`)
            .setDescription(`${emojis._people_emoji} **Usuário:** ${user}\n${emojis._text_emoji} **Motivo:** ${motivo}\n${emojis._star_emoji} **Solicitante:** ${interaction.user}`)
            .setFooter({ text: `ID do Usuário: ${user.id}` })
            .setTimestamp();

        // Botões principais
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('assumir_analise')
                    .setLabel('Assumir Análise')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji(emojis._confirm_emoji),
                new ButtonBuilder()
                    .setCustomId('administrar_analise')
                    .setLabel('Administrar')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji(emojis._settings_emoji)
            );

        // Envia a mensagem inicial
        const msg = await interaction.reply({
            embeds: [embedAnalise],
            components: [row],
            fetchReply: true
        });

        // Variável para guardar quem assumiu
        let analistaAssumiu = null;

        // Coletor de botões
        const collector = msg.createMessageComponentCollector({ time: 3600000 });

        collector.on('collect', async (i) => {
            // Verifica se o usuário tem o cargo de analista
            if (!i.member.roles.cache.has(analistaCargo)) {
                return i.reply({
                    content: `${emojis.negative_emoji} Apenas analistas podem usar estes botões!`,
                    ephemeral: true
                });
            }

            // Se já foi assumido, desabilita o botão assumir para todos
            if (analistaAssumiu && i.customId === 'assumir_analise') {
                return i.reply({
                    content: `${emojis.negative_emoji} Esta análise já foi assumida!`,
                    ephemeral: true
                });
            }

            if (i.customId === 'assumir_analise') {
                analistaAssumiu = i.user.id;
                const embedAssumido = new EmbedBuilder()
                    .setColor('#2b2d31')
                    .setDescription(`${emojis._confirm_emoji} O analista ${i.user} assumiu esta análise!`)
                    .setTimestamp();

                // Atualiza a embed principal para incluir quem assumiu
                embedAnalise.setDescription(
                    `${emojis._people_emoji} **Usuário:** ${user}\n` +
                    `${emojis._text_emoji} **Motivo:** ${motivo}\n` +
                    `${emojis._star_emoji} **Solicitante:** ${interaction.user}\n` +
                    `${emojis._staff_emoji} **Analista:** ${i.user}`
                );

                // Atualiza os botões: 'Assumido' desabilitado/vermelho, 'Administrar' só para quem assumiu
                const rowAtualizada = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('assumir_analise')
                            .setLabel('Assumido')
                            .setStyle(ButtonStyle.Danger)
                            .setDisabled(true),
                        new ButtonBuilder()
                            .setCustomId('administrar_analise')
                            .setLabel('Administrar')
                            .setStyle(ButtonStyle.Primary)
                            .setEmoji(emojis._settings_emoji)
                            .setDisabled(false)
                    );

                await i.update({
                    embeds: [embedAnalise, embedAssumido],
                    components: [rowAtualizada]
                });
                return;
            }

            // Só quem assumiu pode administrar
            if (i.customId === 'administrar_analise') {
                if (analistaAssumiu !== i.user.id) {
                    return i.reply({
                        content: `${emojis.negative_emoji} Apenas o analista que assumiu pode administrar esta análise!`,
                        ephemeral: true
                    });
                }
                const embedAdmin = new EmbedBuilder()
                    .setColor('#2b2d31')
                    .setTitle(`${emojis._settings_emoji} Administração`)
                    .setDescription(`${emojis._people_emoji} **Usuário:** ${user}\n${emojis._text_emoji} **Motivo:** ${motivo}\n\nEscolha uma ação para o usuário:`)
                    .setTimestamp();

                const rowAdmin = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('usuario_limpo')
                            .setLabel('Usuário Limpo')
                            .setStyle(ButtonStyle.Success)
                            .setEmoji(emojis.confirmed_emoji),
                        new ButtonBuilder()
                            .setCustomId('usuario_xitado')
                            .setLabel('Usuário Xitado')
                            .setStyle(ButtonStyle.Danger)
                            .setEmoji(emojis._ban_emoji)
                    );

                await i.reply({
                    embeds: [embedAdmin],
                    components: [rowAdmin],
                    ephemeral: true
                });
            }

            if (i.customId === 'usuario_limpo') {
                const embedLimpo = new EmbedBuilder()
                    .setColor('#2b2d31')
                    .setDescription(`${emojis.confirmed_emoji} O analista ${i.user} definiu ${user} como limpo!`)
                    .setTimestamp();

                // Atualiza a embed principal para mostrar o resultado
                embedAnalise.setDescription(
                    `${emojis._people_emoji} **Usuário:** ${user}\n` +
                    `${emojis._text_emoji} **Motivo:** ${motivo}\n` +
                    `${emojis._star_emoji} **Solicitante:** ${interaction.user}\n` +
                    `${emojis._staff_emoji} **Analista:** ${i.user}\n` +
                    `${emojis.confirmed_emoji} **Resultado:** Usuário Limpo`
                );

                await i.update({
                    embeds: [embedAnalise, embedLimpo],
                    components: []
                });
            }

            if (i.customId === 'usuario_xitado') {
                const modal = new ModalBuilder()
                    .setCustomId('modal_blacklist')
                    .setTitle('Adicionar à Blacklist');

                const motivoInput = new TextInputBuilder()
                    .setCustomId('motivo_blacklist')
                    .setLabel('Motivo da Blacklist')
                    .setStyle(TextInputStyle.Paragraph)
                    .setPlaceholder('Digite o motivo detalhado para adicionar à blacklist...')
                    .setRequired(true)
                    .setMinLength(10)
                    .setMaxLength(1000);

                const rowModal = new ActionRowBuilder().addComponents(motivoInput);
                modal.addComponents(rowModal);

                await i.showModal(modal);
            }
        });

        // Handler do modal
        interaction.client.on('interactionCreate', async (i) => {
            if (!i.isModalSubmit()) return;
            if (i.customId !== 'modal_blacklist') return;

            // Verifica se o usuário tem o cargo de analista
            if (!i.member.roles.cache.has(analistaCargo)) {
                return i.reply({
                    content: `${emojis.negative_emoji} Apenas analistas podem usar este modal!`,
                    ephemeral: true
                });
            }

            const motivoBlacklist = i.fields.getTextInputValue('motivo_blacklist');
            
            // Aqui você pode adicionar a lógica para salvar na blacklist
            // Similar ao comando /blacklist

            const embedXitado = new EmbedBuilder()
                .setColor('#2b2d31')
                .setDescription(`${emojis._ban_emoji} O analista ${i.user} encontrou hack em ${user}!\n${emojis._text_emoji} **Motivo:** ${motivoBlacklist}`)
                .setTimestamp();

            // Atualiza a embed principal para mostrar o resultado
            embedAnalise.setDescription(
                `${emojis._people_emoji} **Usuário:** ${user}\n` +
                `${emojis._text_emoji} **Motivo:** ${motivo}\n` +
                `${emojis._star_emoji} **Solicitante:** ${interaction.user}\n` +
                `${emojis._staff_emoji} **Analista:** ${i.user}\n` +
                `${emojis._ban_emoji} **Resultado:** Usuário Xitado\n` +
                `${emojis._text_emoji} **Motivo Blacklist:** ${motivoBlacklist}`
            );

            await i.reply({
                embeds: [embedXitado],
                ephemeral: true
            });

            // Atualiza a mensagem original
            await interaction.editReply({
                embeds: [embedAnalise],
                components: []
            });
        });
    },
}; 