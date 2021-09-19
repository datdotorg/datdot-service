const bel = require('bel')
const csjs = require('csjs-inject')
const head = require('head')()
const icon = require('..')

// icons
const icon_check = icon({name: 'check', 
is_shadow: true,
theme: {
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
    props: {
        //  fill: 'var(--color-persian-rose)',
        // size: '8rem'
    }
}})
const icon_cross = icon({name: 'cross', is_shadow: true, theme: { props: { fill: 'var(--color-red)'}}})
const icon_minus = icon({name: 'minus', is_shadow: true, theme: { props: { fill: 'var(--color-yellow)'}}})
const iconPlus = icon({name: 'plus', is_shadow: true, theme: { props: { fill: 'var(--color-green)'}}})
const icon_up = icon({name: 'arrow-up', is_shadow: true, theme: { props: { fill: 'var(--color-purple)'}}})
const icon_down = icon({name: 'arrow-down', is_shadow: true, theme: { props: { fill: 'var(--color-purple)'}}})
const icon_left = icon({name: 'arrow-left', is_shadow: true, theme: { props: { fill: 'var(--color-purple)'}}})
const icon_right= icon({name: 'arrow-right', is_shadow: true, theme: { props: { fill: 'var(--color-purple)'}}})
const icon_play = icon({name: 'play', is_shadow: true, theme: { props: { fill: 'var(--color-orange)'}}})
const icon_pause = icon({name: 'pause', is_shadow: true, theme: { props: { fill: 'var(--color-orange)'}}})
const icon_stop = icon({name: 'stop', is_shadow: true, theme: { props: { fill: 'var(--color-orange)'}}})
const icon_option = icon({name: 'option', is_shadow: true, theme: { props: { fill: 'var(--color-black)'}}})
const icon_hide = icon({name: 'hide', is_shadow: true, theme: { props: { fill: 'var(--color-grey88)'}}})
const icon_show = icon({name: 'show', is_shadow: true, theme: { props: { fill: 'var(--color-blue)'}}})
const icon_transfer = icon({name: 'transfer', path: './svg'})
const icon_edit = icon({name: 'edit', is_shadow: true})
const icon_import = icon({name: 'import', is_shadow: true})
const icon_filter = icon({name: 'filter', is_shadow: true})
const icon_help = icon({name: 'help', is_shadow: true})
const icon_linechart = icon({name: 'linechart', is_shadow: true})
const icon_treemap = icon({name: 'treemap', is_shadow: true})
const icon_sort_up = icon({name: 'sort-up', is_shadow: true})
const icon_sort_down = icon({name: 'sort-down', is_shadow: true})
const icon_pin = icon({name: 'pin', is_shadow: true})
const iconList = icon({name: 'list', is_shadow: true})
const icon_remove = icon({name: 'remove', is_shadow: true})
const icon_trash = icon({name: 'trash', is_shadow: true})
const icon_search = icon({name: 'search', is_shadow: true})
const icon_activity = icon({name: 'activity', is_shadow: true})
const icon_action = icon({name: 'action', is_shadow: true})
const icon_plan_list = icon({name: 'plan-list', is_shadow: true})
// sub-step
const icon_step_confirm = icon({name: 'step-confirm', is_shadow: true, theme: { props: { size: '30px' }} })
const icon_step_cancel = icon({name: 'step-cancel', is_shadow: true, theme: { props: { size: '30px' }} })
// transfer event
const icon_event_transfer = icon({name: 'event-transfer', is_shadow: true, theme: { props: { size: '40px' }} })
const icon_event_pending = icon({name: 'event-pending', is_shadow: true, theme: { props: { size: '40px' }} })
const icon_event_cancel = icon({name: 'event-cancel', is_shadow: true, theme: { props: { size: '40px' }} })
const icon_event_to = icon({name: 'event-to', is_shadow: true, theme: { props: { size: '40px' }} })
// notify
const icon_warning = icon({name: 'warning', is_shadow: true, theme: { props: { size: '40px' }}})
const icon_notice = icon({name: 'notice', is_shadow: true, theme: { props: { size: '40px' }}})

