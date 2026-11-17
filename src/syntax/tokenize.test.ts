import { describe, expect, it } from 'vitest';
import { languageFor } from './languages';
import { tokenize } from './tokenize';

const typeOf = (code: string, lang: string, value: string) =>
  tokenize(code, languageFor(lang)).find((t) => t.value === value)?.type;

describe('tokenize', () => {
  it('colours python keywords, strings, comments, and numbers', () => {
    const code = '# load a model\nmodel = AutoModel.from_pretrained("bge")\nprint(len([1, 2]))';
    expect(typeOf(code, 'python', '# load a model')).toBe('comment');
    expect(typeOf(code, 'python', 'model')).toBe('plain');
    expect(typeOf(code, 'python', 'AutoModel')).toBe('plain');
    expect(typeOf(code, 'python', 'from_pretrained')).toBe('function');
    expect(typeOf(code, 'python', '"bge"')).toBe('string');
    expect(typeOf(code, 'python', 'print')).toBe('function');
    expect(typeOf(code, 'python', 'len')).toBe('function');
    expect(typeOf(code, 'python', '1')).toBe('number');
    expect(typeOf(code, 'python', '2')).toBe('number');
  });

  it('keeps keywords inside strings and comments from being highlighted', () => {
    const tokens = tokenize('x = "import os" # import os', languageFor('python'));
    expect(tokens.find((t) => t.value === '"import os"')).toEqual({
      type: 'string',
      value: '"import os"',
    });
    expect(tokens.find((t) => t.value === '# import os')).toEqual({
      type: 'comment',
      value: '# import os',
    });
  });

  it('highlights decorators as functions', () => {
    expect(typeOf('@app.post("/chat")', 'python', '@app')).toBe('function');
  });

  it('treats sql placeholders as numbers and keywords case-sensitively', () => {
    const code = 'SELECT id FROM docs WHERE tenant = $1';
    expect(typeOf(code, 'sql', 'SELECT')).toBe('keyword');
    expect(typeOf(code, 'sql', 'FROM')).toBe('keyword');
    expect(typeOf(code, 'sql', 'id')).toBe('plain');
    expect(typeOf(code, 'sql', 'docs')).toBe('plain');
    expect(typeOf(code, 'sql', '$1')).toBe('number');
  });

  it('highlights shell variables outside quotes only', () => {
    expect(typeOf('curl -H $KEY', 'bash', '$KEY')).toBe('number');
    expect(typeOf('curl -H "$KEY"', 'bash', '"$KEY"')).toBe('string');
  });

  it('treats yaml keys as keywords', () => {
    const code = 'model_list:\n  - model_name: gpt-4o';
    expect(typeOf(code, 'yaml', 'model_list')).toBe('keyword');
    expect(typeOf(code, 'yaml', 'model_name')).toBe('keyword');
    expect(typeOf(code, 'yaml', 'gpt')).toBe('plain');
  });

  it('falls back to plain text for an unknown language', () => {
    const tokens = tokenize('some random text', languageFor('cobol'));
    expect(tokens.filter((t) => t.type !== 'plain')).toEqual([]);
    expect(languageFor('cobol').label).toBe('Text');
  });

  it('returns the original source when concatenated', () => {
    const code = 'def f(x):\n    return x + 1\n';
    const joined = tokenize(code, languageFor('python'))
      .map((t) => t.value)
      .join('');
    expect(joined).toBe(code);
  });
});
