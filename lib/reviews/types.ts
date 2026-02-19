/**
 * types: Definuje dátové modely recenzií a fotiek používané v review flowe.
 *
 * Prečo: Zjednotený kontrakt recenzií znižuje nejasnosti pri odosielaní, renderi a upload pipeline.
 */

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

