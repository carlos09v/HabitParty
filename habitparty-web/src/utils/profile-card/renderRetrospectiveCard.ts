import { getCachedNumberFormat } from "@/utils/economy";
import { capitalizeFirst, formatFocusHours } from "@/utils/showcaseUtils";
import {
  drawMetricBox,
  drawRoundedRect,
  drawTruncatedText,
  wrapTextLines,
} from "./canvasPrimitives";
import type { ProfileCardRenderInput, ThemePalette } from "./types";

export function renderRetrospectiveBody(
  ctx: CanvasRenderingContext2D,
  input: ProfileCardRenderInput,
  width: number,
  palette: ThemePalette,
): void {
  const retro = input.retrospective;
  const archY = 250;
  const numFmt = getCachedNumberFormat(input.locale || undefined);

  drawRoundedRect(ctx, 54, archY, width - 108, 96, 20);
  ctx.fillStyle = palette.goldSoftBg;
  ctx.fill();
  ctx.strokeStyle = palette.goldBorder;
  ctx.lineWidth = 1.8;
  ctx.stroke();

  ctx.fillStyle = palette.gold;
  ctx.font = "800 12px system-ui, -apple-system, sans-serif";
  ctx.fillText(input.labels.retroArchetypeLabel.toUpperCase(), 78, archY + 18);

  ctx.fillStyle = palette.textPrimary;
  ctx.font = "900 26px system-ui, -apple-system, sans-serif";
  drawTruncatedText(
    ctx,
    input.archetypeTitle || retro?.archetype || "RISING_SPARK",
    78,
    archY + 38,
    width - 156,
  );

  if (input.archetypeDesc) {
    ctx.fillStyle = palette.textSecondary;
    ctx.font = "500 14px system-ui, -apple-system, sans-serif";
    drawTruncatedText(ctx, input.archetypeDesc, 78, archY + 69, width - 156);
  }

  const row1Y = 368;
  const row2Y = 496;
  const gap = 18;
  const colW = (width - 108 - gap * 2) / 3;
  const focusHours = formatFocusHours(retro?.focusMinutes);

  const activeDaysSub =
    input.labels.retroActiveDaysSub || (retro?.year ? `${retro.year}` : null);
  const rarestTitle =
    input.rarestAchievementTitle ||
    retro?.rarestAchievementTitle ||
    input.labels.retroNoRarest;
  const rarityLabel =
    input.rarestAchievementRarityLabel || retro?.rarestAchievementRarity;
  const rarestSub = rarityLabel
    ? `${numFmt.format(retro?.achievementsUnlockedCount ?? 0)} • ${rarityLabel}`
    : numFmt.format(retro?.achievementsUnlockedCount ?? 0);
  const bestMonthDisplay =
    capitalizeFirst(input.bestMonthLabel, input.locale) ||
    input.labels.retroNoBestMonth;

  drawMetricBox(
    ctx,
    54,
    row1Y,
    colW,
    110,
    input.labels.retroActiveDaysLabel,
    numFmt.format(retro?.activeDays ?? 0),
    activeDaysSub,
    "#34D399",
    palette,
  );
  drawMetricBox(
    ctx,
    54 + colW + gap,
    row1Y,
    colW,
    110,
    input.labels.retroTasksLabel,
    numFmt.format(retro?.tasksCompleted ?? 0),
    input.labels.retroHardTasksSub,
    "#38BDF8",
    palette,
  );
  drawMetricBox(
    ctx,
    54 + (colW + gap) * 2,
    row1Y,
    colW,
    110,
    input.labels.retroFocusLabel,
    `${numFmt.format(focusHours)}h`,
    input.labels.retroFocusSessionsSub,
    "#A78BFA",
    palette,
  );

  drawMetricBox(
    ctx,
    54,
    row2Y,
    colW,
    110,
    input.labels.retroXpLabel,
    numFmt.format(retro?.xpEarned ?? 0),
    input.labels.retroCoinsSub,
    palette.gold,
    palette,
  );
  drawMetricBox(
    ctx,
    54 + colW + gap,
    row2Y,
    colW,
    110,
    input.labels.retroBestMonthLabel,
    bestMonthDisplay,
    retro?.bestMonth ? input.labels.retroBestMonthSub : null,
    "#FB923C",
    palette,
  );
  // Card da conquista mais rara usa tipografia 20px com quebra em até 2 linhas para evitar corte precoce
  const rarestX = 54 + (colW + gap) * 2;
  const rarestH = 110;
  ctx.save();
  drawRoundedRect(ctx, rarestX, row2Y, colW, rarestH, 18);
  ctx.fillStyle = palette.panelBg;
  ctx.fill();
  ctx.strokeStyle = palette.panelBorder;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  drawRoundedRect(ctx, rarestX + 16, row2Y + 18, 4, rarestH - 36, 2);
  ctx.fillStyle = "#E879F9";
  ctx.fill();

  ctx.textBaseline = "top";
  ctx.fillStyle = palette.textMuted;
  ctx.font = "700 13px system-ui, -apple-system, sans-serif";
  drawTruncatedText(
    ctx,
    input.labels.retroRarestLabel.toUpperCase(),
    rarestX + 32,
    row2Y + 16,
    colW - 48,
  );

  ctx.fillStyle = palette.textPrimary;
  ctx.font = "800 19px system-ui, -apple-system, sans-serif";
  const rarestLines = wrapTextLines(ctx, rarestTitle, colW - 48, 2);
  rarestLines.forEach((line, idx) => {
    ctx.fillText(line, rarestX + 32, row2Y + 37 + idx * 22);
  });

  if (rarestSub) {
    ctx.fillStyle = palette.textSecondary;
    ctx.font = "600 13px system-ui, -apple-system, sans-serif";
    drawTruncatedText(ctx, rarestSub, rarestX + 32, row2Y + 84, colW - 48);
  }
  ctx.restore();
}
