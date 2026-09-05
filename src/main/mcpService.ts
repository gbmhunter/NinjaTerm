import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import express, { Request, Response } from 'express';
import { createServer, Server } from 'http';
import { randomUUID } from 'crypto';
import { BrowserWindow } from 'electron';

import { log } from './Logging';
import { RxStreamBuffer } from './RxStreamBuffer';
import { listPorts } from './serialService';

const REQUEST_TIMEOUT_MS = 5000;

/**
 * Most characters the `rxstream` resource holds per session between reads.
 * Bounds main-process memory for a client that subscribes and never reads
 * (or disconnects without closing its session). Comfortably above what a
 * client polling every few seconds sees at typical serial rates.
 */
const RX_STREAM_BUFFER_MAX_CHARS = 1_000_000;

export class McpService {
  private httpServer: Server | null = null;
  private mainWindow: BrowserWindow | null = null;
  /**
   * Active MCP sessions keyed by MCP session ID. A new entry is created for each
   * initialize request. `rxBuffers` holds one stream buffer per NinjaTerm
   * session (keyed by NinjaTerm session id) that has produced data since the
   * MCP session began.
   */
  private sessions = new Map<string, { mcpServer: McpServer; transport: StreamableHTTPServerTransport; rxBuffers: Map<string, RxStreamBuffer> }>();
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
          const rxBuffers = new Map<string, RxStreamBuffer>();
          const transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: () => randomUUID(),
            onsessioninitialized: (id) => {
              this.sessions.set(id, { mcpServer: server, transport, rxBuffers });
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
          this.registerTools(server, rxBuffers);
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
   * Called when new RX data arrives from the renderer for one NinjaTerm session.
   * Buffers the text for every MCP session and sends resource-updated
   * notifications so subscribed clients know to call resources/read.
   */
  handleRxData(sessionId: string, text: string) {
    for (const [, session] of this.sessions) {
      let buffer = session.rxBuffers.get(sessionId);
      if (buffer === undefined) {
        buffer = new RxStreamBuffer(RX_STREAM_BUFFER_MAX_CHARS);
        session.rxBuffers.set(sessionId, buffer);
      }
      buffer.append(text);
      session.mcpServer.server.sendResourceUpdated({ uri: `ninjaterm://sessions/${sessionId}/rxstream` }).catch(() => {});
      // The un-scoped URI is "the active session"; we don't know here whether
      // this is it, so notify and let the read sort it out.
      session.mcpServer.server.sendResourceUpdated({ uri: 'ninjaterm://terminal/rxstream' }).catch(() => {});
    }
  }

  private registerTools(server: McpServer, rxBuffers: Map<string, RxStreamBuffer>) {
    /** Everything buffered for one NinjaTerm session, emptying its buffer. */
    const drain = (sessionId: string): string => rxBuffers.get(sessionId)?.drain() ?? '';

    const sessionParam = z
      .string()
      .optional()
      .describe('Which NinjaTerm session, by id or name (see list_sessions). Defaults to the active session.');

    server.tool(
      'list_sessions',
      'List the open NinjaTerm sessions (tabs). Each has its own connection and settings. ' +
        'Other tools take an optional `session` argument naming one of these; without it they act on the active session.',
      {},
      async () => {
        try {
          const data = await this.requestFromRenderer('list_sessions', {});
          return { content: [{ type: 'text' as const, text: JSON.stringify(data.sessions, null, 2) }] };
        } catch (err) {
          return { content: [{ type: 'text' as const, text: `Error: ${(err as Error).message}` }], isError: true };
        }
      }
    );

    server.tool(
      'get_terminal_output',
      'Get recent output from a NinjaTerm terminal. Returns the last N lines of received data as plain text.',
      {
        lines: z.number().int().min(1).max(1000).default(50).describe('Number of recent lines to return (default 50, max 1000)'),
        session: sessionParam,
      },
      async ({ lines, session }) => {
        try {
          const data = await this.requestFromRenderer('get_terminal_output', { lines, session });
          return { content: [{ type: 'text' as const, text: data.text || '(no output)' }] };
        } catch (err) {
          return { content: [{ type: 'text' as const, text: `Error: ${(err as Error).message}` }], isError: true };
        }
      }
    );

    server.tool(
      'send_data',
      'Send text data over a NinjaTerm session\'s open connection (serial, socket, RTT or Bluetooth). ' +
        'Goes through the session, so it is echoed to its TX terminal and logged like typed data.',
      {
        data: z.string().describe('The text to send'),
        append_newline: z.boolean().default(true).describe('Append a newline (\\n) to the data before sending (default true)'),
        session: sessionParam,
      },
      async ({ data, append_newline, session }) => {
        try {
          const result = await this.requestFromRenderer('send_data', { data, append_newline, session });
          return { content: [{ type: 'text' as const, text: `Sent ${result.bytesSent} bytes on session "${result.session.name}".` }] };
        } catch (err) {
          return { content: [{ type: 'text' as const, text: `Error: ${(err as Error).message}` }], isError: true };
        }
      }
    );

    server.tool(
      'get_connection_status',
      'Get the connection status of a NinjaTerm session, including connection type, port path, baud rate, and connection state.',
      { session: sessionParam },
      async ({ session }) => {
        try {
          const data = await this.requestFromRenderer('get_connection_status', { session });
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

    const streamDescription =
      'Subscribe to receive push notifications (notifications/resources/updated) when new data arrives, ' +
      'then read this resource to retrieve buffered data since the last read. For historical data use the ' +
      `get_terminal_output tool. At most the last ${RX_STREAM_BUFFER_MAX_CHARS} characters are kept between reads; ` +
      'if the buffer overflows the oldest data is dropped and the next read starts with a one-line notice saying how much.';

    server.registerResource(
      'session-rxstream',
      new ResourceTemplate('ninjaterm://sessions/{sessionId}/rxstream', {
        list: async () => {
          const data = await this.requestFromRenderer('list_sessions', {});
          return {
            resources: (data.sessions as { id: string; name: string }[]).map((s) => ({
              uri: `ninjaterm://sessions/${s.id}/rxstream`,
              name: `${s.name} RX stream`,
              mimeType: 'text/plain',
            })),
          };
        },
      }),
      { description: `Real-time stream of data received on one NinjaTerm session. ${streamDescription}` },
      async (uri, variables) => {
        const sessionId = String(variables.sessionId);
        return {
          contents: [{ uri: uri.href, mimeType: 'text/plain', text: drain(sessionId) }],
        };
      }
    );

    server.registerResource(
      'rxstream',
      'ninjaterm://terminal/rxstream',
      {
        description: `Real-time stream of data received on the active NinjaTerm session. ${streamDescription}`,
      },
      async () => {
        const active = await this.requestFromRenderer('get_active_session', {});
        return {
          contents: [{ uri: 'ninjaterm://terminal/rxstream', mimeType: 'text/plain', text: drain(active.id) }],
        };
      }
    );
  }
}
