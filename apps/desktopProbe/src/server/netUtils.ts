import net from 'net';

export function findFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, () => {
      const { port } = server.address() as net.AddressInfo;
      server.close(() => resolve(port));
    });
    server.on('error', reject);
  });
}

/**
 * Generates a random port that is not in use.
 * @return A free port number.
 */
export function findFreePortSync(): number {
  const server = net.createServer();
  server.listen(0);
  const port = (server.address() as net.AddressInfo).port;
  server.close();
  return port;
}
