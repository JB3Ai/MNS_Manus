import { describe, expect, it } from "vitest";
import { calculateVaultProgress } from "../client/src/lib/vaultProgress";
import { vaultDocuments } from "../shared/vaultDocuments";
import {
  colourOptions,
  decisionAreas,
  logoOptions,
  navigation,
  productCriteria,
  proposalVideos,
} from "../client/src/proposalContent";

describe("NMS proposal content controls", () => {
  it("keeps the executive product scorecard at exactly 100 percent", () => {
    expect(productCriteria.reduce((total, criterion) => total + criterion.weight, 0)).toBe(100);
    expect(productCriteria).toHaveLength(8);
  });

  it("provides exactly three comparable colour and logo directions", () => {
    expect(colourOptions).toHaveLength(3);
    expect(logoOptions).toHaveLength(3);
    colourOptions.forEach(option => expect(option.swatches).toHaveLength(5));
  });

  it("keeps navigation anchors and executive decision keys unique", () => {
    const anchors = navigation.map(([id]) => id);
    const decisionKeys = decisionAreas.map(item => item.area);
    expect(new Set(anchors).size).toBe(anchors.length);
    expect(new Set(decisionKeys).size).toBe(decisionKeys.length);
  });

  it("provides three unique expandable YouTube briefings", () => {
    expect(proposalVideos).toHaveLength(3);
    expect(new Set(proposalVideos.map(video => video.id)).size).toBe(3);
    expect(proposalVideos.filter(video => video.thumbnail)).toHaveLength(3);
    proposalVideos.forEach(video => {
      expect(video.executiveTitle.length).toBeGreaterThan(10);
      expect(video.subtitle.length).toBeGreaterThan(40);
      expect(video.duration).toMatch(/^≈ \d+ min$/);
    });
  });

  it("publishes the eight edited client originals as unique managed vault files", () => {
    expect(vaultDocuments).toHaveLength(8);
    expect(new Set(vaultDocuments.map(document => document.id)).size).toBe(8);
    expect(new Set(vaultDocuments.map(document => document.url)).size).toBe(8);
    expect(vaultDocuments.filter(document => document.type === "PDF")).toHaveLength(7);
    expect(vaultDocuments.filter(document => document.type === "XLSX")).toHaveLength(1);
    vaultDocuments.forEach(document => expect(document.url).toMatch(/^\/manus-storage\//));
  });

  it("counts unfinished download-and-read work for the close reminder", () => {
    const ids = vaultDocuments.map(document => document.id);
    const progress = calculateVaultProgress(ids, [
      { documentId: ids[0], openedAt: new Date(), downloadedAt: new Date(), readAt: new Date() },
      { documentId: ids[1], openedAt: new Date(), downloadedAt: null, readAt: new Date() },
      { documentId: ids[2], openedAt: null, downloadedAt: new Date(), readAt: null },
    ]);
    expect(progress).toMatchObject({ total: 8, opened: 2, downloaded: 2, read: 2, completed: 1, remainingDownloads: 6, remainingReads: 6, remainingDocuments: 7 });
  });
});
