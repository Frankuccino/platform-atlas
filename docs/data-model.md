# Platform Atlas — Data Model

Status: proposed, not yet implemented

## Catalog: TypeScript, not database

The catalog is content, not user data. It ships in code.

```ts
// src/catalog/types.ts

export type DeliveryModel = 'managed' | 'open-source' | 'both' | 'cloud';

export interface Product {
  id: string;            // stable slug, e.g. "vercel"
  name: string;
  model: DeliveryModel;
  what: string;          // when to reach for it
  alternatives: string[]; // product ids, not display names
}

export interface Category {
  id: string;
  name: string;
  blurb: string;
  domain: DomainId;      // new: for grouping the index
  productIds: string[];
}
```

Two deliberate choices here:

- `alternatives` holds **ids**, not display names. A rename then updates one row
  instead of every row that references it.
- `productIds` holds ids in order. The display order is explicit data, not array
  position.

The current pipe-delimited format has no ids. Generating them is mechanical
(`Vercel` becomes `vercel`), and the verification script proves no collisions.

## Study state: Postgres

```sql
-- One row per user, per product. The unit of scheduling.
create table user_product (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  product_id    text not null,
  status        text not null default 'unseen', -- unseen|learning|known|mastered
  confidence    smallint not null default 0,     -- 0..3
  interval_days smallint not null default 1,
  due_at        timestamptz not null,
  last_reviewed_at timestamptz,
  notes         text not null default '',
  created_at    timestamptz not null default now(),
  unique (user_id, product_id)
);

-- Append-only. Never update a row; insert a new one.
create table review (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  product_id   text not null,
  core_set_id  text not null,
  quality      smallint not null,   -- 0..5, SM-2 style
  prompt       text not null,       -- the question asked
  answer       text,                -- what you wrote, nullable
  reviewed_at  timestamptz not null default now()
);

create index on review (user_id, reviewed_at desc);

-- Core sets: which products are in scope for a given career target.
create table core_set (
  id          text primary key,        -- e.g. "fullstack-ts"
  name        text not null,
  description text not null,
  created_at  timestamptz not null default now()
);

create table core_set_member (
  core_set_id text not null references core_set(id) on delete cascade,
  product_id  text not null,
  priority    smallint not null default 0,
  primary key (core_set_id, product_id)
);
```

## Core set: reference, not flag

A product can be core for one career target and lookup-only for another. Two ways
to model that:

- **Flag on the product** — add a column listing which targets it belongs to.
- **Membership table** — each target owns its own list of product ids.

Going with membership. The flag approach puts a many-to-many relationship inside
a single column, so adding a third target means migrating every product row, and
removing a product means finding every row that mentions it. Membership keeps the
product row untouched and the core set is just a query.

This also means a product deleted from the catalog leaves a dangling
`core_set_member` row rather than corrupting the product table — and the fix is a
cascade or an explicit cleanup, not a data repair.

## The append-only rule

`review` is never updated. If you re-answer a prompt, that is a new row. The
reason: a spaced-repetition algorithm is only debuggable if you can replay your
own history. Mutating rows destroys the evidence.

## Why user_id is a foreign key to auth.users

Session lives in the database, not in a signed cookie. A stateless JWT is fine
until you need to revoke it or force logout everywhere, at which point you need a
server-side record anyway. Since the study history is already in Postgres, keeping
the session there costs nothing extra and buys revocation.
