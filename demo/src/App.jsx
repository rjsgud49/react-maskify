import { useState } from 'react';
import InputMask, { presets, useMask, unmask, isComplete, formatWithMask } from 'react-maskify';
import { useForm, Controller } from 'react-hook-form';

const GH = 'https://github.com/rjsgud49/react-maskify';

function Preset({ name }) {
  const mask = presets[name];
  const [v, setV] = useState('');
  return (
    <label className="row">
      <code className="name">{name}</code>
      <InputMask mask={mask} value={v} onChange={(e) => setV(e.target.value)} placeholder={mask.replace(/9/g, '0')} />
      <span className="meta">
        raw: <code>{unmask(v, mask) || '—'}</code> {isComplete(v, mask) && <b className="ok">✓</b>}
      </span>
    </label>
  );
}

function Presets() {
  return (
    <section>
      <h2>Presets</h2>
      <p>
        <code>{"import { presets } from 'react-maskify'"}</code>
      </p>
      {Object.keys(presets).map((n) => (
        <Preset key={n} name={n} />
      ))}
    </section>
  );
}

function Migration() {
  const [v, setV] = useState('');
  return (
    <section>
      <h2>Migrating from react-input-mask</h2>
      <p>
        <code>react-input-mask</code> calls <code>ReactDOM.findDOMNode</code>, which was removed in React 19 (
        <code>TypeError: findDOMNode is not a function</code>). The props are the same, so only the import changes.
      </p>
      <div className="cols">
        <div>
          <h3>Before (crashes on React 19)</h3>
          <pre>{`import InputMask from 'react-input-mask';

<InputMask
  mask="+7 (999) 999-99-99"
  maskChar="_"
  value={value}
  onChange={e => setValue(e.target.value)}
>
  {(inputProps) => <input {...inputProps} />}
</InputMask>`}</pre>
          <div className="crash">TypeError: react_dom.findDOMNode is not a function</div>
        </div>
        <div>
          <h3>After (react-maskify, live)</h3>
          <pre>{`import InputMask from 'react-maskify';

<InputMask
  mask="+7 (999) 999-99-99"
  maskChar="_"
  value={value}
  onChange={e => setValue(e.target.value)}
>
  {(inputProps) => <input {...inputProps} />}
</InputMask>`}</pre>
          <InputMask mask="+7 (999) 999-99-99" maskChar="_" value={v} onChange={(e) => setV(e.target.value)}>
            {(inputProps) => <input {...inputProps} className="fancy" placeholder="+7 (___) ___-__-__" />}
          </InputMask>
        </div>
      </div>
    </section>
  );
}

function HookForm() {
  const { control, register, handleSubmit, formState } = useForm({
    defaultValues: { phone: '', card: '', expiry: '' },
    mode: 'onChange',
  });
  const [out, setOut] = useState(null);
  const done = (m) => (v) => isComplete(v, m) || 'incomplete';
  return (
    <section>
      <h2>react-hook-form</h2>
      <form onSubmit={handleSubmit(setOut)} className="form">
        <label>
          Phone (Controller)
          <Controller
            name="phone"
            control={control}
            rules={{ validate: done(presets.phoneKR) }}
            render={({ field }) => <InputMask mask={presets.phoneKR} {...field} />}
          />
          <small>{formState.errors.phone?.message}</small>
        </label>
        <label>
          Card (register, uncontrolled)
          <InputMask mask={presets.card} maskChar={null} {...register('card', { validate: done(presets.card) })} />
          <small>{formState.errors.card?.message}</small>
        </label>
        <label>
          Expiry (register)
          <InputMask mask={presets.cardExpiry} {...register('expiry', { validate: done(presets.cardExpiry) })} />
          <small>{formState.errors.expiry?.message}</small>
        </label>
        <button type="submit">Submit</button>
      </form>
      {out && <pre>{JSON.stringify(out, null, 2)}</pre>}
    </section>
  );
}

function Hook() {
  const { inputProps, unmaskedValue } = useMask({ mask: 'aaa-9999', maskChar: '·' });
  return (
    <section>
      <h2>Headless hook &amp; helpers</h2>
      <label className="row">
        <code className="name">useMask</code>
        <input {...inputProps} placeholder="ABC-1234" />
        <span className="meta">
          unmaskedValue: <code>{unmaskedValue || '—'}</code>
        </span>
      </label>
      <p>
        <code>{"formatWithMask('01012345678', presets.phoneKR)"}</code> → <code>{formatWithMask('01012345678', presets.phoneKR)}</code>
      </p>
      <p>Korean IME (한글) composition is handled — try typing 한글 in a digit field: it is rejected without corrupting the value.</p>
    </section>
  );
}

export default function App() {
  return (
    <main>
      <header>
        <h1>react-maskify</h1>
        <p>React 19 compatible, drop-in replacement for react-input-mask. No findDOMNode, zero deps, ~2.5 KB.</p>
        <pre>npm i react-maskify</pre>
        <p>
          <a href={GH}>GitHub</a> · <a href="https://www.npmjs.com/package/react-maskify">npm</a> ·{' '}
          <a href="https://stackblitz.com/github/rjsgud49/react-maskify/tree/main/demo">Open in StackBlitz</a>
        </p>
      </header>
      <Presets />
      <Migration />
      <HookForm />
      <Hook />
    </main>
  );
}
