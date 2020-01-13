const brotli = require('brotli')
const fs = require('fs')

const file = fs.readFileSync('src/types.json')
console.log('THIS IS FILE', file)
const length = file.length
// encode some data with options (default options shown)
const encoded = function getEncoded () {
  const compressed = brotli.compress(file, {
    mode: 0, // 0 = generic, 1 = text, 2 = font (WOFF2)
    quality: 1, // 0 - 11
    lgwin: 50 // window size
  });
  console.log('COMPRESSED', compressed)
  return compressed
}
const decode = function getDecoded () {
  const encodedFile = fs.readFileSync('encoded.js')
  console.log('ENCODED FILE', encodedFile)
  const decompressed =  brotli.decompress(encodedFile);
  console.log(new TextDecoder("utf-8").decode(decompressed))
  return decompressed
}


fs.writeFile('encoded.js', encoded(), (err) => {
    if (err) throw err;
    console.log('File encoded and saved!');


    fs.writeFile('decoded.js', decode(), (err) => {
      if (err) throw err;
      console.log('File DECODED and saved!');
    });
});
