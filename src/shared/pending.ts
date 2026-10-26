import type { PendingUpload } from "./types";

const DB_NAME = "reverseimg";
const DB_VERSION = 1;
const STORE_NAME = "pending";
export const PENDING_MAX_AGE_MS = 15 * 60 * 1000;

let databasePromise: Promise<IDBDatabase> | null = null;

function openDatabase(): Promise<IDBDatabase> {
  if (databasePromise) {
    return databasePromise;
  }
  databasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      databasePromise = null;
      reject(request.error ?? new Error("Could not open IndexedDB"));
    };
    request.onblocked = () => {
      databasePromise = null;
      reject(new Error("IndexedDB is blocked"));
    };
  });
  return databasePromise;
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed"));
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () =>
      reject(transaction.error ?? new Error("IndexedDB transaction failed"));
    transaction.onabort = () =>
      reject(transaction.error ?? new Error("IndexedDB transaction aborted"));
  });
}

export async function putPending(
  blob: Blob,
  name: string,
  type?: string
): Promise<string> {
  try {
    await cleanupPending();
  } catch (error) {
    console.warn("ReverseIMG: pending cleanup failed", error);
  }
  const database = await openDatabase();
  const id =
    typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const record: PendingUpload = {
    id,
    blob,
    name: name || "image",
    type: type || blob.type || "application/octet-stream",
    size: blob.size,
    createdAt: Date.now()
  };
  const transaction = database.transaction(STORE_NAME, "readwrite");
  transaction.objectStore(STORE_NAME).put(record);
  await transactionDone(transaction);
  return id;
}

export async function getPending(id: string): Promise<PendingUpload | undefined> {
  const database = await openDatabase();
  const transaction = database.transaction(STORE_NAME, "readonly");
  const result = await requestToPromise<PendingUpload | undefined>(
    transaction.objectStore(STORE_NAME).get(id)
  );
  if (result && Date.now() - result.createdAt > PENDING_MAX_AGE_MS) {
    try {
      await deletePending(id);
    } catch (error) {
      console.warn("ReverseIMG: expired pending cleanup failed", error);
    }
    return undefined;
  }
  return result;
}

export async function deletePending(id: string): Promise<void> {
  const database = await openDatabase();
  const transaction = database.transaction(STORE_NAME, "readwrite");
  transaction.objectStore(STORE_NAME).delete(id);
  await transactionDone(transaction);
}

export async function cleanupPending(
  maxAgeMs = PENDING_MAX_AGE_MS
): Promise<void> {
  const database = await openDatabase();
  const transaction = database.transaction(STORE_NAME, "readwrite");
  const store = transaction.objectStore(STORE_NAME);
  const records = await requestToPromise<PendingUpload[]>(store.getAll());
  const cutoff = Date.now() - maxAgeMs;
  for (const record of records) {
    if (record.createdAt < cutoff) {
      store.delete(record.id);
    }
  }
  await transactionDone(transaction);
}
