# datdot-ui-icon
Support to load `SVG` icon

![image](https://user-images.githubusercontent.com/9526525/123254804-b14a3680-d521-11eb-9c89-c15e59ec1684.png)
## Import
```js
const Icon = require('datdot-ui-icon')
```

## Options
- `name` is SVG name, 
     for example: `arrow-left.svg` in `src/svg`, then `name` in options that you can write `name: 'arrow-left'`
- `src/svg` is `path` by default,
    for example: if path id not in same as `src/svg`,  the path is under URL as SVG path like `http://datdot.org` or `assets/img`, then `path` in options that you can write `path: 'http://datdot.org'` or `path: 'assets/img'` to change the default defined path
- `theme` is an Object that can choose one `style` or `props` to custom or change the default defined styles.

```js
const icon_name = Icon({
    name, 
    path, 
    theme: { 
         style, 
         props: {
             fill,
             size
         }
   }
})
```

### In `demo.js`
```js
const Icon = require('datdot-ui-icon')

const iconCheck = Icon({
name: 'check', 
theme: {
   // custom css style, replace original styles
    style: `
    :host(i-icon) span {
        padding: 4px;
        background-color: hsl(var(--color-greyF2));
    }
    :host(i-icon) svg g { 
        --fill: var(--color-amaranth-pink);
        stroke-width: 1;
        stroke: hsl(var(--color-amaranth-pink));
    };
    ` ,
   // replace original css variables 
    props: {
        fill: 'var(--color-persian-rose)',
        size: '8rem'
    }
}})
```

### In `index.js`
```js
:host(i-icon) span {
     --size: ${size ? size : '20px'};
....
}
:host(i-icon) svg g {
     --fill: ${fill ? fill : 'var(--primary-color)'};
...
}
```
