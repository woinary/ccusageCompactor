# 変更履歴

このプロジェクトの主な変更はすべてこのファイルに記録する。

バージョン番号は [セマンティックバージョニング](https://semver.org/) に従う:
- MAJOR: 後方互換性のない変更（出力フォーマットの大幅変更など）
- MINOR: 機能追加（新オプションなど）
- PATCH: バグ修正

## [未リリース]

### 変更
- README: 短縮オプション・`--help` の使い方・動作確認済み ccusage バージョン（`18.0.8`）を追記

## v0.3.0 - 2026-03-05

### 追加
- 短縮オプション: `-l`（`--live`）、`-i`（`--interval`）、`-h`（`--help`）([#2](https://github.com/woinary/ccusageCompactor/issues/2))

## v0.2.0 - 2026-03-05

### 追加
- `--help` オプション: 使い方を表示して終了コード 0 で終了 ([#1](https://github.com/woinary/ccusageCompactor/issues/1))

## v0.1.0 - 2026-03-05

### 追加
- `ccusage-compact.mjs`: `npx ccusage@latest blocks --json` の出力を80文字幅のコンパクトな表で表示
- `--live` オプション: 自動更新モード（デフォルト間隔: 30秒）
- `--interval <秒>` オプション: 更新間隔を指定（`--live` と併用）
- Date カラムの UTC→JST 変換
- モデル名の略称表示（`son`、`hku`、`opu`、`syn`）
- アクティブブロックがある場合の REMAINING / PROJECTED 行
