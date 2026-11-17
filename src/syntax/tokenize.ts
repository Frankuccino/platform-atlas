/**
 * A small, dependency-free syntax tokenizer.
 *
 * The catalog stores ~80 short snippets across eight languages. Pulling in a
 * full highlighter would add weight to a bundle that is already over the warning
 * threshold, and most of its grammars would never render. This scanner covers
 * the token classes that make those snippets readable — comments, strings,
 * keywords, numbers, builtins, function calls, operators — and deliberately
 * leaves anything it does not recognise as plain text rather than guessing.
 *
 * It is not a parser: it never builds a tree, so it cannot be "wrong" about
 * grammar, only about which colour a word gets.
 */
import type { LanguageSpec } from './languages';

export type TokenType =
  'keyword' | 'builtin' | 'string' | 'comment' | 'number' | 'function' | 'operator' | 'plain';

export interface Token {
  type: TokenType;
  value: string;
}

const WHITESPACE = /\s/;
const DIGIT = /[0-9]/;
const IDENT_START = /[A-Za-z_]/;
const IDENT_PART = /[A-Za-z0-9_]/;
const NUMBER_PART = /[0-9a-fA-FxXoObB._]/;
const OPERATOR = /[+\-*/%=<>!&|^~?:]/;

function readString(code: string, start: number): { value: string; next: number } {
  const quote = code[start];

  // Python triple-quoted strings.
  if (quote !== '`' && code.startsWith(quote.repeat(3), start)) {
    const delimiter = quote.repeat(3);
    const end = code.indexOf(delimiter, start + 3);
    const next = end === -1 ? code.length : end + delimiter.length;
    return { value: code.slice(start, next), next };
  }

  let i = start + 1;
  while (i < code.length) {
    const ch = code[i];
    if (ch === '\\') {
      i += 2;
      continue;
    }
    if (ch === quote) {
      i += 1;
      break;
    }
    i += 1;
  }
  return { value: code.slice(start, i), next: i };
}

function nextNonSpace(code: string, from: number): string {
  let i = from;
  while (i < code.length && (code[i] === ' ' || code[i] === '\t')) i += 1;
  return code[i] ?? '';
}

export function tokenize(code: string, spec: LanguageSpec): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  const push = (type: TokenType, value: string) => {
    if (!value) return;
    const last = tokens[tokens.length - 1];
    // Coalesce coloured runs so the DOM stays small, but never merge plain
    // tokens: whitespace would otherwise swallow the adjacent word and make
    // token values unreliable.
    if (last && last.type === type && type !== 'plain') last.value += value;
    else tokens.push({ type, value });
  };

  while (i < code.length) {
    const ch = code[i];

    if (WHITESPACE.test(ch)) {
      let j = i + 1;
      while (j < code.length && WHITESPACE.test(code[j])) j += 1;
      push('plain', code.slice(i, j));
      i = j;
      continue;
    }

    if (spec.lineComment && code.startsWith(spec.lineComment, i)) {
      let j = code.indexOf('\n', i);
      if (j === -1) j = code.length;
      push('comment', code.slice(i, j));
      i = j;
      continue;
    }

    if (spec.blockComment && code.startsWith(spec.blockComment[0], i)) {
      const [open, close] = spec.blockComment;
      const end = code.indexOf(close, i + open.length);
      const j = end === -1 ? code.length : end + close.length;
      push('comment', code.slice(i, j));
      i = j;
      continue;
    }

    if (ch === '"' || ch === "'" || ch === '`') {
      const { value, next } = readString(code, i);
      push('string', value);
      i = next;
      continue;
    }

    // Shell / SQL placeholders: $NAME and $1.
    if (
      spec.variables &&
      ch === '$' &&
      (IDENT_START.test(code[i + 1] ?? '') || DIGIT.test(code[i + 1] ?? ''))
    ) {
      let j = i + 2;
      while (j < code.length && IDENT_PART.test(code[j])) j += 1;
      push('number', code.slice(i, j));
      i = j;
      continue;
    }

    // Python / TS decorators: @name
    if (ch === '@' && IDENT_START.test(code[i + 1] ?? '')) {
      let j = i + 2;
      while (j < code.length && IDENT_PART.test(code[j])) j += 1;
      push('function', code.slice(i, j));
      i = j;
      continue;
    }

    if (DIGIT.test(ch) && !IDENT_PART.test(code[i - 1] ?? '')) {
      let j = i + 1;
      while (j < code.length && NUMBER_PART.test(code[j])) j += 1;
      push('number', code.slice(i, j));
      i = j;
      continue;
    }

    if (IDENT_START.test(ch)) {
      let j = i + 1;
      while (j < code.length && IDENT_PART.test(code[j])) j += 1;
      const word = code.slice(i, j);

      if (spec.keywords.has(word)) {
        push('keyword', word);
      } else if (spec.builtins.has(word)) {
        push(nextNonSpace(code, j) === '(' ? 'function' : 'builtin', word);
      } else if (nextNonSpace(code, j) === '(') {
        push('function', word);
      } else if (spec.keyColon && nextNonSpace(code, j) === ':') {
        push('keyword', word);
      } else {
        push('plain', word);
      }
      i = j;
      continue;
    }

    if (OPERATOR.test(ch)) {
      push('operator', ch);
      i += 1;
      continue;
    }

    push('plain', ch);
    i += 1;
  }

  return tokens;
}
