import { useQuery } from '@tanstack/react-query';
import baseURL from '../constants/baseURL.js';

const fetchHealth = async () => {
  const response = await fetch(`${baseURL}/api/health`, {
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error('Failed to reach CougarFinder API');
  }

  return response.json();
};

const useHealthCheck = (options = {}) => {
  const isTestEnv = import.meta.env.MODE === 'test';

  return useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
    enabled: options.enabled ?? !isTestEnv,
    staleTime: options.staleTime ?? 5 * 60 * 1000,
    retry: options.retry ?? 0,
    ...options
  });
};

export default useHealthCheck;
