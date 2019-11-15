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

awaitAll(global.routers, updateRepos)
    .then(() => {
        console.log(global.nodeWiseStore);

        console.log(global.store);
    })
    .catch((err) => {
        console.log(err);
    });


