const BloomFilter = require('./build/Release/bloom-filter-cpp.node').BloomFilter;
// console.log(bloomfilter)

// module.exports = bloomfilter;
var b1 = new BloomFilter(); 
// b1.dummy('hello')
// b1.add2('hello')
b1.add("whats up there in fucksville")
// console.log(b1.dummy());
console.log(b1.exists('hello'))
console.log(b1.exists('hello2'))
console.log(b1);
console.log(b1.getHashes());