/*
    SPA Router by @nxnine
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
            _lastchar = '/';
        };
        //
        let _firstchar = __path.slice(0,1);
        if (_firstchar!='/'){
            _firstchar = '';
        } else {
            __path = __path.slice(1);
            _firstchar = '/';
        };
        //
        let _params = [];
        let _paths = [];
        let _path_array = __path.split('/');
        for (_idx in _path_array){
            let _path = _path_array[_idx];
            if (_path.slice(0,1)!=':'){
                _paths.push(__escape_string('/'+_path));
            } else {
                _params.push(_path.slice(1));
                _paths.push('(?:\\/([^\\/#\\?]+?))');
            };
        };
        //
        return ['^'+_paths.join('')+__escape_string(_lastchar)+'$',_params];
    };
    //

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
    };
    // because of our unique use case, we only check for cordova
    _use_system = false;
    if(window.hasOwnProperty("cordova")){
        _use_system = true;
    }
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
            if (add_state==null){
                add_state = true;
            }
            if (!_queries){
                _queries = {};
            }
            let _query = null;
            let _query_idx = __href.indexOf('?');
            if (_query_idx>-1){
                _query = __href.slice(_query_idx+1);
                __href = __href.slice(0,_query_idx);
                _queries = nine.request.deserializeQuery(_query);
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

        //
        let _route = {
            name: _name,
            regex: new RegExp(_parsed_path[0]),//,'g'),
            // global flag causes issue
            // https://stackoverflow.com/questions/3811890/javascript-regular-expression-fails-every-other-time-it-is-called
            params: _parsed_path[1]
        };
        //
        if (__route.template){ _route.template = __route.template };
        if (__route.url){ _route.url = __route.url };
        if (__route.async){ _route.async = __route.async };
        if (__route.on){ _route.on = __route.on };
        navigator_routes[_name] = _route;
    };
    function navigator_popstate(event){
        // there's a problem here when navigating back to the first page
        // we should do a history.replaceState
        if (event.state==null && _navigator_default_route){
            navigator_go(_navigator_default_route,{},false);
        } else {
            navigator_go(event.state.path,event.state.query,false);
        }
    };
    function navigator_addRoutes(__routes){
        for (let _i = 0;_i < __routes.length;_i++){
            navigator_addRoute(__routes[_i]);
        };
    };
    function navigator_init(){
        window.addEventListener('popstate', navigator_popstate);
        // poison anchors
        document.querySelectorAll('a').forEach(navigator_addClick);
    };

    // Observer
    // for poisoning future anchors
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
                            //
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
    nine.util.global(nx,'nine');
}());

nine.router.util.init();