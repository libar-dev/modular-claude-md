/**
 * Index rendering for lightweight layer summary files.
 *
 * Generates ASCII-boxed index content that provides a quick overview
 * of what each layer contains without loading the full content.
 *
 * @module @libar-dev/modular-claude-md/index-gen/renderer
 */

import type { Metadata, AdditiveVariation } from "../types.js";
import { sectionHasMatchingContent, getMatchingSubsections } from "../builder/matcher.js";
import { getModuleHeadings, getModuleLines, type HeadingInfo } from "../info/helpers.js";

// =============================================================================
// Constants
// =============================================================================

/** Fixed outer width of the ASCII box (including border characters). */
const BOX_WIDTH = 64;

/** Inner content width (BOX_WIDTH minus the border chars and their padding). */
const INNER_WIDTH = BOX_WIDTH - 5; // "║  " (3) + " ║" (2) = 5

// =============================================================================
// Box-Drawing Helpers
// =============================================================================

/** Top border: ╔═══...═══╗ */
function topBorder(): string {
  return "\u2554" + "\u2550".repeat(BOX_WIDTH - 2) + "\u2557";
}

/** Bottom border: ╚═══...═══╝ */
function bottomBorder(): string {
  return "\u255A" + "\u2550".repeat(BOX_WIDTH - 2) + "\u255D";
}

/** Horizontal divider: ╠═══...═══╣ */
function divider(): string {
  return "\u2560" + "\u2550".repeat(BOX_WIDTH - 2) + "\u2563";
}

/** Horizontal divider with T-junction: ╠═══╤═══...═══╣ */
function dividerWithJunction(leftWidth: number): string {
  // ╠ + left═s + ╤ + right═s + ╣
  return (
    "\u2560" +
    "\u2550".repeat(leftWidth) +
    "\u2564" +
    "\u2550".repeat(BOX_WIDTH - 2 - leftWidth - 1) +
    "\u2563"
  );
}

/** Horizontal divider with bottom T-junction: ╠═══╧═══...═══╣ */
function dividerWithBottomJunction(leftWidth: number): string {
  return (
    "\u2560" +
    "\u2550".repeat(leftWidth) +
    "\u2567" +
    "\u2550".repeat(BOX_WIDTH - 2 - leftWidth - 1) +
    "\u2563"
  );
}

/**
 * Pad a content line to fill the box width.
 * Format: "║  {text padded to INNER_WIDTH} ║"
 */
function boxLine(text: string): string {
  const truncated = text.length > INNER_WIDTH ? text.substring(0, INNER_WIDTH) : text;
  return "\u2551  " + truncated.padEnd(INNER_WIDTH) + " \u2551";
}

/** Empty box line (just padding). */
function emptyLine(): string {
  return boxLine("");
}

/**
 * Two-column box line with a vertical separator.
 * Format: "║ {left} │ {right padded} ║"
 */
function twoColumnLine(left: string, right: string, leftWidth: number): string {
  // Layout: ║ + leftPadded(leftWidth) + │ + " " + right(rightAvail) + " " + ║
  // Total = 1 + leftWidth + 1 + 1 + rightAvail + 1 + 1 = leftWidth + rightAvail + 5
  // So rightAvail = BOX_WIDTH - leftWidth - 5
  const leftPadded = (" " + left).padEnd(leftWidth);
  const rightAvail = BOX_WIDTH - leftWidth - 5;
  const rightTruncated = right.length > rightAvail ? right.substring(0, rightAvail) : right;
  return "\u2551" + leftPadded + "\u2502" + " " + rightTruncated.padEnd(rightAvail) + " \u2551";
}

// =============================================================================
// Module Info Extraction
// =============================================================================

interface ModuleInfo {
  title: string;
  lines: number;
  subheadings: HeadingInfo[];
}

interface SectionModules {
  sectionTitle: string;
  modules: ModuleInfo[];
}

/**
 * Get the display title for a module.
 * Uses the first ### heading, falling back to description or filename.
 */
function getModuleTitle(baseDir: string, modulePath: string, description?: string): string {
  const headings = getModuleHeadings(baseDir, modulePath);
  const firstH3 = headings.find((h) => h.level === 3);
  if (firstH3) return firstH3.text;

  if (description) return description;

  const fileName = modulePath.split("/").pop() || modulePath;
  return fileName.replace(/\.md$/, "");
}

/**
 * Collect module information grouped by section for a given set of tags.
 */
function collectSectionModules(
  metadata: Metadata,
  tags: string[],
  baseDir: string
): SectionModules[] {
  const result: SectionModules[] = [];

  for (const section of metadata.sections) {
    if (!sectionHasMatchingContent(section, tags)) continue;

    const matchingSubs = getMatchingSubsections(section, tags);
    if (matchingSubs.length === 0) continue;

    const modules: ModuleInfo[] = [];
    for (const sub of matchingSubs) {
      const allHeadings = getModuleHeadings(baseDir, sub.path);
      // The first H3 heading becomes the title; all remaining headings are subheadings
      const firstH3Index = allHeadings.findIndex((h) => h.level === 3);
      const subheadings = firstH3Index >= 0 ? allHeadings.slice(firstH3Index + 1) : allHeadings;

      modules.push({
        title: getModuleTitle(baseDir, sub.path, sub.description),
        lines: getModuleLines(baseDir, sub.path),
        subheadings,
      });
    }

    result.push({
      sectionTitle: section.title,
      modules,
    });
  }

  return result;
}

/**
 * Compute totals from section modules.
 */
