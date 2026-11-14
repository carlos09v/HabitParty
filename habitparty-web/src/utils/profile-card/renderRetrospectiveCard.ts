import {
  drawMetricBox,
  drawRoundedRect,
  drawTruncatedText,
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
  const focusHours = retro
    ? Math.round((retro.focusMinutes / 60) * 10) / 10
    : 0;

  const activeDaysSub =
    input.labels.retroActiveDaysSub || (retro?.year ? `${retro.year}` : null);
  const rarestTitle =
    input.rarestAchievementTitle ||
    retro?.rarestAchievementTitle ||
    input.labels.retroNoRarest;
  const rarityLabel =
    input.rarestAchievementRarityLabel || retro?.rarestAchievementRarity;
  const rarestSub = rarityLabel
    ? `${retro?.achievementsUnlockedCount ?? 0} • ${rarityLabel}`
    : `${retro?.achievementsUnlockedCount ?? 0}`;

  drawMetricBox(
    ctx,
    54,
    row1Y,
    colW,
    110,
    input.labels.retroActiveDaysLabel,
    `${retro?.activeDays ?? 0}`,
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
    `${retro?.tasksCompleted ?? 0}`,
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
    `${focusHours}h`,
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
    `${(retro?.xpEarned ?? 0).toLocaleString()}`,
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
    input.bestMonthLabel || input.labels.retroNoBestMonth,
    retro?.bestMonth ? input.labels.retroBestMonthSub : null,
    "#FB923C",
    palette,
  );
  drawMetricBox(
    ctx,
    54 + (colW + gap) * 2,
    row2Y,
    colW,
    110,
    input.labels.retroRarestLabel,
    rarestTitle,
    rarestSub,
    "#E879F9",
    palette,
  );
}
