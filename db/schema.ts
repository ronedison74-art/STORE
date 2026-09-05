import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  date,
  jsonb,
} from 'drizzle-orm/pg-core'

export const cadets = pgTable('cadets', {
  id: serial().primaryKey(),
  name: text().notNull(),
  active: boolean().notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// Singleton config row (id = 1)
export const prices = pgTable('prices', {
  id: integer().primaryKey(),
  phonePrice: integer('phone_price').notNull().default(10),
  foodDeliveryPrice: integer('food_delivery_price').notNull().default(10),
  groupFoodDeliveryPrice: integer('group_food_delivery_price')
    .notNull()
    .default(15),
  libertyPrice: integer('liberty_price').notNull().default(20),
  reduceEdMeritsPerEd: integer('reduce_ed_merits_per_ed').notNull().default(2),
  offsetDemeritsMeritsPerDemerit: integer('offset_demerits_merits_per_demerit')
    .notNull()
    .default(2),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// Singleton settings row (id = 1)
export const publicSettings = pgTable('public_settings', {
  id: integer().primaryKey(),
  enabled: boolean().notNull().default(false),
  sessionDate: date('session_date'),
  openTime: text('open_time'),
  closeTime: text('close_time'),
  allowedPrivileges: jsonb('allowed_privileges')
    .notNull()
    .default([
      'phone',
      'food_delivery',
      'group_food_delivery',
      'liberty',
      'reduce_ed',
      'offset_demerits',
    ]),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const accounts = pgTable('accounts', {
  id: serial().primaryKey(),
  name: text().notNull(),
  username: text().notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  passwordSalt: text('password_salt').notNull(),
  role: text().notNull().default('staff'), // owner | admin | staff
  status: text().notNull().default('pending'), // pending | active | disabled
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const transactionCounter = pgTable('transaction_counter', {
  id: integer().primaryKey(),
  value: integer().notNull().default(0),
})

export const transactions = pgTable('transactions', {
  id: serial().primaryKey(),
  transactionCode: text('transaction_code').notNull().unique(),
  cadetId: integer('cadet_id').references(() => cadets.id),
  cadetName: text('cadet_name').notNull(),
  privilege: text().notNull(),
  privilegeType: text('privilege_type').notNull(),
  quantity: integer(),
  quantityType: text('quantity_type'),
  conversionRate: integer('conversion_rate'),
  meritCost: integer('merit_cost').notNull(),
  availmentDate: date('availment_date').notNull(),
  confirmationDate: date('confirmation_date'),
  status: text().notNull().default('Pending'),
  meritsDeducted: integer('merits_deducted').notNull().default(0),
  violation: boolean().notNull().default(false),
  remarks: text(),
  source: text().notNull(),
  createdByAccountId: integer('created_by_account_id').references(
    () => accounts.id,
  ),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})
