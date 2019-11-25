var http = require('http');
const request = require('request');
const BloomFilter = require('./Release/bloom-filter-cpp.node').BloomFilter;
const axios = require('axios');


global.routers = [
    "http://localhost:8888",
    "http://localhost:8889",
    "http://localhost:8890",
    "http://localhost:8891"
];


global.routers_ = [
    {
        name: "a",
        addr: "http://localhost:8888"
    },
    {
        name: "b",
        addr: "http://localhost:8889"
    },
    {
        name: "c",
        addr: "http://localhost:8890"
    },
    {
        name: "d",
        addr: "http://localhost:8891"
    }
];

global.nodeiFaceStore = {
    'a': [
        {
            to: 'e', 
            addrs: ["10.0.0.1", "10.0.0.2"],
            reachableNodes: []
        },
        {
            to: 'cl0',
            addrs: ["10.0.0.5", "10.0.0.6"],
            reachableNodes: []
        }
    ],
    'b': [
        {
            to: 'e', 
            addrs: ["10.0.0.9", "10.0.0.10"],
            reachableNodes: []
        },
        {
            to: 'cl1',
            addrs: ["10.0.0.13", "10.0.0.14"],
            reachableNodes: []
        }
    ],
    'c': [
        {
            to: 'e', 
            addrs: ["10.0.0.17", "10.0.0.18"],
            reachableNodes: []
        },
        {
            to: 'cl2',
            addrs: ["10.0.0.21", "10.0.0.22"],
            reachableNodes: []
        }
    ],
    'd': [
        {
            to: 'e', 
            addrs: ["10.0.0.29", "10.0.0.30"],
            reachableNodes: []
        },
        {
            to: 'cl3',
            addrs: ["10.0.0.25", "10.0.0.26"],
            reachableNodes: []
        }
    ],
}


global.nodeWiseStore = {};
global.store = new Set([]);

function getUpdate(routerID) {
    var addr = routerID;
    const request = axios.get(`${addr}/getUpdate`);

    return request;
}

function getFaces(addr) {
    const request = axios.get(`${addr}/updateFaces`);
    console.log(`${addr}/updateFaces`);


    return request;
}

var bloomFilter = new BloomFilter();

const getHashes = (s) => {
    var res = bloomFilter.getHashes(s);
    var hashes = []
    for (i of res) {
        hashes.push(i.val);
    }

    return hashes;
}

function awaitAll(list, asyncFn) {
    const promises = [];

    list.forEach(x => {
        promises.push(asyncFn(x));
    });

    return Promise.all(promises);
}

function updateRepos(router) {
    return Promise.resolve(
        getUpdate(router.addr)
            .then(result => {
                var duplicates = [];
                for (var i of result.data.newList) {
                    if (global.store.has(i)) {
                        duplicates.push(i);
                    } else {
                        if (global.nodeWiseStore[result.data.routerID] == null) {
                            global.nodeWiseStore[result.data.routerID] = {};
                        }
                        global.nodeWiseStore[result.data.routerID][i] = getHashes(i);
                    }
                    global.store.add(i);
                }
                result.data.delList.map((i) => {
                    global.store.delete(i);
                })
            })
            .catch(err => {
                console.log(err);
            })
    );

}

function updateFaces(router) {
    return Promise.resolve(
        getFaces(router.addr)
            .then(result => {
                for (var face of result.data) {
                    var li = [face.localUri, face.remoteUri];

                    for (var i of Object.keys(global.nodeiFaceStore)) {
                        for (var j of global.nodeiFaceStore[i]) {
                            if (JSON.stringify(li)==JSON.stringify(j.addrs)) {
                                j.face = face.faceId;
                            }
                        }
                    }

                }
            })
            .catch(err => {
                console.log(err);
            })
    );
}


awaitAll(global.routers_, updateFaces)
    .then(() => {
       console.log(global.nodeiFaceStore); 
       awaitAll(global.routers_, updateRepos)
            .then(() => {
                console.log(global.nodeWiseStore);
            })
            .catch((err) => {
                console.log(err);
            })
    })
    .catch((err) => {
        console.log(err);
    });

