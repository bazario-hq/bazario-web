import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '../../src/api/client';
import { LoginPage, safeNext } from '../../src/pages/auth/LoginPage';
import { SignupPage } from '../../src/pages/auth/SignupPage';
import { fakeApp, renderWithApp } from './render';

describe('safeNext', () => {
  it('only allows same-site paths', () => {
    expect(safeNext('/orders')).toBe('/orders');
    expect(safeNext('//evil.example')).toBe('/');
    expect(safeNext('https://evil.example')).toBe('/');
    expect(safeNext(null)).toBe('/');
  });
});

describe('LoginPage', () => {
  it('logs in with the entered credentials', async () => {
    const app = fakeApp({ login: vi.fn(async () => ({ id: 1, email: 'a@b.c', name: 'A', role: 'buyer' as const, createdAt: '', seller: null })) });
    renderWithApp(<LoginPage />, { app, path: '/login-form' });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'ben@example.test' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret-pass' } });
    fireEvent.click(screen.getByRole('button', { name: 'Log in' }));
    await waitFor(() => expect(app.login).toHaveBeenCalledWith('ben@example.test', 'secret-pass'));
  });
});
