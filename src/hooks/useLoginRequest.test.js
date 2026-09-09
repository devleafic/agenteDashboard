import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import axios from 'axios';
import useLoginRequest from './useLoginRequest';
jest.mock('axios');

function Harness({ onSuccess }) {
  const { submitLogin, onLoading, retrySeconds, msgError } = useLoginRequest('/login', onSuccess);
  return <><button onClick={() => submitLogin('alice', 'password')}>Submit</button>
    <span data-testid="state">{String(onLoading)}:{retrySeconds}</span><p>{msgError}</p></>;
}

afterEach(() => { jest.clearAllMocks(); jest.useRealTimers(); });
test('deduplicates concurrent requests and only accepts a successful token', async () => {
  let resolve;
  axios.post.mockImplementation(() => new Promise(done => { resolve = done; }));
  const success = jest.fn();
  render(<Harness onSuccess={success} />);
  fireEvent.click(screen.getByText('Submit'));
  fireEvent.click(screen.getByText('Submit'));
  expect(axios.post).toHaveBeenCalledTimes(1);
  await act(async () => resolve({ data: { body: { success: true, token: 'token' } } }));
  expect(success).toHaveBeenCalledTimes(1);
  expect(screen.getByTestId('state').textContent).toBe('false:0');
});
test('honors server cooldown and permits retry after expiration', async () => {
  jest.useFakeTimers('modern');
  axios.post.mockRejectedValue({ response: { status: 429, data: { body: { retryAfterSeconds: 3 } } } });
  render(<Harness onSuccess={jest.fn()} />);
  await act(async () => fireEvent.click(screen.getByText('Submit')));
  expect(screen.getByTestId('state').textContent).toBe('false:3');
  fireEvent.click(screen.getByText('Submit'));
  expect(axios.post).toHaveBeenCalledTimes(1);
  act(() => jest.advanceTimersByTime(3000));
  await act(async () => fireEvent.click(screen.getByText('Submit')));
  expect(axios.post).toHaveBeenCalledTimes(2);
});
test('uses Retry-After from the IP limiter and hides technical errors', async () => {
  axios.post.mockRejectedValueOnce({ response: { status: 429, headers: { 'retry-after': '7' } } });
  const { unmount } = render(<Harness onSuccess={jest.fn()} />);
  await act(async () => fireEvent.click(screen.getByText('Submit')));
  expect(screen.getByTestId('state').textContent).toBe('false:7');
  unmount();
  axios.post.mockRejectedValueOnce(new Error('private-network-details'));
  render(<Harness onSuccess={jest.fn()} />);
  await act(async () => fireEvent.click(screen.getByText('Submit')));
  expect(screen.queryByText(/private-network-details/)).toBeNull();
  expect(screen.getByText('No fue posible iniciar sesión. Intenta más tarde.')).toBeTruthy();
});
