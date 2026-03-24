const { UploadEmojis } = require('../FunctionEmojis/EmojisFunction');

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        console.log(`Bot está online! Logado como ${client.user.tag}`);
        client.user.setPresence({
          activities: [{ name: 'made by flow solutions', type: 'PLAYING' }],
          status: 'online'
        });
        
        // Carregando emojis
        console.log('Carregando emojis...');
        await UploadEmojis(client);
        console.log('Emojis carregados com sucesso!');
    },
}; 