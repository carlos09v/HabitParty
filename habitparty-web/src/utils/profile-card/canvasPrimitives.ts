import {
  type AvatarPresetOption,
  resolveAvatarPreset,
} from "@/constants/cosmetics";
import { FRAME_GRADIENTS } from "./palettes";
import type { ProfileCardRenderInput, ThemePalette } from "./types";

const MAX_CACHED_IMAGES = 24;
const imageCache = new Map<string, HTMLImageElement | null>();
const inflightImages = new Map<string, Promise<HTMLImageElement | null>>();

export function resolveImageSource(url?: string | null): string | null {
  if (!url) return null;
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("data:")
  ) {
    return url;
  }
  if (url.startsWith("/")) {
    const base = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
    return base ? `${base}${url}` : url;
  }
  return url;
}

function setCachedImage(key: string, value: HTMLImageElement | null): void {
  if (imageCache.size >= MAX_CACHED_IMAGES) {
    const oldestKey = imageCache.keys().next().value;
    if (oldestKey) imageCache.delete(oldestKey);
  }
  imageCache.set(key, value);
}

/** Loads a CORS-safe image with deduplication and bounded in-memory caching. */
export async function loadCorsSafeImage(
  url?: string | null,
): Promise<HTMLImageElement | null> {
  const resolved = resolveImageSource(url);
  if (!resolved || typeof window === "undefined") return null;

  if (imageCache.has(resolved)) {
    return imageCache.get(resolved) ?? null;
  }

  const inflight = inflightImages.get(resolved);
  if (inflight) {
    return inflight;
  }

  const promise = new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    const finish = (result: HTMLImageElement | null) => {
      inflightImages.delete(resolved);
      setCachedImage(resolved, result);
      resolve(result);
    };
    const timer = globalThis.setTimeout(() => finish(null), 2500);
    img.onload = () => {
      globalThis.clearTimeout(timer);
      finish(img);
    };
    img.onerror = () => {
      globalThis.clearTimeout(timer);
      finish(null);
    };
    img.src = resolved;
  });

  inflightImages.set(resolved, promise);
  return promise;
}

export function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function truncateTextToWidth(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  minLength = 1,
): { text: string; truncated: boolean } {
  if (ctx.measureText(text).width <= maxWidth) {
    return { text, truncated: false };
  }
  let output = text;
  while (
    output.length > minLength &&
    ctx.measureText(`${output}…`).width > maxWidth
  ) {
    output = output.slice(0, -1);
  }
  return { text: `${output}…`, truncated: true };
}

export function drawTruncatedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
): void {
  const { text: output } = truncateTextToWidth(ctx, text, maxWidth);
  ctx.fillText(output, x, y);
}

export function wrapTextLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (ctx.measureText(next).width <= maxWidth) {
      current = next;
    } else {
      if (current) lines.push(current);
      current = word;
      if (lines.length === maxLines - 1) break;
    }
  }

  if (current && lines.length < maxLines) {
    lines.push(current);
  }

  if (lines.length === maxLines) {
    const last = lines[maxLines - 1];
    const { text: truncatedLast, truncated } = truncateTextToWidth(
      ctx,
      last,
      maxWidth,
    );
    if (truncated || words.join(" ").length > lines.join(" ").length) {
      lines[maxLines - 1] = truncatedLast;
    }
  }

  return lines;
}

export function drawBadgePill(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  bg: string,
  border: string,
  color: string,
  font = "800 13px system-ui, -apple-system, sans-serif",
): number {
  ctx.save();
  ctx.font = font;
  const textWidth = ctx.measureText(text).width;
  const width = textWidth + 24;
  const height = 30;
  drawRoundedRect(ctx, x, y, width, height, 15);
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.strokeStyle = border;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = color;
  ctx.textBaseline = "middle";
  ctx.fillText(text, x + 12, y + height / 2);
  ctx.restore();
  return width;
}

