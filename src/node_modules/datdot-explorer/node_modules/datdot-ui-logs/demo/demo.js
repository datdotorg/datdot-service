const bel = require('bel')
const csjs = require('csjs-inject')
const message_maker = require('../src/node_modules/message_maker')
const logs = require('..')
const head = require('head')()

function demo () {
    const recipients = []
    let is_checked = false
    let is_selected = false
    const logList = logs(protocol('logs'))
    const make = message_maker(`i_log / demo / demo.js`)
    const message = make({to: 'demo / demo.js', type: 'ready', refs: ['old_logs', 'new_logs']})
    recipients['logs'](message)
    const toggle = bel`<button class="btn" role="switch" aria-label="Toggle" aria-checked="${is_checked}" onclick=${() => handle_toggle_event('toggle') }>Toggle</button>`
    const select = bel`<button class="btn" role="button" aria-label="Select" aria-selected="${is_selected}" onclick=${() => handle_selected_event('select') }>Select</button>`
            
    const container = bel`
    <div class="${css.container}">
        <h1>Logs event</h1>
        <div class="${css.actions}">
            <button class="btn" role="button" aria-label="Click" onclick=${() => handle_click_event('click') }>Click</button>
            <button class="btn" role="button" aria-label="Open" onclick=${() => handle_open_event('open') }>Open</button>
            <button class="btn" role="button" aria-label="Close" onclick=${() => handle_close_event('close') }>Close</button>
            <button class="btn" role="button" aria-label="Error" onclick=${() => handle_error_event('error') }>Error</button>
            <button class="btn" role="button" aria-label="Warning" onclick=${() => handle_warning_event('warning') }>Warning</button>
            ${toggle}${select}
        </div>
    </div>`

    const app = bel`
    <div class="${css.wrap}" data-state="debug">
        ${container}${logList}
    </div>`

    return app

    function handle_click_event (target) {
        const make = message_maker(`${target} / button / PLAN / handle_click_event`)
        const message = make({type: 'click'})
        // recipients['logs']({page: 'JOBS', from: target, flow: 'button', type: 'click', fn: 'handle_click_event', line: 36})
        recipients['logs'](message)
        handle_trigger_event(target)
    }
    function handle_trigger_event(target) {
        const make = message_maker(`${target} / button / PLAN / handle_trigger_event`)
        const message = make({type: 'triggered'})
        // recipients['logs']({page: 'Demo', from: target, flow: 'button', type: 'triggered', fn: 'handle_trigger_event', line: 40})
        recipients['logs'](message)
    }
    function handle_open_event (target) {
        const make = message_maker(`${target} / button / PLAN / handle_open_event`)
        const message = make({type: 'opened'})
        // recipients['logs']({page: 'PLAN', from: target, flow: 'modal/button', type: 'opened', fn: 'handle_open_event', line: 43})
        recipients['logs'](message)
    }
    function handle_close_event (target) {
        const make = message_maker(`${target} / button / USER / handle_error_event`)
        const message = make({type: 'closed'})
        // recipients['logs']({page: 'PLAN', from: target, flow: 'modal/button', type: 'closed', fn: 'handle_close_event', line: 46})
        recipients['logs'](message)
    }
    function handle_error_event (target) {
        const make = message_maker(`${target} / button / USER / handle_error_event`)
        const message = make({type: 'error'})
        // recipients['logs']({page: 'USER', from: target, flow: 'transfer', type: 'error', fn: 'handle_error_event', line: 49})
        recipients['logs'](message)
    }
    function handle_warning_event (target) {
        const make = message_maker(`${target} / button / PLAN / handle_warning_event`)
        const message = make({type: 'warning'})
        // recipients['logs']({page: 'PLAN ', from: target, flow: 'plan', type: 'warning', fn: 'handle_error_event', line: 52})
        recipients['logs'](message)
    }
    function handle_toggle_event(target) {
        is_checked = !is_checked
        const type = is_checked === true ? 'checked' : 'unchecked'
        toggle.ariaChecked = is_checked
        const make = message_maker(`button / JOBS / handle_toggle_event`)
        const message = make({type})
        // recipients['logs']({page: 'JOBS', from: target, flow: 'switch/button', type, fn: 'handle_toggle_event', line: 58})
        recipients['logs'](message)
    }
    function handle_selected_event (target) {
        is_selected = !is_selected
        const type = is_selected === true ? 'selected' : 'unselected'
        select.ariaSelected = is_selected
        const make = message_maker(`button / PLAN / handle_selected_event`)
        const message = make({type})
        // recipients['logs']({page: 'PLAN', from: target, flow: 'date/button', type, fn: 'handle_selected_event', line: 64})
        recipients['logs'](message)
    }
    function protocol (name) {
        return sender => {
            recipients[name] = sender
            return (msg) => {
                const {page, from, flow, type, body} = msg
                console.log( msg )
                // console.log( `type: ${type}, file: ${file}, line: ${line}`);
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
    --color-blue: 214, var(--r);
    --color-red: 358, 99%, 53%;
    --color-amaranth-pink: 331, 86%, 78%;
    --color-persian-rose: 323, 100%, 56%;
    --color-orange: 35, 100%, 58%;
    --color-deep-saffron: 31, 100%, 56%;
    --color-ultra-red: 348, 96%, 71%;
    --color-flame: 15, 80%, 50%;
    --color-verdigris: 180, 54%, 43%;
    --color-maya-blue: 205, 96%, 72%;
    --color-slate-blue: 248, 56%, 59%;
    --color-blue-jeans: 204, 96%, 61%;
    --color-dodger-blue: 213, 90%, 59%;
    --color-light-green: 127, 86%, 77%;
    --color-lime-green: 127, 100%, 40%;
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
    --primary-color: var(--color-black);
    --primary-bgColor: var(--color-greyF2);
    --primary-font: Arial, sens-serif;
    --primary-font-size: var(--size16);
}
* {
    box-sizing: border-box;
}
html {
    font-size: 62.5%;
    height: 100%;
}
body {
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
    padding: 0 20px 20px;
}
[data-state="debug"] {
    grid-template-rows: auto;
    grid-template-columns: 60% auto;
}
.actions {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(60px, auto));
    gap: 15px;
}
[data-state="debug"] i-log {
    position: fixed;
    top: 0;
    right: 0;
    width: 40%;
    height: 100%;
}
[role="switch"][aria-checked="true"], [role="button"][aria-selected="true"] {
    --color: var(--color-white);
    --bgColor: var(--color-black);
}
@media (max-width: 960px) {
    [data-state="debug"] {
        grid-template-rows: 50% 50%;
        grid-template-columns: auto;
    }
    [data-state="debug"] i-log {
        position: inherit;
        width: 100%;
    }
}
`

document.body.append( demo() )