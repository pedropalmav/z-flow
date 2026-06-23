import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCollide,
  forceCenter,
} from 'd3-force'

// Live-mode layout: cycle-friendly, uses current node positions as warm start.
export function applyLiveLayout(nodes, edges) {
  const simNodes = nodes.map((n) => ({
    id: n.id,
    x: n.position?.x ?? 0,
    y: n.position?.y ?? 0,
  }))

  const simEdges = edges.map((e) => ({ source: e.source, target: e.target }))

  const sim = forceSimulation(simNodes)
    .force('link', forceLink(simEdges).id((d) => d.id).distance(160).strength(1))
    .force('charge', forceManyBody().strength(-600))
    .force('center', forceCenter(0, 0))
    .force('collide', forceCollide(90))
    .stop()

  sim.tick(300)

  const posById = Object.fromEntries(simNodes.map((n) => [n.id, { x: n.x, y: n.y }]))
  return nodes.map((n) => ({ ...n, position: posById[n.id] }))
}
