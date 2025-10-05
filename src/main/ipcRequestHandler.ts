import {AnyRouter, inferRouterContext} from "@trpc/server";
import {IpcRequest, IpcResponse} from "../shared/api";
import {resolveResponse} from "@trpc/server/http";

export async function ipcRequestHandler<TRouter extends AnyRouter>(
  opts: {
    req: IpcRequest;
    router: TRouter;
    allowBatching?: boolean;
    onError?: (o: {error: Error; req: IpcRequest}) => void;
    endpoint: string;
    createContext?: (params: {req: IpcRequest}) => Promise<inferRouterContext<TRouter>>;
  },
): Promise<IpcResponse> {
  const createContext = async () => {
    return opts.createContext?.({ req: opts.req });
  };

  // adding a fake "https://electron" to the URL so it can be parsed
  const url = new URL("https://electron" + opts.req.url);
  const path = url.pathname.slice(opts.endpoint.length + 1);
  const response = await resolveResponse({
    req: new Request(url, {
      method: opts.req.method,
      headers: opts.req.headers,
      body: opts.req.body,
    }),
    createContext,
    path,
    router: opts.router,
    allowBatching: opts.allowBatching,
    onError(o) {
      opts?.onError?.({ ...o, req: opts.req });
    },
    error: null
  });

  const headersObj: Record<string, string> = {};
  for (const [k, v] of response.headers) {
    headersObj[k] = v;
  }

  return {
    body: await response.json(),
    headers: headersObj,
    status: response.status,
  };
}
