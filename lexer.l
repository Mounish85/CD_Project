%{
#include "lexer.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// Global counts
int count_keywords = 0;
int count_identifiers = 0;
int count_operators = 0;
int count_constants = 0;
int count_punctuation = 0;
int count_comments = 0;
int count_errors = 0;
int total_tokens = 0;

%}

%option noyywrap
%option yylineno

/* Regular Expression Definitions */
DIGIT           [0-9]
HEXDIGIT        [0-9a-fA-F]
LETTER          [a-zA-Z_]
IDENTIFIER      {LETTER}({LETTER}|{DIGIT})*
INT_CONST       {DIGIT}+|0[xX]{HEXDIGIT}+
FLOAT_CONST     {DIGIT}+\.{DIGIT}+([eE][+-]?{DIGIT}+)?|{DIGIT}+[eE][+-]?{DIGIT}+
CHAR_CONST      '([^'\\\n]|\\.)'
STRING_CONST    \"([^\"\\\n]|\\.)*\"
SINGLE_COMMENT  \/\/.*
MULTI_COMMENT   \/\*([^*]|\*+[^*/])*\*+\/
OPERATOR        "++"|"--"|"+="|"-="|"*="|"/="|"%="|"=="|"!="|"<="|">="|"&&"|"||"|"<<"|">>"|"+"|"-"|"*"|"/"|"%"|"="|"<"|">"|"!"|"&"|"|"|"^"|"~"
PUNCTUATION     ";"|","|"{"|"}"|"("|")"|"["|"]"
WHITESPACE      [ \t\r\n]+

%%

{WHITESPACE}      { /* Ignore whitespaces */ }

{SINGLE_COMMENT}  { count_comments++; return TOKEN_COMMENT; }
{MULTI_COMMENT}   { count_comments++; return TOKEN_COMMENT; }

"int"|"float"|"char"|"double"|"if"|"else"|"while"|"for"|"return"|"void"|"switch"|"case"|"break"|"continue"|"struct"|"class"|"const"|"static"|"sizeof"|"typedef" {
    count_keywords++;
    total_tokens++;
    return TOKEN_KEYWORD;
}

{IDENTIFIER}      {
    count_identifiers++;
    total_tokens++;
    insert_symbol(yytext, "Identifier", yylineno);
    return TOKEN_IDENTIFIER;
}

{OPERATOR}        {
    count_operators++;
    total_tokens++;
    return TOKEN_OPERATOR;
}

{INT_CONST}       {
    count_constants++;
    total_tokens++;
    return TOKEN_CONSTANT_INT;
}

{FLOAT_CONST}     {
    count_constants++;
    total_tokens++;
    return TOKEN_CONSTANT_FLOAT;
}

{CHAR_CONST}      {
    count_constants++;
    total_tokens++;
    return TOKEN_CONSTANT_CHAR;
}

{STRING_CONST}    {
    count_constants++;
    total_tokens++;
    return TOKEN_CONSTANT_STRING;
}

{PUNCTUATION}     {
    count_punctuation++;
    total_tokens++;
    return TOKEN_PUNCTUATION;
}

.                 {
    count_errors++;
    return TOKEN_ERROR;
}

%%
