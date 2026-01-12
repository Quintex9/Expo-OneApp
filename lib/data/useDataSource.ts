import { useMemo } from "react";
import { getDataSource } from "./index";
import type { DataSource } from "./source";

export const useDataSource = (): DataSource => {
  return useMemo(() => getDataSource(), []);
};
