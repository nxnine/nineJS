/*
    component.js by @nxnine
    requires:
        alot

    template driven WebComponent based UI components
    rough, very rough
*/

(function () {
    //
    var nx = {}, _globals;
    //

    /*
        Component
    */ 
    function htmlToElement(html) {
        var template = document.createElement('template');
        template.innerHTML = html.trim(); // Never return a text node of whitespace as the result
        return template.content.firstChild;
    };
    //
    // snowflake generator, datacenter & worker set to 31
    var __id_generator = new nine.util.snowflake(31,31);
    //
    var component = {};
    //
    component._element = htmlToElement;
    //
    component.generateID = function(){ return __id_generator.generate_36(); }
    //
    component.register = function(el_name,class_name){
        customElements.define(el_name, class_name);
    };
    //

    // so we can hack all the document stylesheets into each shadowdom
    component.stylesheets = [];
    component.stylesheets_load = function(){
        component.stylesheets = [];
        let _css_links = document.querySelectorAll("link[rel=stylesheet]")
        for (let _idx=0;_idx<_css_links.length;_idx++){
            component.stylesheets.push(_css_links[_idx].href);
        }
    };
    component.stylesheets_load();
    // used for testing
    //window.nines = [];
    /*
        the base component

        onmouseover
        onmouseout
        onmousedown
        onmouseup
        onclick

        override :
            do not draw shadowdom
            do not use template
            render element content as root
    */
    component.html = class extends HTMLElement {
        constructor(){
            super();
            /*
                in order to use document.createElement it's best if the constructor stays empty
            */
        };
        construct(){
            // Create a shadow root
            this._parent = this;
            if (!this.hasAttribute('override')){
                this._parent = this.attachShadow({mode: 'open'}); // sets and returns 'this.shadowRoot'
            }
            this.root = null;
            //
            this.props = {};
            this.state = {};
            for (let x=0;x<this.attributes.length;x++){
                this.props[this.attributes.item(x).name] = this.attributes.item(x).value;
            };
            if (!this.id){
                this.id = component.generateID();
            };
            //
            if (nine.router && nine.router.observer){
                nine.router.util.observe(this._parent);
            };
            //
        };
        connectedCallback(){
            if (this.isConnected){
                // this can cause BAD visual stutter
                // but better than anything else so far
                // call component.html constructor
                this.construct();
                //
                this.configure();
                this.css_inject();
                //this.hide();
                this.toggleOnLoad();
                //
                this.render();
                //this.show();
            };
        };
        disconnectedCallback(){ this.deconstruct(); };
        // for searching the ShadowDOM
        getById(elID) { return this.root.querySelector('#'+elID); };
        getByTagName(elTag){ return this.root.querySelectorAll(elTag); };
        getElementsByClassName(elClass){ return this.root.querySelectorAll("."+elClass); };
        getElementsByName(elName){ return this.root.querySelectorAll("*[name="+elName+"]"); };
        getElementsByAttribute(attrName){ return this.root.querySelectorAll("*["+attrName+"]") };
        //
        show(){ this.style.display = "flex"; };
        hide(){ this.style.display = "none"; };
        //
        toggleOnLoad(){
            if (this.classList.contains('hidden')){
                this.classList.toggle('hidden');
            };
        }
        show_v(){ this.style.visibility = "visible" }
        hide_v(){ this.style.visibility = "hidden" };
        // stuff after constructor, override in custom component
        configure(){};
        // stuff after render, override in custom component
        postRender(){};
        // stuff after disconnect, override in custom element
        deconstruct(){};
        // css injection into shadowdom
        css_inject(){
            // like this, calling render() is... ok?
            if (!this.hasAttribute('override')){
                for (let _idx=0;_idx<component.stylesheets.length;_idx++){
                    let el_style = document.createElement("style");
                    el_style.innerText = "@import url( '"+component.stylesheets[_idx]+"' )"
                    this._parent.appendChild(el_style);
                };
            };
        };
        // ...better, odd behavior on iOS<12 but it's being polyfilled
        render(){
            //
            let _has_innerhtml = (this.innerHTML != "");
            let _has_template = (this.template() != "");
            let _root_obj = null;
            // avoid shadowDOM?
            if (!this.hasAttribute('override')){
                if (_has_template){
                    let _root_obj_jst = doT.template(this.template());
                    _root_obj = htmlToElement(_root_obj_jst(this));
                    let _avail_slots = _root_obj.getElementsByTagName("slot").length;
                    if (_avail_slots==0 && _has_innerhtml){
                        _root_obj.appendChild(document.createElement("slot"));
                    };
                } else {
                    // with css injection, should there always be a slot? for now, yes
                    _root_obj = document.createElement("slot");
                };
                //
                if (_root_obj){
                    if (this.root){
                        this.root.replaceWith(_root_obj);
                        this.root.remove();
                    };
                    this.root = _root_obj;
                    if (!(this.root.parentNode===this._parent)){
                        this._parent.appendChild(this.root);
                    };
                } else {
                    // we do this so that the convention is always to work with this.root
                    // because of css injection caveat above, this should never happen
                    this.root = this._parent;
                };
            } else {
                //
                let _firstChild = this.firstElementChild;
                // this._parent = _firstChild;
                this.root = _firstChild;
            };
            //
            // hook in events, can be overridden in postRender
            if (this.onClick){
                this.onmouseup = this.onClick;
            }
            //
            this.postRender();
        };
        //
        template(){ return '' };
        /* In react this changes the component.state, then pushes a ref to component.render to the mcp. push a func ref along with the state change? */
        setState(){};
        //
    };
    component.register('nine-html', component.html);
    //

    // button
    component.button = class extends component.html {
        icon(iconName){
            this.innerHTML = nine.util.global_get(iconName);
            let _svg = this.querySelector('svg');
            if (_svg.classList.contains('fa-w-auto')){
                _svg.classList.toggle('fa-w-auto');
            };
        }
        postRender(){
            if (this.hasAttribute('icon')){
                this.icon(this.getAttribute('icon'));
            };
            if (this.hasAttribute('href')){
                let _href = document.createElement('a');
                _href.setAttribute('href',this.getAttribute('href'));
                _href.innerHTML = this.root.innerHTML;
                this.root.innerHTML = "";
                this.root.appendChild(_href);
            };
            this.btn = this._parent.querySelector('.nine-button');
            var self = this;
            // bad monkeypatch for touch devices
            if ('ontouchstart' in window){
                self.btn.ontouchstart = function(){
                    if (!self.btn.classList.contains('nine-button-active')){
                        self.btn.classList.toggle('nine-button-active');
                    };
                };
                self.btn.ontouchend = function(){
                    if (self.btn.classList.contains('nine-button-active')){
                        self.btn.classList.toggle('nine-button-active');
                    };
                };
            } else {
                self.btn.onmousedown = function(){
                    if (!self.btn.classList.contains('nine-button-active')){
                        self.btn.classList.toggle('nine-button-active');
                    };
                };
                self.btn.onmouseup = function(){
                    if (self.btn.classList.contains('nine-button-active')){
                        self.btn.classList.toggle('nine-button-active');
                    };
                };
            };
        }
        template(){
            return `<div class="nine-button"><div></div><slot></slot></div>`;
        };
        //
        onClick(){
            document.activeElement && document.activeElement.blur();
            if (this.hasAttribute('panel')){
                let panelEl = document.querySelector('nine-panel[name='+this.getAttribute('panel')+']')
                if (panelEl){ panelEl.open(); }
            }
            else if (this.hasAttribute('route')){
                //
                nine.router.navigate(this.getAttribute('route'))
            }
        }
    }
    component.register('nine-button', component.button);
    //

    // file input
    component.file = class extends component.html {
        postRender(){
            let self = this;
            this.label = this.getById(this.id+'-filename');
            this.file = this.getById(this.id+'-file');
            this.fileName = null;
            this.fileData = null;
            this.file.oninput = function(e){
                let _filename = self.file.files[0].name;
                self.fileName = _filename;
                self.label.innerText = _filename;
                component.spinner.open('file_load');
                self.fileLoad();
            };
        };
        template(){
            return `
            <div class="nine-file-upload">
            <label class="nine-file-upload-label">
            <input id="{{=obj.id}}-file" type="file">
            <div id="{{=obj.id}}-filename">file_name</div>
            </label>
            </div>
            `;
        };
        //
        fileLoad(callbackFunc){
            let self = this;
            let freader = new FileReader();
            // fire event when file loaded into memory
            freader.addEventListener("load", function () {
                self.fileData = freader.result;
                if (callbackFunc){
                    callbackFunc(self.fileData);
                }
                component.spinner.close('file_load');
            }, false);
            // convert image file to base64 URL string
            freader.readAsDataURL(this.file.files[0]);
        }
        //
    }
    component.register('nine-file', component.file);
    //

    // navigate
    component.navigate = class extends component.html {
        postRender(){
            var headerEl = this.querySelector('header');
            var footerEl = this.querySelector('footer');
            if (headerEl){
                headerEl.setAttribute('class','nine-navigate-head-bar');
                headerEl.setAttribute('slot','header');
            };
            if (footerEl){
                footerEl.setAttribute('class','nine-navigate-foot-bar');
                footerEl.setAttribute('slot','footer');
            } else {
                //
                this._parent.querySelector('.nine-navigate-foot').remove();
                this._parent.querySelector('.nine-navigate-body').classList.toggle('nine-navigate-body-plus');
            };
            this.style.visibility = "visible";
            this.body = this._parent.querySelector('.nine-navigate-body');
            this.view = this._parent.querySelector('.nine-navigate-view');
            window.nineView = this.view;
        };
        template(){
            return `
            <div class="nine-navigate">
                <div class="nine-navigate-head"><slot name="header"></slot></div>
                <div class="nine-navigate-body">
                    <div class="nine-navigate-view">
                        <slot></slot>
                    </div>
                </div>
                <div class="nine-navigate-foot"><slot name="footer"></slot></div>
            </div>
            `;
        };
    };
    component.register('nine-navigate', component.navigate);
    //

    // accordion
    component.accordion = class extends component.html {
        configure(){
        };
        postRender(){
            var self = this;
            this.header = this._parent.querySelector('.nine-accordion-title');
            this.content = this._parent.querySelector('.nine-accordion-content');
            //
            var titleEl = this.querySelector('*[type=header]');
            if (titleEl){
                titleEl.setAttribute('slot','title');
            };
            //
            this.header.onmouseup = function(){
                self.expand();
            };
            //
        };
        expand(){
            var self = this;
            if (self.content.classList.contains('nine-accordion-content-show')){
                this.header.setAttribute('data-content','>')
            } else {
                this.header.setAttribute('data-content','<')
            }
            self.content.classList.toggle('nine-accordion-content-show')
        }
        template(){
            return `
            <div id="{{=obj.id}}-accordion" class="nine-accordion">
                <div class="nine-accordion-title" data-content=">">
                    <slot name="title"></slot>
                </div>
                <div class="nine-accordion-content"><slot></slot></div>
            </div>
            `;
        };
        //
    };
    component.register('nine-accordion', component.accordion);
    //

    // panel
    component.panels = {};
    component.panel = class extends component.html {
        postRender(){
            var self = this;
            if (!this.props.name){
                this.props.name = this.id;
            }
            component.panels[this.props.name] = this;
            this.panel = this.root;
            if (!this.props.type){
                this.props.type = 'right';
            };
            this.panel_screen = this.root.querySelector('.nine-panel-'+this.props.type+'-screen')
            this.panel_body = this.root.querySelector('.nine-panel-'+this.props.type+'-body')
            this.panel_screen.onmouseup = function(e){ self.open(); };
            this.panel_body.onmouseup = function(e){ e.preventDefault(); };
            // since position:fixed, we have to move relative to the parent,we assume it's always in a nine-navigate-body
            // happens in the function because of back compat issues
            let __resize = function(){
                let __parent = self.parentElement.body;
                self.style.top = __parent.offsetTop+"px";
                self.style.height = __parent.offsetHeight+"px";
                self.style.width = __parent.offsetWidth+"px";
            };
            self.resize = __resize;
            window.addEventListener('resize',function(){
                __resize()
            },true);
            __resize();
        };
        template(){
            return `
            <div id="{{=obj.id}}-panel" class="nine-panel-{{=obj.props.type}}">
                <div class="nine-panel-{{=obj.props.type}}-screen"></div>
                <div class="nine-panel-{{=obj.props.type}}-body"><slot></slot></div>
            </div>
            `;
        };
        //
        deconstruct(){
            if (this.props.name in component.panels){
                delete component.panels[this.props.name];
            }
        };
        //
        static clear(){
            let _keys = Object.keys(component.panels);
            _keys.forEach(function(_key){
                component.panels[_key].open();
            });
        };
        //
        static open(panelName){
            if(panelName.indexOf('://')>-1){ panelName = panelName.slice(panelName.indexOf('://')+3) }
            if (panelName in component.panels){
                component.panels[panelName].open();
            }
        };
        open(){
            this.resize();
            if (this.classList.contains('nine-panel-'+this.props.type+'-open')){
                if (this.onclose){
                    this.onclose();
                };
            };
            this.classList.toggle('nine-panel-'+this.props.type+'-open');
            this.panel.classList.toggle('nine-panel-'+this.props.type+'-open');
            this.panel_screen.classList.toggle('nine-panel-'+this.props.type+'-screen-open');
            this.panel_body.classList.toggle('nine-panel-'+this.props.type+'-body-open');
            if (this.classList.contains('nine-panel-'+this.props.type+'-open')){
                if (this.onopen){
                    this.onopen();
                }
            };
        };
    };
    // load scheme handler in router
    if ('router' in nine){
        nine.router.schemes['panel'] = component.panel.open;
    }
    component.register('nine-panel', component.panel);
    //

    // list
    component.list = class extends component.html {
        postRender(){};
        template(){
            return `
            <ul id="{{=obj.id}}-list" class="nine-list-buttons">
                <slot></slot>
            </ul>
            `;
        };
        //
    };
    component.register('nine-list', component.list);
    //

    // progress
    component.progress = class extends component.html {
        postRender(){
            this.slider = this.root.querySelector('span');
        };
        template(){
            return `
            <div  id="{{=obj.id}}-progress" class="nine-progress">
                <span></span>
            </div>
            `;
        };
        //
        value(sliderWidth){
            this.slider.style.width = sliderWidth;
        };
        //
    };
    component.register('nine-progress', component.progress);
    //

    // popup
    component.popups = {};
    component.popup = class extends component.html {
        postRender(){
            var self = this;
            if (!this.props.name){
                this.props.name = this.id;
            }
            component.popups[this.props.name] = this;
            this.popup = this.root;
            this.screen = this.root.querySelector('.nine-popup-screen')
            this.view = this.root.querySelector('.nine-popup-view')
        };
        template(){
            return `
            <div  id="{{=obj.id}}-popup" class="nine-popup">
                <div class="nine-popup-screen"></div>
                <div class="nine-popup-view"><slot></slot></div>
            </div>
            `;
        };
        //
        deconstruct(){
            if (this.props.name in component.popups){
                delete component.popups[this.props.name];
            }
        };
        //
        // this isn't so great, shouldn't be using innerHTML like this
        static create(_name,_body){
            let elObj = document.createElement('nine-popup');
            elObj.setAttribute('name',_name);
            if (typeof _body === 'string'){
                elObj.innerHTML = _body;
            } else if (typeof _body === 'object'){
                elObj.appendChild(_body);
            }
            document.body.appendChild(elObj);
        };
        static clear(){
            let _keys = Object.keys(component.popups);
            _keys.forEach(function(_key){
                component.popups[_key].close();
            });
        };
        // does this work?
        static open(popupName){
            if(popupName.indexOf('://')>-1){ popupName = popupName.slice(popupName.indexOf('://')+3) }
            if (popupName in component.popups){
                component.popups[popupName].open();
            }
        };
        //
        static close(popupName){
            component.popups[popupName].remove();
            delete component.popups[popupName];
        }
        //
        close(){
            component.popup.close(this.props.name);
        };
    };
    // load scheme handler in router
    if ('router' in nine){
        nine.router.schemes['popup'] = component.popup.open;
    };
    component.register('nine-popup', component.popup);
    //

    // spinner
    component.spinners = {};
    component.spinner = class extends component.html {
        postRender(){
            var self = this;
            if (!this.props.name){
                this.props.name = this.id;
            }
            component.spinners[this.props.name] = this;
            this.spinner = this.root;
        };
        template(){
            return `
            <div class="loadingio-spinner-rolling nodisplay"><div><div></div></div></div>
            `;
        };
        //
        static clear(){
            let _keys = Object.keys(component.spinners);
            _keys.forEach(function(_key){
                component.spinners[_key].close();
            });
        };
        //
        static open(spinnerName){
            if(spinnerName.indexOf('://')>-1){ spinnerName = spinnerName.slice(spinnerName.indexOf('://')+3) }
            if (spinnerName in component.spinners){
                component.spinners[spinnerName].open();
            } else {
                let _spinner = document.createElement('nine-spinner');
                _spinner.setAttribute('name',spinnerName);
                document.body.appendChild(_spinner);
                _spinner.open();
            }
        };
        open(){
            if (this.root.classList.contains('nodisplay')){ this.root.classList.toggle('nodisplay') };
        }
        //
        static close(spinnerName){
            let _spinner = component.spinners[spinnerName];
            if (!_spinner.root.classList.contains('nodisplay')){ _spinner.root.classList.toggle('nodisplay') };
            component.spinners[spinnerName].remove();
            delete component.spinners[spinnerName];
        }
        //
        close(){
            component.spinner.close(this.props.name);
        };
    };
    // load scheme handler in router
    if ('router' in nine){
        nine.router.schemes['spinner'] = component.spinner.open;
    };
    component.register('nine-spinner', component.spinner);
    //

    // select
    component.select = class extends component.html {
        configure(){
            // bootstrap options that are in the tag
            let self = this;

            /* slotchange event doesn't seem consistent across browsers....
            this._parent.addEventListener( 'slotchange', function(ev){      
                console.log('slotchange');
                let node = self.querySelector( 'option' )
                node && self.select.appendChild( node )
            });
            */
        }
        postRender(){
            this.select = this._parent.querySelector('select');
            // monkeypatch for slotchange event inconsistency
            for (let _node of this.querySelectorAll('option')){
                this.select.appendChild(_node);
            };
        };
        //
        get value(){
            if (!this.select.hasAttribute('multiple')){
                return this.select.value;
            } else {
                let _ret = [];
                for (let __opt of Array.from(this.select.options)){
                    if (__opt.selected){_ret.push(__opt.value)}
                };
                return _ret;
            }
        };
        set value(_val){
            this.select.value = _val;
        };
        //
        addOption(_text,_value){
            let _opt = document.createElement('option');
            _opt.setAttribute('value',_value);
            _opt.innerText = _text;
            this.select.appendChild(_opt);
        };
        clear(){
            this.select.innerHTML = ""
        };
        //
        template(){
            return `
            <div id="{{=obj.id}}-selector" class="nine-select">
                <label class="nine-select-label" for="{{=obj.id}}-select">
                    <div>{{=obj.props.label}}</div>
                    <select name="{{=obj.id}}-select" id="{{=obj.id}}-select">
                    </select>
                    <slot></slot>
                </label>
            </div>
            `;
        };
        //
    };
    component.register('nine-select', component.select);
    //
    
    // date select
    // complex copmponent, uses other components
    // has special sauce for only current use case
    component.dateselect = class extends component.html {
        configure(){
            //
        }
        postRender(){
            var self = this;
            this.year = this._parent.querySelector('nine-select[label=Year]');
            this.month = this._parent.querySelector('nine-select[label=Month]');
            this.day = this._parent.querySelector('nine-select[label=Day]');
            let _currentdate = new Date();
            // helpers
            let _savedate = function(){
                let _date_str = self.year.value+'-'+(self.month.value).slice(-2)+'-'+(self.day.value).slice(-2)
                nine.storage.local.set(self.props.name,_date_str);
                // special sauce, best make this generic
                if (self.querySelector('p[id=date_display]')){
                    self.querySelector('p[id=date_display]').innerText = daycount(self.props.name);
                };
            };
            let _year_change = function(){
                _month_change({target:self.month.select});
                _savedate();
            }
            let _month_change = function(event){
                // if no value...
                if (!event.target.value){ event.target.value=0 };
                // try to save the date
                let _old_day = self.day.select.value;
                // clear the board
                self.day.select.innerHTML = "";
                // how many days
                let _month_length = nine.date.month_days[Number(event.target.value)-1];
                // leap year?
                if (event.target.value==2 && nine.date.isLeap(self.year.value)){
                    _month_length+=1;
                }
                //populate
                for (let _i=1;_i<_month_length+1;_i++){
                    self.day.addOption(_i.toString(),_i);
                };
                if (self.day.select.innerHTML.indexOf('value="'+_old_day+'"')>-1){
                    self.day.select.value = _old_day
                }
                // save?
                if (!event.nosave){
                    _savedate();
                };
            }
            // years
            let _currentyear = _currentdate.getFullYear();
            let _startyear = null;
            if (this.props.startyear){
                _startyear = Number(this.props.startyear);
            } else {
                _startyear = 1970;  // unix epoch year
            };
            for (let _i=_currentyear;_i>_startyear-1;_i--){
                this.year.addOption(_i.toString(),_i);
            };
            // months
            for (let _i=0;_i<nine.date.months.length;_i++){
                let _monthname = nine.date.months[_i];
                this.month.addOption(_monthname,_i+1);
            }
            // load
            _month_change({target:this.month.select,nosave:1})
            // load from loacalstorage or the current date
            let _saveddate = null;
            if (nine.storage.local.has(this.props.name)){
                _saveddate = nine.storage.local.get(this.props.name);
                console.log(_saveddate);
                let _splitdate = _saveddate.split('-');
                this.year.value = _splitdate[0];
                this.month.value = _splitdate[1];
                this.day.value = _splitdate[2];
            } else {
                _saveddate = new Date();
                this.year.value = _saveddate.getFullYear();
                this.month.value = _saveddate.getMonth()+1;
                this.day.value = _saveddate.getDate();
            };
            // event handlers
            // we *might* be oversaving
            this.year.select.addEventListener('input', _year_change );
            this.year.select.addEventListener('change', _year_change );
            this.month.select.addEventListener('input', _month_change );
            this.month.select.addEventListener('change', _month_change );
            this.day.select.addEventListener('input', _savedate );
            this.day.select.addEventListener('change', _savedate );
        };
        template(){
            return `
            <nine-list>
                <li>
                    <nine-select label="Year"></nine-select>
                </li>
                <li>
                    <nine-select label="Month"></nine-select>
                </li>
                <li>
                    <nine-select label="Day"></nine-select>
                </li>
                <li>
                    <slot></slot>
                </li>
            </nine-list>
            `;
        };
        //
    };
    component.register('nine-dateselect', component.dateselect);
    //

    // exports
    nx.component = component;
    //
    nine.util.global(nx,'nine');
}());
//