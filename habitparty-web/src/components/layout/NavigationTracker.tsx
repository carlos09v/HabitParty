"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import {
  recordNavigationTrailPush,
  syncInitialNavigationTrail,
  syncNavigationTrailPop,
} from "@/utils/navigationTrail";

export function NavigationTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const currentUrl = search ? `${pathname}?${search}` : pathname;

  const isInitializedRef = useRef(false);
  const lastPopUrlRef = useRef<string | null>(null);

  useEffect(() => {
    const handlePopState = () => {
      const nextUrl = `${window.location.pathname}${window.location.search}`;
      lastPopUrlRef.current = nextUrl;
      syncNavigationTrailPop(nextUrl);
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  useEffect(() => {
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      syncInitialNavigationTrail(currentUrl);
      return;
    }

    if (lastPopUrlRef.current === currentUrl) {
      lastPopUrlRef.current = null;
      return;
    }

    recordNavigationTrailPush(currentUrl);
  }, [currentUrl]);

  return null;
}
