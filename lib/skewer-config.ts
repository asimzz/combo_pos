export const KOFTA_RM_ID  = 'cmpgqovoh0000gzjyqstbt1ov'
export const SHEESH_RM_ID = 'cmpgqovol0001gzjy3aq3h8yt'

export const SKEWER_TYPES = ['Kofta', 'Sheesh'] as const
export type SkewerType = typeof SKEWER_TYPES[number]

export function isSkewerItem(name: string): boolean {
  return /skewers?\s*-\s*\d/i.test(name)
}

export function getSkewerCount(name: string): number {
  const m = name.match(/(\d+)\s*skewer/i)
  return m ? parseInt(m[1], 10) : 1
}
