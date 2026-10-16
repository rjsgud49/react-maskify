import { test, expect, type Page, type Locator } from '@playwright/test';

const caret = (l: Locator) => l.evaluate((i: HTMLInputElement) => [i.selectionStart, i.selectionEnd]);
const select = (l: Locator, s: number, e = s) => l.evaluate((i: HTMLInputElement, [a, b]) => i.setSelectionRange(a, b), [s, e]);
const pasteText = (page: Page, l: Locator, text: string) =>
  l.evaluate((i: HTMLInputElement, t) => {
    // Simulate a native paste: insert text at selection and fire input event
    const dt = new DataTransfer();
    dt.setData('text/plain', t);
    const ev = new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true });
    if (i.dispatchEvent(ev)) {
      i.focus();
      document.execCommand('insertText', false, t);
    }
  }, text);

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('typing fills mask and moves caret past literals', async ({ page }) => {
  const i = page.getByTestId('phone');
  await i.click();
  await expect(i).toHaveValue('___-____-____');
  expect(await caret(i)).toEqual([0, 0]);
  await i.pressSequentially('0101234');
  await expect(i).toHaveValue('010-1234-____');
  expect(await caret(i)).toEqual([9, 9]);
  await i.pressSequentially('5678');
  await expect(i).toHaveValue('010-1234-5678');
  expect(await caret(i)).toEqual([13, 13]);
  await i.pressSequentially('9');
  await expect(i).toHaveValue('010-1234-5678');
});

test('invalid chars are rejected', async ({ page }) => {
  const i = page.getByTestId('phone-null');
  await i.click();
  await i.pressSequentially('01a0-x1');
  await expect(i).toHaveValue('010-1');
});

test('backspace in the middle shifts and keeps caret', async ({ page }) => {
  const i = page.getByTestId('phone-null');
  await i.click();
  await i.pressSequentially('01012345678');
  await select(i, 6);
  await page.keyboard.press('Backspace');
  await expect(i).toHaveValue('010-1345-678');
  expect(await caret(i)).toEqual([5, 5]);
});

test('backspace right after a literal deletes the digit before it', async ({ page }) => {
  const i = page.getByTestId('phone-null');
  await i.click();
  await i.pressSequentially('01012345678');
  await select(i, 4);
  await page.keyboard.press('Backspace');
  await expect(i).toHaveValue('011-2345-678');
  expect(await caret(i)).toEqual([2, 2]);
});

test('delete in the middle removes next char, caret stays', async ({ page }) => {
  const i = page.getByTestId('phone-null');
  await i.click();
  await i.pressSequentially('01012345678');
  await select(i, 5);
  await page.keyboard.press('Delete');
  await expect(i).toHaveValue('010-1345-678');
  expect(await caret(i)).toEqual([5, 5]);
});

test('delete before a literal skips it', async ({ page }) => {
  const i = page.getByTestId('phone-null');
  await i.click();
  await i.pressSequentially('01012345678');
  await select(i, 3);
  await page.keyboard.press('Delete');
  await expect(i).toHaveValue('010-2345-678');
});

test('backspace with placeholder mask', async ({ page }) => {
  const i = page.getByTestId('phone');
  await i.click();
  await i.pressSequentially('0101234');
  await page.keyboard.press('Backspace');
  await expect(i).toHaveValue('010-123_-____');
  expect(await caret(i)).toEqual([7, 7]);
});

test('paste formatted and raw text', async ({ page }) => {
  const i = page.getByTestId('card');
  await i.click();
  await pasteText(page, i, '4111-1111-1111-1111');
  await expect(i).toHaveValue('4111 1111 1111 1111');
  expect(await caret(i)).toEqual([19, 19]);
  await i.fill('');
  await i.click();
  await pasteText(page, i, '1234567890');
  await expect(i).toHaveValue('1234 5678 90');
});

test('paste in the middle inserts at caret', async ({ page }) => {
  const i = page.getByTestId('phone-null');
  await i.click();
  await i.pressSequentially('0101234');
  await select(i, 4);
  await pasteText(page, i, '99');
  await expect(i).toHaveValue('010-9912-34');
  expect(await caret(i)).toEqual([6, 6]);
});

test('selection replace', async ({ page }) => {
  const i = page.getByTestId('phone-null');
  await i.click();
  await i.pressSequentially('01012345678');
  await select(i, 4, 8);
  await page.keyboard.type('9');
  await expect(i).toHaveValue('010-9567-8');
  expect(await caret(i)).toEqual([5, 5]);
});

test('select all + delete clears', async ({ page }) => {
  const i = page.getByTestId('phone-null');
  await i.click();
  await i.pressSequentially('0101234');
  await select(i, 0, 8);
  await page.keyboard.press('Backspace');
  await expect(i).toHaveValue('');
});

test('controlled component mirrors value', async ({ page }) => {
  const i = page.getByTestId('controlled');
  await i.click();
  await i.pressSequentially('01099');
  await expect(i).toHaveValue('010-99__-____');
  await expect(page.getByTestId('controlled-out')).toHaveText('010-99__-____');
  await select(i, 2);
  await page.keyboard.press('Backspace');
  expect(await caret(i)).toEqual([1, 1]);
  await expect(i).toHaveValue('009-9___-____');
});

test('focus puts caret at first empty slot', async ({ page }) => {
  const i = page.getByTestId('phone');
  await i.click({ position: { x: 80, y: 5 } });
  await page.waitForTimeout(50);
  expect(await caret(i)).toEqual([0, 0]);
});

test.describe('IME composition (chromium CDP)', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'CDP only');

  test('Korean composition into alpha mask is rejected without corruption', async ({ page }) => {
    const i = page.getByTestId('alpha');
    await i.click();
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Input.imeSetComposition', { text: 'ㅎ', selectionStart: 1, selectionEnd: 1 });
    await cdp.send('Input.imeSetComposition', { text: '하', selectionStart: 1, selectionEnd: 1 });
    await cdp.send('Input.imeSetComposition', { text: '한', selectionStart: 1, selectionEnd: 1 });
    await cdp.send('Input.insertText', { text: '한' });
    await expect(i).toHaveValue('___-___');
    await i.pressSequentially('abc');
    await expect(i).toHaveValue('abc-___');
  });

  test('composition with digits commits through mask', async ({ page }) => {
    const i = page.getByTestId('phone-null');
    await i.click();
    await i.pressSequentially('010');
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Input.imeSetComposition', { text: '1', selectionStart: 1, selectionEnd: 1 });
    await cdp.send('Input.imeSetComposition', { text: '12', selectionStart: 2, selectionEnd: 2 });
    await cdp.send('Input.insertText', { text: '12' });
    await expect(i).toHaveValue('010-12');
    expect(await caret(i)).toEqual([6, 6]);
    await i.pressSequentially('34');
    await expect(i).toHaveValue('010-1234-');
  });

  test('typing after a cancelled Hangul composition keeps working', async ({ page }) => {
    const i = page.getByTestId('phone');
    await i.click();
    await i.pressSequentially('0101');
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Input.imeSetComposition', { text: 'ㄱ', selectionStart: 1, selectionEnd: 1 });
    await cdp.send('Input.insertText', { text: 'ㄱ' });
    await expect(i).toHaveValue('010-1___-____');
    expect(await caret(i)).toEqual([5, 5]);
    await i.pressSequentially('234');
    await expect(i).toHaveValue('010-1234-____');
  });
});
