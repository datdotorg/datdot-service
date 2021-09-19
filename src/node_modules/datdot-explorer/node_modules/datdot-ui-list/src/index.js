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