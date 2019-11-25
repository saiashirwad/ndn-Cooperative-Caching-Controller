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
    // var r = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/; 
    var r = /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/g;
    // var r = /(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?/;
    t = str.match(r);
    console.log(t);
    return t[0];
}

function ValidateIPaddress(ipaddress) {  
    if (/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ipaddress)) {  
      return (true)  
    }  
    alert("You have entered an invalid IP address!")  
    return (false)  
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
    var addr_ = "http://" + addr + "/facemap";
    // console.log(addr_);
    const request = axios.get(addr_);
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

                // arr.sort();

                // console.log(result.data["routerId"]);
                var a = "http://" + result.data["routerId"] + ":1234/updateBlooms";
                console.log(a);


                const request = axios.post(a, arr)
                    .then(() => {

                    })
                    .catch(err => {

                    });
                // return request;
                // // console.log(global.store);

            })
            .then((request) => {
                // console.log(request);
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
                for (var item of result.data) {
                    // var li = [face.localUri, face.remoteUri];
                    // console.log(face);

                    var face_ = item[0];
                    var localUri = item[1];
                    var remoteUri = item[2];
                    // console.log(face_);

                    // console.log(parseIp(localUri));
                    // parseIp(localUri);

                    // console.log(localUri);
                    if (localUri.split("udp4://").length == 2) {
                        var a = localUri.split("udp4://")[1];
                        // console.log(a.split(":"));
                        localUri = a.split(":")[0];
                    }
                    else
                        continue;


                    // console.log(localUri);

                    if (remoteUri.split("udp4://").length == 2) {
                        var a = remoteUri.split("udp4://")[1];
                        remoteUri = a.split(":")[0];
                    }
                    else
                        continue;
                    
                    // console.log(remoteUri);


                    if (localUri[0] != 1) 
                        continue;

                    if (remoteUri[0] != 1)
                        continue;

                    var li = [localUri, remoteUri];

                    // console.log(face_, localUri, remoteUri);


                    for (var i of Object.keys(global.nodeiFaceStore)) {
                        for (var j of global.nodeiFaceStore[i]) {
                            if (JSON.stringify(li)==JSON.stringify(j.addrs)) {
                                console.log("here");
                                console.log(j);
                                j.face = face_;
                                // j["face"] =
                            }
                        }
                    }

                }

            })
            .catch(err => {
                // console.log(err);
            })
    );
}



awaitAll(global.routers_, updateFaces)
    .then(() => {
       console.log(global.nodeiFaceStore); 
    //    awaitAll(global.routers_, updateRepos)
    //         .then(() => {
    //             // console.log(global.nodeWiseStore);
    //             console.log(nodeiFaceStore);
    //         })
    //         .catch((err) => {
    //             console.log(err);
    //         })
    })
    .catch((err) => {
        console.log(err);
    });

// awaitAll(global.routers_, updateRepos)
//     .then( () => {
//         // console.log(global.nodeiFaceStore);
//         // console.log(JSON.stringify(global.nodeiFaceStore));
//         // console.log(global.nodeWiseStore['a']);
//     })
//     .catch( (err) => {
//         console.log(err);
//     });