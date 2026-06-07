"use client";

import { useEffect, type RefObject } from "react";

type IntersectionLoaderOptions = {
  rootMargin?: string;
};

export function useIntersectionLoader(
  targetRef: RefObject<Element | null>,
  onIntersect: () => void,
  { rootMargin = "640px" }: IntersectionLoaderOptions = {}
) {
  useEffect(() => {
    const target = targetRef.current;

    if (!target) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onIntersect();
        }
      },
      { rootMargin }
    );

    observer.observe(target);

    return () => observer.disconnect();
  }, [onIntersect, rootMargin, targetRef]);
}
