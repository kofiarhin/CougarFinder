import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from '../App.jsx';

describe('App smoke test', () => {
  it('renders without throwing and produces markup', () => {
    const queryClient = new QueryClient();

    const html = renderToString(
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    );

    expect(html.length).toBeGreaterThan(0);
    expect(html).toContain('Get Started');
    queryClient.clear();
  });
});
