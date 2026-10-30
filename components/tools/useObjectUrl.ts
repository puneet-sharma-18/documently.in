"use client";

import { useEffect, useMemo } from "react";

/** Object URL for previewing a local file; revoked when the file changes or the component unmounts. */
export function useObjectUrl(file: File | null) {
  const url = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(
    () => () => {
      if (url) URL.revokeObjectURL(url);
    },
    [url],
  );
  return url;
}
