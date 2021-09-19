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