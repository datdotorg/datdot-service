(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const head = require('head')()
const bel = require('bel')
const csjs = require('csjs-inject')
const { i_button, i_link } = require('..')
// custom element
const img_btn = require('img-btn')
// datdot-ui dependences
const terminal = require('datdot-terminal')
const icon = require('datdot-ui-icon')
const message_maker = require('../src/node_modules/message-maker')
const button = i_button
const link = i_link

function demo () {
    // save protocol callbacks
    let recipients = []
    // logs must be initialized first before components
    const logs = terminal(
    {
        mode: 'comfortable', 
        expanded: true
    }, protocol('logs'))
    // buttons
    const primary = button(
    {
        name: 'primary', 
        body: `<div>Hello</div>`,
        theme:
        { 
            style: ` `, 
            props: {
                // border_width: '2px',
                // border_style: 'dashed',
                // border_color: 'var(--color-yellow)',
                // color_hover: 'var(--color-white)',
                // size_hover: 'var(--size16)',
                // bg_color_hover: 'var(--color-black)',
            }
        }
    }, protocol('primary'))

    // image buttons
    const thumb1_btn = button(
    {
        name: 'thumb-cover', 
        body: 'Cover',
        cover: 'https://cdn.pixabay.com/photo/2021/08/14/04/15/mountains-6544522_960_720.jpg',
        theme:
        { 
            props: {
                width: '50vw',
                size_hover: '25px',
                // avatar_width: '100%',
            },
            grid: {
                button: {
                    rows: '1fr auto',
                    justify: 'items-center'
                },
                text: {
                    row: '2'
                }
            }
        }
    }, protocol('thumb-cover'))
    
    const thumb2_btn = button(
    {
        name: 'thumb-blossom', 
        role: 'switch', 
        body: 'Blossom', 
        cover: 'https://cdn.pixabay.com/photo/2016/02/27/06/43/cherry-blossom-tree-1225186_960_720.jpg',
        // checked: false, 
        theme : {
            style: ``,
            props: {
                size_hover: 'var(--size26)',
            }
        }
    }, protocol('thumb-blossom'))

    const rabbit_btn = img_btn(
    {
        name: 'rabbit', 
        body: 'Rabbit', 
        icon: {icon_name: 'rabbit'},
        cover: 'https://images.unsplash.com/photo-1629122307243-c913571a1df6?ixid=MnwxMjA3fDB8MHxlZGl0b3JpYWwtZmVlZHw5MXx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        props: {
            // color_hover: 'var(--color-amaranth-pink)',
            // icon_fill: 'var(--color-amaranth-pink)',
            // icon_fill_hover: 'var(--color-amaranth-pink)',
        }
    }, i_button, protocol('rabbit'))
    const dog_btn = img_btn(
    {
        name: 'dog', 
        body: 'Dog',
        cover: 'https://images.unsplash.com/photo-1520087619250-584c0cbd35e8?ixid=MnwxMjA3fDB8MHxzZWFyY2h8NDR8fGRvZ3xlbnwwfHwwfHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        props: {
            color: 'var(--color-purple)',
            // color_hover: 'var(--color-purple)',
            // icon_fill: 'var(--color-purple)',
            // icon_fill_hover: 'var(--color-purple)'
        }
    }, i_button, protocol('dog'))
    const fox_btn = img_btn(
    {
        name: 'fox', 
        body: 'Fox',
        cover: 'assets/images/photo-1557008075-7f2c5efa4cfd.jpeg',
        // disabled: true,
        props: {
            color: 'var(--color-orange)',
            // color_hover: 'var(--color-orange)',
            // icon_fill: 'var(--color-orange)',
            // icon_fill_hover: 'var(--color-orange)'
        }
    },i_button, protocol('fox'))

    const disabled = button(
    {
        name: 'disable', 
        body: 'Disable', 
        disabled: true, 
        theme: {
            // style: `
            // :host(i-button) button[disabled] {
            //     --color-opacity: 1;
            //     --bg-color-opacity: 0.2;
            // }
            // `,
            props: {
                // bg_color: 'var(--color-slimy-green)'
            }
        }
    }, protocol('disable'))

    const toggle = button(
    {
        name: 'toggle', 
        role: 'switch', 
        body: 'Toggle',
        // icons: {
        //     icon: {name: 'edit'},
        // },
        // cover: 'https://cdn.pixabay.com/photo/2016/02/27/06/43/cherry-blossom-tree-1225186_960_720.jpg',
        // checked: false, 
        theme : {
            style: ``,
            props: {
                current_bg_color: 'var(--color-green)'
            }
        }
    }, protocol('toggle'))

    // Tab element
    const tab_theme = {
        props: {
            color_hover: 'var(--color-white)',
            bg_color_hover: 'var(--color-red)',
            current_bg_color: 'var(--color-yellow)',
            current_color: 'var(--primary-color)'
        }
    }
    const tab1 = button(
    {
        page: 'PLAN', 
        name: 'tab1', 
        role: 'tab',
        controls: 'panel1', 
        body: 'Tab1',
        current: true, 
        theme: tab_theme 
    }, protocol('tab1'))
    const tab2 = button(
    {
        page: 'PLAN', 
        name: 'tab2', 
        role: 'tab',
        controls: 'panel2',
        body: 'Tab2', 
        theme: tab_theme
    }, protocol('tab2'))
    const tab3 = button(
    {
        page: 'PLAN', 
        name: 'tab3', 
        role: 'tab', 
        controls: 'panel3',
        body: 'Tab3',
        theme: tab_theme
    }, protocol('tab3'))
    const demo_tab = bel`
    <nav class=${css.tabs} role="tablist" aria-label="tabs">
        ${tab1}${tab2}${tab3}
    </nav>`

    // Tab & icon
    const tab4 = button(
    {
        page: 'JOBS', 
        name: 'notice', 
        role: 'tab', 
        controls: 'panel4',
        body: 'Notice',
        icons: {
            icon: {name: 'notice'}
        },
        current: true, 
        theme: { 
            props: {
                    size: 'var(--size14)', 
                    current_color: 'var(--color-maya-blue)', 
                    icon_fill: 'var(--color-maya-blue)', 
                    icon_fill_hover:  'var(--color-maya-blue)', 
                    icon_size: '24px',
            },
            grid: {
                button: {
                    justify: 'items-center',
                    align: 'items-center'
                },
                icon: {
                    column: '1'
                },
                text: {
                    row: '2'
                }
            }
        }
    }, tab_protocol('notice'))
    const tab5 = button(
    {
        page: 'JOBS', 
        name: 'warning', 
        role: 'tab', 
        controls: 'panel5',
        body: 'Warning', 
        icons: {
            icon: {name: 'warning'},
        },
        cover: 'https://cdn.pixabay.com/photo/2021/08/25/20/42/field-6574455_960_720.jpg',
        theme: { 
            props: {
                    current_color:'var(--color-orange)', 
                    icon_fill: 'var(--color-orange)', 
                    icon_fill_hover: 'var(--color-flame)', 
                    icon_size: '30px',
                    icon_size_hover: '50px',
                    avatar_width: '100px',
            },
            grid: {
                button: {
                    row: 'auto',
                    auto: {
                        auto_flow: 'column',
                    },
                    justify: 'content-center',
                    align: 'items-center',
                    gap: '15px'
                },
                avatar: {
                    column: '1'
                },
                icon: {
                    column: '3'
                }
            }
        }
    }, tab_protocol('warning'))
    const tab6 = button(
    {
        page: 'JOBS', 
        name: 'search',
        role: 'tab',
        controls: 'panel6',
        body: 'Search', 
        icons: {
            icon: {name: 'search'}
        }, 
        disabled: true,
        theme: { 
            props: {
                color: 'var(--color-green)',
                current_color: 'var(--color-green)',
                icon_fill: 'var(--color-green)',
                icon_fill_hover: 'var(--color-green)',
                icon_size: '24px', 
            }
        }
    }, tab_protocol('search'))
    const demo_icon_tab = bel`
    <nav class=${css.tabs} role="tablist" aria-label="tabs">
        ${tab4}${tab5}${tab6}
    </nav>`

    // icons
    let icon_cancel = {name: 'cross'}
    let icon_confirm = {name: 'check'}
    let icon_previous = {name: 'arrow-left'}
    let icon_next = {name: 'arrow-right'}
    // buttons
    const cancel = button(
    {
        name: 'cancel', 
        body: icon(icon_cancel),
        // cover: icon(icon_cancel),
        theme: {
            style: ``,
            props: {
                icon_fill: 'var(--color-red)',
                bg_color_hover: 'var(--color-flame)'
            }
        }
    }, protocol('cancel'))
    const confirm = button(
    {
        name: 'confirm', 
        icons: {
            icon: icon_confirm
        }, 
        theme: {
            props: {
                bg_color_hover: 'var(--color-lincoln-green)',
                icon_fill: 'var(--color-green)',
                icon_fill_hover: 'var(--color-light-green)'
        }
    }}, protocol('confirm'))
    const previous = button(
    {
        name: 'previous', 
        body: 'Previous', 
        icons: {
            icon: icon_previous
        },
        theme: {
            style: ``,
            props: {
                bg_color_hover: 'var(--color-green-yellow-crayola)',
                color_hover: 'var(--color-purple)',
                icon_fill_hover: 'var(--color-purple)'
        }
    }}, protocol('previous'))
    const next = button(
    {
        name: 'next',
        // cover: 'https://images.unsplash.com/photo-1529448005898-b19fc13465b7?ixid=MnwxMjA3fDB8MHxzZWFyY2h8MTF8fG5leHR8ZW58MHx8MHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        icons: {
            icon: icon_next,
        },
        // classlist: 'text-col-1',
        body: 'Next',
        // body: bel`<div class="col2">${icon({name: 'arrow-right'})} Next</div>`, 
        theme: {
            // props: {
            //     icon_fill: 'var(--color-green)',
            //     icon_fill_hover: 'var(--color-bright-yellow-crayola)'
            // },
            grid: {
                icon: {column: '2'}
            }
    }}, protocol('next'))

    const listbox = button(
    {
        name: 'filter', 
        role: 'listbox',
        body: 'Filter', 
        icons: {
            select: {
                name: 'filter',
            }
        },
        // classlist: 'icon-col-2',
        expanded: false,
        theme : {
            props: {
                listbox_collapsed_icon_fill: 'var(--color-blue)',
                listbox_collapsed_icon_fill_hover: 'var(--color-flame)',
                listbox_expanded_icon_fill: 'var(--color-purple)',
                listbox_expanded_icon_fill_hover: 'var(--color-amaranth-pink)',
            }
        }
    }, protocol('filter'))

    const listbox1 = button(
        {
            name: 'single-selector', 
            role: 'listbox',
            body: 'Single select',
            icons: {
                icon: {name: 'star'},
                select: {name: 'arrow-down'},
            },
            cover: 'https://cdn.pixabay.com/photo/2021/08/25/20/42/field-6574455_960_720.jpg',
            expanded: false,
            theme : {
                props: {
                    // listbox_avatar_width: '100px'
                    // listbox_collapsed_icon_fill: 'var(--color-orange)',
                    // listbox_collapsed_icon_fill_hover: 'var(--color-light-green)',
                    // icon_fill: 'var(--color-persian-rose)',
                    // icon_fill_hover: 'var(--color-amaranth-pink)',
                    // icon_size: '32px'
                },
            }
        }, protocol('single-selector'))

    const option = button(
    {
        name: 'option-star', 
        body: 'Star', 
        role: 'option',
        icons: {
            list: {
                name: 'star',
            }
        },
        // classlist: 'icon-col-2',
        selected: true,
        theme : {
            props: {
                opacity: '1',
                current_bg_color: 'var(--color-blue)'
            }
        }
    }, protocol('option-star'))
    const option1 = button(
    {
        name: 'datdot app', 
        body: 'DatDot app', 
        role: 'option',
        icons: {
            icon: {
                name: 'datdot-white', 
            }
        },
        cover: 'https://cdn.pixabay.com/photo/2021/08/31/11/58/woman-6588614_960_720.jpg',
        // cover: 'https://cdn.pixabay.com/photo/2012/03/01/00/55/garden-19830_960_720.jpg',
        // cover: 'data:image/png;base64,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',
        // cover is only use string
        // cover: icon({name: 'star'}),
        selected: true,
        // current: true,
        // disabled: true,
        theme : {
            style: `
            /* :host(i-button) {
                grid-template-areas: "icon option";
            }
            :host(i-button) .option {
                grid-template-areas: "icon avatar text";
                grid-area: option;
            }
            :host(i-button) .option > .avatar {
                grid-area: avatar;
            }
            :host(i-button) .option > .text {
                grid-area: text;
            }*/
            `,
            props: {
                opacity: '1',
                current_bg_color: 'var(--color-blue)',
                avatar_width: '1200px',
                // avatar_height: '120px',
                // avatar_radius: '50%',
                color_hover: 'var(--color-light-orange)',
                icon_size: '45px',
                icon_size_hover: '30px',
                // icon_fill: 'var(--color-flame)',
                icon_fill_hover: 'var(--color-light-orange)',
                current_icon_fill: 'var(--color-light-green)',
                current_icon_size: '45px',
                list_selected_icon_size: '24px',
                // list_selected_icon_size_hover: '16px',
                list_selected_icon_fill: 'var(--color-flame)',
                list_selected_icon_fill_hover: 'var(--color-verdigris)',
                // current_list_selected_icon_size: '24px',
                // scale_hover: 1.5,
            },
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
                    columns: 'repeat(auto-fit, minmax(0, 100%))',
                    // columns: 'repeat(auto-fill, 1fr)',
                    auto: {
                        auto_flow: 'column'
                    },
                    align: 'items-center',
                    justify: 'content-center',
                    gap: '10px'
                },
                icon: {
                    column: '2'
                },
                option_icon: {
                    column: '2'
                },
                option_text: {
                    column: '3'
                },
                option_avatar: {
                    justify: 'content-center'
                }
            }
            // grid: {
            //     button: {
            //         areas: 'icon option',
            //         rows: 'auto',
            //         columns: 'auto 1fr',
            //         auto: 'flow-column',
            //         gap: '0 5px',
            //         align: 'items-center'
            //     },
            //     option: {
            //         areas: 'avatar icon text',
            //         area: 'option',
            //         rows: 'auto',
            //         auto: 'flow-column',
            //         align: 'items-center',
            //         gap: '0 5px'
            //     },
            //     option_text: {
            //         area: 'text'
            //     },
            //     option_icon: {
            //         area: 'icon'
            //     },
            //     option_avatar: {
            //         area: 'avatar'
            //     }
            // }
        }
    }, protocol('datdot app'))

    // links
    const link1 = link(
    {
        name: 'link-datdot',
        role: 'link',
        body: 'datdot.org',
        // cover: 'https://cdn.pixabay.com/photo/2018/01/17/20/22/analytics-3088958_960_720.jpg',
        // icons: {
        //     icon: {
        //         name: 'plan-list'
        //     }
        // },
        // classlist: 'icon-col-2',
        link: {
            url: 'http://datdot.org',
            target: '#frame'
        },
        theme: {
            props: {
                color: 'var(--color-black)',
                icon_fill: 'var(--color-black)',
                color_hover: 'var(--color-grey88)',
                icon_fill_hover: 'var(--color-grey88)',
                // avatar_radius: '50%'
            }
        }
    }, protocol('link-datdot'))
    const link2 = link(
    {
        name: 'link-playproject',
        role: 'link',
        body: 'Playproject.io',
        // icon: {name: 'datdot-black', classlist: 'col2-right'},
        cover: 'https://avatars.githubusercontent.com/u/51347431?s=200&v=4',
        disabled: false,
        link: {
            url: 'https://playproject.io/',
            target: '#frame'
        },
        theme: {
            props: {
                // avatar_width: '44px'
            }
        }
    }, protocol('link-playproject'))
    const link3 = link(
    {
        name: 'link3',
        role: 'link',
        body: 'Google',
        // disabled: true
        theme: {
            props: {
                color: 'var(--color-deep-green)',
                color_hover: 'var(--color-electric-violet)'
            }
        }
    }, protocol('link3'))
    
    const link4 = link(
    {
        name: 'datdot-ui-issues',
        role: 'link',
        body: 'DatDot UI issues',
        link: {
            url: 'https://github.com/playproject-io/datdot-ui/issues',
            target: '_new'
        }
    }, protocol('datdot-ui-issues'))
    const link5 = link(
    {
        name: 'go-top',
        role: 'link',
        body: '↑Top',
        link: {
            url: '#top'
        },
    }, protocol('go-top'))
    // menu items
    const item1 = link(
    {
        name: 'item1',
        role: 'menuitem',
        body: `Datdot-UI issues`,
        icons: {
            icon: {
                name: 'datdot-white'
            }
        },
        // cover: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Octicons-mark-github.svg/600px-Octicons-mark-github.svg.png',
        cover : 'https://cdn.pixabay.com/photo/2017/01/14/12/59/iceland-1979445__340.jpg',
        link: {
            url: 'https://github.com/playproject-io/datdot-ui/issues',
            target: '_new'
        },
        theme: {
            props: {
                avatar_radius: '50%',
                avatar_width: '80px',
                avatar_height: '80px',
                avatar_width_hover: '100px',
                avatar_height_hover: '100px'
                // icon_size: '30px'
            },
            grid: {
                avatar: {
                    column: '3'
                },
                // icon: {
                //     column: '1'
                // }
            }
            // grid: {
            //     link: {
            //         areas: "icon text",
            //         align: 'items-center',
            //         gap: '5px'
            //     },
            //     text: {
            //         area: 'text'
            //     },
            //     icon: {
            //         area: 'icon'
            //     }
            // }
        }
    }, protocol('item1'))
    const item2 = link(
    {
        name: 'item2',
        role: 'menuitem',
        body: 'Playproject.io',
        cover: 'https://avatars.githubusercontent.com/u/51347431?s=200&v=4',
        link: {
            url: 'https://github.com/playproject-io',
        },
        theme: {
            props: {
                // avatar_width: '40px',
            }
        }
    }, protocol('item2'))
    const item3 = link(
    {
        name: 'item3',
        role: 'menuitem',
        body: 'twitter',
        icons: {
            icon: {name: 'icon-svg.168b89d5', path: 'https://abs.twimg.com/responsive-web/client-web'}
        },
        link: {
            url: 'https://twitter.com/home',
            target: '_blank'
        },
        theme: {
            props: {
                size: 'var(--size16)',
                size_hover: 'var(--size28)',
                color: 'var(--color-heavy-blue)',
                color_hover: 'var(--color-dodger-blue)',
                // icon_size: 'var(--size20)',
                // icon_size_hover: 'var(--size28)',
                icon_fill: 'var(--color-blue)',
                icon_fill_hover: 'var(--color-dodger-blue)'
            }
        }
    }, protocol('item3'))
    /*
        if image's width is not equal to height, must be calculated resize to be small or big, 
        to avoid the image is cutting by border-radius, it won't look like a round button,
        it would look like a cut half image.
    */
    const item4 = button(
    {
        name: 'item4',
        role: 'menuitem',
        body: 'Menu item',
        cover: 'https://cdn.pixabay.com/photo/2012/03/01/00/55/garden-19830_960_720.jpg',
        theme: {
            // style: `
            // :host(i-button) img {
            //     width: auto;
            //     height: 100%;
            // }
            // `,
            props: {
                color_hover: 'var(--color-greyA2)',
                avatar_width: '60px',
                avatar_height: '60px',
                avatar_width_hover: '80px',
                avatar_height_hover: '80px',
                avatar_radius: '50%',
            }
        }
    }, protocol('item4'))
    // content
    const content = bel`
    <div class=${css.content}>
        <a name="top"></a>
        <section>
            <h2>Text</h2>
            <div class=${css.text}>
                ${primary}${disabled}${toggle}
            </div>
        </section>
        <section>
            <h2>Icon</h2>
            <div class=${css.icon}>
                ${cancel}${confirm}${previous}${next}${listbox}
            </div>
        </section>
        <section>
            <h2>Selector</h2>
            <div class=${css.icon}>
                ${listbox1}${option}
            </div>
            <div class=${css.icon}>
                ${option1}
            </div>
        </section>
        <section>
            <h2>Image</h2>
            <div class=${css.icon}>
                ${rabbit_btn}${dog_btn}${fox_btn}
            </div>
            <h2>Thumb</h2>
            <div class=${css.thumb}>
                ${thumb1_btn}${thumb2_btn}
            </div>
        </section>
        <section>
            <h2>Tab</h2>
            ${demo_tab}
            <div class="panels">
                <div id="panel1" role="tabpanel" tabindex="0" aria-labelledby="tab1">
                    <img src="https://cdn.pixabay.com/photo/2017/10/18/16/08/wolves-2864647_960_720.jpg" alt="wolf">
                </div>
                <div id="panel2" role="tabpanel" tabindex="0" aria-labelledby="tab2" hidden="true">
                    <img src="https://cdn.pixabay.com/photo/2018/07/13/10/20/kittens-3535404_960_720.jpg" alt="kittens">
                </div>
                <div id="panel3" role="tabpanel" tabindex="0" aria-labelledby="tab3" hidden="true">
                    <img src="https://cdn.pixabay.com/photo/2016/07/23/23/02/lavenders-1537694_960_720.jpg" alt="bees">
                </div>
            </div>
        </section>
        <section>
            <h2>Tab & icon</h2>
            ${demo_icon_tab}
            <div class="article-panels">
                <div id="panel4" role="tabpanel" tabindex="0" aria-labelledby="tab4">
                    <h1>What is Lorem Ipsum?</h1>
                    <p>Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.</p>
                </div>
                <div id="panel5" role="tabpanel" tabindex="0" aria-labelledby="tab5" hidden="true">
                    <h1>Why do we use it?</h1>
                    <p>It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web sites still in their infancy. Various versions have evolved over the years, sometimes by accident, sometimes on purpose (injected humour and the like).</p>
                </div>
                <div id="panel6" role="tabpanel" tabindex="0" aria-labelledby="tab6" hidden="true">
                    <h1>Where does it come from?</h1>
                    <p>Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin literature from 45 BC, making it over 2000 years old. Richard McClintock, a Latin professor at Hampden-Sydney College in Virginia, looked up one of the more obscure Latin words, consectetur, from a Lorem Ipsum passage, and going through the cites of the word in classical literature, discovered the undoubtable source. Lorem Ipsum comes from sections 1.10.32 and 1.10.33 of "de Finibus Bonorum et Malorum" (The Extremes of Good and Evil) by Cicero, written in 45 BC. This book is a treatise on the theory of ethics, very popular during the Renaissance. The first line of Lorem Ipsum, "Lorem ipsum dolor sit amet..", comes from a line in section 1.10.32.</p>
                </div>
            </div>
        </section>
        <section>
            <h2>Menu item</h2>
            <nav class=${css.links} role="menu">
                ${item1}${item2}${item3}${item4}
            </nav>
        </section>
        <section>
            <h2>Link</h2>
            <nav class=${css.links}>
                ${link1}${link2}${link3}${link4}${link5}
            </nav>
            <iframe id="frame" title="frame" src="https://datdot.org"></iframe>
        </section>
        
    </div>`
    const container = bel`<div class="${css.container}">${content}</div>`
    const app = bel`<div class="${css.wrap}" data-state="debug">${container}${logs}</div>`

    return app

    // handle events
    function handle_click_event ({head, refs, data}) {
        const to = head[1]
        const id = head[2]
        const role = head[0].split(' / ')[1]
        const from = head[0].split(' / ')[0]
        const make = message_maker(`${from} / ${role} / Demo`)
        if (role.match(/button|menuitem/)) return recipients['logs']( make({type: 'triggered'}) )
        if (role === 'tab') return handle_tab_event(from, data)
        if (role === 'switch') return handle_toggle_event(make, from, data)
        if (role === 'listbox') return handle_dropdown_menu_event(make, from, data)
        if (role === 'option') return handle_select_event(from, data)
    }

    function handle_tab_event (from, data) {
        const tabs = [...demo_tab.children]
        tabs.map( tab => {
            const state = from === tab.getAttribute('aria-label') ? !data : data
            const current = from === tab.getAttribute('aria-label') ? from : tab.getAttribute('aria-label')
            const type = from === tab.getAttribute('aria-label') ? 'checked' : 'unchecked'
            const make = message_maker(`${current} / tab / Demo`)
            recipients[current]( make({type, data: state}) )
            
            if (from === tab.getAttribute('aria-label')) {
                recipients['logs']( make({type, data: {selected: state, current: state}}) )
                return handle_panel_change(tab.getAttribute('aria-controls')) 
            }
            // return recipients['logs']( make({type, data: {selected: state, current: state}}) )
        })
    }

    function handle_panel_change(id) {
        const panels = document.querySelector('.panels')
        const {childNodes} = panels
        childNodes.forEach( item => {
            const index = item.id === id ? 0 : -1
            item.setAttribute('tabindex', index)
            if (item.id === id) item.removeAttribute('hidden')
            else item.setAttribute('hidden', 'true')
        })
    }

    function handle_tab_icon_event (from, data) {
        const tabs = [...demo_icon_tab.children]
        tabs.map( tab => {
            const state = from === tab.getAttribute('aria-label') ? true : data
            const current = from === tab.getAttribute('arsia-label') ? from : tab.getAttribute('aria-label')
            const type = from === tab.getAttribute('aria-label') ? 'checked' : 'unchecked'
            const make = message_maker(`${current} / tab / Demo`)
            recipients[current]( make({type, data: state}) )
            if (from === tab.getAttribute('aria-label')) {
                recipients['logs']( make({type, data: {selected: state, current: state}}) )
                return handle_text_panel_change(tab.getAttribute('aria-controls')) 
            }
            return recipients['logs']( make({type, data: {selected: state, current: state}}) )
        })
    }

    function handle_text_panel_change(id) {
        const panels = document.querySelector('.article-panels')
        const {childNodes} = panels
        childNodes.forEach( item => {
            const index = item.id === id ? 0 : -1
            item.setAttribute('tabindex', index)
            if (item.id === id) item.removeAttribute('hidden')
            else item.setAttribute('hidden', 'true')
        })
    }

    function handle_toggle_event (make, from, data) {
        const state = !data
        const message = make({type: 'switched', data: state})
        let body = state ? 'Toggle on' : 'Toggle off'
        if (from === 'thumb-blossom') body = state ? 'Blossom open' : 'Blossom close'
        const cover = state ? 'https://cdn.pixabay.com/photo/2019/05/11/02/33/cherry-blossom-4194997_960_720.jpg' : 'https://cdn.pixabay.com/photo/2016/02/19/11/07/japanese-cherry-blossoms-1209577_960_720.jpg'
        const icon = state ? {name: 'star'} : {name: 'edit'}
        const content =  {text: body, cover: from === 'thumb-blossom' ? cover : undefined, icon}
        recipients[from](message)
        recipients[from](make({type: 'changed', data: content}))
        recipients['logs']( make({to: 'self', type: 'triggered', data: {checked: state}}) )
        recipients['logs']( make({to: 'self', type: 'changed', data: content}) )
    }

    function handle_dropdown_menu_event (make, from, data) {
        const state = data.expanded
        const type = state ? 'expanded' : 'collapsed'
        recipients[from]( make({type, data: state}) )
        recipients['logs']( make({type}) )
    }

    function handle_select_event (from, data) {
        const {selected, content} = data
        const make = message_maker(from)
        const type = selected ? 'selected' : 'unselected'
        recipients[from]({type, data: selected})
        recipients['logs']( make({to: `options`, type, data: {content} }) )
    }
    function handle_changed_event (type, data) {
        recipients['single-selector']({type, data})
    }
    // protocols
    function tab_protocol (name) {
        return send => {
            recipients[name] = send
            return (msg) => {
                const {head, refs, type, data} = msg
                const to = head[1]
                const id = head[2]
                const role = head[0].split(' / ')[1]
                const from = head[0].split(' / ')[0]
                if (type === 'click') return handle_tab_icon_event(from, data)
                
                recipients['logs'](msg)
            }
        }
    }
    function protocol (name) {
        return send => {
            recipients[name] = send
            return get
        }
    }

    function get (msg) {
        const { type, data } = msg
        recipients['logs'](msg)
        if (type === 'click') return handle_click_event(msg)
        if (type === 'changed') handle_changed_event(type, data)
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
    --link-avatar-width: 60px;
    --link-avatar-width-hover: var(--link-avatar-width);
    --link-avatar-height: auto;
    --link-avatar-height-hover: auto;
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
    position: relative;
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
img {
    width: 100%;
    height: auto;
}
.wrap {
    display: grid;
}
.content {}
.text, .icon {
    display: flex;
    flex-wrap: wrap;
    gap: 12px 8px;
    margin-bottom: 20px;
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
.tabs {
    display: grid;
    grid-auto-flow: column;
}
.tabs span {
    width: 40px;
}
#frame {
    width: 100%;
    height: 480px;
}
/*
.links {
    max-width: 100%;
    display: grid;
    grid-template-rows: auto;
    grid-template-columns: repeat(auto-fill, minmax(auto, 20%));
    grid-auto-flow: column;
    justify-items: center;
    align-items: center;
    gap: 12px;
}
section .links:nth-child(2) {
    grid-template-columns: fit-content(250px) auto;
}
*/
.links {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 20px;
}
.thumb i-button:first-child {
   margin-bottom: 20px;
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
},{"..":35,"../src/node_modules/message-maker":40,"bel":5,"csjs-inject":8,"datdot-terminal":25,"datdot-ui-icon":29,"head":2,"img-btn":3}],2:[function(require,module,exports){
module.exports = head

function head (lang = 'UTF-8', title = 'Button - DatDot UI') {
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
module.exports = img_btn

function img_btn ({name, body, icon = {}, cover, disabled, props = {}}, button, protocol) {
    var {icon_name = 'edit', path, classlist} = icon
    const {
        icon_size = '20px',
        icon_fill = 'var(--primary-icon-fill)',
        icon_fill_hover = 'var(--primary-icon-fill-hover)',
        avatar_width = '150px', 
        avatar_height = '150px',
        weight = '600', 
        size = 'var(--size24)', 
        size_hover = 'var(--size36)', 
        color = 'var(--color-amaranth-pink)', 
        color_hover = 'var(--primary-color-hover)',
        bg_color = 'var(--color-white)',
        bg_color_hover = 'var(--color-grey88)', 
        border_radius = '8px',
        avatar_radius = '50%',
        disabled_size = 'var(--size24)',
        shadow_opacity = '0.2'
    } = props
    return button(
        {
            name, 
            body,
            icons: {
                icon: {name: icon_name, path}
            },
            cover,
            classlist,
            disabled,
            theme:
            { 
                // to solve border-radius & overflow: hidden not working on safari
                // -webkit-mask-image: -webkit-radial-gradient(white, black)
                // transform: translateZ(0)
                style: `
                :host(i-button) img {
                    object-position: 0 -20px
                }
                `, 
                props: { icon_size, icon_fill, icon_fill_hover, avatar_width, avatar_height, weight, size, size_hover, color, color_hover, bg_color, bg_color_hover, border_radius, avatar_radius, disabled_size, shadow_opacity},
                grid: {
                    button: {
                        // areas: ['icon text', 'avatar avatar'],
                        rows: 'auto 1fr',
                        columns: 'repeat(auto-fill, minmax(0, auto)) auto',
                        justify: 'items-center'
                    },
                    icon: {
                        // area: 'icon',
                        row: '1',
                        column: '1',
                        justify: 'self-right'
                    },
                    avatar: {
                        // area: 'avatar',
                        row: '2',
                        column: 'span 3',
                        // justify: 'self-center'
                    },
                    text: {
                        // area: 'text',
                        row: '1',
                        column: '2 / span 2',
                        justify: 'self-left'

                    }
                }
            }
        }, protocol)
} 
},{}],4:[function(require,module,exports){
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

},{}],5:[function(require,module,exports){
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

},{"./appendChild":4,"hyperx":33}],6:[function(require,module,exports){
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
},{"csjs":11,"insert-css":34}],7:[function(require,module,exports){
'use strict';

module.exports = require('csjs/get-css');

},{"csjs/get-css":10}],8:[function(require,module,exports){
'use strict';

var csjs = require('./csjs');

module.exports = csjs;
module.exports.csjs = csjs;
module.exports.getCss = require('./get-css');

},{"./csjs":6,"./get-css":7}],9:[function(require,module,exports){
'use strict';

module.exports = require('./lib/csjs');

},{"./lib/csjs":15}],10:[function(require,module,exports){
'use strict';

module.exports = require('./lib/get-css');

},{"./lib/get-css":19}],11:[function(require,module,exports){
'use strict';

var csjs = require('./csjs');

module.exports = csjs();
module.exports.csjs = csjs;
module.exports.noScope = csjs({ noscope: true });
module.exports.getCss = require('./get-css');

},{"./csjs":9,"./get-css":10}],12:[function(require,module,exports){
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

},{}],13:[function(require,module,exports){
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

},{"./composition":14}],14:[function(require,module,exports){
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

},{}],15:[function(require,module,exports){
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

},{"./build-exports":13,"./composition":14,"./css-extract-extends":16,"./css-key":17,"./extract-exports":18,"./scopeify":24}],16:[function(require,module,exports){
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

},{"./composition":14}],17:[function(require,module,exports){
'use strict';

/**
 * CSS identifiers with whitespace are invalid
 * Hence this key will not cause a collision
 */

module.exports = ' css ';

},{}],18:[function(require,module,exports){
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

},{"./regex":21}],19:[function(require,module,exports){
'use strict';

var cssKey = require('./css-key');

module.exports = function getCss(csjs) {
  return csjs[cssKey];
};

},{"./css-key":17}],20:[function(require,module,exports){
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

},{}],21:[function(require,module,exports){
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

},{}],22:[function(require,module,exports){
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

},{"./regex":21}],23:[function(require,module,exports){
'use strict';

var encode = require('./base62-encode');
var hash = require('./hash-string');

module.exports = function fileScoper(fileSrc) {
  var suffix = encode(hash(fileSrc));

  return function scopedName(name) {
    return name + '_' + suffix;
  }
};

},{"./base62-encode":12,"./hash-string":20}],24:[function(require,module,exports){
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

},{"./regex":21,"./replace-animations":22,"./scoped-name":23}],25:[function(require,module,exports){
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
},{"bel":5,"generator-color":26,"message-maker":27,"support-style-sheet":28}],26:[function(require,module,exports){
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
},{}],27:[function(require,module,exports){
module.exports = function message_maker (from) {
    let msg_id = 0
    return function make ({to, type, data = null, refs = []}) {
        const stack = (new Error().stack.split('\n').slice(2).filter(x => x.trim()))
        const message = { head: [from, to, ++msg_id], refs, type, data, meta: { stack }}
        return message
    }
}
},{}],28:[function(require,module,exports){
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
},{}],29:[function(require,module,exports){
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

},{"support-style-sheet":30,"svg":31}],30:[function(require,module,exports){
arguments[4][28][0].apply(exports,arguments)
},{"dup":28}],31:[function(require,module,exports){
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
},{}],32:[function(require,module,exports){
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

},{}],33:[function(require,module,exports){
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

},{"hyperscript-attribute-to-property":32}],34:[function(require,module,exports){
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

},{}],35:[function(require,module,exports){
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
        const add_text = body && typeof body === 'string' ? text : 'undefined'
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
            if (type.match(/expanded|collapsed/)) return expanded_event(!data)
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
        // collapsed settings
        listbox_collapsed_bg_color, listbox_collapsed_bg_color_hover,
        listbox_collapsed_icon_size, listbox_collapsed_icon_size_hover,
        listbox_collapsed_icon_fill, listbox_collapsed_icon_fill_hover, 
        listbox_collapsed_listbox_color, listbox_collapsed_listbox_color_hover,
        listbox_collapsed_listbox_size, listbox_collapsed_listbox_size_hover,
        listbox_collapsed_listbox_weight, listbox_collapsed_listbox_weight_hover,
        listbox_collapsed_listbox_icon_size, listbox_collapsed_listbox_icon_size_hover,
        listbox_collapsed_listbox_icon_fill, listbox_collapsed_listbox_icon_fill_hover,
        listbox_collapsed_listbox_avatar_width, listbox_collapsed_listbox_avatar_height,
        // expanded settings
        listbox_expanded_bg_color,
        listbox_expanded_icon_size, 
        listbox_expanded_icon_fill,
        listbox_expanded_listbox_color,
        listbox_expanded_listbox_size, 
        listbox_expanded_listbox_weight,
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
        --color: ${listbox_collapsed_listbox_color ? listbox_collapsed_listbox_color : 'var(--listbox-collapsed-listbox-color)'};
        --size: ${listbox_collapsed_listbox_size ? listbox_collapsed_listbox_size : 'var(--listbox-collapsed-listbox-size)'};
        --weight: ${listbox_collapsed_listbox_weight ? listbox_collapsed_listbox_weight : 'var(--listbox-collapsed-listbox-weight)'};
        --bg-color: ${listbox_collapsed_bg_color ? listbox_collapsed_bg_color : 'var(--listbox-collapsed-bg-color)'};
    }
    :host(i-button[role="listbox"]:hover) {
        --color: ${listbox_collapsed_listbox_color_hover ? listbox_collapsed_listbox_color_hover : 'var(--listbox-collapsed-listbox-color-hover)'};
        --size: ${listbox_collapsed_listbox_size_hover ? listbox_collapsed_listbox_size_hover : 'var(--listbox-collapsed-listbox-size-hover)'};
        --weight: ${listbox_collapsed_listbox_weight_hover ? listbox_collapsed_listbox_weight_hover : 'var(--listbox-collapsed-listbox-weight-hover)'};
        --bg-color: ${listbox_collapsed_bg_color_hover ? listbox_collapsed_bg_color_hover : 'var(--listbox-collapsed-bg-color-hover)'};
    }
    :host(i-button[role="listbox"]) > .icon {
        ${grid.icon ? make_grid(grid.icon) : make_grid({column: '2'})}
    }
    :host(i-button[role="listbox"]) .text {}
    :host(i-button[role="listbox"]) .avatar {
        --avatar-width: ${listbox_collapsed_listbox_avatar_width ? listbox_collapsed_listbox_avatar_width : 'var(--listbox-collapsed-listbox-avatar-width)'};
        --avatar-height: ${listbox_collapsed_listbox_avatar_height ? listbox_collapsed_listbox_avatar_height : 'var(--listbox-collapsed-listbox-avatar-height)'}
    }
    :host(i-button[role="listbox"][aria-expanded="true"]),
    :host(i-button[role="listbox"][aria-expanded="true"]:hover) {
        --size: ${listbox_expanded_listbox_size ? listbox_expanded_listbox_size : 'var(--listbox-expanded-listbox-size)'};
        --color: ${listbox_expanded_listbox_color ? listbox_expanded_listbox_color : 'var(--listbox-expanded-listbox-color)'};
        --weight: ${listbox_expanded_listbox_weight ? listbox_expanded_listbox_weight : 'var(--listbox-expanded-listbox-weight)'};
        --bg-color: ${listbox_expanded_bg_color ? listbox_expanded_bg_color : 'var(--listbox-expanded-bg-color)'}
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
    /* listbox collapsed */
    :host(i-button[role="listbox"]) > .icon {
        --icon-size: ${listbox_collapsed_icon_size ? listbox_collapsed_icon_size : 'var(--listbox-collapsed-icon-size)'};
    }
    :host(i-button[role="listbox"]:hover) > .icon {
        --icon-size: ${listbox_collapsed_icon_size_hover ? listbox_collapsed_icon_size_hover : 'var(--listbox-collapsed-icon-size-hover)'};
    }
    :host(i-button[role="listbox"]) .listbox > .icon {
        --icon-size: ${listbox_collapsed_listbox_icon_size ? listbox_collapsed_listbox_icon_size : 'var(--listbox-collapsed-listbox-icon-size)'};
    }
    :host(i-button[role="listbox"]:hover) .listbox > .icon {
        --icon-size: ${listbox_collapsed_listbox_icon_size_hover ? listbox_collapsed_listbox_icon_size_hover : 'var(--listbox-collapsed-listbox-icon-size-hover)'};
    }
    :host(i-button[role="listbox"]) > .icon g {
        --icon-fill: ${listbox_collapsed_icon_fill ? listbox_collapsed_icon_fill : 'var(--listbox-collapsed-icon-fill)'};
    }
    :host(i-button[role="listbox"]:hover) > .icon g {
        --icon-fill: ${listbox_collapsed_icon_fill_hover ? listbox_collapsed_icon_fill_hover : 'var(--listbox-collapsed-icon-fill-hover)'};
    }
    :host(i-button[role="listbox"]) .listbox > .icon g {
        --icon-fill: ${listbox_collapsed_listbox_icon_fill ? listbox_collapsed_listbox_icon_fill : 'var(--listbox-collaps-listbox-icon-fill)'};
    }
    :host(i-button[role="listbox"]:hover) .listbox > .icon g {
        --icon-fill: ${listbox_collapsed_listbox_icon_fill_hover ? listbox_collapsed_listbox_icon_fill_hover : 'var(--listbox-collapsed-listbox-icon-fill-hover)'};
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
},{"make-element":36,"make-grid":37,"make-icon":38,"make-image":39,"message-maker":40,"support-style-sheet":41}],36:[function(require,module,exports){
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


},{}],37:[function(require,module,exports){
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
},{}],38:[function(require,module,exports){
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


},{"datdot-ui-icon":29}],39:[function(require,module,exports){
module.exports = img

function img ({src, alt}) {
    const img = document.createElement('img')
    img.setAttribute('src', src)
    img.setAttribute('alt', alt)
    return img
}
},{}],40:[function(require,module,exports){
arguments[4][27][0].apply(exports,arguments)
},{"dup":27}],41:[function(require,module,exports){
arguments[4][28][0].apply(exports,arguments)
},{"dup":28}]},{},[1]);
