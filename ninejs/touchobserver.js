/*
    touchobserver.js by @nxnine

    crude touch events, move, pinch, and swipe
*/
(function () {
    //
    var nx = {};
    //
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
    util = {};
    util.touchObserver = touchObserver;
    //
    nine.global.set(util,'nine.util');
    //
}());