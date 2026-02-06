/**
 * Index file generation for layer summaries.
 *
 * Generates lightweight index/summary CLAUDE.md files for each layer,
 * enabling progressive disclosure via Claude Code's --add-dir feature.
 *
 * @module @libar-dev/modular-claude-md/index-gen/generator
 */

import * as path from "node:path";
import type { Metadata, AdditiveVariation, BuildResult } from "../types.js";
import { buildLayerIndexContent, buildBaseIndexContent } from "./renderer.js";
import { countMatchingModules } from "../builder/matcher.js";
import { writeVariationFile, createBuildResult } from "../utils/writer.js";
import { log, logSection } from "../utils/colors.js";

// =============================================================================
// Constants
// =============================================================================

/** Default token budget for index files (they should be small). */
const DEFAULT_INDEX_BUDGET = 500;

/** Directory name for the base index output. */
const BASE_INDEX_DIR = "base-index";

// =============================================================================
// Path Helpers
// =============================================================================

/**
 * Get the output path for a layer index file.
 *
 * @param layer - The additive layer
 * @param projectRoot - Project root directory
 * @returns Absolute path to the index CLAUDE.md file
 */
export function getIndexOutputPath(layer: AdditiveVariation, projectRoot: string): string {
  return path.join(projectRoot, layer.output_dir + "-index", "CLAUDE.md");
}

/**
 * Get the output path for the base index file.
 *
 * @param projectRoot - Project root directory
 * @returns Absolute path to the base index CLAUDE.md file
 */
export function getBaseIndexOutputPath(projectRoot: string): string {
  return path.join(projectRoot, ".claude-layers", BASE_INDEX_DIR, "CLAUDE.md");
}

// =============================================================================
// Generation Functions
// =============================================================================

/**
 * Generate a single layer's index file.
 *
 * @param metadata - The metadata configuration
 * @param layer - The additive layer to index
 * @param baseDir - Base directory containing module files
 * @param projectRoot - Project root for output
 * @param preview - If true, don't write files
 * @returns Build result
 */
export function generateLayerIndex(
  metadata: Metadata,
  layer: AdditiveVariation,
  baseDir: string,
  projectRoot: string,
  preview: boolean = false
): BuildResult {
  const content = buildLayerIndexContent(metadata, layer, baseDir);
  const outputPath = getIndexOutputPath(layer, projectRoot);

  writeVariationFile(outputPath, content, DEFAULT_INDEX_BUDGET, preview);

  return createBuildResult(layer, content, outputPath, DEFAULT_INDEX_BUDGET);
}

/**
 * Generate the base/core index file.
 *
 * @param metadata - The metadata configuration
 * @param baseDir - Base directory containing module files
 * @param projectRoot - Project root for output
 * @param preview - If true, don't write files
 * @returns Build result
 */
export function generateBaseIndex(
  metadata: Metadata,
  baseDir: string,
  projectRoot: string,
  preview: boolean = false
): BuildResult {
  const content = buildBaseIndexContent(metadata, baseDir);
  const outputPath = getBaseIndexOutputPath(projectRoot);

  // Use the default variation for the build result
  const defaultVariation = metadata.variations[0];
  const resultVariation = defaultVariation ?? {
    name: "base",
    path: "/",
    tags: ["core-mandatory"],
    budget_tokens: DEFAULT_INDEX_BUDGET,
  };

  writeVariationFile(outputPath, content, DEFAULT_INDEX_BUDGET, preview);

  return createBuildResult(resultVariation, content, outputPath, DEFAULT_INDEX_BUDGET);
}

/**
 * Generate all index files (base + all additive layers).
 *
 * @param metadata - The metadata configuration
 * @param baseDir - Base directory containing module files
 * @param projectRoot - Project root for output
 * @param preview - If true, don't write files
 * @returns Array of build results
 */
export function generateAllIndexes(
  metadata: Metadata,
  baseDir: string,
  projectRoot: string,
  preview: boolean = false
): BuildResult[] {
  const results: BuildResult[] = [];

  logSection(preview ? "Preview Index Files" : "Generating Index Files");

  // Base index
  log("\n\uD83D\uDCC4 base (core layer)", "bright");
  const defaultVariation = metadata.variations[0];
  if (defaultVariation) {
    const moduleCount = countMatchingModules(metadata.sections, defaultVariation.tags);
    log(`   Modules: ${moduleCount} matching [${defaultVariation.tags.join(", ")}]`, "dim");
  }
  results.push(generateBaseIndex(metadata, baseDir, projectRoot, preview));

  // Layer indexes
  if (metadata.additive_variations && metadata.additive_variations.length > 0) {
    for (const layer of metadata.additive_variations) {
      log(`\n\uD83D\uDCC4 ${layer.name}`, "bright");
      if (layer.description) {
        log(`   ${layer.description}`, "dim");
      }

      const moduleCount = countMatchingModules(metadata.sections, layer.tags);
      log(`   Modules: ${moduleCount} matching [${layer.tags.join(", ")}]`, "dim");

      results.push(generateLayerIndex(metadata, layer, baseDir, projectRoot, preview));
    }
  } else {
    log("No additive_variations defined in metadata.json", "yellow");
  }

  return results;
}
