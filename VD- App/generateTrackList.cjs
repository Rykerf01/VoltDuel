const fs = require('fs');
const files = fs.readdirSync('public/audio').filter(f => f.endsWith('.mp3') || f.endsWith('.m4a') || f.endsWith('.wav'));
fs.writeFileSync('src/trackList.json', JSON.stringify(files, null, 2));
console.log('Generated src/trackList.json');
