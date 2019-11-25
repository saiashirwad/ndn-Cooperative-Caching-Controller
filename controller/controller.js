var http = require('http');
const request = require('request');
const BloomFilter = require('./Release/bloom-filter-cpp.node').BloomFilter;
const axios = require('axios');


global.routers = [
    "http://localhost:8888",
    "http://localhost:8889",
    "http://localhost:8890",
    "http://localhost:8891"
]


global.routers_ = [
    {
        name: "a",

    }
]

global.nodeiFaceStore = {
    "a": {
        "e" : 
        {
            addrs: ["10.0.0.1", "10.0.0.2"],
            reachableNodes: []
        },
        "cl0" :
        {
            addrs: ["10.0.0.5", "10.0.0.6"],
            reachableNodes: []
        }
    },
    "b": {
        "e" : 
        {
            addrs: ["10.0.0.9", "10.0.0.10"],
            reachableNodes: []
        },
        "cl1" :
        {
            addrs: ["10.0.0.13", "10.0.0.14"],
            reachableNodes: []
        }
    },
    "c": {
        "e" : 
        {
            addrs: ["10.0.0.17", "10.0.0.18"],
            reachableNodes: []
        },
        "cl2" :
        {
            addrs: ["10.0.0.21", "10.0.0.22"],
            reachableNodes: []
        }
    },
    "d": {
        "e" : 
        {
            addrs: ["10.0.0.29", "10.0.0.30"],
            reachableNodes: []
        },
        "cl3" :
        {
            addrs: ["10.0.0.25", "10.0.0.26"],
            reachableNodes: []
        }
    },
    "e": {
        "a" : 
        {
            addrs: ["10.0.0.2", "10.0.0.1"],
            reachableNodes: []
        },
        "b" :
        {
            addrs: ["10.0.0.10", "10.0.0.9"],
            reachableNodes: []
        },
        "c" : 
        {
            addrs: ["10.0.0.18", "10.0.0.17"],
            reachableNodes: []
        },
        "d" :
        {
            addrs: ["10.0.0.30", "10.0.0.29"],
            reachableNodes: []
        }, 
        "f" :
        {
            addrs: ["10.0.0.33", "10.0.0.34"],
            reachableNodes: []
        }
    },
    "f": {
        "e" :
        {
            addrs: ["10.0.0.34", "10.0.0.33"],
            reachableNodes: []
        }
    },
    "cl0": {
        "a" :
        {
            addrs: ["10.0.0.5", "10.0.0.6"],
            reachableNodes: []
        }
    },
    "cl1": {
        "b" :
        {
            addrs: ["10.0.0.13", "10.0.0.14"],
            reachableNodes: []
        }
    },
    "cl2": {
        "c" :
        {
            addrs: ["10.0.0.21", "10.0.0.22"],
            reachableNodes: []
        }
    },
    "cl3": {
        "d" :
        {
            addrs: ["10.0.0.25", "10.0.0.26"],
            reachableNodes: []
        }
    }
}

global.store = new Set(["apple", "ball"]);
global.nodeWiseStore = {};

global.nodeFaceStore = {
    0: {
        0: [1, 2, 3],
    },
    1: {
        0: [0],
        1: [2],
        2: [3]
    },
    2: {
        0: [0, 1]
    },
    3: {
        0: [0, 1]
    }
}


function getUpdate(routerID) {
    var addr = routerID;
    const request = axios.get(`${addr}/getUpdate`);

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
        getUpdate(router)
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

function sendToRouter(router) {
    return Promise.resolve({

    })
}

awaitAll(global.routers, updateRepos)
    .then(() => {

        for(var node of global.nodeFaceStore) {
            
        }
    })
    .catch((err) => {
        console.log(err);
    });


