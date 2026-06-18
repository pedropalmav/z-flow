# latent-flow

Interactive visualization of Dreamer's latent state transition graphs.

Loads an evaluation trajectory exported from a Dreamer rollout and renders it as an
interactive node graph — each node is a world-model state Z, each edge is a transition
between consecutive timesteps.

![latent-flow screenshot](docs/screenshot.png)

---

## Features

- **Three node display modes** — view each state as its raw observation image, as a heatmap
  of the stochastic latent matrix, or both stacked
- **Per-node and global toggle** — switch display mode on individual nodes or all at once
- **Force-directed layout** — d3-force with left-to-right directional bias, nodes are
  draggable after initial layout
- **Animated transitions** — directed edges labeled with step number
- **Pure client-side** — no server, no backend; load a JSON file and everything runs in
  the browser

---

## Usage

### 1. Export a trajectory from your Dreamer model

Set `export.enabled=true` in your Hydra config and run an evaluation rollout. This will
write a trajectory file to `outputs/trajectories/<run_name>_<step>.json`.

```bash
python train.py export.enabled=true
```

### 2. Run latent-flow

```bash
npm install
npm run dev
```

Open `http://localhost:5173`, drag and drop your trajectory JSON onto the canvas or use
the file picker in the toolbar.

---

## Trajectory format

The app consumes JSON files produced by the `export.py` module in the
[her-dreamer](https://github.com/pedropalmav/her-dreamer) repository. The schema is:

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
      "stoch": [[...]],
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

The exporter is model-agnostic at the file level — any Dreamer implementation (PyTorch,
JAX, etc.) can produce compatible JSON as long as it follows this schema.

---

## Stack

- [React](https://react.dev) + [Vite](https://vitejs.dev)
- [React Flow](https://reactflow.dev) for the node graph
- [d3-force](https://github.com/d3/d3-force) for layout
- [Tailwind CSS](https://tailwindcss.com) for styling

---

## Related

- [her-dreamer](https://github.com/pedropalmav/her-dreamer) — the Dreamer fork this tool was
  built alongside, including the `export.py` trajectory exporter
