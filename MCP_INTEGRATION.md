# MCP 集成说明（MCP_INTEGRATION.md）

本文件说明「麦麦积分操盘手」实际使用的麦当劳 MCP Server、调用的 Tool、调用流程与业务价值。

## 1. 使用的 MCP Server

- **服务方**：麦当劳中国官方 MCP Server（金拱门）
- **接入地址**：`https://mcp.mcd.cn`
- **传输协议**：Streamable HTTP（`streamablehttp`）
- **鉴权方式**：请求头 `Authorization: Bearer <MCD_MCP_TOKEN>`
- **配置示例**：见仓库根目录 `mcp-config.example.json`（仅含环境变量占位符 `${MCD_MCP_TOKEN}`，不含真实密钥）

> 申请 Token：登录 https://open.mcd.cn/mcp → 控制台 → 激活 → 复制 Token。

## 2. 实际调用的 Tool 清单

| 场景 | Tool | 输入 | 输出 | 用途 |
|---|---|---|---|---|
| 积分商城精算 | `mall-points-products` | `{}` | 可兑换商品列表（积分价/现金价/库存） | 拉取积分商城全部可兑换项 |
| | `mall-product-detail` | `{productId}` | 单品详情、有效期、说明 | 补充单品价值信息 |
| | `mall-create-order` | `{productId,...}` | 兑换订单号 / 券码 | 一键积分兑换（可选动作） |
| 抽奖操盘 | `query-lottery-info` | `{}` | 奖品池、消耗规则、用户资源 | 计算抽奖期望值 |
| | `draw-lottery` | `{}` | 本次抽奖结果 | 执行抽奖（可选动作） |
| | `query-my-prizes` | `{}` | 中奖记录（分页） | 复盘战绩 |
| 优惠券管家 | `available-coupons` | `{}` | 麦麦省可领券列表 | 列出可领券 |
| | `auto-bind-coupons` | `{}` | 领取结果 | 一键领取全部可用券（可选动作） |
| | `query-my-coupons` | `{}` | 我的券列表 | 管理已有券 |
| | `query-store-coupons` | `{storeId}` | 门店可用券 | 点餐叠加参考 |
| 账户概览 | `query-my-account` | `{}` | 可用/累计/冻结/即将过期积分 | 提醒别浪费积分 |

## 3. 调用流程（典型路径）

```
用户需求
   │
   ├─ “积分商城哪个最划算？”
   │     └─ mall-points-products → optimizer.rankMallByValueDensity() → Top3 + 结论
   │
   ├─ “积分抽奖值不值得抽？”
   │     └─ query-lottery-info → optimizer.lotteryExpectedValue() → EV + 建议
   │
   ├─ “帮我把麦麦省的券领了 / 怎么叠最省？”
   │     └─ available-coupons → auto-bind-coupons → query-my-coupons
   │        → 结合订单原价 bestCouponCombo() → 省多少/实付多少
   │
   └─ “我积分快过期了？”
         └─ query-my-account → 提醒即将过期积分 → 推荐兑换项
```

## 4. 业务价值

- **对用户**：把“零散、看不懂、容易浪费”的积分资产，变成“可量化、可决策”的最优配置方案；省下的都是真金白银。
- **对麦当劳 MCP 能力展示**：覆盖 `mall-*` 商城积分、积分抽奖、麦麦省券三大此前被严重低估的能力域，证明 MCP 不止能点餐，也能做“资产操盘”。
- **可复用**：`src/optimizer.js` 为纯函数（价值密度 / 抽奖 EV / 优惠券叠加），可独立测试、可被任意前端或智能体调用。

## 5. 速率与容错

- 单个 Token 限流 600 次/分钟（429），代码中所有调用均为用户主动触发，单次会话请求极少，不会触发限流。
- 真实联调失败时（如 Token 缺失/过期），CLI 自动降级为演示模式，分析逻辑不受影响。

## 6. 真实联调记录（2026-10-24 实测）

为证明「真实使用麦当劳 MCP 能力」，本项目于 2026-10-24 使用真实 Token 实连 `https://mcp.mcd.cn` 完成验证：

- **连接成功**：`initialize` + `notifications/initialized` 握手通过；
- **工具清单**：`tools/list` 返回 **35 个**可用工具（完整列表见下）；
- **只读调用成功**：`query-my-account`、`mall-points-products`、`query-lottery-info`、`query-my-coupons`、`available-coupons`、`query-my-prizes`、`query-promotions` 均返回真实业务数据；
- **写操作成功**：`auto-bind-coupons` 真实领取到 3 张麦麦省券（返回 `success:true`），证明端到端贯通。

**实测可用工具（35 个）：**

```
query-my-prizes | query-meal-assistance | query-survey-coupon | mall-order-list
query-party-store-session | auto-bind-coupons | query-my-coupons | query-store-coupons
query-meals | query-nearby-stores | calculate-price | delivery-query-stores
query-party-store-date | query-order | mall-product-detail | mall-order-detail
party-order-create | available-coupons | order-list | draw-lottery
mall-create-order | campaign-calendar | list-nutrition-foods | delivery-create-address
create-order | query-promotions | query-lottery-info | query-party-city
cancel-order | delivery-query-addresses | now-time-info | query-meal-detail
query-my-account | mall-points-products | query-party-store
```

本项目重点调用的能力域（此前榜单中被严重低估）：`mall-points-products` / `mall-product-detail` / `mall-create-order`（积分商城）、`query-lottery-info` / `draw-lottery` / `query-my-prizes`（积分抽奖）、`available-coupons` / `auto-bind-coupons` / `query-my-coupons`（麦麦省券）、`query-my-account`（积分账户）。
