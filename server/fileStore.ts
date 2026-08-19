import { mkdir, readFile, rename, writeFile } from "fs/promises";
import path from "path";

export type FileDecisionStatus = "draft" | "approved" | "needs_discussion";

export type FileDecision = {
  id: number;
  userId: number;
  area: string;
  selection: string;
  note: string | null;
  status: FileDecisionStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type FileDocumentReview = {
  id: number;
  reviewerId: string;
  reviewerName: string;
  documentId: string;
  openedAt: Date | null;
  downloadedAt: Date | null;
  readAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type PersistedDecision = Omit<FileDecision, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

type PersistedReview = Omit<FileDocumentReview, "openedAt" | "downloadedAt" | "readAt" | "createdAt" | "updatedAt"> & {
  openedAt: string | null;
  downloadedAt: string | null;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type PortalFileStore = {
  nextDecisionId: number;
  nextReviewId: number;
  decisions: PersistedDecision[];
  reviews: PersistedReview[];
};

const emptyStore = (): PortalFileStore => ({
  nextDecisionId: 1,
  nextReviewId: 1,
  decisions: [],
  reviews: [],
});

let writeQueue: Promise<void> = Promise.resolve();

function configuredPath() {
  const value = process.env.NMS_DATA_FILE?.trim();
  return value ? path.resolve(value) : null;
}

export function isFileStoreEnabled() {
  return configuredPath() !== null;
}

async function readStore(): Promise<PortalFileStore> {
  const file = configuredPath();
  if (!file) throw new Error("NMS_DATA_FILE is not configured");
  try {
    const parsed = JSON.parse(await readFile(file, "utf8")) as Partial<PortalFileStore>;
    return {
      nextDecisionId: parsed.nextDecisionId ?? 1,
      nextReviewId: parsed.nextReviewId ?? 1,
      decisions: Array.isArray(parsed.decisions) ? parsed.decisions : [],
      reviews: Array.isArray(parsed.reviews) ? parsed.reviews : [],
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return emptyStore();
    throw error;
  }
}

async function persistStore(store: PortalFileStore) {
  const file = configuredPath();
  if (!file) throw new Error("NMS_DATA_FILE is not configured");
  await mkdir(path.dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.tmp`;
  await writeFile(temporary, `${JSON.stringify(store, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
  await rename(temporary, file);
}

function mutateStore<T>(mutation: (store: PortalFileStore) => T | Promise<T>): Promise<T> {
  const run = writeQueue.then(async () => {
    const store = await readStore();
    const result = await mutation(store);
    await persistStore(store);
    return result;
  });
  writeQueue = run.then(() => undefined, () => undefined);
  return run;
}

const asDate = (value: string | null) => value ? new Date(value) : null;

function hydrateDecision(item: PersistedDecision): FileDecision {
  return { ...item, createdAt: new Date(item.createdAt), updatedAt: new Date(item.updatedAt) };
}

function hydrateReview(item: PersistedReview): FileDocumentReview {
  return {
    ...item,
    openedAt: asDate(item.openedAt),
    downloadedAt: asDate(item.downloadedAt),
    readAt: asDate(item.readAt),
    createdAt: new Date(item.createdAt),
    updatedAt: new Date(item.updatedAt),
  };
}

export async function listFileDecisions(userId: number) {
  await writeQueue;
  const store = await readStore();
  return store.decisions
    .filter(item => item.userId === userId)
    .sort((a, b) => a.area.localeCompare(b.area))
    .map(hydrateDecision);
}

export function saveFileDecision(input: {
  userId: number;
  area: string;
  selection: string;
  note?: string | null;
  status?: FileDecisionStatus;
}) {
  return mutateStore(async store => {
    const now = new Date().toISOString();
    const existing = store.decisions.find(item => item.userId === input.userId && item.area === input.area);
    if (existing) {
      existing.selection = input.selection;
      existing.note = input.note ?? null;
      existing.status = input.status ?? "draft";
      existing.updatedAt = now;
    } else {
      store.decisions.push({
        id: store.nextDecisionId++,
        userId: input.userId,
        area: input.area,
        selection: input.selection,
        note: input.note ?? null,
        status: input.status ?? "draft",
        createdAt: now,
        updatedAt: now,
      });
    }
    return store.decisions
      .filter(item => item.userId === input.userId)
      .sort((a, b) => a.area.localeCompare(b.area))
      .map(hydrateDecision);
  });
}

export async function listFileReviews(reviewerId: string) {
  await writeQueue;
  const store = await readStore();
  return store.reviews
    .filter(item => item.reviewerId === reviewerId)
    .sort((a, b) => a.documentId.localeCompare(b.documentId))
    .map(hydrateReview);
}

export function recordFileReview(input: {
  reviewerId: string;
  reviewerName: string;
  documentId: string;
  event: "opened" | "downloaded" | "read" | "unread";
}) {
  return mutateStore(async store => {
    const now = new Date().toISOString();
    let existing = store.reviews.find(item => item.reviewerId === input.reviewerId && item.documentId === input.documentId);
    if (!existing) {
      existing = {
        id: store.nextReviewId++,
        reviewerId: input.reviewerId,
        reviewerName: input.reviewerName,
        documentId: input.documentId,
        openedAt: null,
        downloadedAt: null,
        readAt: null,
        createdAt: now,
        updatedAt: now,
      };
      store.reviews.push(existing);
    }
    existing.reviewerName = input.reviewerName;
    existing.updatedAt = now;
    if (input.event === "opened" || input.event === "downloaded") existing.openedAt = now;
    if (input.event === "downloaded") existing.downloadedAt = now;
    if (input.event === "read") existing.readAt = now;
    if (input.event === "unread") existing.readAt = null;

    return store.reviews
      .filter(item => item.reviewerId === input.reviewerId)
      .sort((a, b) => a.documentId.localeCompare(b.documentId))
      .map(hydrateReview);
  });
}
