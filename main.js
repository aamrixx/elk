function error(string) {
    document.getElementById("console").value = `ERROR : ${string}`;
}

const TokenKind = {
    Iden: "Iden",
    Num: "Num",
    True: "True",
    False: "False",
    String: "String",
    Nil: "Nil",

    Define: "Define",
    If: "If",
    Then: "Then",
    And: "And",
    Or: "Or",

    Print: "Print",

    AddEq: "+=",
    Add: '+',
    SubEq: "-=",
    Sub: '-',
    MulEq: "*=",
    Mul: '*',
    DivEq: "/=",
    Div: '/',

    Eq: '=',
    Not: '!',
    NotEq: "!=",
    Gt: '>',
    Lt: '<',
    GtEq: ">=",
    LtEq: "<="
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

    #get_next_char() {
        return this.line[this.pos + 1];
    }

    #lex_symbol(c) {
        if (typeof(c) != "string") {
            console.error("lex_symbol expected a string");
        }

        switch (c) {
            case '+':
                if (this.#get_next_char() == '=') {
                    this.#advance();
                    return new Token(TokenKind.AddEq, "+=");
                } else {
                    return new Token(TokenKind.Add, "+");
                }
            case '-':
                if (this.#get_next_char() == '=') {
                    this.#advance();
                    return new Token(TokenKind.SubEq, "-=");
                } else {
                    return new Token(TokenKind.Sub, "-");
                }
            case '*':
                if (this.#get_next_char() == '=') {
                    this.#advance();
                    return new Token(TokenKind.MulEq, "*=");
                } else {
                    return new Token(TokenKind.Mul, "*");
                }
            case '/':
                if (this.#get_next_char() == '=') {
                    this.#advance();
                    return new Token(TokenKind.DivEq, "/=");
                } else {
                    return new Token(TokenKind.Div, "/");
                }

            case '\'':
                let buffer = "";
                this.#advance();

                while (this.pos < this.line.length && this.#get_char() != '\'') {
                    buffer += this.#get_char();
                    this.#advance();
                }

                return new Token(TokenKind.String, buffer);

            case '=':
                return new Token(TokenKind.Eq, "=");
            case '!':
                if (this.#get_next_char() == '=') {
                    this.#advance();
                    return new Token(TokenKind.NotEq, "!=");
                } else {
                    return new Token(TokenKind.Not, "!");
                }
            case '>':
                if (this.#get_next_char() == '=') {
                    this.#advance();
                    return new Token(TokenKind.GtEq, ">=");
                } else {
                    return new Token(TokenKind.Gt, ">");
                }
            case '<':
                if (this.#get_next_char() == '=') {
                    this.#advance();
                    return new Token(TokenKind.LtEq, "<=");
                } else {
                    return new Token(TokenKind.Lt, "<");
                }

            default:
                return new Token(null, "");
        }
    }

    #lex_keyword(s) {
        if (typeof(s) != "string") {
            console.error("lex_keyword expected a string");
        }

        switch (s) {
            case "":
                return new Token(null, "");
            case "TRUE":
                return new Token(TokenKind.True, "TRUE");
            case "FALSE":
                return new Token(TokenKind.True, "FALSE");
            case "NIL":
                return new Token(TokenKind.Nil, "NIL");
            case "define":
                return new Token(TokenKind.Define, "define");
            case "print":
                return new Token(TokenKind.Print, "print");
            /*case "if":
                return new Token(TokenKind.If, "if");
            case "then":
                return new Token(TokenKind.Then, "then")
            case "and":
                return new Token(TokenKind.And, "and");
            case "or":
                return new Token(TokenKind.Or, "or");*/
            default:
                if (!isNaN(s)) {
                    return new Token(TokenKind.Num, s);
                    
                }
                return new Token(TokenKind.Iden, s);
        }
    }

    lex() {
        while (this.pos < this.line.length) {
            if (this.#get_char() == '#') {
                break;
            }

            let token = this.#lex_symbol(this.#get_char());

            if (this.#get_char() == '-' && !isNaN(this.#get_next_char())) {
                let buffer = "";

                while (this.pos < this.line.length && this.#get_char() != ' ') {
                    buffer += this.#get_char();
                    this.#advance();
                }

                let keyword = this.#lex_keyword(buffer);
                
                if (keyword.kind != null) {
                    this.tokens.push(keyword);
                }
            } else if (token.kind != null) {
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

function Variable(type, data) {
    this.type = type;
    this.data = data;
}
let GlobalVarMap = new Map();

class Parser {
    constructor(tokens) {
        this.tokens = tokens;
    }

    #parse_math() {
        if (this.tokens.length != 3) {
            error("Invalid maths expression");
        }

        if (this.tokens[1].kind != TokenKind.Num ||
            this.tokens[2].kind != TokenKind.Num 
        ) {
            if (this.tokens[1].kind != TokenKind.Iden &&
                this.tokens[2].kind != TokenKind.Iden
            ) {
                error("Invalid number/identifer in maths expression");
            }
        }

        if (this.tokens[1].kind == TokenKind.Iden) {
            const variable = GlobalVarMap.get(this.tokens[1].literal);

            if (variable == null) {
                error(`Undefined variable '${this.tokens[1].literal}'`);
            }

            if (variable.type != TokenKind.Num) {
                error(`Mistmatched types '${variable.type}' and '${this.tokens[2].kind}'`);
            }

            this.tokens[1] = new Token(variable.type, variable.data);
        }

        if (this.tokens[2].kind == TokenKind.Iden) {
            const variable = GlobalVarMap.get(this.tokens[2].literal);

            if (variable == null) {
                error(`Undefined variable '${this.tokens[2].literal}'`);
            }

            if (variable.type != TokenKind.Num) {
                error(`Mistmatched types '${variable.type}' and '${this.tokens[1].kind}'`);
            }

            this.tokens[2] = new Token(variable.type, variable.data);
        }
    }

    #parse_math_eq() {
        if (this.tokens.length != 3) {
            error("Invalid maths assignment expression");
        }

        if (this.tokens[1].kind != TokenKind.Iden ||
            this.tokens[2].kind != TokenKind.Num 
        ) {
            if (this.tokens[2].kind != TokenKind.Iden) {
                error("Invalid number/identifer in maths assignment expression");
            }
        }

        if (this.tokens[1].kind == TokenKind.Iden && 
            this.tokens[2].kind == TokenKind.Num
        ) {
            const variable = GlobalVarMap.get(this.tokens[1].literal);
        
            if (variable == null) {
                error(`Undefined variable '${this.tokens[1].literal}'`);
            }

            if (variable.type != this.tokens[2].kind) {
                error(`Mistmatched types '${variable.type}' and '${this.tokens[2].kind}'`);
            }
        } else if (this.tokens[1].kind == TokenKind.Iden && 
                   this.tokens[2].kind == TokenKind.Iden
        ) {
            const variable0 = GlobalVarMap.get(this.tokens[1].literal);
            const variable1 = GlobalVarMap.get(this.tokens[2].literal);

            if (variable0 == null) {
                error(`Undefined variable '${this.tokens[1].literal}'`);
            }

            if (variable1 == null) {
                error(`Undefined variable '${this.tokens[2].literal}'`);
            }

            if (variable0.type != variable1.type) {
                error(`Mistmatched types '${variable0.type}' and '${variable1.type}'`);
            }
        } else {
            error("Invalid maths assignment expression");
        }
    }

    #parse_define() {
        if (this.tokens.length !== 3) {
            error("Invalid define statement");
        }

        if (this.tokens[1].kind != TokenKind.Iden) {
            error(`Invalid name for define statement '${this.tokens[1].literal}'`);
        }

        if (this.tokens[2].kind == TokenKind.Iden) {
            const variable = GlobalVarMap.get(this.tokens[2].literal);

            if (variable == null) {
                error(`Undefined variable '${this.tokens[2].literal}'`);
            }

            if (variable.type != TokenKind.Num &&
                variable.type != TokenKind.True &&
                variable.type != TokenKind.False &&
                variable.type != TokenKind.String
            ) {
                error(`Invalid data given '${this.tokens[2].literal}'`);
            }
        }

        if (this.tokens[2].kind == TokenKind.Nil) {
            GlobalVarMap.set(this.tokens[1].literal, 
                new Variable(TokenKind.Num, "0"));
        } else if (this.tokens[2].kind == TokenKind.Iden) {
            const variable = GlobalVarMap.get(this.tokens[2].literal);

            if (variable == null) {
                error(`Undefined variable '${this.tokens[2].literal}'`);
            }

            GlobalVarMap.set(this.tokens[1].literal, 
                new Variable(variable.type, variable.data));
        } else {
            GlobalVarMap.set(this.tokens[1].literal, 
                new Variable(this.tokens[2].kind, this.tokens[2].literal));
        }

        console.log(GlobalVarMap);
    }

    #parse_cond(start, end) {
        if (this.tokens[start].kind != TokenKind.Eq &&
            this.tokens[start].kind != TokenKind.Not &&
            this.tokens[start].kind != TokenKind.Gt &&
            this.tokens[start].kind != TokenKind.Lt &&
            this.tokens[start].kind != TokenKind.GtEq &&
            this.tokens[start].kind != TokenKind.LtEq
        ) {
            error(`Invalid operator '${this.tokens[start].literal}'`);
        }

        for (let i = start; i < end; i++) {
            if (this.tokens[i].kind == TokenKind.And ||
                this.tokens[i].kind == TokenKind.Or
            ) {
                i++;
            }

            if (this.tokens[i].kind != TokenKind.Iden &&
                this.tokens[i].kind != TokenKind.Num &&
                this.tokens[i].kind != TokenKind.True &&
                this.tokens[i].kind != TokenKind.False &&
                this.tokens[i].kind != TokenKind.String &&
                this.tokens[i].kind != TokenKind.Nil
            ) {
                if (this.tokens[i].kind != TokenKind.Eq &&
                    this.tokens[i].kind != TokenKind.Not &&
                    this.tokens[i].kind != TokenKind.Gt &&
                    this.tokens[i].kind != TokenKind.Lt &&
                    this.tokens[i].kind != TokenKind.GtEq &&
                    this.tokens[i].kind != TokenKind.LtEq
                ) {
                    error(`Invalid data '${this.tokens[i].literal}'`);
                }
            }

            if (this.tokens[i].kind == TokenKind.Iden) {
                const variable = GlobalVarMap.get(this.tokens[i].literal);

                if (variable == null) {
                    error(`Undefined variable '${this.tokens[i].literal}'`);
                }

                this.tokens[i] = new Token(variable.type, variable.data);
            }
        }

        console.log("NEW : ", this.tokens);
    }

    #parse_if() {
        if (this.tokens[this.tokens.length - 1].kind != TokenKind.Then) {
            error(`Expected a 'then' got '${this.tokens[this.tokens.length - 1].literal}'`);
        }

        for (let i = 1; i < this.tokens.length - 1; i += 3) {
            if (i > this.tokens.length) {
                
            }
            
            if (i % 4 == 0) {
                if (this.tokens[i].kind != TokenKind.And &&
                    this.tokens[i].kind != TokenKind.Or
                ) {
                    if (i > this.tokens.length) {
                        error(`Expected an and 'or' an or 'got' '${this.tokens[i].literal}'`);
                    }
                }
            }

            if (this.tokens[i].kind == TokenKind.And ||
                this.tokens[i].kind == TokenKind.Or
            ) {
                i++;
            }

            this.#parse_cond(i, i + 3);
        }

    }

    #parse_print() {
        if (this.tokens.length != 2) {
            error("Invalid print statement only 1 argument needed");
        }

        if (this.tokens[1].kind == TokenKind.Iden) {
            const variable = GlobalVarMap.get(this.tokens[1].literal);

            if (variable == null) {
                error(`Undefined variable '${this.tokens[1].literal}'`);
            }

            this.tokens.pop();
            this.tokens.push(new Token(variable.type, variable.data));
        }
    }

    parse() {
        if (this.tokens.length == 0) {
            return;
        }

        switch (this.tokens[0].kind) {
            case TokenKind.If:
                this.#parse_if();
                break;
            case TokenKind.Define:
                this.#parse_define();
                break;
            case TokenKind.Print:
                this.#parse_print();
                break;
            case TokenKind.Add:
            case TokenKind.Sub:
            case TokenKind.Mul:
            case TokenKind.Div:
                this.#parse_math();    
                break; 
            case TokenKind.AddEq:
            case TokenKind.SubEq:
            case TokenKind.MulEq:
            case TokenKind.DivEq:
                this.#parse_math_eq();    
                break; 
            default:
                error(`Unknown token/identifier '${this.tokens[0].literal}'`);
        }
    }
}

