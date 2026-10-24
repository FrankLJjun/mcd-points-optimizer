/**
 * 麦麦积分操盘手 — 命令行入口
 *  - 无 Token：运行演示（用内置样例数据展示分析逻辑）
 *  - 有 Token：连接麦当劳 MCP，拉取真实数据并做端到端分析
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

/** 从 MCP 工具返回里抽取业务数据：优先 structuredContent.data，否则从文本尾部解析 JSON */
function extract(result) {
  const text = result?.content?.[0]?.text || '';
  let data = result?.structuredContent?.data ?? result?.structuredContent;
  if (data === undefined) {
    const idx = text.lastIndexOf('{"success"');
    if (idx >= 0) {
      try {
        data = JSON.parse(text.slice(idx)).data;
      } catch {
        /* ignore */
      }
    }
  }
  return { data, text };
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

async function realReport(client) {
  console.log('\n=== 麦麦积分操盘手 · 实时分析报告（真实麦当劳 MCP 数据）===\n');

  // 1) 积分账户
  try {
    const { data: a } = extract(await client.callTool('query-my-account', {}));
    const acc = a || {};
    console.log(
      `【积分账户】可用积分 ${acc.availablePoint ?? '?'} | 累计 ${acc.accumulativePoint ?? '?'} | ` +
        `本月将过期 ${acc.currentMouthExpirePoint ?? '0'} | 货币 ${acc.currency ?? '—'}`
    );
  } catch (e) {
    console.log('（账户查询失败：' + e.message + '）');
  }

  // 2) 积分商城价值精算
  try {
    const { data: list } = extract(await client.callTool('mall-points-products', {}));
    const products = (Array.isArray(list) ? list : [])
      .map((p) => ({ name: p.spuName, points: Number(p.point) || 0, cashPrice: Number(p.price) > 0 ? Number(p.price) : null }))
      .filter((p) => p.points > 0);
    if (products.length) {
      const mall = rankMallByValueDensity(products);
      console.log('\n【1. 积分商城价值精算】（所需金额/所需积分 越高越划算）');
      mall.slice(0, 8).forEach((p) =>
        console.log(`  #${p.rank} ${p.name} | ${p.points}积分+${p.cashPrice != null ? '¥' + p.cashPrice : '—'} | ${p.efficiency != null ? p.efficiency + '元/积分' : '缺金额'} | ${p.verdict}`)
      );
    } else {
      console.log('\n（商城暂无可兑换商品或返回结构变化）');
    }
  } catch (e) {
    console.log('（商城查询失败：' + e.message + '）');
  }

  // 3) 积分抽奖
  try {
    const { data: d } = extract(await client.callTool('query-lottery-info', {}));
    const info = d || {};
    const prizes = Array.isArray(info.prizes) ? info.prizes : [];
    console.log(`\n【2. 积分抽奖】活动：${info.activityName ?? info.activityStatusText ?? '无'} | 单次消耗积分 ${info.drawPoint ?? '?'} | 剩余可抽 ${info.availableTimes ?? '?'} 次`);
    if (prizes.length && prizes[0]?.probability != null) {
      const ev = lotteryExpectedValue(
        prizes.map((x) => ({ name: x.name, probability: Number(x.probability), value: Number(x.value) || 0 })),
        Number(info.drawPoint) || 0,
        0.01
      );
      console.log(`  奖品 ${prizes.length} 项 | 期望价值 ¥${ev.expectedPrize} | EV=¥${ev.ev} | 建议：${ev.advice}`);
    } else {
      console.log(`  奖品 ${prizes.length} 项（概率/价值字段未返回，EV 需实际抽奖数据）`);
    }
  } catch (e) {
    console.log('（抽奖查询失败：' + e.message + '）');
  }

  // 4) 我的优惠券
  try {
    const { text } = extract(await client.callTool('query-my-coupons', {}));
    const cnt = (text.match(/^## /gm) || []).length;
    console.log(`\n【3. 我的优惠券】可用 ${cnt} 张（运行 auto-bind-coupons 可一键领取麦麦省券）`);
  } catch (e) {
    console.log('（券查询失败：' + e.message + '）');
  }

  console.log('\n（数据来自麦当劳中国 MCP 实时接口；分析逻辑见 src/optimizer.js）\n');
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
    await realReport(client);
  } catch (e) {
    console.error('真实联调失败（不影响分析逻辑）：', e.message);
    printReport();
  }
}

main();
