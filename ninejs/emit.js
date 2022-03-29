/*
    emit.js by @nxnine
    
    event emitters - no bells and only small whistles
    borrows heavily from events.js
*/
(function () {
    //
    var emit = {}, _globals;
    //

    //
    // single event emitter
    class seEmit {
        constructor(){ this.listeners = [] };
        on(ftn) {
            if (typeof ftn === 'function') {
            this.listeners.push(ftn);
            }
            return this;
        };
        emit(...data) {
            this.listeners.forEach(function(ftn) {
                // ftn.call(this, data);
                ftn.apply(this,data);
            }, this);
        };
    };

    function __se_oncewrap(){
        if (!this.fired){
            this.target.remListener(this.type, this.wrapFn);
            this.fired = true;
            if (arguments.length === 0)
                return this.listener.call(this.target);
            return this.listener.apply(this.target, arguments);
        };
    };
    function __se_once(target, type, listener){
        let state = { fired: false, wrapFn: undefined, target, type, listener };
        let wrapped = __se_oncewrap.bind(state);
        wrapped.listener = listener;
        state.wrapFn = wrapped;
        return wrapped
    };
    // events.js eventEmitter mimic
    class simpleEmit {
        constructor(){
            this.events = {};
            this.maxListeners = 10;
            this.on = this.addListener;
            this.once = this.onceListener;
            this.off = this.remListener;
            this.emit = this.emitEvent;
        };
        addListener(type,listener){
            // should we mimic node.js events and optimize for single listener?
            if (typeof listener === 'function') {
                let _events = this.events;
                if (!(type in _events)){ _events[type] = [] };
                if(!(listener in _events[type])){
                    _events[type].push(listener);
                };
            };
        };
        onceListener(type, listener){
            this.addListener(type, __se_once(this, type, listener));
        };
        remListener(type,listener){
            if (typeof listener === 'function') {
                let _events = this.events;
                if (type in _events){
                    let _list = _events[type];
                    let _length = _list.length;
                    for (var i=0;i<_length;i++){
                        if (_list[i] === listener){
                            _events[type].splice(i,1);
                            break;
                        };
                    };
                    if (_list.length == 0){ delete _events[type] };

                };
            };
        };
        emitEvent(type,...args){
            let _events = this.events;
            if (type in _events){
                let _list = _events[type];
                //
                _list.forEach(function(listener) {
                    listener.apply(this,args);
                }, this);
            };
        };
        //
    };
    //
    
    // exports
    emit.single = seEmit;
    emit.event = simpleEmit;
    //
    nine.util.global(emit,'nine.emit')
}());