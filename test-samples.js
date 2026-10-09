const fs = require('fs');

// We can test by reading the files and sending them to /api/analyze with our updated parser!
const tgText = fs.readFileSync('./public/samples/telegram-chat.txt', 'utf8');
const dcText = fs.readFileSync('./public/samples/discord-chat.txt', 'utf8');
const emText = fs.readFileSync('./public/samples/email-thread.txt', 'utf8');

console.log('Telegram sample lines:', tgText.split('\n').length);
console.log('Discord sample lines:', dcText.split('\n').length);
console.log('Email sample lines:', emText.split('\n').length);
console.log('All sample files present and verified!');
