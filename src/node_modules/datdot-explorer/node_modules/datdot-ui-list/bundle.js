(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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
},{"..":41,"../src/node_modules/message-maker":42,"bel":4,"csjs-inject":7,"datdot-terminal":24,"datdot-ui-button":28,"head":2}],2:[function(require,module,exports){
module.exports = head

function head (lang = 'UTF-8', title = 'List - DatDot UI') {
    document.documentElement.lang = 'en'
    document.title = title
    const lan = document.createElement('meta')
    const viewport = document.createElement('meta')
    const description = document.createElement('meta')
    lan.setAttribute('charset', lang)
    viewport.setAttribute('name', 'viewport')
    viewport.setAttribute('content', 'width=device-width, initial-scale=1.0')
    description.setAttribute('name', 'description')
    description.setAttribute('content', 'Datdot-UI is a web component and the widgets for datdot.org using.')
    document.head.append(lan, viewport)
}
},{}],3:[function(require,module,exports){
var trailingNewlineRegex = /\n[\s]+$/
var leadingNewlineRegex = /^\n[\s]+/
var trailingSpaceRegex = /[\s]+$/
var leadingSpaceRegex = /^[\s]+/
var multiSpaceRegex = /[\n\s]+/g

var TEXT_TAGS = [
  'a', 'abbr', 'b', 'bdi', 'bdo', 'br', 'cite', 'data', 'dfn', 'em', 'i',
  'kbd', 'mark', 'q', 'rp', 'rt', 'rtc', 'ruby', 's', 'amp', 'small', 'span',
  'strong', 'sub', 'sup', 'time', 'u', 'var', 'wbr'
]

var VERBATIM_TAGS = [
  'code', 'pre', 'textarea'
]

module.exports = function appendChild (el, childs) {
  if (!Array.isArray(childs)) return

  var nodeName = el.nodeName.toLowerCase()

  var hadText = false
  var value, leader

  for (var i = 0, len = childs.length; i < len; i++) {
    var node = childs[i]
    if (Array.isArray(node)) {
      appendChild(el, node)
      continue
    }

    if (typeof node === 'number' ||
      typeof node === 'boolean' ||
      typeof node === 'function' ||
      node instanceof Date ||
      node instanceof RegExp) {
      node = node.toString()
    }

    var lastChild = el.childNodes[el.childNodes.length - 1]

    // Iterate over text nodes
    if (typeof node === 'string') {
      hadText = true

      // If we already had text, append to the existing text
      if (lastChild && lastChild.nodeName === '#text') {
        lastChild.nodeValue += node

      // We didn't have a text node yet, create one
      } else {
        node = document.createTextNode(node)
        el.appendChild(node)
        lastChild = node
      }

      // If this is the last of the child nodes, make sure we close it out
      // right
      if (i === len - 1) {
        hadText = false
        // Trim the child text nodes if the current node isn't a
        // node where whitespace matters.
        if (TEXT_TAGS.indexOf(nodeName) === -1 &&
          VERBATIM_TAGS.indexOf(nodeName) === -1) {
          value = lastChild.nodeValue
            .replace(leadingNewlineRegex, '')
            .replace(trailingSpaceRegex, '')
            .replace(trailingNewlineRegex, '')
            .replace(multiSpaceRegex, ' ')
          if (value === '') {
            el.removeChild(lastChild)
          } else {
            lastChild.nodeValue = value
          }
        } else if (VERBATIM_TAGS.indexOf(nodeName) === -1) {
          // The very first node in the list should not have leading
          // whitespace. Sibling text nodes should have whitespace if there
          // was any.
          leader = i === 0 ? '' : ' '
          value = lastChild.nodeValue
            .replace(leadingNewlineRegex, leader)
            .replace(leadingSpaceRegex, ' ')
            .replace(trailingSpaceRegex, '')
            .replace(trailingNewlineRegex, '')
            .replace(multiSpaceRegex, ' ')
          lastChild.nodeValue = value
        }
      }

    // Iterate over DOM nodes
    } else if (node && node.nodeType) {
      // If the last node was a text node, make sure it is properly closed out
      if (hadText) {
        hadText = false

        // Trim the child text nodes if the current node isn't a
        // text node or a code node
        if (TEXT_TAGS.indexOf(nodeName) === -1 &&
          VERBATIM_TAGS.indexOf(nodeName) === -1) {
          value = lastChild.nodeValue
            .replace(leadingNewlineRegex, '')
            .replace(trailingNewlineRegex, '')
            .replace(multiSpaceRegex, ' ')

          // Remove empty text nodes, append otherwise
          if (value === '') {
            el.removeChild(lastChild)
          } else {
            lastChild.nodeValue = value
          }
        // Trim the child nodes if the current node is not a node
        // where all whitespace must be preserved
        } else if (VERBATIM_TAGS.indexOf(nodeName) === -1) {
          value = lastChild.nodeValue
            .replace(leadingSpaceRegex, ' ')
            .replace(leadingNewlineRegex, '')
            .replace(trailingNewlineRegex, '')
            .replace(multiSpaceRegex, ' ')
          lastChild.nodeValue = value
        }
      }

      // Store the last nodename
      var _nodeName = node.nodeName
      if (_nodeName) nodeName = _nodeName.toLowerCase()

      // Append the node to the DOM
      el.appendChild(node)
    }
  }
}

},{}],4:[function(require,module,exports){
var hyperx = require('hyperx')
var appendChild = require('./appendChild')

var SVGNS = 'http://www.w3.org/2000/svg'
var XLINKNS = 'http://www.w3.org/1999/xlink'

var BOOL_PROPS = [
  'autofocus', 'checked', 'defaultchecked', 'disabled', 'formnovalidate',
  'indeterminate', 'readonly', 'required', 'selected', 'willvalidate'
]

var COMMENT_TAG = '!--'

var SVG_TAGS = [
  'svg', 'altGlyph', 'altGlyphDef', 'altGlyphItem', 'animate', 'animateColor',
  'animateMotion', 'animateTransform', 'circle', 'clipPath', 'color-profile',
  'cursor', 'defs', 'desc', 'ellipse', 'feBlend', 'feColorMatrix',
  'feComponentTransfer', 'feComposite', 'feConvolveMatrix',
  'feDiffuseLighting', 'feDisplacementMap', 'feDistantLight', 'feFlood',
  'feFuncA', 'feFuncB', 'feFuncG', 'feFuncR', 'feGaussianBlur', 'feImage',
  'feMerge', 'feMergeNode', 'feMorphology', 'feOffset', 'fePointLight',
  'feSpecularLighting', 'feSpotLight', 'feTile', 'feTurbulence', 'filter',
  'font', 'font-face', 'font-face-format', 'font-face-name', 'font-face-src',
  'font-face-uri', 'foreignObject', 'g', 'glyph', 'glyphRef', 'hkern', 'image',
  'line', 'linearGradient', 'marker', 'mask', 'metadata', 'missing-glyph',
  'mpath', 'path', 'pattern', 'polygon', 'polyline', 'radialGradient', 'rect',
  'set', 'stop', 'switch', 'symbol', 'text', 'textPath', 'title', 'tref',
  'tspan', 'use', 'view', 'vkern'
]

function belCreateElement (tag, props, children) {
  var el

  // If an svg tag, it needs a namespace
  if (SVG_TAGS.indexOf(tag) !== -1) {
    props.namespace = SVGNS
  }

  // If we are using a namespace
  var ns = false
  if (props.namespace) {
    ns = props.namespace
    delete props.namespace
  }

  // Create the element
  if (ns) {
    el = document.createElementNS(ns, tag)
  } else if (tag === COMMENT_TAG) {
    return document.createComment(props.comment)
  } else {
    el = document.createElement(tag)
  }

  // Create the properties
  for (var p in props) {
    if (props.hasOwnProperty(p)) {
      var key = p.toLowerCase()
      var val = props[p]
      // Normalize className
      if (key === 'classname') {
        key = 'class'
        p = 'class'
      }
      // The for attribute gets transformed to htmlFor, but we just set as for
      if (p === 'htmlFor') {
        p = 'for'
      }
      // If a property is boolean, set itself to the key
      if (BOOL_PROPS.indexOf(key) !== -1) {
        if (val === 'true') val = key
        else if (val === 'false') continue
      }
      // If a property prefers being set directly vs setAttribute
      if (key.slice(0, 2) === 'on') {
        el[p] = val
      } else {
        if (ns) {
          if (p === 'xlink:href') {
            el.setAttributeNS(XLINKNS, p, val)
          } else if (/^xmlns($|:)/i.test(p)) {
            // skip xmlns definitions
          } else {
            el.setAttributeNS(null, p, val)
          }
        } else {
          el.setAttribute(p, val)
        }
      }
    }
  }

  appendChild(el, children)
  return el
}

module.exports = hyperx(belCreateElement, {comments: true})
module.exports.default = module.exports
module.exports.createElement = belCreateElement

},{"./appendChild":3,"hyperx":39}],5:[function(require,module,exports){
(function (global){(function (){
'use strict';

var csjs = require('csjs');
var insertCss = require('insert-css');

function csjsInserter() {
  var args = Array.prototype.slice.call(arguments);
  var result = csjs.apply(null, args);
  if (global.document) {
    insertCss(csjs.getCss(result));
  }
  return result;
}

module.exports = csjsInserter;

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"csjs":10,"insert-css":40}],6:[function(require,module,exports){
'use strict';

module.exports = require('csjs/get-css');

},{"csjs/get-css":9}],7:[function(require,module,exports){
'use strict';

var csjs = require('./csjs');

module.exports = csjs;
module.exports.csjs = csjs;
module.exports.getCss = require('./get-css');

},{"./csjs":5,"./get-css":6}],8:[function(require,module,exports){
'use strict';

module.exports = require('./lib/csjs');

},{"./lib/csjs":14}],9:[function(require,module,exports){
'use strict';

module.exports = require('./lib/get-css');

},{"./lib/get-css":18}],10:[function(require,module,exports){
'use strict';

var csjs = require('./csjs');

module.exports = csjs();
module.exports.csjs = csjs;
module.exports.noScope = csjs({ noscope: true });
module.exports.getCss = require('./get-css');

},{"./csjs":8,"./get-css":9}],11:[function(require,module,exports){
'use strict';

/**
 * base62 encode implementation based on base62 module:
 * https://github.com/andrew/base62.js
 */

var CHARS = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

module.exports = function encode(integer) {
  if (integer === 0) {
    return '0';
  }
  var str = '';
  while (integer > 0) {
    str = CHARS[integer % 62] + str;
    integer = Math.floor(integer / 62);
  }
  return str;
};

},{}],12:[function(require,module,exports){
'use strict';

var makeComposition = require('./composition').makeComposition;

module.exports = function createExports(classes, keyframes, compositions) {
  var keyframesObj = Object.keys(keyframes).reduce(function(acc, key) {
    var val = keyframes[key];
    acc[val] = makeComposition([key], [val], true);
    return acc;
  }, {});

  var exports = Object.keys(classes).reduce(function(acc, key) {
    var val = classes[key];
    var composition = compositions[key];
    var extended = composition ? getClassChain(composition) : [];
    var allClasses = [key].concat(extended);
    var unscoped = allClasses.map(function(name) {
      return classes[name] ? classes[name] : name;
    });
    acc[val] = makeComposition(allClasses, unscoped);
    return acc;
  }, keyframesObj);

  return exports;
}

function getClassChain(obj) {
  var visited = {}, acc = [];

  function traverse(obj) {
    return Object.keys(obj).forEach(function(key) {
      if (!visited[key]) {
        visited[key] = true;
        acc.push(key);
        traverse(obj[key]);
      }
    });
  }

  traverse(obj);
  return acc;
}

},{"./composition":13}],13:[function(require,module,exports){
'use strict';

module.exports = {
  makeComposition: makeComposition,
  isComposition: isComposition,
  ignoreComposition: ignoreComposition
};

/**
 * Returns an immutable composition object containing the given class names
 * @param  {array} classNames - The input array of class names
 * @return {Composition}      - An immutable object that holds multiple
 *                              representations of the class composition
 */
function makeComposition(classNames, unscoped, isAnimation) {
  var classString = classNames.join(' ');
  return Object.create(Composition.prototype, {
    classNames: { // the original array of class names
      value: Object.freeze(classNames),
      configurable: false,
      writable: false,
      enumerable: true
    },
    unscoped: { // the original array of class names
      value: Object.freeze(unscoped),
      configurable: false,
      writable: false,
      enumerable: true
    },
    className: { // space-separated class string for use in HTML
      value: classString,
      configurable: false,
      writable: false,
      enumerable: true
    },
    selector: { // comma-separated, period-prefixed string for use in CSS
      value: classNames.map(function(name) {
        return isAnimation ? name : '.' + name;
      }).join(', '),
      configurable: false,
      writable: false,
      enumerable: true
    },
    toString: { // toString() method, returns class string for use in HTML
      value: function() {
        return classString;
      },
      configurable: false,
      writeable: false,
      enumerable: false
    }
  });
}

/**
 * Returns whether the input value is a Composition
 * @param value      - value to check
 * @return {boolean} - whether value is a Composition or not
 */
function isComposition(value) {
  return value instanceof Composition;
}

function ignoreComposition(values) {
  return values.reduce(function(acc, val) {
    if (isComposition(val)) {
      val.classNames.forEach(function(name, i) {
        acc[name] = val.unscoped[i];
      });
    }
    return acc;
  }, {});
}

/**
 * Private constructor for use in `instanceof` checks
 */
function Composition() {}

},{}],14:[function(require,module,exports){
'use strict';

var extractExtends = require('./css-extract-extends');
var composition = require('./composition');
var isComposition = composition.isComposition;
var ignoreComposition = composition.ignoreComposition;
var buildExports = require('./build-exports');
var scopify = require('./scopeify');
var cssKey = require('./css-key');
var extractExports = require('./extract-exports');

module.exports = function csjsTemplate(opts) {
  opts = (typeof opts === 'undefined') ? {} : opts;
  var noscope = (typeof opts.noscope === 'undefined') ? false : opts.noscope;

  return function csjsHandler(strings, values) {
    // Fast path to prevent arguments deopt
    var values = Array(arguments.length - 1);
    for (var i = 1; i < arguments.length; i++) {
      values[i - 1] = arguments[i];
    }
    var css = joiner(strings, values.map(selectorize));
    var ignores = ignoreComposition(values);

    var scope = noscope ? extractExports(css) : scopify(css, ignores);
    var extracted = extractExtends(scope.css);
    var localClasses = without(scope.classes, ignores);
    var localKeyframes = without(scope.keyframes, ignores);
    var compositions = extracted.compositions;

    var exports = buildExports(localClasses, localKeyframes, compositions);

    return Object.defineProperty(exports, cssKey, {
      enumerable: false,
      configurable: false,
      writeable: false,
      value: extracted.css
    });
  }
}

/**
 * Replaces class compositions with comma seperated class selectors
 * @param  value - the potential class composition
 * @return       - the original value or the selectorized class composition
 */
function selectorize(value) {
  return isComposition(value) ? value.selector : value;
}

/**
 * Joins template string literals and values
 * @param  {array} strings - array of strings
 * @param  {array} values  - array of values
 * @return {string}        - strings and values joined
 */
function joiner(strings, values) {
  return strings.map(function(str, i) {
    return (i !== values.length) ? str + values[i] : str;
  }).join('');
}

/**
 * Returns first object without keys of second
 * @param  {object} obj      - source object
 * @param  {object} unwanted - object with unwanted keys
 * @return {object}          - first object without unwanted keys
 */
function without(obj, unwanted) {
  return Object.keys(obj).reduce(function(acc, key) {
    if (!unwanted[key]) {
      acc[key] = obj[key];
    }
    return acc;
  }, {});
}

},{"./build-exports":12,"./composition":13,"./css-extract-extends":15,"./css-key":16,"./extract-exports":17,"./scopeify":23}],15:[function(require,module,exports){
'use strict';

var makeComposition = require('./composition').makeComposition;

var regex = /\.([^\s]+)(\s+)(extends\s+)(\.[^{]+)/g;

module.exports = function extractExtends(css) {
  var found, matches = [];
  while (found = regex.exec(css)) {
    matches.unshift(found);
  }

  function extractCompositions(acc, match) {
    var extendee = getClassName(match[1]);
    var keyword = match[3];
    var extended = match[4];

    // remove from output css
    var index = match.index + match[1].length + match[2].length;
    var len = keyword.length + extended.length;
    acc.css = acc.css.slice(0, index) + " " + acc.css.slice(index + len + 1);

    var extendedClasses = splitter(extended);

    extendedClasses.forEach(function(className) {
      if (!acc.compositions[extendee]) {
        acc.compositions[extendee] = {};
      }
      if (!acc.compositions[className]) {
        acc.compositions[className] = {};
      }
      acc.compositions[extendee][className] = acc.compositions[className];
    });
    return acc;
  }

  return matches.reduce(extractCompositions, {
    css: css,
    compositions: {}
  });

};

function splitter(match) {
  return match.split(',').map(getClassName);
}

function getClassName(str) {
  var trimmed = str.trim();
  return trimmed[0] === '.' ? trimmed.substr(1) : trimmed;
}

},{"./composition":13}],16:[function(require,module,exports){
'use strict';

/**
 * CSS identifiers with whitespace are invalid
 * Hence this key will not cause a collision
 */

module.exports = ' css ';

},{}],17:[function(require,module,exports){
'use strict';

var regex = require('./regex');
var classRegex = regex.classRegex;
var keyframesRegex = regex.keyframesRegex;

module.exports = extractExports;

function extractExports(css) {
  return {
    css: css,
    keyframes: getExport(css, keyframesRegex),
    classes: getExport(css, classRegex)
  };
}

function getExport(css, regex) {
  var prop = {};
  var match;
  while((match = regex.exec(css)) !== null) {
    var name = match[2];
    prop[name] = name;
  }
  return prop;
}

},{"./regex":20}],18:[function(require,module,exports){
'use strict';

var cssKey = require('./css-key');

module.exports = function getCss(csjs) {
  return csjs[cssKey];
};

},{"./css-key":16}],19:[function(require,module,exports){
'use strict';

/**
 * djb2 string hash implementation based on string-hash module:
 * https://github.com/darkskyapp/string-hash
 */

module.exports = function hashStr(str) {
  var hash = 5381;
  var i = str.length;

  while (i) {
    hash = (hash * 33) ^ str.charCodeAt(--i)
  }
  return hash >>> 0;
};

},{}],20:[function(require,module,exports){
'use strict';

var findClasses = /(\.)(?!\d)([^\s\.,{\[>+~#:)]*)(?![^{]*})/.source;
var findKeyframes = /(@\S*keyframes\s*)([^{\s]*)/.source;
var ignoreComments = /(?!(?:[^*/]|\*[^/]|\/[^*])*\*+\/)/.source;

var classRegex = new RegExp(findClasses + ignoreComments, 'g');
var keyframesRegex = new RegExp(findKeyframes + ignoreComments, 'g');

module.exports = {
  classRegex: classRegex,
  keyframesRegex: keyframesRegex,
  ignoreComments: ignoreComments,
};

},{}],21:[function(require,module,exports){
var ignoreComments = require('./regex').ignoreComments;

module.exports = replaceAnimations;

function replaceAnimations(result) {
  var animations = Object.keys(result.keyframes).reduce(function(acc, key) {
    acc[result.keyframes[key]] = key;
    return acc;
  }, {});
  var unscoped = Object.keys(animations);

  if (unscoped.length) {
    var regexStr = '((?:animation|animation-name)\\s*:[^};]*)('
      + unscoped.join('|') + ')([;\\s])' + ignoreComments;
    var regex = new RegExp(regexStr, 'g');

    var replaced = result.css.replace(regex, function(match, preamble, name, ending) {
      return preamble + animations[name] + ending;
    });

    return {
      css: replaced,
      keyframes: result.keyframes,
      classes: result.classes
    }
  }

  return result;
}

},{"./regex":20}],22:[function(require,module,exports){
'use strict';

var encode = require('./base62-encode');
var hash = require('./hash-string');

module.exports = function fileScoper(fileSrc) {
  var suffix = encode(hash(fileSrc));

  return function scopedName(name) {
    return name + '_' + suffix;
  }
};

},{"./base62-encode":11,"./hash-string":19}],23:[function(require,module,exports){
'use strict';

var fileScoper = require('./scoped-name');
var replaceAnimations = require('./replace-animations');
var regex = require('./regex');
var classRegex = regex.classRegex;
var keyframesRegex = regex.keyframesRegex;

module.exports = scopify;

function scopify(css, ignores) {
  var makeScopedName = fileScoper(css);
  var replacers = {
    classes: classRegex,
    keyframes: keyframesRegex
  };

  function scopeCss(result, key) {
    var replacer = replacers[key];
    function replaceFn(fullMatch, prefix, name) {
      var scopedName = ignores[name] ? name : makeScopedName(name);
      result[key][scopedName] = name;
      return prefix + scopedName;
    }
    return {
      css: result.css.replace(replacer, replaceFn),
      keyframes: result.keyframes,
      classes: result.classes
    };
  }

  var result = Object.keys(replacers).reduce(scopeCss, {
    css: css,
    keyframes: {},
    classes: {}
  });

  return replaceAnimations(result);
}

},{"./regex":20,"./replace-animations":21,"./scoped-name":22}],24:[function(require,module,exports){
const bel = require('bel')
const style_sheet = require('support-style-sheet')
const message_maker = require('message-maker')
const {int2hsla, str2hashint} = require('generator-color')

module.exports = terminal
function terminal ({to = 'terminal', mode = 'compact', expanded = false}, protocol) {
    let is_expanded = expanded
    let types = {}
    const send = protocol(get)
    const make = message_maker(`terminal / index.js`)
    const message = make({to, type: 'ready', refs: ['old_logs', 'new_logs']})
    send(message)
    const el = document.createElement('i-terminal')
    const shadow = el.attachShadow({mode: 'closed'})
    const log_list = document.createElement('log-list')
    log_list.setAttribute('aria-label', mode)
    style_sheet(shadow, style)
    shadow.append(log_list)
    return el

    function get (msg) {
        const {head, refs, type, data, meta} = msg
        const from = head[0].split('/')[0].trim()
        make_logs (msg)
        if (type === 'layout-mode') return handle_change_layout(data)
    }

    function handle_change_layout (data) {
        const {mode, expanded} = data
        const { childNodes } = log_list
        if (mode) log_list.setAttribute('aria-label', mode)
        if (expanded !== void 0) {
            is_expanded = expanded
            childNodes.forEach( list => {
                list.setAttribute('aria-expanded', expanded)
            })
        }
    }

    function make_logs (msg) {
        const {head, refs, type, data, meta} = msg
        // make an object for type, count, color
        const init = t => ({type: t, count: 0, color: type.match(/ready|click|triggered|opened|closed|checked|unchecked|selected|unselected|expanded|collapsed|error|warning|toggled|changed/) ? null : int2hsla(str2hashint(t)) })
        // to check type is existing then do count++, else return new type
        const add = t => ((types[t] || (types[t] = init(t))).count++, types[t])
        add(type)
        try {
            const from = bel`<span aria-label=${head[0]} class="from">${head[0]}</span>`
            const to = bel`<span aria-label="to" class="to">${head[1]}</span>`
            const data_info = bel`<span aira-label="data" class="data">data: ${typeof data === 'object' ? JSON.stringify(data) : data}</span>`
            const type_info = bel`<span aria-type="${type}" aria-label="${type}" class="type">${type}</span>`
            const refs_info = bel`<div class="refs"><span>refs:</span></div>`
            refs.map( (ref, i) => refs_info.append(
                bel`<span>${ref}${i < refs.length - 1 ? ',  ' : ''}</span>`
            ))
            const info = bel`<div class="info">${data_info}${refs_info}</div>`
            const header = bel`
            <div class="head">
                ${type_info}
                ${from}
                <span class="arrow">=＞</span>
                ${to}
            </div>`
            const log = bel`<div class="log">${header}${data_info}${refs_info}</div>`
            const file = bel`
            <div class="file">
                <span>${meta.stack[0]}</span>
                <span>${meta.stack[1]}</span>
            </div>`
            var list = bel`<section class="list" aria-label="${type}" aria-expanded="${is_expanded}" onclick=${() => handle_accordion_event(list)}>${log}${file}</section>`
            generate_type_color(type, type_info)
            log_list.append(list)
            el.scrollTop = el.scrollHeight
        } catch (error) {
            document.addEventListener('DOMContentLoaded', () => log_list.append(list))
            return false
        }
    }

    function generate_type_color (type, el) {
        for (let t in types) { 
            if (t === type && types[t].color) {
                el.style.color = `hsl(var(--color-dark))`
                el.style.backgroundColor = types[t].color
            }   
        }
    }
    function handle_accordion_event (target) {
        const status = target.ariaExpanded === 'false' ? 'true' : 'false'
        target.ariaExpanded = status
    }
}

const style = `
:host(i-terminal) {
    --bg-color: var(--color-dark);
    --opacity: 1;
    --size: var(--size12);
    --color: var(--color-white);
    font-size: var(--size);
    color: hsl(var(--color));
    background-color: hsla( var(--bg-color), var(--opacity));
    height: 100%;
    overflow: hidden auto;
    padding-top: 4px;
}
h4 {
    --bg-color: var(--color-deep-black);
    --opacity: 1;
    margin: 0;
    padding: 10px 10px;
    color: #fff;
    background-color: hsl( var(--bg-color), var(--opacity) );
}
log-list {
    height: 100%;
}
.list {
    --bg-color: 0, 0%, 30%;
    --opacity: 0.25;
    --border-radius: 0;
    padding: 2px 10px 2px 0px;
    margin-bottom: 1px;
    background-color: hsla( var(--bg-color), var(--opacity) );
    border-radius: var(--border-radius);
    transition: background-color 0.6s ease-in-out;
}
.list[aria-expanded="false"] .file {
    height: 0;
    opacity: 0;
    transition: opacity 0.3s, height 0.3s ease-in-out;
}
.list[aria-expanded="true"] .file {
    opacity: 1;
    height: auto;
    padding: 4px 8px;
}
log-list .list:last-child {
    --bg-color: var(--color-viridian-green);
    --opacity: .3;
}
[aria-label="compact"] .list[aria-expanded="false"] .log {
    white-space: nowrap;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
}
[aria-label="compact"] .list[aria-expanded="true"] .log {
    padding-left: 8px;
    oveflow: auto;
}
[aria-label="compact"] .list[aria-expanded="true"] .log .head {
    margin-left: -8px;
}
[aria-label="compact"] .list[aria-expanded="true"] .data {
    display: inlne-block;
}
[aria-label="compact"] .refs {
    padding-left: 8px;
}
.log {
    line-height: 1.8;
    word-break: break-all;
    white-space: pre-wrap;
}
.head {
    display: inline-block;
}
.type {
    --color: var(--color-greyD9);
    --bg-color: var(--color-greyD9);
    --opacity: .25;
    display: inline-grid;
    color: hsl( var(--color) );
    background-color: hsla( var(--bg-color), var(--opacity) );
    padding: 0 2px;
    justify-self: center;
    align-self: center;
    text-align: center;
    min-width: 92px;
}
.from {
    --color: var(--color-maximum-blue-green);
    display: inline-block;
    color: hsl( var(--color) );
    justify-content: center;
    align-items: center;
    margin: 0 12px;
}
.to {
    --color: var(--color-dodger-blue);
    color: hsl(var(--color));
    display: inline-block;
    margin: 0 12px;
}
.arrow {
    --color: var(--color-grey88);
    color:  hsl(var(--color));
}
.file {
    --color: var(--color-greyA2);
    color: hsl( var(--color) );
    line-height: 1.6;
    display: flex;
    gap: 10px;
}
.file > span {
    display: inline-block;
}
.function {
    --color: 0, 0%, 70%;
    color: var(--color);
}
.refs {
    --color: var(--color-white);
    display: inline-block;
    color: var(--color);
}
[aria-type="click"] {
    --color: var(--color-dark);
    --bg-color: var(--color-yellow);
    --opacity: 1;
}
[aria-type="triggered"] {
    --color: var(--color-white);
    --bg-color: var(--color-blue-jeans);
    --opacity: .5;
}
[aria-type="opened"] {
    --bg-color: var(--color-slate-blue);
    --opacity: 1;
}
[aria-type="closed"] {
    --bg-color: var(--color-ultra-red);
    --opacity: 1;
}
[aria-type="error"] {
    --color: var(--color-white);
    --bg-color: var(--color-red);
    --opacity: 1;
}
[aria-type="warning"] {
    --color: var(--color-white);
    --bg-color: var(--color-deep-saffron);
    --opacity: 1;
}
[aria-type="checked"] {
    --color: var(--color-dark);
    --bg-color: var(--color-blue-jeans);
    --opacity: 1;
}
[aria-type="unchecked"] {
    --bg-color: var(--color-blue-jeans);
    --opacity: .3;
}
[aria-type="selected"] {
    --color: var(--color-dark);
    --bg-color: var(--color-lime-green);
    --opacity: 1;
}
[aria-type="unselected"] {
    --bg-color: var(--color-lime-green);
    --opacity: .25;
}
[aria-type="changed"] {
    --color: var(--color-dark);
    --bg-color: var(--color-safety-orange);
    --opacity: 1;
}
[aria-type="expanded"] {
    --bg-color: var(--color-electric-violet);
    --opacity: 1;
}
[aria-type="collapsed"] {
    --bg-color: var(--color-heliotrope);
    --opacity: 1;
}
log-list .list:last-child .type {}
log-list .list:last-child .arrow {
    --color: var(--color-white);
}
log-list .list:last-child .to {
    --color: var(--color-blue-jeans);
}
log-list .list:last-child .file {
    --color: var(--color-white);
}
log-list .list:last-child [aria-type="ready"] {
    --bg-color: var(--color-deep-black);
    --opacity: 0.3;
}
log-list .list:last-child .function {
    --color: var(--color-white);
}
[aria-label="comfortable"] .list[aria-expanded="false"] .log {
    
}
[aria-label="comfortable"] .data {
    display: block;
    padding: 8px 8px 0px 8px;
}
[aria-label="comfortable"] .list[aria-expanded="false"] .data {
    white-space: nowrap;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis; 
}
[aria-label="comfortable"] .list[aria-expanded="false"] .refs {
    display: none;
}
[aria-label="comfortable"] .list[aria-expanded="true"] .refs {
    display: block;
    padding-left: 8px;
}
`
},{"bel":4,"generator-color":25,"message-maker":26,"support-style-sheet":27}],25:[function(require,module,exports){
 module.exports = {int2hsla, str2hashint}
 function int2hsla (i) { return `hsla(${i % 360}, 100%, 70%, 1)` }
 function str2hashint (str) {
     let hash = 0
     const arr = str.split('')
     arr.forEach( (v, i) => {
         hash = str.charCodeAt(i) + ((hash << 5) - hash)
     })
     return hash
 }
},{}],26:[function(require,module,exports){
module.exports = function message_maker (from) {
    let msg_id = 0
    return function make ({to, type, data = null, refs = []}) {
        const stack = (new Error().stack.split('\n').slice(2).filter(x => x.trim()))
        const message = { head: [from, to, ++msg_id], refs, type, data, meta: { stack }}
        return message
    }
}
},{}],27:[function(require,module,exports){
module.exports = support_style_sheet
function support_style_sheet (root, style) {
    return (() => {
        try {
            const sheet = new CSSStyleSheet()
            sheet.replaceSync(style)
            root.adoptedStyleSheets = [sheet]
            return true 
        } catch (error) { 
            const inject_style = `<style>${style}</style>`
            root.innerHTML = `${inject_style}`
            return false
        }
    })()
}
},{}],28:[function(require,module,exports){
const style_sheet = require('support-style-sheet')
const message_maker = require('message-maker')
const make_img = require('make-image')
const make_element = require('make-element')
const {main_icon, select_icon, list_icon} = require('make-icon')
const make_grid = require('make-grid')

module.exports = {i_button, i_link}

function i_link (option, protocol) {
    const {page = '*', flow = 'ui-link', name, role='link', body, link = {}, icons = {}, classlist, cover, disabled = false, theme = {}} = option
    const { icon } = icons
    const make_icon = icons && icon ? main_icon(icon) : undefined
    let {url = '#', target = '_self'} = link
    let is_disabled = disabled

    function widget () {
        const send = protocol(get)
        const make = message_maker(`${name} / ${role} / ${flow} / ${page}`)
        const message = make({to: 'demo.js', type: 'ready'})
        const el = make_element({name: 'i-link', role})
        const shadow = el.attachShadow({mode: 'open'})
        const text = make_element({name: 'span', classlist: 'text'})
        const avatar = make_element({name: 'span', classlist: 'avatar'})
        text.append(body)
        el.setAttribute('aria-label', body)
        el.setAttribute('href', url)
        if (is_disabled) set_attr ({aria: 'disabled', prop: is_disabled})
        if (!target.match(/self/)) el.setAttribute('target', target)
        if (classlist) el.classList.add(classlist)
        style_sheet(shadow, style)
        // check icon, cover and body if has value
        const add_cover = typeof cover === 'string' ? avatar : undefined
        const add_icon = icon ? make_icon : undefined
        const add_text = body ? typeof body === 'string' && (add_icon || add_cover ) ? text : body : typeof body === 'object' && body.localName === 'div' ? body : undefined
        if (typeof cover === 'string') avatar.append(make_img({src: cover, alt: name}))
        if (typeof cover === 'object') send(make({type: 'error', data: `cover[${typeof cover}] must to be a string`}))
        if (add_icon) shadow.append(add_icon)
        if (add_cover) shadow.append(add_cover)
        if (add_text) shadow.append(add_text)
        send(message)
        if (!is_disabled) el.onclick = handle_open_link
        return el

        function set_attr ({aria, prop}) {
            el.setAttribute(`aria-${aria}`, prop)
        }
    
        function handle_open_link () {
            if (target.match(/_/)) {
                window.open(url, target)
            }
            if (target.match(/#/) && target.length > 1) {
                const el = document.querySelector(target)
                el.src = url
            }
            send(make({type: 'go to', data: {url, window: target}}))
        }

        // protocol get msg
        function get (msg) {
            const { head, refs, type, data } = msg
        }

    }

    // insert CSS style
    const custom_style = theme ? theme.style : ''
    // set CSS variables
    const {props = {}, grid = {}} = theme
    const {
        // default        
        padding, margin, width, height, opacity,
        // size
        size, size_hover, disabled_size,
        // weight
        weight, weight_hover, disabled_weight,
        // color
        color, color_hover, disabled_color,
        // background-color    
        bg_color, bg_color_hover, disabled_bg_color,
        // deco
        deco, deco_hover, disabled_deco,
        // border
        border_width, border_style, border_opacity, 
        border_color, border_color_hover, border_radius,
        // shadowbox
        shadow_color, shadow_color_hover,
        offset_x, offset_y, offset_x_hover, offset_y_hover, 
        blur, blur_hover, shadow_opacity, shadow_opacity_hover,
        // icon
        icon_size, icon_size_hover, disabled_icon_size,
        icon_fill, icon_fill_hover, disabled_icon_fill,
        // avatar
        avatar_width, avatar_height, avatar_radius, 
        avatar_width_hover, avatar_height_hover,
        scale, scale_hover
    } = props

    const grid_link = grid.link ? grid.link : {auto: {auto_flow: 'column'}, align: 'items-center', gap: '4px'}
    const style = `
    :host(i-link) {
        --size: ${size ? size : 'var(--link-size)'};
        --weight: ${weight ? weight : 'var(--weight300)'};
        --color: ${color ? color : 'var(--link-color)'};
        --bg-color: ${bg_color ? bg_color : 'var(--link-bg-color)'};
        --opacity: ${opacity ? opacity : '0'};
        --deco: ${deco ? deco : 'none'};
        --padding: ${padding ? padding : '0'};
        --margin: ${margin ? margin : '0'};
        --icon-size: ${icon_size ? icon_size : 'var(--link-icon-size)'};
        display: inline-grid;
        font-size: var(--size);
        font-weight: var(--weight);
        color: hsl(var(--color));
        background-color: hsla(var(--bg-color), var(--opacity));
        text-decoration: var(--deco);
        padding: var(--padding);
        margin: var(--margin);
        transition: color .5s, background-color .5s, font-size .5s, font-weight .5s, opacity .5s ease-in-out;
        cursor: pointer;
        ${make_grid(grid_link)}
    }
    :host(i-link:hover) {
        --color: ${color_hover ? color_hover : 'var(--link-color-hover)'};
        --size: ${size_hover ? size_hover : 'var(--link-size-hover)'};
        --deco: ${deco_hover ? deco_hover : 'underline'};
        --bg-color: ${bg_color_hover ? bg_color_hover : 'var(--color-white)'};
        --opacity: ${opacity ? opacity : '0'};
        text-decoration: var(--deco);
    }
    :host(i-link) img {
        --scale: ${scale ? scale : '1'};
        width: 100%;
        height: 100%;
        transform: scale(var(--scale));
        transition: transform 0.3s linear;
        object-fit: cover;
        border-radius: var(--avatar-radius);
    }
    :host(i-link:hover) img {
        --scale: ${scale_hover ? scale_hover : '1.2'};
    }
    :host(i-link) svg {
        width: 100%;
        height: auto;
    }
    :host(i-link) g {
        --icon-fill: ${icon_fill ? icon_fill : 'var(--link-icon-fill)'};
        fill: hsl(var(--icon-fill));
        transition: fill 0.05s ease-in-out;
    }
    :host(i-link:hover) g, :host(i-link:hover) path{
        --icon-fill: ${icon_fill_hover ? icon_fill_hover : 'var(--link-icon-fill-hover)'};
    }
    :host(i-link) .text {
        ${make_grid(grid.text)}
    }
    :host(i-link) .icon {
        width: var(--icon-size);
        max-width: 100%;
        ${make_grid(grid.icon)}
    }
    :host(i-link:hover) .icon {
        --icon-size: ${icon_size_hover ? icon_size_hover : 'var(--link-icon-size)'};
    }
    :host(i-link) .avatar {
        --avatar-width: ${avatar_width ? avatar_width : 'var(--link-avatar-width)'};
        --avatar-height: ${avatar_height ? avatar_height : 'var(--link-avatar-height)'};
        --avatar-radius: ${avatar_radius ? avatar_radius : 'var(--link-avatar-radius)'};
        display: block;
        width: var(--avatar-width);
        height: var(--avatar-height);
        border-radius: var(--avatar-radius);
        -webkit-mask-image: -webkit-radial-gradient(center, white, black);
        max-width: 100%;
        max-height: 100%;
        ${make_grid(grid.avatar)}
        transition: width 0.2s, height 0.2s linear;
    }
    :host(i-link:hover) .avatar {
        --avatar-width: ${avatar_width_hover ? avatar_width_hover : 'var(--link-avatar-width-hover)'};
        --avatar-height: ${avatar_height_hover ? avatar_height_hover : 'var(--link-avatar-height-hover)'};
    }
    :host(i-link[role="menuitem"]) {
        --size: ${size ? size : 'var(--menu-size)'};
        --color: ${color ? color : 'var(--menu-color)'};
        --weight: ${weight ? weight : 'var(--menu-weight)'};
        background-color: transparent;
    }
    :host(i-link[role="menuitem"]:hover) {
        --size: ${size ? size : 'var(--menu-size-hover)'};
        --color: ${color_hover ? color_hover : 'var(--menu-color-hover)'};
        --weight: ${weight ? weight : 'var(--menu-weight-hover)'};
        text-decoration: none;
        background-color: transparent;
    }
    :host(i-link[role="menuitem"]) .icon {
        --icon-size: ${icon_size ? icon_size : 'var(--menu-icon-size)'};
    }
    :host(i-link[role="menuitem"]) g {
        --icon-fill: ${icon_fill ? icon_fill : 'var(--menu-icon-fill)'};
    }
    :host(i-link[role="menuitem"]:hover) g {
        --icon-fill: ${icon_fill_hover ? icon_fill_hover : 'var(--menu-icon-fill-hover)'};
    }
    :host(i-link[aria-disabled="true"]), :host(i-link[aria-disabled="true"]:hover) {
        --size: ${disabled_size ? disabled_size : 'var(--link-disabled-size)'};
        --color: ${disabled_color ? disabled_color : 'var(--link-disabled-color)'};
        text-decoration: none;
        cursor: not-allowed;
    }
    :host(i-link[disabled]) g,
    :host(i-link[disabled]) path,
    :host(i-link[disabled]:hover) g,
    :host(i-link[disabled]:hover) path,
    :host(i-link[role][disabled]) g,
    :host(i-link[role][disabled]) path,
    :host(i-link[role][disabled]:hover) g,
    :host(i-link[role][disabled]:hover) path
    {
        --icon-fill: ${disabled_icon_fill ? disabled_icon_fill : 'var(--link-disabled-icon-fill)'};
    }
    :host(i-link[disabled]) .avatar {
        opacity: 0.6;
    }
    :host(i-link.right) {
        flex-direction: row-reverse;
    }
    ${custom_style}
    `
    return widget()
}

function i_button (option, protocol) {
    const {page = "*", flow = 'ui-button', name, role = 'button', controls, body = '', icons = {}, cover, classlist = null, mode = '', state, expanded = false, current = false, selected = false, checked = false, disabled = false, theme = {}} = option
    const {icon, select = {}, list = {}} = icons
    const make_icon = icon ? main_icon(icon) : undefined
    if (role === 'listbox') var make_select_icon = select_icon(select)
    if (role === 'option') var make_list_icon = list_icon(list)
    let is_current = current
    let is_checked = checked
    let is_disabled = disabled
    let is_selected = selected
    let is_expanded = expanded

    document.body.addEventListener("touchstart",function(){ });

    function widget () {
        const send = protocol(get)
        const make = message_maker(`${name} / ${role} / ${flow} / ${page}`)
        const data = role === 'tab' ?  {selected: is_current ? 'true' : is_selected, current: is_current} : role === 'switch' ? {checked: is_checked} : role === 'listbox' ? {expanded: is_expanded} : disabled ? {disabled} : role === 'option' ? {selected: is_selected, current: is_current} : null
        const message = make({to: 'demo.js', type: 'ready', data})
        send(message)
        const el = make_element({name: 'i-button', classlist, role })
        const shadow = el.attachShadow({mode: 'open'})
        const text = make_element({name: 'span', classlist: 'text'})
        const avatar = make_element({name: 'span', classlist: 'avatar'})
        const listbox = make_element({name: 'span', classlist: 'listbox'})
        const option = make_element({name: 'span', classlist: 'option'})
        // check icon, img and body if has value
        const add_cover = typeof cover === 'string' ? avatar : undefined
        const add_text = body && typeof body === 'string' ? text : body
        if (typeof cover === 'string') avatar.append(make_img({src: cover, alt: name}))
        if (typeof cover === 'object') send(make({type: 'error', data: `cover[${typeof cover}] must to be a string`}))
        if (typeof body === 'object') send(make({type: 'error', data: {body: `content is an ${typeof body}`, content: body }}))
        if (!is_disabled) el.onclick = handle_click
        el.setAttribute('aria-label', name)
        text.append(body)
        style_sheet(shadow, style)
        append_items()
        init_attr()
        return el

        function init_attr () {
            // define conditions
            if (state) set_attr({aria: 'aria-live', prop: 'assertive'})
            if (role === 'tab') {
                set_attr({aria: 'selected', prop: is_selected})
                set_attr({aria: 'controls', prop: controls})
                el.setAttribute('tabindex', is_current ? 0 : -1)
            }
            if (role === 'switch') set_attr({aria: 'checked', prop: is_checked})
            if (role === 'listbox') {
                set_attr({aria: 'haspopup', prop: role})
            }
            if (disabled) {
                set_attr({aria: 'disabled', prop: is_disabled})
                el.setAttribute('disabled', is_disabled)
            } 
            if (is_checked) set_attr({aria: 'checked', prop: is_checked})
            if (is_current) {
                is_selected = is_current
                set_attr({aria: 'current', prop: is_current})
            }
            if (is_selected || !is_selected && role.match(/option/)) {
                set_attr({aria: 'selected', prop: is_selected})
            } 
            if (is_expanded) {
                set_attr({aria: 'selected', prop: is_expanded})
            }
        }

        function set_attr ({aria, prop}) {
            el.setAttribute(`aria-${aria}`, prop)
        }

        // make element to append into shadowDOM
        function append_items() {
            const items = [make_icon, add_cover, add_text]
            const target = role === 'listbox' ? listbox : role === 'option' ?  option : shadow
            // list of listbox or dropdown menu
            if (role.match(/option/)) shadow.append(make_list_icon, option)
            // listbox or dropdown button
            if (role.match(/listbox/)) shadow.append(make_select_icon, listbox)
            items.forEach( item => {
                if (item === undefined) return
                target.append(item)
            })
        }

        // toggle
        function switched_event (data) {
            is_checked = data
            if (!is_checked) return el.removeAttribute('aria-checked')
            set_attr({aria: 'checked', prop: is_checked})
        }
        // dropdown menu
        function expanded_event (data) {
            is_expanded = !data
            set_attr({aria: 'expanded', prop: is_expanded})
        }
        // tab checked
        function checked_event (data) {
            is_checked = data
            is_current = is_checked
            set_attr({aria: 'selected', prop: is_checked})
            set_attr({aria: 'current', prop: is_current})
            el.setAttribute('tabindex', is_current ? 0 : -1)
        }
        function list_selected_event (state) {
            is_selected = state
            set_attr({aria: 'selected', prop: is_selected})
            if (mode === 'single-select') {
                is_current = is_selected
                set_attr({aria: 'current', prop: is_current})
            }
            // option is selected then send selected items to listbox button
            if (is_selected) send(make({to: 'listbox', type: 'changed', data: {text: body, cover, icon} }))
        }

        function changed_event (data) {
            const {text, cover, icon} = data
            const new_text = make_element({name: 'span', classlist: 'text'})
            const new_avatar = make_element({name: 'span', classlist: 'avatar'})
            // change content for button or switch or tab
            if (role.match(/button|switch|tab/)) {
                const old_icon = shadow.querySelector('.icon')
                const old_avatar = shadow.querySelector('.avatar')
                const old_text = shadow.querySelector('.text')
                if (old_text) {
                    if (text) old_text.textContent = text
                }
                if (cover) {
                    if (old_avatar) {
                        const img = old_avatar.querySelector('img')
                        img.alt = text
                        img.src = cover
                    } else {
                        new_avatar.append(make_img({src: cover, alt: text}))
                        shadow.insertBefore(new_avatar, shadow.firstChild)
                    }
                }
                if (icon) {
                    const new_icon = main_icon(icon)
                    if (old_icon) old_icon.parentNode.replaceChild(new_icon, old_icon)
                    else shadow.insertBefore(new_icon, shadow.firstChild)
                } 
                
            }
            // change content for listbox
            if (role.match(/listbox/)) {
                listbox.innerHTML = ''
                if (icon) {
                    const new_icon = main_icon(icon)
                    if (role.match(/listbox/)) listbox.append(new_icon)
                }
                if (cover) {
                    new_avatar.append(make_img({src: cover, alt: text}))
                    if (role.match(/listbox/)) listbox.append(new_avatar)
                }
                if (text) {
                    new_text.append(text)
                    if (role.match(/listbox/)) listbox.append(new_text)
                }
            } 
        }
        // button click
        function handle_click () {
            if (is_current) return
            const type = 'click'
            if (role === 'tab') return send( make({type, data: is_checked}) )
            if (role === 'switch') return send( make({type, data: is_checked}) )
            if (role === 'listbox') {
                is_expanded = !is_expanded
                return send( make({type, data: {expanded: is_expanded}}) )
            }
            if (role === 'option') {
                is_selected = !is_selected
                return send( make({type, data: {selected: is_selected, content: is_selected ? {text: body, cover, icon} : '' }}) )
            }
            send( make({type}) )
        }
        // protocol get msg
        function get (msg) {
            const { head, refs, type, data } = msg
            // toggle
            if (type.match(/switched/)) return switched_event(data)
            // dropdown
            if (type.match(/expanded|collapse/)) return expanded_event(!data)
            // tab, checkbox
            if (type.match(/checked|unchecked/)) return checked_event(data)
            // option
            if (type.match(/selected|unselected/)) return list_selected_event(data)
            if (type.match(/changed/)) return changed_event(data)
        }
    }
   
    // insert CSS style
    const custom_style = theme ? theme.style : ''
    // set CSS variables
    const {props = {}, grid = {}} = theme
    const {
        // default -----------------------------------------//
        padding, margin, width, height, opacity, 
        // size
        size, size_hover, 
        // weight
        weight, weight_hover, 
        // color
        color, color_hover,
        // background-color
        bg_color, bg_color_hover,
        // border
        border_color, border_color_hover,
        border_width, border_style, border_opacity, border_radius, 
        // icon
        icon_fill, icon_fill_hover, icon_size, icon_size_hover,
        // avatar
        avatar_width, avatar_height, avatar_radius,
        avatar_width_hover, avatar_height_hover,
        // shadow
        shadow_color, shadow_color_hover, 
        offset_x, offset_x_hover,
        offset_y, offset_y_hover, 
        blur, blur_hover,
        shadow_opacity, shadow_opacity_hover,
        // scale
        scale, scale_hover,
        // current -----------------------------------------//
        current_size, 
        current_weight, 
        current_color, 
        current_bg_color,
        current_icon_size,
        current_icon_fill,
        current_list_selected_icon_size,
        current_list_selected_icon_fill,
        current_avatar_width, 
        current_avatar_height,
        // disabled -----------------------------------------//
        disabled_size, disabled_weight, disabled_color,
        disabled_bg_color, disabled_icon_fill, disabled_icon_size,
        // role === option ----------------------------------//
        list_selected_icon_size, list_selected_icon_size_hover,
        list_selected_icon_fill, list_selected_icon_fill_hover,
        // role === listbox ----------------------------------//
        // collapse settings
        listbox_collapse_icon_size, listbox_collapse_icon_size_hover,
        listbox_collapse_icon_fill, listbox_collapse_icon_fill_hover, 
        listbox_collapse_listbox_color, listbox_collapse_listbox_color_hover,
        listbox_collapse_listbox_size, listbox_collapse_listbox_size_hover,
        listbox_collapse_listbox_weight, listbox_collapse_listbox_weight_hover,
        listbox_collapse_listbox_icon_size, listbox_collapse_listbox_icon_size_hover,
        listbox_collapse_listbox_icon_fill, listbox_collapse_listbox_icon_fill_hover,
        listbox_collapse_listbox_avatar_width, listbox_collapse_listbox_avatar_height,
        // expanded settings
        listbox_expanded_listbox_color,
        listbox_expanded_listbox_size, 
        listbox_expanded_listbox_weight,
        listbox_expanded_icon_size, 
        listbox_expanded_icon_fill,
        listbox_expanded_listbox_avatar_width, 
        listbox_expanded_listbox_avatar_height,
        listbox_expanded_listbox_icon_size, 
        listbox_expanded_listbox_icon_fill, 
    } = props

    const grid_init = {auto: {auto_flow: 'column'}, align: 'items-center', gap: '5px', justify: 'items-center'}
    const grid_option = grid.option ? grid.option : grid_init
    const grid_listbox = grid.listbox ? grid.listbox : grid_init
    const style = `
    :host(i-button) {
        --size: ${size ? size : 'var(--primary-size)'};
        --weight: ${weight ? weight : 'var(--weight300)'};
        --color: ${color ? color : 'var(--primary-color)'};
        --bg-color: ${bg_color ? bg_color : 'var(--primary-bg-color)'};
        ${width && `--width: ${width}`};
        ${height && `--height: ${height}`};
        --opacity: ${opacity ? opacity : '1'};
        --padding: ${padding ? padding : '12px'};
        --margin: ${margin ? margin : '0'};
        --border-width: ${border_width ? border_width : '0px'};
        --border-style: ${border_style ? border_style : 'solid'};
        --border-color: ${border_color ? border_color : 'var(--primary-color)'};
        --border-opacity: ${border_opacity ? border_opacity : '1'};
        --border: var(--border-width) var(--border-style) hsla( var(--border-color), var(--border-opacity) );
        --border-radius: ${border_radius ? border_radius : 'var(--primary-radius)'};
        --offset_x: ${offset_x ? offset_x : '0px'};
        --offset-y: ${offset_y ? offset_y : '6px'};
        --blur: ${blur ? blur : '30px'};
        --shadow-color: ${shadow_color ? shadow_color : 'var(--primary-color)'};
        --shadow-opacity: ${shadow_opacity ? shadow_opacity : '0'};
        --box-shadow: var(--offset_x) var(--offset-y) var(--blur) hsla( var(--shadow-color), var(--shadow-opacity) );
        --avatar-width: ${avatar_width ? avatar_width : 'var(--primary-avatar-width)'};
        --avatar-height: ${avatar_height ? avatar_height : 'var(--primary-avatar-height)'};
        --avatar-radius: ${avatar_radius ? avatar_radius : 'var(--primary-avatar-radius)'};
        display: inline-grid;
        ${grid.button ? make_grid(grid.button) : make_grid({auto: {auto_flow: 'column'}, gap: '5px', justify: 'content-center', align: 'items-center'})}
        ${width && 'width: var(--width);'};
        ${height && 'height: var(--height);'};
        max-width: 100%;
        font-size: var(--size);
        font-weight: var(--weight);
        color: hsl( var(--color) );
        background-color: hsla( var(--bg-color), var(--opacity) );
        border: var(--border);
        border-radius: var(--border-radius);
        box-shadow: var(--box-shadow);
        padding: var(--padding);
        transition: font-size .3s, font-weight .15s, color .3s, background-color .3s, opacity .3s, border .3s, box-shadow .3s ease-in-out;
        cursor: pointer;
        -webkit-mask-image: -webkit-radial-gradient(white, black);
    }
    :host(i-button:hover) {
        --size: ${size_hover ? size_hover : 'var(--primary-size-hover)'};
        --weight: ${weight_hover ? weight_hover : 'var(--primary-weight-hover)'};
        --color: ${color_hover ? color_hover : 'var(--primary-color-hover)'};
        --bg-color: ${bg_color_hover ? bg_color_hover : 'var(--primary-bg-color-hover)'};
        --border-color: ${border_color_hover ? border_color_hover : 'var(--primary-color-hover)'};
        --offset-x: ${offset_x_hover ? offset_x_hover : '0'};
        --offset-y: ${offset_y_hover ? offset_y_hover : '0'};
        --blur: ${blur_hover ? blur_hover : '50px'};
        --shadow-color: ${shadow_color_hover ? shadow_color_hover : 'var(--primary-color-hover)'};
        --shadow-opacity: ${shadow_opacity_hover ? shadow_opacity_hover : '0'};
    }
    :host(i-button:hover:foucs:active) {
        --bg-color: ${bg_color ? bg_color : 'var(--primary-bg-color)'};
    }
    :host(i-button) g {
        --icon-fill: ${icon_fill ? icon_fill : 'var(--primary-icon-fill)'};
        fill: hsl(var(--icon-fill));
        transition: fill 0.05s ease-in-out;
    }
    :host(i-button:hover) g {
        --icon-fill: ${icon_fill_hover ? icon_fill_hover : 'var(--primary-icon-fill-hover)'};
    }
    :host(i-button) .avatar {
        display: block;
        width: var(--avatar-width);
        height: var(--avatar-height);
        max-width: 100%;
        border-radius: var(--avatar-radius);
        -webkit-mask-image: -webkit-radial-gradient(white, black);
        overflow: hidden;
        transition: width .3s, height .3s ease-in-out;
        ${make_grid(grid.avatar)}
    }
    :host(i-button) img {
        --scale: ${scale ? scale : '1'};
        width: 100%;
        height: 100%;
        transform: scale(var(--scale));
        transition: transform 0.3s, scale 0.3s linear;
        object-fit: cover;
        border-radius: var(--avatar-radius);
    }
    :host(i-button:hover) img {
        --scale: ${scale_hover ? scale_hover : '1.2'};
        transform: scale(var(--scale));
    }
    :host(i-button) svg {
        width: 100%;
        height: auto;
    }
    :host(i-button[role="tab"]) {
        --width: ${width ? width : '100%'};
        --border-radius: ${border_radius ? border_radius : '0'};
    }
    :host(i-button[role="switch"]) {
        --size: ${size ? size : 'var(--primary-size)'};
    }
    :host(i-button[role="switch"]:hover) {
        --size: ${size_hover ? size_hover : 'var(--primary-size-hover)'};
    }
    :host(i-button[role="listbox"]) {
        --color: ${listbox_collapse_listbox_color ? listbox_collapse_listbox_color : 'var(--listbox-collapse-listbox-color)'};
        --size: ${listbox_collapse_listbox_size ? listbox_collapse_listbox_size : 'var(--listbox-collapse-listbox-size)'};
        --weight: ${listbox_collapse_listbox_weight ? listbox_collapse_listbox_weight : 'var(--listbox-collapse-listbox-weight)'};
    }
    :host(i-button[role="listbox"]:hover) {
        --color: ${listbox_collapse_listbox_color_hover ? listbox_collapse_listbox_color_hover : 'var(--listbox-collapse-listbox-color-hover)'};
        --size: ${listbox_collapse_listbox_size_hover ? listbox_collapse_listbox_size_hover : 'var(--listbox-collapse-listbox-size-hover)'};
        --weight: ${listbox_collapse_listbox_weight_hover ? listbox_collapse_listbox_weight_hover : 'var(--listbox-collapse-listbox-weight-hover)'};
    }
    :host(i-button[role="listbox"]) > .icon {
        ${grid.icon ? make_grid(grid.icon) : make_grid({column: '2'})}
    }
    :host(i-button[role="listbox"]) .text {}
    :host(i-button[role="listbox"]) .avatar {
        --avatar-width: ${listbox_collapse_listbox_avatar_width ? listbox_collapse_listbox_avatar_width : 'var(--listbox-collapse-listbox-avatar-width)'};
        --avatar-height: ${listbox_collapse_listbox_avatar_height ? listbox_collapse_listbox_avatar_height : 'var(--listbox-collapse-listbox-avatar-height)'}
    }
    :host(i-button[role="listbox"][aria-expanded="true"]),
    :host(i-button[role="listbox"][aria-expanded="true"]:hover) {
        --size: ${listbox_expanded_listbox_size ? listbox_expanded_listbox_size : 'var(--listbox-expanded-listbox-size)' };
        --color: ${listbox_expanded_listbox_color ? listbox_expanded_listbox_color : 'var(--listbox-expanded-listbox-color)' };
        --weight: ${listbox_expanded_listbox_weight ? listbox_expanded_listbox_weight : 'var(--listbox-expanded-listbox-weight)' };
    }
    :host(i-button[role="listbox"][aria-expanded="true"]) .avatar {
        --avatar-width: ${listbox_expanded_listbox_avatar_width ? listbox_expanded_listbox_avatar_width : 'var(--listbox-expanded-listbox-avatar-width)'};
        --avatar-height: ${listbox_expanded_listbox_avatar_height ? listbox_expanded_listbox_avatar_height : 'var(--listbox-expanded-listbox-avatar-height)'};
    }
    :host(i-button[role="option"]) {
        --border-radius: ${border_radius ? border_radius : '0'};
        --opacity: ${opacity ? opacity : '0'};
    }
    :host(i-button[role="option"][aria-current="true"]), :host(i-button[role="option"][aria-current="true"]:hover) {
        --size: ${current_size ? current_size : 'var(--current-list-size)'};
        --color: ${current_color ? current_color : 'var(--current-list-color)'};
        --bg-color: ${current_bg_color ? current_bg_color : 'var(--current-list-bg-color)'};
        --opacity: ${opacity ? opacity : '0'}
    }
    :host(i-button[role="option"][disabled]), :host(i-button[role="option"][disabled]:hover) {
        --size: ${disabled_size ? disabled_size : 'var(--primary-disabled-size)'};
        --color: ${disabled_color ? disabled_color : 'var(--primary-disabled-color)'};
        --bg-color: ${disabled_bg_color ? disabled_bg_color : 'var(--primary-disabled-bg-color)'};
        --opacity: ${opacity ? opacity : '0'}
    }
    :host(i-button[aria-disabled="true"]) .icon, 
    :host(i-button[aria-disabled="true"]:hover) .icon,
    :host(i-button[role="option"][aria-disabled="true"]) .icon, 
    :host(i-button[role="option"][aria-disabled="true"]:hover) .icon,
    :host(i-button[role="listbox"][aria-disabled="true"]) .icon, 
    :host(i-button[role="listbox"][aria-disabled="true"]:hover) .icon {
        --icon-size: ${disabled_icon_size ? disabled_icon_size : 'var(--primary-disabled-icon-size)'};
    }
    :host(i-button[disabled]:hover) img {
        transform: scale(1);
    }
    :host(i-button[aria-current="true"]), :host(i-button[aria-current="true"]:hover) {
        --size: ${current_size ? current_size : 'var(--current-size)'};
        --weight: ${current_weight ? current_weight : 'var(--current-weight)'};
        --color: ${current_color ? current_color : 'var(--current-color)'};
        --bg-color: ${current_bg_color ? current_bg_color : 'var(--current-bg-color)'};
    }
    :host(i-button[role="option"][aria-current="true"][aria-selected="true"]) .option > .icon, 
    :host(i-button[role="option"][aria-current="true"][aria-selected="true"]:hover) .option > .icon {
        --icon-size: ${current_icon_size ? current_icon_size : 'var(--current-icon-size)'};
    }
    :host(i-button[role="option"][aria-current="true"][aria-selected="true"]) .option > .icon g,
    :host(i-button[role="option"][aria-current="true"][aria-selected="true"]:hover) .option > .icon g {
        --icon-fill: ${current_icon_fill ? current_icon_fill : 'var(--current-icon-fill)'};
    }
    :host(i-button[aria-checked="true"]), :host(i-button[aria-expanded="true"]),
    :host(i-button[aria-checked="true"]:hover), :host(i-button[aria-expanded="true"]:hover) {
        --size: ${current_size ? current_size : 'var(--current-size)'};
        --weight: ${current_weight ? current_weight : 'var(--current-weight)'};
        --color: ${current_color ? current_color : 'var(--current-color)'};
        --bg-color: ${current_bg_color ? current_bg_color : 'var(--current-bg-color)'};
    }
    /* listbox collapse */
    :host(i-button[role="listbox"]) > .icon {
        --icon-size: ${listbox_collapse_icon_size ? listbox_collapse_icon_size : 'var(--listbox-collapse-icon-size)'};
    }
    :host(i-button[role="listbox"]:hover) > .icon {
        --icon-size: ${listbox_collapse_icon_size_hover ? listbox_collapse_icon_size_hover : 'var(--listbox-collapse-icon-size-hover)'};
    }
    :host(i-button[role="listbox"]) .listbox > .icon {
        --icon-size: ${listbox_collapse_listbox_icon_size ? listbox_collapse_listbox_icon_size : 'var(--listbox-collapse-listbox-icon-size)'};
    }
    :host(i-button[role="listbox"]:hover) .listbox > .icon {
        --icon-size: ${listbox_collapse_listbox_icon_size_hover ? listbox_collapse_listbox_icon_size_hover : 'var(--listbox-collapse-listbox-icon-size-hover)'};
    }
    :host(i-button[role="listbox"]) > .icon g {
        --icon-fill: ${listbox_collapse_icon_fill ? listbox_collapse_icon_fill : 'var(--listbox-collapse-icon-fill)'};
    }
    :host(i-button[role="listbox"]:hover) > .icon g {
        --icon-fill: ${listbox_collapse_icon_fill_hover ? listbox_collapse_icon_fill_hover : 'var(--listbox-collapse-icon-fill-hover)'};
    }
    :host(i-button[role="listbox"]) .listbox > .icon g {
        --icon-fill: ${listbox_collapse_listbox_icon_fill ? listbox_collapse_listbox_icon_fill : 'var(--listbox-collaps-listbox-icon-fill)'};
    }
    :host(i-button[role="listbox"]:hover) .listbox > .icon g {
        --icon-fill: ${listbox_collapse_listbox_icon_fill_hover ? listbox_collapse_listbox_icon_fill_hover : 'var(--listbox-collapse-listbox-icon-fill-hover)'};
    }
    /* listbox expanded */
    :host(i-button[role="listbox"][aria-expanded="true"]) > .icon,
    :host(i-button[role="listbox"][aria-expanded="true"]:hover) > .icon {
        --icon-size: ${listbox_expanded_icon_size ? listbox_expanded_icon_size : 'var(--listbox-expanded-icon-size)'};
    }
    :host(i-button[role="listbox"][aria-expanded="true"]) > .icon g, 
    :host(i-button[role="listbox"][aria-expanded="true"]:hover) > .icon g {
        --icon-fill: ${listbox_expanded_icon_fill ? listbox_expanded_icon_fill : 'var(--listbox-expanded-icon-fill)'}
    }
    :host(i-button[role="listbox"][aria-expanded="true"]) .listbox > .icon, 
    :host(i-button[role="listbox"][aria-expanded="true"]:hover) .listbox > .icon {
        --icon-fill: ${listbox_expanded_listbox_icon_size ? listbox_expanded_listbox_icon_size : 'var(--listbox-expanded-listbox-icon-size)'};
    }
    :host(i-button[role="listbox"][aria-expanded="true"]) .listbox > .icon g,
    :host(i-button[role="listbox"][aria-expanded="true"]:hover) .listbox > .icon g {
        --icon-fill: ${listbox_expanded_listbox_icon_fill ? listbox_expanded_listbox_icon_fill : 'var(--listbox-expanded-listbox-icon-fill)'};
    }
    :host(i-button[aria-checked="true"]) > .icon g {
        --icon-fill: ${current_icon_fill ? current_icon_fill : 'var(--color-white)' };
    }
    :host(i-button[disabled]), :host(i-button[disabled]:hover) {
        --size: ${disabled_size ? disabled_size : 'var(--primary-disabled-size)'};
        --color: ${disabled_color ? disabled_color : 'var(--primary-disabled-color)'};
        --bg-color: ${disabled_bg_color ? disabled_bg_color : 'var(--primary-disabled-bg-color)'};
        cursor: not-allowed;
    }
    :host(i-button[disabled]) g, 
    :host(i-button[disabled]:hover) g, 
    :host(i-button[role="option"][disabled]) > .icon g, 
    :host(i-button[role="option"][disabled]) .option > .icon g,
    :host(i-button[role="listbox"][disabled]) .option > .icon g, 
    :host(i-button[role="option"][disabled]:hover) > .icon g,
    :host(i-button[role="listbox"][disabled]:hover) .option > .icon g, 
    :host(i-button[role="option"][disabled]:hover) .option > .icon g {
        --icon-fill: ${disabled_color ? disabled_color : 'var(--primary-disabled-icon-fill)'};
    }
    :host(i-button[role="menuitem"]) {
        --size: ${size ? size : 'var(--menu-size)'};
        --weight: ${weight ? weight : 'var(--menu-weight)'};
        --color: ${color ? color : 'var(--menu-color)'};
        --border-radius: 0;
        background-color: transparent;
    }
    :host(i-button[role="menuitem"]:hover) {
        --size: ${size_hover ? size_hover : 'var(--menu-size-hover)'};
        --weight: ${weight_hover ? weight_hover : 'var(--menu-weight-hover)'};
        --color: ${color_hover ? color_hover : 'var(--menu-color-hover)'};
    }
    :host(i-button[role="menuitem"]) .avatar {
        --avatar-width: ${avatar_width ? avatar_width : 'var(--menu-avatar-width)'};
        --avatar-height: ${avatar_height ? avatar_height : 'var(--menu-avatar-height)'};
        --avatar-radius: ${avatar_radius ? avatar_radius : 'var(--menu-avatar-radius)'};
    }
    :host(i-button[role="menuitem"]:hover) .avatar {
        --avatar-width: ${avatar_width_hover ? avatar_width_hover : 'var(--menu-avatar-width-hover)'};
        --avatar-height: ${avatar_height_hover ? avatar_height_hover : 'var(--menu-avatar-height-hover)'};
    }
    :host(i-button[role="menuitem"][disabled]), :host(i-button[role="menuitem"][disabled]):hover {
        --size: ${disabled_size ? disabled_size : 'var(--menu-disabled-size)'};
        --color: ${disabled_color ? disabled_color : 'var(--menu-disabled-color)'};
        --weight: ${disabled_weight ? disabled_weight : 'var(--menu-disabled-weight)'};
    }
    :host(i-button[role="menuitem"][disabled]) g ,
    :host(i-button[role="menuitem"][disabled]:hover) g {
        --icon-fill: ${disabled_icon_fill ? disabled_icon_fill : 'var(--primary-disabled-icon-fill)'};
    }
    :host(i-button[role="option"]) > .icon {
        --icon-size: ${list_selected_icon_size ? list_selected_icon_size : 'var(--list-selected-icon-size)'};
    }
    :host(i-button[role="option"]:hover) > .icon {
        --icon-size: ${list_selected_icon_size_hover ? list_selected_icon_size_hover : 'var(--list-selected-icon-size-hover)'};
    }
    :host(i-button[role="option"]) > .icon g {
        --icon-fill: ${list_selected_icon_fill ? list_selected_icon_fill : 'var(--list-selected-icon-fill)'};
    }
    :host(i-button[role="option"]:hover) > .icon g {
        --icon-fill: ${list_selected_icon_fill_hover ? list_selected_icon_fill_hover : 'var(--list-selected-icon-fill-hover)'};
    }
    :host(i-button[role="option"][aria-current="true"]) > .icon, 
    :host(i-button[role="option"][aria-current="true"]:hover) > .icon {
        --icon-size: ${current_list_selected_icon_size ? current_list_selected_icon_size : 'var(--current-list-selected-icon-size)'};
    }
    :host(i-button[role="option"][aria-current="true"]) > .icon g, 
    :host(i-button[role="option"][aria-current="true"]:hover) > .icon g { 
        --icon-fill: ${current_list_selected_icon_fill ? current_list_selected_icon_fill : 'var(--current-list-selected-icon-fill)'};
    }
    :host(i-button[role="option"][aria-selected="false"]) > .icon {
        opacity: 0;
        transition: opacity 0.3s ease-in-out;
    }
    :host(i-button[role="option"][aria-selected="true"]) > .icon {
        opacity: 1;
    }
    /* define grid */
    :host(i-button) .text {
        ${make_grid(grid.text)}
    }
    :host(i-button) .icon {
        --icon-size: ${icon_size ? icon_size : 'var(--primary-icon-size)'};
        display: block;
        width: var(--icon-size);
        transition: width 0.25s ease-in-out;
        ${make_grid(grid.icon)}
    }
    :host(i-button:hover) .icon {
        --icon-size: ${icon_size_hover ? icon_size_hover : 'var(--primary-icon-size-hover)'};
    }
    :host(i-button) .listbox {
        display: grid;
        max-width: 100%;
        ${make_grid(grid_listbox)}
    }
    :host(i-button) .option {
        display: grid;
        max-width: 100%;
        ${make_grid(grid_option)}
    }
    :host(i-button) .option > .icon {
        ${make_grid(grid.option_icon)}
    }
    :host(i-button) .option > .avatar {
        ${make_grid(grid.option_avatar)}
    }
    :host(i-button) .option > .text {
        ${make_grid(grid.option_text)}
    }
    ${custom_style}
    `

    return widget()
}
},{"make-element":29,"make-grid":30,"make-icon":31,"make-image":32,"message-maker":33,"support-style-sheet":34}],29:[function(require,module,exports){
module.exports = make_element

function make_element({name = '', classlist = null, role }) {
    const el = document.createElement(name)
    if (classlist) ste_class()
    if (role) set_role()
    return el

    function ste_class () {
        el.className = classlist
    }
    
    function set_role () {
        const tabindex = role.match(/button|switch/) ? 0 : -1
        el.setAttribute('role', role)
        el.setAttribute('tabindex',  tabindex)
    }
}


},{}],30:[function(require,module,exports){
module.exports = make_grid

function make_grid (opts = {}) {
    const {areas, area, rows, columns, row, auto = {}, column, gap, justify, align} = opts
    let style = ''
    grid_init ()
    return style

    function grid_init () {
        make_rows()
        make_columns()
        make_auto()
        make_row()
        make_column()
        make_justify()
        make_align()
        make_gap()
        make_area()
        make_areas()
    }
     
    function make_areas () {
        if (typeof areas === 'object') {
            let template = `grid-template-areas:`
            areas.map( a => template += `"${a}"`)
            return style += template + ';'
        }
        if (typeof areas === 'string') return areas ? style +=`grid-template-areas: "${areas}";` : ''
    }
    function make_area () {
        return area ? style += `grid-area: ${area};` : ''
    }

    function make_rows () { 
        return rows ? style +=  `grid-template-rows: ${rows};` : ''
    }

    function make_columns () {
        return columns ? style += `grid-template-columns: ${columns};` : ''
    }

    function make_row () {
        return row ? style += `grid-row: ${row};` : ''
    }

    function make_column () {
        return column ? style += `grid-column: ${column};` : ''
    }

    function make_justify () {
        if (justify === void 0) return
        const result = justify.split('-')
        const [type, method] = result
        return style += `justify-${type}: ${method};`
    }

    function make_align () {
        if (align === void 0) return
        const result = align.split('-')
        const [type, method] = result
        return style += `align-${type}: ${method};`
    }

    function make_gap () {
        if (gap === void 0) return ''
        return style += `gap: ${gap};`
    }

    function make_auto () {
        const {auto_flow = null, auto_rows = null, auto_columns = null} = auto
        const grid_auto_flow = auto_flow ? `grid-auto-flow: ${auto_flow};` : ''
        const grid_auto_rows = auto_rows ? `grid-auto-rows: ${auto_rows};` : ''
        const grid_auto_columns = auto_columns ? `grid-auto-columns: ${auto_columns};` : ''
        return style += `${grid_auto_flow}${grid_auto_rows}${grid_auto_columns}`
    }
}
},{}],31:[function(require,module,exports){
const i_icon = require('datdot-ui-icon')

module.exports = {main_icon, select_icon, list_icon}

function main_icon ({name, path}) {
    const el = i_icon({name, path})
    return el
}

function select_icon ({name = 'arrow-down', path}) {
    const el =  i_icon({name, path})
    return el
}

function list_icon ({name = 'check', path} ) {
    const el =  i_icon({name, path})
    return el
}


},{"datdot-ui-icon":35}],32:[function(require,module,exports){
module.exports = img

function img ({src, alt}) {
    const img = document.createElement('img')
    img.setAttribute('src', src)
    img.setAttribute('alt', alt)
    return img
}
},{}],33:[function(require,module,exports){
arguments[4][26][0].apply(exports,arguments)
},{"dup":26}],34:[function(require,module,exports){
arguments[4][27][0].apply(exports,arguments)
},{"dup":27}],35:[function(require,module,exports){
const style_sheet = require('support-style-sheet')
const svg = require('svg')

module.exports = ({name, path, is_shadow = false, theme}) => {
    const url = path ? path : './src/svg'
    const symbol = svg(`${url}/${name}.svg`)
    if (is_shadow) {
        function layout (style) {
            const icon = document.createElement('i-icon')
            const shadow = icon.attachShadow({mode: 'closed'})
            const slot = document.createElement('slot')
            slot.name = 'icon'
            style_sheet(shadow, style)
            slot.append(symbol)
            shadow.append(slot)
            return icon
        }
        // insert CSS style
        const custom_style = theme ? theme.style : ''
        // set CSS variables
        if (theme && theme.props) {
            var { fill, size } = theme.props
        }
        const style = `
        :host(i-icon) {
            --size: ${size ? size : '24px'};
            --fill: ${fill ? fill : 'var(--primary-color)'};
            display: block;
        }
        slot[name='icon'] {
            display: grid;
            justify-content: center;
            align-items: center;
        }
        slot[name='icon'] span {
            display: block;
            width: var(--size);
            height: var(--size);
        }
        slot[name='icon'] svg {
            width: 100%;
            height: auto;
        }
        slot[name='icon'] g {
            fill: hsl(var(--fill));
            transition: fill .3s ease-in-out;
        }
        ${custom_style}
        `
        return layout(style)
    }

    return symbol
}

},{"support-style-sheet":36,"svg":37}],36:[function(require,module,exports){
arguments[4][27][0].apply(exports,arguments)
},{"dup":27}],37:[function(require,module,exports){
module.exports = svg
function svg (path) {
    const span = document.createElement('span')
    span.classList.add('icon')
    get_svg()
    async function get_svg () {
        const res = await fetch(path)
        if (res.status !== 200) throw new Error(res.status)
        let data = await res.text()
        span.innerHTML = data
    }
    return span
}   
},{}],38:[function(require,module,exports){
module.exports = attributeToProperty

var transform = {
  'class': 'className',
  'for': 'htmlFor',
  'http-equiv': 'httpEquiv'
}

function attributeToProperty (h) {
  return function (tagName, attrs, children) {
    for (var attr in attrs) {
      if (attr in transform) {
        attrs[transform[attr]] = attrs[attr]
        delete attrs[attr]
      }
    }
    return h(tagName, attrs, children)
  }
}

},{}],39:[function(require,module,exports){
var attrToProp = require('hyperscript-attribute-to-property')

var VAR = 0, TEXT = 1, OPEN = 2, CLOSE = 3, ATTR = 4
var ATTR_KEY = 5, ATTR_KEY_W = 6
var ATTR_VALUE_W = 7, ATTR_VALUE = 8
var ATTR_VALUE_SQ = 9, ATTR_VALUE_DQ = 10
var ATTR_EQ = 11, ATTR_BREAK = 12
var COMMENT = 13

module.exports = function (h, opts) {
  if (!opts) opts = {}
  var concat = opts.concat || function (a, b) {
    return String(a) + String(b)
  }
  if (opts.attrToProp !== false) {
    h = attrToProp(h)
  }

  return function (strings) {
    var state = TEXT, reg = ''
    var arglen = arguments.length
    var parts = []

    for (var i = 0; i < strings.length; i++) {
      if (i < arglen - 1) {
        var arg = arguments[i+1]
        var p = parse(strings[i])
        var xstate = state
        if (xstate === ATTR_VALUE_DQ) xstate = ATTR_VALUE
        if (xstate === ATTR_VALUE_SQ) xstate = ATTR_VALUE
        if (xstate === ATTR_VALUE_W) xstate = ATTR_VALUE
        if (xstate === ATTR) xstate = ATTR_KEY
        if (xstate === OPEN) {
          if (reg === '/') {
            p.push([ OPEN, '/', arg ])
            reg = ''
          } else {
            p.push([ OPEN, arg ])
          }
        } else if (xstate === COMMENT && opts.comments) {
          reg += String(arg)
        } else if (xstate !== COMMENT) {
          p.push([ VAR, xstate, arg ])
        }
        parts.push.apply(parts, p)
      } else parts.push.apply(parts, parse(strings[i]))
    }

    var tree = [null,{},[]]
    var stack = [[tree,-1]]
    for (var i = 0; i < parts.length; i++) {
      var cur = stack[stack.length-1][0]
      var p = parts[i], s = p[0]
      if (s === OPEN && /^\//.test(p[1])) {
        var ix = stack[stack.length-1][1]
        if (stack.length > 1) {
          stack.pop()
          stack[stack.length-1][0][2][ix] = h(
            cur[0], cur[1], cur[2].length ? cur[2] : undefined
          )
        }
      } else if (s === OPEN) {
        var c = [p[1],{},[]]
        cur[2].push(c)
        stack.push([c,cur[2].length-1])
      } else if (s === ATTR_KEY || (s === VAR && p[1] === ATTR_KEY)) {
        var key = ''
        var copyKey
        for (; i < parts.length; i++) {
          if (parts[i][0] === ATTR_KEY) {
            key = concat(key, parts[i][1])
          } else if (parts[i][0] === VAR && parts[i][1] === ATTR_KEY) {
            if (typeof parts[i][2] === 'object' && !key) {
              for (copyKey in parts[i][2]) {
                if (parts[i][2].hasOwnProperty(copyKey) && !cur[1][copyKey]) {
                  cur[1][copyKey] = parts[i][2][copyKey]
                }
              }
            } else {
              key = concat(key, parts[i][2])
            }
          } else break
        }
        if (parts[i][0] === ATTR_EQ) i++
        var j = i
        for (; i < parts.length; i++) {
          if (parts[i][0] === ATTR_VALUE || parts[i][0] === ATTR_KEY) {
            if (!cur[1][key]) cur[1][key] = strfn(parts[i][1])
            else parts[i][1]==="" || (cur[1][key] = concat(cur[1][key], parts[i][1]));
          } else if (parts[i][0] === VAR
          && (parts[i][1] === ATTR_VALUE || parts[i][1] === ATTR_KEY)) {
            if (!cur[1][key]) cur[1][key] = strfn(parts[i][2])
            else parts[i][2]==="" || (cur[1][key] = concat(cur[1][key], parts[i][2]));
          } else {
            if (key.length && !cur[1][key] && i === j
            && (parts[i][0] === CLOSE || parts[i][0] === ATTR_BREAK)) {
              // https://html.spec.whatwg.org/multipage/infrastructure.html#boolean-attributes
              // empty string is falsy, not well behaved value in browser
              cur[1][key] = key.toLowerCase()
            }
            if (parts[i][0] === CLOSE) {
              i--
            }
            break
          }
        }
      } else if (s === ATTR_KEY) {
        cur[1][p[1]] = true
      } else if (s === VAR && p[1] === ATTR_KEY) {
        cur[1][p[2]] = true
      } else if (s === CLOSE) {
        if (selfClosing(cur[0]) && stack.length) {
          var ix = stack[stack.length-1][1]
          stack.pop()
          stack[stack.length-1][0][2][ix] = h(
            cur[0], cur[1], cur[2].length ? cur[2] : undefined
          )
        }
      } else if (s === VAR && p[1] === TEXT) {
        if (p[2] === undefined || p[2] === null) p[2] = ''
        else if (!p[2]) p[2] = concat('', p[2])
        if (Array.isArray(p[2][0])) {
          cur[2].push.apply(cur[2], p[2])
        } else {
          cur[2].push(p[2])
        }
      } else if (s === TEXT) {
        cur[2].push(p[1])
      } else if (s === ATTR_EQ || s === ATTR_BREAK) {
        // no-op
      } else {
        throw new Error('unhandled: ' + s)
      }
    }

    if (tree[2].length > 1 && /^\s*$/.test(tree[2][0])) {
      tree[2].shift()
    }

    if (tree[2].length > 2
    || (tree[2].length === 2 && /\S/.test(tree[2][1]))) {
      if (opts.createFragment) return opts.createFragment(tree[2])
      throw new Error(
        'multiple root elements must be wrapped in an enclosing tag'
      )
    }
    if (Array.isArray(tree[2][0]) && typeof tree[2][0][0] === 'string'
    && Array.isArray(tree[2][0][2])) {
      tree[2][0] = h(tree[2][0][0], tree[2][0][1], tree[2][0][2])
    }
    return tree[2][0]

    function parse (str) {
      var res = []
      if (state === ATTR_VALUE_W) state = ATTR
      for (var i = 0; i < str.length; i++) {
        var c = str.charAt(i)
        if (state === TEXT && c === '<') {
          if (reg.length) res.push([TEXT, reg])
          reg = ''
          state = OPEN
        } else if (c === '>' && !quot(state) && state !== COMMENT) {
          if (state === OPEN && reg.length) {
            res.push([OPEN,reg])
          } else if (state === ATTR_KEY) {
            res.push([ATTR_KEY,reg])
          } else if (state === ATTR_VALUE && reg.length) {
            res.push([ATTR_VALUE,reg])
          }
          res.push([CLOSE])
          reg = ''
          state = TEXT
        } else if (state === COMMENT && /-$/.test(reg) && c === '-') {
          if (opts.comments) {
            res.push([ATTR_VALUE,reg.substr(0, reg.length - 1)])
          }
          reg = ''
          state = TEXT
        } else if (state === OPEN && /^!--$/.test(reg)) {
          if (opts.comments) {
            res.push([OPEN, reg],[ATTR_KEY,'comment'],[ATTR_EQ])
          }
          reg = c
          state = COMMENT
        } else if (state === TEXT || state === COMMENT) {
          reg += c
        } else if (state === OPEN && c === '/' && reg.length) {
          // no-op, self closing tag without a space <br/>
        } else if (state === OPEN && /\s/.test(c)) {
          if (reg.length) {
            res.push([OPEN, reg])
          }
          reg = ''
          state = ATTR
        } else if (state === OPEN) {
          reg += c
        } else if (state === ATTR && /[^\s"'=/]/.test(c)) {
          state = ATTR_KEY
          reg = c
        } else if (state === ATTR && /\s/.test(c)) {
          if (reg.length) res.push([ATTR_KEY,reg])
          res.push([ATTR_BREAK])
        } else if (state === ATTR_KEY && /\s/.test(c)) {
          res.push([ATTR_KEY,reg])
          reg = ''
          state = ATTR_KEY_W
        } else if (state === ATTR_KEY && c === '=') {
          res.push([ATTR_KEY,reg],[ATTR_EQ])
          reg = ''
          state = ATTR_VALUE_W
        } else if (state === ATTR_KEY) {
          reg += c
        } else if ((state === ATTR_KEY_W || state === ATTR) && c === '=') {
          res.push([ATTR_EQ])
          state = ATTR_VALUE_W
        } else if ((state === ATTR_KEY_W || state === ATTR) && !/\s/.test(c)) {
          res.push([ATTR_BREAK])
          if (/[\w-]/.test(c)) {
            reg += c
            state = ATTR_KEY
          } else state = ATTR
        } else if (state === ATTR_VALUE_W && c === '"') {
          state = ATTR_VALUE_DQ
        } else if (state === ATTR_VALUE_W && c === "'") {
          state = ATTR_VALUE_SQ
        } else if (state === ATTR_VALUE_DQ && c === '"') {
          res.push([ATTR_VALUE,reg],[ATTR_BREAK])
          reg = ''
          state = ATTR
        } else if (state === ATTR_VALUE_SQ && c === "'") {
          res.push([ATTR_VALUE,reg],[ATTR_BREAK])
          reg = ''
          state = ATTR
        } else if (state === ATTR_VALUE_W && !/\s/.test(c)) {
          state = ATTR_VALUE
          i--
        } else if (state === ATTR_VALUE && /\s/.test(c)) {
          res.push([ATTR_VALUE,reg],[ATTR_BREAK])
          reg = ''
          state = ATTR
        } else if (state === ATTR_VALUE || state === ATTR_VALUE_SQ
        || state === ATTR_VALUE_DQ) {
          reg += c
        }
      }
      if (state === TEXT && reg.length) {
        res.push([TEXT,reg])
        reg = ''
      } else if (state === ATTR_VALUE && reg.length) {
        res.push([ATTR_VALUE,reg])
        reg = ''
      } else if (state === ATTR_VALUE_DQ && reg.length) {
        res.push([ATTR_VALUE,reg])
        reg = ''
      } else if (state === ATTR_VALUE_SQ && reg.length) {
        res.push([ATTR_VALUE,reg])
        reg = ''
      } else if (state === ATTR_KEY) {
        res.push([ATTR_KEY,reg])
        reg = ''
      }
      return res
    }
  }

  function strfn (x) {
    if (typeof x === 'function') return x
    else if (typeof x === 'string') return x
    else if (x && typeof x === 'object') return x
    else if (x === null || x === undefined) return x
    else return concat('', x)
  }
}

function quot (state) {
  return state === ATTR_VALUE_SQ || state === ATTR_VALUE_DQ
}

var closeRE = RegExp('^(' + [
  'area', 'base', 'basefont', 'bgsound', 'br', 'col', 'command', 'embed',
  'frame', 'hr', 'img', 'input', 'isindex', 'keygen', 'link', 'meta', 'param',
  'source', 'track', 'wbr', '!--',
  // SVG TAGS
  'animate', 'animateTransform', 'circle', 'cursor', 'desc', 'ellipse',
  'feBlend', 'feColorMatrix', 'feComposite',
  'feConvolveMatrix', 'feDiffuseLighting', 'feDisplacementMap',
  'feDistantLight', 'feFlood', 'feFuncA', 'feFuncB', 'feFuncG', 'feFuncR',
  'feGaussianBlur', 'feImage', 'feMergeNode', 'feMorphology',
  'feOffset', 'fePointLight', 'feSpecularLighting', 'feSpotLight', 'feTile',
  'feTurbulence', 'font-face-format', 'font-face-name', 'font-face-uri',
  'glyph', 'glyphRef', 'hkern', 'image', 'line', 'missing-glyph', 'mpath',
  'path', 'polygon', 'polyline', 'rect', 'set', 'stop', 'tref', 'use', 'view',
  'vkern'
].join('|') + ')(?:[\.#][a-zA-Z0-9\u007F-\uFFFF_:-]+)*$')
function selfClosing (tag) { return closeRE.test(tag) }

},{"hyperscript-attribute-to-property":38}],40:[function(require,module,exports){
var inserted = {};

module.exports = function (css, options) {
    if (inserted[css]) return;
    inserted[css] = true;
    
    var elem = document.createElement('style');
    elem.setAttribute('type', 'text/css');

    if ('textContent' in elem) {
      elem.textContent = css;
    } else {
      elem.styleSheet.cssText = css;
    }
    
    var head = document.getElementsByTagName('head')[0];
    if (options && options.prepend) {
        head.insertBefore(elem, head.childNodes[0]);
    } else {
        head.appendChild(elem);
    }
};

},{}],41:[function(require,module,exports){
const bel = require('bel')
const style_sheet = require('support-style-sheet')
const {i_button, i_link} = require('datdot-ui-button')
const button = i_button
const message_maker = require('message-maker')
module.exports = i_list

function i_list (opts = {}, protocol) {
    const {page = '*', flow = 'ui-list', name, body = [{text: 'no items'}], mode = 'multiple-select', expanded = false, hidden = true, theme = {} } = opts
    const recipients = []
    const make = message_maker(`${name} / ${flow} / i_list`)
    const message = make({type: 'ready'})
    let is_hidden = hidden
    let is_expanded = !is_hidden ? !is_hidden : expanded
    const store_selected = []
    const {grid} = theme

    function widget () {
        const send = protocol( get )
        send(message)
        const list = document.createElement('i-list')
        const shadow = list.attachShadow({mode: 'open'})
        list.ariaHidden = is_hidden
        list.ariaLabel = name
        list.tabIndex = -1
        list.ariaExpanded = is_expanded
        list.dataset.mode = mode
        style_sheet(shadow, style)
        try {
            if (mode.match(/single|multiple/)) {
                list.setAttribute('role', 'listbox')
                make_select_list()
            }   
            if (mode.match(/dropdown/)) {
                list.setAttribute('role', 'menubar')
                make_list()
            }
            if (body.length === 0) send(make({type: 'error', data: 'body no items'}))
        } catch(e) {
            send(make({type: 'error', data: {message: 'something went wrong', opts }}))
        }
        
        return list

        function make_list () {
            return body.map( (list, i) => {
                const {text = undefined, role = 'link', url = '#', target, icon, cover, disabled = false, theme = {}} = list
                const {style = ``, props = {}} = theme
                const {
                    size = `var(--primary-size)`, 
                    size_hover = `var(--primary-size)`, 
                    color = `var(--primary-color)`, 
                    color_hover = `var(--primary-color-hover)`,     
                    bg_color = 'var(--primary-bg-color)', 
                    bg_color_hover = 'var(--primary-bg-color-hover)', 
                    icon_fill = 'var(--primary-color)', 
                    icon_fill_hover = 'var(--primary-color-hover)', 
                    icon_size = 'var(--primary-icon-size)', 
                    avatar_width = 'var(--primary-avatar-width)', 
                    avatar_height = 'var(--primary-avatar-height)', 
                    avatar_radius = 'var(--primary-avatar-radius)',
                    disabled_color = 'var(--primary-disabled-color)',
                    disabled_bg_color = 'var(--primary-disabled-bg-color)',
                    disabled_icon_fill = 'var(--primary-disabled-icon-fill)',
                } = props
                var item = text
                if (role === 'link' ) {
                    var item = i_link({
                        page,
                        name: text,
                        body: text,
                        role: 'menuitem',
                        link: {
                            url,
                            target
                        },
                        icons: {
                            icon
                        },
                        cover,
                        disabled,
                        theme: {
                            style,
                            props: {
                                size,
                                size_hover,
                                color,
                                color_hover,
                                bg_color,
                                bg_color_hover,
                                icon_fill,
                                icon_fill_hover,
                                icon_size,
                                avatar_width,
                                avatar_height,
                                avatar_radius,
                                disabled_color,
                                disabled_bg_color,
                                disabled_icon_fill,
                            },
                            grid
                        }
                    }, button_protocol(text))
                }
                if (role === 'menuitem') {
                    var item = i_button({
                        name: text,
                        body: text,
                        role,
                        icons: {
                            icon
                        },
                        cover,
                        disabled,
                        theme: {
                            style,
                            props: {
                                size,
                                size_hover,
                                color,
                                color_hover,
                                icon_fill,
                                icon_fill_hover,
                                icon_size,
                                avatar_width,
                                avatar_height,
                                avatar_radius,
                                disabled_color,
                                disabled_icon_fill,
                            },
                            grid
                        }
                    }, button_protocol(text))
                }
                
                const li = bel`<li role="none">${item}</li>`
                if (disabled) li.setAttribute('disabled', disabled)
                shadow.append(li)
            })
            
        }
        function make_select_list () {
            return body.map( (option, i) => {
                const {text, icon, list, cover, current = false, selected = false, disabled = false, theme = {}} = option
                const is_current = mode === 'single-select' ? current : false
                const {style = ``, props = {}} = theme
                const {
                    size = 'var(--primary-size)', 
                    size_hover = 'var(--primary-size)',
                    weight = '300', 
                    color = 'var(--primary-color)', 
                    color_hover = 'var(--primary-color-hover)', 
                    bg_color = 'var(--primary-bg-color)', 
                    bg_color_hover = 'var(--primary-bg-color-hover)', 
                    icon_size = 'var(--primary-icon-size)',
                    icon_fill = 'var(--primary-icon-fill)',
                    icon_fill_hover = 'var(--primary-icon-fill-hover)',
                    avatar_width = 'var(--primary-avatar-width)', 
                    avatar_height = 'var(--primary-avatar-height)', 
                    avatar_radius = 'var(--primary-avatar-radius)',
                    current_size = 'var(--current-list-size)',
                    current_color = 'var(--current-list-color)',
                    current_weight = 'var(--current-list-weight)',
                    current_icon_size = 'var(--current-icon-size)',
                    current_icon_fill = 'var(--current-icon-fill)',
                    current_list_selected_icon_size = 'var(--current-list-selected-icon-size)',
                    current_list_selected_icon_fill = 'var(--current-list-selected-icon-fill)',
                    list_selected_icon_size = 'var(--list-selected-icon-size)',
                    list_selected_icon_fill = 'var(--list-selected-icon-fill)',
                    list_selected_icon_fill_hover = 'var(--list-selected-icon-fill-hover)',
                    disabled_color = 'var(--primary-disabled-color)',
                    disabled_bg_color = 'var(--primary-disabled-bg-color)',
                    disabled_icon_fill = 'var(--primary-disabled-fill)',
                    opacity = '0'
                } = props

                const item = button(
                {
                    page, 
                    name: text, 
                    body: text,
                    cover,
                    role: 'option',
                    mode,
                    icons: {
                        icon,
                        list
                    },
                    current: is_current, 
                    selected,
                    disabled,
                    theme: {
                        style,
                        props: {
                            size,
                            size_hover,
                            weight,
                            color,
                            color_hover,
                            bg_color,
                            bg_color_hover,
                            icon_size,
                            icon_fill,
                            icon_fill_hover,
                            avatar_width,
                            avatar_height,
                            avatar_radius,
                            current_size,
                            current_color,
                            current_weight,
                            current_icon_size,
                            current_icon_fill,
                            current_list_selected_icon_size,
                            current_list_selected_icon_fill,
                            list_selected_icon_size,
                            list_selected_icon_fill,
                            list_selected_icon_fill_hover,
                            disabled_color,
                            disabled_bg_color,
                            disabled_icon_fill,
                            opacity
                        },
                        grid
                    }
                }, button_protocol(text))
                const li = (text === 'no items') 
                ? bel`<li role="listitem" data-option=${text}">${text}</li>`
                : bel`<li role="option" data-option=${text}" aria-selected=${is_current ? is_current : selected}>${item}</li>`
                if (is_current) li.setAttribute('aria-current', is_current)
                if (disabled) li.setAttribute('disabled', disabled)
                const option_list = text.toLowerCase().split(' ').join('-')
                const make = message_maker(`${option_list} / option / ${flow} / widget`)
                send( make({type: 'ready'}) )
                shadow.append(li)
            })
        }
        function handle_expanded_event (data) {
            list.setAttribute('aria-hidden', data)
            list.setAttribute('aria-expanded', !data)
        }
        function handle_mutiple_selected (from, lists) {
            // Old codes
            // const make = message_maker(`${from} / option / ${flow}`)
            // const arr = []
            // args.forEach( child => {
            //     if (child.dataset.option === from ) child.setAttribute('aria-selected', selected )
            //     if (child.getAttribute('aria-selected') === 'true') arr[arr.length] = child.dataset.option
            // })
            // recipients[from]( make({type, data: selected}) )
            // send( make({to: name, type, data: {mode, selected: arr, length: arr.length}}))
            // New codes for store data
            body.map((obj, index) => {
                const state = obj.text === from
                const make = message_maker(`${obj.text} / option / ${flow}`)
                if (state) obj.selected = !obj.selected
                const type = obj.selected ? 'selected' : 'unselected'
                lists[index].setAttribute('aria-selected', obj.selected)
                store_data = body
                if (state) recipients[from]( make({type, data: obj.selected}) )
                send( make({to: name, type, data: {mode, selected: store_data}}))
            })
        }

        function handle_single_selected (from, lists) {
            // Old codes
            // args.forEach( child => {
            //     const state = from === child.dataset.option ? selected : !selected
            //     const current = state ? from : child.dataset.option
            //     const make = message_maker(`${current} / option / ${flow}`)
            //     const type = state ? 'selected' : 'unselected'
            //     list.setAttribute('aria-activedescendant', from)
            //     child.setAttribute('aria-selected', state )
            //     if (state) child.setAttribute('aria-current', state)
            //     else child.removeAttribute('aria-current')
            //     recipients[current]( make({type, data: state}) )
            //     send(make({to: name, type, data: {mode, selected: from} }))
            // })
            // New codes for store data
            body.map((obj, index) => {
                const state = obj.text === from
                const current = state ? from : lists[index].dataset.option
                const make = message_maker(`${current} / option / ${flow}`)
                const type = state ? 'selected' : 'unselected'
                obj.selected = state
                obj.current = state
                lists[index].setAttribute('aria-activedescendant', from)
                lists[index].setAttribute('aria-selected', obj.selected)
                if (state) lists[index].setAttribute('aria-current', obj.current)
                else lists[index].removeAttribute('aria-current')
                store_data = body
                recipients[current]( make({type, data: state}) )
                send(make({to: name, type, data: {mode, selected: store_data} }))
            })
        }
        function handle_select_event (from) {
            const { childNodes } = shadow
            const lists = shadow.firstChild.tagName !== 'STYLE' ? childNodes : [...childNodes].filter( (child, index) => index !== 0)
            if (mode === 'single-select')  handle_single_selected (from, lists)
            if (mode === 'multiple-select') handle_mutiple_selected (from, lists)
        }
        function button_protocol (name) {
            return (send) => {
                recipients[name] = send
                return get
            }
        }
        function handle_click_event(msg) {
            const {head, type, data} = msg
            const role = head[0].split(' / ')[1]
            const from = head[0].split(' / ')[0]
            const make = message_maker(`${from} / ${role} / ${flow}`)
            const message = make({to: '*', type, data})
            send(message)
        }
        function get (msg) {
            const {head, refs, type, data} = msg
            const to = head[1]
            const id = head[2]
            const role = head[0].split(' / ')[1]
            const from = head[0].split(' / ')[0]
            if (role === 'menuitem') return handle_click_event(msg)
            if (type === 'click' && role === 'option') return handle_select_event(from)
            if (type.match(/expanded|collapsed/)) return handle_expanded_event(data)
        }
    }

    // insert CSS style
    const custom_style = theme ? theme.style : ''
    // set CSS variables
    if (theme && theme.props) {
    var {
        bg_color, bg_color_hover,
        current_bg_color, current_bg_color_hover, disabled_bg_color,
        width, height, border_width, border_style, border_opacity, border_color,
        border_color_hover, border_radius, padding,  opacity,
        shadow_color, offset_x, offset_y, blur, shadow_opacity,
        shadow_color_hover, offset_x_hover, offset_y_hover, blur_hover, shadow_opacity_hover
    } = theme.props
    }

    const style = `
    :host(i-list) {
        ${width && 'width: var(--width);'};
        ${height && 'height: var(--height);'};
        display: grid;
        margin-top: 5px;
        max-width: 100%;
    }
    :host(i-list[aria-hidden="true"]) {
        opacity: 0;
        animation: close 0.3s;
        pointer-events: none;
    }
    :host([aria-hidden="false"]) {
        display: grid;
        animation: open 0.3s;
    }
    li {
        --bg-color: ${bg_color ? bg_color : 'var(--primary-bg-color)'};
        --border-radius: ${border_radius ? border_radius : 'var(--primary-radius)'};
        --border-width: ${border_width ? border_width : 'var(--primary-border-width)'};
        --border-style: ${border_style ? border_style : 'var(--primary-border-style)'};
        --border-color: ${border_color ? border_color : 'var(--primary-border-color)'};
        --border-opacity: ${border_opacity ? border_opacity : 'var(--primary-border-opacity)'};
        --border: var(--border-width) var(--border-style) hsla(var(--border-color), var(--border-opacity));
        display: grid;
        grid-template-columns: 1fr;
        background-color: hsl(var(--bg-color));
        border: var(--border);
        margin-top: -1px;
        cursor: pointer;
        transition: background-color 0.3s ease-in-out;
    }
    li:hover {
        --bg-color: ${bg_color_hover ? bg_color_hover : 'var(--primary-bg-color-hover)'};
    }
    :host(i-list) li:nth-of-type(1) {
        border-top-left-radius: var(--border-radius);
        border-top-right-radius: var(--border-radius);
    }
    li:last-child {
        border-bottom-left-radius: var(--border-radius);
        border-bottom-right-radius: var(--border-radius);
    }
    [role="listitem"] {
        display: grid;
        grid-template-rows: 24px;
        padding: 11px;
        align-items: center;
    }
    [role="listitem"]:hover {
        cursor: default;
    }
    li[disabled="true"], li[disabled="true"]:hover {
        background-color: ${disabled_bg_color ? disabled_bg_color : 'var(--primary-disabled-bg-color)'};
        cursor: not-allowed;
    }
    [role="none"] {
        --bg-color: var(--list-bg-color);
        --opacity: 1;
        background-color: hsla(var(--bg-color), var(--opacity));
    }
    [role="none"]:hover {
        --bg-color: var(--list-bg-color-hover);
        --opacity: 1;
        background-color: hsla(var(--bg-color), var(--opacity));
    }
    [role="none"] i-link {
        padding: 12px;
    }
    [role="option"] i-button.icon-right, [role="option"] i-button.text-left {
        grid-template-columns: auto 1fr auto;
    }
    [aria-current="true"] {
        --bg-color: ${current_bg_color ? current_bg_color : 'var(--current-bg-color)'};
    }
    @keyframes close {
        0% {
            opacity: 1;
        }
        100% {
            opacity: 0;
        }
    }
    @keyframes open {
        0% {
            opacity: 0;
        }
        100% {
            opacity: 1;
        }
    }
    ${custom_style}
    `

    return widget()
}
},{"bel":4,"datdot-ui-button":28,"message-maker":42,"support-style-sheet":43}],42:[function(require,module,exports){
arguments[4][26][0].apply(exports,arguments)
},{"dup":26}],43:[function(require,module,exports){
arguments[4][27][0].apply(exports,arguments)
},{"dup":27}]},{},[1]);
