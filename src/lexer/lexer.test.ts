import { expect, test } from "vitest";
import Lexer, { Token, TokenType } from "./lexer";
import { SUPPORTED_INSTRUCTIONS } from "./instruction";
import { SUPPORTED_REGISTERS } from "./register";

test("lexer should tokenise single line assembly", () => {
    const lexer = new Lexer("MOV %rax, %rbx");
    const tokens = lexer.tokenize();
    const expected: Token[] = [
        {
            type: TokenType.INSTRUCTION,
            value: {
                token: "MOV",
                instruction: "MOV",
            },
        },
        {
            type: TokenType.REGISTER,
            value: "%RAX",
        },
        {
            type: TokenType.COMMA,
            value: ",",
        },
        {
            type: TokenType.REGISTER,
            value: "%RBX",
        },
    ];
    expect(tokens).toStrictEqual(expected);
});

test("lexer should tokenise multi line assembly", () => {
    const lexer = new Lexer(`
            MOV %rax, %rbx
            ADD %rax, %rbx
        `);
    const tokens = lexer.tokenize();
    const expected: Token[] = [
        {
            type: TokenType.INSTRUCTION,
            value: {
                token: "MOV",
                instruction: "MOV",
            },
        },
        {
            type: TokenType.REGISTER,
            value: "%RAX",
        },
        {
            type: TokenType.COMMA,
            value: ",",
        },
        {
            type: TokenType.REGISTER,
            value: "%RBX",
        },
        {
            type: TokenType.INSTRUCTION,
            value: {
                token: "ADD",
                instruction: "ADD",
            },
        },
        {
            type: TokenType.REGISTER,
            value: "%RAX",
        },
        {
            type: TokenType.COMMA,
            value: ",",
        },
        {
            type: TokenType.REGISTER,
            value: "%RBX",
        },
    ];
    expect(tokens).toStrictEqual(expected);
});

test("lexer should tokenise assembly with comments", () => {
    const lexer = new Lexer(`
            MOV %rax, %rbx # Move rax into rbx
            ADD %rax, %rbx # Add rax to rbx
        `);
    const tokens = lexer.tokenize();
    const expected: Token[] = [
        {
            type: TokenType.INSTRUCTION,
            value: {
                token: "MOV",
                instruction: "MOV",
            },
        },
        {
            type: TokenType.REGISTER,
            value: "%RAX",
        },
        {
            type: TokenType.COMMA,
            value: ",",
        },
        {
            type: TokenType.REGISTER,
            value: "%RBX",
        },
        {
            type: TokenType.INSTRUCTION,
            value: {
                token: "ADD",
                instruction: "ADD",
            },
        },
        {
            type: TokenType.REGISTER,
            value: "%RAX",
        },
        {
            type: TokenType.COMMA,
            value: ",",
        },
        {
            type: TokenType.REGISTER,
            value: "%RBX",
        },
    ];
    expect(tokens).toStrictEqual(expected);
});

test("lexer should tokenise assembly parameters with different spacing", () => {
    const lexer1 = new Lexer(`
            MOV %rax,%rbx
            ADD %rax,%rbx
        `);
    const tokens1 = lexer1.tokenize();
    const lexer2 = new Lexer(`
            MOV${" \t "}%rax,      %rbx
            ADD${"\t \t"}%rax, %rbx
        `);
    const tokens2 = lexer2.tokenize();
    const expected: Token[] = [
        {
            type: TokenType.INSTRUCTION,
            value: {
                token: "MOV",
                instruction: "MOV",
            },
        },
        {
            type: TokenType.REGISTER,
            value: "%RAX",
        },
        {
            type: TokenType.COMMA,
            value: ",",
        },
        {
            type: TokenType.REGISTER,
            value: "%RBX",
        },
        {
            type: TokenType.INSTRUCTION,
            value: {
                token: "ADD",
                instruction: "ADD",
            },
        },
        {
            type: TokenType.REGISTER,
            value: "%RAX",
        },
        {
            type: TokenType.COMMA,
            value: ",",
        },
        {
            type: TokenType.REGISTER,
            value: "%RBX",
        },
    ];
    expect(tokens1).toStrictEqual(expected);
    expect(tokens2).toStrictEqual(expected);
});

