import { resolveAvatarPreset } from "@/constants/avatarPresets";
import { downloadBlob } from "@/utils/download";
import {
  drawCardBackdrop,
  drawCardFooter,
  drawCardHeaderAndIdentity,
  loadCorsSafeImage,
} from "./canvasPrimitives";
import { DARK_PALETTE, LIGHT_PALETTE } from "./palettes";
import { renderProfileBody } from "./renderProfileCard";
import { renderRetrospectiveBody } from "./renderRetrospectiveCard";
import {
  CARD_DIMENSIONS,
  type CardRenderHighlight,
  type ProfileCardRenderInput,
  type ProfileCardRenderLabels,
  type ProfileCardRenderOptions,
} from "./types";

export {
  CARD_DIMENSIONS,
  type CardRenderHighlight,
  type ProfileCardRenderInput,
  type ProfileCardRenderLabels,
  type ProfileCardRenderOptions,
};

/**
 * Renders the shareable profile or retrospective card onto a canvas.
 * Awaits the avatar image before mutating canvas dimensions so aborted
 * renders never blank an active preview canvas or overlap with newer draws.
 */
export async function renderProfileOrRetrospectiveCanvas(
  canvas: HTMLCanvasElement,
  input: ProfileCardRenderInput,
  pixelRatio = 2,
  options?: ProfileCardRenderOptions,
): Promise<void> {
  const { width, height } = CARD_DIMENSIONS[input.mode];
  const palette = input.theme === "dark" ? DARK_PALETTE : LIGHT_PALETTE;
  const resolvedPreset = resolveAvatarPreset(input.user.avatarPreset);
  const avatarImg = resolvedPreset
    ? null
    : await loadCorsSafeImage(input.user.profilePhotoUrl);

  if (options?.signal?.aborted) {
    return;
  }

  canvas.width = width * pixelRatio;
  canvas.height = height * pixelRatio;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.save();
  ctx.scale(pixelRatio, pixelRatio);

  drawCardBackdrop(ctx, width, height, input.theme, palette);
  drawCardHeaderAndIdentity(ctx, input, avatarImg, width, palette);

  if (input.mode === "profile") {
    renderProfileBody(ctx, input, width, palette);
  } else {
    renderRetrospectiveBody(ctx, input, width, palette);
  }

  drawCardFooter(ctx, input, width, height, palette);
  ctx.restore();
}

export async function exportCanvasToPngBlob(
  canvas: HTMLCanvasElement,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Canvas PNG conversion failed"));
          return;
        }
        resolve(blob);
      },
      "image/png",
      1,
    );
  });
}

export function triggerPngBlobDownload(blob: Blob, filename: string): void {
  downloadBlob(blob, filename, "image/png");
}
