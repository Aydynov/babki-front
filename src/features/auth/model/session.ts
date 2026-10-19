interface EndSessionDependencies {
  clearToken: () => void;
  clearCache: () => void;
  navigateToLogin: (redirect: string | null) => void;
}

const hasControlCharacter = (value: string) => Array.from(value).some((character) => {
  const code = character.charCodeAt(0);
  return code <= 31 || code === 127;
});

export const getSafeInternalRedirect = (value: unknown): string | null => {
  if (
    typeof value !== 'string'
    || !value.startsWith('/')
    || value.startsWith('//')
    || value.includes('\\')
    || hasControlCharacter(value)
  ) {
    return null;
  }

  try {
    const decoded = decodeURIComponent(value);
    if (decoded.startsWith('//') || decoded.includes('\\') || hasControlCharacter(decoded)
      || /(?:[?#&]token=|token%3d)/i.test(decoded)) return null;
    const url = new URL(value, 'https://babki.invalid');
    if (url.pathname === '/join' && (url.search || url.hash)) return null;
    return value;
  } catch {
    return null;
  }
};

export const endSession = (
  dependencies: EndSessionDependencies,
  redirect?: unknown,
) => {
  dependencies.clearToken();
  dependencies.clearCache();
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('babki:session-cleared'));
  dependencies.navigateToLogin(getSafeInternalRedirect(redirect));
};
