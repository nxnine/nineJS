/*
    router.js by @nxnine
    
    inspired by https://github.com/vijitail/simple-javascript-router
*/
(function () {
    //
    var nx = {};
    //
    /*
        View
    */
    var __view = document.querySelector('.nine-view');
    if (!__view){
        __view = document.body;
    }
    nx.view = __view;
    //
    /*
        Router
    */
    //
    function __escape_string(str) {
        return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
    };
    function __parse_path(__path){
        let _lastchar = __path.slice(-1);
        if (_lastchar!='/'){
            _lastchar = '';
        } else {
            __path = __path.slice(0,-1);
        };
        //
        if (__path.slice(0,1)=='/') __path = __path.slice(1);
        //
        let _params = [], _paths = [];
        let _path_array=__path.split('/');
        for (_path of _path_array){
            if (_path.slice(0,1)==':'){
                _params.push(_path.slice(1));
                _paths.push('(?:\\/([^\\/#\\?]+?))');
                continue;
            };
            _paths.push(__escape_string('/'+_path));            
        };
        return ['^'+_paths.join('')+__escape_string(_lastchar)+'$',_params];
    };
    //

    //
    let __route_scheme_sep = '://';
    let __route_query_sep = '?';
    let __route_query_delim = '&';
    let __route_query_join = '=';
    let __route_query_array = ',';
    function __route_parse(_route_uri_string){
        let routeURI = {};
        let _scheme_sep = _route_uri_string.indexOf(__route_scheme_sep);
        let _query_sep = _route_uri_string.indexOf(__route_query_sep);
        let _query_delim = _route_uri_string.indexOf(__route_query_delim);
        let _query_join = _route_uri_string.indexOf(__route_query_join);
        if(_scheme_sep>-1){
            routeURI.scheme = _route_uri_string.slice(0,_scheme_sep);
            // _route_uri_string = _route_uri_string.slice(_scheme_sep+3);
            if (_query_sep>-1){
                routeURI.path = _route_uri_string.slice(_scheme_sep+3,_query_sep);
                _route_uri_string = _route_uri_string.slice(_query_sep+1);
            } else {
                // this might be a block of queries....
                if (_query_delim==-1 && _query_join==-1){
                    // nope, just a path
                    routeURI.path = _route_uri_string.slice(_scheme_sep+3);
                    _route_uri_string = "";
                } else {
                    // just queries
                    routeURI.path = "";
                    _route_uri_string = _route_uri_string.slice(_scheme_sep+3);
                }
            };
            if (_route_uri_string.length>0){
                routeURI.query = {};
                let _queries = _route_uri_string.split(__route_query_delim);
                _queries.forEach(function(_query_param){
                    if (_query_param.indexOf(__route_query_join)>0){
                        //
                        _param_split = _query_param.split(__route_query_join);
                        routeURI.query[_param_split[0]] = _param_split[1]
                    } else if (_query_param.indexOf(__route_query_join)==0 && _query_param.length>1){
                        routeURI.query[_query_param.slice(1)] = _query_param.slice(1);
                    } else if (_query_param.indexOf(__route_query_join)==-1){
                        routeURI.query[_query_param] = _query_param;
                    };
                    if (_query_param in routeURI.query && routeURI.query[_query_param].indexOf(__route_query_array)){
                        routeURI.query[_query_param] = routeURI.query[_query_param].split(__route_query_array)
                    }
                })
            }
        };
        return routeURI;
    }
    //

    /*
        router
            navigator
                route information
                loading data into view
            observer
                runs a MutationObserver watching for anchor elements
                hijacks anchor element clicks
    */
    // Navigator
    var navigator_routes = {};
    var _navigator_default_route = null;
    function navigator_default_route(_route_path){
        _navigator_default_route = _route_path;
    };
    function navigator_view(_data,_state,add_state){
        nine.view.innerHTML = _data
        nine.component.popup.clear();
        if (_state && add_state){
            history.pushState(_state,'');
        };
        // } else {
        //     history.replaceState({},'');
        // };
    };
    /*
        scheme handler
        panel:// would open a panel
        popup:// opens a popup
        pdf:// would navigate to a page in a pdfviewer
        http:// & https:// would open a new browser tab/open in external browser
        etc

    */
    // because of our unique use case, we only check for cordova
    _use_system = false;
    if(window.hasOwnProperty("cordova")) _use_system = true;
    // default
    function default_handler(_url){
        if (_use_system){
            window.open(_url,'_system');
        } else {
            window.open(_url,'_blank');
        }
    };
    var navigator_schemes = {
        'http': default_handler,
        'https': default_handler
    }
    //

    //
    function navigator_go(__href,_queries,add_state){
        //
        if (__href=='..'){
            history.back();
        } else if (__href.indexOf(':')>-1) {
            let _href_scheme = __href.slice(0,__href.indexOf(':'));
            if (_href_scheme in navigator_schemes){
                navigator_schemes[_href_scheme](__href);
            } else {
                default_handler(__href);
            }
        } else {
            if (add_state==null) add_state = true;
            if (!_queries) _queries = {};
            let _query_idx = __href.indexOf('?');
            if (_query_idx>-1){
                _queries = nine.request.deserializeQuery(__href.slice(_query_idx+1));
                __href = __href.slice(0,_query_idx);
            };
            let _routes = Object.values(navigator_routes);
            let _match = false;
            for (let _i in _routes){
                let _route = _routes[_i]
                let _regex = _route.regex.exec(__href);
                if (_regex){
                    //
                    _match = true;
                    //
                    if (_route.url){
                        nine.request.get(_route.url).then(
                            function(successResult){
                                let _data = successResult.data;
                                // we have data, load into nine.view
                                navigator_view(_data,{path:__href,query:_queries},add_state)
                                if (_route.on){
                                    if (_route.on.pageAfterIn){
                                    _route.on.pageAfterIn(null,nine.view)
                                }
                            };
                            //
                        },
                        function(errorResult){
                            //
                        }
                        );
                    }
                    else if(_route.async){
                        let _route_to = {path:__href,query:_queries,route:_route};
                        let _route_from = {};
                        let _async = new Promise(function (resolve, reject) {
                            _route.async(_route_to,_route_from,resolve,reject);
                        }).then(
                            function(successResult){
                                /*
                                {
                                    type: 'popup',  // page, popup, panel; if panel, then we need a target...
                                        template: ``,
                                        context: {}
                                    }
                                    */
                                let _template = null;
                                if (_route.template){
                                    _template = doT.template(_route.template);
                                }
                                else if (successResult.template){
                                    _template = doT.template(successResult.template);
                                }
                                let _html_str = _template(successResult.context);
                                if (successResult.type == 'popup'){
                                    console.log(JSON.stringify(_route_to.query))
                                    let __name = _route_to.query.name;
                                    if (!__name){ __name = __href };
                                    nine.component.popup.create(__name,_html_str);
                                }
                                if (successResult.type == 'page'){
                                    //
                                    navigator_view(_html_str,{path:__href,query:_queries},add_state);
                                    if (_route.on){
                                        if (_route.on.pageAfterIn){
                                            _route.on.pageAfterIn(null,nine.view)
                                        }
                                    };
                                    //
                                };
                            },
                            function(errorResult){
                                //
                            }
                            );
                        };
                        break;
                }
            };
            if (!_match){
                //
            };
            //
        };
    }
    function navigator_popstate(event){
        // there's a problem here when navigating back to the first page
        // need a special navigate_first that does a history.replaceState
        if (event.state==null && _navigator_default_route){
            navigator_go(_navigator_default_route,{},false);
        } else {
            navigator_go(event.state.path,event.state.query,false);
        }
    };
    function navigator_click(event){
        event.preventDefault();
        let _el = event.target;
        if (_el.tagName != 'A'){
            _el = _el.closest("a");
        };
        navigator_go(_el.getAttribute('href'));
    };
    function navigator_addClick(el){
        el.removeEventListener('click', navigator_click, false);
        el.addEventListener('click', navigator_click, false);
    };
    function navigator_addRoute(__route){
        let _name = __route.name || __route.path;
        let _parsed_path = __parse_path(__route.path);
        // console.log(_parsed_path);
        //
        let _route = {
            name: _name,
            regex: new RegExp(_parsed_path[0]),//,'g'),
            // global flag causes issue
            // https://stackoverflow.com/questions/3811890/javascript-regular-expression-fails-every-other-time-it-is-called
            params: _parsed_path[1]
        };
        //
        if (__route.resources && app){ app.resources.add(__route.resources,false) }
        if (__route.fetchOnce && app){ app.resources.add(__route.fetchOnce) }
        if (__route.template){ _route.template = __route.template };
        if (__route.url){ _route.url = __route.url };
        if (__route.async){ _route.async = __route.async };
        if (__route.on){ _route.on = __route.on };
        navigator_routes[_name] = _route;
    };
    function navigator_addRoutes(__routes){
        for (let _i = 0;_i < __routes.length;_i++){
            navigator_addRoute(__routes[_i]);
        };
    };
    function navigator_init(){
        window.addEventListener('popstate', navigator_popstate);
        document.querySelectorAll('a').forEach(navigator_addClick);
    };

    // Observer
    var _observer = null;
    var _observer_params_default = { childList: true, subtree: true };
    function observer_watch(el,params){
        if(!params){
            params = _observer_params_default;
        };
        _observer.observe(el, params);
    };
    function observer_event(mutationsList, observer) {
        for(let mutation of mutationsList) {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(function(_node){
                    if (_node.hasAttribute && _node.nodeName.toLowerCase()==='a' && _node.hasAttribute('href')){
                        navigator_addClick(_node);
                    } else if(_node.querySelectorAll) {
                        _node.querySelectorAll('a').forEach(function(__node){
                            if (__node.hasAttribute && __node.nodeName.toLowerCase()==='a' && __node.hasAttribute('href')){
                                navigator_addClick(__node);
                            }
                        });
                    }
                });
            };
        };
    };
    function observer_init(){
        _observer = new MutationObserver(observer_event);
        observer_watch(document.body);
        router.observer = _observer;
    };
    
    // Router
    router = {
        observer: _observer,
        navigate: navigator_go,
        schemes: navigator_schemes,
        default_route: navigator_default_route,
        routes: navigator_addRoutes,
        event: {
            click: navigator_click,
            observe: observer_event,
            history: navigator_popstate
        },
        util: {
            parse: __route_parse,
            addClick: navigator_addClick,
            addRoute: navigator_addRoute,
            observe: observer_watch,
            init: function(){
                observer_init();
                navigator_init();
            }
        }
    };
    //

    // exports
    nx.router = router;
    //
    nine.global.set(nx,'nine');
}());

nine.router.util.init();