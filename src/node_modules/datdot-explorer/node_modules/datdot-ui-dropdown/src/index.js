const style_sheet = require('support-style-sheet')
const message_maker = require('message-maker')
const make_button = require('make-button')
const make_list = require('make-list')

module.exports = i_dropdown

function i_dropdown ({page = '*', flow = 'ui-dropdown', name, options = {}, expanded = false, disabled = false, mode = 'single-select', theme}, protocol) {
    const {button = {}, list = {}} = options
    const recipients = []
    const make = message_maker(`${name} / ${flow} / ${page}`)
    const message = make({type: 'ready'})
    let is_expanded = expanded
    let is_disabled = disabled
    let store_data = []
    if (mode === 'single-select') {
        var init_selected = {...button}
        list.array.map( item => {
            const obj = item.current || item.selected ?  item : list.array[0]
            init_selected = {
                name: button.name,
                body: obj.text,
                icons: {
                    select: button.select ? button.select : undefined,
                    icon: obj.icon,
                },
                cover: obj.cover,
            }
        })
        store_data.push(init_selected)
    }
    if (mode === 'multiple-select') {
        list.array.map( item => {
            if (item.selected) store_data.push(item)
        })
    }
    function widget () {
        const send = protocol(get)
        const dropdown = document.createElement('i-dropdown')
        const shadow = dropdown.attachShadow({mode: 'closed'})
        const i_button = make_button({page, option: mode === 'single-select' ? init_selected : button, mode, expanded: is_expanded, theme: button.theme}, dropdown_protocol)
        const i_list = make_list({page, option: list, mode, hidden: is_expanded}, dropdown_protocol)
        send(message)
        dropdown.setAttribute('aria-label', name)
        if (is_disabled) dropdown.setAttribute('disabled', is_disabled)
        style_sheet(shadow, style)
        handle_collapsed()
        shadow.append(i_button)
        // need to add this to avoid document.body.addEventListener('click)
        dropdown.onclick = event => event.stopPropagation()
        return dropdown

        function handle_collapsed () {
            // trigger expanded event via document.body
            document.body.addEventListener('click', (e)=> {
                const type = 'collapsed'
                const to = `${button ? button.name : name} / listbox / ui-list`
                is_expanded = false
                recipients[button.name]( make({to, type, data: is_expanded}) )
                recipients[list.name]( make({type, data: !is_expanded}) )
                send( make({to, type, data: {selected: store_data}}) )
            })
        }
        function handle_change_event (content) {
            recipients[button.name](make({type: 'changed', data: content}))
        }
        function handle_select_event (data) {
            const {mode, selected} = data
            let new_data = []
            if (mode === 'dropdown') return
            if (mode === 'single-select') {
                selected.map( obj => {
                    if (obj.selected) {
                        const content = {text: obj.text, cover: obj.cover, icon: obj.icon}
                        new_data.push(obj)
                        return handle_change_event (content)
                    }
                })
            }
            if (mode === 'multiple-select') {
                new_data = selected.filter( obj => obj.selected )
            }
            store_data = new_data
        }
        function handle_expanded_event (data) {
            const {from, expanded} = data
            is_expanded = expanded
            const type = is_expanded ? 'expanded' : 'collapsed'
            // check which one dropdown is not using then do collapsed
            if (from !== name) {
                recipients[name](make({type: 'collapsed', data: is_expanded}))
                recipients[list.name](make({type, data: !is_expanded}))
            }
            // check which dropdown is currently using then do expanded
            recipients[name](make({type, data: is_expanded}))
            recipients[list.name](make({type, data: !is_expanded}))
            if (is_expanded && from == name) shadow.append(i_list)
        }
        function dropdown_protocol (name) {
            return send => {
                recipients[name] = send
                return get
            }
        }
        function get (msg) {
            const {head, refs, type, data} = msg 
            const from = head[0].split('/')[0].trim()
            send(msg)
            // console.log(recipients);
            if (type.match(/expanded|collapsed/)) return handle_expanded_event(data)
            if (type.match(/selected/)) return handle_select_event(data)
        }
    }

    
    // insert CSS style
    const custom_style = theme ? theme.style : ''
    // set CSS variables
    if (theme && theme.props) {
        var {size, size_hover, current_size, disabled_size,
            weight, weight_hover, current_weight, current_hover_weight,
            color, color_hover, current_color, current_bg_color, disabled_color, disabled_bg_color,
            current_hover_color, current_hover_bg_color,
            bg_color, bg_color_hover, border_color_hover,
            border_width, border_style, border_opacity, border_color, border_radius, 
            padding, margin, width, height, opacity,
            shadow_color, offset_x, offset_y, blur, shadow_opacity,
            shadow_color_hover, offset_x_hover, offset_y_hover, blur_hover, shadow_opacity_hover,
            margin_top
        } = theme.props
    }

    const style = `
    :host(i-dropdown) {
        position: relative;
        display: grid;
        width: 100%;
    }
    :host(i-dropdown[disabled]) {
        cursor: not-allowed;
    }
    i-button {
        position: relative;
        z-index: 2;
    }
    i-list {
        position: absolute;
        left: 0;
        top: 40px;
        margin-top: ${margin_top ? margin_top : '5px'};
        z-index: 1;
        width: 100%;
    }
    i-list[aria-hidden="false"] {
        animation: down 0.3s ease-in;
    }
    i-list[aria-hidden="true"] {
        animation: up 0.3s ease-out;
    } 
    
    @keyframes down {
        0% {
            opacity: 0;
            top: 0px;
        }
        50% {
            opacity: 0.5;
            top: 20px;
        }
        100%: {
            opacity: 1;
            top: 40px;
        }
    }
    
    @keyframes up {
        0% {
            opacity: 1;
            top: 40px;
        }
        50% {
            top: 20px;
        }
        75% {
            opacity: 0.5;
        }
        100%: {
            opacity: 0;
            top: 0px;
        }
    } 
    ${custom_style}
    `

    return widget()
}

