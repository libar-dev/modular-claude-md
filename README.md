# @libar-dev/modular-claude-md

Modular CLAUDE.md generator - build context-specific AI coding instructions with additive composition.

## Features

- **Modular Content**: Organize instructions in reusable markdown modules
- **Tag-Based Filtering**: Include/exclude content based on tags
- **Complete Mode**: Generate full CLAUDE.md files with all matching content
- **Additive Mode**: Generate layer files for Claude Code's `--add-dir` feature
- **Zero Dependencies**: Pure Node.js built-ins only

## Framework Guidelines

This package includes [framework guidelines](./docs/framework-guidelines.md) for developing effective CLAUDE.md content:

- **Evidence-based inclusion** - Test patterns before adding them
- **Effectiveness-driven sizing** - Token allocation based on impact, not arbitrary limits
- **Evolutionary approach** - Guidelines adapt based on what works
- **Module splitting** - Large concepts can be split with shared tags

See [docs/framework-guidelines.md](./docs/framework-guidelines.md) for the complete guide.

## Module Writing Guidelines

### Heading Hierarchy

**Critical**: The renderer outputs `## Section Title` for each section header (from `metadata.json`). Therefore, **module content must start with `###` (H3)** to maintain proper markdown hierarchy:

```
## Section Title          ← Rendered from metadata.json section.title
### Module Topic          ← Your module's first heading (must be ###)
#### Subtopic             ← Subsections within module
```

| Location                        | Heading Level | Example             |
| ------------------------------- | ------------- | ------------------- |
| Section header (auto-generated) | `##` (H2)     | `## Core Concepts`  |
| Module top-level heading        | `###` (H3)    | `### The Third Way` |
| Module subsection               | `####` (H4)   | `#### Key Rules`    |

The `info` command validates this structure and reports errors for modules that:

- Start with `##` (too shallow - conflicts with section headers)
- Start with `####` or deeper (too deep - skips hierarchy levels)
- Skip heading levels (e.g., `###` directly to `#####`)

Run `modular-claude-md info` to check your module structure.

## Installation

```bash
pnpm add -D @libar-dev/modular-claude-md
```

## Quick Start

### 1. Initialize Structure

```bash
npx modular-claude-md init
```

Creates:

```
_claude-md/
├── metadata.json        # Configuration
└── core/
    └── example.md       # Example module
```

### 2. Build CLAUDE.md

```bash
npx modular-claude-md build
```

### 3. Generate Additive Layers (for --add-dir)

```bash
npx modular-claude-md additive
npx modular-claude-md manifest
```

## Content Model

The system has four key concepts:

| Concept                   | Purpose                                                          |
| ------------------------- | ---------------------------------------------------------------- |
| **Sections**              | Organizational groups (like chapters) defined in `metadata.json` |
| **Modules** (subsections) | Individual `.md` files containing instructions                   |
| **Tags**                  | Labels connecting modules to outputs                             |
| **Variations / Layers**   | Output targets that select modules by tag                        |

### How Tags Drive Outputs

Tags are the key mechanism. Each module has tags, and each output target selects modules by matching tags:

```
metadata.json sections:
  "Core Mental Models" [tags: core-mandatory, architecture]
    ├── the-third-way.md    [tags: core-mandatory]     → default CLAUDE.md
    ├── cms-snapshot.md     [tags: architecture]        → architecture layer
    ├── deciders.md         [tags: architecture]        → architecture layer
    └── dcb.md              [tags: architecture]        → architecture layer

  "Infrastructure" [tags: core-mandatory, development, repo-infra]
    ├── component-isolation.md  [tags: core-mandatory]  → default CLAUDE.md
    ├── durable-functions.md    [tags: development]     → development layer
    └── packages-subtree.md     [tags: repo-infra]      → repo-infra layer
```

- **Variations** produce complete `CLAUDE.md` files (e.g., `default` selects all `core-mandatory` modules)
- **Additive layers** produce supplementary files for `--add-dir` (e.g., `architecture` selects all `architecture`-tagged modules)
- A module can appear in multiple outputs if it has multiple tags
- Sections group modules topically; layers cut across sections by tag

### Configuration (metadata.json)

```json
{
  "document": {
    "title": "My Project",
    "version": "1.0",
    "description": "Project description"
  },
  "sections": [
    {
      "title": "Core Concepts",
      "tags": ["core-mandatory"],
      "subsections": [
        {
          "path": "core/concepts.md",
          "tags": ["core-mandatory"],
          "description": "Core concepts documentation"
        }
      ]
    }
  ],
  "variations": [
    {
      "name": "default",
      "path": "/",
      "tags": ["core-mandatory"],
      "budget_tokens": 8000
    }
  ],
  "additive_variations": [
    {
      "name": "advanced",
      "output_dir": ".claude-layers/advanced",
      "tags": ["advanced"],
      "description": "Advanced topics - loaded via --add-dir"
    }
  ]
}
```

