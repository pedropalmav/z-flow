# latent-flow — SPEC

## What is this

A standalone web application for visualizing Dreamer's latent state transition graphs.
It loads a trajectory JSON exported from a Dreamer evaluation rollout and renders an
interactive node graph where each node represents a world-model state (Z) at a given
timestep, and each edge represents a transition between consecutive states.

The app is framework-agnostic on the model side: it consumes a JSON file and has no
dependency on PyTorch, JAX, or any ML library.

---

## Stack

- **React** (Vite, no Next.js)
- **React Flow** for the node graph
- **d3-force** for graph layout (via `@reactflow/layout` or manual force simulation)
- **Tailwind CSS** for styling
- No UI component library — custom components only

---

## Project structure

```
latent-flow/
├── public/
├── src/
│   ├── components/
│   │   ├── StateNode.jsx       # Custom React Flow node
│   │   ├── TransitionEdge.jsx  # Custom React Flow edge
│   │   └── Toolbar.jsx         # Top bar: file loader + display mode toggle
│   ├── lib/
│   │   ├── parser.js           # JSON → React Flow nodes/edges
│   │   └── layout.js           # d3-force layout computation
│   ├── App.jsx
│   └── main.jsx
├── examples/
│   └── sample.json             # Reference trajectory for development
├── SPEC.md
└── package.json
```

---

## Input format

The app consumes a single JSON file with this schema:

```json
{
  "metadata": {
    "model": "dreamer",
    "env": "MiniGrid-Empty-5x5-v0",
    "stoch_size": [32, 32],
    "deter_size": 512
  },
  "nodes": [
    {
      "id": "step_0",
      "stoch": [[...], [...], ...],
      "image_b64": "<base64 PNG>",
      "reward": 0.0,
      "is_first": true
    }
  ],
  "edges": [
    { "source": "step_0", "target": "step_1", "step": 0 }
  ]
}
```

- `stoch` is a 2D array of shape `[S, K]` (S categories, K classes each)
- `image_b64` is a base64-encoded PNG of the raw RGB observation
- `edges[i].step` is the step number of the transition (i.e. the source node's timestep)

---

## Features

### File loading

- Drag-and-drop or file picker (no server, pure client-side)
- On load, parse the JSON, run the force layout, and render the graph
- Display `metadata.env` and total step count in the toolbar

### StateNode

Each node renders one of three display modes, toggled per-node via a button on the node itself:

| Mode | Content |
|------|---------|
| `image` | Raw RGB observation (`image_b64`) |
| `matrix` | Heatmap of the `stoch` array — rows = categories, columns = classes |
| `both` | Image on top, matrix below, stacked vertically |

- Default mode: `image`
- The toggle cycles through `image → matrix → both → image`
- Node size adapts to the active mode
- `is_first` nodes have a distinct visual marker (e.g. colored ring or badge)

### Matrix rendering

- Render `stoch` as a 2D heatmap using a `<canvas>` element inside the node
- Color scale: sequential (e.g. viridis or similar — pick one and use it consistently)
- No axis labels needed — keep it compact

### TransitionEdge

- Labeled with the step number (`edge.step`)
- Animated (use React Flow's built-in animated edge option)
- Directional arrow

### Layout

- Use `d3-force` to compute initial node positions after loading
- Apply a left-to-right directional bias (increase x-separation between nodes)
- Layout runs once on load; nodes are draggable after that (React Flow default behavior)

### Toolbar

- File loader button (and drag-and-drop target for the whole canvas)
- Global display mode toggle: sets the mode for ALL nodes simultaneously
- Metadata display: env name, step count

---

## What is NOT in scope

- No backend, no server
- No multi-trajectory comparison
- No playback / timeline animation
- No export or save functionality
- No authentication
- No support for formats other than the JSON schema above

---

## Development reference

The `examples/sample.json` file contains a real trajectory exported from a Dreamer
evaluation rollout and must be used as the primary fixture during development.
All parsing and rendering logic must work correctly against this file before
considering any feature complete.
