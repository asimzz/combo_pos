export const SANDWICH_CATEGORY_NAMES = ['Combo Sandwiches - Wraps', 'Combo Sandwiches - Burgers']
export const SANDWICH_DEFAULT_SIDE   = 'Fries'
export const FRIES_DEDUCTION         = 1000
export const EXTRA_PRICE             = 1000

/** Large / Full items get 2 free selections per group; everything else gets 1. */
export function getFreeQty(itemName: string): number {
  const lower = itemName.toLowerCase()
  return lower.includes('large') || lower.includes('full') ? 2 : 1
}

/** Small items get small sides; medium, large, full — all get large sides. */
export function getSideSize(itemName: string): 'small' | 'large' {
  return itemName.toLowerCase().includes('small') ? 'small' : 'large'
}

export type SideGroup = {
  key: string
  label: string
  /** Category names in the DB whose items belong to this group */
  categoryNames: string[]
  defaultItem: string
  sandwichDefaultItem?: string
}

export const SIDE_GROUPS: SideGroup[] = [
  {
    key: 'salads',
    label: 'Salads',
    categoryNames: ['Salads'],
    defaultItem: 'Mediterranean Salad',
  },
  {
    key: 'carbs',
    label: 'Carbs',
    categoryNames: ['Carbs'],
    defaultItem: 'Mandi Rice',
    sandwichDefaultItem: 'Fries',
  },
  {
    key: 'sauces',
    label: 'Sauces',
    categoryNames: ['Sauces'],
    defaultItem: 'Peanut Butter Chili',
  },
]

/** All category names that are used as side groups */
export const SIDES_CATEGORY_NAMES = SIDE_GROUPS.flatMap(g => g.categoryNames)
