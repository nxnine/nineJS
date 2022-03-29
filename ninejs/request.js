/*
    request.js

    modified Request from Framework7
    common events:
        beforeCreate (options),
        beforeOpen (xhr, options),
        beforeSend (xhr, options),
        error (xhr, status, message),
        complete (xhr, stautus),
        success (response, status, xhr),
    common http methods:
        GET - read
        POST - create
        PUT - replace
        PATCH - modify
        DELETE - delete
        HEAD - headers
        OPTIONS - available methods

    added experimental caching variant
*/

(function () {
    //
    var _globals;
    //

    //
    var __http_methods = ['GET','POST','PUT','PATCH','DELETE','HEAD','OPTIONS']
    //
    var __uriquery_prefix = '?';
    var __uriquery_sep = '&';
    var __uriquery_join = '=';
    //
    function serializeQuery(obj){
        let resultArray = [];
        Object.keys(obj).forEach(function(prop){
            if (typeof obj[prop] === 'object'){
                let toPush = serializeQuery(obj[prop]);
                if (toPush !== '') { resultArray.push(toPush); }
            } else if (typeof obj[prop] !== 'undefined' && obj[prop] !== '') {
                resultArray.push(((encodeURIComponent(prop)) + __uriquery_join + (encodeURIComponent(obj[prop]))));
            };
        });
        return resultArray.join(__uriquery_sep);
    };
    function deserializeQuery(qstring){
        let queryObj = {};
        if (qstring.indexOf(__uriquery_prefix) === 0){ qstring = qstring.slice(1); };
        let queryParams = qstring.split(__uriquery_sep);
        queryParams.forEach(function(queryParam){
            paramSplit = queryParam.split(__uriquery_join);
            queryObj[paramSplit[0]] = paramSplit[1]
        });
        return queryObj;
    };
    //
    var _request_timeout = 0;
    function setTimeout(timeout){
        _request_timeout = timeout;
    }
    //
    function Request(requestOptions){
        // defaults
        var options = {
            url: window.location.toString(),
            method: 'GET',
            data: '',
            user: '',
            password: '',
            headers: {},
            xhrFields: {},
            dataType: 'text',
            contentType: 'application/x-www-form-urlencoded',
            async: true,
            timeout: _request_timeout,
            progress: function(opts,e){ console.log(e); console.log(`${e.type}: ${e.loaded} bytes transferred (${e.pct}%)`); }
        };
        Object.assign(options,requestOptions);
        options.method = options.method.toUpperCase();
        //
        // xhr event handler
        function __req_event(callbackName) {
            let data = Array.from(arguments).slice(1);
            var optionCallbackValue;
            if (options[callbackName]) {
                optionCallbackValue = options[callbackName].apply(options, data);
            }
            if (typeof optionCallbackValue !== 'boolean') { optionCallbackValue = true; }
            return optionCallbackValue;
        }
        // beforeCreate
        proceedRequest = __req_event('beforeCreate', options);
        if (proceedRequest === false) { return undefined; };
        //
        // format options.data for GET
        if (typeof options.data=='undefined'){ options.data=''; };
        if ((options.method === 'GET' || options.method === 'HEAD' || options.method === 'OPTIONS' || options.method === 'DELETE') && options.data) {
            // what if there is data in both options.data and options.url?
            if (typeof options.data==='string'){
                if (options.data.indexOf('?') >= 0) { options.data = options.data.split('?')[1]; }
                Object.assign(options.data,deserializeQuery(options.data));
            };
            if (options.url.indexOf('?') >= 0) {
                let split_url = options.url.split('?');
                Object.assign(options.data,deserializeQuery(split_url[1]));
                options.url = split_url[0];
            };
        };
        // XMLHTTPRequest
        var xhr = new XMLHttpRequest();
        xhr.requestParameters = options;
        //
        // Before open callback
        proceedRequest = __req_event('beforeOpen', xhr, options);
        if (proceedRequest === false) { return xhr; }
        //
        //
        xhr.open(options.method, options.method==='GET' ? options.url+__uriquery_prefix+serializeQuery(options.data) : options.url, options.async, options.user, options.password);
        //
        var postData = null;
        if ((options.method === 'POST' || options.method === 'PUT' || options.method === 'PATCH') && options.data) {
            postData = options.data;
            xhr.setRequestHeader('Content-Type', options.contentType);
        };
        if (options.dataType === 'json' && (!options.headers || !options.headers.Accept)) {
            xhr.setRequestHeader('Accept', 'application/json');
        };
        if (options.dataType === 'blob') {
            xhr.responseType='blob';
        };
        if (options.headers) {
            Object.keys(options.headers).forEach(function (headerName) {
                if (typeof options.headers[headerName] === 'undefined') { return; }
                xhr.setRequestHeader(headerName, options.headers[headerName]);
            });
        };
        //
        // onprogress
        function __handleEvent(e) {
            let __loaded = e.loaded;
            let __total = e.total;
            let __pct = (__loaded/__total)*100
            __req_event('progress','progress', {type:e.type,loaded:__loaded,total:__total,pct:__pct}, xhr);
        };
        xhr.addEventListener('progress', __handleEvent);
        //
        // Handle XHR
        xhr.onload = function onload() {
            if ((xhr.status >= 200 && xhr.status < 300) || xhr.status === 0) {
                var responseData;
                if (options.dataType === 'json') {
                    var parseError;
                    //
                    try {
                        responseData = JSON.parse(xhr.responseText);
                        __req_event('success', responseData, xhr.status, xhr);
                    } catch (err) {
                        parseError = true;
                        __req_event('error', xhr, 'parseerror', 'parseerror');
                    }
                    //
                } else if (options.dataType === 'blob') {
                    __req_event('success', URL.createObjectURL(xhr.response), xhr.status, xhr);
                } else if (options.method==='HEAD') {
                    var splitHeaders = xhr.getAllResponseHeaders().split(/\r?\n/);
                    responseData = {};
                    splitHeaders.forEach(function(sHeader){
                        var splitHeader = sHeader.split(": ");
                        responseData[splitHeader[0].toLowerCase()] = splitHeader[1];
                    });
                    __req_event('success', responseData, xhr.status, xhr);
                } else {
                    responseData = xhr.responseType === 'text' || xhr.responseType === '' ? xhr.responseText : xhr.response;
                    __req_event('success', responseData, xhr.status, xhr);
                }
            } else {
                __req_event('error', xhr, xhr.status, xhr.statusText);
            }
            __req_event('complete', xhr, xhr.status);
        };
        //
        xhr.onerror = function onerror() {
            __req_event('error', xhr, xhr.status, xhr.status);
            __req_event('complete', xhr, 'error');
        };
        // Timeout
        if (options.timeout > 0) {
            xhr.timeout = options.timeout;
            xhr.ontimeout = function () {
                __req_event('error', xhr, 'timeout', 'timeout');
                __req_event('complete', xhr, 'timeout');
            };
        }
        // Ajax start callback
        proceedRequest = __req_event('beforeSend', xhr, options);
        if (proceedRequest === false) { return xhr; }
        // Send XHR
        xhr.send(postData);
        // Return XHR object
        return xhr;
    };
    //
    function RequestPromise(method) {
        let args = Array.from(arguments).slice(1);
        var url = args[0];
        var data = args[1];
        var dataType = args[2];
        //
        method = method.toUpperCase();
        dataType = dataType || (method === 'POSTJSON' ? 'json' : undefined);
        if (method === 'POSTJSON'){ method='POST' };
        if (method==='BLOB'){ method='GET'; dataType='blob'; };
        if (!__http_methods.includes(method)){ method = 'GET' };
        //
        return new Promise(function (resolve, reject) {
            let requestOptions = {
                url: url,
                method: method,
                data: data,
                success: function (responseData, status, xhr) {
                    resolve({ data: responseData, status: status, xhr: xhr });
                },
                error: function (xhr, status, message) {
                    reject({ xhr: xhr, status: status, message: message });
                },
                dataType: dataType,
            };
            if (method === 'POST' && dataType === 'json') {
                Object.assign(requestOptions,
                    {
                        contentType: 'application/json',
                        data: typeof data === 'string' ? data : JSON.stringify(data),
                    }
                );
            }
            Request(requestOptions)
        });
    };
    //
    Object.assign(Request, {
        setTimeout: setTimeout,
        serializeQuery: serializeQuery,
        deserializeQuery: deserializeQuery,
        get: function () {
            let args = Array.from(arguments);
            return RequestPromise.apply(void 0, [ 'get' ].concat( args ));
        },
        post: function () {
            let args = Array.from(arguments);
            return RequestPromise.apply(void 0, [ 'post' ].concat( args ));
        },
        head: function () {
            let args = Array.from(arguments);
            return RequestPromise.apply(void 0, [ 'head' ].concat( args ));
        },
        json: function () {
            let args = Array.from(arguments);
            return RequestPromise.apply(void 0, [ 'json' ].concat( args ));
        },
        blob: function () {
            let args = Array.from(arguments);
            return RequestPromise.apply(void 0, [ 'blob' ].concat( args ));
        },
        getJSON: function () {
            let args = Array.from(arguments);
            return RequestPromise.apply(void 0, [ 'json' ].concat( args ));
        },
        postJSON: function () {
            let args = Array.from(arguments);
            return RequestPromise.apply(void 0, [ 'postJSON' ].concat( args ));
        },
    });
    //

    //
    // cache[gjd_url] =  { lastcheck: '1970-01-01T00:00:00.000Z', lastmodified: '1970-01-01T00:00:00.000Z', ttl: -1, data: '' };
    var _cache = {};
    var _cache_init = new Date();
    var _cache_ttl_default = 360; // 6 hours
    //
    function CacheLoad(){
        for ( let _i = 0, _len = nine.storage.local.length; _i < _len; _i++ ) {
            let _key = nine.storage.local.key(_i)
            if (_key.indexOf('cache_')===0){
                _key = _key.slice(6);
                _cache[_key] = JSON.parse(nine.storage.local.get(_key));
            }
        };
    };
    function CacheSave(){
        for (_key in _cache){
            nine.storage.local.set('cache_'+_key,JSON.stringify(_cache[_key]));
        };
    };
    // 
    function CacheRequestPromise(method){
        let args = Array.from(arguments).slice(1);
        var url = args[0];
        var data = args[1];
        var dataType = args[2];
        //
        let _now = new Date()
        // in cache?
        let _in_cache = url in _cache;
        if (!_in_cache){
            //no, create template
            _cache[url] =  { lastcheck: '1970-01-01T00:00:00.000Z', lastmodified: '1970-01-01T00:00:00.000Z', ttl: -1, data: {} };
        };
        // set up our vars
        let _cache_obj = _cache[url];
        let _doupdate = false;
        let _lastcheck = new Date(_cache_obj.lastcheck);
        let _lastmod = new Date(_cache_obj.lastmodified);
        let _ttl = Number(_cache_obj.ttl);
        // did we last update before dataSource init  or is the ttl -1?
        if (_lastcheck < _cache_init || _ttl == -1){
            _doupdate = true;
        };
        // is there an expired ttl?
        if (!_doupdate && _ttl > 0){
            if ((_now - _lastcheck) > _ttl || (_now - _lastmod) > _ttl){
                _doupdate = true;
            }
        };
        // wait.. are we online?
        if (!window.navigator.onLine){
            _doupdate = false;
        }
        // do we do an update?
        let _return_cache = function(){
            return _cache[url];
        };
        if (_doupdate){
            // pull header, chain head request into next request
            return Request.head(url,data).then(
                function(successResult){
                    let _header = successResult.data;
                    //
                    // do we have last-modified? cache-control:max-age?
                    if ('cache-control' in _header){
                        let _header_cachecontrol = _header['cache-control'];
                        let _header_cache_maindex = _header_cachecontrol.indexOf('max-age=');
                        if (_header_cache_maindex > -1){
                            // we have a max-age, let's cut it out and update ttl
                            let _header_cache_mastr = _header_cachecontrol.substring(_header_cache_maindex)
                            let _header_cache_ma = Number(_header_cache_mastr.substring(0, _header_cache_mastr.indexOf(',')).split('=')[1]);
                            if (_ttl != _header_cache_ma){
                                _ttl = _header_cache_ma;
                                _cache_obj.ttl = _ttl;
                            };
                        };
                    };
                    if ('last-modified' in _header){
                        //
                        let _header_lastmod = new Date(_header['last-modified']);
                        if (_lastmod != _header_lastmod){
                            // last modified changed
                            _lastmod = _header_lastmod
                            _cache_obj.lastmodified = _lastmod.toUTCString()
                        };
                    } else {
                        // no last mod header, set last mod to now
                        _lastmod = _now
                        _cache_obj.lastmodified = _lastmod.toUTCString()
                    };
                    // still template ttl?
                    if (_ttl === -1){
                        _ttl = _cache_ttl_default;
                        _cache_obj.ttl = _ttl;
                    };
                    // update last check
                    _lastcheck = _now;
                    _cache_obj.lastcheck = _lastcheck.toUTCString()
                    // pull data
                    return Request[method](url,data)
                    //
                },
                function(errorResult){
                    console.log('Request.head error')
                    return _return_cache();
                }
            )
            .then(
                function(successResult){
                    let _data = successResult.data;
                    _cache_obj.data = _data;
                    return _data;
                },
                function(errorResult){
                    console.log('Request.json error')
                    return _return_cache().data;
                }
            );
        } else {
            // this needs to return a promise
            return new Promise(function(resolve){ resolve(_return_cache().data) });
        };
        //
    };
    //
    Object.assign(Request, { cache: {} });

    Object.assign(Request.cache, {
        json: function () {
            let args = Array.from(arguments);
            return CacheRequestPromise.apply(void 0, [ 'json' ].concat( args ));
        },
        postJSON: function () {
            let args = Array.from(arguments);
            return CacheRequestPromise.apply(void 0, [ 'postJSON' ].concat( args ));
        },
        load: function() { CacheLoad(); },
        save: function() { CacheSave(); },
        get data() { return _cache; },
        set data(val) {}
    });
    //

    // exports
    nine.util.global(Request,'nine.request');
}());