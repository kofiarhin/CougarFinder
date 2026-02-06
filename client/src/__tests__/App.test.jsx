// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it, vi, afterEach } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import App from '../App.jsx';

vi.mock('../hooks/useContent.js', () => ({
  default: vi.fn()
}));

vi.mock('../hooks/useHealthCheck.js', () => ({
  default: vi.fn()
}));

import useContent from '../hooks/useContent.js';
import useHealthCheck from '../hooks/useHealthCheck.js';

const mockContent = {
  headline: 'Find your perfect match',
  subheadline: 'Meet people nearby who share your vibe.',
  cta: 'Get Started'
};

const renderApp = ({ content = mockContent, healthState } = {}) => {
  useContent.mockReturnValue(content);
  useHealthCheck.mockReturnValue(
    healthState ?? {
      data: { ok: true },
      isError: false,
      isFetching: false
    }
  );

  render(<App />);
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('App component', () => {
  it('renders loading when content is missing', () => {
    renderApp({ content: null });

    expect(screen.getByText('Loading...')).toBeTruthy();
  });

  it('renders hero copy and online health status', () => {
    renderApp();

    expect(screen.getByRole('heading', { name: /find your perfect match/i })).toBeTruthy();
    expect(screen.getByText('Meet people nearby who share your vibe.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Get Started' })).toBeTruthy();
    expect(screen.getByText('Online')).toBeTruthy();
  });

  it('shows checking while health query is fetching', () => {
    renderApp({
      healthState: {
        data: undefined,
        isError: false,
        isFetching: true
      }
    });

    expect(screen.getByText('Checking...')).toBeTruthy();
  });

  it('shows offline when health check fails', () => {
    renderApp({
      healthState: {
        data: undefined,
        isError: true,
        isFetching: false
      }
    });

    expect(screen.getByText('Offline')).toBeTruthy();
  });
});
