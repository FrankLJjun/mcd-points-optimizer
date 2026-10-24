/**
 * 极简麦当劳 MCP (Streamable HTTP) 客户端
 * 仅用 Node 内置 fetch，无第三方依赖。用于把真实 MCP 工具输出接入分析器。
 *
 * 注意：
 *  - 真实联调需要有效 Token（见 .env.example）。
 *  - 本文件为“可选”运行时，不经过单元测试；核心分析逻辑在 optimizer.js。
 *  - 不存储、不打印真实 Token。
 */

const DEFAULT_URL = 'https://mcp.mcd.cn';

export async function createMcpClient({ url = DEFAULT_URL, token } = {}) {
  if (!token) throw new Error('缺少 MCD_MCP_TOKEN');
  const baseHeaders = {
    'Content-Type': 'application/json',
    Accept: 'application/json, text/event-stream',
    Authorization: `Bearer ${token}`,
  };
  let sessionId = null;

  async function rpc(method, params, id) {
    const headers = { ...baseHeaders };
    if (sessionId) headers['mcp-session-id'] = sessionId;
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ jsonrpc: '2.0', method, params, id }),
    });
    const sid = res.headers.get('mcp-session-id');
    if (sid) sessionId = sid;
    const raw = await res.text();
    const parsed = parseRpc(raw);
    if (parsed.error) throw new Error(JSON.stringify(parsed.error));
    return parsed.result;
  }

  // 1) initialize
  await rpc(
    'initialize',
    {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'mcd-points-optimizer', version: '1.0.0' },
    },
    1
  );
  // 2) initialized 通知
  const notifyHeaders = { ...baseHeaders };
  if (sessionId) notifyHeaders['mcp-session-id'] = sessionId;
  await fetch(url, {
    method: 'POST',
    headers: notifyHeaders,
    body: JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }),
  });

  return {
    async listTools() {
      const r = await rpc('tools/list', {}, 2);
      return r.tools || [];
    },
    async callTool(name, args = {}) {
      const r = await rpc('tools/call', { name, arguments: args }, 3);
      return r;
    },
  };
}

function parseRpc(raw) {
  const text = (raw || '').trim();
  if (!text) return {};
  if (text.startsWith('{')) return JSON.parse(text);
  // SSE: 取最后一个 data: 行
  const lines = text.split('\n').filter((l) => l.startsWith('data:'));
  const last = lines[lines.length - 1]?.slice(5).trim();
  return last ? JSON.parse(last) : {};
}
