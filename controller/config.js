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


li = ["10.0.0.1", "10.0.0.2"]

for (var i of Object.keys(global.nodeiFaceStore)) {
    for (var j of global.nodeiFaceStore[i]) {
        if (JSON.stringify(li)==JSON.stringify(j.addrs)) {
            j.face = 231;
        }
        console.log(j);
    }
}




