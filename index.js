require('dotenv').config(); // IMPORTANTE

const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./config.json');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildPresences
    ]
});

client.commands = new Collection();
client.cooldowns = new Collection();

// ================= SLASH COMMANDS =================
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    }
}

// ================= EVENTS =================
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

// ================= PREFIX COMMANDS =================
client.prefixCommands = new Map();
const prefixCommandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of prefixCommandFiles) {
    const command = require(`./commands/${file}`);
    if (command.name && command.execute) {
        client.prefixCommands.set(command.name, command);
    }
}

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const prefix = config.prefix || '!';
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    const command = client.prefixCommands.get(commandName);

    if (!command) return;

    try {
        await command.execute(message, args);
    } catch (error) {
        console.error(error);
        message.reply('❌ Ocorreu um erro ao executar o comando.');
    }
});

// ================= REGISTRAR SLASH =================
const rest = new REST().setToken(process.env.TOKEN);

(async () => {
    try {
        console.log('Iniciando registro dos comandos slash...');

        const commands = [];

        for (const file of commandFiles) {
            const command = require(`./commands/${file}`);
            if (command.data && typeof command.data.toJSON === 'function') {
                commands.push(command.data.toJSON());
            }
        }

        await rest.put(
            Routes.applicationCommands(config.clientId),
            { body: commands },
        );

        console.log('Comandos slash registrados com sucesso!');
    } catch (error) {
        console.error(error);
    }
})();

// ================= ERROS =================
process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

// ================= LOGIN =================
client.login(process.env.TOKEN);