/**
 * 统一的 AI 服务层
 * 支持 Gemini、OpenAI 及所有 OpenAI 兼容接口（Kimi、DeepSeek、Qwen 等）
 */
import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile, DietConfig, HealthMetrics, WeeklyPlanResponse } from "../types";
import { buildWeeklyPlanPrompt, parsePlanJson } from "./promptUtils";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface OpenAICompatibleOptions {
  apiKey: string;
  endpoint: string;
  model: string;
  providerLabel?: string;
}

// ==================== Gemini 服务 ====================

/** 使用 Gemini 生成一周饮食计划 */
export async function generateWeeklyPlanWithGemini(
  profile: UserProfile,
  metrics: HealthMetrics,
  config: DietConfig,
  apiKey?: string
): Promise<WeeklyPlanResponse> {
  const key = (apiKey || import.meta.env.VITE_GEMINI_API_KEY || '').trim();
  if (!key) {
    throw new Error('❌ 请先在「API 设置」中填写 Gemini API Key，或在 .env.local 中配置 VITE_GEMINI_API_KEY。');
  }
  const ai = new GoogleGenAI({ apiKey: key });
  const fullPrompt = buildWeeklyPlanPrompt(profile, metrics, config);

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: fullPrompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.4,
          maxOutputTokens: 4096,
          responseSchema: {
            type: Type.OBJECT,
            required: ["dailyPlans", "shoppingList", "seasonings", "recipes"],
            properties: {
              dailyPlans: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  required: ["day", "breakfast", "lunch", "dinner"],
                  properties: {
                    day: { type: Type.STRING },
                    breakfast: { type: Type.OBJECT, required: ["name", "calories", "portion"], properties: { name: { type: Type.STRING }, calories: { type: Type.NUMBER }, portion: { type: Type.STRING } } },
                    lunch: { type: Type.OBJECT, required: ["name", "calories", "portion"], properties: { name: { type: Type.STRING }, calories: { type: Type.NUMBER }, portion: { type: Type.STRING } } },
                    dinner: { type: Type.OBJECT, required: ["name", "calories", "portion"], properties: { name: { type: Type.STRING }, calories: { type: Type.NUMBER }, portion: { type: Type.STRING } } }
                  }
                }
              },
              shoppingList: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  required: ["name", "amount"],
                  properties: {
                    name: { type: Type.STRING },
                    amount: { type: Type.STRING }
                  }
                }
              },
              seasonings: { type: Type.ARRAY, items: { type: Type.STRING } },
              recipes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  required: ["dishName", "ingredients", "steps"],
                  properties: {
                    dishName: { type: Type.STRING },
                    ingredients: { type: Type.STRING },
                    steps: { type: Type.ARRAY, items: { type: Type.STRING } }
                  }
                }
              }
            }
          }
        }
      });

      const text = response.text;
      if (!text) {
        throw new Error("AI 未返回有效内容，请重试。");
      }

      return parsePlanJson(text);
    } catch (e: any) {
      const msg = (e?.message || "").toLowerCase();
      const is503 = msg.includes("503") || msg.includes("unavailable") || msg.includes("overloaded");
      const isJsonParseErr =
        msg.includes("unterminated string") ||
        msg.includes("unexpected token") ||
        msg.includes("json") ||
        msg.includes("合法 json");
      if (isJsonParseErr && attempt < 2) {
        await sleep(600 * (attempt + 1));
        continue;
      }
      if (is503 && attempt < 2) {
        await sleep(800 * (attempt + 1));
        continue;
      }
      console.error("Gemini process error:", e);
      if (msg.includes("api key not valid") || msg.includes("invalid api key") || msg.includes("api_key_invalid")) {
        throw new Error("❌ Gemini API Key 无效，请检查是否粘贴正确（注意不要包含空格）。");
      }
      if (msg.includes("quota") || msg.includes("billing") || msg.includes("resource_exhausted")) {
        throw new Error("❌ Gemini 账户已超出用量或余额不足，请检查平台配额/账单后重试。");
      }
      if (is503) {
        throw new Error("⚠️ AI 服务暂时繁忙（503），已自动重试仍失败，请稍后再试。");
      }
      if (isJsonParseErr) {
        throw new Error("⚠️ AI 返回格式异常（JSON 解析失败），已自动重试仍失败，请重试一次。");
      }
      throw new Error(e.message || "生成计划失败，请重试。");
    }
  }
  throw new Error("生成计划失败，请重试。");
}

/** 测试 Gemini 连接 */
export async function testGeminiConnection(apiKey?: string): Promise<void> {
  const key = (apiKey || import.meta.env.VITE_GEMINI_API_KEY || '').trim();
  if (!key) {
    throw new Error('❌ 请先填写 Gemini API Key。');
  }
  try {
    const ai = new GoogleGenAI({ apiKey: key });
    const res = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "reply ok",
    });
    if (!res.text) {
      throw new Error("Gemini 未返回有效内容。");
    }
  } catch (e: any) {
    const msg = (e?.message || "").toLowerCase();
    if (msg.includes("api key not valid") || msg.includes("invalid api key") || msg.includes("api_key_invalid")) {
      throw new Error("❌ Gemini API Key 无效，请检查是否粘贴正确。");
    }
    if (msg.includes("quota") || msg.includes("billing") || msg.includes("resource_exhausted")) {
      throw new Error("❌ Gemini 配额/余额不足，请检查平台账单。");
    }
    throw new Error(e?.message || "Gemini 连接测试失败。");
  }
}

