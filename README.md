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

## Configuration (metadata.json)

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

| Command                                 | Description                       |
| --------------------------------------- | --------------------------------- |
| `modular-claude-md build`               | Build all complete variations     |
| `modular-claude-md build --variation=X` | Build specific variation          |
| `modular-claude-md build --preview`     | Preview without writing           |
| `modular-claude-md validate`            | Validate configuration            |
| `modular-claude-md additive`            | Generate all additive layers      |
| `modular-claude-md additive --layer=X`  | Generate specific layer           |
| `modular-claude-md manifest`            | Generate shell manifest           |
| `modular-claude-md init`                | Initialize \_claude-md/ structure |

## Using with Claude Code's --add-dir

Claude Code v2.1.20+ supports loading CLAUDE.md from additional directories:

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

## Programmatic API

```typescript
import {
  loadMetadata,
  buildVariation,
  buildAllVariations,
  generateAdditiveLayer,
  validateMetadata,
  type Metadata,
  type Variation,
} from "@libar-dev/modular-claude-md";

// Load configuration
const metadata = loadMetadata("_claude-md/metadata.json");

// Build a single variation
const content = buildVariation(metadata, metadata.variations[0]);

// Validate configuration
const { valid, errors } = validateMetadata(metadata);
```

## License

MIT
