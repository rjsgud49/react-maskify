import * as React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InputMask, { type BeforeMaskedValueChangeConfig, type InputState } from '../src/compat';
import { renderToString } from 'react-dom/server';

const get = () => screen.getByRole('textbox') as HTMLInputElement;

// Cases below follow react-input-mask's documented behavior and its own test suite (v2.0.4 / v3.0.0-alpha.2).
describe('compat: mask syntax', () => {
  it('9 = digit, a = letter, * = alphanumeric', async () => {
    render(<InputMask mask="9a*" />);
    const u = userEvent.setup();
    await u.type(get(), 'x1b!c');
    // x rejected at 9, 1 accepted, b accepted at a, ! rejected, c accepted at *
    expect(get().value).toBe('1bc');
  });

  it('backslash escapes a format char into a literal', async () => {
    render(<InputMask mask={'+\\9 (999)'} />);
    const u = userEvent.setup();
    await u.type(get(), '123');
    expect(get().value).toBe('+9 (123)');
  });

  it('custom formatChars replace the defaults', async () => {
    render(<InputMask mask="HH:MM" formatChars={{ H: '[0-2]', M: '[0-5]' }} />);
    const u = userEvent.setup();
    await u.type(get(), '3197');
    // 3 is rejected by [0-2], 1 is accepted, 9 and 7 are rejected by [0-2]
    expect(get().value).toBe('1_:__');
  });

  it('formatChars as in the react-input-mask README (hex color)', async () => {
    render(<InputMask mask="#999999" formatChars={{ 9: '[0-9a-fA-F]' }} maskChar={null} />);
    const u = userEvent.setup();
    await u.type(get(), 'ff00Zcc');
    expect(get().value).toBe('#ff00cc');
  });

  it('array mask with RegExps (v3 style)', async () => {
    render(<InputMask mask={['(', /[0-9]/, /[0-9]/, ')']} />);
    const u = userEvent.setup();
    await u.type(get(), '42');
    expect(get().value).toBe('(42)');
  });
});

describe('compat: placeholder', () => {
  it('default maskChar is _', async () => {
    render(<InputMask mask="99-99" />);
    await userEvent.setup().click(get());
    expect(get().value).toBe('__-__');
  });

  it('maskChar null keeps trailing literals after the last typed char (v2)', async () => {
    render(<InputMask mask="+7 (999)" maskChar={null} />);
    const u = userEvent.setup();
    await u.type(get(), '1');
    expect(get().value).toBe('+7 (1');
    await u.type(get(), '23');
    expect(get().value).toBe('+7 (123)');
  });

  it('maskPlaceholder with the same length as the mask (v3)', async () => {
    render(<InputMask mask="99/99/9999" maskPlaceholder="dd/mm/yyyy" alwaysShowMask />);
    expect(get().value).toBe('dd/mm/yyyy');
    const u = userEvent.setup();
    await u.click(get());
    get().setSelectionRange(0, 0);
    await u.keyboard('3112');
    expect(get().value).toBe('31/12/yyyy');
  });

  it('alwaysShowMask shows the mask without focus and keeps it on blur', async () => {
    render(<InputMask mask="(999)" alwaysShowMask />);
    expect(get().value).toBe('(___)');
    const u = userEvent.setup();
    await u.click(get());
    await u.tab();
    expect(get().value).toBe('(___)');
  });

  it('a partially filled value stays on blur', async () => {
    render(<InputMask mask="99-99" />);
    const u = userEvent.setup();
    await u.type(get(), '1');
    await u.tab();
    expect(get().value).toBe('1_-__');
  });
});

describe('compat: caret', () => {
  it('focus on an empty input puts the caret at the first editable slot', async () => {
    render(<InputMask mask="+7 (999)" />);
    await userEvent.setup().click(get());
    expect(get().value).toBe('+7 (___)');
    await new Promise((r) => setTimeout(r, 5));
    expect(get().selectionStart).toBe(4);
  });

  it('typing jumps over literals', async () => {
    render(<InputMask mask="99-99" />);
    const u = userEvent.setup();
    await u.type(get(), '12');
    expect(get().selectionStart).toBe(3);
  });

  it('typing a literal moves past it', async () => {
    render(<InputMask mask="99-99" />);
    const u = userEvent.setup();
    await u.type(get(), '1-2');
    expect(get().value).toBe('12-__');
  });

  it('input is limited to the mask length', async () => {
    render(<InputMask mask="99" />);
    const u = userEvent.setup();
    await u.type(get(), '12345');
    expect(get().value).toBe('12');
    expect(get().selectionStart).toBe(2);
  });

  it('backspace over a literal deletes the digit before it and puts the caret there', async () => {
    render(<InputMask mask="99-99" defaultValue="1234" />);
    const u = userEvent.setup();
    await u.click(get());
    get().setSelectionRange(3, 3);
    await u.keyboard('{Backspace}');
    expect(get().value).toBe('13-4_');
    expect(get().selectionStart).toBe(1);
  });
});

