import { mockSource } from "./mockSource";
import type { DataSource } from "./source";

// Stub for future real API source
const apiSource: DataSource = mockSource;

export const getDataSource = (): DataSource => {
  const useApi = process.env.DATA_SOURCE === "api";
  return useApi ? apiSource : mockSource;
};
