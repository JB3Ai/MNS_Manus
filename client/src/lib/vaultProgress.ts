export type VaultProgressReview = {
  documentId: string;
  openedAt: Date | string | null;
  downloadedAt: Date | string | null;
  readAt: Date | string | null;
};

export function calculateVaultProgress(documentIds: readonly string[], reviews: VaultProgressReview[]) {
  const reviewMap = new Map(reviews.map(review => [review.documentId, review]));
  const opened = documentIds.filter(id => Boolean(reviewMap.get(id)?.openedAt)).length;
  const downloaded = documentIds.filter(id => Boolean(reviewMap.get(id)?.downloadedAt)).length;
  const read = documentIds.filter(id => Boolean(reviewMap.get(id)?.readAt)).length;
  const remainingDownloads = documentIds.length - downloaded;
  const remainingReads = documentIds.length - read;
  const remainingDocuments = documentIds.filter(id => {
    const review = reviewMap.get(id);
    return !review?.downloadedAt || !review?.readAt;
  }).length;
  return {
    total: documentIds.length,
    opened,
    downloaded,
    read,
    remainingDownloads,
    remainingReads,
    remainingDocuments,
    completed: documentIds.length - remainingDocuments,
  };
}