function drawPresetVectorEmblem(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  preset: AvatarPresetOption,
): void {
  const s = radius * 0.44;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = preset.iconColorHex;
  ctx.fillStyle = preset.iconColorHex;
  ctx.lineWidth = Math.max(2.2, radius * 0.065);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  switch (preset.shapeKind) {
    case "crown": {
      ctx.beginPath();
      ctx.moveTo(-s * 0.85, s * 0.52);
      ctx.lineTo(-s * 0.95, -s * 0.35);
      ctx.lineTo(-s * 0.38, s * 0.08);
      ctx.lineTo(0, -s * 0.62);
      ctx.lineTo(s * 0.38, s * 0.08);
      ctx.lineTo(s * 0.95, -s * 0.35);
      ctx.lineTo(s * 0.85, s * 0.52);
      ctx.closePath();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-s * 0.78, s * 0.76);
      ctx.lineTo(s * 0.78, s * 0.76);
      ctx.stroke();
      break;
    }
    case "shield": {
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.86);
      ctx.lineTo(s * 0.76, -s * 0.52);
      ctx.quadraticCurveTo(s * 0.76, s * 0.32, 0, s * 0.88);
      ctx.quadraticCurveTo(-s * 0.76, s * 0.32, -s * 0.76, -s * 0.52);
      ctx.closePath();
      ctx.stroke();
      break;
    }
    case "compass": {
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.86, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(s * 0.45, -s * 0.45);
      ctx.lineTo(s * 0.14, s * 0.14);
      ctx.lineTo(-s * 0.45, s * 0.45);
      ctx.lineTo(-s * 0.14, -s * 0.14);
      ctx.closePath();
      ctx.stroke();
      break;
    }
    case "target": {
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.85, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.42, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.12, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "zap": {
      ctx.beginPath();
      ctx.moveTo(s * 0.12, -s * 0.92);
      ctx.lineTo(-s * 0.64, s * 0.08);
      ctx.lineTo(s * 0.02, s * 0.08);
      ctx.lineTo(-s * 0.16, s * 0.92);
      ctx.lineTo(s * 0.64, -s * 0.1);
      ctx.lineTo(-s * 0.02, -s * 0.1);
      ctx.closePath();
      ctx.stroke();
      break;
    }
    case "book": {
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.62);
      ctx.lineTo(0, s * 0.72);
      ctx.moveTo(0, -s * 0.62);
      ctx.quadraticCurveTo(-s * 0.48, -s * 0.78, -s * 0.88, -s * 0.56);
      ctx.lineTo(-s * 0.88, s * 0.56);
      ctx.quadraticCurveTo(-s * 0.48, s * 0.38, 0, s * 0.72);
      ctx.moveTo(0, -s * 0.62);
      ctx.quadraticCurveTo(s * 0.48, -s * 0.78, s * 0.88, -s * 0.56);
      ctx.lineTo(s * 0.88, s * 0.56);
      ctx.quadraticCurveTo(s * 0.48, s * 0.38, 0, s * 0.72);
      ctx.stroke();
      break;
    }
    case "award": {
      ctx.beginPath();
      ctx.arc(0, -s * 0.22, s * 0.56, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-s * 0.32, s * 0.26);
      ctx.lineTo(-s * 0.44, s * 0.88);
      ctx.lineTo(0, s * 0.62);
      ctx.lineTo(s * 0.44, s * 0.88);
      ctx.lineTo(s * 0.32, s * 0.26);
      ctx.stroke();
      break;
    }
    case "sprout": {
      ctx.beginPath();
      ctx.moveTo(0, s * 0.78);
      ctx.lineTo(0, -s * 0.12);
      ctx.moveTo(0, s * 0.08);
      ctx.quadraticCurveTo(-s * 0.85, -s * 0.08, -s * 0.75, -s * 0.68);
      ctx.quadraticCurveTo(-s * 0.15, -s * 0.68, 0, -s * 0.12);
      ctx.moveTo(0, s * 0.24);
      ctx.quadraticCurveTo(s * 0.85, s * 0.08, s * 0.75, -s * 0.52);
      ctx.quadraticCurveTo(s * 0.15, -s * 0.52, 0, s * 0.04);
      ctx.stroke();
      break;
    }
    case "footprints": {
      ctx.beginPath();
      ctx.ellipse(
        -s * 0.36,
        -s * 0.22,
        s * 0.22,
        s * 0.38,
        -0.15,
        0,
        Math.PI * 2,
      );
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(s * 0.36, s * 0.22, s * 0.22, s * 0.38, 0.15, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }
    case "briefcase": {
      ctx.beginPath();
      ctx.roundRect(-s * 0.78, -s * 0.34, s * 1.56, s * 1.02, s * 0.18);
      ctx.moveTo(-s * 0.32, -s * 0.34);
      ctx.lineTo(-s * 0.32, -s * 0.64);
      ctx.lineTo(s * 0.32, -s * 0.64);
      ctx.lineTo(s * 0.32, -s * 0.34);
      ctx.stroke();
      break;
    }
    case "sparkles": {
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.88);
      ctx.quadraticCurveTo(s * 0.08, -s * 0.08, s * 0.88, 0);
      ctx.quadraticCurveTo(s * 0.08, s * 0.08, 0, s * 0.88);
      ctx.quadraticCurveTo(-s * 0.08, s * 0.08, -s * 0.88, 0);
      ctx.quadraticCurveTo(-s * 0.08, -s * 0.08, 0, -s * 0.88);
      ctx.closePath();
      ctx.stroke();
      break;
    }
    default:
      break;
  }
  ctx.restore();
}

