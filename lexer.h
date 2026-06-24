#ifndef LEXER_H
#define LEXER_H

typedef enum {
    TOKEN_EOF = 0,
    TOKEN_KEYWORD,
    TOKEN_IDENTIFIER,
    TOKEN_OPERATOR,
    TOKEN_CONSTANT_INT,
    TOKEN_CONSTANT_FLOAT,
    TOKEN_CONSTANT_CHAR,
    TOKEN_CONSTANT_STRING,
    TOKEN_PUNCTUATION,
    TOKEN_COMMENT,
    TOKEN_ERROR
} TokenType;

#define MAX_SYMBOL_TABLE_SIZE 1000

typedef struct {
    char name[256];
    char type[64];
    int first_line;
    int count;
} SymbolEntry;

// Symbol Table functions
void init_symbol_table();
int insert_symbol(const char *name, const char *type, int line);
void print_symbol_table();

// Token Counters
extern int count_keywords;
extern int count_identifiers;
extern int count_operators;
extern int count_constants;
extern int count_punctuation;
extern int count_comments;
extern int count_errors;
extern int total_tokens;

#endif // LEXER_H
