"use client";

/** Small fetch wrapper: throws the API error message so forms can show it. */
export async function api<T = unknown>(
  url: string,
  options: RequestInit & { json?: unknown } = {}
): Promise<T> {
  const { json, ...rest } = options;
  const res = await fetch(url, {
    ...rest,
    headers: json
      ? { "Content-Type": "application/json", ...(rest.headers ?? {}) }
      : rest.headers,
    body: json ? JSON.stringify(json) : rest.body,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? "Request failed");
  return data as T;
}