test("lexer should expect to have whitespace after instruction", () => {
    const lexer = new Lexer(`
            MOV%rax, %rbx
        `);
    expect(() => lexer.tokenize()).toThrowError("Expected whitespace after instruction");
});

test("lexer should expect subsequent instructions to be on a new line", () => {
    const lexer = new Lexer(`
            MOV %rax, %rbx ADD %rax, %rbx
        `);
    expect(() => lexer.tokenize()).toThrowError("Expected newline before subsequent instruction");
});

test("lexer should not tokenize invalid instructions", () => {
    const lexer = new Lexer(`
            INVALID %rax, %rbx
        `);
    expect(() => lexer.tokenize()).toThrowError('Unsupported instruction: "INVALID"');
});

test("lexer should not tokenize invalid registers", () => {
    const lexer = new Lexer(`
            MOV %rax, %invalid
        `);
    expect(() => lexer.tokenize()).toThrowError('Unexpected register: "INVALID"');
});

test("lexer should support all supported instructions", () => {
    for (const instruction of SUPPORTED_INSTRUCTIONS) {
        const lexer = new Lexer(`${instruction} %rax, %rbx`);
        expect(() => lexer.tokenize()).not.toThrowError();
    }
});

test("lexer should support all supported registers", () => {
    for (const register of SUPPORTED_REGISTERS) {
        const lexer = new Lexer(`MOV 0x1, %${register}`);
        expect(() => lexer.tokenize()).not.toThrowError();
    }
});

test("lexer should support parsing immediate", () => {
    const lexer = new Lexer(`MOVABSQ $0x1234567890abcdef, %rax`);
    const tokens = lexer.tokenize();
    const expected: Token[] = [
        {
            type: TokenType.INSTRUCTION,
            value: {
                token: "MOVABSQ",
                instruction: "MOV",
                variant: "ABSQ",
            },
        },
        {
            type: TokenType.IMMEDIATE,
            value: {
                token: "$0x1234567890ABCDEF",
                value: 1311768467294899695n,
            },
        },
        {
            type: TokenType.COMMA,
            value: ",",
        },
        {
            type: TokenType.REGISTER,
            value: "%RAX",
        },
    ];
    expect(tokens).toStrictEqual(expected);
});

test("lexer should support parsing addressing mode: disp", () => {
    const lexer = new Lexer(`MOV 0x123abc, %rax`);
    const tokens = lexer.tokenize();
    const expected: Token[] = [
        {
            type: TokenType.INSTRUCTION,
            value: {
                token: "MOV",
                instruction: "MOV",
            },
        },
        {
            type: TokenType.MEMORY,
            value: {
                token: "0x123ABC",
                displacement: 1194684n,
            },
        },
        {
            type: TokenType.COMMA,
            value: ",",
        },
        {
            type: TokenType.REGISTER,
            value: "%RAX",
        },
    ];
    expect(tokens).toStrictEqual(expected);
});

test("lexer should support parsing addressing mode: (base)", () => {
    const lexer = new Lexer(`MOV (%rax), %rbx`);
    const tokens = lexer.tokenize();
    const expected: Token[] = [
        {
            type: TokenType.INSTRUCTION,
            value: {
                token: "MOV",
                instruction: "MOV",
            },
        },
        {
            type: TokenType.MEMORY,
            value: {
                token: "(%RAX)",
                base: "RAX",
            },
        },
        {
            type: TokenType.COMMA,
            value: ",",
        },
        {
            type: TokenType.REGISTER,
            value: "%RBX",
        },
    ];
    expect(tokens).toStrictEqual(expected);
});

