CC = gcc
LEX = flex
TARGET = lexer

all: $(TARGET)

$(TARGET): lex.yy.c main.c lexer.h
	$(CC) -o $(TARGET) lex.yy.c main.c

lex.yy.c: lexer.l lexer.h
	$(LEX) lexer.l

clean:
	rm -f $(TARGET) lex.yy.c
