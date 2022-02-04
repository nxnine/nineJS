/*
    Web Components ( https://developer.mozilla.org/en-US/docs/Web/Web_Components )
    because embedding react wasn't as much fun as I thought
    utilizes doT templates and css injection
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
    //var __id_generator = new SnowflakeID(31,31);
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
        let _css_links = document.querySelectorAll("link[rel=stylesheet")
        for (let _idx=0;_idx<_css_links.length;_idx++){
            component.stylesheets.push(_css_links[_idx].href);
        }
    };
    component.stylesheets_load();
    //

    // the base component
    /*
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
            // mutation observer will stop watching once object is released by GC
            if (nine.router && nine.router.observer){
                nine.router.util.observe(this._parent);
            };
            //
        };
        connectedCallback(){
            //console.log('nine.html.connectedCallback ['+this.id+']');
            if (this.isConnected){
                // not pretty, but works
                this.construct();
                //
                this.configure();
                this.css_inject();
                this.toggleOnLoad();
                //
                this.render();
            };
        };
        disconnectedCallback(){ this.deconstruct(); };
        // for searching the ShadowDOM
        getElementById(elID) { return this._parent.getElementById(elID); };
        getElementsByTagName(elTag){ return this._parent.querySelectorAll(elTag); };
        getElementsByClassName(elClass){ return this._parent.querySelectorAll("."+elClass); };
        getElementsByName(elName){ return this._parent.querySelectorAll("*[name="+elName+"]"); };
        getElementsByAttribute = function(attrName){ return document.querySelectorAll("*["+attrName+"]") };
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
        // if we don't, shadowdom has no style
        css_inject(){
            if (!this.hasAttribute('override')){
                for (let _idx=0;_idx<component.stylesheets.length;_idx++){
                    let el_style = document.createElement("style");
                    el_style.innerText = "@import url( '"+component.stylesheets[_idx]+"' )"
                    this._parent.appendChild(el_style);
                };
            };
        }
        render(){
            //
            let _has_innerhtml = (this.innerHTML != "");
            let _has_template = (this.template() != "");
            let _root_obj = null;
            //
            if (!this.hasAttribute('override')){
                if (_has_template){
                    let _root_obj_jst = doT.template(this.template());
                    _root_obj = htmlToElement(_root_obj_jst(this));
                    let _avail_slots = _root_obj.getElementsByTagName("slot").length;
                    if (_avail_slots==0 && _has_innerhtml){
                        _root_obj.appendChild(document.createElement("slot"));
                    };
                } else {
                    /* with css injection, should there always be a slot? for now, yes */
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
                this.root = _firstChild;
            };
            //
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
        /* In react this changes the component.state, one day we'll do the same */
        setState(){};
        /*
        */
    };
    component.register('nine-html', component.html);
    //

    // button
    component.button = class extends component.html {
        postRender(){
            if (this.hasAttribute('icon')){
                this.innerHTML = nine.util.global_get(this.getAttribute('icon'));
            }
            if (this.hasAttribute('href')){
                let _href = document.createElement('a');
                _href.setAttribute('href',this.getAttribute('href'));
                _href.innerHTML = this.root.innerHTML;
                this.root.innerHTML = "";
                this.root.appendChild(_href);
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
            this.file = this.getElementById(this.id+'-file');
            this.label = this.getElementById(this.id+'-filename');
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
        b64(callbackFunc){
            var freader = new FileReader();
            freader.addEventListener("load", function () {
                // convert image file to base64 string
                callbackFunc(freader.result);
                component.spinner.close("fileReader");
            }, false);
            component.spinner.open("fielReader");
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
            // since position:fixed, we have to move relative to the parent,we assume it's always in a nine-vanigate-body
            let __parent = self.parentElement._parent.querySelector('.nine-navigate-body');
            let __resize = function(){
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
                this.onclose();
            };
            this.classList.toggle('nine-panel-'+this.props.type+'-open');
            this.panel.classList.toggle('nine-panel-'+this.props.type+'-open');
            this.panel_screen.classList.toggle('nine-panel-'+this.props.type+'-screen-open');
            this.panel_body.classList.toggle('nine-panel-'+this.props.type+'-body-open');
            if (this.classList.contains('nine-panel-'+this.props.type+'-open')){
                this.onopen();
            };
        };
        onopen(){};
        onclose(){};
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
        // this isn't so great..
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
        // this doesn't mesh with current logic, but we could make it work
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
            // this.remove();
            // delete component.popups[this.props.name];
        };
    };
    // load scheme handler in router
    if ('router' in nine){
        nine.router.schemes['popup'] = component.popup.open;
    };
    component.register('nine-popup', component.popup);
    //

    // spinner
    // loadingio made this very easy
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
        // this doesn't mesh with current logic, but we could make it work
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
            this._parent.addEventListener( 'slotchange', ev => {      
                let node = this.querySelector( 'option' )
                node && this.select.appendChild( node )
            });
        }
        postRender(){
            this.select = this._parent.querySelector('select');
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
                nine.storage.local.set(self.props.name,self.year.value+'-'+('00'+self.month.value).slice(-2)+'-'+('00'+self.day.value).slice(-2)+'T00:00:00.000Z');
            };
            let _month_change = function(event){
                // if no value...
                if (!event.target.value){ event.target.value=0 };
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
                // save?
                if (!event.nosave){
                    _savedate();
                };
            }
            // years
            // this.props.startyear
            let _currentyear = _currentdate.getUTCFullYear();
            let _startyear = null;
            if (this.props.startyear){
                _startyear = Number(this.props.startyear);
            } else {
                _startyear = 1970;
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
            // this.props.name
            let _saveddate = null;
            if (nine.storage.local.has(this.props.name)){
                console.log(this.props.name);
                console.log(nine.storage.local.get(this.props.name));
                _saveddate = new Date(nine.storage.local.get(this.props.name));
            } else {
                _saveddate = new Date();
            };
            console.log(_saveddate)
            this.year.value = _saveddate.getUTCFullYear();
            this.month.value = _saveddate.getUTCMonth()+1;
            this.day.value = _saveddate.getUTCDate();
            // event handlers
            // we *might* be oversaving
            this.year.select.addEventListener('input', _savedate );
            this.year.select.addEventListener('change', _savedate );
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