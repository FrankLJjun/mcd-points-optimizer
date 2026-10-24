/**
 * 麦麦积分操盘手 — 核心分析逻辑（纯函数，无外部依赖，便于测试与复用）
 *
 * 设计原则：
 *  - 所有函数都不依赖网络，真实数据由 MCP 客户端获取后传入。
 *  - 计算口径透明、可解释，输出既给结论也给依据。
 */

/**
 * 积分商城价值精算
 * @param {Array} products 商品列表，每项: { name, points, cashPrice?, category? }
 *   - points: 兑换所需积分
 *   - cashPrice: 可选，该商品的市场参考价（元）。缺失则退化为“按积分升序”
 * @returns {Array} 含 efficiency(元/积分)、verdict 的排序结果
 */
export function rankMallByValueDensity(products) {
  if (!Array.isArray(products) || products.length === 0) return [];
  const scored = products.map((p) => {
    const points = Number(p.points) || 0;
    const cash = typeof p.cashPrice === 'number' ? p.cashPrice : null;
    const efficiency = cash != null && points > 0 ? +(cash / points).toFixed(4) : null;
    return { ...p, points, cashPrice: cash, efficiency };
  });
  scored.sort((a, b) => {
    if (a.efficiency != null && b.efficiency != null) return b.efficiency - a.efficiency;
    if (a.efficiency != null) return -1;
    if (b.efficiency != null) return 1;
    return a.points - b.points;
  });
  const best = scored.find((s) => s.efficiency != null);
  return scored.map((s, i) => ({
    ...s,
    rank: i + 1,
    verdict: best && s.efficiency === best.efficiency ? '★最划算' : s.efficiency != null ? '可考虑' : '缺参考价',
  }));
}

/**
 * 积分抽奖期望值(Expected Value)分析
 * @param {Array} prizes 奖品列表，每项: { name, probability(0~1), value(元) }
 * @param {number} costPerDraw 每次抽奖消耗的积分（机会成本）
 * @param {number} pointValue 每积分的参考价值（元），默认 0.01
 * @returns {{ ev:number, expectedPrize:number, costMoney:number, advice:string, detail:Array }}
 */
export function lotteryExpectedValue(prizes, costPerDraw = 0, pointValue = 0.01) {
  const costMoney = costPerDraw * pointValue;
  const detail = (prizes || []).map((p) => ({
    name: p.name,
    prob: p.probability,
    value: p.value,
    contribution: +((p.probability || 0) * (p.value || 0)).toFixed(4),
  }));
  const expectedPrize = detail.reduce((s, d) => s + d.contribution, 0);
  const ev = +(expectedPrize - costMoney).toFixed(4);
  let advice;
  if (costPerDraw === 0) {
    advice = '未提供消耗，仅给出奖品期望价值，请自行评估积分机会成本。';
  } else if (ev > 0) {
    advice = `期望收益为正(¥${ev})，积分富余时可适量参与；注意中奖是概率事件，期望为正不等于必中。`;
  } else {
    advice = `期望收益为负(¥${ev})，从数学期望看不划算，建议把积分留着兑换实物更稳。`;
  }
  return { ev, expectedPrize: +expectedPrize.toFixed(4), costMoney: +costMoney.toFixed(4), advice, detail };
}

/**
 * 优惠券叠加最省方案（贪心）
 * @param {Array} coupons 券列表，每项: { id, type:'amount'|'percent', value, threshold? }
 *   - amount: 满 threshold 减 value（元）
 *   - percent: 满 threshold 打 value 折（0.9 表示 9 折）
 * @param {number} subtotal 订单原价（元）
 * @param {object} opts { allowMultiple:boolean } 是否允许多张叠加（默认 true）
 * @returns {{ selected:Array, totalSaved:number, finalPrice:number }}
 */
export function bestCouponCombo(coupons, subtotal, opts = {}) {
  const allowMultiple = opts.allowMultiple !== false;
  const usable = (coupons || []).filter((c) => {
    const th = typeof c.threshold === 'number' ? c.threshold : 0;
    return subtotal >= th;
  });
  const discountOf = (c, base) => {
    if (c.type === 'amount') return Math.min(c.value, base);
    if (c.type === 'percent') return +(base * (1 - c.value)).toFixed(2);
    return 0;
  };
  const picked = [];
  let remaining = subtotal;
  const pool = [...usable];
  while (pool.length && (allowMultiple || picked.length === 0)) {
    let bestIdx = -1;
    let bestSave = 0;
    pool.forEach((c, idx) => {
      const th = typeof c.threshold === 'number' ? c.threshold : 0;
      if (remaining < th) return;
      const save = discountOf(c, remaining);
      if (save > bestSave) {
        bestSave = save;
        bestIdx = idx;
      }
    });
    if (bestIdx === -1) break;
    const c = pool.splice(bestIdx, 1)[0];
    picked.push(c);
    remaining = +(remaining - bestSave).toFixed(2);
  }
  const totalSaved = +(subtotal - remaining).toFixed(2);
  return { selected: picked, totalSaved, finalPrice: remaining };
}

export const VERSION = '1.0.0';
