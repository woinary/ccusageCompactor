#!/usr/bin/env node
import { execSync } from 'node:child_process';

// カラム幅定義: 14, 10, 9, 7, 7, 14 → 合計61 + 罫線19 = 80文字
const COL = { date: 14, status: 10, tokens: 9, pct: 7, cost: 7, models: 14 };

// モデル略称マップ
function abbreviateModel(name) {
  if (!name || name === '<synthetic>') return 'syn';
  if (name.includes('sonnet')) return 'son';
  if (name.includes('haiku')) return 'hku';
  if (name.includes('opus')) return 'opu';
  return name.slice(0, 3);
}

// UTC ISO文字列 → JST MM-DD HH:mm
function toJST(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const mm = String(jst.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(jst.getUTCDate()).padStart(2, '0');
  const hh = String(jst.getUTCHours()).padStart(2, '0');
  const min = String(jst.getUTCMinutes()).padStart(2, '0');
  return `${mm}-${dd} ${hh}:${min}`;
}

// 2つのISO文字列の差を分単位で返す
function diffMinutes(startIso, endIso) {
  if (!startIso || !endIso) return null;
  return (new Date(endIso) - new Date(startIso)) / 60000;
}

// トークン数フォーマット
function fmtTokens(n) {
  if (n == null || typeof n !== 'number') return '-';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
  return String(n);
}

// コスト フォーマット
function fmtCost(n) {
  if (n == null || typeof n !== 'number') return '-';
  return `$${n.toFixed(2)}`;
}

// % フォーマット
function fmtPct(n) {
  if (n == null || typeof n !== 'number') return '-';
  return `${n.toFixed(1)}%`;
}

// 期間フォーマット（分数 → "Xm" or "XhYm"）
function fmtDuration(minutes) {
  if (minutes == null) return '';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h${m}m`;
}

// gapの期間フォーマット（"gap Xh" or "gap XhYm"）
function fmtGap(minutes) {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (m === 0) return `gap ${h}h`;
  return `gap ${h}h${m}m`;
}

// セルを指定幅に切り詰め＋パディング
function cell(text, width, align = 'left') {
  const s = String(text ?? '');
  const truncated = s.length > width ? s.slice(0, width) : s;
  if (align === 'right') return truncated.padStart(width);
  return truncated.padEnd(width);
}

// 罫線
const topLine    = `┌${'─'.repeat(COL.date+2)}┬${'─'.repeat(COL.status+2)}┬${'─'.repeat(COL.tokens+2)}┬${'─'.repeat(COL.pct+2)}┬${'─'.repeat(COL.cost+2)}┬${'─'.repeat(COL.models+2)}┐`;
const midLine    = `├${'─'.repeat(COL.date+2)}┼${'─'.repeat(COL.status+2)}┼${'─'.repeat(COL.tokens+2)}┼${'─'.repeat(COL.pct+2)}┼${'─'.repeat(COL.cost+2)}┼${'─'.repeat(COL.models+2)}┤`;
const botLine    = `└${'─'.repeat(COL.date+2)}┴${'─'.repeat(COL.status+2)}┴${'─'.repeat(COL.tokens+2)}┴${'─'.repeat(COL.pct+2)}┴${'─'.repeat(COL.cost+2)}┴${'─'.repeat(COL.models+2)}┘`;
const headerLine = `│ ${cell('Date (JST)', COL.date)} │ ${cell('Status', COL.status)} │ ${cell('Tokens', COL.tokens, 'right')} │ ${cell('%', COL.pct, 'right')} │ ${cell('Cost', COL.cost, 'right')} │ ${cell('Models', COL.models)} │`;

function makeRow(date, status, tokens, pct, cost, models) {
  return `│ ${cell(date, COL.date)} │ ${cell(status, COL.status)} │ ${cell(tokens, COL.tokens, 'right')} │ ${cell(pct, COL.pct, 'right')} │ ${cell(cost, COL.cost, 'right')} │ ${cell(models, COL.models)} │`;
}

// JSONデータ取得
function fetchData() {
  try {
    const out = execSync(
      'npx ccusage@latest blocks --json --timezone Asia/Tokyo 2>/dev/null',
      { encoding: 'utf8', timeout: 30000 }
    );
    return JSON.parse(out);
  } catch (e) {
    return null;
  }
}

// トークン上限推定（全ブロック中の最大totalTokens）
function estimateTokenLimit(blocks) {
  let max = 0;
  for (const b of blocks) {
    if (!b.isGap && b.totalTokens && b.totalTokens > max) max = b.totalTokens;
  }
  return max || null;
}

function render(data) {
  if (!data) {
    console.error('データ取得失敗');
    return;
  }

  const blocks = Array.isArray(data) ? data : (data.blocks ?? []);
  const tokenLimit = estimateTokenLimit(blocks);

  const lines = [];
  lines.push(topLine);
  lines.push(headerLine);
  lines.push(midLine);

  let activeBlock = null;
  let firstRow = true;

  for (const b of blocks) {
    if (b.isGap) {
      // gap行: 1行にまとめる
      const gapMin = diffMinutes(b.startTime, b.endTime) ?? 0;
      const statusStr = fmtGap(gapMin);
      lines.push(makeRow('', statusStr, '-', '-', '-', ''));
    } else {
      // 通常ブロック
      const dateStr = toJST(b.startTime);
      let statusStr = '';

      if (b.isActive) {
        statusStr = 'ACTIVE';
        activeBlock = b;
      } else {
        // duration = startTime → actualEndTime
        const durMin = diffMinutes(b.startTime, b.actualEndTime);
        statusStr = fmtDuration(durMin);
      }

      const tokensStr = b.totalTokens != null ? fmtTokens(b.totalTokens) : '-';

      let pctStr = '-';
      if (b.totalTokens != null && tokenLimit) {
        pctStr = fmtPct((b.totalTokens / tokenLimit) * 100);
      }

      const costStr = b.costUSD != null ? fmtCost(b.costUSD) : '-';

      const modelNames = (b.models ?? [])
        .filter(m => m && m !== '-')
        .map(abbreviateModel);
      const uniqueModels = [...new Set(modelNames)];
      const modelsStr = uniqueModels.join(',');

      if (!firstRow) lines.push(midLine);
      lines.push(makeRow(dateStr, statusStr, tokensStr, pctStr, costStr, modelsStr));
      firstRow = false;
    }
  }

  // REMAINING / PROJECTED 行
  if (activeBlock && tokenLimit) {
    lines.push(midLine);

    const remainingTokens = tokenLimit - (activeBlock.totalTokens ?? 0);
    const remainPct = (remainingTokens / tokenLimit) * 100;
    lines.push(makeRow(
      '(token limit)',
      'REMAINING',
      fmtTokens(remainingTokens),
      fmtPct(remainPct),
      '',
      ''
    ));

    if (activeBlock.projection) {
      const proj = activeBlock.projection;
      const projTokens = proj.totalTokens ?? null;
      const projCost = proj.totalCost ?? null;
      const projPct = projTokens != null && tokenLimit ? (projTokens / tokenLimit) * 100 : null;
      lines.push(makeRow(
        '(burn rate)',
        'PROJECTED',
        projTokens != null ? fmtTokens(projTokens) : '-',
        projPct != null ? fmtPct(projPct) : '-',
        projCost != null ? fmtCost(projCost) : '-',
        ''
      ));
    }
  }

  lines.push(botLine);
  console.log(lines.join('\n'));
}

// コマンドライン引数パース
const args = process.argv.slice(2);

// --help の処理（他の引数チェックより先に評価）
if (args.includes('--help')) {
  console.log(`Usage: node ccusage-compact.mjs [options]

Display ccusage blocks in a compact 80-column table.

Options:
  --live               Auto-refresh (default: every 30 seconds)
  --interval <sec>     Refresh interval in seconds (use with --live)
  --help               Show this help message
`);
  process.exit(0);
}

const liveMode = args.includes('--live');
const intervalIdx = args.indexOf('--interval');
const intervalSec = intervalIdx !== -1 ? parseInt(args[intervalIdx + 1], 10) || 30 : 30;

if (liveMode) {
  const run = () => {
    process.stdout.write('\x1b[2J\x1b[H'); // 画面クリア
    render(fetchData());
    process.stderr.write(`\n(${intervalSec}秒ごとに更新 / Ctrl+Cで終了)\n`);
  };
  run();
  setInterval(run, intervalSec * 1000);
} else {
  render(fetchData());
}
