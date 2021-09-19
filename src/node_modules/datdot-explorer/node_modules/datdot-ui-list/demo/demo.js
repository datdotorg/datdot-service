const head = require('head')()
const bel = require('bel')
const csjs = require('csjs-inject')
const message_maker = require('../src/node_modules/message-maker')

// datdot-ui dependences
const list = require('..')
const terminal = require('datdot-terminal')
const {i_button} = require('datdot-ui-button')
const button = i_button

function demo () {
    const recipients = []
    const logs = terminal({mode: 'comfortable'}, protocol('logs'))
    const make = message_maker('demo / demo.js')
    const options1 = [
        {
            text: 'Roobot',
            // icon: {align: 'icon-right'},
            cover: 'data:image/png;base64,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',
            disabled: true,
            theme: {
                props: {
                    option_avatar_width: '50%'
                }
            }
        },
        {
            text: 'Marine',
            // icon: {align: 'icon-right'},
            cover: 'data:image/png;base64,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',
            list: {name: 'star'},
            theme: {
                props: {
                    option_avatar_width: '50%'
                }
            }
        },
        {
            text: 'Server',
            // icon: {name: 'plus', align: 'icon-right'},
            list: {name: 'plus'},
            icon: {name: 'edit'},
            cover: 'data:image/png;base64,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',
            current: true,
            selected: true,
            // can define each icon size by indiviual
            theme: {
                props: {
                    // icon_size: '75px',
                    // list_selected_icon_size: '50px',
                    current_list_selected_icon_size: '30px',
                    current_list_selected_icon_fill: 'var(--color-blue)',
                    avatar_width: '2000px',
                    current_icon_size: '30px',
                    current_icon_fill: 'var(--color-light-green)',
                    current_size: '50px',
                    current_color: 'var(--color-light-green)',
                    current_weight: 'var(--weight800)'
                }
            }
        }
    ]
    const options2 = [
        {
            text: `Landscape1`,
            icon: {name: 'star'},
            // list: {name: 'plus'},
            cover: 'https://cdn.pixabay.com/photo/2015/04/23/22/00/tree-736885_960_720.jpg',
            selected: true,
            theme: {
                props: {
                    // inside icon
                    // icon_size: '36px',
                    // icon_size_hover: '16px',
                    icon_fill: 'var(--color-chrome-yellow)',
                    icon_fill_hover: 'var(--color-light-green)',
                    // list icon
                    selected_icon_fill: 'var(--color-flame)',
                    selected_icon_fill_hover: 'var(--color-yellow)',
                    size: 'var(--size30)',
                    // size_hover: 'var(--size30)',
                    avatar_width: '1200px'
                }
            }
        },
        {
            text: 'Landscape2',
            icon: {name: 'edit'},
            cover: 'https://cdn.pixabay.com/photo/2016/02/27/06/43/cherry-blossom-tree-1225186_960_720.jpg',
            selected: true,
            disabled: true,
            theme: {
                props: {
                    avatar_width: '100%'
                }
            }
        },
        {
            text: 'Landscape3',
            icon: {name: 'activity'},
            // list: {name: 'plus'},
            cover: 'https://cdn.pixabay.com/photo/2015/06/19/20/13/sunset-815270__340.jpg',
            selected: true,
            theme: {
                props: {
                    avatar_width: '100%'
                }
            }
        }
    ]
    const options3 = [
        {
            text: 'DatDot1',
            role: 'link',
            url: 'https://datdot.org/',
            target: '_blank',
            icon: {name: 'star'},
            cover: 'https://raw.githubusercontent.com/playproject-io/datdot/master/packages/datdot/logo-datdot.png',
            theme: {
                props: {
                    avatar_width: '24px',
                    avatar_radius: '50%'
                }
            }
        },
        {
            text: 'Twitter',
            role: 'link',
            url: 'https://twitter.com/',
            icon: {name: 'icon-svg.168b89d5', path: 'https://abs.twimg.com/responsive-web/client-web'},
            // disabled: true,
            target: '_new',
            theme: {
                props: {
                    color: 'var(--color-blue)',
                    icon_fill: 'var(--color-blue)',
                    icon_size: '26px',
                }
            }
        },
        {
            text: 'GitHub',
            role: 'link',
            url: 'https://github.com/',
            icon: {name: 'star'},
            cover: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png',
            target: '_new',
            theme: {
                props: {
                    avatar_width: '26px',
                    avatar_radius: '50%'
                }
            }
        },
        {
            text: 'DatDot app',
            // default is menuitem
            role: 'menuitem',
            icon: {name: 'datdot-black'},
            // disabled: true,
            theme: {
                props: {
                    color: 'var(--color-purple)',
                    icon_fill: 'var(--color-purple)'
                }
            }
        }
    ]
    const terminal_list = list(
    {
        name: 'terminal-select-list',
        body: [
            {
                text: 'Compact messages',
            },
            {
                text: 'Comfortable messages',
                current: true
            }
        ],
        mode: 'single-select',
        hidden: false,
        theme: {
            grid: {
                button: {
                    auto: {
                        auto_flow: 'column'
                    },
                    justify: 'content-left',
                    gap: '5px'
                }
            }
        }
    }, protocol('terminal-select-list'))
    const single_select_list = list(
    {
        name: 'single-select-list', 
        body: options1, 
        mode: 'single-select', 
        hidden: false,
        theme: {
            grid: {
                list: {
                },
                button: {
                    areas: 'option icon',
                    // first step for responsive
                    columns: 'minmax(0, 100%) 1fr',
                    // 50% 50%
                    // columns: 'minmax(0, 1fr) 1fr',
                    align: 'items-center'
                },
                option: {
                    // rows: 'repeat(auto-fill, minmax(100px, 1fr))',
                    // responsive for large image
                    // second step for responsive
                    columns: 'repeat(auto-fill, minmax(0, auto))',
                    area: 'option',
                    // areas: ['option-text option-icon', 'option-avatar option-avatar'],
                    justify: 'content-left',
                    align: 'items-center',
                },
                icon: {
                    area: 'icon',
                    justify: 'self-right'
                },
                option_icon: {
                    // area: 'option-icon',
                    row: '2',
                    column: 'col-3'
                },
                option_text: {
                    // area: 'option-text',
                    row: '2',
                    column: '1 / span 2',
                    justify: 'self-center'
                },
                option_avatar: {
                    // area: 'option-avatar',
                    row: '1',
                    column: 'span 2',
                    justify: 'self-center'
                }
            }
        }
    }, protocol('single-select-list'))
    const multiple_select_list = list(
    {
        name: 'multiple-select-list', 
        body: options2, 
        hidden: false,
        theme: {
            grid: {
                button: {
                    // rows: 'repeat(auto-fill, minmax(100px, 1fr))',
                    // columns: 'auto repeat(auto-fill, minmax(0, 100%))',
                    auto: {
                        auto_flow: 'column'
                    },
                    align: 'items-center',
                    justify: 'content-left',
                    gap: '20px'
                },
                option: {
                    // content auto stretch
                    columns: 'repeat(auto-fill, minmax(0, 100%))',
                    // columns: 'repeat(auto-fill, 1fr)',
                    auto: {
                        auto_flow: 'column'
                    },
                    align: 'items-center',
                    justify: 'content-center',
                    gap: '20px'
                },
                icon: {
                },
                option_icon: {
                    column: '3'
                },
                option_text: {
                    column: '2'
                }
            }
        }
    }, protocol('multiple-select-list'))
    const dropdown_list = list(
    {
        name: 'dropdown-list',
        body: options3,
        mode: 'dropdown',
        hidden: false,
        theme: {
            grid: {
                link: {
                    justify: 'content-left',
                    align: 'items-center',
                    auto: {
                        auto_flow: 'column'
                    },
                    gap: '5px'
                },
                button: {
                    auto: {
                        auto_flow: 'column'
                    },
                    gap: '5px',
                    justify: 'content-left'
                },
                // icon: {
                //     column: '1'
                // },
                // text: {
                //     column: '3'
                // },
                // avatar: {
                //     column: '2'
                // }
            }
        }
    }, protocol('dropdown-list'))
    const expanded = button(
    {
        name: 'expanded', 
        body: 'Expanded', 
        role: 'switch',
        theme: {
            props: {
                width: '120px',
            }
        }
    }, protocol('expanded'))
    const current_single_selected = options1.filter( option => option.selected).map( ({text, icon, current, selected}) => text).join('')
    const current_multiple_selected = options2.filter( option => option.selected)
    const selected_length = bel`<span class="${css.count}">${current_multiple_selected.length}</span>`
    let select_items = bel`<span>${selected_length} ${current_multiple_selected.length > 1 ? `items` : `item`}</span>`
    const total_selected = bel`<span class="${css.total}">Total selected:</span>`
    total_selected.append(select_items)
    const select = bel`<span class="${css.select}">${current_single_selected}</span>`
    const select_result = bel`<div class="${css.result}">Current selected ${select}</div>`
    let selects = current_multiple_selected.map( option => bel`<span class=${css.badge}>${option.text}</span>`)
    let selects_result = bel`<div class="${css['selects-result']}"></div>`
    selects.map( select => selects_result.append(select))
    const content = bel`
    <div class="${css.content}">
        <h1>List</h1>
        <section>
            <h2>Single select</h2>
            ${select_result}
            ${single_select_list}
        </section>
        <section>
            <h2>Terminal messages selector</h2>
            ${expanded}
            ${terminal_list}
        </section>
        <section>
            <h2>Multple select</h2>
            <div>
                ${total_selected}
                ${selects_result}
            </div>
            ${multiple_select_list}
        </section>
        
        <section>
            <h2>Dropdown</h2>
            ${dropdown_list}
        </section>
    </div>`
    const container = bel`<div class="${css.container}">${content}</div>`
    const app = bel`<div class="${css.wrap}" data-state="debug">${container}${logs}</div>`

    return app

    function terminal_change_event (selected) {
        const mode = selected.split(' ')[0]
        recipients['logs'](make({type: 'layout-mode', data: {mode}}))
    }

    function change_event (data) {
        const {mode, selected} = data
        if (mode === 'single-select') {
            selected.forEach( item => {
                if (item.current && item.text.match(/Compact|Comfortable/)) return terminal_change_event(item.text.toLowerCase())
                if (item.current) return select.textContent = item.text 
            })
        }
        if (mode === 'multiple-select') {
            const items = selected.filter( item => item.selected)
            const total = items.length
            const selected_length = bel`<span class="${css.count}">${total}</span>`
            select_items = bel`<span>${selected_length} ${selected.length > 1 ? `items` : `item`}</span>`
            selects = items.map( item => bel`<span class=${css.badge}>${item.text}</span>`)
            selects_result.innerHTML = ''
            selects.map( element => selects_result.append(element))
            total_selected.lastChild.remove()
            total_selected.append(select_items)
        }
    }
    function switch_event (from, data) {
        const state = !data
        recipients[from](make({type: 'switched', data: state}))
        recipients['logs']( make({to: from, type: 'triggered', data: {checked: state}}) )
        recipients['logs'](make({to: 'logs', type: 'layout-mode', data: {expanded: state}}))
    }
    function protocol (name) {
        return send => {
            recipients[name] = send
            return get
        }
    }
    function click_event (from, role, data) {
        if (role === 'switch') return switch_event(from, data)
        if (role === 'menuitem') return recipients['logs'](make({to: '*', type: 'triggered', data: {app: 'datdot', install: true}}))
    }
    function get (msg) {
        const {head, type, data} = msg
        const from = head[0].split('/')[0].trim()
        const role = head[0].split(' / ')[1]
        recipients['logs'](msg)
        if (type === 'click') return click_event (from, role, data)
        if (type.match(/selected/)) return change_event(data)
    }
}

