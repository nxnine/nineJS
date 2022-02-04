/*
    hash.js

    crc32
    md5
*/
(function () {
    /*
        CRC32
    */
    var __crc_table = function(){
        var c;
        var crcTable = [];
        for(var n =0; n < 256; n++){
            c = n;
            for(var k =0; k < 8; k++){
                c = ((c&1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
            }
            crcTable[n] = c;
        }
        return crcTable;
    }()

    var crc32 = function(str) {
        var crc = 0 ^ (-1);
        for (var i = 0; i < str.length; i++ ) {
            crc = (crc >>> 8) ^ __crc_table[(crc ^ str.charCodeAt(i)) & 0xFF];
        }
        return (crc ^ (-1)) >>> 0;
    };
    //


    /*
        md5.js
        implementation by Joseph Myers
        http://www.myersdaily.org/joseph/javascript/md5-text.html
        *variables renamed
    */
    function __md5_cycle(x, k) {
        var a = x[0], b = x[1], c = x[2], d = x[3];

        a = __md5_ff(a, b, c, d, k[0], 7, -680876936);
        d = __md5_ff(d, a, b, c, k[1], 12, -389564586);
        c = __md5_ff(c, d, a, b, k[2], 17,  606105819);
        b = __md5_ff(b, c, d, a, k[3], 22, -1044525330);
        a = __md5_ff(a, b, c, d, k[4], 7, -176418897);
        d = __md5_ff(d, a, b, c, k[5], 12,  1200080426);
        c = __md5_ff(c, d, a, b, k[6], 17, -1473231341);
        b = __md5_ff(b, c, d, a, k[7], 22, -45705983);
        a = __md5_ff(a, b, c, d, k[8], 7,  1770035416);
        d = __md5_ff(d, a, b, c, k[9], 12, -1958414417);
        c = __md5_ff(c, d, a, b, k[10], 17, -42063);
        b = __md5_ff(b, c, d, a, k[11], 22, -1990404162);
        a = __md5_ff(a, b, c, d, k[12], 7,  1804603682);
        d = __md5_ff(d, a, b, c, k[13], 12, -40341101);
        c = __md5_ff(c, d, a, b, k[14], 17, -1502002290);
        b = __md5_ff(b, c, d, a, k[15], 22,  1236535329);

        a = __md5_gg(a, b, c, d, k[1], 5, -165796510);
        d = __md5_gg(d, a, b, c, k[6], 9, -1069501632);
        c = __md5_gg(c, d, a, b, k[11], 14,  643717713);
        b = __md5_gg(b, c, d, a, k[0], 20, -373897302);
        a = __md5_gg(a, b, c, d, k[5], 5, -701558691);
        d = __md5_gg(d, a, b, c, k[10], 9,  38016083);
        c = __md5_gg(c, d, a, b, k[15], 14, -660478335);
        b = __md5_gg(b, c, d, a, k[4], 20, -405537848);
        a = __md5_gg(a, b, c, d, k[9], 5,  568446438);
        d = __md5_gg(d, a, b, c, k[14], 9, -1019803690);
        c = __md5_gg(c, d, a, b, k[3], 14, -187363961);
        b = __md5_gg(b, c, d, a, k[8], 20,  1163531501);
        a = __md5_gg(a, b, c, d, k[13], 5, -1444681467);
        d = __md5_gg(d, a, b, c, k[2], 9, -51403784);
        c = __md5_gg(c, d, a, b, k[7], 14,  1735328473);
        b = __md5_gg(b, c, d, a, k[12], 20, -1926607734);

        a = __md5_hh(a, b, c, d, k[5], 4, -378558);
        d = __md5_hh(d, a, b, c, k[8], 11, -2022574463);
        c = __md5_hh(c, d, a, b, k[11], 16,  1839030562);
        b = __md5_hh(b, c, d, a, k[14], 23, -35309556);
        a = __md5_hh(a, b, c, d, k[1], 4, -1530992060);
        d = __md5_hh(d, a, b, c, k[4], 11,  1272893353);
        c = __md5_hh(c, d, a, b, k[7], 16, -155497632);
        b = __md5_hh(b, c, d, a, k[10], 23, -1094730640);
        a = __md5_hh(a, b, c, d, k[13], 4,  681279174);
        d = __md5_hh(d, a, b, c, k[0], 11, -358537222);
        c = __md5_hh(c, d, a, b, k[3], 16, -722521979);
        b = __md5_hh(b, c, d, a, k[6], 23,  76029189);
        a = __md5_hh(a, b, c, d, k[9], 4, -640364487);
        d = __md5_hh(d, a, b, c, k[12], 11, -421815835);
        c = __md5_hh(c, d, a, b, k[15], 16,  530742520);
        b = __md5_hh(b, c, d, a, k[2], 23, -995338651);

        a = __md5_ii(a, b, c, d, k[0], 6, -198630844);
        d = __md5_ii(d, a, b, c, k[7], 10,  1126891415);
        c = __md5_ii(c, d, a, b, k[14], 15, -1416354905);
        b = __md5_ii(b, c, d, a, k[5], 21, -57434055);
        a = __md5_ii(a, b, c, d, k[12], 6,  1700485571);
        d = __md5_ii(d, a, b, c, k[3], 10, -1894986606);
        c = __md5_ii(c, d, a, b, k[10], 15, -1051523);
        b = __md5_ii(b, c, d, a, k[1], 21, -2054922799);
        a = __md5_ii(a, b, c, d, k[8], 6,  1873313359);
        d = __md5_ii(d, a, b, c, k[15], 10, -30611744);
        c = __md5_ii(c, d, a, b, k[6], 15, -1560198380);
        b = __md5_ii(b, c, d, a, k[13], 21,  1309151649);
        a = __md5_ii(a, b, c, d, k[4], 6, -145523070);
        d = __md5_ii(d, a, b, c, k[11], 10, -1120210379);
        c = __md5_ii(c, d, a, b, k[2], 15,  718787259);
        b = __md5_ii(b, c, d, a, k[9], 21, -343485551);

        x[0] = add32(a, x[0]);
        x[1] = add32(b, x[1]);
        x[2] = add32(c, x[2]);
        x[3] = add32(d, x[3]);

    };

    function __md5_cmn(q, a, b, x, s, t) {
        a = add32(add32(a, q), add32(x, t));
        return add32((a << s) | (a >>> (32 - s)), b);
    };

    function __md5_ff(a, b, c, d, x, s, t) {
        return __md5_cmn((b & c) | ((~b) & d), a, b, x, s, t);
    };

    function __md5_gg(a, b, c, d, x, s, t) {
        return __md5_cmn((b & d) | (c & (~d)), a, b, x, s, t);
    };

    function __md5_hh(a, b, c, d, x, s, t) {
        return __md5_cmn(b ^ c ^ d, a, b, x, s, t);
    };

    function __md5_ii(a, b, c, d, x, s, t) {
        return __md5_cmn(c ^ (b | (~d)), a, b, x, s, t);
    };

    function __md5_1(s) {
        txt = '';
        var n = s.length,
        state = [1732584193, -271733879, -1732584194, 271733878], i;
        for (i=64; i<=s.length; i+=64) {
            __md5_cycle(state, __md5_blk(s.substring(i-64, i)));
        }
        s = s.substring(i-64);
        var tail = [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0];
        for (i=0; i<s.length; i++){
            tail[i>>2] |= s.charCodeAt(i) << ((i%4) << 3);
        }
        tail[i>>2] |= 0x80 << ((i%4) << 3);
        if (i > 55) {
            __md5_cycle(state, tail);
            for (i=0; i<16; i++) tail[i] = 0;
        }
        tail[14] = n*8;
        __md5_cycle(state, tail);
        return state;
    };

    /* there needs to be support for Unicode here,
    * unless we pretend that we can redefine the MD-5
    * algorithm for multi-byte characters (perhaps
    * by adding every four 16-bit characters and
    * shortening the sum to 32 bits). Otherwise
    * I su__md5_ggest performing MD-5 as if every character
    * was two bytes--e.g., 0040 0025 = @%--but then
    * how will an ordinary MD-5 sum be matched?
    * There is no way to standardize text to something
    * like UTF-8 before transformation; speed cost is
    * utterly prohibitive. The JavaScript standard
    * itself needs to look at this: it should start
    * providing access to strings as preformed UTF-8
    * 8-bit unsigned value arrays.
    */
    function __md5_blk(s) { /* I figured global was faster.   */
        var __md5_blks = [], i; /* Andy King said do it this way. */
        for (i=0; i<64; i+=4) {
            __md5_blks[i>>2] = s.charCodeAt(i)
            + (s.charCodeAt(i+1) << 8)
            + (s.charCodeAt(i+2) << 16)
            + (s.charCodeAt(i+3) << 24);
        }
        return __md5_blks;
    };

    var __md5_hexchr = '0123456789abcdef'.split('');

    function __md5_rhex(n) {
        var s='', j=0;
        for(; j<4; j++)
        s += __md5_hexchr[(n >> (j * 8 + 4)) & 0x0F]
        + __md5_hexchr[(n >> (j * 8)) & 0x0F];
        return s;
    };

    function __md5_hex(x) {
        for (var i=0; i<x.length; i++)
        x[i] = __md5_rhex(x[i]);
        return x.join('');
    };

    function md5(s) {
        return __md5_hex(__md5_1(s));
    };

    /* this function is much faster,
    so if possible we use it. Some IEs
    are the only ones I know of that
    need the idiotic second function,
    generated by an if clause.  */

    function add32(a, b) {
        return (a + b) & 0xffffffff;
    };

    if (md5('hello') != '5d41402abc4b2a76b9719d911017c592') {
        function add32(x, y) {
            var lsw = (x & 0xffff) + (y & 0xffff),
            msw = (x >> 16) + (y >> 16) + (lsw >> 16);
            return (msw << 16) | (lsw & 0xffff);
        }
    };
    //


    //
    // exports
    var hash = {};
    hash.crc32 = crc32;
    hash.md5 = md5;
    //
    nine.util.global(hash,'nine.hash');
}());