test("lexer should support parsing addressing mode: disp(base)", () => {
    const lexer = new Lexer(`MOV 0x123abc(%rax), %rbx`);
    const tokens = lexer.tokenize();
    const expected: Token[] = [
        {
            type: TokenType.INSTRUCTION,
            value: {
                token: "MOV",
                instruction: "MOV",
            },
        },
        {
            type: TokenType.MEMORY,
            value: {
                token: "0x123ABC(%RAX)",
                displacement: 1194684n,
                base: "RAX",
            },
        },
        {
            type: TokenType.COMMA,
            value: ",",
        },
        {
            type: TokenType.REGISTER,
            value: "%RBX",
        },
    ];
    expect(tokens).toStrictEqual(expected);
});

test("lexer should support parsing addressing mode: (base, index)", () => {
    const lexer = new Lexer(`MOV (%rax, %rbx), %rcx`);
    const tokens = lexer.tokenize();
    const expected: Token[] = [
        {
            type: TokenType.INSTRUCTION,
            value: {
                token: "MOV",
                instruction: "MOV",
            },
        },
        {
            type: TokenType.MEMORY,
            value: {
                token: "(%RAX,%RBX)",
                base: "RAX",
                index: "RBX",
            },
        },
        {
            type: TokenType.COMMA,
            value: ",",
        },
        {
            type: TokenType.REGISTER,
            value: "%RCX",
        },
    ];
    expect(tokens).toStrictEqual(expected);
});

test("lexer should support parsing addressing mode: disp(base, index)", () => {
    const lexer = new Lexer(`MOV 0x123abc(%rax, %rbx), %rcx`);
    const tokens = lexer.tokenize();
    const expected: Token[] = [
        {
            type: TokenType.INSTRUCTION,
            value: {
                token: "MOV",
                instruction: "MOV",
            },
        },
        {
            type: TokenType.MEMORY,
            value: {
                token: "0x123ABC(%RAX,%RBX)",
                displacement: 1194684n,
                base: "RAX",
                index: "RBX",
            },
        },
        {
            type: TokenType.COMMA,
            value: ",",
        },
        {
            type: TokenType.REGISTER,
            value: "%RCX",
        },
    ];
    expect(tokens).toStrictEqual(expected);
});

test("lexer should support parsing addressing mode: (, index, scale)", () => {
    const lexer = new Lexer(`MOV (,%rbx,8), %rcx`);
    const tokens = lexer.tokenize();
    const expected: Token[] = [
        {
            type: TokenType.INSTRUCTION,
            value: {
                token: "MOV",
                instruction: "MOV",
            },
        },
        {
            type: TokenType.MEMORY,
            value: {
                token: "(,%RBX,8)",
                index: "RBX",
                scale: 8n,
            },
        },
        {
            type: TokenType.COMMA,
            value: ",",
        },
        {
            type: TokenType.REGISTER,
            value: "%RCX",
        },
    ];
    expect(tokens).toStrictEqual(expected);
});

test("lexer should support parsing addressing mode: disp(, index, scale)", () => {
    const lexer = new Lexer(`MOV 0x123abc(,%rbx,8), %rcx`);
    const tokens = lexer.tokenize();
    const expected: Token[] = [
        {
            type: TokenType.INSTRUCTION,
            value: {
                token: "MOV",
                instruction: "MOV",
            },
        },
        {
            type: TokenType.MEMORY,
            value: {
                token: "0x123ABC(,%RBX,8)",
                displacement: 1194684n,
                index: "RBX",
                scale: 8n,
            },
        },
        {
            type: TokenType.COMMA,
            value: ",",
        },
        {
            type: TokenType.REGISTER,
            value: "%RCX",
        },
    ];
    expect(tokens).toStrictEqual(expected);
});

