/**
 * Index Renderer Step Definitions
 *
 * Tests for buildLayerIndexContent and buildBaseIndexContent functions.
 */

import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import type { Metadata, AdditiveVariation, Variation } from "../../../src/types.js";
import { buildLayerIndexContent, buildBaseIndexContent } from "../../../src/index-gen/renderer.js";

// =============================================================================
// Type Definitions
// =============================================================================

interface RendererState {
  tempDir: string;
  metadata: Metadata;
  layer: AdditiveVariation | undefined;
  output: string;
}

// =============================================================================
// Module-level state (reset per scenario)
// =============================================================================

let state: RendererState | null = null;

function initState(): RendererState {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "modular-claude-md-idx-renderer-"));
  return {
    tempDir,
    metadata: {
      document: { title: "Test", version: "1.0" },
      sections: [],
      variations: [],
    },
    layer: undefined,
    output: "",
  };
}

function cleanupState(): void {
  if (state?.tempDir && fs.existsSync(state.tempDir)) {
    fs.rmSync(state.tempDir, { recursive: true, force: true });
  }
}

function createModule(modulePath: string, content: string): void {
  const fullPath = path.join(state!.tempDir, modulePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content);
}

// =============================================================================
// Feature Definition
// =============================================================================

const feature = await loadFeature("tests/features/index-gen/renderer.feature");

