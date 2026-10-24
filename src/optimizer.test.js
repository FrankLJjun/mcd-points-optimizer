import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rankMallByValueDensity, lotteryExpectedValue, bestCouponCombo } from './optimizer.js';

test('rankMallByValueDensity 按元/积分降序，标出最划算', () => {
  const products = [
    { name: 'A', points: 1000, cashPrice: 30 },
    { name: 'B', points: 500, cashPrice: 25 },
    { name: 'C', points: 2000, cashPrice: 40 },
  ];
  const r = rankMallByValueDensity(products);
  assert.equal(r[0].name, 'B'); // 25/500 = 0.05 最高
  assert.equal(r[0].verdict, '★最划算');
  assert.equal(r[2].name, 'C'); // 40/2000 = 0.02 最低
});

test('rankMallByValueDensity 无参考价时按积分升序兜底', () => {
  const r = rankMallByValueDensity([
    { name: 'X', points: 800 },
    { name: 'Y', points: 300 },
  ]);
  assert.equal(r[0].name, 'Y');
  assert.equal(r[0].verdict, '缺参考价');
});

test('lotteryExpectedValue 正期望给正向建议', () => {
  const prizes = [
    { name: '巨无霸', probability: 0.1, value: 25 },
    { name: '谢谢参与', probability: 0.9, value: 0 },
  ];
  const r = lotteryExpectedValue(prizes, 50, 0.01); // 消耗50积分≈¥0.5
  assert.equal(r.expectedPrize, 2.5);
  assert.equal(r.ev, 2.0); // 2.5 - 0.5
  assert.match(r.advice, /正/);
});

test('bestCouponCombo 满减叠加', () => {
  const coupons = [
    { id: 1, type: 'amount', value: 10, threshold: 50 },
    { id: 2, type: 'amount', value: 5, threshold: 20 },
  ];
  const r = bestCouponCombo(coupons, 100);
  assert.equal(r.totalSaved, 15);
  assert.equal(r.finalPrice, 85);
});

test('bestCouponCombo 折扣券按剩余价计算', () => {
  const coupons = [{ id: 1, type: 'percent', value: 0.9, threshold: 30 }];
  const r = bestCouponCombo(coupons, 100);
  assert.equal(r.totalSaved, 10);
  assert.equal(r.finalPrice, 90);
});

test('bestCouponCombo 不满足门槛的券被过滤', () => {
  const coupons = [{ id: 1, type: 'amount', value: 50, threshold: 200 }];
  const r = bestCouponCombo(coupons, 100);
  assert.equal(r.selected.length, 0);
  assert.equal(r.totalSaved, 0);
  assert.equal(r.finalPrice, 100);
});