export function drawAvatar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  avatarImg: HTMLImageElement | null,
  name: string,
  frameId: string | null | undefined,
  avatarPreset: string | null | undefined,
  isPremium: boolean | undefined,
  palette: ThemePalette,
): void {
  const activeFrameColors =
    frameId && frameId !== "none" ? FRAME_GRADIENTS[frameId] : undefined;
  const ringColors =
    activeFrameColors ?? (isPremium ? ["#FACC15", "#F59E0B"] : null);

  ctx.save();
  if (ringColors) {
    const ringGrad = ctx.createLinearGradient(
      cx - radius,
      cy - radius,
      cx + radius,
      cy + radius,
    );
    ringGrad.addColorStop(0, ringColors[0]);
    ringGrad.addColorStop(1, ringColors[1]);

    ctx.beginPath();
    ctx.arc(cx, cy, radius + 5, 0, Math.PI * 2);
    ctx.fillStyle = ringGrad;
    ctx.fill();
  }

  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.clip();

  const resolvedPreset = resolveAvatarPreset(avatarPreset);
  if (resolvedPreset) {
    const presetGrad = ctx.createLinearGradient(
      cx - radius,
      cy - radius,
      cx + radius,
      cy + radius,
    );
    presetGrad.addColorStop(0, resolvedPreset.canvasColors[0]);
    presetGrad.addColorStop(1, resolvedPreset.canvasColors[1]);
    ctx.fillStyle = presetGrad;
    ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);

    ctx.beginPath();
    ctx.arc(cx, cy, radius - 5, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.28)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    drawPresetVectorEmblem(ctx, cx, cy, radius, resolvedPreset);
  } else if (avatarImg) {
    const imgRatio = avatarImg.width / avatarImg.height;
    const targetSize = radius * 2;
    let drawW = targetSize;
    let drawH = targetSize;
    if (imgRatio > 1) {
      drawW = targetSize * imgRatio;
    } else {
      drawH = targetSize / imgRatio;
    }
    ctx.drawImage(avatarImg, cx - drawW / 2, cy - drawH / 2, drawW, drawH);
  } else {
    ctx.fillStyle = palette.avatarFallbackBg;
    ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
    const initials =
      name
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join("") || "HP";
    ctx.fillStyle = palette.textPrimary;
    ctx.font = "800 36px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(initials, cx, cy + 2);
  }
  ctx.restore();
}

export function drawMetricBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  value: string,
  subValue: string | null,
  accentColor: string,
  palette: ThemePalette,
): void {
  ctx.save();
  drawRoundedRect(ctx, x, y, w, h, 18);
  ctx.fillStyle = palette.panelBg;
  ctx.fill();
  ctx.strokeStyle = palette.panelBorder;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  drawRoundedRect(ctx, x + 16, y + 18, 4, h - 36, 2);
  ctx.fillStyle = accentColor;
  ctx.fill();

  ctx.textBaseline = "top";
  ctx.fillStyle = palette.textMuted;
  ctx.font = "700 13px system-ui, -apple-system, sans-serif";
  drawTruncatedText(ctx, label.toUpperCase(), x + 32, y + 18, w - 48);

  ctx.fillStyle = palette.textPrimary;
  ctx.font = "900 30px system-ui, -apple-system, sans-serif";
  drawTruncatedText(ctx, value, x + 32, y + 40, w - 48);

  if (subValue) {
    ctx.fillStyle = palette.textSecondary;
    ctx.font = "600 13px system-ui, -apple-system, sans-serif";
    drawTruncatedText(ctx, subValue, x + 32, y + 80, w - 48);
  }
  ctx.restore();
}

