import * as React from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InputMask, { InputMask as Named, useMask, presets } from '../src';
import { useForm, Controller } from 'react-hook-form';

const get = () => screen.getByRole('textbox') as HTMLInputElement;

describe('InputMask typing', () => {
  it('types and formats with placeholder', async () => {
    render(<InputMask mask={presets.phoneKR} />);
    const u = userEvent.setup();
    await u.click(get());
    expect(get().value).toBe('___-____-____');
    await u.type(get(), '01012345678');
    expect(get().value).toBe('010-1234-5678');
  });

  it('caret skips literals while typing', async () => {
    render(<InputMask mask="999-999" />);
    const u = userEvent.setup();
    await u.click(get());
    await u.keyboard('123');
    expect(get().selectionStart).toBe(4);
  });

  it('maskChar null hides placeholders', async () => {
    render(<InputMask mask="99/99/9999" maskChar={null} />);
    const u = userEvent.setup();
    await u.type(get(), '1225');
    expect(get().value).toBe('12/25/');
  });

  it('maskPlaceholder (v3 name) works', async () => {
    render(<InputMask mask="99" maskPlaceholder="#" alwaysShowMask />);
    expect(get().value).toBe('##');
  });

  it('rejects invalid characters and keeps caret', async () => {
    render(<InputMask mask="999" />);
    const u = userEvent.setup();
    await u.type(get(), '1a2');
    expect(get().value).toBe('12_');
    expect(get().selectionStart).toBe(2);
  });

  it('clears on blur when empty, keeps when alwaysShowMask', async () => {
    const u = userEvent.setup();
    const { unmount } = render(<InputMask mask="99" />);
    await u.click(get());
    expect(get().value).toBe('__');
    await u.tab();
    expect(get().value).toBe('');
    unmount();
    render(<InputMask mask="99" alwaysShowMask />);
    expect(get().value).toBe('__');
  });
});

describe('deleting', () => {
  it('backspace at end', async () => {
    render(<InputMask mask="999-999" defaultValue="123456" />);
    const u = userEvent.setup();
    await u.click(get());
    get().setSelectionRange(7, 7);
    await u.keyboard('{Backspace}');
    expect(get().value).toBe('123-45_');
    expect(get().selectionStart).toBe(6);
  });

  it('backspace in the middle shifts characters left and keeps caret', async () => {
    render(<InputMask mask="999-999" defaultValue="123456" />);
    const u = userEvent.setup();
    await u.click(get());
    get().setSelectionRange(2, 2);
    await u.keyboard('{Backspace}');
    expect(get().value).toBe('134-56_');
    expect(get().selectionStart).toBe(1);
  });

  it('backspace right after a literal deletes the digit before it', async () => {
    render(<InputMask mask="999-999" defaultValue="1234" />);
    const u = userEvent.setup();
    await u.click(get());
    get().setSelectionRange(4, 4);
    await u.keyboard('{Backspace}');
    expect(get().value).toBe('124-___');
    expect(get().selectionStart).toBe(2);
  });

  it('Delete key removes the next character', async () => {
    render(<InputMask mask="999-999" defaultValue="123456" />);
    const u = userEvent.setup();
    await u.click(get());
    get().setSelectionRange(0, 0);
    await u.keyboard('{Delete}');
    expect(get().value).toBe('234-56_');
    expect(get().selectionStart).toBe(0);
  });

  it('Delete before a literal removes the digit after it', async () => {
    render(<InputMask mask="999-999" defaultValue="123456" />);
    const u = userEvent.setup();
    await u.click(get());
    get().setSelectionRange(3, 3);
    await u.keyboard('{Delete}');
    expect(get().value).toBe('123-56_');
  });

  it('selection replace', async () => {
    render(<InputMask mask="999-9999-9999" defaultValue="01012345678" />);
    const u = userEvent.setup();
    await u.click(get());
    get().setSelectionRange(4, 8);
    await u.keyboard('9');
    expect(get().value).toBe('010-9567-8___');
    expect(get().selectionStart).toBe(5);
  });

  it('select all + delete clears', async () => {
    render(<InputMask mask="999" defaultValue="123" />);
    const u = userEvent.setup();
    await u.click(get());
    get().setSelectionRange(0, 3);
    await u.keyboard('{Backspace}');
    expect(get().value).toBe('___');
  });
});

