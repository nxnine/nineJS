/*
    snowflake.js by @nxnine
    
    generates time based 64-bit ID
    based off https://github.com/dustinrouillard/snowflake-id
    which implements https://github.com/twitter-archive/snowflake/blob/snowflake-2010/src/main/scala/com/twitter/service/snowflake/IdWorker.scala
*/

(function () {
    //
    var _globals;
    //

    /**
     * A function for converting hex <-> dec w/o loss of precision.
     * By Dan Vanderkam http://www.danvk.org/hex2dec.html
     */
    function __h2d_add(x, y, base) {
        var z = [];
        var n = Math.max(x.length, y.length);
        var carry = 0;
        var i = 0;
        while (i < n || carry) {
        var xi = i < x.length ? x[i] : 0;
        var yi = i < y.length ? y[i] : 0;
        var zi = carry + xi + yi;
        z.push(zi % base);
        carry = Math.floor(zi / base);
        i++;
        }
        return z;
    };
    function __h2d_mult(num, x, base) {
        if (num < 0) return null;
        if (num == 0) return [];
    
        var result = [];
        var power = x;
        while (true) {
        if (num & 1) {
            result = __h2d_add(result, power, base);
        }
        num = num >> 1;
        if (num === 0) break;
        power = __h2d_add(power, power, base);
        }
    
        return result;
    };
    function __h2d_parse(str, base) {
        var digits = str.split("");
        var ary = [];
        for (var i = digits.length - 1; i >= 0; i--) {
        var n = parseInt(digits[i], base);
        if (isNaN(n)) return null;
        ary.push(n);
        }
        return ary;
    };
    function __h2d_convertBase(str, fromBase, toBase) {
        var digits = __h2d_parse(str, fromBase);
        if (digits === null) return null;
    
        var outArray = [];
        var power = [1];
        for (var i = 0; i < digits.length; i++) {
        // invariant: at this point, fromBase^i = power
        if (digits[i]) {
            outArray = __h2d_add(
            outArray,
            __h2d_mult(digits[i], power, toBase),
            toBase
            );
        }
        power = __h2d_mult(fromBase, power, toBase);
        }
    
        var out = "";
        for (var i = outArray.length - 1; i >= 0; i--) {
        out += outArray[i].toString(toBase);
        }
        return out;
    };
    function hexToDec(hexStr) {
        if (hexStr.indexOf("0x") === 0) hexStr = hexStr.slice(2);
        hexStr = hexStr.toLowerCase();
        return __h2d_convertBase(hexStr, 16, 10);
    }
    //

    /* 
        Twitter Snowflake
        64 bits
            41 bit timestamp
            10 bit machine id
                5 bit datacenter id
                5 bit worker id
            12 bit sequence id
    */
    __snowflake_epoch_twitter = '2010-11-04T01:42:54.657Z'
    __snowflake_epoch_discord = '2015-01-01T00:00:00.000Z'
    __snowflake_epoch_uuidv1 = '1582-10-15T00:00:00.000Z'
    __snowflake_epoch_unix = '1970-01-01T00:00:00.000Z'
    __snowflake_epoch_nt = '1601-01-01T00:00:00.000Z'
    class SnowflakeID {
        constructor(datacenterid,workerid,snowflake_epoch){
            if (!snowflake_epoch){ snowflake_epoch = __snowflake_epoch_twitter };
            this.epoch = new Date(snowflake_epoch).getTime();
            this.seq = 0;
            this.machineid = (((datacenterid & 31) << 5) + (workerid & 31)) & 1023; //10 bits
            this.last = 0;
        };
        generate_bin(){
            let __snowflake_now = Date.now();
            if (this.last == __snowflake_now){
                this.seq++
                if (this.seq>4095){
                    this.seq &= 4095
                    while (Date.now() <= __snowflake_now) {}
                }
            } else {
                this.seq = 0;
            };
            this.last = __snowflake_now;
            let b_time = (__snowflake_now - this.epoch).toString(2),
                b_seq = this.seq.toString(2),
                b_mid = this.machineid.toString(2);
            // theoretically 135x faster than padStart, and 682x faster than a while loop
            // https://www.measurethat.net/Benchmarks/Show/15736/0/binarystringpad
            b_seq = ('000000000000'+b_seq).slice(-12);
            b_mid = ('0000000000'+b_mid).slice(-10);
            b_time = ('00000000000000000000000000000000000000000'+b_time).slice(-41);
            return '0' + b_time + b_mid + b_seq
        };
        generate_hex(){
            let b_id = this.generate_bin()
            let id= "";
            for (let i = b_id.length; i > 0; i -= 4) {
                id = parseInt(b_id.substring(i - 4, i), 2).toString(16) + id;
            }
            return id;
        };
        generate_36(){
            let h_id = this.generate_bin();
            return __h2d_convertBase(h_id, 2, 36);
        };
        generate(){
            let h_id = this.generate_hex();
            return hexToDec(h_id);
        };
    };
    //

    // exports
    _globals = (function(){ return this || (0,eval)("this"); }());
    _globals.SnowflakeID = SnowflakeID;
    nine.global.set(SnowflakeID,'nine.util.snowflake')
}());