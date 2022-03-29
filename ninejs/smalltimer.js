/*
    smalltimer.js by @nxnine
    requires:
        nine.js
        icon.js
        timer.js
        component.js
        smalltimer_audio.js

    timer component, configurable colors and sounds
*/

//
function durationRestrict(field){
    if (field.value.length <= 2){
        field.value = field.value.replace(/[^0-9]/, '')
    } else {
        field.value = field.value.substr(0,2)
    };
};
function fmt_clock(hour,mins,secs){
    return ((Number(hour)*60)*60)+(Number(mins)*60)+Number(secs);
}
//

//
class audioObj extends Audio {
    constructor(url){
        if (url == ""){
            url = "data:audio/mp3;base64,//MkxAAHiAICWABElBeKPL/RANb2w+yiT1g/gTok//lP/W/l3h8QO/OCdCqCW2Cw//MkxAQHkAIWUAhEmAQXWUOFW2dxPu//9mr60ElY5sseQ+xxesmHKtZr7bsqqX2L//MkxAgFwAYiQAhEAC2hq22d3///9FTV6tA36JdgBJoOGgc+7qvqej5Zu7/7uI9l//MkxBQHAAYi8AhEAO193vt9KGOq+6qcT7hhfN5FTInmwk8RkqKImTM55pRQHQSq//MkxBsGkgoIAABHhTACIJLf99nVI///yuW1uBqWfEu7CgNPWGpUadBmZ////4sL//MkxCMHMAH9iABEmAsKioqKigsLCwtVTEFNRTMuOTkuNVVVVVVVVVVVVVVVVVVV//MkxCkECAUYCAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV";
        };
        super(url);
        this.controls = !1;
        this.preload = "auto";
        this.loop = !1;
        this.load();
    };
    source(src){
        this.src = src;
        this.load();
    }
};
//