describe('compat: paste', () => {
  it('paste of a formatted value', async () => {
    render(<InputMask mask="(999) 999-9999" />);
    const u = userEvent.setup();
    await u.click(get());
    await u.paste('(555) 123-4567');
    expect(get().value).toBe('(555) 123-4567');
  });

  it('paste of raw digits fills slots and places the caret after them', async () => {
    render(<InputMask mask="9999 9999" />);
    const u = userEvent.setup();
    await u.click(get());
    await u.paste('123456');
    expect(get().value).toBe('1234 56__');
    expect(get().selectionStart).toBe(7);
  });

  it('paste over a selection replaces it', async () => {
    render(<InputMask mask="9999" defaultValue="1111" />);
    const u = userEvent.setup();
    await u.click(get());
    get().setSelectionRange(1, 3);
    await u.paste('99');
    expect(get().value).toBe('1991');
  });
});

describe('compat: hooks', () => {
  it('beforeMaskedValueChange gets v2 arguments', async () => {
    const calls: [InputState, InputState, string | null, BeforeMaskedValueChangeConfig][] = [];
    render(
      <InputMask
        mask="99-a"
        beforeMaskedValueChange={(n, o, input, opts) => {
          calls.push([n, o, input, opts]);
          return n;
        }}
      />,
    );
    const u = userEvent.setup();
    await u.type(get(), '1');
    const [n, , input, opts] = calls[calls.length - 1];
    expect(n.value).toBe('1_-_');
    expect(input).toBe('1');
    expect(opts.mask).toBe('99-a');
    expect(opts.permanents).toEqual([2]);
    expect(opts.maskChar).toBe('_');
    expect(opts.alwaysShowMask).toBe(false);
  });

  it('beforeMaskedValueChange README example: optional trailing dash in ZIP', async () => {
    const before = (n: InputState, _o: InputState, input: string | null) => {
      let { value } = n;
      let selection = n.selection;
      if (value.endsWith('-') && input !== '-') {
        value = value.slice(0, -1);
        if (selection && selection.start == value.length + 1) selection = { start: value.length, end: value.length };
      }
      return { value, selection };
    };
    render(<InputMask mask="99999-9999" maskChar={null} beforeMaskedValueChange={before} />);
    const u = userEvent.setup();
    await u.type(get(), '12345');
    expect(get().value).toBe('12345');
    await u.type(get(), '6');
    expect(get().value).toBe('12345-6');
  });

  it('beforeMaskedStateChange (v3) can override the next state', async () => {
    render(
      <InputMask
        mask="999"
        maskPlaceholder={null}
        beforeMaskedStateChange={({ nextState }) => ({ ...nextState, value: nextState.value.replace(/^0/, '') })}
      />,
    );
    const u = userEvent.setup();
    await u.type(get(), '01');
    expect(get().value).toBe('1');
  });
});

describe('compat: children and refs', () => {
  it('v2 children function receives the other props', async () => {
    render(
      <InputMask mask="99" disabled={false} className="x">
        {(props) => <input {...props} data-testid="c" />}
      </InputMask>,
    );
    expect(screen.getByTestId('c').className).toBe('x');
    await userEvent.setup().type(get(), '12');
    expect(get().value).toBe('12');
  });

  it('v3 children element is used as the input', async () => {
    const Custom = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>((p, r) => (
      <input {...p} ref={r} data-custom="1" />
    ));
    render(
      <InputMask mask="99-99">
        <Custom />
      </InputMask>,
    );
    await userEvent.setup().type(get(), '123');
    expect(get().dataset.custom).toBe('1');
    expect(get().value).toBe('12-3_');
  });

  it('ref and inputRef point to the input', () => {
    const ref = React.createRef<HTMLInputElement>();
    let viaInputRef: HTMLInputElement | null = null;
    render(<InputMask mask="99" ref={ref} inputRef={(n) => {
          viaInputRef = n;
        }} />);
    expect(ref.current).toBe(get());
    expect(viaInputRef).toBe(get());
  });

  it('controlled value with onChange (the common react-input-mask pattern)', async () => {
    function App() {
      const [v, setV] = React.useState('');
      return (
        <>
          <InputMask mask="9999-99-99" value={v} onChange={(e) => setV(e.target.value)} />
          <output>{v}</output>
        </>
      );
    }
    render(<App />);
    await userEvent.setup().type(get(), '20261021');
    expect(get().value).toBe('2026-10-21');
    expect(screen.getByRole('status').textContent).toBe('2026-10-21');
  });

  it('changing the mask prop reformats the value', () => {
    const { rerender } = render(<InputMask mask="99-99" value="1234" onChange={() => {}} />);
    expect(get().value).toBe('12-34');
    rerender(<InputMask mask="9 9 9 9" value="1234" onChange={() => {}} />);
    expect(get().value).toBe('1 2 3 4');
  });

  it('change event from a programmatic fireEvent is masked', () => {
    render(<InputMask mask="99-99" />);
    fireEvent.focus(get());
    fireEvent.change(get(), { target: { value: '9876' } });
    expect(get().value).toBe('98-76');
  });

  it('renders on the server without touching window', () => {
    const html = renderToString(<InputMask mask="99-99" defaultValue="12" />);
    expect(html).toContain('value="12-__"');
  });
});
