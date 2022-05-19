/*
    date_tz.js by @nxnine
    
    Timezone Date object
    uses Intl, with moment API layer for drop-in replacement*

    *use cases:
    moment.tz.add()**
    moment.tz.guess()
    moment.tz()
    moment.tz().format()
    moment.tz().clone()
    moment.tz().tz()
*/
//
//
(function () {
    //
    var date = {};
    //
    var dtfCache = {};
    function makeDTF(zone) {
        if (!dtfCache[zone]) {
            let zoneObj;
            try {
                zoneObj = new Intl.DateTimeFormat("en-US", {
                    hour12: false,
                    timeZone: zone,
                    weekday: "long",
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    fractionalSecondDigits: 3
                });
            } catch(e){
                let modZone = zone.replace('UTC','Etc/GMT');
                zoneObj = new Intl.DateTimeFormat("en-US", {
                    hour12: false,
                    timeZone: modZone,
                    weekday: "long",
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    fractionalSecondDigits: 3
                });
            };
            dtfCache[zone] = zoneObj;
        }
        return dtfCache[zone];
    };
    //
    class TimezoneDate extends Date {
        constructor(){
            super(...arguments);
            this.localTimeZoneOffset = super.getTimezoneOffset();
            this.timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            this.__local_day = super.getDay();
            this.__local_year = super.getFullYear();
            this.__local_month = super.getMonth();
            this.__local_date = super.getDate();
            this.__local_hours = super.getHours();
            this.__local_minutes = super.getMinutes();
            this.__local_seconds = super.getSeconds();
        };
        tz(timezone){
            let self = this;
            let dtf = makeDTF(timezone).formatToParts(self);
            let tzDate = {};
            for (let timepart of dtf){
                if (timepart.type != 'literal'){ tzDate[timepart.type]=timepart.value}
            };
            let asUTC = Date.UTC(tzDate.year,tzDate.month-1,tzDate.day,tzDate.hour,tzDate.minute,tzDate.second);
            let asTS = self.getTime() - (self.getTime()%1000);
            //
            this.timeZone = timezone;
            this.localTimeZoneOffset = ((asUTC - asTS) / (60*1000))*-1;
            
            this.__local_day = nine.date.weekdays.indexOf(tzDate.weekday);
            this.__local_year = Number(tzDate.year);
            this.__local_month = Number(tzDate.month)-1;
            this.__local_date = Number(tzDate.day);
            this.__local_hours = Number(tzDate.hour);
            this.__local_minutes = Number(tzDate.minute);
            this.__local_seconds = Number(tzDate.second);
            return this;
        };
        clone(){
            return new TimezoneDate(this.getTime()).tz(this.timeZone);
        }
        getDay(){ return this.__local_day; };
        getDate(){ return this.__local_date; };
        getMonth(){ return this.__local_month; };
        getFullYear(){ return this.__local_year; };
        getHours(){ return this.__local_hours; };
        getMinutes(){ return this.__local_minutes; };
        getSeconds(){ return this.__local_seconds; };
        getTimezoneOffset(){ return this.localTimeZoneOffset };
        toISOString(){ return this.format('YYYY-MM-ddTHH:mm:ss.SSSQ'); };
        //
        day(){ return this.getDay() };
        week(){ return this.getWeek() };
    };

    function moment(){
        return new TimezoneDate(...arguments);
    };

    moment.tz = function(){
        let tzArgs = Array.from(arguments);
        if (tzArgs.length==2){
            return new TimezoneDate(tzArgs[0]).tz(tzArgs[1]);
        }
        return new TimezoneDate().tz(tzArgs);
    };

    moment.tz.add = function(addData){
        let parsedAdd = addData.split('|');
        return makeDTF(parsedAdd[0]);
    };

    moment.tz.guess = function(){
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
    };
    //

    // fix for year interpretation, not currently used
    function objToLocalTS(obj) {
        var d = Date.UTC(obj.year, obj.month - 1, obj.day, obj.hour, obj.minute, obj.second, obj.millisecond); // for legacy reasons, years between 0 and 99 are interpreted as 19XX; revert that
    
        if (obj.year < 100 && obj.year >= 0) {
          d = new Date(d);
          d.setUTCFullYear(d.getUTCFullYear() - 1900);
        }
    
        return +d;
    }
    //

    // exports
    date.tz = {};
    date.tz.TimezoneDate = TimezoneDate;
    //
    nine.global.set(date,'nine.date');
    nine.global.set(moment,'moment');
}());