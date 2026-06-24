import { useState, useEffect } from 'react'

// Fetches /clusters/states/{id} detail (image, stoch, trajectory/timestep,
// prev/next ids). Shared by ClusterStatePanel and any view that needs the
// full detail of a state for comparison.
export function useClusterState(serverUrl, stateId) {
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!stateId) {
      setDetail(null)
      return
    }
    let cancelled = false
    setLoading(true)
    fetch(`${serverUrl}/clusters/states/${stateId}`)
      .then((r) => r.json())
      .then((data) => { if (!cancelled) setDetail(data) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [stateId, serverUrl])

  return { detail, loading }
}
