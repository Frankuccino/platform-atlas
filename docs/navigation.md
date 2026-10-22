# Platform Atlas — Category Navigation

Status: proposed, not yet implemented

## The problem

The current index is a flat list of 26 category links, sticky on the left. It is
correctly categorised and it is overwhelming to scan. Adding search, a filter bar,
or a collapsible sidebar does not fix this — it buries it under more chrome.

This is a navigation problem, not a taxonomy problem. Do not reorganise the data.

## The fix: hierarchy without touching the data

Group the 26 categories into 6 domains. Each domain is a collapsible group with a
count. Collapsed by default on first load, so the index is 6 lines instead of 26.
Expanding one reveals only the categories inside it.

| Domain | Categories |
| --- | --- |
| Foundation | Cloud infrastructure, App hosting and deploy platforms, CI/CD containers IaC |
| Data | Databases and data stores, Data warehouse and pipelines, Storage and media |
| Runtime | Realtime and messaging, Message queues and event streaming, Workflow and background jobs |
| Product | Observability, Error tracking and analytics, Incident response, Auth, Search, Feature flags |
| Platform services | Payments, Communications APIs, Email and notifications, Maps, Integrations |
| AI and business | AI and ML platforms, Security and secrets, Backend-as-a-service, Customer and business platforms |

The category rows themselves are unchanged. Only the index gains a level.

## Two details that matter

**Counts reflect active filters, not raw totals.** An empty group visibly stays
empty instead of showing a number that lies to you. If you filter by
open-source, a group with no open-source products shows 0 and reads as
informative rather than broken.

**The sticky index should only stick when it helps.** On a short page it is chrome,
not navigation. Use `position: sticky` with a `max-height` and `overflow: auto` as
it does now, and drop the stickiness below the mobile breakpoint where the index
already becomes a horizontal scroll strip.

## Where this connects to the rest

This is the same layered structure as the rest of the app: the domain is a
presentation concern layered over the catalog, and the catalog does not know it
exists. If you later rename a category, the domain grouping is a separate lookup
and nothing breaks.

It is also the same principle as bounded contexts in DDD — one large map, but
distinct groupings per view, each with its own vocabulary.

## Mobile

Below 860px the index becomes a horizontal scroll strip, as it already does. The
domain grouping should flatten there: show domain chips that scroll horizontally
rather than nested collapsible groups, which are awkward to use one-handed.
