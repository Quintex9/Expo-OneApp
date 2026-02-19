// photoUploadService: backend-ready dummy upload pre review fotky.
// Zodpovednost: drzat upload kontrakt oddeleny od UI, bez realneho storage write v tejto faze.
// Vstup/Vystup: prijima draft fotky a vracia upload result s placeholder remote URL.

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

