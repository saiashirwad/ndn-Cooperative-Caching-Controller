#include <math.h>
#include <vector>
#include <string.h>

#if !defined(nullptr) && !defined(_MSC_VER)
#define nullptr 0
#endif

#include <stdint.h>


typedef uint64_t uint64Array[30];
static int precomputedArraySize = sizeof(uint64Array) / sizeof(uint64_t);

inline uint64_t customPow(uint64Array *precomputedPowers, bool usePrecomputed,
    uint64_t base, int exp) {
  if (usePrecomputed && exp < precomputedArraySize) {
    return (*precomputedPowers)[exp];
  }

  // TOOD: Optimization possible here when passed in toSize which is bigger
  // than precomputedArraySize, we can start from the value of the last
  // precomputed value.
  uint64_t result = 1;
  while (exp) {
    if (exp & 1)
      result *= base;
    exp >>= 1;
    base *= base;
  }
  return result;
}


// Functor for a hashing function
// Implements a Rabin fingerprint hash function
class HashFn {
 public:
  // Initialize a HashFn with the prime p which is used as the base of the Rabin
  // fingerprint algorithm
  explicit HashFn(int p, bool precompute = true) {
    this->p = p;
    this->precompute = precompute;
    if (precompute) {
      uint64_t result = 1;
      for (int i = 0; i < precomputedArraySize; i++) {
        precomputedPowers[i] = result;
        result *= p;
      }
    }
  }

  virtual uint64_t operator()(const char *input, int len,
      unsigned char lastCharCode, uint64_t lastHash);

  virtual uint64_t operator()(const char *input, int len);

 private:
  int p;
  bool precompute;
  uint64Array precomputedPowers;
};




uint64_t HashFn::operator()(const char *input, int len,
      unsigned char lastCharCode, uint64_t lastHash) {
    // See the abracadabra example:
    // https://en.wikipedia.org/wiki/Rabin%E2%80%93Karp_algorithm
    return (lastHash - lastCharCode *
      customPow(&precomputedPowers, precompute, p, len - 1)) *
      p + input[len - 1];
  }

uint64_t HashFn::operator()(const char *input, int len) {
    uint64_t total = 0;
    for (int i = 0; i < len; i++) {
      total += input[i] *
        customPow(&precomputedPowers, precompute, p, len - i - 1);
    }
    return total;
  }









static HashFn h1(13);
static HashFn h2(17);
static HashFn h3(31);
static HashFn h4(41);
static HashFn h5(53);
static HashFn defaultHashFns[5] = {h1, h2, h3, h4, h5};


/**
 * Implements a Bloom Filter using Rabin Karp for char* buffer lookups
 */
class BloomFilter {
 public:
    BloomFilter(unsigned int bitsPerElement = 10,
        unsigned int estimatedNumElements = 50000,
        HashFn hashFns[] = defaultHashFns,
        int numHashFns = sizeof(defaultHashFns)/sizeof(defaultHashFns[0]));
    BloomFilter(const char *buffer, int byteBufferSize,
        HashFn hashFns[] = defaultHashFns,
        int numHashFns = sizeof(defaultHashFns)/sizeof(defaultHashFns[0]));
    virtual ~BloomFilter();
    // Sets the specified bit in the buffer
    void setBit(unsigned int bitLocation);
    // Checks if the specified bit is set in the buffer
    bool isBitSet(unsigned int bitLocation);
    // Adds the specified buffer to the bloom filter
    void add(const char *input, int len);
    void add(const char *sz);
    // Empty the Bloom Filter
    void clear();
    std::vector<int> getHashes(const char* s);

    /**
     * Checks whether an element probably exists in the set, or definitely
     * doesn't.
     * @param sz Either a string to check for existance or an array of the
     *   string's char codes. The main reason why you'd want to pass in a char
     *   code array is because passing a string will use JS directly to get
     *   the char codes which is very inneficient compared to calling into C++
     *   code to get it and then making the call.
     *
     * Returns true if the element probably exists in the set
     * Returns false if the element definitely does not exist in the set
     */
    bool exists(const char *input, int len);
    bool exists(const char *sz);

    /**
     * Checks if any substring of length substringLength probably exists or
     * definitely doesn't. If false is returned then no substring of the
     * specified string of the specified length is in the bloom filter
     *
     * @param data The substring or char array to check substrings on.
     */
    bool substringExists(const char *data, int dataLen, int substringLength);
    bool substringExists(const char *sz, int substringLength);

    /**
     * Obtains the buffer used as the bloom filter data
     */
    const char * getBuffer() {
      return buffer;
    }

    /**
     * Obtains the Bloom Filter's buffer size in bytes
     */
    int getByteBufferSize() {
      return byteBufferSize;
    }

 private:
  HashFn *hashFns;
  uint64_t *lastHashes;
  int numHashFns;
  unsigned int byteBufferSize;
  unsigned int bitBufferSize;
  char *buffer;

