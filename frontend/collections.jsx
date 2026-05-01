import { createCollection } from "@tanstack/react-db"
import { electricCollectionOptions } from "@tanstack/electric-db-collection"
import { api } from "./api"
import { nowIso } from "./misc"

const collections = new Map()

// Keep Electric shape streams off the app origin. Browsers cap parallel
// HTTP/1.1 connections per origin, so long-lived Electric requests on :8080
// can make normal API calls wait behind them for ~20 seconds.
function electricUrl() {
  const url = new URL("/electric/v1/shape", globalThis.location.origin)
  url.port = "8081"
  return url.href
}

async function patchTransaction(path, transaction) {
  for (const mutation of transaction.mutations) {
    const id = mutation.original?.id ?? mutation.modified.id
    const body = mutation.changes ?? mutation.modified
    await api("PATCH", `${path}/${id}`, body)
  }
}

export function archived(collection, id, value) {
  collection.update(id, (draft) => {
    draft.archived_at = value ? nowIso() : null
  })
}

export function updateFields(collection, id, fields) {
  collection.update(id, (draft) => {
    Object.assign(draft, fields)
  })
}

export function starred(collection, id, value) {
  collection.update(id, (draft) => {
    draft.is_starred = value
  })
}

export function requestBalanceRefresh(collection, id, requestedAt = nowIso()) {
  collection.update(id, (draft) => {
    draft.balance_refresh_requested_at = requestedAt
    draft.balance_refresh_started_at = null
    draft.balance_refresh_finished_at = null
    draft.balance_refresh_error = null
  })
}

export function collect({
  id,
  table,
  where,
  getKey = (item) => item.id,
  patch,
  ...handlers
}) {
  const shape = JSON.stringify({ table, where, patch: patch?.path })
  const cached = collections.get(id)
  if (cached) {
    if (cached.shape !== shape) {
      throw new Error(`collection id reused with different shape: ${id}`)
    }
    return cached.collection
  }
  const mutations = patch
    ? {
        onInsert: ({ transaction }) =>
          patchTransaction(patch.path, transaction),
        onUpdate: ({ transaction }) =>
          patchTransaction(patch.path, transaction),
      }
    : {}
  const collection = createCollection(
    electricCollectionOptions({
      id,
      gcTime: Infinity,
      getKey,
      shapeOptions: {
        url: electricUrl(),
        params: { table, where },
      },
      ...mutations,
      ...handlers,
    }),
  )
  collections.set(id, { shape, collection })
  return collection
}
