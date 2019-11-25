#include "BloomFilter.h"
#include <iostream>


using namespace std;

int main()
{
    BloomFilter b;
    b.add("sai");

    cout << (b.exists("sai") ? "true" : "false") << endl;

    return 0;
}
