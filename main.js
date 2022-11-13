const TokenKind = {
    Iden: 'Iden',
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

    advance() {

    }
    
    get_char() {
        return this.line[this.pos];
    }

    lex() {

    }
}

function main() {

}