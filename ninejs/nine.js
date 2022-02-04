/*
    nine.js v0.3 by @nxnine
    needed to refactor UI drawing logic for mobile and accidentally made a framework
    the only goal is to stay vanilla javascript/cordova compliant and simple

    consists of:
    date.js - date manipulation
    hash.js - CRC32, MD5
    hash_sha256.js - forge SHA256
    emit.js - event emitters
    icons.js - SVG icons
    icons_fa.js - Font Awesome Free 5.15.0 icons
    request.js - XMLHTTPRequest originally from Framework7, tweaked and added an internal cache mechanism
    snowflake.js - Twitter Snowflake implementation
    doT.js - doT JavaScript Templates
    router.js - SPA Router
    component.js - WebComponent based components
    pdfviewer.js - PDFJS based pdf viewer

    did my best to place attribution notices where they should be.
    "nineJS" is taken by a few other projects, this is not any of those.
    unapologetically badly commented.
*/
(function () {
    //
    var nx = {}, _globals;
    //

    // logger
    function logTimestamp(){
        let _date_string = new Date().toISOString();
        let _date_day_delim = _date_string.indexOf('T');
        let _date_ms_delim = _date_string.indexOf('.');
        let _day_str = _date_string.slice(0,_date_day_delim);
        let _time_str = _date_string.slice(_date_day_delim+1,_date_ms_delim);
        return _day_str+' '+_time_str
    }
    var _local_console_log = console.log;
    var _local_console_warn = console.warn;
    var _local_console_error = console.error;
    function logHeader(_timestamp,_prefix,_m){ return '['+_timestamp+']('+_prefix+')  ' };
    class Logger extends Function {
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
                _console_func.apply(console,[_log_header]);
                _console_func.apply(console,[_msg]);
            };
            //
            for (let __handler of this.handlers){
                __handler(...__args);
            };
        };
    };
    nx.log = new Logger();
    console.log = function(){ nx.log(...arguments); };
    console.warn = function(){ nx.log('WARN',...arguments); }
    console.error = function(){ nx.log('ERROR',...arguments); }
    //

    //
    nx.storage = {};
    // localStorage helper
    nx.storage.local = {};//window.localStorage;
    nx.storage.local.get = function(ls_key){
        return window.localStorage.getItem(ls_key);
    };
    nx.storage.local.set = function(ls_key,ls_value){
        window.localStorage.setItem(ls_key,ls_value);
    };
    nx.storage.local.has = function(ls_key){
        return ls_key in window.localStorage;
    };
    //

    /*
        add to global scope
    */
    _globals = (function(){ return this || (0,eval)("this"); }());
    //
    var global_get = function(_name){
        //
        let _b_obj = _globals;
        let _b_name = _name;
        // do we have a delim?
        if (_name.indexOf('.')>0){
            // split the names up
            let _name_arr = _name.split('.');
            // loop through them
            for (let _i=0;_i<_name_arr.length;_i++){
                // set the name to use
                _b_name = _name_arr[_i]
                // does the obj already exist? are we at the end of the list?
                if (_name_arr[_i] in _b_obj){
                    _b_obj = _b_obj[_name_arr[_i]];
                } else {
                    continue;
                };
            };
        } else {
            if (_b_name in _b_obj){
                _b_obj = _b_obj[_b_name];
            } else {
                return null;
            }
        };
        return _b_obj;
    }
    //
    var global = function(_b_child,_name){
        //
        var _assign = function(_parent,_child,_name){
            if (_name in _parent){
                if (typeof _parent[_name] === 'object' && typeof _child === 'object'){
                    Object.assign(_parent[_name],_child);
                    return;
                };
            };
            _parent[_name] = _child
        };
        //
        let _b_obj = _globals;
        let _b_name = _name;
        // do we have a delim?
        if (_name.indexOf('.')>0){
            // split the names up
            let _name_arr = _name.split('.');
            // loop through them
            for (let _i=0;_i<_name_arr.length;_i++){
                // set the name to use
                _b_name = _name_arr[_i]
                // does the obj already exist? are we at the end of the list?
                if (_name_arr[_i] in _b_obj && _i!=(_name_arr.length-1)){
                    _b_obj = _b_obj[_name_arr[_i]];
                } else {
                    continue;
                };
            };
        };
        _assign(_b_obj,_b_child,_b_name)
    };
    //

    /*
        script loader - in order, quick and dirty

        based off:
            https://www.html5rocks.com/en/tutorials/speed/script-loading/
            https://stackoverflow.com/questions/16230886/trying-to-fire-the-onload-event-on-script-tag
    */
    var _loader_array = [];
    var _loader_processing = false;
    function _loader_array_process(){
        _loader_processing = true;
        if (_loader_array.length>0){
            try {
                let _loader_array_file = _loader_array.shift();
                if (_loader_array_file.endsWith('.js')){
                    let scriptEl = document.createElement('script');
                    document.head.appendChild(scriptEl);
                    scriptEl.onload = _loader_array_process;
                    scriptEl.onerror = _loader_array_process;
                    scriptEl.async = false;
                    scriptEl.src = _loader_array_file;
                }
                else if (_loader_array_file.endsWith('.css')){
                    let linkEl = document.createElement('link');
                    linkEl.type = 'text/css';
                    linkEl.rel = 'stylesheet';
                    linkEl.onload = _loader_array_process;
                    linkEl.onerror = _loader_array_process;
                    linkEl.href = _loader_array_file;
                    document.head.appendChild(linkEl);
                    //
                    if (nine.component){
                        nine.component.stylesheets_load();
                    }
                }
            } finally {};
        }
        else {
            _loader_processing = false;
        }
    };
    var loader = {
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

    /*
        sequential command execution
    */
    var _command_array = [];
    var _command_processing = false;
    var _command_promise = Promise.resolve();
    function commands(command_array){
        let command_array_obj = null;
        _command_array.push(...command_array)
        var proc_arr = function(){
            _command_processing = true;
            while (_command_array.length>0){
                command_array_obj = _command_array.shift();
                if(command_array_obj){
                    _command_promise = _command_promise.then(function(_res){
                        return new Promise(function(resolve,reject){
                            try {
                                resolve(command_array_obj());
                            } catch(err) {
                                console.log('::err: '+err);
                                resolve();
                            }
                        });
                    });
                }
            };
            if (_command_array.length==0){
                _command_processing = false;
            };
        };
        if (!_command_processing){
            proc_arr();
        };
    };
    //

    //
    // util
    nx.util = {};
    nx.util.loader = loader;
    nx.util.scripts = loader.scripts;
    nx.util.commands = commands;
    nx.util.global = global;
    nx.util.global_get = global_get;
    //

    // touch events
    class touchObserver {
        constructor(targetEl){
            var self = this;
            this.element = targetEl;
            //
            this.swipe = false;
            this._swipe_start = null;
            this._swipe_last = null;
            this._swipe_track_left_right = false;
            this._swipe_track_up_down = false;
            this._swipe_track_move = true;
            //
            this.pinch = false;
            this.prevDiff = 0;
            //
            targetEl.addEventListener("touchstart", this.handleStart.bind(this), false);
            targetEl.addEventListener("touchend", this.handleEnd.bind(this), false);
            targetEl.addEventListener("touchcancel", this.handleCancel.bind(this), false);
            targetEl.addEventListener("touchmove", this.handleMove.bind(this), false);
            //
        };
        //
        //
        handleStart(ev){
            if (ev.touches.length==1){
                this.swipe = true;
                this._swipe_start = ev.touches[0];
                this._swipe_last = ev.touches[0];
                this.element.dispatchEvent(new CustomEvent('swipeStart', { bubbles: true, detail:{touch:ev.touches[0]} }));
            };                
            if (ev.touches.length==2){
                this.swipe = false;
                this.element.dispatchEvent(new CustomEvent('swipeEnd', { bubbles: true, detail:{touch:ev.touches[0]} }));
                this._swipe_start = null;
                this._swipe_last = null;
                this.pinch = true;
            };
        };
        handleEnd(ev){
            if (this.swipe){
                this.swipe=false;
                this._swipe_start = null;
                this._swipe_last = null;
                this.element.dispatchEvent(new CustomEvent('swipeEnd', { bubbles: true, detail:{touch:ev.touches[0]} }));
            };
            if (ev.touches.length!=2){
                if (this.pinch){
                    this.pinch = false;
                    this.element.dispatchEvent(new CustomEvent('pinchZoomEnd', { bubbles: true, detail:{touches:ev.touches} }));
                };
            };
        };
        handleCancel(ev){
            this.prevDiff = 0;
            this.pinch = false;
            if (this.swipe){
                this.swipe=false;
                this._swipe_start = null;
                this._swipe_last = null;
                this.element.dispatchEvent(new CustomEvent('swipeEnd', { bubbles: true, detail:{touch:ev.touches[0]} }));
            };
        };
        handleMove(ev){
            if (this.swipe && ev.touches.length==1){
                let _x1 = this._swipe_last.clientX;
                let _x2 = ev.touches[0].clientX;
                let _y1 = this._swipe_last.clientY;
                let _y2 = ev.touches[0].clientY;
                //
                if (this._swipe_track_move){
                    ev.target.dispatchEvent(new CustomEvent('swipeMove', { bubbles: true, detail:{start:this._swipe_start, touch:ev.touches[0]} }));
                };
                // this might be better served in handleEnd
                if (this._swipe_track_left_right){
                    if (_x2>_x1){
                        ev.target.dispatchEvent(new CustomEvent('swipeRight', { bubbles: true, detail:{start:this._swipe_start, touch:ev.touches[0]} }));
                    } else if (_x2<_x1){
                        ev.target.dispatchEvent(new CustomEvent('swipeLeft', { bubbles: true, detail:{start:this._swipe_start, touch:ev.touches[0]} }));
                    };
                };
                if (this._swipe_track_up_down){
                    if (_y2>_y1){
                        ev.target.dispatchEvent(new CustomEvent('swipeUp', { bubbles: true, detail:{start:this._swipe_start, touch:ev.touches[0]} }));
                    } else if (_y2<_y1){
                        ev.target.dispatchEvent(new CustomEvent('swipeDown', { bubbles: true, detail:{start:this._swipe_start, touch:ev.touches[0]} }));
                    };
                };
                this._swipe_last = ev.touches[0];
                //
            };
            if (this.pinch && ev.touches.length==2){
                let _t1 = ev.touches[0];
                let _t2 = ev.touches[1];
                // algebra helps us determine the midpoint between the touches
                let _midpointX = (_t2.screenX+_t1.screenX)/2
                let _midpointY = (_t2.screenY+_t1.screenY)/2
                // algebra helps us determine the distance between the touches
                let _dist = Math.round(Math.sqrt(Math.pow((_t2.screenX-_t1.screenX),2)+Math.pow((_t2.screenY-_t1.screenY),2)));
                if (this.prevDiff!=0 && _dist!=this.prevDiff && _dist%2==0){
                    // details
                    let _detail = {touches:ev.touches,distance:_dist,midpointX:_midpointX,midpointY:_midpointY};
                    // the distance has gotten smaller, so we're zooming out
                    if (_dist<this.prevDiff){
                        this.element.dispatchEvent(new CustomEvent('pinchZoomOut', { bubbles: true, detail:_detail }));
                    // the distance has gotten larger, so we're zooming in
                    } else if (_dist>this.prevDiff){
                        this.element.dispatchEvent(new CustomEvent('pinchZoomIn', { bubbles: true, detail:_detail }));
                    }
                }
                this.prevDiff = _dist;
            };
        };
    };
    nx.util.touchObserver = touchObserver;
    //

    // export
    nx.util.global(nx,'nine');
    //
}());

// dependency load
nine.util.scripts([
    "./ninejs/date.js",
    "./ninejs/hash.js",
    "./ninejs/hash_sha256.js",
    "./ninejs/emit.js",
    "./ninejs/icons.js",
    "./ninejs/icons_fa.js",
    "./ninejs/request.js",
    "./ninejs/snowflake.js",
    "./ninejs/doT.js",
    "./ninejs/router.js",
    "./ninejs/nine.css",
    "./ninejs/component.js",
    "./ninejs/pdfviewer.css",
    "./ninejs/pdfjs/pdf.js",
    "./ninejs/pdfviewer.js"
]);
//