test("lexer should support parsing addressing mode: (base, index, scale)", () => {
    const lexer = new Lexer(`MOV (%rax, %rbx, 8), %rcx`);
    const tokens = lexer.tokenize();
    const expected: Token[] = [
        {
            type: TokenType.INSTRUCTION,
            value: {
                token: "MOV",
                instruction: "MOV",
            },
        },
        {
            type: TokenType.MEMORY,
            value: {
                token: "(%RAX,%RBX,8)",
                base: "RAX",
                index: "RBX",
                scale: 8n,
            },
        },
        {
            type: TokenType.COMMA,
            value: ",",
        },
        {
            type: TokenType.REGISTER,
            value: "%RCX",
        },
    ];
    expect(tokens).toStrictEqual(expected);
});

test("lexer should support parsing addressing mode: disp(base, index, scale)", () => {
    const lexer = new Lexer(`MOV 0x123abc(%rax, %rbx, 8), %rcx`);
    const tokens = lexer.tokenize();
    const expected: Token[] = [
        {
            type: TokenType.INSTRUCTION,
            value: {
                token: "MOV",
                instruction: "MOV",
            },
        },
        {
            type: TokenType.MEMORY,
            value: {
                token: "0x123ABC(%RAX,%RBX,8)",
                displacement: 1194684n,
                base: "RAX",
                index: "RBX",
                scale: 8n,
            },
        },
        {
            type: TokenType.COMMA,
            value: ",",
        },
        {
            type: TokenType.REGISTER,
            value: "%RCX",
        },
    ];
    expect(tokens).toStrictEqual(expected);
});

test("lexer should throw when parsing addressing mode with scale but no index: (base, , scale)", () => {
    const lexer = new Lexer(`MOV (%rax,,8), %rcx`);
    expect(() => lexer.tokenize()).toThrowError('Invalid index register: ""');
});

test("lexer should throw when parsing addressing mode with empty parenthesis: ()", () => {
    const lexer = new Lexer(`MOV (), %rcx`);
    expect(() => lexer.tokenize()).toThrowError('Invalid base register: ""');
});

test("lexer should support decimal immediate for displacement in addressing mode", () => {
    const lexer = new Lexer(`MOV 123(%rax), %rbx`);
    const tokens = lexer.tokenize();
    const expected: Token[] = [
        {
            type: TokenType.INSTRUCTION,
            value: {
                token: "MOV",
                instruction: "MOV",
            },
        },
        {
            type: TokenType.MEMORY,
            value: {
                token: "123(%RAX)",
                displacement: 123n,
                base: "RAX",
            },
        },
        {
            type: TokenType.COMMA,
            value: ",",
        },
        {
            type: TokenType.REGISTER,
            value: "%RBX",
        },
    ];
    expect(tokens).toStrictEqual(expected);
});

test("lexer should support negative immediate for displacement in addressing mode", () => {
    const lexer = new Lexer(`MOV -123(%rax), %rbx`);
    const tokens = lexer.tokenize();
    const expected: Token[] = [
        {
            type: TokenType.INSTRUCTION,
            value: {
                token: "MOV",
                instruction: "MOV",
            },
        },
        {
            type: TokenType.MEMORY,
            value: {
                token: "-123(%RAX)",
                displacement: -123n,
                base: "RAX",
            },
        },
        {
            type: TokenType.COMMA,
            value: ",",
        },
        {
            type: TokenType.REGISTER,
            value: "%RBX",
        },
    ];
    expect(tokens).toStrictEqual(expected);
});

test("lexer should support hexadecimal immediate for displacement in addressing mode", () => {
    const lexer = new Lexer(`MOV 0x123abc(%rax), %rbx`);
    const tokens = lexer.tokenize();
    const expected: Token[] = [
        {
            type: TokenType.INSTRUCTION,
            value: {
                token: "MOV",
                instruction: "MOV",
            },
        },
        {
            type: TokenType.MEMORY,
            value: {
                token: "0x123ABC(%RAX)",
                displacement: 1194684n,
                base: "RAX",
            },
        },
        {
            type: TokenType.COMMA,
            value: ",",
        },
        {
            type: TokenType.REGISTER,
            value: "%RBX",
        },
    ];
    expect(tokens).toStrictEqual(expected);
});

