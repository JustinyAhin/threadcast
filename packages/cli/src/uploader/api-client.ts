import {
  API_BASE_URL,
  MAX_THREAD_SIZE_BYTES,
  type ThreadData,
  type UploadResponse,
  type ApiError,
} from "@threadcast/shared";

export async function uploadThread(
  threadData: ThreadData,
  token: string
): Promise<UploadResponse> {
  const body = JSON.stringify(threadData);

  if (body.length > MAX_THREAD_SIZE_BYTES) {
    throw new Error(
      `Thread data is ${(body.length / 1024 / 1024).toFixed(1)} MB, exceeding the ${MAX_THREAD_SIZE_BYTES / 1024 / 1024} MB limit. ` +
        `Try sharing a shorter session.`
    );
  }

  const res = await fetch(`${API_BASE_URL}/api/threads`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body,
  });

  if (!res.ok) {
    const error = (await res.json().catch(() => ({
      error: "upload_failed",
      message: res.statusText,
    }))) as ApiError;
    throw new Error(`Upload failed: ${error.message}`);
  }

  return (await res.json()) as UploadResponse;
}

export async function listRemoteThreads(
  token: string
): Promise<{ id: string; title: string; created: string }[]> {
  const res = await fetch(`${API_BASE_URL}/api/threads`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to list threads: ${res.statusText}`);
  }

  return (await res.json()) as { id: string; title: string; created: string }[];
}

export async function deleteRemoteThread(
  id: string,
  token: string
): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/threads/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to delete thread: ${res.statusText}`);
  }
}
