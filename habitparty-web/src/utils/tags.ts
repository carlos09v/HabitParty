import {
  MAX_TAG_PATH_LENGTH,
  MAX_TAG_SEGMENT_LENGTH,
  MAX_TASK_TAGS,
  TAG_HIERARCHY_SEPARATOR,
} from "@/constants/task";
import type { Task } from "@/types/task";

/**
 * Splits a flat or nested tag string into trimmed, segment-length-clamped parts.
 */
export function getTagSegments(tag: string): string[] {
  if (!tag) return [];
  return tag
    .split(">")
    .map((segment) => segment.trim().slice(0, MAX_TAG_SEGMENT_LENGTH))
    .filter(Boolean);
}

/**
 * Checks whether a raw input contains malformed empty hierarchy levels (e.g. "Concurso > " or "> BB").
 */
export function hasEmptyTagHierarchyLevel(rawTag: string): boolean {
  if (!rawTag.includes(">")) return false;
  return rawTag.split(">").some((segment) => segment.trim().length === 0);
}

/**
 * Normalizes a tag path into canonical "Parent > Child" spacing while honoring
 * per-segment and full-path character limits.
 */
export function normalizeTagPath(rawTag: string): string {
  const segments = getTagSegments(rawTag);
  if (segments.length === 0) return "";

  const joined = segments.join(TAG_HIERARCHY_SEPARATOR);
  if (joined.length <= MAX_TAG_PATH_LENGTH) {
    return joined;
  }

  const fitted: string[] = [];
  for (const segment of segments) {
    const candidate =
      fitted.length === 0
        ? segment
        : `${fitted.join(TAG_HIERARCHY_SEPARATOR)}${TAG_HIERARCHY_SEPARATOR}${segment}`;
    if (candidate.length > MAX_TAG_PATH_LENGTH) {
      break;
    }
    fitted.push(segment);
  }

  return fitted.length > 0
    ? fitted.join(TAG_HIERARCHY_SEPARATOR)
    : segments[0].slice(0, MAX_TAG_PATH_LENGTH);
}

/**
 * Returns only the leaf segment for compact card/row display ("Concurso > BB" -> "BB").
 */
export function getTagLeafLabel(tag: string): string {
  const segments = getTagSegments(tag);
  return segments.length > 0 ? segments[segments.length - 1] : tag.trim();
}

/**
 * Returns every ancestor path up to and including the tag itself.
 * Example: "Concurso > BB > TI" -> ["Concurso", "Concurso > BB", "Concurso > BB > TI"].
 */
export function getTagAncestorPaths(tag: string): string[] {
  const segments = getTagSegments(tag);
  if (segments.length === 0) return [];
  const paths: string[] = [];
  for (let i = 1; i <= segments.length; i++) {
    paths.push(segments.slice(0, i).join(TAG_HIERARCHY_SEPARATOR));
  }
  return paths;
}

/**
 * Zero-based hierarchy depth ("Concurso" -> 0, "Concurso > BB" -> 1).
 */
export function getTagDepth(tag: string): number {
  const segments = getTagSegments(tag);
  return Math.max(0, segments.length - 1);
}

/**
 * Collects unique normalized tags from tasks and exposes every ancestor level automatically
 * so parent tags like "Concurso" appear in selectors and filters even when tasks only store
 * nested paths like "Concurso > BB".
 */
export function extractAvailableTagOptions(
  tasks: ReadonlyArray<Pick<Task, "tags">>,
): string[] {
  const byLowerKey = new Map<string, string>();

  for (const task of tasks) {
    if (!Array.isArray(task.tags)) continue;
    for (const rawTag of task.tags) {
      const normalized = normalizeTagPath(rawTag);
      if (!normalized) continue;
      for (const ancestorOrSelf of getTagAncestorPaths(normalized)) {
        const key = ancestorOrSelf.toLowerCase();
        if (!byLowerKey.has(key)) {
          byLowerKey.set(key, ancestorOrSelf);
        }
      }
    }
  }

  return Array.from(byLowerKey.values(), (tag) => ({
    tag,
    segments: getTagSegments(tag),
  }))
    .sort((a, b) => {
      const minLen = Math.min(a.segments.length, b.segments.length);
      for (let i = 0; i < minLen; i++) {
        const comparison = a.segments[i].localeCompare(
          b.segments[i],
          undefined,
          {
            sensitivity: "base",
          },
        );
        if (comparison !== 0) return comparison;
      }
      return a.segments.length - b.segments.length;
    })
    .map((entry) => entry.tag);
}

export interface MergeTaskTagsResult {
  nextTags: string[];
  addedAny: boolean;
  errorKey: "maxTagsError" | "tagAlreadyAdded" | null;
}

/**
 * Mescla tags candidatas em `existingTags` respeitando o limite máximo e unicidade
 * case-insensitive, retornando a lista atualizada e a chave de erro prioritária.
 */
export function mergeTaskTagsWithLimit(
  existingTags: string[],
  candidates: string[],
  maxTags: number = MAX_TASK_TAGS,
): MergeTaskTagsResult {
  if (candidates.length === 0) {
    return { nextTags: existingTags, addedAny: false, errorKey: null };
  }

  if (existingTags.length >= maxTags) {
    return {
      nextTags: existingTags,
      addedAny: false,
      errorKey: "maxTagsError",
    };
  }

  const nextTags = [...existingTags];
  const seenLower = new Set(existingTags.map((item) => item.toLowerCase()));
  let addedAny = false;
  let hadDuplicate = false;
  let hitLimit = false;

  for (const candidate of candidates) {
    if (nextTags.length >= maxTags) {
      hitLimit = true;
      break;
    }
    const lower = candidate.toLowerCase();
    if (seenLower.has(lower)) {
      hadDuplicate = true;
      continue;
    }
    seenLower.add(lower);
    nextTags.push(candidate);
    addedAny = true;
  }

  if (hitLimit) {
    return { nextTags, addedAny, errorKey: "maxTagsError" };
  }
  if (!addedAny && hadDuplicate) {
    return {
      nextTags: existingTags,
      addedAny: false,
      errorKey: "tagAlreadyAdded",
    };
  }
  return { nextTags, addedAny, errorKey: null };
}

/**
 * Matches exact tags and hierarchical descendants when filtering by a parent tag.
 * Filtering by "Concurso" matches "Concurso" as well as "Concurso > BB".
 */
export function doesTaskMatchTagFilter(
  task: Pick<Task, "tags" | "category">,
  filterTag: string,
): boolean {
  const normalizedFilter = normalizeTagPath(filterTag).toLowerCase();
  if (!normalizedFilter) return true;

  const taskTags = Array.isArray(task.tags) ? task.tags : [];
  const matchesTaskTags = taskTags.some((rawTag) => {
    const normalizedTag = normalizeTagPath(rawTag).toLowerCase();
    return (
      normalizedTag === normalizedFilter ||
      normalizedTag.startsWith(`${normalizedFilter}${TAG_HIERARCHY_SEPARATOR}`)
    );
  });

  if (matchesTaskTags) {
    return true;
  }

  if (task.category && task.category !== "Geral") {
    const normalizedCategory = normalizeTagPath(task.category).toLowerCase();
    return (
      normalizedCategory === normalizedFilter ||
      normalizedCategory.startsWith(
        `${normalizedFilter}${TAG_HIERARCHY_SEPARATOR}`,
      )
    );
  }

  return false;
}
