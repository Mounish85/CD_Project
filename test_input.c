#include <stdio.h>

// This is a single-line comment.
/* This is a 
   multi-line comment. */

int main() {
    int a = 10;
    float b = 20.5;
    char c = 'A';
    char *str = "Hello Lexical Analyzer";

    if (a < b && a != 0) {
        a = a + 5;
        b = b * 2;
    } else {
        a--;
    }

    return 0;
}