describe('paste', () => {
  it('pastes formatted text', async () => {
    render(<InputMask mask={presets.phoneKR} />);
    const u = userEvent.setup();
    await u.click(get());
    await u.paste('010-1234-5678');
    expect(get().value).toBe('010-1234-5678');
  });
  it('pastes raw digits with junk', async () => {
    render(<InputMask mask={presets.card} maskChar={null} />);
    const u = userEvent.setup();
    await u.click(get());
    await u.paste('4111 1111-1111x1111');
    expect(get().value).toBe('4111 1111 1111 1111');
    expect(get().selectionStart).toBe(19);
  });
  it('pastes in the middle', async () => {
    render(<InputMask mask="999-999" defaultValue="16" />);
    const u = userEvent.setup();
    await u.click(get());
    get().setSelectionRange(1, 1);
    await u.paste('2345');
    expect(get().value).toBe('123-456');
  });
});

describe('controlled', () => {
  it('controlled value and onChange', async () => {
    const seen: string[] = [];
    function C() {
      const [v, setV] = React.useState('010');
      return (
        <InputMask
          mask="999-9999-9999"
          value={v}
          onChange={(e) => {
            seen.push(e.target.value);
            setV(e.target.value);
          }}
        />
      );
    }
    render(<C />);
    expect(get().value).toBe('010-____-____');
    const u = userEvent.setup();
    await u.click(get());
    get().setSelectionRange(4, 4);
    await u.keyboard('12');
    expect(get().value).toBe('010-12__-____');
    expect(seen[seen.length - 1]).toBe('010-12__-____');
  });

  it('external value updates are formatted', () => {
    const { rerender } = render(<InputMask mask="99-99" value="" onChange={() => {}} />);
    rerender(<InputMask mask="99-99" value="1234" onChange={() => {}} />);
    expect(get().value).toBe('12-34');
  });

  it('beforeMaskedValueChange (v2) can modify state', async () => {
    render(
      <InputMask
        mask="aaa"
        beforeMaskedValueChange={(n) => ({ ...n, value: n.value.toUpperCase() })}
      />,
    );
    const u = userEvent.setup();
    await u.type(get(), 'abc');
    expect(get().value).toBe('ABC');
  });

  it('beforeMaskedStateChange (v3) receives nextState', async () => {
    const spy = vi.fn(({ nextState }) => nextState);
    render(<InputMask mask="99" beforeMaskedStateChange={spy} />);
    await userEvent.setup().type(get(), '1');
    expect(spy).toHaveBeenCalled();
    expect(spy.mock.calls[0][0].nextState.value).toBe('1_');
  });
});

describe('refs and children', () => {
  it('forwards ref, inputRef', () => {
    const r = React.createRef<HTMLInputElement>();
    const ir = vi.fn();
    render(<InputMask mask="99" ref={r} inputRef={ir} />);
    expect(r.current).toBe(get());
    expect(ir).toHaveBeenCalledWith(get());
    expect(Named).toBe(InputMask);
  });
  it('children render prop', async () => {
    render(
      <InputMask mask="99-99" className="x">
        {(p) => <input data-testid="c" {...p} />}
      </InputMask>,
    );
    const el = screen.getByTestId('c') as HTMLInputElement;
    expect(el.className).toBe('x');
    await userEvent.setup().type(el, '1234');
    expect(el.value).toBe('12-34');
  });
  it('no mask renders a plain input', async () => {
    render(<InputMask mask="" />);
    await userEvent.setup().type(get(), 'hello');
    expect(get().value).toBe('hello');
  });
  it('passes through attributes and event handlers', async () => {
    const onFocus = vi.fn();
    const onBlur = vi.fn();
    render(<InputMask mask="99" name="n" placeholder="p" onFocus={onFocus} onBlur={onBlur} />);
    expect(get().name).toBe('n');
    const u = userEvent.setup();
    await u.click(get());
    await u.tab();
    expect(onFocus).toHaveBeenCalled();
    expect(onBlur).toHaveBeenCalled();
  });
});

