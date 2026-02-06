/**
 * Index Generator Step Definitions
 *
 * Tests for getIndexOutputPath and getBaseIndexOutputPath functions.
 */

import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import type { AdditiveVariation } from "../../../src/types.js";
import { getIndexOutputPath, getBaseIndexOutputPath } from "../../../src/index-gen/generator.js";

// =============================================================================
// Type Definitions
// =============================================================================

interface GeneratorState {
  layer: AdditiveVariation | undefined;
  projectRoot: string;
  resultPath: string;
}

// =============================================================================
// Module-level state (reset per scenario)
// =============================================================================

let state: GeneratorState | null = null;

function initState(): GeneratorState {
  return {
    layer: undefined,
    projectRoot: "",
    resultPath: "",
  };
}

// =============================================================================
// Feature Definition
// =============================================================================

const feature = await loadFeature("tests/features/index-gen/generator.feature");

describeFeature(feature, ({ Scenario, AfterEachScenario }) => {
  AfterEachScenario(() => {
    state = null;
  });

  // ===========================================================================
  // Layer index path
  // ===========================================================================

  Scenario("Derive index output path from layer config", ({ Given, And, When, Then }) => {
    Given(
      "an additive layer named {string} with output dir {string}",
      (_ctx: unknown, name: string, outputDir: string) => {
        state = initState();
        state.layer = {
          name,
          output_dir: outputDir,
          tags: ["test"],
        };
      }
    );

    And("a project root of {string}", (_ctx: unknown, root: string) => {
      state!.projectRoot = root;
    });

    When("computing the index output path", () => {
      state!.resultPath = getIndexOutputPath(state!.layer!, state!.projectRoot);
    });

    Then("the path should be {string}", (_ctx: unknown, expected: string) => {
      expect(state!.resultPath).toBe(expected);
    });
  });

  // ===========================================================================
  // Base index path
  // ===========================================================================

  Scenario("Derive base index output path", ({ Given, When, Then }) => {
    Given("a project root of {string}", (_ctx: unknown, root: string) => {
      state = initState();
      state.projectRoot = root;
    });

    When("computing the base index output path", () => {
      state!.resultPath = getBaseIndexOutputPath(state!.projectRoot);
    });

    Then("the path should be {string}", (_ctx: unknown, expected: string) => {
      expect(state!.resultPath).toBe(expected);
    });
  });

  // ===========================================================================
  // Path suffix pattern
  // ===========================================================================

  Scenario(
    "Index output path appends -index suffix to layer output dir",
    ({ Given, And, When, Then }) => {
      Given(
        "an additive layer named {string} with output dir {string}",
        (_ctx: unknown, name: string, outputDir: string) => {
          state = initState();
          state.layer = {
            name,
            output_dir: outputDir,
            tags: ["test"],
          };
        }
      );

      And("a project root of {string}", (_ctx: unknown, root: string) => {
        state!.projectRoot = root;
      });

      When("computing the index output path", () => {
        state!.resultPath = getIndexOutputPath(state!.layer!, state!.projectRoot);
      });

      Then("the path should end with {string}", (_ctx: unknown, suffix: string) => {
        expect(state!.resultPath.endsWith(suffix)).toBe(true);
      });

      And("the path should contain {string}", (_ctx: unknown, fragment: string) => {
        expect(state!.resultPath).toContain(fragment);
      });
    }
  );
});
