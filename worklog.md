# 作業記録

## 2026-03-05: ccusage-compact.mjs 実装

### 背景

ccusageの `blocks --live` は約110文字幅が必要で、80文字程度の狭い端末ではTokens列が切れる問題があった。
`blocks --json` でJSONを取得して80文字幅のコンパクトな表を表示するスクリプトを作成することにした。

### 計画フェーズで決定した仕様

- 目標幅: 80文字
- 言語: Node.js（外部依存なし）
- データソース: `npx ccusage@latest blocks --json --timezone Asia/Tokyo`
- カラム構成: Date(14) / Status(10) / Tokens(9) / %(7) / Cost(7) / Models(14) → 61 + 罫線19 = 80
- gap行: 1行にまとめて表示
- 実行モード: デフォルト1回実行 / `--live` で自動更新 / `--interval <秒>` で間隔指定

### 実装フェーズで発覚した仕様差異

計画時点では `durationMinutes` フィールドがあると想定していたが、実際のJSONには存在しなかった。

**対処**: `startTime` と `actualEndTime` の差分をミリ秒から分単位に変換して算出。gap行は `startTime` と `endTime` の差分を使用。

#### 実際のJSONフィールド（ブロック1件の例）

```json
{
  "id": "2026-03-02T15:00:00.000Z",
  "startTime": "2026-03-02T15:00:00.000Z",
  "endTime": "2026-03-02T20:00:00.000Z",
  "actualEndTime": "2026-03-02T15:34:57.523Z",
  "isActive": false,
  "isGap": false,
  "totalTokens": 438319,
  "costUSD": 0.18284655,
  "models": ["claude-sonnet-4-6", "claude-haiku-4-5-20251001"],
  "burnRate": null,
  "projection": null
}
```

activeブロックの `projection` フィールド:

```json
{
  "totalTokens": 1182818,
  "totalCost": 1.04,
  "remainingMinutes": 101
}
```

計画では `projection.costUSD` を想定していたが、実際は `projection.totalCost`。

#### トップレベルのJSON構造

`blocks --json` の出力はブロック配列を直接返す（`{ blocks: [...] }` ではなく `[...]`）。

### 実装手順

1. `ccusage-compact.mjs` を新規作成（初版）
2. 実行して動作確認 → Statusカラムが空、`gap 0h` が表示される問題を発見
3. `blocks --json` の実際のフィールド構造を確認（`durationMinutes` 非存在を確認）
4. activeブロック周辺のフィールドを確認（`projection.totalCost` の正確な名称を確認）
5. `diffMinutes()` 関数を追加し、duration計算を修正して再作成

### 動作確認結果

```
┌────────────────┬────────────┬───────────┬─────────┬─────────┬────────────────┐
│ Date (JST)     │ Status     │    Tokens │       % │    Cost │ Models         │
├────────────────┼────────────┼───────────┼─────────┼─────────┼────────────────┤
│ 03-03 00:00    │ 35m        │      438k │   17.4% │   $0.18 │ son,hku        │
│                │ gap 2h40m  │         - │       - │       - │                │
├────────────────┼────────────┼───────────┼─────────┼─────────┼────────────────┤
│ 03-05 13:00    │ ACTIVE     │      668k │   26.6% │   $0.64 │ syn,son        │
├────────────────┼────────────┼───────────┼─────────┼─────────┼────────────────┤
│ (token limit)  │ REMAINING  │      1.8M │   73.4% │         │                │
│ (burn rate)    │ PROJECTED  │      1.0M │   40.7% │   $0.98 │                │
└────────────────┴────────────┴───────────┴─────────┴─────────┴────────────────┘
```

- 表示幅: `str.length` = 80文字（正確）
  - ※ `wc -L` / `awk length()` はUTF-8罫線文字をバイト数で計測するため240と出る（誤り）
- ccusageはアクティブブロック内にも短いgap行を生成することがある（正常動作）

### 成果物

- `/Users/woinary/ClaudeWorkspace/ccusageCompactor/ccusage-compact.mjs`

---

## 2026-03-05: ドキュメント整備 / `--help` オプション追加 (v0.2.0)

### 対応内容

#### Issue #1: `--help` オプションの追加

`ccusage-compact.mjs` に `--help` オプションを追加。他の引数チェックより先に評価し、使い方を stdout に出力して終了コード 0 で終了する。

#### 更新履歴ファイルの作成

- `CHANGELOG.en.md` / `CHANGELOG.ja.md` を新規作成（日英2ファイル構成）
- バージョン管理方式をセマンティックバージョニング（`vMAJOR.MINOR.PATCH`）に決定
  - 日付ベースでは1日に複数改訂した際にエントリが衝突するため
- `v0.1.0`: 初期リリース、`v0.2.0`: `--help` 追加

#### CLAUDE.md への開発ルール追記

- 更新履歴ルール: 修正・機能追加時は `CHANGELOG.en.md` と `CHANGELOG.ja.md` を両方更新
- ドキュメント同期ルール: README / CHANGELOG は日英を常に同期
- バージョン管理ポリシー: セマンティックバージョニングの方針を明記

### 成果物

- `ccusage-compact.mjs`（`--help` オプション追加）
- `CHANGELOG.en.md`（新規）
- `CHANGELOG.ja.md`（新規）
- `CLAUDE.md`（開発ルール追記）
- `README.md` / `README.ja.md`（微修正）

---

## 2026-03-05: 短縮オプション追加 (v0.3.0)

### 対応内容

Issue #2 の対応。`--live` / `--interval` / `--help` に対して `-l` / `-i` / `-h` の短縮形を追加。

引数パース部分を以下のように修正:
- `args.includes('--help')` → `|| args.includes('-h')` を追加
- `args.includes('--live')` → `|| args.includes('-l')` を追加
- `--interval` の `indexOf` を `-i` にもフォールバック
- ヘルプテキストに短縮形を併記（`-l, --live` 形式）

### 成果物

- `ccusage-compact.mjs`（短縮オプション追加）
- `CHANGELOG.en.md` / `CHANGELOG.ja.md`（v0.3.0 エントリ追加）
