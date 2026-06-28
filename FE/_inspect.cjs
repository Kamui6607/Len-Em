const fs = require('fs');
const c = fs.readFileSync('src/app/pages/Profile.tsx', 'utf8');
console.log('char codes 360-400:', c.slice(360, 400).split('').map(ch => ch.charCodeAt(0)).join(','));
console.log('slice:', JSON.stringify(c.slice(360, 400)));
