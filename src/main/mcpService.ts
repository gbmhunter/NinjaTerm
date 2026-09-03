import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import express, { Request, Response } from 'express';
import { createServer, Server } from 'http';
import { randomUUID } from 'crypto';
import { BrowserWindow } from 'electron';

import { log } from './Logging';
import { getActivePortPath, writeToPort, listPorts } from './serialService';

const REQUEST_TIMEOUT_MS = 5000;

export class McpService {
  private httpServer: Server | null = null;
  private mainWindow: BrowserWindow | null = null;
  /** Active sessions keyed by session ID. A new entry is created for each initialize request. */
  private sessions = new Map<string, { mcpServer: McpServer; transport: StreamableHTTPServerTransport; rxBuffer: { text: string } }>();
  private registeredPort: number = 0;

  /**
   * Pending renderer request callbacks, keyed by request ID.
   */
  private pendingRequests = new Map<string, { resolve: (data: any) => void; reject: (err: Error) => void }>();

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
  }

  /**
   * Send a request to the renderer process and wait for a response.
   * The renderer is the single source of truth for terminal state.
   */
  requestFromRenderer(method: string, params: any = {}): Promise<any> {
    return new Promise((resolve, reject) => {
      const id = randomUUID();
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`Renderer request timed out (method: ${method})`));
      }, REQUEST_TIMEOUT_MS);

      this.pendingRequests.set(id, {
        resolve: (data) => { clearTimeout(timeout); resolve(data); },
        reject: (err) => { clearTimeout(timeout); reject(err); },
      });

      this.mainWindow?.webContents.send('mcp:request', { id, method, params });
    });
  }

  /**
   * Called by the ipcMain 'mcp:response' handler when the renderer replies.
   */
  handleRendererResponse(id: string, data: any, error?: string) {
    const pending = this.pendingRequests.get(id);
    if (!pending) return;
    this.pendingRequests.delete(id);
    if (error) {
      pending.reject(new Error(error));
    } else {
      pending.resolve(data);
    }
  }

  async start(port: number): Promise<void> {
    if (this.httpServer) {
      log.info('MCP server already running');
      return;
    }

    this.registeredPort = port;

    const app = express();
    app.use(express.json());

    // Validate Origin header to prevent DNS rebinding attacks (required by MCP spec)
    app.use((req: Request, res: Response, next) => {
      const origin = req.headers['origin'];
      if (origin && origin !== `http://127.0.0.1:${port}` && origin !== 'null') {
        res.status(403).json({ error: 'Origin not allowed' });
        return;
      }
      next();
    });

    app.all('/mcp', async (req: Request, res: Response) => {
      try {
        const sessionId = req.headers['mcp-session-id'] as string | undefined;

        if (!sessionId) {
          // New session: create a fresh McpServer + transport pair
          const rxBuffer = { text: '' };
          const transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: () => randomUUID(),
            onsessioninitialized: (id) => {
              this.sessions.set(id, { mcpServer: server, transport, rxBuffer });
              log.info(`MCP session initialized: ${id}`);
            },
          });
          // Register cleanup when session closes
          transport.onclose = () => {
            const id = transport.sessionId;
            if (id) {
              this.sessions.delete(id);
              log.info(`MCP session closed: ${id}`);
            }
          };
          const server = new McpServer({ name: 'ninjaterm', version: '1.0.0' });
          this.registerTools(server, rxBuffer);
          await server.connect(transport);
          await transport.handleRequest(req, res, req.body);
        } else {
          // Existing session
          const session = this.sessions.get(sessionId);
          if (!session) {
            res.status(404).json({ error: 'Session not found' });
            return;
          }
          await session.transport.handleRequest(req, res, req.body);
        }
      } catch (err) {
        log.error('MCP request error:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Internal server error' });
        }
      }
    });

    this.httpServer = createServer(app);
    await new Promise<void>((resolve, reject) => {
      this.httpServer!.listen(port, '127.0.0.1', () => {
        log.info(`MCP server listening on http://127.0.0.1:${port}/mcp`);
        resolve();
      });
      this.httpServer!.on('error', reject);
    });
  }

  stop(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.httpServer) {
        resolve();
        return;
      }
      // Reject all pending renderer requests
      for (const [, pending] of this.pendingRequests) {
        pending.reject(new Error('MCP server stopped'));
      }
      this.pendingRequests.clear();
      this.sessions.clear();

      this.httpServer.close(() => {
        this.httpServer = null;
        log.info('MCP server stopped');
        resolve();
      });
    });
  }

  get isRunning(): boolean {
    return this.httpServer !== null && this.httpServer.listening;
  }

  /**
   * Called when new RX data arrives from the renderer. Buffers the text for each active session
   * and sends a resource-updated notification so subscribed clients know to call resources/read.
   */
  handleRxData(text: string) {
    for (const [, session] of this.sessions) {
      session.rxBuffer.text += text;
      session.mcpServer.server.sendResourceUpdated({ uri: 'ninjaterm://terminal/rxstream' }).catch(() => {});
    }
  }

  private registerTools(server: McpServer, rxBuffer: { text: string }) {

    server.tool(
      'get_terminal_output',
      'Get recent output from the NinjaTerm serial terminal. Returns the last N lines of received data as plain text.',
      {
        lines: z.number().int().min(1).max(1000).default(50).describe('Number of recent lines to return (default 50, max 1000)'),
      },
      async ({ lines }) => {
        try {
          const data = await this.requestFromRenderer('get_terminal_output', { lines });
          return { content: [{ type: 'text' as const, text: data.text || '(no output)' }] };
        } catch (err) {
          return { content: [{ type: 'text' as const, text: `Error: ${(err as Error).message}` }], isError: true };
        }
      }
    );

    server.tool(
      'send_data',
      'Send text data to the currently open serial port in NinjaTerm.',
      {
        data: z.string().describe('The text to send to the serial port'),
        append_newline: z.boolean().default(true).describe('Append a newline (\\n) to the data before sending (default true)'),
      },
      async ({ data, append_newline }) => {
        const portPath = getActivePortPath();
        if (!portPath) {
          return {
            content: [{ type: 'text' as const, text: 'No serial port is currently open in NinjaTerm.' }],
            isError: true,
          };
        }
        try {
          const text = append_newline ? data + '\n' : data;
          // Buffer is a Uint8Array, which is what writeToPort takes.
          const bytes = Buffer.from(text, 'utf-8');
          await writeToPort(portPath, bytes);
          return { content: [{ type: 'text' as const, text: `Sent ${bytes.length} bytes to ${portPath}.` }] };
        } catch (err) {
          return { content: [{ type: 'text' as const, text: `Error: ${(err as Error).message}` }], isError: true };
        }
      }
    );

    server.tool(
      'get_connection_status',
      'Get the current connection status of NinjaTerm, including port path, baud rate, and connection state.',
      {},
      async () => {
        try {
          const data = await this.requestFromRenderer('get_connection_status', {});
          return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
        } catch (err) {
          return { content: [{ type: 'text' as const, text: `Error: ${(err as Error).message}` }], isError: true };
        }
      }
    );

    server.tool(
      'list_available_ports',
      'List the serial ports currently available on this system.',
      {},
      async () => {
        try {
          const ports = await listPorts();
          if (ports.length === 0) {
            return { content: [{ type: 'text' as const, text: 'No serial ports found.' }] };
          }
          const text = ports.map(p => `${p.path}${p.manufacturer ? ` (${p.manufacturer})` : ''}`).join('\n');
          return { content: [{ type: 'text' as const, text }] };
        } catch (err) {
          return { content: [{ type: 'text' as const, text: `Error: ${(err as Error).message}` }], isError: true };
        }
      }
    );

    server.resource(
      'rxstream',
      'ninjaterm://terminal/rxstream',
      {
        description:
          'Real-time stream of incoming serial data. Subscribe to receive push notifications ' +
          '(notifications/resources/updated) when new data arrives, then read this resource to ' +
          'retrieve buffered data since the last read. For historical data use the get_terminal_output tool.',
      },
      async () => {
        const data = rxBuffer.text;
        rxBuffer.text = '';
        return {
          contents: [{ uri: 'ninjaterm://terminal/rxstream', mimeType: 'text/plain', text: data }],
        };
      }
    );
  }
}