export function drawCardBackdrop(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  theme: "dark" | "light",
  palette: ThemePalette,
): void {
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, palette.bgStart);
  bgGrad.addColorStop(1, palette.bgEnd);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  const topRightGlow = ctx.createRadialGradient(
    width * 0.9,
    height * 0.12,
    10,
    width * 0.9,
    height * 0.12,
    380,
  );
  topRightGlow.addColorStop(
    0,
    theme === "dark" ? "rgba(237, 229, 57, 0.14)" : "rgba(245, 158, 11, 0.14)",
  );
  topRightGlow.addColorStop(1, "transparent");
  ctx.fillStyle = topRightGlow;
  ctx.fillRect(0, 0, width, height);

  const bottomLeftGlow = ctx.createRadialGradient(
    width * 0.12,
    height * 0.9,
    10,
    width * 0.12,
    height * 0.9,
    420,
  );
  bottomLeftGlow.addColorStop(
    0,
    theme === "dark" ? "rgba(139, 92, 246, 0.22)" : "rgba(124, 58, 237, 0.12)",
  );
  bottomLeftGlow.addColorStop(1, "transparent");
  ctx.fillStyle = bottomLeftGlow;
  ctx.fillRect(0, 0, width, height);

  drawRoundedRect(ctx, 24, 24, width - 48, height - 48, 28);
  ctx.strokeStyle = palette.panelBorder;
  ctx.lineWidth = 2;
  ctx.stroke();
}

