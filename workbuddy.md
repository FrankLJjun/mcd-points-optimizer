# WorkBuddy 开发对话上下文（workbuddy.md）

> 本文件为「麦当劳程序员创意开发大赛」WorkBuddy 专项奖励提交材料，记录本项目在 WorkBuddy 中从构思到落地的关键对话上下文，用于核验「真实使用腾讯 WorkBuddy 智能体」的联动条件。

---

## 1. 需求发起

**用户**：参加麦当劳程序员创意开发大赛，基于麦当劳 MCP 做个 Skill。先看完整活动规则（README / activityGuidelines / CONTEST_DECLARATION / RANKING）和麦当劳 MCP 工具清单，再决定做什么。

**WorkBuddy（小伴）**：
- 通读官方仓库全部 Markdown 与 MCP Server 工具清单；
- 盘点榜单 100 个项目，发现红海集中在「省钱 / 卡路里 / 派对 / 抽卡」，而 `mall-*` 商城积分、`draw-lottery` 抽奖、`auto-bind-coupons` 麦麦省券**几乎无人使用**；
- 给出两个候选方案：A 积分操盘手（广受众、零医疗包袱）、B 宝妈营养顾问（贴用户母婴业务、差异化最强）；
- 用户拍板 **A**。

## 2. 方案设计（在 WorkBuddy 中确认）

- 明确四大能力：积分商城价值精算、抽奖期望值、优惠券叠加、积分账户概览；
- 确认每个能力对应的麦当劳 MCP Tool（见 `MCP_INTEGRATION.md`）；
- 约定交付物：SKILL.md + 可运行源码 + 必需参赛文档，全部推到公开 GitHub 仓库并提 Issue 报名。

## 3. 编码实现（WorkBuddy 生成并自检）

- `src/optimizer.js`：纯函数实现三类分析（价值密度 / 抽奖 EV / 优惠券贪心叠加），无第三方依赖；
- `src/mcp-client.js`：用 Node 内置 fetch 实现 Streamable HTTP MCP 客户端；
- `src/cli.js`：无 Token 跑演示、有 Token 联调真实数据；
- `src/optimizer.test.js`：用 `node --test` 编写断言，覆盖排序、EV、叠加、门槛过滤；
- WorkBuddy 本地执行 `npm test` 验证全部用例通过。

## 4. 参赛文档生成（WorkBuddy 产出）

- `README.md`、`MCP_INTEGRATION.md`、`mcp-config.example.json`（仅 `${MCD_MCP_TOKEN}` 占位符）、`workbuddy.md`；
- `CONTEST_DECLARATION.md` 一字不改照官方原文复制；
- 用 GitHub 连接器（已连接用户账号 FrankLJjun）创建公开仓库并推送全部文件，再按标准格式提交报名 Issue。

## 5. 关键决策与约束（WorkBuddy 提醒用户）

- ⏰ 时间窗口极紧：报名截止 2026-10-25 23:59，定榜 2026-10-26 00:00，约 1.5 天；
- ⚠️ 同一 GitHub 账号仅 Star 最高的 1 个项目进榜 → 只做一个项目、all-in；
- 🔑 真实联调需用户自行在 `.env` 填入麦当劳 MCP Token（仓库不存真实密钥）；
- ⭐ 进榜后靠用户自有渠道拉 Star（保底奖励：回车键玩具 + 程序员节徽章 + WorkBuddy 3000 积分）。

---

*以上对话上下文由 WorkBuddy 智能体辅助生成，用于核验联动活动奖励条件。*
