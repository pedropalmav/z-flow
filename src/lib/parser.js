import { MarkerType } from 'reactflow'

export function parseTrajectory(json) {
  const { metadata, nodes: rawNodes, edges: rawEdges } = json

  const nodes = rawNodes.map((n) => ({
    id: n.id,
    type: 'stateNode',
    position: { x: 0, y: 0 },
    data: {
      stoch: n.stoch,
      image_b64: n.image_b64,
      reward: n.reward,
      is_first: n.is_first ?? false,
      mode: 'image',
    },
  }))

  const edges = rawEdges.map((e, i) => ({
    id: `e-${e.source}-${e.target}`,
    source: e.source,
    target: e.target,
    type: 'transitionEdge',
    animated: true,
    markerEnd: { type: MarkerType.ArrowClosed },
    data: { step: e.step ?? i },
  }))

  return { nodes, edges, metadata }
}