describe('IME composition', () => {
  it('does not mask during composition and applies on end', () => {
    render(<InputMask mask="XX-XX" formatChars={{ X: '[가-힣]' }} maskChar={null} />);
    const el = get();
    act(() => el.focus());
    fireEvent.compositionStart(el);
    fireEvent.change(el, { target: { value: 'ㅎ' } });
    expect(el.value).toBe('ㅎ');
    fireEvent.change(el, { target: { value: '한' } });
    expect(el.value).toBe('한');
    fireEvent.change(el, { target: { value: '한구' } });
    fireEvent.change(el, { target: { value: '한국' } });
    fireEvent.compositionEnd(el);
    expect(el.value).toBe('한국-');
    // trailing input event (Safari order) is a no-op
    fireEvent.change(el, { target: { value: '한국-' } });
    expect(el.value).toBe('한국-');
  });
  it('drops composed chars that do not fit the mask', () => {
    render(<InputMask mask="999" />);
    const el = get();
    act(() => el.focus());
    fireEvent.compositionStart(el);
    fireEvent.change(el, { target: { value: '___ㅎ' } });
    fireEvent.compositionEnd(el);
    expect(el.value).toBe('___');
  });
});

describe('useMask hook', () => {
  it('works headless', async () => {
    function H() {
      const m = useMask({ mask: '9999-99-99', maskChar: null });
      return (
        <>
          <input {...m.inputProps} />
          <span data-testid="raw">{m.unmaskedValue}</span>
        </>
      );
    }
    render(<H />);
    await userEvent.setup().type(get(), '20261016');
    expect(get().value).toBe('2026-10-16');
    expect(screen.getByTestId('raw').textContent).toBe('20261016');
  });
});

describe('react-hook-form', () => {
  it('works with register (uncontrolled)', async () => {
    let values: Record<string, string> = {};
    function F() {
      const { register, handleSubmit } = useForm<{ phone: string }>();
      return (
        <form onSubmit={handleSubmit((v) => (values = v))}>
          <InputMask mask={presets.phoneKR} {...register('phone')} />
          <button>go</button>
        </form>
      );
    }
    render(<F />);
    const u = userEvent.setup();
    await u.type(get(), '01099998888');
    await u.click(screen.getByRole('button'));
    expect(values.phone).toBe('010-9999-8888');
  });
  it('works with Controller', async () => {
    let values: Record<string, string> = {};
    function F() {
      const { control, handleSubmit } = useForm<{ d: string }>({ defaultValues: { d: '' } });
      return (
        <form onSubmit={handleSubmit((v) => (values = v))}>
          <Controller
            name="d"
            control={control}
            render={({ field }) => <InputMask mask={presets.dateISO} maskChar={null} {...field} />}
          />
          <button>go</button>
        </form>
      );
    }
    render(<F />);
    const u = userEvent.setup();
    await u.type(get(), '20261016');
    await u.click(screen.getByRole('button'));
    expect(values.d).toBe('2026-10-16');
  });
});

describe('focus caret timer (regression 0.2.0)', () => {
  it('does not move the caret back if the user typed before the focus timer fired', async () => {
    vi.useFakeTimers();
    const { getByRole } = render(<InputMask mask="999-9999-9999" maskChar={null} />);
    const i = getByRole('textbox') as HTMLInputElement;
    act(() => i.focus());
    i.value = '01';
    i.setSelectionRange(2, 2);
    fireEvent.change(i);
    act(() => vi.runAllTimers());
    expect(i.value).toBe('01');
    expect(i.selectionStart).toBe(2);
    vi.useRealTimers();
  });
});
