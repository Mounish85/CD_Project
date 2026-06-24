#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "lexer.h"

// Symbol Table Definition
SymbolEntry symbol_table[MAX_SYMBOL_TABLE_SIZE];
int symbol_count = 0;

void init_symbol_table() {
    symbol_count = 0;
}

int insert_symbol(const char *name, const char *type, int line) {
    // Check if symbol already exists
    for (int i = 0; i < symbol_count; i++) {
        if (strcmp(symbol_table[i].name, name) == 0) {
            symbol_table[i].count++;
            return i; // Return existing index
        }
    }
    
    // Check for overflow
    if (symbol_count >= MAX_SYMBOL_TABLE_SIZE) {
        fprintf(stderr, "Error: Symbol Table is full!\n");
        return -1;
    }
    
    // Insert new symbol
    strncpy(symbol_table[symbol_count].name, name, sizeof(symbol_table[symbol_count].name) - 1);
    symbol_table[symbol_count].name[sizeof(symbol_table[symbol_count].name) - 1] = '\0';
    
    strncpy(symbol_table[symbol_count].type, type, sizeof(symbol_table[symbol_count].type) - 1);
    symbol_table[symbol_count].type[sizeof(symbol_table[symbol_count].type) - 1] = '\0';
    
    symbol_table[symbol_count].first_line = line;
    symbol_table[symbol_count].count = 1;
    
    symbol_count++;
    return symbol_count - 1;
}

void print_symbol_table() {
    printf("\n===========================================================\n");
    printf("                       SYMBOL TABLE\n");
    printf("===========================================================\n");
    printf("%-5s | %-25s | %-12s | %-10s\n", "S.No", "Identifier Name", "First Line", "Frequency");
    printf("-----------------------------------------------------------\n");
    for (int i = 0; i < symbol_count; i++) {
        printf("%-5d | %-25s | %-12d | %-10d\n", i + 1, symbol_table[i].name, symbol_table[i].first_line, symbol_table[i].count);
    }
    printf("===========================================================\n");
}

// Declarations of Flex items
extern FILE *yyin;
extern int yylex();
extern char *yytext;
extern int yylineno;

int main(int argc, char *argv[]) {
    if (argc > 1) {
        FILE *file = fopen(argv[1], "r");
        if (!file) {
            perror("Error opening file");
            return 1;
        }
        yyin = file;
    } else {
        printf("Reading from standard input (Press Ctrl+D/Ctrl+Z then Enter to stop)...\n");
        yyin = stdin;
    }

    init_symbol_table();

    printf("\n%-10s | %-25s | %-20s\n", "Line No.", "Token Text", "Token Category");
    printf("-----------------------------------------------------------\n");

    int token;
    while ((token = yylex()) != TOKEN_EOF) {
        const char *category = "UNKNOWN";
        switch (token) {
            case TOKEN_KEYWORD: category = "KEYWORD"; break;
            case TOKEN_IDENTIFIER: category = "IDENTIFIER"; break;
            case TOKEN_OPERATOR: category = "OPERATOR"; break;
            case TOKEN_CONSTANT_INT: category = "INT CONSTANT"; break;
            case TOKEN_CONSTANT_FLOAT: category = "FLOAT CONSTANT"; break;
            case TOKEN_CONSTANT_CHAR: category = "CHAR CONSTANT"; break;
            case TOKEN_CONSTANT_STRING: category = "STRING CONSTANT"; break;
            case TOKEN_PUNCTUATION: category = "PUNCTUATION"; break;
            case TOKEN_COMMENT: category = "COMMENT (Stripped)"; break;
            case TOKEN_ERROR: category = "ERROR (Invalid)"; break;
        }

        if (token == TOKEN_COMMENT) {
            printf("%-10d | %-25s | %-20s\n", yylineno, "/* COMMENT */", category);
        } else if (token == TOKEN_ERROR) {
            printf("%-10d | %-25s | %-20s\n", yylineno, yytext, category);
        } else {
            printf("%-10d | %-25s | %-20s\n", yylineno, yytext, category);
        }
    }

    if (argc > 1) {
        fclose(yyin);
    }

    // Print Lexical Summary
    printf("\n===========================================================\n");
    printf("                  LEXICAL ANALYSIS SUMMARY\n");
    printf("===========================================================\n");
    printf(" Keywords:                  %d\n", count_keywords);
    printf(" Identifiers:               %d\n", count_identifiers);
    printf(" Operators:                 %d\n", count_operators);
    printf(" Constants:                 %d\n", count_constants);
    printf(" Punctuation:               %d\n", count_punctuation);
    printf(" Comments (Stripped):       %d\n", count_comments);
    printf(" Errors:                    %d\n", count_errors);
    printf("-----------------------------------------------------------\n");
    printf(" Total Tokens:              %d\n", total_tokens);
    printf("===========================================================\n");

    // Print Symbol Table
    print_symbol_table();

    return 0;
}
