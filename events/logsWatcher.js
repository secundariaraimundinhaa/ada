const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const configPath = path.join(__dirname, '../DataBaseJson/configuracoes.json');
const emojis = require('../DataBaseJson/emojis.json');
const secretKey = require('../DataBaseJson/client_secret.json')[0];
const lastLogPath = path.join(__dirname, '../DataBaseJson/lastLogId.json');

let lastLogId = null;
try {
  if (fs.existsSync(lastLogPath)) {
    lastLogId = JSON.parse(fs.readFileSync(lastLogPath, 'utf8'));
  }
} catch {}

module.exports = {
  name: 'ready',
  once: false,
  async execute(client) {
    setInterval(async () => {
      try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        const logsChannelId = config.logs;
        const res = await fetch(`https://apiauthflowsolutions.vercel.app/api/logs?secretKey=${secretKey}`);
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          for (const data of json.data) {
            if (data._id !== lastLogId) {
              lastLogId = data._id;
              fs.writeFileSync(lastLogPath, JSON.stringify(lastLogId));
              const embed = new EmbedBuilder()
                .setColor('#2b2d31')
                .setTitle(`${emojis._notify_emoji || '🔔'} Novo Log de Verificação`)
                .setDescription(`${emojis.member_verified_emoji || '✅'} **Usuário verificado!**`)
                .addFields(
                  { name: `${emojis._people_emoji || '👤'} Username (Discord)`, value: `${data.username} (<@${data.discordId}>)`, inline: true },
                  { name: `${emojis._mail_emoji || '📧'} Email (Discord)`, value: data.email, inline: true },
                  { name: `${emojis._diamond_emoji || '💎'} Discord ID`, value: data.discordId, inline: true },
                  { name: `${emojis._flag_emoji || '🚩'} IP do usuário`, value: data.ip, inline: true },
                  { name: `${emojis._tool_emoji || '🛠️'} UserAgent`, value: data.userAgent || 'Desconhecido', inline: false },
                  { name: `${emojis.date_emoji || '📅'} Verificado em`, value: `<t:${Math.floor(new Date(data.verifiedAt).getTime()/1000)}:f>`, inline: false }
                )
                .setThumbnail(`https://cdn.discordapp.com/avatars/${data.discordId}/${data.discordAvatar || ''}.png?size=256`)
                .setFooter({ text: 'Flow Solutions Logs', iconURL: client.user.displayAvatarURL() });
              const channel = await client.channels.fetch(logsChannelId).catch(() => null);
              if (channel) await channel.send({ embeds: [embed] });
            }
          }
        }
      } catch (e) {
        // Silencia erros para não travar o watcher
      }
    }, 15000); // 15 segundos
  },
}; 