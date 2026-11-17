import { useMemo } from 'react';
import { languageFor } from './languages';
import { tokenize } from './tokenize';

interface Props {
  code: string;
  /** Language key as stored on the syntax example, e.g. `python` or `bash`. */
  lang?: string;
  /** Short caption shown in the block header. */
  title?: string;
}

/**
 * Renders one highlighted code sample.
 *
 * The header carries the caption and the language name, so a reader scanning a
 * long guide can tell what they are looking at before reading a line.
 */
export default function CodeBlock({ code, lang, title }: Props) {
  const spec = languageFor(lang);
  const tokens = useMemo(() => tokenize(code, spec), [code, spec]);

  return (
    <figure className="code-block">
      <figcaption className="code-head">
        <span className="code-title">{title}</span>
        <span className="code-lang" aria-label={`Language: ${spec.label}`}>
          {spec.label}
        </span>
      </figcaption>
      <pre className="code-pre">
        <code>
          {tokens.map((token, index) => (
            <span key={index} className={`tok tok-${token.type}`}>
              {token.value}
            </span>
          ))}
        </code>
      </pre>
    </figure>
  );
}