export function drawCardHeaderAndIdentity(
  ctx: CanvasRenderingContext2D,
  input: ProfileCardRenderInput,
  avatarImg: HTMLImageElement | null,
  width: number,
  palette: ThemePalette,
): void {
  const topY = 50;
  ctx.textBaseline = "middle";
  ctx.fillStyle = palette.gold;
  ctx.font = "900 20px system-ui, -apple-system, sans-serif";
  ctx.fillText(input.labels.brandName.toUpperCase(), 54, topY + 15);

  const brandWidth = ctx.measureText(
    input.labels.brandName.toUpperCase(),
  ).width;
  drawBadgePill(
    ctx,
    input.labels.headerBadge,
    54 + brandWidth + 18,
    topY,
    palette.goldSoftBg,
    palette.goldBorder,
    palette.gold,
  );

  let rightCursor = width - 54;
  if (
    input.includeFriendCode &&
    input.user.friendCode &&
    input.user.friendCode.trim().length > 0
  ) {
    const codeText = `${input.labels.friendCodeLabel}: ${input.user.friendCode}`;
    ctx.font = "800 13px monospace";
    const badgeWidth = ctx.measureText(codeText).width + 26;
    rightCursor -= badgeWidth;
    drawBadgePill(
      ctx,
      codeText,
      rightCursor,
      topY,
      palette.panelBg,
      palette.goldBorder,
      palette.textPrimary,
      "800 13px monospace",
    );
    rightCursor -= 10;
  }

  if (input.user.isPremium) {
    ctx.font = "800 13px system-ui, -apple-system, sans-serif";
    const badgeWidth = ctx.measureText(input.labels.vipLabel).width + 24;
    rightCursor -= badgeWidth;
    drawBadgePill(
      ctx,
      input.labels.vipLabel,
      rightCursor,
      topY,
      palette.goldSoftBg,
      palette.goldBorder,
      palette.gold,
    );
    rightCursor -= 10;
  }

  if (input.user.isFounder) {
    ctx.font = "800 13px system-ui, -apple-system, sans-serif";
    const badgeWidth = ctx.measureText(input.labels.founderLabel).width + 24;
    rightCursor -= badgeWidth;
    drawBadgePill(
      ctx,
      input.labels.founderLabel,
      rightCursor,
      topY,
      "rgba(139, 92, 246, 0.18)",
      "rgba(167, 139, 250, 0.55)",
      palette.textPrimary,
    );
  }

  const identityY = 112;
  const avatarRadius = 52;
  drawAvatar(
    ctx,
    112,
    identityY + avatarRadius + 4,
    avatarRadius,
    avatarImg,
    input.user.fullName || input.user.username,
    input.user.avatarFrame,
    input.user.avatarPreset,
    input.user.isPremium,
    palette,
  );

  const infoX = 192;
  const infoMaxW = 640;

  ctx.textBaseline = "top";
  ctx.fillStyle = palette.textPrimary;
  ctx.font = "900 34px system-ui, -apple-system, sans-serif";
  drawTruncatedText(
    ctx,
    input.user.fullName || input.user.username,
    infoX,
    identityY + 4,
    infoMaxW,
  );

  const handleText = `@${input.user.username}`;
  ctx.fillStyle = palette.textMuted;
  ctx.font = "600 18px system-ui, -apple-system, sans-serif";
  const handleWidth = ctx.measureText(handleText).width;
  ctx.fillText(handleText, infoX, identityY + 46);

  if (
    input.equippedTitleLabel &&
    input.equippedTitleLabel.trim().length > 0 &&
    infoMaxW - handleWidth - 16 > 80
  ) {
    const pillX = infoX + handleWidth + 12;
    const maxPillTextW = infoMaxW - handleWidth - 38;
    const titleFont = "800 12px system-ui, -apple-system, sans-serif";
    ctx.save();
    ctx.font = titleFont;
    const { text: titleOut } = truncateTextToWidth(
      ctx,
      `✦ ${input.equippedTitleLabel.trim()}`,
      maxPillTextW,
      2,
    );
    ctx.restore();

    drawBadgePill(
      ctx,
      titleOut,
      pillX,
      identityY + 42,
      palette.goldSoftBg,
      palette.goldBorder,
      palette.gold,
      titleFont,
    );
  }

  if (input.user.bio && input.user.bio.trim().length > 0) {
    ctx.fillStyle = palette.textSecondary;
    ctx.font = "500 15px system-ui, -apple-system, sans-serif";
    const bioLines = wrapTextLines(ctx, input.user.bio, infoMaxW, 2);
    bioLines.forEach((line, idx) => {
      ctx.fillText(line, infoX, identityY + 78 + idx * 20);
    });
  }

  const levelBoxW = 290;
  const levelBoxX = width - 54 - levelBoxW;
  drawRoundedRect(ctx, levelBoxX, identityY + 4, levelBoxW, 102, 18);
  ctx.fillStyle = palette.panelBg;
  ctx.fill();
  ctx.strokeStyle = palette.panelBorder;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = palette.textMuted;
  ctx.font = "700 12px system-ui, -apple-system, sans-serif";
  ctx.fillText(
    input.labels.levelLabel.toUpperCase(),
    levelBoxX + 18,
    identityY + 20,
  );

  ctx.fillStyle = palette.textPrimary;
  ctx.font = "800 20px system-ui, -apple-system, sans-serif";
  drawTruncatedText(
    ctx,
    input.levelTitle,
    levelBoxX + 18,
    identityY + 40,
    levelBoxW - 70,
  );

  ctx.fillStyle = palette.gold;
  ctx.font = "900 16px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(
    `${Math.round(input.levelProgressPercent)}%`,
    levelBoxX + levelBoxW - 18,
    identityY + 42,
  );
  ctx.textAlign = "left";

  const barX = levelBoxX + 18;
  const barY = identityY + 76;
  const barW = levelBoxW - 36;
  drawRoundedRect(ctx, barX, barY, barW, 10, 5);
  ctx.fillStyle = palette.barTrack;
  ctx.fill();

  const fillW = Math.max(
    12,
    (barW * Math.min(100, Math.max(0, input.levelProgressPercent))) / 100,
  );
  const barGrad = ctx.createLinearGradient(barX, barY, barX + barW, barY);
  barGrad.addColorStop(0, "#F59E0B");
  barGrad.addColorStop(1, "#FACC15");
  drawRoundedRect(ctx, barX, barY, fillW, 10, 5);
  ctx.fillStyle = barGrad;
  ctx.fill();
}

export function drawCardFooter(
  ctx: CanvasRenderingContext2D,
  input: ProfileCardRenderInput,
  width: number,
  height: number,
  palette: ThemePalette,
): void {
  ctx.textBaseline = "bottom";
  ctx.fillStyle = palette.textMuted;
  ctx.font = "600 14px system-ui, -apple-system, sans-serif";
  ctx.fillText(input.labels.generatedBy, 54, height - 42);

  ctx.textAlign = "right";
  ctx.fillText(`@${input.user.username}`, width - 54, height - 42);
  ctx.textAlign = "left";
}
