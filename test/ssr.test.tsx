// @vitest-environment node
import * as React from 'react';
import { renderToString } from 'react-dom/server';
import InputMask from '../src';

it('renders on the server without window', () => {
  expect(typeof window).toBe('undefined');
  const html = renderToString(<InputMask mask="999-999" defaultValue="123" />);
  expect(html).toContain('value="123-___"');
  expect(renderToString(<InputMask mask="99" />)).toContain('value=""');
});
