import { getDemoResetGeneration, readDemoState, writeDemoState } from '../../../shared/demo';

const databaseName = 'gsmsv-demo-serverless';
const databaseVersion = 1;
const storeName = 'state';
const stateId = 'current';
const invalidationKey = 'gsmsv.demo.serverless.revision';
const channelName = 'gsmsv-demo-serverless-state';

export class DemoServerlessStorageError extends Error {
  constructor() {
    super('데모 서버리스 데이터를 저장하지 못했습니다. 브라우저 저장 공간을 확인한 뒤 다시 시도해 주세요.');
    this.name = 'DemoServerlessStorageError';
  }
}

type StoredRecord<T> = { id: string; generation: string; value: T };
type Normalized<T> = { value: T; changed: boolean };

let databasePromise: Promise<IDBDatabase> | undefined;
let channel: BroadcastChannel | undefined;
const subscribers = new Set<() => void>();
let listening = false;

function openDatabase(): Promise<IDBDatabase> {
  if (typeof window === 'undefined' || !window.indexedDB) return Promise.reject(new DemoServerlessStorageError());
  if (databasePromise) return databasePromise;

  const pending = new Promise<IDBDatabase>((resolve, reject) => {
    const request = window.indexedDB.open(databaseName, databaseVersion);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(storeName)) request.result.createObjectStore(storeName, { keyPath: 'id' });
    };
    request.onsuccess = () => {
      request.result.onversionchange = () => {
        request.result.close();
        databasePromise = undefined;
      };
      resolve(request.result);
    };
    request.onerror = () => reject(new DemoServerlessStorageError());
    request.onblocked = () => reject(new DemoServerlessStorageError());
  }).catch(error => {
    databasePromise = undefined;
    throw error instanceof DemoServerlessStorageError ? error : new DemoServerlessStorageError();
  });
  databasePromise = pending;
  return pending;
}

function notifySubscribers() {
  for (const subscriber of subscribers) subscriber();
  window.dispatchEvent(new Event('gsmsv:demo-serverless-state-change'));
}

function ensureListeners() {
  if (listening || typeof window === 'undefined') return;
  listening = true;
  if (typeof BroadcastChannel !== 'undefined') {
    channel = new BroadcastChannel(channelName);
    channel.addEventListener('message', notifySubscribers);
  }
  window.addEventListener('storage', event => {
    if (event.key === invalidationKey || event.key === 'gsmsv.demo.reset.generation') notifySubscribers();
  });
  window.addEventListener('focus', notifySubscribers);
}

function publishChange() {
  channel?.postMessage({ type: 'changed' });
  try {
    window.localStorage.setItem(invalidationKey, crypto.randomUUID());
  } catch {
    // IndexedDB remains authoritative when the localStorage invalidation fallback is unavailable.
  }
  notifySubscribers();
}

export function subscribeDemoServerlessState(subscriber: () => void): () => void {
  ensureListeners();
  subscribers.add(subscriber);
  return () => subscribers.delete(subscriber);
}

/** Loads or changes the authoritative state in one cross-tab atomic IndexedDB transaction. */
export async function transactDemoServerlessState<T, R>(
  seed: T,
  normalize: (value: unknown) => Normalized<T>,
  update?: (value: T) => R,
): Promise<{ state: T; result: R | undefined }> {
  const database = await openDatabase();
  const generation = getDemoResetGeneration();

  const snapshot = await new Promise<{ state: T; result: R | undefined; changed: boolean }>((resolve, reject) => {
    let transaction: IDBTransaction;
    try {
      transaction = database.transaction(storeName, 'readwrite');
    } catch {
      reject(new DemoServerlessStorageError());
      return;
    }

    const store = transaction.objectStore(storeName);
    const request = store.get(stateId) as IDBRequest<StoredRecord<T> | undefined>;
    let state = seed;
    let result: R | undefined;
    let changed = false;

    request.onsuccess = () => {
      try {
        const stored = request.result;
        const source = stored?.generation === generation
          ? stored.value
          : readDemoState<unknown>('serverless.functions', seed);
        const normalized = normalize(source);
        state = normalized.value;
        changed = !stored || stored.generation !== generation || normalized.changed;
        if (update) {
          const beforeUpdate = JSON.stringify(state);
          result = update(state);
          if (JSON.stringify(state) !== beforeUpdate) changed = true;
        }
        if (changed) store.put({ id: stateId, generation, value: state } satisfies StoredRecord<T>);
      } catch {
        try { transaction.abort(); } catch { /* transaction may already be inactive */ }
      }
    };
    request.onerror = () => {
      try { transaction.abort(); } catch { /* transaction may already be inactive */ }
    };
    transaction.oncomplete = () => {
      resolve({ state: structuredClone(state), result, changed });
    };
    transaction.onerror = () => reject(new DemoServerlessStorageError());
    transaction.onabort = () => reject(new DemoServerlessStorageError());
  });
  // localStorage is kept as a synchronous read mirror for existing callers and
  // older demo features. IndexedDB is authoritative; mirror failures do not
  // turn a committed transaction into a reported failure.
  writeDemoState('serverless.functions', snapshot.state);
  if (snapshot.changed) publishChange();
  return { state: snapshot.state, result: snapshot.result };
}
