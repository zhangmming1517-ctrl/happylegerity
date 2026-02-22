import { UserProfile, DietConfig, HealthMetrics, WeeklyPlanResponse } from "../types";
import { buildWeeklyPlanPrompt } from "./geminiService";

const OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = "gpt-4o-mini";

interface OpenAICompatibleOptions {
  apiKey: string;
  endpoint: string;
  model: string;
  providerLabel?: string;
}

/** 测试 OpenAI 兼容接口连通性 */
export async function testOpenAICompatibleConnection(options: OpenAICompatibleOptions): Promise<void> {
  const key = options.apiKey?.trim();
  if (!key) {
    throw new Error(`❌ 请先填写 ${options.providerLabel || "OpenAI"} API Key。`);
  }
  try {
    const res = await fetch(options.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: options.model,
        messages: [{ role: "user", content: "reply ok" }],
        max_tokens: 8,
        temperature: 0,
      }),
    });
    if (!res.ok) {
      const errBody = await res.text();
      let msg = `${options.providerLabel || "OpenAI"} 接口错误 (${res.status})`;
      try {
        const j = JSON.parse(errBody);
        const apiMsg = (j.error?.message || "").toLowerCase();
        if (res.status === 400 && (apiMsg.includes("api key not valid") || apiMsg.includes("invalid api key"))) {
          msg = `❌ ${options.providerLabel || "OpenAI"} API Key 无效，请检查是否粘贴正确。`;
        } else if (res.status === 401 || res.status === 403) {
          msg = `❌ ${options.providerLabel || "OpenAI"} API Key 无效或权限不足。`;
        } else if (res.status === 429 || apiMsg.includes("quota") || apiMsg.includes("billing")) {
          msg = `❌ ${options.providerLabel || "OpenAI"} 配额/余额不足，请检查平台账单。`;
        } else if (j.error?.message) {
          msg = j.error.message;
        }
      } catch (_) {}
      throw new Error(msg);
    }
  } catch (e: any) {
    const msg = (e?.message || "").toLowerCase();
    if (msg.includes("failed to fetch") || msg.includes("network") || msg.includes("cors")) {
      throw new Error(`❌ 无法连接 ${options.providerLabel || "OpenAI"} 服务器，请检查网络或 Base URL。`);
    }
    throw new Error(e?.message || "连接测试失败。");
  }
}

/** 使用 OpenAI 兼容接口生成一周饮食计划 */
export async function generateWeeklyPlanWithOpenAICompatible(
  profile: UserProfile,
  metrics: HealthMetrics,
  config: DietConfig,
  options: OpenAICompatibleOptions
): Promise<WeeklyPlanResponse> {
  const key = options.apiKey?.trim();
  if (!key) {
    throw new Error(`❌ 请先在「API 设置」中填写 ${options.providerLabel || "OpenAI"} API Key。`);
  }

  const fullPrompt = buildWeeklyPlanPrompt(profile, metrics, config);
  const systemPrompt =
    "你是一名专业的极简营养师，只输出 JSON，不要输出任何其他文字。必须严格按以下结构返回：{\"dailyPlans\":[{\"day\":\"周一\",\"breakfast\":{\"name\":\"...\",\"calories\":数字,\"portion\":\"...\"},\"lunch\":{...},\"dinner\":{...}},...],\"shoppingList\":[{\"name\":\"...\",\"amount\":\"...\"},...],\"seasonings\":[\"...\",...],\"recipes\":[{\"dishName\":\"...\",\"steps\":[\"...\",...]},...]}";

  try {
    const res = await fetch(options.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: options.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: fullPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.6,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      let msg: string;
      try {
        const j = JSON.parse(errBody);
        const apiMsg = (j.error?.message || "").toLowerCase();
        if (res.status === 400 && (apiMsg.includes("api key not valid") || apiMsg.includes("invalid api key"))) {
          msg = `❌ ${options.providerLabel || "OpenAI"} API Key 无效，请检查是否粘贴正确（注意不要包含空格）。`;
        } else if (res.status === 401 || res.status === 403) {
          msg = `❌ ${options.providerLabel || "OpenAI"} API Key 无效或权限不足，请检查：1) Key 是否填写正确 2) 是否已开通 API 权限与余额。`;
        } else if (res.status === 429 || apiMsg.includes("quota") || apiMsg.includes("billing")) {
          msg = `❌ ${options.providerLabel || "OpenAI"} 账户已超出用量或余额不足，请检查平台账单后重试。`;
        } else {
          msg = j.error?.message || `OpenAI API 错误 (${res.status})`;
        }
      } catch (_) {
        msg = `OpenAI API 错误 (${res.status})`;
      }
      throw new Error(msg);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("AI 未返回有效内容，请重试。");
    }

    const cleanedJson = content.replace(/```json\n?/, "").replace(/```\n?$/, "").trim();
    return JSON.parse(cleanedJson) as WeeklyPlanResponse;
  } catch (e: any) {
    console.error("OpenAI process error:", e);
    const msg = (e?.message || "").toLowerCase();
    if (msg.includes("fetch") || msg.includes("network") || msg.includes("cors") || msg === "failed to fetch") {
      throw new Error(`❌ 无法连接 ${options.providerLabel || "OpenAI"} 服务器，请检查网络或稍后重试。`);
    }
    if (msg.includes("quota") || msg.includes("billing")) {
      throw new Error(`❌ ${options.providerLabel || "OpenAI"} 账户已超出用量或余额不足，请检查平台账单后重试。`);
    }
    if (msg.includes("api key not valid") || msg.includes("invalid api key")) {
      throw new Error(`❌ ${options.providerLabel || "OpenAI"} API Key 无效，请检查是否粘贴正确。`);
    }
    throw new Error(e?.message || "生成计划失败，请重试。");
  }
}

/** 使用 OpenAI（ChatGPT）生成一周饮食计划 */
export async function generateWeeklyPlanWithOpenAI(
  profile: UserProfile,
  metrics: HealthMetrics,
  config: DietConfig,
  apiKey: string
): Promise<WeeklyPlanResponse> {
  return generateWeeklyPlanWithOpenAICompatible(profile, metrics, config, {
    apiKey,
    endpoint: OPENAI_CHAT_URL,
    model: MODEL,
    providerLabel: "OpenAI",
  });
}
