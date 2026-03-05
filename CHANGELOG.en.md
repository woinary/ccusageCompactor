# Changelog

All notable changes to this project will be documented in this file.

Versioning follows [Semantic Versioning](https://semver.org/):
- MAJOR: breaking changes (e.g. output format overhaul)
- MINOR: new features (e.g. new options)
- PATCH: bug fixes

## [Unreleased]

## v0.3.0 - 2026-03-05

### Added
- Short option aliases: `-l` for `--live`, `-i` for `--interval`, `-h` for `--help` ([#2](https://github.com/woinary/ccusageCompactor/issues/2))

## v0.2.0 - 2026-03-05

### Added
- `--help` option: displays usage and exits with code 0 ([#1](https://github.com/woinary/ccusageCompactor/issues/1))

## v0.1.0 - 2026-03-05

### Added
- `ccusage-compact.mjs`: displays `npx ccusage@latest blocks --json` output in a compact 80-column table
- `--live` option: auto-refresh mode (default interval: 30 seconds)
- `--interval <sec>` option: custom refresh interval (use with `--live`)
- UTC to JST conversion for Date column
- Model name abbreviations (`son`, `hku`, `opu`, `syn`)
- REMAINING / PROJECTED rows for active blocks
