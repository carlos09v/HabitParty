import { getCachedNumberFormat } from "@/utils/economy";
import { formatFocusHours } from "@/utils/showcaseUtils";
import {
  drawMetricBox,
  drawRoundedRect,
  drawTruncatedText,
  wrapTextLines,
} from "./canvasPrimitives";
import type { ProfileCardRenderInput, ThemePalette } from "./types";

export function renderProfileBody(
  ctx: CanvasRenderingContext2D,
  input: ProfileCardRenderInput,
  width: number,
  palette: ThemePalette,
): void {
  const metricsY = 260;
  const gap = 18;
  const cardW = (width - 108 - gap * 3) / 4;
  const stats = input.stats;
  const numFmt = getCachedNumberFormat(input.locale || undefined);
  const focusHours = formatFocusHours(stats?.totalFocusMinutes);

  drawMetricBox(
    ctx,
    54,
    metricsY,
    cardW,
    108,
    input.labels.metricStreakLabel,
    stats ? `${numFmt.format(stats.highestStreak)}d` : "—",
    null,
    "#FB923C",
    palette,
  );
  drawMetricBox(
    ctx,
    54 + cardW + gap,
    metricsY,
    cardW,
    108,
    input.labels.metricTasksLabel,
    stats ? numFmt.format(stats.totalTasksCompleted) : "—",
    null,
    "#38BDF8",
    palette,
  );
  drawMetricBox(
    ctx,
    54 + (cardW + gap) * 2,
    metricsY,
    cardW,
    108,
    input.labels.metricFocusLabel,
    stats ? `${numFmt.format(focusHours)}h` : "—",
    null,
    "#A78BFA",
    palette,
  );
  drawMetricBox(
    ctx,
    54 + (cardW + gap) * 3,
    metricsY,
    cardW,
    108,
    input.labels.metricPointsLabel,
    stats ? numFmt.format(stats.achievementPoints) : "—",
    null,
    palette.gold,
    palette,
  );

  const highlightsY = 398;
  ctx.fillStyle = palette.textMuted;
  ctx.font = "800 13px system-ui, -apple-system, sans-serif";
  ctx.fillText(input.labels.highlightsTitle.toUpperCase(), 54, highlightsY);

  if (input.highlights.length === 0) {
    drawRoundedRect(ctx, 54, highlightsY + 26, width - 108, 114, 18);
    ctx.fillStyle = palette.panelBg;
    ctx.fill();
    ctx.strokeStyle = palette.panelBorder;
    ctx.stroke();
    ctx.fillStyle = palette.textMuted;
    ctx.font = "600 16px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(input.labels.noHighlights, width / 2, highlightsY + 83);
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    return;
  }

  const slotGap = 16;
  const slotW = (width - 108 - slotGap * 3) / 4;
  input.highlights.slice(0, 4).forEach((hl, idx) => {
    const sx = 54 + idx * (slotW + slotGap);
    const sy = highlightsY + 26;
    drawRoundedRect(ctx, sx, sy, slotW, 114, 18);
    ctx.fillStyle = palette.panelBg;
    ctx.fill();
    ctx.strokeStyle = palette.panelBorder;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    drawRoundedRect(ctx, sx + 14, sy + 14, 48, 5, 2.5);
    ctx.fillStyle = hl.accentHex;
    ctx.fill();

    ctx.fillStyle = palette.textMuted;
    ctx.font = "700 11px system-ui, -apple-system, sans-serif";
    drawTruncatedText(
      ctx,
      hl.badge.toUpperCase(),
      sx + 14,
      sy + 28,
      slotW - 28,
    );

    ctx.fillStyle = palette.textPrimary;
    ctx.font = "800 16px system-ui, -apple-system, sans-serif";
    const titleLines = wrapTextLines(ctx, hl.title, slotW - 28, 2);
    titleLines.forEach((line, lIdx) => {
      ctx.fillText(line, sx + 14, sy + 52 + lIdx * 22);
    });
  });
}
