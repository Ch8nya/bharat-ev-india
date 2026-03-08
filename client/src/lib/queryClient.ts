import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Extended RequestInit with url property
interface RequestOptions extends RequestInit {
  url?: string;
}

export async function apiRequest(
  urlOrOptions: string | RequestOptions,
  options?: RequestInit,
): Promise<Response> {
  // Handle both forms of the function:
  // apiRequest(url, options) and apiRequest({ url, ...options })
  let url: string;
  let config: RequestInit;
  
  if (typeof urlOrOptions === 'string') {
    url = urlOrOptions;
    config = options || {};
  } else {
    url = urlOrOptions.url || '';
    config = { ...urlOrOptions };
    // @ts-ignore
    delete config.url; // Remove url from the config
  }

  const res = await fetch(url, {
    ...config,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
