Add socket support to the project. This is so people can use NinjaTerm to connect to a socket server, and interact with serial data just like a serial port. The user should be able to select a "connection type" from a dropdown menu on the "Port Configuration" page. Change the name of this page from "Port Configuration" to "Connection Configuration" to reflect that it now supports connecting to more than just a serial port.

The default option should be a serial port. Depending on what has been selected, the user will be presented with a different set of settings. Only show the existing serial port settings if the user selects a serial port. If they select a socket connection, show the following settings:

- Host
- Port

NinjaTerm will be the socket client and the socket will be connected to in the main process. Use code like the following:

```
const net = require('net');

const host = '127.0.0.1'; // Server IP address
const port = 5000;       // Server port

const client = net.createConnection({ port, host }, () => {
    console.log('Connected to TCP server');
    client.write('Hello from TCP client!');
});

client.on('data', (data) => {
    console.log(`Received from server: ${data.toString()}`);
});

client.on('error', (err) => {
    console.error('Client error:', err);
});

client.on('close', () => {
    console.log('Connection closed');
});
```

Create an IPC interface so that the renderer process can control and connect to a socket server.
