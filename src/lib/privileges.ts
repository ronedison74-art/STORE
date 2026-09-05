export type PrivilegeKey =
  | 'phone'
  | 'food_delivery'
  | 'group_food_delivery'
  | 'liberty'
  | 'reduce_ed'
  | 'offset_demerits'

export const PRIVILEGES: Array<{
  key: PrivilegeKey
  label: string
  type: 'regular' | 'accountability'
  quantityLabel?: string
  quantityType?: 'ED' | 'Demerit'
}> = [
  { key: 'phone', label: 'Phone', type: 'regular' },
  { key: 'food_delivery', label: 'Food Delivery', type: 'regular' },
  { key: 'group_food_delivery', label: 'Group Food Delivery', type: 'regular' },
  { key: 'liberty', label: 'Liberty', type: 'regular' },
  {
    key: 'reduce_ed',
    label: 'Reduce ED',
    type: 'accountability',
    quantityLabel: 'ED to Reduce',
    quantityType: 'ED',
  },
  {
    key: 'offset_demerits',
    label: 'Offset Demerits',
    type: 'accountability',
    quantityLabel: 'Demerits to Offset',
    quantityType: 'Demerit',
  },
]

export function privilegeInfo(key: string) {
  return PRIVILEGES.find((p) => p.key === key)
}

export function privilegeLabel(key: string): string {
  return privilegeInfo(key)?.label ?? key
}

export function statusBadgeClass(status: string): string {
  switch (status) {
    case 'Confirmed':
      return 'badge badge-ok'
    case 'Cancelled':
    case 'Not Confirmed':
      return 'badge badge-bad'
    case 'Pending':
    default:
      return 'badge badge-warn'
  }
}

export const ROLE_NAV: Record<string, Array<{ to: string; label: string }>> = {
  owner: [
    { to: '/admin', label: 'Dashboard' },
    { to: '/admin/encode', label: 'New Availment' },
    { to: '/admin/confirmation', label: 'Confirmation' },
    { to: '/admin/records', label: 'Records' },
    { to: '/admin/reports', label: 'Reports' },
    { to: '/admin/cadets', label: 'Cadet Database' },
    { to: '/admin/prices', label: 'Prices' },
    { to: '/admin/accounts', label: 'Accounts' },
    { to: '/admin/public-settings', label: 'Public Settings' },
  ],
  admin: [
    { to: '/admin', label: 'Dashboard' },
    { to: '/admin/encode', label: 'New Availment' },
    { to: '/admin/confirmation', label: 'Confirmation' },
    { to: '/admin/records', label: 'Records' },
    { to: '/admin/reports', label: 'Reports' },
    { to: '/admin/cadets', label: 'Cadet Database' },
  ],
  staff: [
    { to: '/admin', label: 'Dashboard' },
    { to: '/admin/encode', label: 'New Availment' },
    { to: '/admin/confirmation', label: 'Confirmation' },
    { to: '/admin/records', label: 'Records' },
    { to: '/admin/reports', label: 'Reports' },
  ],
}