class Interpreter {
    constructor(tokens) {
        this.tokens = tokens;
    }

    #interpret_math() {
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

    #interpret_math_eq() {
        if (this.tokens[1].kind == TokenKind.Iden &&
            this.tokens[2].kind == TokenKind.Iden
        ) {
            const variable0 = GlobalVarMap.get(this.tokens[1].literal);
            const variable1 = GlobalVarMap.get(this.tokens[2].literal);

            switch (this.tokens[0].kind) {                
                case TokenKind.AddEq:
                    GlobalVarMap.set(this.tokens[1].literal, 
                        new Variable(TokenKind.Num, 
                                    (+variable0.data +
                                    +variable1.data).toString()));
                    break;
                case TokenKind.SubEq:
                    GlobalVarMap.set(this.tokens[1].literal, 
                        new Variable(TokenKind.Num, 
                                    (+variable0.data -
                                    +variable1.data).toString()));
                    break;
                case TokenKind.MulEq:
                    GlobalVarMap.set(this.tokens[1].literal, 
                        new Variable(TokenKind.Num, 
                                    (+variable0.data *
                                    +variable1.data).toString()));
                    break;
                case TokenKind.DivEq:
                    GlobalVarMap.set(this.tokens[1].literal, 
                        new Variable(TokenKind.Num, 
                                    (+variable0.data /
                                    +variable1.data).toString()));
                    break;
            }
            
        } else {
            const variable = GlobalVarMap.get(this.tokens[1].literal);

            switch (this.tokens[0].kind) {                
                case TokenKind.AddEq:
                    GlobalVarMap.set(this.tokens[1].literal, 
                        new Variable(TokenKind.Num, 
                                    (+variable.data +
                                    +this.tokens[2].literal).toString()));
                    break;
                case TokenKind.SubEq:
                    GlobalVarMap.set(this.tokens[1].literal, 
                        new Variable(TokenKind.Num, 
                                    (+variable.data -
                                    +this.tokens[2].literal).toString()));
                    break;
                case TokenKind.MulEq:
                    GlobalVarMap.set(this.tokens[1].literal, 
                        new Variable(TokenKind.Num, 
                                    (+variable.data *
                                    +this.tokens[2].literal).toString()));
                    break;
                case TokenKind.DivEq:
                    GlobalVarMap.set(this.tokens[1].literal, 
                        new Variable(TokenKind.Num, 
                                    (+variable.data /
                                    +this.tokens[2].literal).toString()));
                    break;
            }
        }

        console.log(GlobalVarMap)
    }

    #interpret_print() {
        document.getElementById("console").value = "balls";
        document.getElementById("console").value = this.tokens[1].literal.toString();
        //console.log(document.getElementById("console").value);
    }

    interpret() {
        if (this.tokens.length == 0) {
            return;
        }

        switch (this.tokens[0].kind) {
            case TokenKind.Print:
                document.getElementById("console").value = "balls";
                this.#interpret_print();
                break;
            case TokenKind.AddEq:
            case TokenKind.SubEq:
            case TokenKind.MulEq:
            case TokenKind.DivEq:
                this.#interpret_math_eq();
                break;
            case TokenKind.Add:
            case TokenKind.Sub:
            case TokenKind.Mul:
            case TokenKind.Div:
                this.#interpret_math();
                break;
        }
    }
}

function main() {
    document.getElementById("source").value.split(/\r?\n/).forEach((line) => {
        if (line.length > 0) {
            document.getElementById("console").value = "";

            let lexer = new Lexer(line);
            lexer.lex();
            console.log(lexer.tokens);

            let parser = new Parser(lexer.tokens);
            parser.parse();

            let interpreter = new Interpreter(parser.tokens);
            interpreter.interpret();
        }
    });
}