describeFeature(feature, ({ Scenario, AfterEachScenario }) => {
  AfterEachScenario(() => {
    cleanupState();
    state = null;
  });

  // ===========================================================================
  // Layer Index Content — titles and line counts
  // ===========================================================================

  Scenario("Build layer index with module titles and line counts", ({ Given, And, When, Then }) => {
    Given(
      "an index test metadata with section {string} and tags {string}",
      (_ctx: unknown, sectionTitle: string, tags: string) => {
        state = initState();
        state.metadata.sections.push({
          title: sectionTitle,
          tags: tags.split(",").map((t) => t.trim()),
          subsections: [],
        });
      }
    );

    And(
      "an index test layer {string} with tags {string} and output dir {string}",
      (_ctx: unknown, name: string, tags: string, outputDir: string) => {
        state!.layer = {
          name,
          output_dir: outputDir,
          tags: tags.split(",").map((t) => t.trim()),
        };
      }
    );

    And(
      "an index test module {string} with tags {string}",
      (_ctx: unknown, modulePath: string, tags: string) => {
        const tagList = tags.split(",").map((t) => t.trim());
        const section = state!.metadata.sections[0];
        if (section) {
          section.subsections.push({ path: modulePath, tags: tagList });
        }
      }
    );

    And(
      "module {string} has content {string}",
      (_ctx: unknown, modulePath: string, content: string) => {
        createModule(modulePath, content.replace(/\\n/g, "\n"));
      }
    );

    When("building the layer index content", () => {
      state!.output = buildLayerIndexContent(state!.metadata, state!.layer!, state!.tempDir);
    });

    Then(
      "the index output should contain layer header and module title and line count and load command",
      () => {
        expect(state!.output).toContain("LAYER INDEX: testing");
        expect(state!.output).toContain("Basic Concepts");
        expect(state!.output).toContain("lines)");
        expect(state!.output).toContain("Load full layer: /add-dir .claude-layers/testing");
      }
    );
  });

  // ===========================================================================
  // Layer Index Content — subheadings
  // ===========================================================================

  Scenario("Build layer index with subheadings", ({ Given, And, When, Then }) => {
    Given(
      "an index test metadata with section {string} and tags {string}",
      (_ctx: unknown, sectionTitle: string, tags: string) => {
        state = initState();
        state.metadata.sections.push({
          title: sectionTitle,
          tags: tags.split(",").map((t) => t.trim()),
          subsections: [],
        });
      }
    );

    And(
      "an index test layer {string} with tags {string} and output dir {string}",
      (_ctx: unknown, name: string, tags: string, outputDir: string) => {
        state!.layer = {
          name,
          output_dir: outputDir,
          tags: tags.split(",").map((t) => t.trim()),
        };
      }
    );

    And(
      "an index test module {string} with tags {string}",
      (_ctx: unknown, modulePath: string, tags: string) => {
        const tagList = tags.split(",").map((t) => t.trim());
        const section = state!.metadata.sections[0];
        if (section) {
          section.subsections.push({ path: modulePath, tags: tagList });
        }
      }
    );

    And(
      "module {string} has content {string}",
      (_ctx: unknown, modulePath: string, content: string) => {
        createModule(modulePath, content.replace(/\\n/g, "\n"));
      }
    );

    When("building the layer index content", () => {
      state!.output = buildLayerIndexContent(state!.metadata, state!.layer!, state!.tempDir);
    });

    Then("the index output should contain the title and all subheadings", () => {
      // Title (first H3) is the bullet-point module entry
      expect(state!.output).toContain("Writing Guide");
      // Additional H3 headings appear as subheadings with 6-space indent
      expect(state!.output).toContain("Style Rules");
      // H4 headings appear with 8-space indent
      expect(state!.output).toContain("Formatting");
      expect(state!.output).toContain("Naming Conventions");
    });
  });

  // ===========================================================================
  // No auto-generated footer (layer)
  // ===========================================================================

  Scenario("Layer index has no auto-generated footer", ({ Given, And, When, Then }) => {
    Given(
      "an index test metadata with section {string} and tags {string}",
      (_ctx: unknown, sectionTitle: string, tags: string) => {
        state = initState();
        state.metadata.sections.push({
          title: sectionTitle,
          tags: tags.split(",").map((t) => t.trim()),
          subsections: [],
        });
      }
    );

    And(
      "an index test layer {string} with tags {string} and output dir {string}",
      (_ctx: unknown, name: string, tags: string, outputDir: string) => {
        state!.layer = {
          name,
          output_dir: outputDir,
          tags: tags.split(",").map((t) => t.trim()),
        };
      }
    );

    And(
      "an index test module {string} with tags {string}",
      (_ctx: unknown, modulePath: string, tags: string) => {
        const tagList = tags.split(",").map((t) => t.trim());
        const section = state!.metadata.sections[0];
        if (section) {
          section.subsections.push({ path: modulePath, tags: tagList });
        }
      }
    );

    And(
      "module {string} has content {string}",
      (_ctx: unknown, modulePath: string, content: string) => {
        createModule(modulePath, content.replace(/\\n/g, "\n"));
      }
    );

    When("building the layer index content", () => {
      state!.output = buildLayerIndexContent(state!.metadata, state!.layer!, state!.tempDir);
    });

    Then("the layer index output should not contain auto-generated footer", () => {
      expect(state!.output).not.toContain("auto-generated");
    });
  });

  // ===========================================================================
  // Base Index Content
  // ===========================================================================

  Scenario(
    "Build base index with module listing and available layers",
    ({ Given, And, When, Then }) => {
      Given(
        "an index test metadata with section {string} and tags {string}",
        (_ctx: unknown, sectionTitle: string, tags: string) => {
          state = initState();
          state.metadata.sections.push({
            title: sectionTitle,
            tags: tags.split(",").map((t) => t.trim()),
            subsections: [],
          });
        }
      );

      And("a default variation with tags {string}", (_ctx: unknown, tags: string) => {
        const variation: Variation = {
          name: "default",
          path: "/",
          tags: tags.split(",").map((t) => t.trim()),
          budget_tokens: 8000,
        };
        state!.metadata.variations.push(variation);
      });

      And(
        "a base index additive layer {string} with description {string}",
        (_ctx: unknown, name: string, description: string) => {
          if (!state!.metadata.additive_variations) {
            state!.metadata.additive_variations = [];
          }
          state!.metadata.additive_variations.push({
            name,
            output_dir: `.claude-layers/${name}`,
            tags: ["dev"],
            description,
          });
        }
      );

      And(
        "an index test module {string} with tags {string}",
        (_ctx: unknown, modulePath: string, tags: string) => {
          const tagList = tags.split(",").map((t) => t.trim());
          const section = state!.metadata.sections[0];
          if (section) {
            section.subsections.push({ path: modulePath, tags: tagList });
          }
        }
      );

      And(
        "module {string} has content {string}",
        (_ctx: unknown, modulePath: string, content: string) => {
          createModule(modulePath, content.replace(/\\n/g, "\n"));
        }
      );

      When("building the base index content", () => {
        state!.output = buildBaseIndexContent(state!.metadata, state!.tempDir);
      });

      Then("the base index output should contain header and module and layers manifest", () => {
        expect(state!.output).toContain("BASE LAYER INDEX");
        expect(state!.output).toContain("Overview");
        expect(state!.output).toContain("AVAILABLE LAYERS");
        expect(state!.output).toContain("development");
      });
    }
  );

  // ===========================================================================
  // No auto-generated footer (base)
  // ===========================================================================

  Scenario("Base index has no auto-generated footer", ({ Given, And, When, Then }) => {
    Given(
      "an index test metadata with section {string} and tags {string}",
      (_ctx: unknown, sectionTitle: string, tags: string) => {
        state = initState();
        state.metadata.sections.push({
          title: sectionTitle,
          tags: tags.split(",").map((t) => t.trim()),
          subsections: [],
        });
      }
    );

    And("a default variation with tags {string}", (_ctx: unknown, tags: string) => {
      const variation: Variation = {
        name: "default",
        path: "/",
        tags: tags.split(",").map((t) => t.trim()),
        budget_tokens: 8000,
      };
      state!.metadata.variations.push(variation);
    });

    And(
      "an index test module {string} with tags {string}",
      (_ctx: unknown, modulePath: string, tags: string) => {
        const tagList = tags.split(",").map((t) => t.trim());
        const section = state!.metadata.sections[0];
        if (section) {
          section.subsections.push({ path: modulePath, tags: tagList });
        }
      }
    );

    And(
      "module {string} has content {string}",
      (_ctx: unknown, modulePath: string, content: string) => {
        createModule(modulePath, content.replace(/\\n/g, "\n"));
      }
    );

    When("building the base index content", () => {
      state!.output = buildBaseIndexContent(state!.metadata, state!.tempDir);
    });

    Then("the base index output should not contain auto-generated footer", () => {
      expect(state!.output).not.toContain("auto-generated");
    });
  });

  // ===========================================================================
  // Box Formatting
  // ===========================================================================

  Scenario("All content lines are bounded by box characters", ({ Given, And, When, Then }) => {
    Given(
      "an index test metadata with section {string} and tags {string}",
      (_ctx: unknown, sectionTitle: string, tags: string) => {
        state = initState();
        state.metadata.sections.push({
          title: sectionTitle,
          tags: tags.split(",").map((t) => t.trim()),
          subsections: [],
        });
      }
    );

    And(
      "an index test layer {string} with tags {string} and output dir {string}",
      (_ctx: unknown, name: string, tags: string, outputDir: string) => {
        state!.layer = {
          name,
          output_dir: outputDir,
          tags: tags.split(",").map((t) => t.trim()),
        };
      }
    );

    And(
      "an index test module {string} with tags {string}",
      (_ctx: unknown, modulePath: string, tags: string) => {
        const tagList = tags.split(",").map((t) => t.trim());
        const section = state!.metadata.sections[0];
        if (section) {
          section.subsections.push({ path: modulePath, tags: tagList });
        }
      }
    );

    And(
      "module {string} has content {string}",
      (_ctx: unknown, modulePath: string, content: string) => {
        createModule(modulePath, content.replace(/\\n/g, "\n"));
      }
    );

    When("building the layer index content", () => {
      state!.output = buildLayerIndexContent(state!.metadata, state!.layer!, state!.tempDir);
    });

    Then("every box line should start and end with box characters", () => {
      const outputLines = state!.output.split("\n");
      const boxContentLines = outputLines.filter((l) => l.startsWith("\u2551"));
      expect(boxContentLines.length).toBeGreaterThan(0);
      for (const line of boxContentLines) {
        expect(line.startsWith("\u2551")).toBe(true);
        expect(line.endsWith("\u2551")).toBe(true);
      }
    });

    And("all box lines should have the same width", () => {
      const outputLines = state!.output.split("\n");
      const boxLines = outputLines.filter(
        (l) =>
          l.startsWith("\u2551") ||
          l.startsWith("\u2554") ||
          l.startsWith("\u255A") ||
          l.startsWith("\u2560")
      );
      expect(boxLines.length).toBeGreaterThan(0);
      const firstWidth = boxLines[0]!.length;
      for (const line of boxLines) {
        expect(line.length).toBe(firstWidth);
      }
    });
  });
});
