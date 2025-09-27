import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from '../App.jsx';

const renderAppToString = () => {
  const queryClient = new QueryClient();
  const html = renderToString(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  );
  queryClient.clear();
  return html;
};

describe('App smoke test', () => {
  it('renders the hero markup and health indicator copy', () => {
    const html = renderAppToString();

    expect(html.length).toBeGreaterThan(0);
    expect(html).toContain('Find your perfect match');
    expect(html).toContain('Get Started');
    expect(html).toContain('API status');
  });
});
