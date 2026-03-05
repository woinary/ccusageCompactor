# ccusage-compact

A script that displays [ccusage](https://github.com/ryoppippi/ccusage) `blocks` output in a compact 80-character-wide table.

[日本語版 README はこちら](README.ja.md)

## Background

`npx ccusage@latest blocks --live` requires about 110 characters of terminal width, causing the Tokens column and others to be truncated on narrow terminals. This script displays the same information within 80 characters.

## Requirements

- Node.js
- npx (used to fetch ccusage)

No external npm dependencies.

## Usage

### Run once

```bash
node ccusage-compact.mjs
```

### Live update (every 30 seconds)

```bash
node ccusage-compact.mjs --live
```

### Live update (custom interval)

```bash
node ccusage-compact.mjs --live --interval 60
```

`--interval` is in seconds. Press Ctrl+C to exit.

## Example output

```
┌────────────────┬────────────┬───────────┬─────────┬─────────┬────────────────┐
│ Date (JST)     │ Status     │    Tokens │       % │    Cost │ Models         │
├────────────────┼────────────┼───────────┼─────────┼─────────┼────────────────┤
│ 03-03 00:00    │ 35m        │      438k │   17.4% │   $0.18 │ son,hku        │
│                │ gap 2h40m  │         - │       - │       - │                │
├────────────────┼────────────┼───────────┼─────────┼─────────┼────────────────┤
│ 03-03 08:00    │ 18m        │       73k │    2.9% │   $0.05 │ son            │
│                │ gap 1h13m  │         - │       - │       - │                │
├────────────────┼────────────┼───────────┼─────────┼─────────┼────────────────┤
│ 03-03 14:00    │ 2h7m       │      2.5M │  100.0% │   $1.21 │ son            │
├────────────────┼────────────┼───────────┼─────────┼─────────┼────────────────┤
│ 03-05 13:00    │ ACTIVE     │      668k │   26.6% │   $0.64 │ syn,son        │
├────────────────┼────────────┼───────────┼─────────┼─────────┼────────────────┤
│ (token limit)  │ REMAINING  │      1.8M │   73.4% │         │                │
│ (burn rate)    │ PROJECTED  │      1.0M │   40.7% │   $0.98 │                │
└────────────────┴────────────┴───────────┴─────────┴─────────┴────────────────┘
```

## Column reference

| Column | Description |
|--------|-------------|
| Date (JST) | Block start time in JST (`MM-DD HH:mm` format) |
| Status | Elapsed time / `ACTIVE` / `gap Xh` |
| Tokens | Total token count (`438k` / `2.5M`) |
| % | Percentage of estimated token limit (based on the maximum totalTokens across all blocks) |
| Cost | Cost in USD |
| Models | Abbreviated model names, comma-separated |

### Status values

| Value | Meaning |
|-------|---------|
| `35m` / `2h7m` | Duration of a completed block |
| `ACTIVE` | Currently active block |
| `gap 3h` / `gap 1h13m` | Idle time between sessions |

### Model abbreviations

| Abbr | Model |
|------|-------|
| `son` | claude-sonnet-* |
| `hku` | claude-haiku-* |
| `opu` | claude-opus-* |
| `syn` | \<synthetic\> |

### REMAINING / PROJECTED rows

Shown only when an active block exists:

| Row | Description |
|-----|-------------|
| REMAINING | Remaining tokens and percentage against the estimated limit |
| PROJECTED | Estimated total tokens and cost if the 5-hour block is fully consumed at the current burn rate |

## Notes

This script was created with [Claude Code](https://claude.ai/claude-code).
