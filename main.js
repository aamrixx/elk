const TokenKind = {
    Iden: 'Iden',
    Num: 'Num',
    Add: '+',
    Sub: '-',
    Mul: '*',
    Div: '/'
};

function Token(kind, literal) {
    this.kind = kind;
    this.literal = literal;
}

class Lexer {
    constructor(line) {
        this.line = line;
        this.tokens = [];
        this.pos = 0;
    }

    #advance() {
        this.pos += 1;
    }
    
    #get_char() {
        return this.line[this.pos];
    }

    #lex_symbol(c) {
        if (typeof(c) != "string") {
            throw "lex_symbol expected a string";
        }

        switch (c) {
            case '+':
                return new Token(TokenKind.Add, "+");
            case '-':
                return new Token(TokenKind.Sub, "-");
            case '*':
                return new Token(TokenKind.Mul, "*");
            case '/':
                return new Token(TokenKind.Div, "/");
            default:
                return new Token(null, "");
        }
    }

    #lex_keyword(s) {
        if (typeof(s) != "string") {
            throw "lex_keyword expected a string";
        }

        switch (s) {
            case "":
                return new Token(null, "");
            default:
                if (!isNaN(s)) {
                    return new Token(TokenKind.Num, s);
                    
                }
                return new Token(TokenKind.Iden, s);
        }
    }

    lex() {
        while (this.pos < this.line.length) {
            let token = this.#lex_symbol(this.#get_char());

            if (token.kind != null) {
                this.tokens.push(token);
            } else {
                let buffer = "";

                while (this.pos < this.line.length && this.#get_char() != ' ') {
                    buffer += this.#get_char();
                    this.#advance();
                }

                let keyword = this.#lex_keyword(buffer);
                
                if (keyword.kind != null) {
                    this.tokens.push(keyword);
                }
            }

            this.#advance();
        }
    }
}

class Parser {
    constructor(tokens) {
        this.tokens = tokens;
    }

    parse() {
        switch (this.tokens[0]) {

        }
    }
}

function main() {
    let lexer = new Lexer("+ 2 2");
    lexer.lex();
    console.log(lexer.tokens);

    lexer = new Lexer("- 4 2");
    lexer.lex();
    console.log(lexer.tokens);

    lexer = new Lexer("* 2 2");
    lexer.lex();
    console.log(lexer.tokens);

    lexer = new Lexer("/ 6 12");
    lexer.lex();
    console.log(lexer.tokens);
}

main();