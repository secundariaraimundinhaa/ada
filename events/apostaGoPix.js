const { AttachmentBuilder } = require('discord.js');
const axios = require('axios');

// Regex para detectar chave PIX (email, CPF, CNPJ, número)
const regexPix = /([a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)|(\d{11})|(\d{14})|(\d{2,3}\d{4,5}\d{4})/;

function parseValorFromChannelName(name) {
  const match = name.match(/^pagar-(\d+)-(\d{2})$/);
  if (!match) return null;
  return `${parseInt(match[1])},${match[2]}`;
}

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    if (message.author.bot) return;
    if (!message.guild) return;
    if (!message.channel.isTextBased()) return;
    if (!/^pagar-\d+-\d{2}$/.test(message.channel.name)) return;

    const chave = message.content.match(regexPix)?.[0];
    if (!chave) return;

    try {
      
      const nome = 'Flow Solutions';
      const cidade = 'Sao Paulo';
      const url = `https://gerarqrcodepix.com.br/api/v1?chave=${encodeURIComponent(chave)}&nome=${encodeURIComponent(nome)}&cidade=${encodeURIComponent(cidade)}&saida=qr`;
      const response = await axios.get(url, { responseType: 'arraybuffer' });
      const qrBuffer = Buffer.from(response.data);
      // Envia o QR Code
      const attachment = new AttachmentBuilder(qrBuffer, { name: 'qrcode.png' });
      await message.channel.send({ 
        content: `QR Code gerado para a chave PIX enviada por <@${message.author.id}> (pagamento aberto, sem valor definido)`, 
        files: [attachment] 
      });
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
      await message.channel.send('❌ Erro ao gerar QR Code. Por favor, tente novamente.');
    }
  }
}; 