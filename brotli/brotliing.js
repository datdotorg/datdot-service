const brotli = require('brotli')
const fs = require('fs')

const file = fs.readFileSync('src/types.json')
console.log(file)
const length = file.length
// encode some data with options (default options shown)
const encoded = function getEncoded () {
  return brotli.compress(file, {
    mode: 0, // 0 = generic, 1 = text, 2 = font (WOFF2)
    quality: 1, // 0 - 11
    lgwin: 50 // window size
  });
}
const decode = function getDecoded () {
  return brotli.decompress(fs.readFileSync('encoded.js'));
}


fs.writeFile('encoded.js', encoded(), (err) => {
    if (err) throw err;
    console.log('File encoded and saved!');


    fs.writeFile('decoded.js', decode(), (err) => {
      if (err) throw err;
      console.log('File DECODED and saved!');
    });
});
