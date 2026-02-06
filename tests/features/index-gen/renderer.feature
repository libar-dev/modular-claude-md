Feature: Index Renderer
  The index renderer generates ASCII-boxed index content that provides
  a quick overview of what each layer contains without loading full content.

  # Layer index content
  Scenario: Build layer index with module titles and line counts
    Given an index test metadata with section "Core" and tags "core"
    And an index test layer "testing" with tags "core" and output dir ".claude-layers/testing"
    And an index test module "core/basics.md" with tags "core"
    And module "core/basics.md" has content "### Basic Concepts\n\nSome content here."
    When building the layer index content
    Then the index output should contain layer header and module title and line count and load command

  Scenario: Build layer index with subheadings
    Given an index test metadata with section "Guides" and tags "guides"
    And an index test layer "guides" with tags "guides" and output dir ".claude-layers/guides"
    And an index test module "guides/writing.md" with tags "guides"
    And module "guides/writing.md" has content "### Writing Guide\n\nIntro.\n\n### Style Rules\n\nMore.\n\n#### Formatting\n\nDetails.\n\n#### Naming Conventions\n\nMore details."
    When building the layer index content
    Then the index output should contain the title and all subheadings

  Scenario: Layer index has no auto-generated footer
    Given an index test metadata with section "Test" and tags "test"
    And an index test layer "test" with tags "test" and output dir ".claude-layers/test"
    And an index test module "test/example.md" with tags "test"
    And module "test/example.md" has content "### Example\nContent."
    When building the layer index content
    Then the layer index output should not contain auto-generated footer

  # Base index content
  Scenario: Build base index with module listing and available layers
    Given an index test metadata with section "Core" and tags "core-mandatory"
    And a default variation with tags "core-mandatory"
    And a base index additive layer "development" with description "Dev tools"
    And an index test module "core/overview.md" with tags "core-mandatory"
    And module "core/overview.md" has content "### Overview\n\nThe overview content."
    When building the base index content
    Then the base index output should contain header and module and layers manifest

  Scenario: Base index has no auto-generated footer
    Given an index test metadata with section "Core" and tags "core-mandatory"
    And a default variation with tags "core-mandatory"
    And an index test module "core/overview.md" with tags "core-mandatory"
    And module "core/overview.md" has content "### Overview\nContent."
    When building the base index content
    Then the base index output should not contain auto-generated footer

  # Box formatting
  Scenario: All content lines are bounded by box characters
    Given an index test metadata with section "Test" and tags "test"
    And an index test layer "test" with tags "test" and output dir ".claude-layers/test"
    And an index test module "test/sample.md" with tags "test"
    And module "test/sample.md" has content "### Sample Module\n\nContent.\n\n#### Subsection A\n\nMore."
    When building the layer index content
    Then every box line should start and end with box characters
    And all box lines should have the same width
