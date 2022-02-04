// fun with calendar dates
//would love to "borrow" parts of moment.js

//
(function () {
    //
    var date = {};
    date.today = new Date();
    date.weekdays = new Array("Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday");
    date.months = new Array("January","February","March","April","May","June","July","August","September","October","November","December");
    date.month_days = new Array(31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31);
    date.isLeap = function(y) { return !((y % 4) || (!(y % 100) && y % 400)); };
    date.diff = function(_start_date,_end_date){
        let start_date = new Date(_start_date);
        let end_date = _end_date ? new Date(_end_date) : new Date();
        //
        let _total_days = Math.floor(Math.abs((end_date - start_date))/864e5); // 864e5 == (1000*60*60*24)
        if (start_date > end_date){ _total_days = _total_days * -1 }
        //
        let _years = end_date.getUTCFullYear() - start_date.getUTCFullYear();
        let _months = end_date.getUTCMonth() - start_date.getUTCMonth();
        let _days = end_date.getUTCDate() - start_date.getUTCDate();
        //
        if (_days<0 && _total_days>=0){
            _months--;
            let _shifted_month = end_date.getUTCMonth()-1;
            if (_shifted_month<0){ _shifted_month=11+_shifted_month };
            _days = date.month_days[_shifted_month] - start_date.getUTCDate();
            _days += end_date.getUTCDate()
            if (_shifted_month==1 && isLeap(end_date.getUTCFullYear())){_days+=1};
        };
        //
        if (_months<0 && _total_days>=0){
            _years--;
            _months = 12 + _months;
        };
        //
        return {days: _days, months: _months, years: _years, in_days: _total_days};
    };
    //
    // exports
    nine.util.global(date,'nine.date');
}());