/*
    timer.js by @nxnine
    requires:
        emit.js

    event emitting timekeeping
    - loop
    - countdown
    - stopwatch
*/

(function () {
    //
    var timer = {};
    class loop extends nine.emit.event {
        constructor(interval=100){
            super();
            this.__interval = interval;
            this.__state = 0; //0 stopped, 1 running, 2 paused
        };
        stop() {
            this.__state = 0;
            this.emit('stop',null);
        };
        start() {
            if (this.__state != 1){
                this.__state = 1;
                this.emit('start',null);
                this.__tick();
            };
        };
        __tick(){
            //
            if (this.__state == 1){
                this.emit('tick',null);
                if (this.__state != 0){
                    setTimeout(this.__tick.bind(this), this.__interval);
                };
            };
        };
    };

    class countdown extends loop {
        constructor(duration,pastZero=false,interval=100){
            super(interval);
            this.duration = duration;
            this.pastZero = pastZero;
            this.__end = 0;
            this.__remaining = this.duration * 1000;
            //
            this.on('start',this._start);
            this.on('stop',this._stop);
            this.on('tick',this._tick);
        };
        pause(){
            this.__state = 2;
            this.__end = 0;
        };
        _start(){
            this.__end = Date.now() + this.__remaining;
        };
        _stop(){
            this.__end = 0;
            this.__remaining = this.duration * 1000;
        };
        _tick(){
            this.__remaining = this.__end - Date.now();
            // console.log(this.__remaining);
            this.emit('time',this.__remaining);
            if (this.__remaining <= 0 && !this.pastZero){
                this.__remaining = 0;
                this.emit('time',this.__remaining);
                this.stop();
            };
        }
    };

    class stopwatch extends loop {
        constructor(interval=100){
            super(interval);
            this.__elapsed = 0;
            this.__start = 0;
            //
            this.on('start',this._start);
            this.on('stop',this._stop);
            this.on('tick',this._tick);
        };
        pause(){
            this.__state = 2;
        };
        reset(){
            this.__elapsed = 0;
        }
        _start(){
            this.__start = Date.now();
        };
        _stop(){
            this.__start = 0;
        };
        _tick(){
            let _lasttime = Date.now();
            this.__elapsed = (Date.now() - this.__start) + this.__elapsed;
            this.__start = _lasttime;
            this.emit('time',this.__elapsed);
        }
    };
    //
    // exports
    timer.loop = loop;
    timer.countdown = countdown;
    timer.stopwatch = stopwatch;
    nine.global.set(timer,'nine.timer');
}());