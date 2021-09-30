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
    const list_name = `${name}-list`

    let is_expanded = expanded
    let is_disabled = disabled
    let store_data = []
    if (mode === 'single-select') {
        var init_selected = {...button}
        list.array.map( item => {
            const obj = item.current || item.selected ?  item : list.array[0]
            init_selected = {
                name,
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
        const i_button = make_button({page, name, option: mode === 'single-select' ? init_selected : button, mode, expanded: is_expanded, theme: button.theme}, dropdown_protocol)
        const i_list = make_list({page, name: list_name, option: list, mode, hidden: is_expanded}, dropdown_protocol)
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
                const make = message_maker(`All`)
                const to = `${name} / ${flow} / ${page}`
                const type = 'collapsed'
                is_expanded = false
                recipients[name]( make({type, data: is_expanded}) )
                recipients[list_name]( make({type, data: !is_expanded}) )
                send( make({to, type, data: {selected: store_data}}) )
            })
        }
        function handle_change_event (content) {
            const msg = make({type: 'changed', data: content})
            recipients[name](msg)
            send(msg)
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
                recipients[list_name](make({type, data: !is_expanded}))
            }
            // check which dropdown is currently using then do expanded
            recipients[name](make({type, data: is_expanded}))
            recipients[list_name](make({type, data: !is_expanded}))
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
            send(msg)
            if (type.match(/expanded|collapsed/)) return handle_expanded_event( data)
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
            margin_top = '5px'
        } = theme.props
    }

    const {direction = 'down', start = '0', end = '40px'} = list

    const style = `
    :host(i-dropdown) {
        position: relative;
        display: grid;
        max-width: 100%;
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
        margin-top: ${margin_top};
        z-index: 1;
        width: 100%;
        ${direction === 'down' ? `top: ${end}` : `bottom: ${end};`}
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
            ${direction === 'down' ? `top: ${start};` : `bottom: ${start};`}
        }
        50% {
            opacity: 0.5;
            ${direction === 'down' ? `top: 20px;` : `bottom: 20px;`}
        }
        100%: {
            opacity: 1;
            ${direction === 'down' ? `top: ${end}` : `bottom: ${end};`}
        }
    }
    
    @keyframes up {
        0% {
            opacity: 1;
            ${direction === 'down' ? `top: ${end}` : `bottom: ${end};`}
        }
        50% {
            ${direction === 'down' ? `top: 20px;` : `bottom: 20px;`}
        }
        75% {
            opacity: 0.5;
        }
        100%: {
            opacity: 0;
            ${direction === 'down' ? `top: ${start};` : `bottom: ${start};`}
        }
    } 
    ${custom_style}
    `

    return widget()
}

