export async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch("/api" + path, options);
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.message ?? "Не удалось выполнить запрос. Код " + response.status);
  if (body === null) throw new Error("Сервер вернул неожиданный ответ.");
  return body as T;
}
