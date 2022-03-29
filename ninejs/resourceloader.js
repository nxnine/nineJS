/*
    resourceloader.js by @nxnine
    rquires:
        emit.js

    promise based xhr resource loader, emits event when resource is available
*/

class resourceLoader extends nine.emit.event {
    constructor(urlArray){
        super();
        this.resources = {};
        for (let fileURL of urlArray){
            this.resources[fileURL] = { state:0, data:null };
        };
        this.__list_resource = Object.keys(this.resources);
        this.__load();
    };
    register(fileURL,listener){
        if (fileURL in this.resources && this.resources[fileURL].state==1){
            listener.apply(this,[this.resources[fileURL].data]);
        };
        this.on(fileURL,listener);
    };
    __load(){
        let self = this;
        if (this.__list_resource.length!=0){
            let _resource_key = this.__list_resource.shift();
            this.resources[_resource_key].state = 0;
            nine.request.json(_resource_key).then(function(_res){
                self.__loaded(_resource_key,_res);
                self.__load();
            });
        };
    };
    __loaded(fileURL,fileData){
        this.resources[fileURL].state = 1;
        this.resources[fileURL].data = fileData;
        this.emit(fileURL,this.resources[fileURL].data)
    };
}