// review types: zdielane kontrakty pre vytvaranie recenzii a foto upload flow.
// Zodpovednost: centralizovat typy pouzivane AddReviewModal/ReviewsSection/BusinessDetail.
// Vstup/Vystup: export ReviewPhotoDraft, ReviewCreateInput, ReviewPhotoUploadResult.

export type ReviewPhotoStatus = "local" | "uploaded" | "failed";

export interface ReviewPhotoDraft {
  id: string;
  uri: string;
  fileName?: string;
  fileSize?: number;
  width?: number;
  height?: number;
  mimeType?: string;
  status?: ReviewPhotoStatus;
  remoteUrl?: string;
}

export interface ReviewPhotoUploadResult {
  id: string;
  localUri: string;
  remoteUrl: string;
  status: Exclude<ReviewPhotoStatus, "local">;
}

export interface ReviewCreateInput {
  rating: number;
  text: string;
  photos?: ReviewPhotoDraft[];
}

