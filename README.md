# 麦麦积分操盘手（mcd-points-optimizer）

> 基于 **麦当劳中国 MCP** 的积分资产最优配置助手。一句话目标：**帮用户把每一分麦当劳积分，花在刀刃上。**

本项目为「麦当劳程序员创意开发大赛」参赛作品，由参赛者独立开发，**非麦当劳官方产品**。

---

## 它能做什么

| 能力 | 说明 | 底层麦当劳 MCP 工具 |
|---|---|---|
| 🛒 积分商城价值精算 | 拉取积分商城全部可兑换商品，按「元/积分」价值密度排序，告诉你哪个最划算 | `mall-points-products` / `mall-product-detail` |
| 🎰 抽奖期望值分析 | 读取奖品池与消耗规则，算出抽奖 EV，给「该不该抽」的量化建议 | `query-lottery-info` / `draw-lottery` / `query-my-prizes` |
| 🎟️ 优惠券管家 | 一键领取麦麦省全部可用券，并按订单原价算出最优叠加方案（省多少、实付多少） | `available-coupons` / `auto-bind-coupons` / `query-my-coupons` / `query-store-coupons` |
| 📊 积分账户概览 | 看可用 / 即将过期积分，提醒别让积分白白失效 | `query-my-account` |

---

## 安装方法

```bash
# 1. 克隆仓库
git clone https://github.com/FrankLJjun/mcd-points-optimizer.git
cd mcd-points-optimizer

# 2. 配置 Token（仅占位符，不提交真实密钥）
cp .env.example .env
#   然后编辑 .env，把 YOUR_MCD_MCP_TOKEN 换成你在 https://open.mcd.cn/mcp 申请的真实 Token

# 3. 运行（无需安装任何第三方依赖，Node >= 18）
npm test     # 运行分析逻辑单元测试
npm start    # 有 Token 联调真实数据；无 Token 自动跑演示
```

> 也可直接在 **WorkBuddy** 中加载本仓库的 `SKILL.md`，作为连接器 Skill 使用（见下文）。

---

## 使用示例

**无 Token 演示：**
```bash
$ npm start

=== 麦麦积分操盘手 · 分析报告（演示数据）===
【1. 积分商城价值精算】（元/积分 越高越划算）
  #1 麦麦商城-钥匙扣 | 300积分 | 0.03元/积分 | ★最划算
  #2 麦麦商城-帆布包 | 600积分 | 0.0483元/积分 | 可考虑
  ...
【2. 积分抽奖期望值】
  奖品期望价值 ¥2.5 | 单次消耗≈¥0.5 | EV=¥2.0
  建议：期望收益为正(¥2.0)，积分富余时可适量参与；注意中奖是概率事件...
【3. 优惠券叠加最省】（订单原价¥100）
  选用券：c1, c2 | 共省¥15 | 实付¥85
```

**真实联调示例（2026-10-24，接入麦当劳中国 MCP 实时数据）：**

```bash
$ npm start
已连接麦当劳 MCP，可用工具 35 个。

=== 麦麦积分操盘手 · 实时分析报告（真实麦当劳 MCP 数据）===

【积分账户】可用积分 0 | 累计 0 | 本月将过期 0 | 货币 麦享会积分

【1. 积分商城价值精算】（所需金额/所需积分 越高越划算）
  #1 为随心配五大巨星“应援”1积分兑换活动 | 1积分+— | 缺金额 | 缺参考价
  #2 5.9元香芋派/菠萝派任选 | 50积分+— | 缺金额 | 缺参考价
  #3 18.8元麦辣鸡腿汉堡两件套 | 50积分+— | 缺金额 | 缺参考价
  …（按所需积分升序，积分越少越靠前）

【2. 积分抽奖】活动：周六麦金喜抽奖 | 单次消耗积分 24 | 奖品 27 项
【3. 我的优惠券】可用 4 张（运行 auto-bind-coupons 可一键领取麦麦省券）

（数据来自麦当劳中国 MCP 实时接口；分析逻辑见 src/optimizer.js）
```

> 说明：`mall-points-products` 返回的商品多为「纯积分兑换（现金价 0）」，此时价值密度退化为「按所需积分升序」；若商品同时含现金价，则按「元/积分」排序，越靠前越划算。

**在 WorkBuddy 里用自然语言：**
> “我积分快过期了，商城里换哪个最值？”
> “麦麦省的券帮我领了，顺便算算我这单怎么叠最省。”
> “这个积分抽奖该不该抽？”

---

## 目标用户

- 手里有麦当劳积分、但不知道怎么花最值的普通会员
- 想用最少积分换最多实物的“精算型”用户
- 企业行政 / 团建负责人（批量兑换、抽奖福利规划）

---

## 在 WorkBuddy 中使用（官方合作伙伴通道）

1. WorkBuddy 左侧【专家·技能·连接器】→【连接器】→【自定义连接器】→【配置 MCP】
2. 填入 `mcp-config.example.json` 内容（替换 `YOUR_MCD_MCP_TOKEN` 为真实 Token）并启用
3. 加载本仓库 `SKILL.md` 作为 Skill
4. 直接在对话框提需求，AI 会调用相应麦当劳 MCP 工具完成分析

---

## 项目结构

```
mcd-points-optimizer/
├── SKILL.md                 # WorkBuddy Skill 定义（核心交付物）
├── README.md                # 本文件
├── CONTEST_DECLARATION.md   # 参赛声明（一字不改）
├── MCP_INTEGRATION.md       # MCP 集成说明
├── mcp-config.example.json  # 脱敏 MCP 配置（仅环境变量占位符）
├── workbuddy.md             # WorkBuddy 开发对话上下文（专项奖励用）
├── package.json
├── .env.example
└── src/
    ├── optimizer.js         # 核心分析逻辑（纯函数，可测试）
    ├── optimizer.test.js    # 单元测试
    ├── mcp-client.js        # 极简 MCP Streamable HTTP 客户端（可选运行时）
    └── cli.js               # 命令行入口
```

---

## 合规与安全

- 本项目为大赛参赛作品，**非麦当劳官方产品**；所有餐品/价格/供应状态以麦当劳官方实时结果为准。
- 不存储、不展示真实 Token；配置仅通过环境变量占位符。
- 不对比、不贬低其他品牌；只在麦当劳积分体系内做“更优选择”。

---

## 许可

MIT
