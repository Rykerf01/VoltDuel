const AdmZip = require('adm-zip');
const zip = new AdmZip('public/TRACKS.zip');
zip.extractAllTo('public/audio', true);
console.log('Extracted');
