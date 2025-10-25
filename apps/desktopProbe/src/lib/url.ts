/**
 * Get a [name, value] Map from a url string.
 */
export function parseUrlHash(url: string) {
  const hashParts = new URL(url).hash.slice(1).split('&');
  const hashMap = new Map(
    hashParts.map((part) => {
      const [name, value] = part.split('=');
      return [name, value];
    }),
  );

  return hashMap;
}
