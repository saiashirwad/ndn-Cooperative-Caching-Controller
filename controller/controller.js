// var http = require('http');
// const request = require('request');
// const BloomFilter = require('./Release/bloom-filter-cpp.node').BloomFilter;
// const axios = require('axios');


const BloomFilter = require('/usr/lib/node_modules/bloom-filter-cpp.node').BloomFilter;
const axios = require('/usr/lib/node_modules/axios');

// global.routers = [
//     "http://localhost:8888",
//     "http://localhost:8889",
//     "http://localhost:8890",
//     "http://localhost:8891"
// ];


global.routers_ = [
    {
        name: "a",
        addr: "1.0.0.10:1234"
    },
    {
        name: "b",
        addr: "1.0.0.22:1234"
    },
    {
        name: "c",
        addr: "1.0.0.34:1234"
    },
    {
        name: "d",
        addr: "1.0.0.42:1234"
    },
    {
        name: "e",
        addr: "1.0.0.46:1234"
    },
    {
        name: "f",
        addr: "1.0.0.50:1234"
    }
];

function getRouterID(ip) {
    for (var router of global.routers_) {
        if (router.addr.split(":")[0] == ip) {
            return router.name;
        }
    }
}


function parseIp(str) {
    var r = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/; 
    t = str.match(r);
    return t[0];
}

global.nodeiFaceStore = {
    'a': [
        {
            to: 'e', 
            addrs: ["1.0.0.1", "1.0.0.2"],
            reachableNodes: ['f', 'b', 'c', 'd']
        },
        {
            to: 'cl0',
            addrs: ["1.0.0.5", "1.0.0.6"],
            reachableNodes: []
        }
    ],
    'b': [
        {
            to: 'e', 
            addrs: ["1.0.0.9", "1.0.0.10"],
            reachableNodes: ['f']
        },
        {
            to: 'cl1',
            addrs: ["1.0.0.13", "1.0.0.14"],
            reachableNodes: []
        }
    ],
    'c': [
        {
            to: 'e', 
            addrs: ["1.0.0.17", "1.0.0.18"],
            reachableNodes: ['f']
        },
        {
            to: 'cl2',
            addrs: ["1.0.0.21", "1.0.0.22"],
            reachableNodes: []
        }
    ],
    'd': [
        {
            to: 'e', 
            addrs: ["1.0.0.29", "1.0.0.30"],
            reachableNodes: ['f']
        },
        {
            to: 'cl3',
            addrs: ["1.0.0.25", "1.0.0.26"],
            reachableNodes: []
        }
    ],
    'e': [
        {
            to: 'a', 
            addrs: ["1.0.0.2", "1.0.0.1"],
            reachableNodes: ['f']
        },
        {
            to: 'b',
            addrs: ["1.0.0.10", "1.0.0.9"],
            reachableNodes: []
        },
        {
            to: 'c', 
            addrs: ["1.0.0.18", "1.0.0.17"],
            reachableNodes: []
        },
        {
            to: 'd',
            addrs: ["1.0.0.30", "1.0.0.29"],
            reachableNodes: []
        }
    ],
    'f': [
        {
            to: 'e',
            addrs: ["1.0.0.34", "1.0.0.33"],
            reachableNodes: []
        }
    ]
}


global.nodeWiseStore = {};
global.store = new Set([]);

function getUpdate(routerID) {
    var addr = routerID;
    const request = axios.get(`http://${addr}/getUpdates`);

    return request;
}

function getFaces(addr) {
    const request = axios.get(`http://${addr}/updateFaces`);
    // console.log(`${addr}/updateFaces`);


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

function combineBloomFilters() {

}




function updateRepos(router) {
    console.log("sup");
    return Promise.resolve(
        getUpdate(router.addr)
            .then(result => {
                var duplicates = [];
                result.data['routerId'] = parseIp(result.config.url);
                for (var i of result.data["newList"]) {
                    if (global.store.has(i)) {
                        duplicates.push(i);
                    } else {
                        if (global.nodeWiseStore[getRouterID(result.data["routerId"])] == null) {
                            global.nodeWiseStore[getRouterID(result.data["routerId"])] = {};
                        }
                        global.nodeWiseStore[getRouterID(result.data["routerId"])][i] = getHashes(i);
                    }
                    global.store.add(i);
                }
                if (result.data.delList != null)
                {
                    for(var i of result.data.delList) {
                        global.store.delete(i);
                    }
                }
               
                return result;
            })
            .then((result) => {
                // console.log(result.data);
                var nodeID = getRouterID(result.data["routerId"]);
                // // for (var reachableNode of global.n)

                combined = new Set([]);
                // console.log(nodeID);
                for (var i of global.nodeiFaceStore[nodeID]) {
                    for (reachableNode of i.reachableNodes) {
                        console.log(reachableNode);
                        // console.log(Object.keys(global.nodeWiseStore[reachableNode]));
                        if (global.nodeWiseStore[reachableNode] != null) {
                            for(var prefix in global.nodeWiseStore[reachableNode]) {
                                for (var pos of global.nodeWiseStore[reachableNode][prefix]) {
                                    // console.log(pos);
                                    combined.add(pos);
                                }
                            }
                        }
                    }
                }

                var arr = Array.from(combined);
                arr = arr.sort();

                // var arr = Array.from(combined);
                // arr.sort();
                // // console.log(arr);

                if (arr != null) {
                    var bf = '';
                    // console.log("sup");
                    for (var i = 0; i < 500000; i++) {
                        // bf.concat(arr.includes(i) ? '1' : '0');
                        // console.log(arr.includes(i));
                        if (arr.includes(i))
                            bf = bf.concat('1');
                        else
                            bf = bf.concat('0');
                        // arr.includes(i);
                        
                    }
                    console.log(bf); 
                }

                // // const request = axios.post(`{nodeID}/updateBlooms`, {

                // // });
                // return request;
                // // console.log(global.store);

            })
            .then((request) => {
                // console.log(request);
            })
            .catch(err => {
                // console.log(result.data);
                console.log(err);
            })
    );

}

function updateFaces(router) {
    return Promise.resolve(
        getFaces(router.addr)
            .then(result => {
                for (var face of result.data) {;
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



// awaitAll(global.routers_, updateFaces)
//     .then(() => {
//     //    console.log(global.nodeiFaceStore); 
//        awaitAll(global.routers_, updateRepos)
//             .then(() => {
//                 // console.log(global.nodeWiseStore);
//                 console.log(nodeiFaceStore);
//             })
//             .catch((err) => {
//                 console.log(err);
//             })
//     })
//     .catch((err) => {
//         console.log(err);
//     });

awaitAll(global.routers_, updateRepos)
    .then( () => {
        // console.log(global.nodeiFaceStore);
        // console.log(global.nodeWiseStore['a']);
    })
    .catch( (err) => {
        console.log(err);
    });