## CLI Commands

| Command                                 | Description                                                |
| --------------------------------------- | ---------------------------------------------------------- |
| `modular-claude-md build`               | Build all complete variations                              |
| `modular-claude-md build --variation=X` | Build specific variation                                   |
| `modular-claude-md build --preview`     | Preview without writing                                    |
| `modular-claude-md validate`            | Validate configuration                                     |
| `modular-claude-md additive`            | Generate all additive layers                               |
| `modular-claude-md additive --layer=X`  | Generate specific layer                                    |
| `modular-claude-md index`               | Generate layer index files                                 |
| `modular-claude-md index --layer=X`     | Generate specific layer index                              |
| `modular-claude-md manifest`            | Generate shell manifest                                    |
| `modular-claude-md info`                | Show content hierarchy, layers, tags, and overlap analysis |
| `modular-claude-md info --section=X`    | Filter to specific section (see below)                     |
| `modular-claude-md init`                | Initialize \_claude-md/ structure                          |

### `info --section` Values

| Section      | Shows                                                        |
| ------------ | ------------------------------------------------------------ |
| `summary`    | Quick overview: module/line counts, variations, layers, tags |
| `content`    | Full content hierarchy with headings per module              |
| `structure`  | Structural validation issues (heading levels, gaps)          |
| `tags`       | Tag coverage matrix (which tags appear in which sections)    |
| `variations` | Complete CLAUDE.md variation details                         |
| `layers`     | Additive layer details with unique module lists              |
| `overlap`    | Modules appearing in multiple outputs                        |

## Claude Code --add-dir Technical Reference

### Capabilities (v2.1.20+)

| Capability               | Description                                               |
| ------------------------ | --------------------------------------------------------- |
| **CLI argument**         | `claude --add-dir <path>` - add at startup                |
| **Multiple directories** | `claude --add-dir ./a --add-dir ./b` - combine layers     |
| **Mid-session**          | `/add-dir <path>` - expand workspace dynamically          |
| **CLAUDE.md loading**    | Requires `CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD=1` |

### Behavior

| Aspect                   | Behavior                                                                      |
| ------------------------ | ----------------------------------------------------------------------------- |
| **Tool access**          | `--add-dir` always grants Read/Glob/Grep access to the directory              |
| **CLAUDE.md loading**    | Only when env var is set; disabled by default                                 |
| **Multiple CLAUDE.md**   | All loaded and merged (root + each --add-dir)                                 |
| **File discovery**       | Looks for `CLAUDE.md` or `.claude/CLAUDE.md` in each directory                |
| **Subdirectory loading** | Standard subdirectory CLAUDE.md discovery also applies within --add-dir paths |

### Environment Variable

```bash
# Required for CLAUDE.md loading from --add-dir paths
export CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD=1
```

Without this variable, `--add-dir` only extends file access permissions—no CLAUDE.md loading occurs.

### Path Resolution

| Input         | Resolution                              |
| ------------- | --------------------------------------- |
| Relative path | Resolved from current working directory |
| Absolute path | Used as-is                              |
| `~` expansion | Supported (e.g., `~/projects/shared`)   |

## Using with This Package

```bash
# Enable the feature
export CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD=1

# Load with additive context
claude --add-dir .claude-layers/advanced
```

### Generated Manifest

Running `modular-claude-md manifest` creates `.claude-layers/manifest.sh`:

```bash
source .claude-layers/manifest.sh

# Now use aliases
claude-advanced  # Loads advanced layer
claude-full      # Loads all layers
```

## Layer Indexes (Progressive Disclosure)

Generate lightweight index files that summarize each layer's content:

```bash
npx modular-claude-md index
```

This creates `{layer-name}-index/` directories alongside the full layer directories. Each index contains an ASCII-boxed table of contents showing the module structure.

```bash
# Load just the index (lightweight discovery)
claude --add-dir .claude-layers/architecture-index

# Load the full layer (complete content)
claude --add-dir .claude-layers/architecture
```

## Programmatic API

```typescript
import {
  loadMetadata,
  buildVariationContent,
  buildAdditiveContent,
  generateAdditiveLayer,
  validateMetadata,
  type Metadata,
  type Variation,
} from "@libar-dev/modular-claude-md";

// Load configuration
const metadata = loadMetadata("_claude-md/metadata.json");

// Build a single variation
const content = buildVariationContent(metadata, metadata.variations[0], "_claude-md");

// Build an additive layer
const layerContent = buildAdditiveContent(metadata, metadata.additive_variations[0], "_claude-md");

// Validate configuration
const { valid, errors } = validateMetadata(metadata, "_claude-md", ".");
```

## License

MIT
