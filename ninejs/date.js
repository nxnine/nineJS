/*
    date.js by @nxnine

    fun with dates and times
    formatter directly borrowed from moment.js
*/

(function () {
    //
    var date = {};
    date.today = new Date();
    date.weekdays = new Array("Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday");
    date.months = new Array("January","February","March","April","May","June","July","August","September","October","November","December");
    date.month_days = new Array(31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31);
    date.isLeap = function(y) { return !((y % 4) || (!(y % 100) && y % 400)); };
    //
    /*
        common language interpretation of difference between dates

        weird stuff happens, one day apart, but 3 "days" difference
        nine.date.diff('1976-03-01T00:00:00.000Z','1977-02-05T00:00:00.000Z')
        = {days: 4, months: 11, years: 0, in_days: 341}
        nine.date.diff('1976-02-29T00:00:00.000Z','1977-02-05T00:00:00.000Z')
        = {days: 7, months: 11, years: 0, in_days: 342}
    */
    date.diff = function(_start_date,_end_date){
        let start_date = new Date(_start_date);
        let end_date = _end_date ? new Date(_end_date) : new Date();
        //
        // let start_year = start_date.getUTCFullYear();
        // let start_month = start_date.getUTCMonth();
        // let start_day = start_date.getUTCDate();
        // let end_year = end_date.getUTCFullYear();
        // let end_month = end_date.getUTCMonth();
        // let end_day = end_date.getUTCDate();
        let start_year = start_date.getFullYear();
        let start_month = start_date.getMonth();
        let start_day = start_date.getDate();
        let end_year = end_date.getFullYear();
        let end_month = end_date.getMonth();
        let end_day = end_date.getDate();
        //
        let _total_days = Math.floor(Math.abs((end_date - start_date))/864e5); // 864e5 == (1000*60*60*24)
        if (start_date > end_date){ _total_days = _total_days * -1 };
        if (_total_days==-0){ _total_days=0 };
        //
        let _years = end_year - start_year;
        let _months = end_month - start_month;
        let _days = end_day - start_day;
        //
        if (_days<0 && _total_days>0){
            _months--;
            let _shifted_month = end_month-1;
            if (_shifted_month<0){ _shifted_month=11+_shifted_month };
            let _shifted_month_days = date.month_days[_shifted_month]
            _days = _shifted_month_days - start_day;
            if (_days<=0){_days=0};
            _days += end_day;
        };
        // handle leap year weirdness
        if(end_month==1 && date.isLeap(end_year)){
            _days+=1;
        };
        //
        if (_months<0){
            _years--;
            _months = 12 + _months;
        };
        //
        // fix odd negative days issue
        if (_years==0 && _months==0 && _days!=_total_days){
            _total_days = _days;
        };
        //
        return {days: _days, months: _months, years: _years, in_days: _total_days};
    };
    //
    date.format = {};
    date.format.millisecs_hms = function(time){
        let _neg = time >= 0 ? "" : "-";
        let _mins = Math.floor(time / 60000);
        let _secs = Math.floor((time / 1000) % 60);
        let _huns = Math.floor((time % 1000));// / 10);
        //
        let _hours = (_mins / 60) | 0;
        _mins = (_mins % 60) | 0
        //
        if (_hours < 0) { _hours = _hours*-1; };
        if (_hours < 10) { _hours = "0" + _hours; };
        if (typeof _hours==='number'){ _hours = _hours.toString(); }
        if (_mins < 0) { _mins = _mins*-1; };
        if (_mins < 10) { _mins = "0" + _mins; };
        if (typeof _mins==='number'){ _mins = _mins.toString(); }
        if (_secs < 0) { _secs = _secs*-1; };
        if (_secs < 10) { _secs = "0" + _secs; };
        if (typeof _secs==='number'){ _secs = _secs.toString(); }
        if (_huns < 10) { _huns = "0" + _huns; };
        if (typeof _huns==='number'){ _huns = _huns.toString(); }
        return {
            'hours': _hours,
            'minutes': _mins,
            'seconds': _secs,
            'hundreths': _huns,
            "negative": _neg
        };
    };
    date.format.hms_millisecs = function(hour,mins,secs,hundreths=0){
        let _ret = (((Number(hour)*60)*60)+(Number(mins)*60)+Number(secs))*1000
        _ret += hundreths;
        return _ret;
    };
    //
    //
    // formatting mechanism from moment.js
    var _formattingTokens = /(\[[^\[]*\])|(\\)?([Hh]mm(ss)?|Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|Qo?|N{1,5}|YYYYYY|YYYYY|YYYY|YY|y{2,4}|yo?|gg(ggg?)?|GG(GGG?)?|e|E|a|A|hh?|HH?|kk?|mm?|ss?|S{1,9}|x|X|zz?|ZZ?|.)/g
    var _formattingFunctions = {};
    function addFormatToken(token, padded, callback) {
        let func = callback;
        if (token) {
            _formattingFunctions[token] = func;
        };
        if (padded) {
            _formattingFunctions[padded[0]] = function () {
                return nine.util.zeroPad(func.apply(this, arguments), padded[1]);
            };
        };
    };
    function removeFormattingTokens(input) {
        if (input.match(/\[[\s\S]/)) {
            return input.replace(/^\[|\]$/g, '');
        }
        return input.replace(/\\/g, '');
    };
    addFormatToken('M', ['MM', 2], function () { return this.getMonth() + 1; });
    addFormatToken('Y', 0, function () { var y = this.getFullYear(); return y <= 9999 ? nine.util.zeroPad(y, 4) : '+' + y; });
    addFormatToken(0, ['YY', 2], function () { return this.getFullYear() % 100; });
    addFormatToken(0, ['YYYY', 4], function(){return this.getFullYear()});
    addFormatToken('d', ['dd',2], function(){return this.getDate();});
    addFormatToken('e', ['ee',2], function(){return this.getDay()+1});
    addFormatToken('H', ['HH', 2], function(){return this.getHours();});
    addFormatToken('h', ['hh', 2], function(){ return this.getHours() % 12 || 12; });
    addFormatToken('k', ['kk', 2], function(){ return this.getHours() || 24; });
    addFormatToken('m', ['mm', 2], function(){return this.getMinutes()});
    addFormatToken('s', ['ss', 2], function(){return this.getSeconds()});
    addFormatToken('a', 0, function(){return this.getHours()>=12?'pm':'am'});
    addFormatToken('A', 0, function(){return this.getHours()>=12?'PM':'AM'});
    addFormatToken('S', 0, function () { return ~~(this.getMilliseconds() / 100); });
    addFormatToken(0, ['SS', 2], function () { return ~~(this.getMilliseconds() / 10); });
    addFormatToken(0, ['SSS', 3], function(){return this.getMilliseconds()});
    addFormatToken(0, ['SSSS', 4], function () { return this.getMilliseconds() * 10; });
    addFormatToken(0, ['SSSSS', 5], function () { return this.getMilliseconds() * 100; });
    addFormatToken(0, ['SSSSSS', 6], function () { return this.getMilliseconds() * 1000; });
    addFormatToken(0, ['SSSSSSS', 7], function () { return this.getMilliseconds() * 10000; });
    addFormatToken(0, ['SSSSSSSS', 8], function () { return this.getMilliseconds() * 100000; });
    addFormatToken(0, ['SSSSSSSSS', 9], function () { return this.getMilliseconds() * 1000000; });
    addFormatToken('Q', 0, function () { return this.getTimezoneOffsetString(); });
    //
    Date.prototype.format = function(formatString){
        let formatArray = formatString.match(_formattingTokens);
        let i = 0;
        let length = 0;
        //
        for (i = 0, length = formatArray.length; i < length; i++) {
            if (_formattingFunctions[formatArray[i]]) {
                formatArray[i] = _formattingFunctions[formatArray[i]];
            } else {
                formatArray[i] = removeFormattingTokens(formatArray[i]);
            }
        }
        //
        let _format_func = function (mom) {
            let output = '', i;
            for (i = 0; i < length; i++) {
                output += nine.util.isFunction(formatArray[i]) ? formatArray[i].call(mom, formatString) : formatArray[i];
            }
            return output;
        };
        //
        return _format_func(this);
        //
    };
    //

    // add to the Date object
    Date.prototype.isLeapYear = function(){
        return date.isLeap(this.getFullYear());
    };
    Date.prototype.getTimezoneOffsetString = function(){
        let _timezone_offset = nine.date.format.millisecs_hms(this.getTimezoneOffset()*60000);
        let _timezone_offset_str = _timezone_offset.negative!=''?'+':'-';
        _timezone_offset_str = _timezone_offset_str+_timezone_offset.hours+':'+_timezone_offset.minutes;
        return _timezone_offset_str;
    };
    Date.prototype.getOffsetISODate = function(){
        let _timezone_offset_str = this.getTimezoneOffsetString();
        let _year = this.getUTCFullYear();
        let _month = ('00'+this.getUTCMonth()).slice(-2);
        let _day = ('00'+this.getUTCDate()).slice(-2);
        let _date_str = _year+'-'+_month+'-'+_day+'T00:00:00.000'+_timezone_offset_str;
        return _date_str;
    };
    Date.prototype.getWeek = function(){
        var d = new Date(Date.UTC(this.getFullYear(), this.getMonth(), this.getDate()));
        var dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
        return Math.ceil((((d - yearStart) / 86400000) + 1)/7);
    };
    //
    // exports
    nine.global.set(date,'nine.date');
}());