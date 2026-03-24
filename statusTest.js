const { Client, GatewayIntentBits } = require('discord.js');
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildPresences
  ]
});

client.on('ready', () => {
  client.user.setPresence({
    activities: [{ name: 'Testando', type: 0 }],
    status: 'online'
  });
  console.log('Status setado!');
});

client.login(process.env.TOKEN);