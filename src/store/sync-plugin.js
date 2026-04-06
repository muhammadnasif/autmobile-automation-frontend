/**
 * Pinia plugin: Cross-tab state synchronization via BroadcastChannel.
 *
 * Every time a store's state changes the full serialisable snapshot is posted
 * to a BroadcastChannel named after the store id.  Other tabs listening on the
 * same channel will patch their state accordingly.
 *
 * Only stores whose ids are listed in `SYNCED_STORES` are synchronised.
 */

const SYNCED_STORES = ['workshop']

/**
 * Deep-clone a value so it is safe to post over BroadcastChannel / store.
 * Falls back to JSON round-trip for complex objects (removes functions, etc).
 */
function safeClone(obj) {
  try {
    return JSON.parse(JSON.stringify(obj))
  } catch {
    return obj
  }
}

export function crossTabSyncPlugin({ store }) {
  if (!SYNCED_STORES.includes(store.$id)) return

  const channelName = `pinia-sync-${store.$id}`
  let channel

  try {
    channel = new BroadcastChannel(channelName)
  } catch {
    // BroadcastChannel not available (e.g. very old browsers) – skip
    return
  }

  // Flag to prevent echo loops: when we receive a message and patch our own
  // store the $subscribe fires again — we must not re-broadcast that change.
  let isSyncing = false

  // ── Receive changes from other tabs ──────────────────────────────────────
  channel.onmessage = (event) => {
    const { type, payload } = event.data || {}

    if (type === 'state-update') {
      isSyncing = true
      store.$patch(payload)
      // nextTick-ish delay to let Pinia settle before clearing the flag
      setTimeout(() => { isSyncing = false }, 0)
    }
  }

  // ── Broadcast own changes to other tabs ──────────────────────────────────
  store.$subscribe((_mutation, state) => {
    if (isSyncing) return
    try {
      channel.postMessage({
        type: 'state-update',
        payload: safeClone(state),
      })
    } catch {
      // Silently ignore serialisation errors
    }
  })
}