test("lexer should throw when setting immediate for displacement in addressing mode", () => {
    const lexer = new Lexer(`MOV 0x123abc($0x123abc), %rbx`);
    expect(() => lexer.tokenize()).toThrowError('Invalid base register: "$0X123ABC"');
});

test("lexer should throw when addressing mode has too many values in parenthesis", () => {
    const lexer = new Lexer(`MOV 0x123abc(%rax, %rbx, 8, %rcx), %rdx`);
    expect(() => lexer.tokenize()).toThrowError('Invalid addressing: "(%RAX, %RBX, 8, %RCX)"');
});

test("lexer should throw when addressing mode has wrong format: disp(base, scale) or disp(index, scale)", () => {
    const lexer = new Lexer(`MOV 0x123abc(%rax, 8), %rdx`);
    expect(() => lexer.tokenize()).toThrowError('Invalid index register: "8"');
});

test("lexer should throw when addressing mode has missing closing parenthesis", () => {
    const lexer = new Lexer(`
        MOV 0x123abc(%rax, %rbx, 8, %rax
        MOV %rax, %rbx
    `);
    expect(() => lexer.tokenize()).toThrowError('Missing ")" in memory addressing');
});

test("lexer should throw when addressing mode has missing opening parenthesis", () => {
    const lexer = new Lexer("MOV 0x123abc%rax, %rbx, 8, %rax)");
    expect(() => lexer.tokenize()).toThrowError('Missing "(" in memory addressing');
});

test("lexer should throw when have unexpected characters", () => {
    const lexer = new Lexer("MOV %rax, %rbx @");
    expect(() => lexer.tokenize()).toThrowError('Unexpected character: "@"');
});

test("lexer should throw when there is no immediate value after $", () => {
    const lexer = new Lexer("MOV $, %rax");
    expect(() => lexer.tokenize()).toThrowError("Empty immediate");
});

test("lexer should support decimal immediate", () => {
    const lexer = new Lexer("MOV $123, %rax");
    const tokens = lexer.tokenize();
    const expected: Token[] = [
        {
            type: TokenType.INSTRUCTION,
            value: {
                token: "MOV",
                instruction: "MOV",
            },
        },
        {
            type: TokenType.IMMEDIATE,
            value: {
                token: "$123",
                value: 123n,
            },
        },
        {
            type: TokenType.COMMA,
            value: ",",
        },
        {
            type: TokenType.REGISTER,
            value: "%RAX",
        },
    ];
    expect(tokens).toStrictEqual(expected);
});

test("lexer should support negative decimal immediate", () => {
    const lexer = new Lexer("MOV $-123, %rax");
    const tokens = lexer.tokenize();
    const expected: Token[] = [
        {
            type: TokenType.INSTRUCTION,
            value: {
                token: "MOV",
                instruction: "MOV",
            },
        },
        {
            type: TokenType.IMMEDIATE,
            value: {
                token: "$-123",
                value: -123n,
            },
        },
        {
            type: TokenType.COMMA,
            value: ",",
        },
        {
            type: TokenType.REGISTER,
            value: "%RAX",
        },
    ];
    expect(tokens).toStrictEqual(expected);
});

test("lexer should support hexadecimal immediate", () => {
    const lexer = new Lexer("MOV $0x123abc, %rax");
    const tokens = lexer.tokenize();
    const expected: Token[] = [
        {
            type: TokenType.INSTRUCTION,
            value: {
                token: "MOV",
                instruction: "MOV",
            },
        },
        {
            type: TokenType.IMMEDIATE,
            value: {
                token: "$0x123ABC",
                value: 1194684n,
            },
        },
        {
            type: TokenType.COMMA,
            value: ",",
        },
        {
            type: TokenType.REGISTER,
            value: "%RAX",
        },
    ];
    expect(tokens).toStrictEqual(expected);
});
