"use strict";


var now = Date.now();
var util = require('util');
var fs = require('fs');
var assert = require('assert')
var fileDir = __dirname+'/filekv_test_data_folder_'+now;
var fkvObj = require('../index.js').create({
    fileDir:fileDir,
    workMax:1000
});

assert.equal(typeof fkvObj,'object');
assert.notEqual(fkvObj,null);
assert.notEqual(fkvObj,undefined);

var value = 'filekv test string';


fkvObj.on('set',function(input,output){

    var key = input[0];
    console.log('set event emit: '+key);
});

fkvObj.on('get',function(input,output){
    var key = input[0];
    console.log('get event emit: '+key);
    var err = output[0];
    var outValue = output[1];
    switch(key){
        case 'testkey1':
        case 'testkey2':
        case 'testkey3':
            assert.equal(outValue==value || !outValue,true);
            break;
    }
});

fkvObj.on('replace',function(input,output){
    var key = input[0];
    var val = input[1];
    console.log('replace event emit: '+key);

    if(input[0]=='testkey5-2'){
        //have error
        assert.equal(output[0] instanceof Error,true);
        fkvObj.get(key,function(err,data){
            assert.notEqual(val,data);
        });
    }
    if(input[0]=='testkey5'){
        //no error
        assert.equal(output[0] instanceof Error,false);
        fkvObj.get(key,function(err,data){
            assert.equal(val,data);
        });
    }
});
fkvObj.on('add',function(input,output){
    var key = input[0];
    var val = input[1];
    console.log('add event emit: '+key);

    if(input[0]=='testkey4-2'){
        //no error
        assert.equal(output[0] instanceof Error,false);
        fkvObj.get(key,function(err,data){
            assert.equal(val,data);
        });

    }
    if(input[0]=='testkey4'){

        //have error
        assert.equal(output[0] instanceof Error,true);
        fkvObj.get(key,function(err,data){
            assert.notEqual(val,data);
        });

    }
});

fkvObj.on('delete',function(input,output){
    var key = input[0];
    console.log('delete event emit: '+key);
    fkvObj.get(key,function(err,data){

        assert.equal(err instanceof Error,true);
        assert.notEqual(data,value);

    });
});

//test set, and, get
fkvObj.set('testkey1',value,function(err){
    fkvObj.get('testkey1',function(err,data,info){

        assert.equal(typeof data,'string');
        assert.equal(data,value);

    })
})

//test set, delete, get
fkvObj.set('testkey2',value,function(err){
    fkvObj.del('testkey2',function(){
        fkvObj.get('testkey2',function(err,data){

            assert.equal(!!data,false);
            assert.notEqual(data,value);

        })        
    });
})

//test key life time
fkvObj.set('testkey3',value,5,function(){
    // assert.equal(1,2)
    fkvObj.get('testkey3',function(err,data,info){

        assert.equal(value,data);
        assert.equal(typeof value,typeof data);

    })
    setTimeout(function(){
        fkvObj.get('testkey3',function(err,data){
            assert.equal(value,data);
            assert.equal(typeof value,typeof data);

        })
    },3e3);

    setTimeout(function(){
        fkvObj.get('testkey3',function(err,data){
            assert.notEqual(value,data);
            assert.notEqual(typeof value,typeof data);
            assert.equal(!!data,false);

        })
    },5e3);

    setTimeout(function(){
        fkvObj.get('testkey3',function(err,data){
            assert.notEqual(value,data);
            assert.notEqual(typeof value,typeof data);
            assert.equal(!!data,false);
        })
    },7e3);
})


//test add function
fkvObj.set('testkey4',value,function(){
    fkvObj.add('testkey4',value+'add',function(err){
        assert.equal(err instanceof Error,true);
    })
    fkvObj.add('testkey4-2',value+'add4-2',function(err){
        assert.equal(err,null);
    })

});

//test replace function
fkvObj.set('testkey5',value,function(){
    fkvObj.replace('testkey5',value+'replace',function(err){
        
        assert.equal(err,null);        
    })
    fkvObj.replace('testkey5-2',value+'replace5-2',function(err){
        assert.equal(err instanceof Error,true);
    })

});



/*
 * lib md5 testing
 */
var _md5 = require('../lib/crypto.js').md5;
assert.equal(_md5('123').toUpperCase(),'202cb962ac59075b964b07152d234b70'.toUpperCase());
assert.equal(_md5('filekv').toUpperCase(),'ec9310957ee4cedd23ce617051c58ea3'.toUpperCase());
assert.equal(_md5('中文').toUpperCase(),'a7bac2239fcdcb3a067903d8077c4a07'.toUpperCase());


/*
 * lib tool testing
 */
var tool = require('../lib/tool.js');
var nowMd5 = _md5(now);
assert.equal(tool.buildDataFileSubDir(nowMd5),nowMd5.substr(0,3)+'/'+nowMd5.substr(3,3));


/*
 * lib mkdirs testing
 */

var testDataFolder = fileDir+'/'+tool.buildDataFileSubDir(_md5(Date.now()));

var filekvFSTool = require('../lib/fs.js');
fs.unlink(testDataFolder,function(err){
    
    filekvFSTool.mkdirs(testDataFolder,function(err){
        
        fs.exists(testDataFolder,function(isExsts){
            assert.equal(isExsts,true);
        });
    });
});

