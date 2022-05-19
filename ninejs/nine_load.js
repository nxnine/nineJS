/*
    nine_load.js by @nxnine
    requires:
        nine.js

    bootstraps all the good stuff
*/
//
/**/
nine.util.scripts([
    "./ninejs/touchobserver.js",
    "./ninejs/date.js",
    "has_intl??./ninejs/date_tz.js:./ninejs/moment/moment.min.js",
    "./ninejs/hash.js",
    // "./ninejs/hash_sha256.js",
    "./ninejs/emit.js",
    "./ninejs/timer.js",
    "./ninejs/icons.js",
    // "./ninejs/icons_fa.js",
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
    // "./ninejs/pdfjs/build/pdf.js",
    // "./ninejs/pdfviewer.css",
    // "./ninejs/pdfviewer.js",
    "./maws/skeleton.css",
    // "./maws/meetings_unity.js",
    // "./maws/meetings_app.js",
    "./app/icons_app.js",
    "./app/app.css",
    "./app/routes.js",
    "./app/app.js",
    "./app/cordova_util.js",
]);
/**/
// nine.util.scripts(["has_intl??date_tz.js:moment.min.js","nine.css","app.css","app.js"]);