/*
    pdfviewer.js by @nxnine
    requires:
        nine.js
        icon.js
        component.js
        pdf.js

    pdf viewer component, experimental, built from pdf.js example
*/

// Loaded via <script> tag, create shortcut to access PDF.js exports.
var pdfjsLib = window['pdfjs-dist/build/pdf'];
// The workerSrc property shall be specified.
pdfjsLib.GlobalWorkerOptions.workerSrc = './ninejs/pdfjs/build/pdf.worker.js';
//
// var DEFAULT_SCALE_DELTA = 1.1;
var DEFAULT_SCALE_DELTA = 1.01;
var MAX_SCALE = 10;
var MIN_SCALE = 0.1
// select
nine.component.pdfview = class extends nine.component.html {
    configure(){
        //
    };
    postRender(){
        this.url = this.props.file;
        this.doc = null;
        this.pageCount = 0;
        this.pageNum = 0;
        this.pageRendering = false;
        this.pageNumPending = null;
        this.scale = 1.5;
        this.page = this._parent.querySelector('#pdf-page');
        this.canvas = this._parent.getElementById('the-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.viewport = null;
        this._curPage = null;
        //
        this._height_unit = 0;
        this._width_unit = 0;
        this._scroll_top = 0;
        this._scroll_left = 0;
        //
        this.renderQueue = [];
        this.__page_render = Promise.resolve();
        //
        this.raw_outline = null;
        this.outline = [];
        //
        this.pageCountEl = this._parent.getElementById('nine-pdf-page_count')
        this.pageNumEl = this._parent.getElementById('nine-pdf-page_num')
        this._prevButton = this._parent.querySelector('.nine-pdf-prev');
        this._prevButton.addEventListener('mouseup', this.onPrevPage.bind(this));
        this._nextButton = this._parent.querySelector('.nine-pdf-next');
        this._nextButton.addEventListener('mouseup', this.onNextPage.bind(this));
        //
        //
        this.load_file();
        //
        this.touch_setup();
    };
    //
    touch_setup(){
        // console.log('pdfViewer','touch_setup');
        var self = this;
        //
        var touchWatch = new nine.util.touchObserver(this.page);
        // var touchWatch = new nine.util.touchObserver(document.body);
        // document.body.addEventListener('pinchZoomOut',function(){self.decreaseScale()});
        // document.body.addEventListener('pinchZoomIn',function(){self.increaseScale()});
        //
        this.page.addEventListener('pinchZoomOut',function(ev){
            nine.util.commands([function(){self.decreaseScale(ev.detail);}]);
        });
        this.page.addEventListener('pinchZoomIn',function(ev){
            nine.util.commands([function(){self.increaseScale(ev.detail);}]);
        });
        this.page.addEventListener('pinchZoomEnd',function(ev){
            nine.util.commands([function(){self.canvasScale(true);}]);
        });
        this.page.addEventListener('swipeRight',function(ev){
            console.log('eventlisten','swiperight')
        });
        this.page.addEventListener('swipeLeft',function(ev){
            console.log('eventlisten','swipeleft')
        });
        this.page.addEventListener('swipeMove',function(ev){
            nine.util.commands([function(){self.panTo(ev.detail);}]);
        });
        this.page.addEventListener('swipeStart',function(ev){
            nine.util.commands([function(){self.startPan(ev.detail);}]);
        });
        this.page.addEventListener('swipeEnd',function(ev){
            nine.util.commands([function(){self.endPan(ev.detail);}]);
        });
    };
    deconstruct(){};
    //
    template(){
        return `
        <div class="nine-pdfview">
            <div class="nine-pdf-page" id="pdf-page">
                <canvas class="nine-pdf-canvas" id="the-canvas"></canvas>
                <div class="nine-pdf-prev" id="prev"></div>
                <div class="nine-pdf-next" id="next"></div>
            </div>
            <div class="nine-pdf-pagecounter"><span id="nine-pdf-page_num"></span> / <span id="nine-pdf-page_count"></span></div>
        <div>
        `;
    };
    //
    toc_process(_level,_items){
        for (let i = 0; i < _items.length; i++) {
            //
            let _item = _items[i];
            let title = _item.title;
            let dest = _item.dest[0];
            this.outline.push([_level,title,dest])
            this.toc_process(_level+1,_item.items)
        };
    };
    toc_draw(){
        let self = this;
        if (self.hasAttribute('toc')){
            let panelEl = document.querySelector('nine-panel[name='+self.getAttribute('toc')+']')
            let panelList = panelEl.querySelector('nine-list');
            //
            for (let i = 0; i < self.outline.length; i++) {
                let _item = self.outline[i];
                let _level = _item[0];
                let title = _item[1];
                let pageIndex = _item[3];
                // console.log(title+' :: '+pageIndex);
                self.pairs.push({ title: title, pageNumber:  pageIndex + 1 });
                if (panelEl && panelList){
                    //
                    let destLi = document.createElement('li');
                    let destHREF = document.createElement('a');
                    destHREF.setAttribute('href','pdfview://'+self.id+'/'+pageIndex);
                    destHREF.innerText = Array(_level+1).join('.')+title;
                    destLi.appendChild(destHREF);
                    panelList.appendChild(destLi);
                };
            };
            //
            panelList.appendChild(nine.component._element(`<li name="list-spacer" class="list-spacer"><div class="nine-select" name="list-spacer"></div></li>`));
            //
        };
    };
    //
    load_file(){
        let self = this;
        // console.log('load_file.start');
        nine.component.spinner.open('pdfViewer');
        pdfjsLib.getDocument(self.url).promise.then(function(pdfDoc_) {
            // console.log('load_file.getDocument.start');
            self.doc = pdfDoc_;
            self.pageCount = self.doc.numPages;
            // TOC ?
            // Here we go!
            self.pairs = [];
            let panelEl = null;
            let panelList = null;
            if (self.hasAttribute('toc')){
                panelEl = document.querySelector('nine-panel[name='+self.getAttribute('toc')+']')
                panelList = panelEl.querySelector('nine-list');
            };
            // Get the tree outline
            self.doc.getOutline().then(function(outline) {
                // console.log('load_file.getDocument.getOutline.start');
                if (outline) {
                    // console.log(outline);
                    self.outline = [];
                    self.toc_process(0,outline);
                    // console.log(self.outline);
                    for (let i = 0, p = Promise.resolve(); i <= self.outline.length; i++) {
                        if (i<self.outline.length){
                            let _item = self.outline[i];
                            let dest = _item[2];
                            // console.log(dest);
                            p = p.then(() => self.doc.getPageIndex(dest).then(function(pageIndex){
                                                // console.log('load_file.getDocument.getOutline.getPageIndex.start');
                                                // console.log('pageIndex');
                                                self.outline[i].push(pageIndex+1);
                                            })
                            );
                        } else if (i==self.outline.length){
                            p = p.then(() => self.toc_draw());
                        }
                    }
                };
                // console.log(pairs);
                // console.log('load_file.getDocument.getOutline.end');
            }).finally(function(){
                nine.component.spinner.close('pdfViewer');
            });
            //
            // Initial/first page rendering
            self.renderPage(1);
            //
            self.pageCountEl.textContent = self.pageCount;
            // console.log('load_file.getDocument.end');
        });
        // console.log('load_file.end');
    };
    //
    increaseScale(event) {
        console.log(event);
        let newScale = this.viewport.scale;
        let steps = 1;
        console.log('viewport.scale: '+this.viewport.scale);
        do {
        newScale = (newScale * DEFAULT_SCALE_DELTA).toFixed(2);
        newScale = Math.ceil(newScale * 10) / 10;
        newScale = Math.min(MAX_SCALE, newScale);
        } while (--steps > 0 && newScale <= MAX_SCALE);
        // console.log('viewport.newscale: '+newScale);
        // if (newScale==MAX_SCALE){console.log('MAX_SCALE')};
        this.queueRenderPage(this.pageNum,newScale);
        // this.renderPage(this.pageNum,newScale);
    };
    
    decreaseScale(event) {
        let newScale = this.viewport.scale;
        let steps = 1;
        do {
        newScale = (newScale / DEFAULT_SCALE_DELTA).toFixed(2);
        newScale = Math.floor(newScale * 10) / 10;
        newScale = Math.max(MIN_SCALE, newScale);
        } while (--steps > 0 && newScale >= MIN_SCALE);
    
        this.queueRenderPage(this.pageNum,newScale);
        // this.renderPage(this.pageNum,newScale);
    };
    //
    startPan(){
        this._scroll_top = this.page.scrollTop;
        this._scroll_left = this.page.scrollLeft;
    }
    endPan(){
        this._scroll_top = 0;
        this._scroll_left = 0;
    }
    panTo(points){
        //
        var startX, startY, newX, newY;
        startX = points.start.clientX;
        startY = points.start.clientY;
        newX = points.touch.clientX;
        newY = points.touch.clientY;
        const xDiff = newX - startX;
        const yDiff = newY - startY;
        const scrollTop = this._scroll_top - yDiff;
        const scrollLeft = this._scroll_left - xDiff;
    
        if (this.page.scrollTo) {
             this.page.scrollTo({top:scrollTop,left:scrollLeft,behavior:'instant'})
        } else {
          this.page.scrollTop = scrollTop;
          this.page.scrollLeft = scrollLeft;
        }
    };
    //
    renderPage(num,_scale,_do_scale){
        let self = this;
        let _shift_scroll = 0;
        // console.log('this.pageRendering = true')
        this.pageRendering = true;
        if ((_scale==null || _scale==undefined) && (num==null || num==undefined)){
            let _queue_page = this.renderQueue.shift();
            num = _queue_page[0];
            _scale = _queue_page[1];
            _do_scale = _queue_page[2] || false;
        };
        //
        return this.doc.getPage(num).then(function(page){
            //
            self._curPage = page;
            // page change
            if ((_scale==null || _scale==undefined) && self.pageNum!=num){
                var _scale_mod = 1;
                var _scale_viewport = function(){
                    let fviewport = page.getViewport({scale: 1});
                    let scale = (self.page.clientWidth*_scale_mod) / fviewport.width;
                    MIN_SCALE = scale;
                    let sviewport = page.getViewport({ scale: scale, });
                    return sviewport;
                };
                var viewport = _scale_viewport();
                // we brute force a proper viewport scale
                // there has to be a more elegant solution though
                while (viewport.height >= self.page.clientHeight || viewport.width >= self.page.clientWidth){
                    _scale_mod -= 0.01
                    viewport = _scale_viewport();
                };
                //
                self._height_unit = Math.round((viewport.height/(10*viewport.scale))*10)/10;
                self._width_unit = Math.round((viewport.width/(10*viewport.scale))*10)/10;
                //
            // no page change, no scale change
            } else if (self.pageNum==num && _scale==self.viewport.scale) {
                // console.log('::!page_change && !scale_change::');
                return Promise.resolve().then(function(){
                    self.queueRenderNext();
                });
            // no page change, scale change
            } else {
                console.log('::!page_change && scale_change::');
                let _old_scale = self.viewport.scale;
                if (_old_scale < _scale){ _shift_scroll=2 } else if (_old_scale > _scale){ _shift_scroll=1 };

                var viewport = page.getViewport({scale: _scale});
            };
            self.viewport = viewport;
            //
            if (self.pageNum==0 || _do_scale){
                self.canvasScale(false);
            };
            //

            // Render PDF page into canvas context
            self.__render(_shift_scroll);
            //
            self.pageNum = num;
            self.pageNumEl.textContent = num;
        });
        //
        //
    };
    drawDot(){
        var self = this;
        console.log('drawDot()')
        if (self.ctx){
            let _page_centerX = (self.page.scrollLeft+(self.page.scrollLeft+self.page.clientWidth))/2;
            let _page_centerY = (self.page.scrollTop+(self.page.scrollTop+self.page.clientHeight))/2
            self.ctx.fillStyle = 'black';
            self.ctx.fillRect(_page_centerX,_page_centerY,10,10);
            //
            let _canvas_centerX = (self.canvas.scrollLeft+(self.canvas.scrollLeft+self.canvas.clientWidth))/2;
            let _canvas_centerY = (self.canvas.scrollTop+(self.canvas.scrollTop+self.canvas.clientHeight))/2
            self.ctx.fillStyle = 'green';
            self.ctx.fillRect(_canvas_centerX,_canvas_centerY,10,10);
            //

            //
        };
    };
    __render(_shift_scroll){
        //
        var self = this;
        // Render PDF page into canvas context
        var renderContext = {
            canvasContext: this.ctx,
            viewport: this.viewport
        };
        this.__page_render = this.__page_render.then(function(){
            //
            return self._curPage.render(renderContext).promise.then(function() {
                //
                self.queueRenderNext();
                //
            }).finally(function(){
                // sometimes "uncaught (in promise) error: cannot use the same canvas for multiple render() operations" error
                // this *seems* to be the catch all
                console.log('viewport: '+self.viewport.width)
                console.log('canvas: '+self.canvas.width)
                // self.drawDot();
                if (_shift_scroll==2){
                    self.page.scrollTop = self.page.scrollTop + (self._height_unit/2);
                    self.page.scrollLeft = self.page.scrollLeft + (self._width_unit/2);
                } else if (_shift_scroll==1){
                    self.page.scrollTop = self.page.scrollTop - (self._height_unit/2);
                    self.page.scrollLeft = self.page.scrollLeft - (self._width_unit/2);
                };;
                self.pageRendering = false;
            });
        });
        //
    }
    canvasScale(forceRender){
        this.canvas.height = this.viewport.height;//+this._height_unit;
        this.canvas.width = this.viewport.width;//+this._width_unit;
        //
        if (forceRender){
            this.__render();
        }
    }
    /**
    * If another page rendering in progress, waits until the rendering is
    * finised. Otherwise, executes rendering immediately.
    */
    // MAKE THIS INTO A REAL QUEUE
    queueRenderPage() {
        // console.log(JSON.stringify(this.renderQueue));
        let _args = Array.from(arguments);
        this.renderQueue.push([_args[0],_args[1],_args[2]]);
        if (!this.pageRendering) {
            this.renderPage();
        }
    };
    queueRenderNext(){
        // console.log('this.pageRendering = false')
        this.pageRendering = false;
        if (this.renderQueue.length>0){
            this.renderPage();
        }
    }
    /**
    * Displays previous page.
    */
   resetPage(){
        //
        var self = this;
        if (this.page!=undefined){
            this.page.scrollTop = 0;
            this.page.scrollLeft = 0;
        };
        //
        this.queueRenderPage(this.pageNum,MIN_SCALE,true)
   }
    onPrevPage() {
        // console.log('prev');
        if (this.pageNum <= 1) {
            return;
        }
        // this.pageNum--;
        this.resetPage();
        this.queueRenderPage(this.pageNum-1);
    };
    /**
    * Displays next page.
    */
    onNextPage() {
        // console.log('next:');
        if (this.pageNum >= this.pageCount) {
            return;
        }
        // this.pageNum++;
        this.resetPage();
        this.queueRenderPage(this.pageNum+1);
        // console.log(':next');
    };
};
//

//
function __route_pdf_view(_pdfview_uri){
    if(_pdfview_uri.indexOf('://')>-1){ _pdfview_uri = nine.router.util.parse(_pdfview_uri).path };
    let _pdfview_id_page = _pdfview_uri.split('/');
    // console.log(_pdfview_id_page[0])
    // console.log(_pdfview_id_page[1])
    let _pdfview = document.getElementById(_pdfview_id_page[0]);
    _pdfview.resetPage();
    _pdfview.queueRenderPage(Number(_pdfview_id_page[1]));
    nine.component.panel.clear();
}
// load scheme handler in router
if ('router' in nine){
    nine.router.schemes['pdfview'] = __route_pdf_view;
};
//
nine.component.register('nine-pdfview', nine.component.pdfview);
//