/*
    resourceloader.js by @nxnine
    rquires:
        nine.js
        emit.js

    promise based xhr resource loader, emits event when resource is available
    also loads js and css
*/
//
// var rl2_ex = {meetings:{unity:"./maws/meetings_unity.js",app:"./maws/meetings_app.js",list:'https://marijuana-anonymous.org/wp-json/maws-data/v1/meetings/all'}};
var __uuid_sep = ':';
class resourceLoader extends nine.emit.event {
    constructor(urlArray={},fetch_once=true){
        super();
        this.resources = {};
        this.__loading = false;
        this.__list_uuid = [];
        this.__loading_uuid = '';
        this.__loading_files = [];
        this.add(urlArray);
    };
    add(fileUUIDs,fetch_once=true){
        // console.log('add:: '+JSON.stringify(fileUUIDs));
        if (!Array.isArray(fileUUIDs)){ fileUUIDs = [fileUUIDs] };
        for (let fileUUID_o of fileUUIDs){
            let fileUUID = '';
            let fileArray = {};
            let fileUUID_keys = Object.keys(fileUUID_o);
            if (typeof fileUUID_o=='object' && fileUUID_keys.length>0){
                fileUUID = fileUUID_keys[0];
                for (let _entry of Object.entries(fileUUID_o[fileUUID])){
                    fileArray[_entry[0]] = {path:_entry[1], data:null};
                };
            };
            if (fileUUID!='' && Object.keys(fileArray).length>0){
                if (!(fileUUID in this.resources)){
                    this.resources[fileUUID] = { state:0, files:fileArray, fetch_once:fetch_once, data:null };
                };
                if (this.__list_uuid.indexOf(fileUUID)==-1){
                    this.__list_uuid.push(fileUUID);
                };
            };
        };
        if (!this.__loading){
            // console.log('add.__load');
            this.__load();
        }
    };
    __loaded(fileUUID,fileURI,fileData){
        // console.log([fileUUID,fileURI].join(':'));
        this.resources[fileUUID].files[fileURI].data = fileData;
        this.emit(fileUUID+__uuid_sep+fileURI,this.resources[fileUUID].files[fileURI].data);
    };
    __postload(_res_data,_res_uuid,_res_key){
        this.__loaded(_res_uuid,_res_key,_res_data);
        // console.log('postload.__load');
        this.__load();
    };
    __load(){
        // console.log('__load');
        let self = this;
        this.__loading = true;
        if (this.__list_uuid.length>0 && this.__loading_uuid==''){
            let _loading_key = this.__list_uuid.shift();
            this.__loading_uuid = _loading_key;
            this.__loading_files = Object.keys(this.resources[_loading_key].files).slice();
        };
        // this.__loading = false; // why??
        if (this.__loading_uuid!='' && this.__loading_files.length>=0){
            if (this.resources[this.__loading_uuid].state==1 && this.resources[this.__loading_uuid].fetch_once){
                this.__loading_uuid = '';
                this.__loading_files = [];
                // console.log('loaded.__load');
                this.__load();
            } else {
                if (this.__loading_files.length!=0){
                    try {
                        let _resource_key = this.__loading_files.shift();
                        // console.log('__load:: '+_resource_key)
                        let _resource_uri = this.resources[this.__loading_uuid].files[_resource_key].path;
                        this.resources[this.__loading_uuid].state = 0;
                        let _resource_file = nine.util.loader.file(_resource_uri);
                        
                        if (_resource_file.indexOf('.js')>0){
                            nine.util.loader.js(_resource_file,self.__postload,this,true,[this.__loading_uuid,_resource_key]);
                        }
                        else if (_resource_file.indexOf('.css')>0){
                            nine.util.loader.css(_resource_file,self.__postload,this,true,[this.__loading_uuid,_resource_key]);
                        } else {
                            // console.log('resourceloader:json');
                            nine.request.json(_resource_file).then(function(_res){
                                // console.log(self.__loading_uuid);
                                self.__postload(_res,self.__loading_uuid,_resource_key);
                            });
                        };
                    } finally {};
                } else {
                    this.resources[this.__loading_uuid].state = 1;
                    this.emit(this.__loading_uuid,this.resources[this.__loading_uuid].files);
                    // console.log(self.__loading_uuid);
                    this.__loading_uuid='';
                    // console.log('uuid.__load');
                    this.__load();
                };
            };
            //
        }
        if (this.__list_uuid.length==0 && this.__loading_files.length==0){
            this.__loading = false;
        };
    };
    register(fileURI,listener){
        let fileKey = '';
        if (fileURI.indexOf(__uuid_sep)>0){
            let fileURIp = fileURI.split(__uuid_sep);
            fileKey = fileURIp[1];
            fileURI = fileURIp[0];
        };
        if (fileURI in this.resources && this.resources[fileURI].state==1){
            if (fileKey!='' && fileKey in this.resources[fileURI].files){
                listener.apply(this,[this.resources[fileURI].files[fileKey].data]);
            } else if (fileKey=='') {
                listener.apply(this,[this.resources[fileURL].data]);
            }
        };
        if (fileKey!=''){
            this.on(fileURI+__uuid_sep+fileKey,listener);
        } else if (fileKey=='') {
            this.on(fileURI,listener);
        }
    };
    load(){
        if (this.__list_uuid.length==0){ Object.keys(this.resources) };
        // console.log('load.__load');
        this.__load();
    };
};