// 3rd dependances
const bel = require('bel')
const csjs = require('csjs-inject')
// init
const head = require('head')()
const fullScreen = require('fullScreen')()
// modules
const message_maker = require('../src/node_modules/message-maker')
const logs = require('..')
const button = require('datdot-ui-button')

function demo () {
    const recipients = []
    let is_checked = false
    let is_selected = false
    const log_list = logs({mode: 'compact', expanded: 'false'}, protocol('logs'))
    const make = message_maker(`demo / demo.js`)
    const message = make({to: 'demo / demo.js', type: 'ready', refs: ['old_logs', 'new_logs']})
    recipients['logs'](message)
    recipients['logs'](make({to: '*', type: 'info', data: ["New user: poppy, {\"address\":\"5HQyG6vukenbLDPFBsnHkLHpX8rBaHyWi5WD8cy4uUvsSKnE\",\"noiseKey\":{\"type\":\"Buffer\",\"data\":[8,94,61,252,227,5,211,20,255,248,162,237,241,237,238,88,226,240,104,226,168,119,35,35,188,81,92,25,228,226,253,61]},\"signingKey\":{\"type\":\"Buffer\",\"data\":[172,229,161,118,201,45,60,40,217,146,238,23,93,212,161,31,176,194,119,44,139,186,111,39,203,198,158,184,154,206,131,29]},\"form\":{},\"idleStorage\":0,\"rating\":0,\"balance\":0,\"id\":46}"]  }))
    recipients['logs'](make({to: '*', type: 'extrinsic'}))
    recipients['logs'](make({to: '*', type: 'execute-extrinsic'}))
    recipients['logs'](make({to: '*', type: 'register'}))
    recipients['logs'](make({to: '*', type: 'current-block'}))
    recipients['logs'](make({to: '*', type: 'eventpool'}))
    recipients['logs'](make({to: '*', type: 'keep-alive'}))
    recipients['logs'](make({to: '*', type: 'user'}))
    recipients['logs'](make({to: '*', type: 'peer'}))
    recipients['logs'](make({to: '*', type: '@todo'}))
    recipients['logs'](make({to: '*', type: 'hoster'}))
    recipients['logs'](make({to: '*', type: 'encoder'}))
    recipients['logs'](make({to: '*', type: 'attestor'}))
    recipients['logs'](make({to: '*', type: 'chat', data: `[eve] says: {"feedkey":{"type":"Buffer","data":[76,160,52,198,102,163,249,71,227,149,111,218,4,197,117,167,124,176,47,176,225,53,187,139,207,121,189,202,71,102,84,184]},"topic":{"type":"Buffer","data":[94,32,85,249,12,183,242,125,62,191,244,253,212,164,127,243,199,182,126,35,11,188,176,86,240,42,193,107,71,92,16,193]}}`, refs: ["log1: janice, {\"address\":\"5Exp7NViUbfrRrFNPbH33F6GWXJZGwqzE3tyJucUfnLZza6F\",\"noiseKey\":{\"type\":\"Buffer\",\"data\":[246,154,158,32,110,242,75,85,125,75,44,97,87,97,125,84,16,91,223,24,142,49,35,89,3,195,18,50,242,76,232,172]},\"signingKey\":{\"type\":\"Buffer\",\"data\":[112,34,215,111,71,153,9,239,173,159,29,36,39,194,233,89,140,136,238,173,89,202,41,77,201,13,27,92,53,12,140,217]},\"form\":{},\"idleStorage\":0,\"rating\":0,\"balance\":0,\"id\":32}", "log2: two, {\"address\":\"5Gb39p9GLpL4MxkhqY3oBohva4nnF9FGu9NFSE9vom6jpujW\",\"noiseKey\":{\"type\":\"Buffer\",\"data\":[122,245,207,238,106,50,236,161,87,166,209,147,126,179,75,107,146,252,98,69,66,104,15,202,189,1,166,107,131,149,83,158]},\"signingKey\":{\"type\":\"Buffer\",\"data\":[134,88,213,147,241,23,157,79,167,171,44,123,117,117,173,115,80,29,7,100,174,216,180,56,30,125,45,152,195,9,61,182]},\"form\":{},\"idleStorage\":0,\"rating\":0,\"balance\":0,\"id\":38}"]}))
    recipients['logs'](make({to: '*', type: 'expanded'}))
    recipients['logs'](make({to: '*', type: 'collapsed'}))
    const click = button({name: 'click', body: 'Click', 
    theme: {
        props: { 
            border_radius: '0'
        }
    }}, protocol('click'))
    const open = button({name: 'open', body: 'Open', 
    theme: {
        props: { 
            border_radius: '0'
        }
    }}, protocol('open'))
    const close = button({name: 'close', body: 'Close', 
    theme: {
        props: { 
            border_radius: '0'
        }
    }}, protocol('close'))
    const error = button({name: 'error', body: 'Error', 
    theme: {
        props: { 
            border_radius: '0'
        }
    }}, protocol('error'))
    const warning = button({name: 'warning', body: 'Warning', 
    theme: {
        props: { 
            border_radius: '0'
        }
    }}, protocol('warning'))
    const select = button({name: 'select', role: 'button', body: 'Select', selected: is_selected, 
    theme: {
        props: { 
            border_radius: '0'
        }
    }}, protocol('select'))
    const toggle = button({name: 'toggle', role: 'switch', body: 'Toggle',
    theme: {
        props: { 
            border_radius: '0'
        }
    }}, protocol('toggle'))
            
    const container = bel`
    <div class="${css.container}">
        <div class="${css.actions}">${click}${open}${close}${error}${warning}${toggle}${select}</div>
    </div>`

    const app = bel`
    <div class="${css.wrap}" data-state="debug">
        ${container}${log_list}
    </div>`

    
    return app

    function click_event (target) {
        const make = message_maker(`${target} / button / PLAN / handle_click_event`)
        const message = make({type: 'click'})
        recipients['logs'](message)
        trigger_event(target)
    }
    function trigger_event(target) {
        const make = message_maker(`${target} / button / PLAN / handle_trigger_event`)
        const message = make({type: 'triggered'})
        recipients['logs'](message)
    }
    function open_event (target) {
        const make = message_maker(`${target} / button / PLAN / handle_open_event`)
        const message = make({type: 'opened'})
        recipients['logs'](message)
    }
    function close_event (target) {
        const make = message_maker(`${target} / button / USER / handle_error_event`)
        const message = make({type: 'closed'})
        recipients['logs'](message)
    }
    function error_event (target) {
        const make = message_maker(`${target} / button / USER / handle_error_event`)
        const message = make({type: 'error'})
        recipients['logs'](message)
    }
    function warning_event (target) {
        const make = message_maker(`${target} / button / PLAN / handle_warning_event`)
        const message = make({type: 'warning'})
        recipients['logs'](message)
    }
    function toggle_event(target) {
        is_checked = !is_checked
        const type = is_checked === true ? 'checked' : 'unchecked'
        toggle.ariaChecked = is_checked
        const make = message_maker(`${target} / button / JOBS / handle_toggle_event`)
        const message = make({type})
        recipients['logs'](message)
    }
    function selected_event (target) {
        is_selected = !is_selected
        const type = is_selected === true ? 'selected' : 'unselected'
        select.ariaSelected = is_selected
        const make = message_maker(`${target} / button / PLAN / handle_selected_event`)
        const message = make({type})
        recipients['logs'](message)
    }
    function change_layout_event () {
        const message = make({to: 'terminal', type: 'layout-mode', data: {mode: 'comfortable', expanded: 'false'}})
        recipients['logs'](message)
    }
    function handle_click (from) {
        const [target, type, flow] = from.split(" ").join("").split("/")
        if (target === 'click') return change_layout_event()
        if (target === 'select') return selected_event(target)
        if (target === 'open') return open_event(target)
        if (target === 'close') return close_event(target)
        if (target === 'error') return error_event(target)
        if (target === 'warning') return warning_event(target)
        if (type === 'button') return click_event(target)
        if (type === 'switch') return toggle_event(target)
    }
    function protocol (name) {
        return sender => {
            recipients[name] = sender
            return (msg) => {
                let {head, type, data, refs, meta} = msg
                // console.table( msg )
                // console.log( `type: ${type}, file: ${file}, line: ${line}`);
                if (type === 'click') return handle_click(head[0])
                recipients['logs'](msg)
            }
        }
    }
}