// ==================== OpenAI 兼容服务 ====================

/** 测试 OpenAI 兼容接口连通性 */
export async function testOpenAICompatibleConnection(options: OpenAICompatibleOptions): Promise<void> {
  const key = options.apiKey?.trim();
  if (!key) {
    throw new Error(`❌ 请先填写 ${options.providerLabel || "OpenAI"} API Key。`);
  }

  let endpoint = options.endpoint.trim();
  if (!endpoint.startsWith('http://') && !endpoint.startsWith('https://')) {
    throw new Error(`❌ Base URL 格式错误，必须以 http:// 或 https:// 开头。当前值：${endpoint}`);
  }

  if (!endpoint.includes('/chat/completions')) {
    endpoint = endpoint.replace(/\/$/, '');
    if (!endpoint.includes('/v1')) {
      endpoint = `${endpoint}/v1/chat/completions`;
    } else {
      endpoint = `${endpoint}/chat/completions`;
    }
  }

  try {
    const res = await fetch(endpoint, {
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
        } else if (res.status === 404) {
          msg = `❌ 接口路径不存在 (404)。请检查 Base URL 是否正确。\n当前完整地址：${endpoint}\n提示：Base URL 应该是类似 https://api.openai.com/v1/chat/completions 的完整地址。`;
        } else if (res.status === 429 || apiMsg.includes("quota") || apiMsg.includes("billing")) {
          msg = `❌ ${options.providerLabel || "OpenAI"} 配额/余额不足，请检查平台账单。`;
        } else if (j.error?.message) {
          msg = `${j.error.message}\n完整地址：${endpoint}`;
        }
      } catch (_) {
        msg = `${msg}\n响应内容：${errBody.slice(0, 200)}`;
      }
      throw new Error(msg);
    }
  } catch (e: any) {
    const msg = (e?.message || "").toLowerCase();
    if (msg.includes("failed to fetch") || msg.includes("networkerror") || msg.includes("network request failed")) {
      throw new Error(`❌ 无法连接服务器，请检查：\n1. 网络连接是否正常\n2. Base URL 是否正确：${endpoint}\n3. 是否需要代理或 VPN\n4. 防火墙是否阻止了请求\n\n原始错误：${e?.message || "网络请求失败"}`);
    }
    if (msg.includes("cors")) {
      throw new Error(`❌ 跨域请求被阻止 (CORS)。\n可能原因：\n1. API 服务器不支持浏览器直接访问\n2. 需要配置服务器允许跨域\n\n建议：使用支持 CORS 的 API 或通过后端代理访问。`);
    }
    throw e;
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

  let endpoint = options.endpoint.trim();
  if (!endpoint.includes('/chat/completions')) {
    endpoint = endpoint.replace(/\/$/, '');
    if (!endpoint.includes('/v1')) {
      endpoint = `${endpoint}/v1/chat/completions`;
    } else {
      endpoint = `${endpoint}/chat/completions`;
    }
  }

  const fullPrompt = buildWeeklyPlanPrompt(profile, metrics, config);
  const systemPrompt =
    "你是一名专业的极简营养师，只输出 JSON，不要输出任何其他文字。必须严格按以下结构返回：{\"dailyPlans\":[{\"day\":\"周一\",\"breakfast\":{\"name\":\"...\",\"calories\":数字,\"portion\":\"...\"},\"lunch\":{...},\"dinner\":{...}},...],\"shoppingList\":[{\"name\":\"...\",\"amount\":\"...\"},...],\"seasonings\":[\"...\",...],\"recipes\":[{\"dishName\":\"...\",\"ingredients\":\"...\",\"steps\":[\"...\",...]},...]}。注意：recipes 中每道菜必须包含 ingredients 字段，列出该菜所需食材及用量，调味料写'适量'。";

  try {
    for (let attempt = 0; attempt < 3; attempt++) {
      const res = await fetch(endpoint, {
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
          temperature: 0.4,
          max_tokens: 4096,
        }),
      });

      if (!res.ok) {
        const errBody = await res.text();
        const lowerErr = errBody.toLowerCase();
        const is503 = res.status === 503 || lowerErr.includes("service unavailable") || lowerErr.includes("overloaded");
        if (is503 && attempt < 2) {
          await sleep(800 * (attempt + 1));
          continue;
        }

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
          } else if (res.status === 503 || apiMsg.includes("unavailable") || apiMsg.includes("overloaded")) {
            msg = `⚠️ ${options.providerLabel || "OpenAI"} 服务暂时繁忙（503），请稍后重试。`;
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

      try {
        return parsePlanJson(content);
      } catch (parseErr: any) {
        const parseMsg = (parseErr?.message || "").toLowerCase();
        const isJsonParseErr =
          parseMsg.includes("unterminated string") ||
          parseMsg.includes("unexpected token") ||
          parseMsg.includes("json") ||
          parseMsg.includes("合法 json");
        if (isJsonParseErr && attempt < 2) {
          await sleep(600 * (attempt + 1));
          continue;
        }
        throw parseErr;
      }
    }
    throw new Error("生成计划失败，请重试。");
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
    if (msg.includes("unterminated string") || msg.includes("unexpected token") || msg.includes("合法 json")) {
      throw new Error("⚠️ AI 返回格式异常（JSON 解析失败），已自动重试仍失败，请重试一次。");
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
    endpoint: "https://api.openai.com/v1/chat/completions",
    model: "gpt-4o-mini",
    providerLabel: "OpenAI",
  });
}
