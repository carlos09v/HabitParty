"use client";

import dynamic from "next/dynamic";
import { ShowcaseTabPanelFallback } from "@/components/showcase/ShowcaseTabs";

export {
  EMPTY_ARTIFACTS,
  EMPTY_FRIENDS,
  EMPTY_TASK_STREAKS,
} from "@/utils/showcaseUtils";

export const preloadProgressionPanel = () =>
  import("@/components/showcase/progression/ProgressionPyramidPanel").then(
    (mod) => mod.ProgressionPyramidPanel,
  );

export const ProgressionPyramidPanel = dynamic(preloadProgressionPanel, {
  loading: ShowcaseTabPanelFallback,
});

export const preloadFriendsPanel = () =>
  import("@/components/showcase/FriendsNetworkPanel").then(
    (mod) => mod.FriendsNetworkPanel,
  );

export const FriendsNetworkPanel = dynamic(preloadFriendsPanel, {
  loading: ShowcaseTabPanelFallback,
});

export const preloadRetrospectivePanel = () =>
  import("@/components/showcase/RetrospectivePanel").then(
    (mod) => mod.RetrospectivePanel,
  );

export const RetrospectivePanel = dynamic(preloadRetrospectivePanel, {
  loading: ShowcaseTabPanelFallback,
});

export const preloadArtifactsGallery = () =>
  import("@/components/showcase/ArtifactsGallery").then(
    (mod) => mod.ArtifactsGallery,
  );

export const LazyArtifactsGallery = dynamic(preloadArtifactsGallery, {
  loading: ShowcaseTabPanelFallback,
});

export const preloadHighlightPickerModal = () =>
  import("@/components/showcase/ShowcaseHighlightPickerModal").then(
    (mod) => mod.ShowcaseHighlightPickerModal,
  );

export const ShowcaseHighlightPickerModal = dynamic(
  preloadHighlightPickerModal,
  {
    ssr: false,
  },
);

export const preloadPreviewCardModal = () =>
  import("@/components/showcase/ProfilePreviewCardModal").then(
    (mod) => mod.ProfilePreviewCardModal,
  );

export const ProfilePreviewCardModal = dynamic(preloadPreviewCardModal, {
  ssr: false,
});
