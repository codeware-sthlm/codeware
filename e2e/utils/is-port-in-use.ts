import net from 'net';

export const isPortInUse = (port: number) => {
  return new Promise((resolve) => {
    const socket = new net.Socket();

    // Set a timeout for the connection attempt
    socket.setTimeout(2000); // 2 seconds timeout

    socket.on('connect', () => {
      socket.destroy(); // Close the socket if connected
      resolve(true); // Port is in use
    });

    socket.on('error', () => {
      resolve(false); // Port is not in use
    });

    socket.on('timeout', () => {
      socket.destroy(); // Close the socket on timeout
      resolve(false); // Port is not in use
    });

    // Attempt to connect to the specified port
    socket.connect(port, '127.0.0.1');
  });
};
