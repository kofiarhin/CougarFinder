const parseOrigins = (value) => {
  if (!value) {
    return [];
  }

  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
};

const normalizeOrigins = (origins) => {
  if (origins.length === 0) {
    return '*';
  }

  if (origins.length === 1) {
    return origins[0];
  }

  return origins;
};

const buildCorsOptions = () => {
  const isProd = process.env.NODE_ENV === 'production';
  const parsed = parseOrigins(process.env.CORS_ORIGIN);

  if (isProd && parsed.length === 0) {
    throw new Error('CORS_ORIGIN must be defined in production');
  }

  const origin = normalizeOrigins(parsed);

  if (!isProd && origin === '*') {
    return { origin: '*', credentials: true };
  }

  return {
    origin,
    credentials: true
  };
};

const buildSocketCorsOptions = () => {
  const options = buildCorsOptions();

  if (options.origin === '*') {
    return options;
  }

  return {
    ...options,
    origin: Array.isArray(options.origin) ? options.origin : [options.origin]
  };
};

module.exports = {
  buildCorsOptions,
  buildSocketCorsOptions
};