const css = csjs`
:root {
    --b: 0, 0%;
    --r: 100%, 50%;
    --color-white: var(--b), 100%;
    --color-black: var(--b), 0%;
    --color-dark: 223, 13%, 20%;
    --color-deep-black: 222, 18%, 11%;
    --color-red: 358, 99%, 53%;
    --color-amaranth-pink: 331, 86%, 78%;
    --color-persian-rose: 323, 100%, 56%;
    --color-orange: 35, 100%, 58%;
    --color-safety-orange: 27, 100%, 50%;
    --color-deep-saffron: 31, 100%, 56%;
    --color-ultra-red: 348, 96%, 71%;
    --color-flame: 15, 80%, 50%;
    --color-verdigris: 180, 54%, 43%;
    --color-blue: 214, var(--r);
    --color-heavy-blue: 233, var(--r);
    --color-maya-blue: 205, 96%, 72%;
    --color-slate-blue: 248, 56%, 59%;
    --color-blue-jeans: 204, 96%, 61%;
    --color-dodger-blue: 213, 90%, 59%;
    --color-viridian-green: 180, 100%, 63%;
    --color-green: 136, 81%, 34%;
    --color-light-green: 127, 86%, 77%;
    --color-lime-green: 127, 100%, 40%;
    --color-slimy-green: 108, 100%, 28%;
    --color-maximum-blue-green: 180, 54%, 51%;
    --color-green: 136, 81%, 34%;
    --color-light-green: 97, 86%, 77%;
    --color-lincoln-green: 97, 100%, 18%;
    --color-yellow: 44, 100%, 55%;
    --color-chrome-yellow: 39, var(--r);
    --color-bright-yellow-crayola: 35, 100%, 58%;
    --color-green-yellow-crayola: 51, 100%, 83%;
    --color-purple: 283, var(--r);
    --color-heliotrope: 288, 100%, 73%;
    --color-medium-purple: 269, 100%, 70%;
    --color-electric-violet: 276, 98%, 48%;
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
    --transparent: transparent;
    --define-font: *---------------------------------------------*;
    --size12: 1.2rem;
    --size14: 1.4rem;
    --size16: 1.6rem;
    --size18: 1.8rem;
    --size20: 2rem;
    --size22: 2.2rem;
    --size24: 2.4rem;
    --size26: 2.6rem;
    --size28: 2.8rem;
    --size30: 3rem;
    --size32: 3.2rem;
    --size36: 3.6rem;
    --size40: 4rem;
    --define-primary: *---------------------------------------------*;
    --primary-body-bg-color: var(--color-greyF2);
    --primary-color: var(--color-black);
    --primary-color-hover: var(--color-white);
    --primary-current-color: var(--color-white);
    --primary-bg-color: var(--color-white);
    --primary-bg-color-hover: var(--color-black);
    --primary-current-bg-color: var(--color-black);
    --primary-font: Arial, sens-serif;
    --primary-size: var(--size14);
    --primary-size-hover: var(--primary-size);
    --primary-current-size: var(--primary-size);
    --primary-border-width: 1px;
    --primary-border-style: solid;
    --primary-border-color: var(--color-black);
    --primary-radius: 8px;
    --primary-link-color: var(--color-heavy-blue);
    --primary-link-color-hover: var(--color-dodger-blue);
    --primary-disabled-color: var(--color-greyA2);
    --primary-disabled-bg-color: var(--color-greyEB);
    --primary-disabled-fill: var(--color-greyA2);
    --primary-selected-icon-fill: var(--primary-color);
    --primary-selected-icon-fill-hover: var(--primary-color-hover);
    --primary-current-icon-fill: var(--color-white);
}
* {
    box-sizing: border-box;
}
html {
    font-size: 62.5%;
    height: 100%;
}
body {
    -webkit-text-size-adjust:100%;
    font-size: var(--primary-font-size);
    font-family: var(--primary-font);
    background-color: hsl( var(--primary-bgColor) );
    margin: 0;
    padding: 0;
    height: 100%;
}
button {
    --color: var(--color-black);
    --bgColor: var(--color-white);
    padding: 8px 12px;
    border: none;
    border-radius: 8px;
    color: hsl( var(--color) );
    background-color: hsl( var(--bgColor) );
    transition: background-color .3s, color .3s ease-in-out;
    cursor: pointer;
}
button:hover {
    --color: var(--color-white);
    --bgColor: var(--color-dark);
}
.wrap {
    display: grid;
    height: 100%;
}
.container {
}
[data-state="debug"] {
    grid-template-rows: 40px 1fr;
    grid-template-columns: auto;
}
.actions {
    display: grid;
    grid-template-rows: auto;
    grid-template-columns: repeat(auto-fit, minmax(60px, auto));
    gap: 2px;
}
[data-state="debug"] i-log {
    height: 100%;
}
[aria-selected="true"] {
    color: hsl(var(--color-white));
    background-color: hsl(var(--primary-color));
}
`

document.body.append( demo() )