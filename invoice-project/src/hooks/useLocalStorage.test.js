import { renderHook, act } from '@testing-library/react';
import useLocalStorage from './useLocalStorage';

beforeEach(() => {
  localStorage.clear();
});

test('returns initial value when nothing is stored', () => {
  const { result } = renderHook(() => useLocalStorage('test_key', { a: 1 }));
  expect(result.current[0]).toEqual({ a: 1 });
});

test('persists value to localStorage on set', () => {
  const { result } = renderHook(() => useLocalStorage('test_key', null));
  act(() => { result.current[1]({ x: 99 }); });
  expect(JSON.parse(localStorage.getItem('test_key'))).toEqual({ x: 99 });
});

test('reads existing localStorage value on mount', () => {
  localStorage.setItem('test_key', JSON.stringify({ saved: true }));
  const { result } = renderHook(() => useLocalStorage('test_key', null));
  expect(result.current[0]).toEqual({ saved: true });
});

test('supports functional update', () => {
  const { result } = renderHook(() => useLocalStorage('count', 0));
  act(() => { result.current[1](prev => prev + 1); });
  expect(result.current[0]).toBe(1);
});
