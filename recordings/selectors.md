# BDS Component CSS Selectors

Tested selectors for use with Pagecast `interact_page` and Playwright MCP snapshots.
Update this file whenever a new component is targeted in a recording session.

| Component | Selector | Notes |
|-----------|----------|-------|
| Select (by option value) | `select:has(option[value='UUID'])` | Works for any `<select>` with known option values |
| Radio (by value) | `.bds-radio:has(input[value='vendor'])` | BDS Radio group — target input value, not label |
| Board card (nth column) | `.bds-board-column:nth-child(N) .bds-board-card` | N is 1-indexed column position |
| Sheet tab (by position) | `.bds-sheet__tab:nth-child(N)` | N is tab order; use Playwright snapshot to confirm index |
| Notification (unread) | `.bds-notification-item--unread` | Targets first unread; chain `:first-of-type` if needed |
| Sheet close button | `.bds-sheet__close` | Top-right X; present in all BDS Sheet variants |
| Button (by label text) | `button:has-text("Submit Request")` | Use for BDS Button components; text must match exactly |
| Badge (by status) | `.bds-badge--positive`, `.bds-badge--error` | Status variant classes |

## Usage in Pagecast

```js
// interact_page action object
{ "type": "click", "selector": ".bds-board-column:nth-child(2) .bds-board-card" }
{ "type": "type",  "selector": "textarea[name='description']", "text": "Autoclave issue" }
{ "type": "scroll", "selector": ".bds-sheet__body", "direction": "down", "amount": 300 }
```

## Finding unknown selectors

Use Playwright MCP (`mcp__playwright__browser_snapshot`) to get the accessibility tree for the current page state.
Never guess a selector — always verify with a snapshot first.

```
mcp__playwright__browser_snapshot → scan for role/label → map to CSS selector
```
