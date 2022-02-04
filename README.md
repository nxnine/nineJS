
# nineJS

"framework" developed for mobile spa/cordova app
needed to refactor UI drawing logic for mobile and accidentally made a framework
the only goal is to stay vanilla javascript/cordova compliant and simple

consists of:
date.js - date manipulation
hash.js - CRC32, MD5
hash_sha256.js - forge SHA256
emit.js - event emitters
icons.js - SVG icons
icons_fa.js - Font Awesome Free 5.15.0 icons
request.js - XMLHTTPRequest originally from Framework7, tweaked and added an internal cache mechanism
snowflake.js - Twitter Snowflake implementation
doT.js - doT JavaScript Templates
router.js - SPA Router
component.js - WebComponent based components
pdfviewer.js - PDFJS based pdf viewer

did my best to place attribution notices where they should be.
"nineJS" is taken by a few other projects, this is not any of those.
unapologetically badly commented.

## use
place a ```<script  src="ninejs/nine.js"></script>``` on the page
explore the ```nine``` and ```icon``` namespaces
have fun