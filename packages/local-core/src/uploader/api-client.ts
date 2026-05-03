import {
  API_BASE_URL as DEFAULT_API_BASE_URL,
  MAX_THREAD_SIZE_BYTES,
  type ThreadData,
  type UploadResponse,
  type ApiError,
} from "@threadcast/shared";

const API_BASE_URL = process.env.THREADCAST_API_URL || DEFAULT_API_BASE_URL;

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
      "X-ThreadCast-Client": "threadcast-local-core",
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

export { uploadThread };
