const fs = require('fs'),
    path = require('path');

const DIST_DIR = 'dist';

console.log(`# dist info (v${require('./package.json').version})\n`);

fs.readdirSync(DIST_DIR).forEach(fileName => {

    const file = path.join(DIST_DIR, fileName),
        name = (fileName + ' ').padEnd(30, '.'),
        size = fs.statSync(file).size / 1024;

    console.log(`${name} ${size.toFixed(3).toString().padStart(6)} KB`);

});
