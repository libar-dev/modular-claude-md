Feature: Index Generator
  The index generator creates lightweight index/summary files for each layer,
  enabling progressive disclosure via Claude Code's --add-dir feature.

  # Path derivation
  Scenario: Derive index output path from layer config
    Given an additive layer named "architecture" with output dir ".claude-layers/architecture"
    And a project root of "/projects/my-app"
    When computing the index output path
    Then the path should be "/projects/my-app/.claude-layers/architecture-index/CLAUDE.md"

  Scenario: Derive base index output path
    Given a project root of "/projects/my-app"
    When computing the base index output path
    Then the path should be "/projects/my-app/.claude-layers/base-index/CLAUDE.md"

  Scenario: Index output path appends -index suffix to layer output dir
    Given an additive layer named "testing" with output dir ".claude-layers/testing"
    And a project root of "/home/user/project"
    When computing the index output path
    Then the path should end with "-index/CLAUDE.md"
    And the path should contain "testing-index"