const css = csjs`
:root {
    /* define colors ---------------------------------------------*/
    --b: 0, 0%;
    --r: 100%, 50%;
    --color-white: var(--b), 100%;
    --color-black: var(--b), 0%;
    --color-dark: 223, 13%, 20%;
    --color-deep-black: 222, 18%, 11%;
    --color-red: 358, 99%, 53%;
    --color-amaranth-pink: 329, 100%, 65%;
    --color-persian-rose: 323, 100%, 50%;
    --color-orange: 32, var(--r);
    --color-light-orange: 36, 100%, 55%;
    --color-safety-orange: 27, 100%, 50%;
    --color-deep-saffron: 31, 100%, 56%;
    --color-ultra-red: 348, 96%, 71%;
    --color-flame: 15, 80%, 50%;
    --color-verdigris: 180, 54%, 43%;
    --color-viridian-green: 180, 100%, 63%;
    --color-blue: 214, 100%, 49%;
    --color-heavy-blue: 233, var(--r);
    --color-maya-blue: 205, 96%, 72%;
    --color-slate-blue: 248, 56%, 59%;
    --color-blue-jeans: 204, 96%, 61%;
    --color-dodger-blue: 213, 90%, 59%;
    --color-light-green: 97, 86%, 77%;
    --color-lime-green: 127, 100%, 40%;
    --color-slimy-green: 108, 100%, 28%;
    --color-maximum-blue-green: 180, 54%, 51%;
    --color-deep-green: 136, 79%, 22%;
    --color-green: 136, 82%, 38%;
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
    /* define font ---------------------------------------------*/
    --snippet-font: Segoe UI Mono, Monospace, Cascadia Mono, Courier New, ui-monospace, Liberation Mono, Menlo, Monaco, Consolas;
    --size12: 1.2rem;
    --size13: 1.3rem;
    --size14: 1.4rem;
    --size15: 1.5rem;
    --size16: 1.6rem;
    --size18: 1.8rem;
    --size20: 2rem;
    --size22: 2.2rem;
    --size24: 2.4rem;
    --size26: 2.6rem;
    --size28: 2.8rem;
    --size30: 3rem;
    --size32: 3.2rem;
    --size34: 3.4rem;
    --size36: 3.6rem;
    --size38: 3.8rem;
    --size40: 4rem;
    --size42: 4.2rem;
    --size44: 4.4rem;
    --size46: 4.6rem;
    --size48: 4.8rem;
    --size50: 5rem;
    --size52: 5.2rem;
    --size54: 5.4rem;
    --size56: 5.6rem;
    --size58: 5.8rem;
    --size60: 6rem;
    --weight100: 100;
    --weight300: 300;
    --weight400: 400;
    --weight600: 600;
    --weight800: 800;
    /* define primary ---------------------------------------------*/
    --primary-body-bg-color: var(--color-greyF2);
    --primary-font: Arial, sens-serif;
    --primary-size: var(--size14);
    --primary-size-hover: var(--primary-size);
    --primary-weight: 300;
    --primary-weight-hover: 300;
    --primary-color: var(--color-black);
    --primary-color-hover: var(--color-white);
    --primary-bg-color: var(--color-white);
    --primary-bg-color-hover: var(--color-black);
    --primary-border-width: 1px;
    --primary-border-style: solid;
    --primary-border-color: var(--color-black);
    --primary-border-opacity: 1;
    --primary-radius: 8px;
    --primary-avatar-width: 100%;
    --primary-avatar-height: auto;
    --primary-avatar-radius: 0;
    --primary-disabled-size: var(--primary-size);
    --primary-disabled-color: var(--color-greyA2);
    --primary-disabled-bg-color: var(--color-greyEB);
    --primary-disabled-icon-size: var(--primary-icon-size);
    --primary-disabled-icon-fill: var(--color-greyA2);
    --primary-listbox-option-icon-size: 20px;
    --primary-listbox-option-avatar-width: 40px;
    --primary-listbox-option-avatar-height: auto;
    --primary-listbox-option-avatar-radius: var(--primary-avatar-radius);
    --primary-option-avatar-width: 30px;
    --primary-option-avatar-height: auto;
    --primary-list-avatar-width: 30px;
    --primary-list-avatar-height: auto;
    --primary-list-avatar-radius: var(--primary-avatar-radius);
    /* define icon settings ---------------------------------------------*/
    --primary-icon-size: var(--size16);
    --primary-icon-size-hover: var(--size16);
    --primary-icon-fill: var(--primary-color);
    --primary-icon-fill-hover: var(--primary-color-hover);
    /* define current ---------------------------------------------*/
    --current-size: var(--primary-size);
    --current-weight: var(--primary-weight);
    --current-color: var(--color-white);
    --current-bg-color: var(--color-black);
    --current-icon-size: var(--primary-icon-size);
    --current-icon-fill: var(--color-white);
    --current-list-selected-icon-size: var(--list-selected-icon-size);
    --current-list-selected-icon-fill: var(--color-white);
    --current-list-selected-icon-fill-hover: var(--color-white);
    --current-list-size: var(--current-size);
    --current-list-color: var(--current-color);
    --current-list-bg-color: var(--current-bg-color);
    --current-list-avatar-width: var(--primary-list-avatar-width);
    --current-list-avatar-height: var(--primary-list-avatar-height);
    /* role listbox settings ---------------------------------------------*/
    /*-- collapsed --*/
    --listbox-collapsed-bg-color: var(--primary-bg-color);
    --listbox-collapsed-bg-color-hover: var(--primary-bg-color-hover);
    --listbox-collapsed-icon-size: var(--size20);
    --listbox-collapsed-icon-size-hover: var(--size20);
    --listbox-collapsed-icon-fill: var(--primary-icon-fill);
    --listbox-collapsed-icon-fill-hover: var(--primary-icon-fill-hover);
    --listbox-collapsed-listbox-size: var(--primary-size);
    --listbox-collapsed-listbox-size-hover: var(--primary-size-hover);
    --listbox-collapsed-listbox-weight: var(--primary-weight);
    --listbox-collapsed-listbox-weight-hover: var(--primary-weight);
    --listbox-collapsed-listbox-color: var(--primary-color);
    --listbox-collapsed-listbox-color-hover: var(--primary-color-hover);
    --listbox-collapsed-listbox-avatar-width: var(--primary-listbox-option-avatar-width);
    --listbox-collapsed-listbox-avatar-height: var(--primary-listbox-option-avatar-height);
    --listbox-collapsed-listbox-icon-size: var(--primary-listbox-option-icon-size);
    --listbox-collapsed-listbox-icon-size-hover: var(--primary-listbox-option-icon-size);
    --listbox-collapsed-listbox-icon-fill: var(--color-blue);
    --listbox-collapsed-listbox-icon-fill-hover: var(--color-yellow);
    /*-- expanded ---*/
    --listbox-expanded-bg-color: var(--current-bg-color);
    --listbox-expanded-icon-size: var(--size20);
    --listbox-expanded-icon-size-hover: var(--size20);
    --listbox-expanded-icon-fill: var(--color-light-green);
    --listbox-expanded-listbox-size: var(--size20);
    --listbox-expanded-listbox-weight: var(--primary-weight);
    --listbox-expanded-listbox-color: var(--current-color);
    --listbox-expanded-listbox-avatar-width: var(--primary-listbox-option-avatar-width);
    --listbox-expanded-listbox-avatar-height: var(--primary-listbox-option-avatar-height);
    --listbox-expanded-listbox-icon-size: var(--primary-listbox-option-icon-size);
    --listbox-expanded-listbox-icon-fill: var(--color-light-green);
    /* role option settings ---------------------------------------------*/
    --list-bg-color: var(--primary-bg-color);
    --list-bg-color-hover: var(--primary-bg-color-hover);
    --list-selected-icon-size: var(--size16);
    --list-selected-icon-size-hover: var(--list-selected-icon-size);
    --list-selected-icon-fill: var(--primary-icon-fill);
    --list-selected-icon-fill-hover: var(--primary-icon-fill-hover);
    /* role link settings ---------------------------------------------*/
    --link-size: var(--size14);
    --link-size-hover: var(--primary-link-size);
    --link-color: var(--color-heavy-blue);
    --link-color-hover: var(--color-dodger-blue);
    --link-bg-color: transparent;
    --link-icon-size: var(--size30);
    --link-icon-fill: var(--primary-link-color);
    --link-icon-fill-hover: var(--primary-link-color-hover);
    --link-avatar-width: 24px;
    --link-avatar-width-hover: var(--link-avatar-width);
    --link-avatar-height: auto;
    --link-avatar-height-hover: var(--link-avatar-height);
    --link-avatar-radius: 0;
    --link-disabled-size: var(--primary-link-size);
    --link-disabled-color: var(--color-greyA2);
    --link-disabled-bg-color: transparent;
    --link-disabled-icon-fill: var(--color-greyA2);
    /* role menuitem settings ---------------------------------------------*/
    --menu-size: var(--size15);
    --menu-size-hover: var(--menu-size);
    --menu-weight: var(--primary-weight);
    --menu-weigh-hover: var(--primary-weight);
    --menu-color: var(--primary-color);
    --menu-color-hover: var(--color-grey88);
    --menu-icon-size: 20px;
    --menu-icon-size-hover: var(--menu-icon-size);
    --menu-icon-fill: var(--primary-color);
    --menu-icon-fill-hover: var(--color-grey88);
    --menu-avatar-width: 50px;
    --menu-avatar-width-hover: var(--menu-avatar-width);
    --menu-avatar-height: auto;
    --menu-avatar-height-hover: var(--menu-avatar-height);
    --menu-avatar-radius: 0;
    --menu-disabled-color: var(--primary-disabled-color);
    --menu-disabled-size: var(--menu-size);
    --menu-disabled-weight: var(--primary-weight);
}
html {
    font-size: 62.5%;
    height: 100%;
}
*, *:before, *:after {
    box-sizing: border-box;
}
body {
    -webkit-text-size-adjust: 100%;
    margin: 0;
    padding: 0;
    font-size: calc(var(--primary-size) + 2px);
    font-family: var(--primary-font);
    color: var(--primary-color);
    background-color: hsl( var(--primary-body-bg-color) );
    height: 100%;
    overflow: hidden;
}
h1 {
    font-size: var(--size28);
}
h2 {
    font-size: var(--size20);
}
.wrap {
    display: grid;
}
.content {}
.text, .icon {
    display: flex;
}
.text i-button {
    margin-right: 10px;
}
.icon i-button {
    margin-right: 10px;
}
[data-state="view"] {
    height: 100%;
}
[data-state="view"] i-log {
    display: none;
}
[data-state="debug"] {
    grid-template-rows: auto;
    grid-template-columns: 62% auto;
    height: 100%;
}
[data-state="debug"] i-log {
    position: fixed;
    top: 0;
    right: 0;
    width: 40%;
    height: 100%;
}
.container {
    display: grid;
    grid-template-rows: min-content;
    grid-template-columns: 90%;
    justify-content: center;
    align-items: start;
    background-color: var(--color-white);
    height: 100%;
    overflow: hidden auto;
}
.result {
    font-size: var(--size16);
}
.select {
    font-weight: bold;
    color: hsl(var(--color-blue));
}

.selects-result {
    max-width: 100%;
    display: grid;
    /* responsive */
    grid-template-columns: repeat(auto-fill, minmax(auto, 250px));
    gap: 10px;
}
.badge {
    display: grid;
    padding: 12px;
    font-size: var(--size12);
    color: hsl(var(--color-black));
    background-color: hsl(var(--color-greyE2));
    align-items: center;
    justify-content: center;
}
.total {
    display: block;
    font-size: var(--size16);
    padding-bottom: 8px;
}
.count {
    font-weight: 600;
    color: hsl(var(--color-blue));
}
@media (max-width: 768px) {
    [data-state="debug"] {
        grid-template-rows: 65% 35%;
        grid-template-columns: auto;
    }
    [data-state="debug"] i-log {
        position: inherit;
        width: 100%;
    }
    .container {
        grid-template-rows: 80px auto;
    }
}
`

document.body.append(demo())