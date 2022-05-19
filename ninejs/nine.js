/*
    nine.js v0.3 by @nxnine
    
    needed to refactor UI drawing logic and accidentally made a framework
    the only goal is to stay vanilla javascript/cordova compliant and have fun

    history:
        v0.0 :
            bolted onto an element in the DOM
            createElement madness
        v0.1 :
            bolted onto an element in the DOM
            doT templates and html injection
        v0.2 :
            utilizes Web Components ( https://developer.mozilla.org/en-US/docs/Web/Web_Components )
            primitive SPA router
            runtime script loading
        v0.3
            // forgot to update this, things probably missing
            SVG icons based on FontAwesome v5
            PDF viewer
            timezone date objects based on feature detection
            font resources
            optional polyfills for attempting back compatibility
*/

(function () {
    //
    var nx = {}, _globals;
    //

    // logger
    function logTimestamp(){
        let _now = new Date();
        return `${_now.getFullYear()}-${('0'+_now.getMonth()).slice(-2)}-${('0'+_now.getDate()).slice(-2)} ${('0'+_now.getHours()).slice(-2)}:${('0'+_now.getMinutes()).slice(-2)}:${('0'+_now.getSeconds()).slice(-2)}`;
    };
    function logHeader(_prefix,_m){ return `[${logTimestamp()}](${_prefix})` };
    var _local_console_log = console.log;
    var _local_console_warn = console.warn;
    var _local_console_error = console.error;
    // console.log with timestamps
    class Logger {
        constructor(_prefix){
            this.prefix = _prefix || 'LOG';
        };
        get log(){
            return console.log.bind(window.console,logHeader(this.prefix));
        };
        get warn(){
            return console.warn.bind(window.console,logHeader(this.prefix));
        };
        get error(){
            return console.error.bind(window.console,logHeader(this.prefix));
        };
    }
    // experimental logger, WIP
    class externalLogger extends Function {
        constructor(_prefix) {
            super('...args', 'return this.__self__.__call__(...args)')
            var self = this.bind(this);
            this.__self__ = self;
            //
            if (!_prefix){
                _prefix = 'LOG';
            }
            self.prefix = _prefix;
            self.handlers = [];
            // _local_console_log.apply(console,[typeof __ninejs_console_log]);
            self.console = typeof __ninejs_console_log!='undefined' ? __ninejs_console_log : true;
            //
            return self
        };
        clearHandlers(){
            this.handlers = [];
        };
        addHandler(handler_func){
            this.handlers.push(handler_func);
        };
        //
        __call__() {
            let __args = Array.from(arguments);
            //
            let _type = this.prefix;
            if (__args.length==1){__args.unshift(this.prefix);};
            if (__args.length>1){
                _type = __args[0];
            };
            if (__args.length==3){
                __args = __args.slice(1);
            };
            __args.unshift(logTimestamp());
            //
            let _timestamp = __args[0];
            let _prefix = __args[1];
            let _msg = __args[2];
            let _log_header = logHeader(_timestamp,_prefix);
            let _console_func = _local_console_log;
            if (_type.toLowerCase()=='warn'){ _console_func = _local_console_warn; };
            if (_type.toLowerCase()=='error'){ _console_func = _local_console_error; };
            if (this.console){
                // _console_func.apply(console,[_log_header+_msg]);
                _console_func.apply(console,[_log_header]);
                _console_func.apply(console,[_msg]);
            };
            //
            for (let __handler of this.handlers){
                __handler(...__args);
            };
        };
    };
    var _debug = new Logger();
    nx.debug = _debug;
    //

    //
    nx.storage = {};
    // localStorage helper
    class storageLocal {
        constructor(ls_namespace=""){ this.ns(ls_namespace) };
        ns(ls_namespace){ this.__ns = ls_namespace };
        get(ls_key){ return window.localStorage.getItem(this.__ns+ls_key) };
        set(ls_key,ls_value){ window.localStorage.setItem(this.__ns+ls_key,ls_value) };
        has(ls_key){ return this.__ns+ls_key in window.localStorage };
    }
    nx.storage.local = new storageLocal();//window.localStorage;
    //

    /*
        add to/get from global scope
    */
    nx.global = {};
    _globals = (function(){ return this || (0,eval)("this"); }());
    //
    nx.global.obj = _globals;
    nx.global.get = function(_name){
        let __obj = _globals;
        let __names = _name.split('.');
        for (let __name of __names){
            if (!(__name in __obj)) return null;
            __obj = __obj[__name];
        };
        if (__obj == _globals) return null;
        return __obj;
    };
    //
    nx.global.set = function(_b_child,_name){
        var _assign = function(_parent,_child,_name){
            if (_name in _parent && typeof _parent[_name] === 'object' && typeof _child === 'object'){
                Object.assign(_parent[_name],_child);
                return;
            };
            _parent[_name] = _child
        };
        let __obj = _globals;
        let __idx = _name.lastIndexOf('.');
        if (__idx>0){
            __obj = nx.global.get(_name.slice(0,__idx));
            if (__obj==null) return;
            _name = _name.slice(__idx+1);
        };
        _assign(__obj,_b_child,_name);
    };
    //

    /*
        script loader - in order, quick and dirty

        based off:
            https://www.html5rocks.com/en/tutorials/speed/script-loading/
            https://stackoverflow.com/questions/16230886/trying-to-fire-the-onload-event-on-script-tag
    */
    var _cache_bust = true;
    function _loader_filename(_loader_file){
        if (_loader_file.indexOf('??')>0){
            let _loader_opts = _loader_file.split('??');
            let _loader_files = _loader_opts[1].split(':');
            if (nx.global.get(_loader_opts[0])!=null){
                _loader_file = _loader_files[0];
            } else {
                _loader_file = _loader_files[1];
            }
        };
        if (_cache_bust){
            if (_loader_file.indexOf('?')>0){
                _loader_file=_loader_file+'&cache_bust='+Date.now()
            } else {
                _loader_file=_loader_file+'?cache_bust='+Date.now()
            }
        };
        return _loader_file;
    }
    function _attach_js(js_file,load_callback,_passobj=null,_pass=false,_passvars=null){
        let scriptEl = document.createElement('script');
        document.head.appendChild(scriptEl);
        if (load_callback){
            if (!_passobj){
                scriptEl.onload = load_callback;
                scriptEl.onerror = load_callback;
            } else {
                if (!_pass){
                    scriptEl.onload = load_callback.bind(_passobj);
                    scriptEl.onerror = load_callback.bind(_passobj);
                } else {
                    scriptEl.onload = load_callback.bind(_passobj,scriptEl,..._passvars);
                    scriptEl.onerror = load_callback.bind(_passobj,scriptEl,..._passvars);
                };
            };
        }
        scriptEl.async = false;
        scriptEl.src = js_file;
        return scriptEl;
    };
    function _attach_css(css_file,load_callback,_passobj=null,_pass=false,_passvars=null){
        let linkEl = document.createElement('link');
        linkEl.type = 'text/css';
        linkEl.rel = 'stylesheet';
        if (load_callback){
            if (!_passobj){
                linkEl.onload = load_callback;
                linkEl.onerror = load_callback;
            } else {
                if (!_pass){
                    linkEl.onload = load_callback.bind(_passobj);
                    linkEl.onerror = load_callback.bind(_passobj);
                } else {
                    linkEl.onload = load_callback.bind(_passobj,linkEl,..._passvars);
                    linkEl.onerror = load_callback.bind(_passobj,linkEl,..._passvars);
                };
            }
        };
        linkEl.href = css_file;
        document.head.appendChild(linkEl);
        if (nine.component){
            nine.component.stylesheets_load();
        }
        return linkEl;
    };
    var _loader_array = [];
    var _loader_processing = false;
    function _loader_array_process(){
        _loader_processing = true;
        if (_loader_array.length>0){
            try {
                let _loader_array_file = _loader_filename(_loader_array.shift());
                //
                if (_loader_array_file.indexOf('.js')>0){
                    _attach_js(_loader_array_file,_loader_array_process);
                }
                else if (_loader_array_file.indexOf('.css')>0){
                    _attach_css(_loader_array_file,_loader_array_process);
                }
            } finally {};
        }
        else {
            _loader_processing = false;
        }
    };
    var loader = {
        file: _loader_filename,
        js: _attach_js,
        css: _attach_css,
        scripts: function(script_array){
            _loader_array.push(...script_array)
            if (!_loader_processing){
                _loader_array_process();
            };
        },
        loadnext: function(css_array){
            _loader_array.unshift(...css_array)
            if (!_loader_processing){
                _loader_array_process();
            };
        }
    }
    //

    // leading zero padding - 64 zero max
    var __64zero = '0000000000000000000000000000000000000000000000000000000000000000';
    function zeroPad(_string,_pad){
        return (__64zero+_string).slice(_pad*-1)
    };
    //

    // test if passed object is a function
    function isFunction(input){
        return (
            (typeof Function !== 'undefined' && input instanceof Function) ||
            Object.prototype.toString.call(input) === '[object Function]'
        );
    };
    //

    // derived from textFit.js v2.3.1 by STRML (strml.github.io)
    function textFit(els,if_bigger=false){
        // Convert objects into array
        if (typeof els.toArray === "function") { els = els.toArray(); };
        // Support passing a single el
        var elType = Object.prototype.toString.call(els);
        if (elType !== '[object Array]' && elType !== '[object NodeList]' && elType !== '[object HTMLCollection]'){
            els = [els];
        }
        // Process each el we've passed.
        for(var i = 0; i < els.length; i++){
            // remove repeated list comprehension
            var elem = els[i];
            // minimum padding + initial size
            var nPad = 2;
            var nSize = Math.min(elem.clientWidth, elem.clientHeight) - nPad;
            if (!if_bigger) elem.style.fontSize = nSize+"px"; //resize no matter what
            if(elem.scrollWidth > elem.clientWidth || elem.scrollHeight > elem.clientHeight){
                if (if_bigger) elem.style.fontSize = nSize+"px"; // resize if bigger than container
                // binary tree search
                var nHigh = nSize, nLow = 6;
                var nMid = (nHigh+nLow)>>1;
                while (nLow<=nHigh){
                    nMid = (nHigh+nLow)>>1;
                    elem.style.fontSize = nMid+"px";;
                    if (elem.scrollWidth <= elem.clientWidth && elem.scrollHeight <= elem.clientHeight){
                        nSize = nMid;
                        nLow = nMid + 1;
                    } else {
                        nHigh = nMid - 1;
                    };
                };
                elem.style.fontSize = (nSize - nPad)+"px";
            };
        };
    };
    //

    //
    // util
    nx.util = {};
    nx.util.loader = loader;
    nx.util.scripts = loader.scripts;
    // nx.util.commands = commands;
    // nx.util.css = loader.css;
    // nx.util.globals = _globals;
    // nx.util.global_set = global_set;
    // nx.util.global_get = global_get;
    //
    nx.util.zeroPad = zeroPad;
    nx.util.isFunction = isFunction;
    nx.util.textFit = textFit;
    //

    // export
    nx.global.set(nx,'nine');
    //
}());
// helpers
var has_intl = (Intl && 'formatToParts' in new Intl.DateTimeFormat()) || null;
var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
// dependencies
nine.util.scripts(['./ninejs/nine_load.js']);