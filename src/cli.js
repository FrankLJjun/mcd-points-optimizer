/**
 * 麦麦积分操盘手 — 命令行入口
 *  - 无 Token：运行演示（用内置样例数据展示分析逻辑）
 *  - 有 Token：连接麦当劳 MCP，拉取真实数据并分析
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { rankMallByValueDensity, lotteryExpectedValue, bestCouponCombo } from './optimizer.js';
import { createMcpClient } from './mcp-client.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  try {
    const txt = readFileSync(join(__dirname, '..', '.env'), 'utf8');
    for (const line of txt.split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
      }
    }
  } catch {
    /* 无 .env 也可运行演示 */
  }
}

const DEMO = {
  products: [
    { name: '麦麦商城-保温杯', points: 1200, cashPrice: 39 },
    { name: '麦麦商城-帆布包', points: 600, cashPrice: 29 },
    { name: '麦麦商城-玩具车', points: 2500, cashPrice: 49 },
    { name: '麦麦商城-钥匙扣', points: 300, cashPrice: 9 },
  ],
  prizes: [
    { name: '巨无霸兑换券', probability: 0.05, value: 25 },
    { name: '薯条券', probability: 0.2, value: 12 },
    { name: '谢谢参与', probability: 0.75, value: 0 },
  ],
  coupons: [
    { id: 'c1', type: 'amount', value: 10, threshold: 50 },
    { id: 'c2', type: 'amount', value: 5, threshold: 20 },
  ],
};

function printReport() {
  console.log('\n=== 麦麦积分操盘手 · 分析报告（演示数据）===\n');

  const mall = rankMallByValueDensity(DEMO.products);
  console.log('【1. 积分商城价值精算】（元/积分 越高越划算）');
  mall.forEach((p) =>
    console.log(`  #${p.rank} ${p.name} | ${p.points}积分 | ${p.efficiency != null ? p.efficiency + '元/积分' : '无参考价'} | ${p.verdict}`)
  );

  const ev = lotteryExpectedValue(DEMO.prizes, 50, 0.01);
  console.log('\n【2. 积分抽奖期望值】');
  console.log(`  奖品期望价值 ¥${ev.expectedPrize} | 单次消耗≈¥${ev.costMoney} | EV=¥${ev.ev}`);
  console.log(`  建议：${ev.advice}`);

  const combo = bestCouponCombo(DEMO.coupons, 100);
  console.log('\n【3. 优惠券叠加最省】（订单原价¥100）');
  console.log(`  选用券：${combo.selected.map((c) => c.id).join(', ') || '无'} | 共省¥${combo.totalSaved} | 实付¥${combo.finalPrice}`);
  console.log('\n（演示数据，真实数据需在 .env 填入 MCD_MCP_TOKEN 后运行）\n');
}

async function main() {
  loadEnv();
  const token = process.env.MCD_MCP_TOKEN;
  if (!token || token === 'YOUR_MCD_MCP_TOKEN') {
    printReport();
    return;
  }
  try {
    const client = await createMcpClient({ token, url: process.env.MCD_MCP_URL });
    const tools = await client.listTools();
    console.log(`已连接麦当劳 MCP，可用工具 ${tools.length} 个。`);
    const r = await client.callTool('mall-points-products', {});
    console.log(JSON.stringify(r, null, 2).slice(0, 1200));
  } catch (e) {
    console.error('真实联调失败（不影响分析逻辑）：', e.message);
    printReport();
  }
}

main();
