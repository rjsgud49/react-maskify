import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import InputMask from '../../src';

function Controlled() {
  const [v, setV] = useState('');
  return (
    <>
      <InputMask data-testid="controlled" mask="999-9999-9999" value={v} onChange={(e) => setV(e.target.value)} />
      <output data-testid="controlled-out">{v}</output>
    </>
  );
}

function App() {
  return (
    <div>
      <InputMask data-testid="phone" mask="999-9999-9999" />
      <InputMask data-testid="phone-null" mask="999-9999-9999" maskChar={null} />
      <InputMask data-testid="card" mask="9999 9999 9999 9999" maskChar={null} />
      <InputMask data-testid="alpha" mask="aaa-aaa" />
      <Controlled />
      <input data-testid="plain" />
    </div>
  );
}
createRoot(document.getElementById('root')!).render(<App />);