function computeTotals(sections: SectionModules[]): { moduleCount: number; lineCount: number } {
  let moduleCount = 0;
  let lineCount = 0;
  for (const sec of sections) {
    for (const mod of sec.modules) {
      moduleCount++;
      lineCount += mod.lines;
    }
  }
  return { moduleCount, lineCount };
}

// =============================================================================
// Public API
// =============================================================================

/**
 * Build index content for an additive layer.
 *
 * Generates a markdown file with an ASCII-boxed summary showing all modules
 * in the layer grouped by section, with line counts and a load command.
 *
 * @param metadata - The metadata configuration
 * @param layer - The additive layer to index
 * @param baseDir - Base directory containing module files
 * @returns Generated index file content
 */
export function buildLayerIndexContent(
  metadata: Metadata,
  layer: AdditiveVariation,
  baseDir: string
): string {
  const sections = collectSectionModules(metadata, layer.tags, baseDir);
  const { moduleCount, lineCount } = computeTotals(sections);

  const lines: string[] = [];

  // Markdown header outside the box
  lines.push(`# ${layer.name} -- Layer Index`);
  lines.push("");
  lines.push(
    `> Summary of the **${layer.name}** layer content. Load the full layer for detailed guidance.`
  );
  lines.push("");

  // ASCII box (wrapped in code fence for monospace rendering in markdown viewers)
  lines.push("```");
  lines.push(topBorder());
  lines.push(boxLine(`LAYER INDEX: ${layer.name}`));
  lines.push(boxLine(`${moduleCount} modules ~ ${lineCount} lines`));
  lines.push(divider());
  lines.push(emptyLine());

  for (const sec of sections) {
    lines.push(boxLine(sec.sectionTitle));
    for (const mod of sec.modules) {
      lines.push(boxLine(`  \u00B7 ${mod.title} (${mod.lines} lines)`));
      for (const heading of mod.subheadings) {
        const indent = heading.level === 3 ? "      " : "        ";
        lines.push(boxLine(`${indent}${heading.text}`));
      }
    }
  }

  lines.push(emptyLine());
  lines.push(boxLine(`Load full layer: /add-dir ${layer.output_dir}`));
  lines.push(bottomBorder());
  lines.push("```");
  lines.push("");

  return lines.join("\n");
}

/**
 * Build index content for the base/core layer.
 *
 * Generates a markdown file with an ASCII-boxed summary of the base layer
 * modules AND a global manifest listing all available additive layers with
 * their descriptions and load commands.
 *
 * @param metadata - The metadata configuration
 * @param baseDir - Base directory containing module files
 * @returns Generated index file content
 */
export function buildBaseIndexContent(metadata: Metadata, baseDir: string): string {
  // Use the default variation's tags for the base layer
  const defaultVariation = metadata.variations[0];
  const baseTags = defaultVariation ? defaultVariation.tags : ["core-mandatory"];
  const sections = collectSectionModules(metadata, baseTags, baseDir);
  const { moduleCount, lineCount } = computeTotals(sections);

  const layers = metadata.additive_variations ?? [];

  // Compute the left column width for the manifest table.
  // Minimum 15 chars to accommodate layer names.
  let leftColWidth = 15;
  for (const layer of layers) {
    // +2 for leading " " and trailing space
    if (layer.name.length + 2 > leftColWidth) {
      leftColWidth = layer.name.length + 2;
    }
  }

  const lines: string[] = [];

  // Markdown header outside the box
  lines.push("# Base -- Layer Index");
  lines.push("");
  lines.push(
    "> Summary of the **base** layer content (core-mandatory). Load additive layers for specialized guidance."
  );
  lines.push("");

  // ASCII box (wrapped in code fence for monospace rendering in markdown viewers)
  lines.push("```");
  lines.push(topBorder());
  lines.push(boxLine("BASE LAYER INDEX"));
  lines.push(boxLine(`${moduleCount} modules ~ ${lineCount} lines`));
  lines.push(divider());
  lines.push(emptyLine());

  // Module listing grouped by section
  for (const sec of sections) {
    lines.push(boxLine(sec.sectionTitle));
    for (const mod of sec.modules) {
      lines.push(boxLine(`  \u00B7 ${mod.title} (${mod.lines} lines)`));
      for (const heading of mod.subheadings) {
        const indent = heading.level === 3 ? "      " : "        ";
        lines.push(boxLine(`${indent}${heading.text}`));
      }
    }
  }

  lines.push(emptyLine());

  // Global manifest section
  if (layers.length > 0) {
    lines.push(divider());
    lines.push(boxLine("AVAILABLE LAYERS -- not all loaded in every session"));
    lines.push(dividerWithJunction(leftColWidth));

    for (const layer of layers) {
      const desc = layer.description
        ? truncateDescription(layer.description, BOX_WIDTH - 2 - leftColWidth - 1 - 2)
        : "";
      lines.push(twoColumnLine(layer.name, desc, leftColWidth));
    }

    lines.push(dividerWithBottomJunction(leftColWidth));
    lines.push(boxLine("Load: /add-dir .claude-layers/{name}"));
    lines.push(boxLine("Presets: claude:design \u00B7 claude:impl \u00B7 claude:full"));
  }

  lines.push(bottomBorder());
  lines.push("```");
  lines.push("");

  return lines.join("\n");
}

// =============================================================================
// Internal Helpers
// =============================================================================

/**
 * Truncate a description to fit within a given width, adding ellipsis if needed.
 */
function truncateDescription(description: string, maxWidth: number): string {
  if (description.length <= maxWidth) return description;
  return description.substring(0, maxWidth - 1) + "\u2026";
}
