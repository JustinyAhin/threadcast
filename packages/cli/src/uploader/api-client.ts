import {
  API_BASE_URL,
  MAX_THREAD_SIZE_BYTES,
  type ThreadData,
  type UploadResponse,
  type ApiError,
} from "@threadcast/shared";

type UploadThreadOpts = {
  threadData: ThreadData;
  token: string;
};

const uploadThread = async (opts: UploadThreadOpts): Promise<UploadResponse> => {
  const body = JSON.stringify(opts.threadData);

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
      Authorization: `Bearer ${opts.token}`,
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
};

const listRemoteThreads = async (
  token: string
): Promise<{ id: string; title: string; created: string }[]> => {
  const res = await fetch(`${API_BASE_URL}/api/threads`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to list threads: ${res.statusText}`);
  }

  return (await res.json()) as { id: string; title: string; created: string }[];
};

type DeleteRemoteThreadOpts = {
  id: string;
  token: string;
};

const deleteRemoteThread = async (opts: DeleteRemoteThreadOpts): Promise<void> => {
  const res = await fetch(`${API_BASE_URL}/api/threads/${opts.id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${opts.token}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to delete thread: ${res.statusText}`);
  }
};

export { uploadThread, listRemoteThreads, deleteRemoteThread };
