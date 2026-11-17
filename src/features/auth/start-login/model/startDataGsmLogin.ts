export function startDataGsmLogin() {
  const apiOrigin = import.meta.env.VITE_API_ORIGIN?.replace(/\/+$/, '') ?? '';
  const authorizeUrl = `${apiOrigin}/api/v2/auth/datagsm/authorize?redirect=%2F`;

  window.location.assign(authorizeUrl);
}
