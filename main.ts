import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const INPUT_DIR = process.env.MAKEFUN_INPUT_DIR ?? '/input';
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const QUANTILES = [0.05, 0.25, 0.5, 0.75, 0.95];
const Z = [-1.587799, -0.579081, 0, 0.538315, 1.886267];
const KAPPA = 0.008;
const SIGMA_FLOOR = 0.0005;
const SIGMA_CAP = 0.007;

interface CaseMarket {
  id: string;
  prices: number[];
}

interface Case {
  horizon_minutes: number;
  quantiles: number[];
  markets: CaseMarket[];
}

const price6 = (x: number): number => Math.round(Math.min(1, Math.max(0, x)) * 1e6) / 1e6 + 0;

function forecast(m: CaseMarket, horizon: number): number[][] {
  const prices = m.prices;
  const lastPrice = prices.length > 0 ? (prices[prices.length - 1] as number) : 0.5;
  const x = lastPrice;
  
  let sigma = 0.0025; // Default fallback
  if (prices.length > 1) {
    const diffs: number[] = [];
    for (let i = Math.max(0, prices.length - 1 - 120); i < prices.length - 1; i++) {
      diffs.push((prices[i + 1] as number) - (prices[i] as number));
    }
    
    if (diffs.length > 0) {
      const meanSquaredDiff = diffs.reduce((sum, d) => sum + d * d, 0) / diffs.length;
      const sigmaRaw = Math.sqrt(meanSquaredDiff);
      sigma = Math.min(Math.max(sigmaRaw, SIGMA_FLOOR), SIGMA_CAP);
    } else {
      sigma = SIGMA_FLOOR;
    }
  } else {
    sigma = SIGMA_FLOOR;
  }

  const rows: number[][] = [];
  for (let h = 1; h <= horizon; h++) {
    const g_h = Math.sqrt((1 - Math.exp(-2 * KAPPA * h)) / (2 * KAPPA));
    const row = Z.map((z) => {
        const val = x + z * sigma * g_h;
        return price6(val);
    });
    
    // Ensure non-decreasing
    for (let i = 1; i < row.length; i++) {
        if (row[i]! < row[i - 1]!) {
            row[i] = row[i - 1]!;
        }
    }
    rows.push(row);
  }
  return rows;
}

mkdirSync(OUTPUT_DIR, { recursive: true });
const inputs = readdirSync(INPUT_DIR).filter((f) => f.endsWith('.in')).sort();
for (const file of inputs) {
  const id = file.slice(0, -'.in'.length);
  const c = JSON.parse(readFileSync(join(INPUT_DIR, file), 'utf8')) as Case;
  
  const forecasts = c.markets.map((m) => ({ 
      id: m.id, 
      q: forecast(m, c.horizon_minutes) 
  }));
  
  writeFileSync(join(OUTPUT_DIR, `${id}.out`), `${JSON.stringify({ forecasts })}\n`);
}
