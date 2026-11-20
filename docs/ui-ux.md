# UI/UX Baseline and Backlog

A running record of aesthetic-usability work on Platform Atlas: what is already
true of the interface, and what is queued. Aesthetic-usability is not decoration
— a control that looks identical across states costs the user a second glance to
work out what just happened.

## Principles

1. **State is visible.** Hover, focus, active, and selected must each be
   distinguishable without guessing.
2. **One pattern per job.** Toolbar buttons, cards, and links that do the same
   thing should share a treatment, not a coincidence.
3. **Respect the reader.** Measure stays near 70 characters for prose; code
   blocks scroll horizontally instead of wrapping.
4. **Respect the OS.** `prefers-reduced-motion` and `prefers-color-scheme` are
   inputs, not edge cases.
5. **Additive over replacement.** Polish existing patterns; do not rip out
   working functionality to restyle it.

## Done

| Change                            | Where                                 | Why                                                                                                                                                                                                                                |
| --------------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Syntax highlighting               | `src/syntax/*`, guide code blocks     | Keywords, strings, comments, and numbers are scannable at a glance                                                                                                                                                                 |
| Language chip on code blocks      | `CodeBlock` header                    | A reader knows what they are looking at before reading a line                                                                                                                                                                      |
| Global `:focus-visible` ring      | `styles.css`                          | One keyboard-focus treatment for every control, replacing a per-selector list that silently missed new controls                                                                                                                    |
| Theme-aware text selection        | `--selection`                         | Selection matches the theme instead of the browser default                                                                                                                                                                         |
| `prefers-reduced-motion`          | `styles.css`                          | Transitions become effectively instant for users who ask for less motion                                                                                                                                                           |
| Thin theme-aware scrollbars       | scroll regions                        | Less visual noise in the sidebar, panels, and guide pages                                                                                                                                                                          |
| Toolbar hover transitions         | nav / roadmap / track / theme toggles | State changes animate consistently instead of snapping                                                                                                                                                                             |
| Search empty state                | toolbar search                        | A no-match query says so instead of rendering nothing                                                                                                                                                                              |
| Slim sticky guide bar             | product guide header                  | The 151px sticky block took a quarter of the viewport while reading; identity and back-navigation stay pinned, descriptive copy moved to a lead block that scrolls                                                                 |
| Rail clears the sticky bar        | guide right rail                      | The rail's sticky offset did not account for the header, so its first card (Track position) hid behind it                                                                                                                          |
| Phone guide layout                | ≤760px                                | The 300px rail left the main column 14px wide; columns now stack and the rail goes full width                                                                                                                                      |
| Phase chip drops on small screens | ≤560px                                | The chip repeats the rail's Track position card, so it is hidden when the bar runs out of room                                                                                                                                     |
| Guide tabs                        | product guide                         | Capabilities and synergies get their own panels instead of a single endless column; roving tabindex with arrow-key selection                                                                                                       |
| Map camera restore                | map ↔ guide/roadmap                   | Leaving the map and coming back restores the zoom instead of re-fitting, so opening a guide does not lose the view                                                                                                                 |
| Code block wheel scroll           | guide and track code blocks           | `overscroll-behavior: contain` made the block a scroll container in both axes, so the wheel stopped scrolling the page whenever the cursor was over code; vertical chaining is restored, horizontal stays contained                |
| Track page rhythm                 | AI Engineering track                  | The phase number became a chip in its own rail, with the title, categories, and tiles sharing one content column; tiles size to the container instead of stretching to the widest row                                              |
| Track focus card on phones        | ≤760px                                | The drill summary and the button stacked at full width instead of sharing one cramped row, and the desktop `flex-basis` no longer reserved 200px of vertical space                                                                 |
| Toolbar budget                    | toolbar                               | The bar overflowed by 92px at 1440 and the search silently collapsed to 22px; the decorative brand count and the domain pills now give way below 1760px, and `.tools` carries a real flex-basis so the search keeps a usable width |

## Backlog

Ordered by expected payoff. Each item should be verified in the browser before
it is committed.

1. **Card hover affordance.** Track items now lift their border and background on
   hover; product cards and recommendation rows still need the same treatment.
2. **Loading and empty states for the map.** The canvas has no first-load or
   no-selection affordance beyond the onboarding card.
3. **Keyboard reachability of the canvas.** Nodes are drawn in `<canvas>`, so
   they are not focusable; the sidebar and search are. Consider a list view as
   the accessible equivalent.
4. **Consistent status colour semantics.** `--status-done` / `--status-progress`
   exist; audit every badge to use them rather than ad-hoc colours.
5. **Dialog and popover anchoring.** The suggestion dialog is centred; the search
   results and any future menus should anchor to their trigger.
6. **Touch targets on small viewports.** The mobile breakpoint already enlarges
   some controls; audit the rest against the 44px guideline.
7. **Motion for view changes.** View switches are instant; a short, opt-out-able
   transition would orient the user.
8. **Code block affordances.** Copy-to-clipboard on hover, and line numbers for
   multi-line shell and Python samples.
