/**
 * photoUploadService: Poskytuje upload service vrstvu pre fotky recenzií s backend-ready rozhraním.
 *
 * Prečo: Izolácia upload logiky umožňuje neskoršie pripojenie reálneho storage bez zásahu do UI komponentov.
 */

import type { ReviewPhotoDraft, ReviewPhotoUploadResult } from "./types";

const DUMMY_UPLOAD_DELAY_MS = 60;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const buildDummyRemoteUrl = (photo: ReviewPhotoDraft) =>
  `https://dummy.invalid/reviews/${encodeURIComponent(photo.id)}.jpg`;

export const uploadReviewPhotosDummy = async (
  photos: ReviewPhotoDraft[]
): Promise<ReviewPhotoUploadResult[]> => {
  if (!Array.isArray(photos) || photos.length === 0) {
    return [];
  }

  await sleep(DUMMY_UPLOAD_DELAY_MS);

  return photos.map((photo) => ({
    id: photo.id,
    localUri: photo.uri,
    remoteUrl: buildDummyRemoteUrl(photo),
    status: "uploaded",
  }));
};

