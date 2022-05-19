/*
    icons.js by @nxnine

    SVG icons, derived from fontawesome v5
*/

(function () {
    //
    var icon = {}, _globals;
    //
    // these parse vectorData
    function _slicedToArray(arr, i) {
        return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest();
    };
    function _arrayWithHoles(arr) {
        if (Array.isArray(arr)) return arr;
    };
    function _iterableToArrayLimit(arr, i) {
        var _arr = [];
        var _n = true;
        var _d = false;
        var _e = undefined;
        try {
            for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
                _arr.push(_s.value);
                if (i && _arr.length === i) break;
            }
        } catch (err) {
            _d = true;
            _e = err;
        } finally {
            try {
                if (!_n && _i["return"] != null) _i["return"]();
            } finally {
                if (_d) throw _e;
            }
        }

        return _arr;
    };
    function _nonIterableRest() {
        throw new TypeError("Invalid attempt to destructure non-iterable instance");
    };
    //
    // instead of the fa approach, since we only need the markup
    function load_icons(data_array,set_name){
        if (!(set_name in icon)){
            icon[set_name] = {};
        };
        Object.keys(data_array).forEach(function(fa_icon_name){
            //
            var fa_data = data_array[fa_icon_name];
            var width = fa_data[0];
            var height = fa_data[1];
            var weight = fa_data[2];
            var vectorData = _slicedToArray(fa_data.slice(4));
            console.log(vectorData);
            if (typeof weight!='string'){weight='auto'};
            //
            var svgEl = document.createElement("svg");
            svgEl.setAttribute("aria-hidden","true");
            svgEl.setAttribute("focusable","false");
            svgEl.setAttribute("preserveAspectRatio","xMidYMin slice");
            svgEl.setAttribute("class","svg-inline--fa fa-w-"+weight);
            // svgEl.setAttribute("class","svg-inline--fa");
            svgEl.setAttribute("xmlns","http://www.w3.org/2000/svg");
            svgEl.setAttribute("viewBox","0 0 ".concat(width, " ").concat(height));
            //
            var svgPath = document.createElement("path");
            svgPath.setAttribute("fill","currentColor");
            svgPath.setAttribute("d",vectorData);
            //
            svgEl.appendChild(svgPath);
            //
            icon[set_name][fa_icon_name] = svgEl.outerHTML;
            //
        });
    };
    icon.load = load_icons;
    //
    // exports
    _globals = (function(){ return this || (0,eval)("this"); }());
    _globals.icon = icon;
}());