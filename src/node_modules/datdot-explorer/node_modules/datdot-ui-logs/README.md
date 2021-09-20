# datdot-ui-logs
![image](https://user-images.githubusercontent.com/9526525/122788466-efa8e100-d2e8-11eb-88af-2f9008ff24bc.png)

Click button to trigger function about type of logs

#### Properties in `src/index.js`
```js
module.exports = logs
function logs ( protocol ) {
    const sender = protocol ( get )
    // define name as logs
    sender({from: 'logs', flow: 'logs-layout', type: 'ready', fn: 'logs', file, line: 8})
    ...
}

function get ({page = 'Demo', from, flow, type, body, fn, file, line}) {
....
}
```

In `demo/demo.js`
#### Protocol
Use `receipients['logs']({obj})`
```js
function protocol (name) {
    return sender => {
        recipients[name] = sender
        return (msg) => {
            const {page, from, flow, type, body, fn, file, line} = msg
            // console.log( `type: ${type}, file: ${file}, line: ${line}`);
            // use logs as a name variable from received msg was already defined in index.js
            recipients['logs'](msg)
        }
    }
}
```
#### Event handler
```js
function handleClick (target) {
  recipients['logs']({page: 'JOBS', from: target, flow: 'button', type: 'click', fn: 'handleClick', file, line: 28})
}
```
file is referenced `path` in node.js libary that it would be automactically checked file name.
```js
const file = require('path').basename(__filename)
```

#### HTML element add `onclick` function
```js
<button class="btn" role="button" aria-label="Click" onclick=${() => handleClick('click') }>Click</button>
```

#### Define colors
It is required and added in `demo/demo.js` as CSS variables
```css
:root {
    --b: 0, 0%;
    --r: 100%, 50%;
    --color-white: var(--b), 100%;
    --color-black: var(--b), 0%;
    --color-dark: 223, 13%, 20%;
    --color-deep-black: 222, 18%, 11%;
    --color-blue: 214, var(--r);
    --color-red: 358, 99%, 53%;
    --color-orange: 35, 100%, 58%;
    --color-deep-saffron: 31, 100%, 56%;
    --color-ultra-red: 348, 96%, 71%;
    --color-flame: 15, 80%, 50%;
    --color-verdigris: 180, 54%, 43%;
    --color-maya-blue: 205, 96%, 72%;
    --color-slate-blue: 248, 56%, 59%;
    --color-blue-jeans: 204, 96%, 61%;
    --color-dodger-blue: 213, 90%, 59%;
    --color-slimy-green: 108, 100%, 28%;
    --color-maximum-blue-green: 180, 54%, 51%;
    --color-green-pigment: 136, 81%, 34%;
    --color-yellow: 44, 100%, 55%;
    --color-chrome-yellow: 39, var(--r);
    --color-bright-yellow-crayola: 35, 100%, 58%;
    --color-purple: 283, var(--r);
    --color-medium-purple: 269, 100%, 70%;
    --color-grey33: var(--b), 20%;
    --color-grey66: var(--b), 40%;
    --color-grey70: var(--b), 44%;
    --color-grey88: var(--b), 53%;
    --color-greyA2: var(--b), 64%;
    --color-greyC3: var(--b), 76%;
    --color-greyCB: var(--b), 80%;
    --color-greyD8: var(--b), 85%;
    --color-greyD9: var(--b), 85%;
    --color-greyE2: var(--b), 89%;
    --color-greyEB: var(--b), 92%;
    --color-greyED: var(--b), 93%;
    --color-greyEF: var(--b), 94%;
    --color-greyF2: var(--b), 95%;
    --color-green: 136, 81%, 34%;
    ...
    ...
    }
```

There are defined constant CSS variables for event types in `src/index.js`, this part will keep updating if need.
```css
:host(i-log) [aria-type="click"] {
    --color: var(--color-dark);
    --bgColor: var(--color-yellow);
    --opacity: 1;
}
:host(i-log) [aria-type="triggered"] {
    --color: var(--color-dark);
    --bgColor: var(--color-blue-jeans);
    --opacity: 1;
}
:host(i-log) [aria-type="opened"] {
    --bgColor: var(--color-slate-blue);
    --opacity: 1;
}
:host(i-log) [aria-type="closed"] {
    --bgColor: var(--color-ultra-red);
    --opacity: 1;
}
:host(i-log) [aria-type="error"] {
    --color: var(--color-white);
    --bgColor: var(--color-red);
    --opacity: 1;
}
:host(i-log) [aria-type="warning"] {
    --color: var(--color-white);
    --bgColor: var(--color-deep-saffron);
    --opacity: 1;
}
```
![image](https://user-images.githubusercontent.com/9526525/122788549-051e0b00-d2e9-11eb-89a4-b2129553fd72.png)
