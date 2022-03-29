/*
    nine_load.js by @nxnine
    requires:
        nine.js

    bootstraps all the good stuff
*/
//
var has_intl = (Intl && 'formatToParts' in new Intl.DateTimeFormat()) || null;
nine.util.scripts([
    "./ninejs/date.js",
    "has_intl??./ninejs/date_tz.js:./ninejs/moment/moment.min.js",
    "./ninejs/hash.js",
    // "./ninejs/hash_sha256.js",
    "./ninejs/emit.js",
    "./ninejs/timer.js",
    "./ninejs/icons.js",
    // "./ninejs/icons_fa.js",
    "icons_app.js",
    "./ninejs/request.js",
    "./ninejs/snowflake.js",
    "./ninejs/doT.js",
    "./ninejs/router.js",
    "./ninejs/resourceloader.js",
    "./ninejs/fonts.css",
    "./ninejs/nine.css",
    "./ninejs/component.js",
    "./ninejs/smalltimer_audio.js",
    "./ninejs/smalltimer.css",
    "./ninejs/smalltimer.js",
    "app.css",
    "./maws/skeleton.css",
    "./maws/meetings_unity.js",
    "./maws/meetings_app.js",
    "routes.js",
    "app.js",
    "cordova_util.js",
    // "./ninejs/pdfjs/build/pdf.js",
    // "./ninejs/pdfviewer.css",
    // "./ninejs/pdfviewer.js",
]);