  /**
   * Obtains the hashes for the specified charCodes
   * See "Rabin fingerprint" in
   * https://en.wikipedia.org/wiki/Rabin%E2%80%93Karp_algorithm
   * for more information.
   *
   * @param charCodes An array of the char codes to use for the hash
   * @param lastHashes Input and output for the last hash value
   * function for a faster computation.  Must be called with lastCharCode but
   * can be nullptr otherwise.
   *
   * @param newHashses fills in the corresponding new hashes, can be the same
   *  as lastHashes
   * @param lastCharCode if specified, it will pass the last char code
   *  to the hashing function for a faster computation. Must be called
   *  with lastHashes.
   */
  void getHashesForCharCodes(const char *input, int inputLen,
      uint64_t *lastHashes, uint64_t *newHashes, unsigned char lastCharCode);
};













BloomFilter::BloomFilter(unsigned int bitsPerElement,
    unsigned int estimatedNumElements, HashFn *hashFns, int numHashFns) :
    hashFns(nullptr), numHashFns(0), byteBufferSize(0), buffer(nullptr) {
  this->hashFns = hashFns;
  this->numHashFns = numHashFns;
  lastHashes = new uint64_t[numHashFns];
  byteBufferSize = bitsPerElement * estimatedNumElements / 8 + 1;
  bitBufferSize = byteBufferSize * 8;
  buffer = new char[byteBufferSize];
  memset(buffer, 0, byteBufferSize);
}

// Constructs a BloomFilter by copying the specified buffer and number of bytes
BloomFilter::BloomFilter(const char *buffer, int byteBufferSize,
    HashFn *hashFns, int numHashFns) :
    hashFns(nullptr), numHashFns(0), byteBufferSize(0), buffer(nullptr) {
  this->hashFns = hashFns;
  this->numHashFns = numHashFns;
  lastHashes = new uint64_t[numHashFns];
  this->byteBufferSize = byteBufferSize;
  bitBufferSize = byteBufferSize * 8;
  this->buffer = new char[byteBufferSize];
  memcpy(this->buffer, buffer, byteBufferSize);
}

BloomFilter::~BloomFilter() {
  if (buffer) {
    delete[] buffer;
  }
  if (lastHashes) {
    delete[] lastHashes;
  }
}

void BloomFilter::setBit(unsigned int bitLocation) {
  buffer[bitLocation / 8] |= 1 << bitLocation % 8;
}

bool BloomFilter::isBitSet(unsigned int bitLocation) {
  return !!(buffer[bitLocation / 8] & 1 << bitLocation % 8);
}

void BloomFilter::add(const char *input, int len) {
  for (int j = 0; j < numHashFns; j++) {
    setBit(hashFns[j](input, len) % bitBufferSize);
  }
}

// int* BloomFilter::getHashes(const char* s) {
//   int arr[numHashFns];
//   int len = static_cast<int>(strlen(s));

//   for (int i = 0; i < numHashFns; i++) {
//     arr[i] = hashFns[i](s, len) % bitBufferSize;
//   }

//   return arr;
// }

std::vector<int> BloomFilter::getHashes(const char* s) {
  std::vector<int> v;
  int len = static_cast<int>(strlen(s));

  for (int i = 0; i < numHashFns; i++) {
    v.push_back(hashFns[i](s, len) % bitBufferSize);
  }

  return v;
}

void BloomFilter::add(const char *sz) {
  add(sz, static_cast<int>(strlen(sz)));
}

bool BloomFilter::exists(const char *input, int len) {
  bool allSet = true;
  for (int j = 0; j < numHashFns; j++) {
    allSet = allSet && isBitSet(hashFns[j](input, len) % bitBufferSize);
  }
  return allSet;
}

bool BloomFilter::exists(const char *sz) {
  return exists(sz, static_cast<int>(strlen(sz)));
}

void BloomFilter::getHashesForCharCodes(const char *input, int inputLen,
    uint64_t *lastHashes, uint64_t *newHashes, unsigned char lastCharCode) {
  for (int i = 0; i < numHashFns; i++) {
    if (lastHashes) {
      *(newHashes + i) = hashFns[i](input, inputLen,
          lastCharCode, *(lastHashes+i));
    } else {
      *(newHashes + i) = hashFns[i](input, inputLen);
    }
  }
}

bool BloomFilter::substringExists(const char *data, int dataLen,
    int substringLength) {
  unsigned char lastCharCode = 0;
  for (int i = 0; i < dataLen - substringLength + 1; i++) {
    getHashesForCharCodes(data + i, substringLength, i == 0
        ? nullptr : lastHashes, lastHashes, lastCharCode);
    bool allSet = true;
    for (int j = 0; j < numHashFns; j++) {
      allSet = allSet && isBitSet(lastHashes[j] % bitBufferSize);
    }
    if (allSet) {
      return true;
    }
    lastCharCode = data[i];
  }
  return false;
}

bool BloomFilter::substringExists(const char *data, int substringLength) {
  return substringExists(data, static_cast<int>(strlen(data)), substringLength);
}

void BloomFilter::clear() {
  memset(buffer, 0, byteBufferSize);
}