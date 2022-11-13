const fs = require("fs");

const TokenKind = {
    Iden: "Iden",
    Num: "Num",

    Define: "Define",

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
            case "define":
                return new Token(TokenKind.Define, "define");
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

    #parse_math() {
        if (this.tokens.length !== 3) {
            throw "Invalid maths expression";
        }

        if (this.tokens[1].kind !== TokenKind.Num ||
            this.tokens[2].kind !== TokenKind.Num) {
            throw "Invalid number in maths expression";
        }
    }

    #parse_define() {

    }

    parse() {
        switch (this.tokens[0].kind) {
            case TokenKind.Define:
                this.#parse_define();
                break;
            case TokenKind.Add:
            case TokenKind.Sub:
            case TokenKind.Mul:
            case TokenKind.Div:
                this.#parse_math();    
                break; 
        }
    }
}

class Interpreter {
    constructor(tokens) {
        this.tokens = tokens;
    }

    interpret() {
        switch (this.tokens[0].kind) {
            case TokenKind.Add:
                console.log(+this.tokens[1].literal + +this.tokens[2].literal);
                break;
            case TokenKind.Sub:
                console.log(+this.tokens[1].literal - +this.tokens[2].literal);
                break;
            case TokenKind.Mul:
                console.log(+this.tokens[1].literal * +this.tokens[2].literal);
                break;
            case TokenKind.Div:
                console.log(+this.tokens[1].literal / +this.tokens[2].literal);
                break;
        }
    }
}

function main() {
    const args = process.argv;

    if (args.length != 3) {
        throw "usage : [js runtime] main.js [elk file]";
    }

    const allContents = fs.readFileSync(args[2], "utf-8");
    allContents.split(/\r?\n/).forEach((line) => {
        let lexer = new Lexer(line);
        lexer.lex();
        console.log(lexer.tokens);

        let parser = new Parser(lexer.tokens);
        parser.parse();

        let interpreter = new Interpreter(parser.tokens);
        interpreter.interpret();
    });
}

main();