function demo () {
    const app = bel`
    <div class=${css.app}>
        <section>
            <h2>Action bar</h2>
            <aside>
                <span>${icon_activity} activity</span>
                <span>${icon_plan_list} plan-list</span>
                <span>${icon_linechart} linechart</span>
                <span>${icon_treemap} treemap</span>
                <span>${icon_search} search</span>
                <span>${icon_sort_up} sort-up</span>
                <span>${icon_sort_down} sort-down</span>
                <span>${icon_filter} filter</span>
                <span>${icon_action} trash</span>
                <span>${icon_help} filter</span>
                <span>${iconList} list</span>
            </aside>
        </section>
        <section>
        <h2>Plan action</h2>
            <aside>
                <span>${icon_play} play</span>
                <span>${icon_pause} pause</span>
                <span>${icon_stop} stop</span>
            </aside>
        </section>
        <section>
            <h2>Actions</h2>
            <aside>
                <span>${icon_check} check</span>
                <span>${icon_cross} cross</span>
                <span>${icon_minus} minus</span>
                <span>${iconPlus} plus</span>
                <span>${icon_option} option</span>
                <span>${icon_edit} edit</span>
                <span>${icon_import} import</span>
                <span>${icon_pin} pin</span>
                <span>${icon_remove} remove</span>
                <span>${icon_trash} trash</span>
            </aside>
        </section>
        <section>
            <h2>Sub step</h2>
            <aside>
                <span>${icon_step_confirm} step-confirm</span>
                <span>${icon_step_cancel} step-cancel</span>
            </aside>
        </section>
        <section>
            <h2>Show password</h2>
            <aside>
                <span>${icon_show} show</span>
                <span>${icon_hide} hide</span>
            </aside>
        </section>  
        <section>
            <h2>Activity event</h2>
            <aside>
                <span>${icon_event_transfer} event-transfer</span>
                <span>${icon_event_pending} event-pending</span>
                <span>${icon_event_cancel} event-cancel</span>
                <span>${icon_event_to} event-to</span>
            </aside>
        </section>
        <section>
            <h2>Arrow</h2>
            <aside>
                <span>${icon_up} up</span>
                <span>${icon_down} down</span>
                <span>${icon_left} left</span>
                <span>${icon_right} right</span>
            </aside>
        </section>
        <section>
            <h2>Notify</h2>
            <aside>
                <span>${icon_warning} warning</span>
                <span>${icon_notice} notice</span>
            </aside>
        </section>
        <section>
            <h2>Button</h2>
            <aside>
                <button>${icon_transfer}</button>
            </aside>
        </section>
    </div>`
    return app
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
    --color-green: 136, 81%, 34%;
    --transparent: transparent;
    --define-primary: *---------------------------------------------*;
    --primary-color: var(--color-black);
    --primary-bgColor: var(--color-greyF2);
    --primary-font: Arial, sens-serif;
    --primary-font-size: var(--size16);
}
.app {}
aside {
    display: flex;
    white-space: nowrap;
}
span {
    margin-right: 15px;
    text-align: center;
}
span i-icon {
    padding-bottom: 12px;
}
button {
    padding: 6px 12px;
    border: 1px solid hsl(var(--color-black));
    border-radius: 6px;
    background-color: hsl(var(--color-white));
    cursor: pointer;
    transition: border-color .4s ease-in-out;
}
button span {
    margin-right: 0;
}
button svg g {
    fill: hsl(var(--color-black));
    transition: fill .4s ease-in-out;
}
button:hover {
    border-color: hsl(var(--color-flame));
}
button:hover svg g {
    fill: hsl(var(--color-flame));
}
`

document.body.append(demo())