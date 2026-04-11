const apiScope = process.env.NEXT_PUBLIC_API_SCOPE ?? '';

export const loginScopes = Array.from(
  new Set(['User.Read', apiScope].filter((scope): scope is string => Boolean(scope)))
);