//
//
class smallTimer extends nine.component.html{
    configure(){
        if (this.props.name){
            this.label = "timer_"+this.props.name;
        } else {
            this.label = "timer_"+this.id;
        };
        //
        this.config = {};
        if (!nine.storage.local.has(this.label)) {
            var _config = {
                pastZero: false,
                autoReset: false,
                color: {
                    timer: {
                        std: {
                            bg: "#008000",
                            font: "#ffffff"
                        },
                        warn: {
                            bg: "#cfcf00",
                            font: "#505050"
                        },
                        end: {
                            bg: "#8b0000",
                            font: "#b6b6b6"
                        }
                    },
                    name: {
                        bg: "#000000",
                        font: "#ffffff"
                    },
                    ctl: {
                        bg: "#808080",
                        font: "#ffffff",
                        mouseOver: "#ff0000",
                        mouseDown: "#0000ff"
                    }
                },
                sound: {
                    whenEnd: false,
                    whenNear: false,
                    nearSecs: 30,
                    tick_file: default_tick.name,
                    tick: default_tick.data,
                    end_file: default_gong.name,
                    end: default_gong.data
                }
            };
            Object.assign(this.config,_config);
            this.config.id = this.id;
            if (!this.props.duration){
                this.config.duration = 180;
            } else {
                this.config.duration = this.props.duration;
            };
        } else {
            Object.assign(this.config,JSON.parse(nine.storage.local.get(this.label)));
        };
        //
        this.field = {};
        this.timer = new nine.timer.countdown(this.config.duration);
    };
    saveConfig(){
        let self = this;
        nine.storage.local.set(self.label,JSON.stringify(self.config));
    };
    template(){
        return `<div id="{{=obj.id}}-timer" class="smallTimer">
            <div id="{{=obj.id}}-clock" class="stClock"></div>
            <div id="{{=obj.id}}-ctrl" class="stControl">
                <table>
                    <tr>
                        <td>
                            <nine-button class="stPlay" icon="icon.stx.play"></nine-button>
                        </td>
                        <td>
                        <nine-button class="stStop" icon="icon.stx.stop"></nine-button>
                        </td>
                    </tr>
                </table>
            </div>
        </div>`;
    };
    settingsTemplate(){
        return `<nine-list class="list-settings" name="stx">
            <li>
                <div name="duration" label="duration">
                    <label for="duration-text">
                        <div>Duration (HH:MM:SS)</div>
                        <input id="{{=obj.id}}-opt-hour" type="text" class="duration" oninput="durationRestrict(this)" />:<input id="{{=obj.id}}-opt-mins" type="text" class="duration" oninput="durationRestrict(this)" />:<input id="{{=obj.id}}-opt-secs" type="text" class="duration" oninput="durationRestrict(this)" />
                    </label>
                </div>
            </li>
            <li>
                <div name="nearsecs" label="nearsecs">
                    <label for="nearsecs-text">
                        <div>sound.nearSecs</div>
                        <input id="{{=obj.id}}-opt-nearSecs" type="text" />
                    </label>
                </div>
            </li>
            <li>
                <div name="pastzero" label="pastzero">
                    <label for="pastzero-check">
                        <div>pastZero</div>
                        <input id="{{=obj.id}}-opt-pastZero" type="checkbox" />
                    </label>
                </div>
            </li>
            <li>
                <div name="autoreset" label="autoreset">
                    <label for="autoreset-check">
                        <div>autoReset</div>
                        <input id="{{=obj.id}}-opt-autoReset" type="checkbox" />
                    </label>
                </div>
            </li>
            <li>
                <div name="whenend" label="whenend">
                    <label for="whenend-check">
                        <div>sound.whenEnd</div>
                        <input id="{{=obj.id}}-opt-whenEnd" type="checkbox" />
                    </label>
                </div>
            </li>
            <li>
                <div name="whennear" label="whennear">
                    <label for="whennear-check">
                        <div>sound.whenNear</div>
                        <input id="{{=obj.id}}-opt-whenNear" type="checkbox" />
                    </label>
                </div>
            </li>
            <li>
                <div name="ticksound" label="ticksound">
                    <label for="ticksound-file">
                        <div>sound.tick</div>
                        <nine-file id="{{=obj.id}}-opt-tickSound"></nine-file>
                    </label>
                </div>
            </li>
            <li>
                <div name="endsound" label="endsound">
                    <label for="endsound-file">
                        <div>sound.end</div>
                        <nine-file id="{{=obj.id}}-opt-endSound"></nine-file>
                    </label>
                </div>
            </li>
        </nine-list>`;
    };
    postRender(){
        this.field.clock = this.root.querySelector('#'+this.id+'-clock');
        this.field.opt = this.root.querySelector(".stOpt");
        this.field.play = this.root.querySelector(".stPlay");
        this.field.stop = this.root.querySelector(".stStop");
        //
        let self = this;
        self.field.play.onmouseup = function(){ 
            if (self.timer.__state==0){
                self.reset();
            };
            if (self.timer.__state==0 || self.timer.__state==2){
                self.field.play.icon('icon.stx.pause');
                self.timer.start();
            } else if (self.timer.__state==1) {
                self.field.play.icon('icon.stx.play');
                self.timer.pause()
            };
        };
        self.field.stop.onmouseup = function(){ 
            self.field.play.icon('icon.stx.play');
            if (self.timer.__state==1 || self.timer.__state==2){
                self.timer.stop();
                if (self.config.autoReset) {
                    self.reset();
                };
            } else if (self.timer.__state==0) {
                self.reset();
            }
        };
        //
        this.clockface_color(this.config.color.timer.std.bg,this.config.color.timer.std.font);
        this.clockface(this.config.duration*1000);
        //
        //
        this.tickSound = new audioObj();
        this.tickSound.source(this.config.sound.tick);
        this.tickSound.playbackRate = 2;
        //
        this.endSound = new audioObj();
        this.endSound.source(this.config.sound.end);
        this.endSound.addEventListener("ended", this.__ended.bind(this));
        this.endSound_played = 0;
        //
        let _settings_jst = doT.template(this.settingsTemplate());
        let _settings_obj = nine.component._element(_settings_jst(this));
        let _settings_panel = document.querySelector('nine-panel[name=stx]');
        _settings_panel.appendChild(_settings_obj);
        //
        let _settings_list = _settings_panel.querySelector('nine-list[name=stx]');

        this.field.tickSound = _settings_list.querySelector('#'+this.id+'-opt-tickSound');
        this.field.endSound = _settings_list.querySelector('#'+this.id+'-opt-endSound');
        this.field.tickSound.fileName = this.config.sound.tick_file;
        this.field.tickSound.fileData = this.config.sound.tick;
        this.field.endSound.fileName = this.config.sound.end_file;
        this.field.endSound.fileData = this.config.sound.end;
        this.field.tickSound.label.innerText = this.config.sound.tick_file;
        this.field.endSound.label.innerText = this.config.sound.end_file;

        this.field.hours = _settings_list.querySelector('#'+this.id+'-opt-hour');
        this.field.minutes = _settings_list.querySelector('#'+this.id+'-opt-mins');
        this.field.seconds = _settings_list.querySelector('#'+this.id+'-opt-secs');
        let time_fmt = nine.date.format.millisecs_hms(this.config.duration*1000);
        this.field.hours.value = time_fmt.hours;
        this.field.minutes.value = time_fmt.minutes;
        this.field.seconds.value = time_fmt.seconds;

        this.field.pastZero = _settings_list.querySelector('#'+this.id+'-opt-pastZero');
        this.field.autoReset = _settings_list.querySelector('#'+this.id+'-opt-autoReset');
        this.field.whenEnd = _settings_list.querySelector('#'+this.id+'-opt-whenEnd');
        this.field.whenNear = _settings_list.querySelector('#'+this.id+'-opt-whenNear');
        this.field.nearSecs = _settings_list.querySelector('#'+this.id+'-opt-nearSecs');
        this.field.pastZero.checked = self.config.pastZero;
        this.field.autoReset.checked = self.config.autoReset;
        this.field.whenEnd.checked = self.config.sound.whenEnd;
        this.field.whenNear.checked = self.config.sound.whenNear;
        this.field.nearSecs.value = self.config.sound.nearSecs;
        //
        _settings_panel.onclose = function(){
            self.setConfig();
            self.saveConfig();
        };
        //
        this.timer.on('time',this.tick.bind(this));
    };
    //
    setConfig(){
        let self = this;
        let _duration = fmt_clock(self.field.hours.value,self.field.minutes.value,self.field.seconds.value);
        if (_duration!=self.config.duration){
            self.config.duration = _duration;
            self.timer.duration = self.config.duration;
        };
        self.config.sound.tick_file = this.field.tickSound.fileName;
        self.config.sound.tick = this.field.tickSound.fileData;
        self.config.sound.end_file = this.field.endSound.fileName;
        self.config.sound.end = this.field.endSound.fileData;
        self.config.sound.whenEnd = this.field.whenEnd.checked;
        self.config.sound.whenNear = this.field.whenEnd.checked;
        self.config.sound.nearSecs = this.field.nearSecs.value;
        self.config.pastZero = this.field.pastZero.checked;
        self.config.autoReset = this.field.autoReset.checked;
        self.reset();
    };
    //
    reset() {
        this.timer._stop();
        this.clockface(this.config.duration*1000);
        this.field.play.icon('icon.stx.play');
        this.clockface_color(this.config.color.timer.std.bg,this.config.color.timer.std.font);
        this.endSound_played = 0;
    }; 
    __ended() {
        this.endSound_played = 2;
        if (!this.timer.pastZero) {
            if (this.config.autoReset) {
                this.reset();
            };
        };
    };
    clockface_color(bgColor,fontColor) {
        this.field.clock.style.color = fontColor;
        this.field.clock.style.backgroundColor = bgColor;
    };
    clockface(time){
        let time_fmt = nine.date.format.millisecs_hms(time);
        this.field.clock.innerText = time_fmt.negative+time_fmt.hours+":"+time_fmt.minutes+":"+time_fmt.seconds;
        nine.util.textFit(this.field.clock)
    }
    tick(_time){
        if (this.timer.__state == 1) {
            //
            this.clockface(_time);
            _time = (_time/1000)|0
            // monkeypatch for inefficient color consistency
            if (_time > 0 && _time >= this.config.sound.nearSecs){
                this.clockface_color(this.config.color.timer.std.bg,this.config.color.timer.std.font);
            };
            // start ticking
            if (_time > 0 && _time <= this.config.sound.nearSecs){
                if (this.config.sound.whenNear){
                    this.tickSound.play();
                };
                this.clockface_color(this.config.color.timer.warn.bg,this.config.color.timer.warn.font);
            };
            // gong
            if (_time <= 0){
                if (this.endSound_played==0) {
                    this.clockface_color(this.config.color.timer.end.bg,this.config.color.timer.end.font);
                    this.field.play.icon('icon.stx.play');
                    if (this.config.sound.whenEnd) {
                        this.endSound_played = 1;
                        this.endSound.play();
                    } else {
                        this.endSound_played = 1;
                        setTimeout(this.__ended.bind(this),this.endSound.duration*1000)
                    };
                };
            };
            // post gong reset
            if (this.timer.__state == 0){
                // not playing endSound
                if (this.endSound_played==2) {
                    if (this.config.autoReset) {
                        this.reset();
                    };
                };
            };
        };
    };
};
nine.component.register('small-timer', smallTimer);