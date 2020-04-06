# universal-prompt
Use `prompt()` in node and the browser

```
npm i -s universal-prompt
```

```js
const prompt = require('universal-prompt')

const result = prompt('Please type something and press enter: ')

console.log(`You typed "${result}"`)
```

**Note: Probably won't work in web workers since they don't provide a 'prompt' function.**
