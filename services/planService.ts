import { UserProfile, DietConfig, HealthMetrics, WeeklyPlanResponse, ApiSettings } from "../types";
import { 
  generateWeeklyPlanWithGemini, 
  testGeminiConnection,
  generateWeeklyPlanWithOpenAI,
  generateWeeklyPlanWithOpenAICompatible,
  testOpenAICompatibleConnection
} from "./aiService";

/** 根据当前 API 设置调用对应提供商生成一周计划 */
export async function generateWeeklyPlan(
  profile: UserProfile,
  metrics: HealthMetrics,
  config: DietConfig,
  apiSettings: ApiSettings
): Promise<WeeklyPlanResponse> {
  const { selectedProviderId, builtinApiKeys, customProviders } = apiSettings;

  if (selectedProviderId === "gemini") {
    const key = builtinApiKeys.gemini?.trim();
    return generateWeeklyPlanWithGemini(profile, metrics, config, key);
  }
  if (selectedProviderId === "openai") {
    const key = builtinApiKeys.openai?.trim();
    if (!key) {
      throw new Error("❌ 请先在「API 设置」中填写 OpenAI (ChatGPT) API Key。可点击规划页右上角「API」打开设置。");
    }
    return generateWeeklyPlanWithOpenAI(profile, metrics, config, key);
  }

  const custom = customProviders.find((p) => p.id === selectedProviderId);
  if (!custom) {
    throw new Error("❌ 当前未选择有效的 API，请在「API 设置」中重新选择。");
  }
  if (!custom.baseUrl.trim() || !custom.model.trim() || !custom.apiKey.trim()) {
    throw new Error("❌ 自定义 API 配置不完整，请填写名称、Base URL、Model、API Key。");
  }

  return generateWeeklyPlanWithOpenAICompatible(profile, metrics, config, {
    apiKey: custom.apiKey.trim(),
    endpoint: custom.baseUrl.trim(),
    model: custom.model.trim(),
    providerLabel: custom.name || "自定义 API",
  });
}

/** 测试当前 API 配置是否可连通 */
export async function testApiConnection(apiSettings: ApiSettings): Promise<void> {
  const { selectedProviderId, builtinApiKeys, customProviders } = apiSettings;

  if (selectedProviderId === "gemini") {
    await testGeminiConnection(builtinApiKeys.gemini?.trim());
    return;
  }
  if (selectedProviderId === "openai") {
    const key = builtinApiKeys.openai?.trim();
    if (!key) throw new Error("❌ 请先填写 OpenAI API Key。");
    await testOpenAICompatibleConnection({
      apiKey: key,
      endpoint: "https://api.openai.com/v1/chat/completions",
      model: "gpt-4o-mini",
      providerLabel: "OpenAI",
    });
    return;
  }

  const custom = customProviders.find((p) => p.id === selectedProviderId);
  if (!custom) throw new Error("❌ 当前未选择有效 API。");
  if (!custom.baseUrl.trim() || !custom.model.trim() || !custom.apiKey.trim()) {
    throw new Error("❌ 自定义 API 配置不完整，请填写 Base URL、Model、API Key。");
  }
  await testOpenAICompatibleConnection({
    apiKey: custom.apiKey.trim(),
    endpoint: custom.baseUrl.trim(),
    model: custom.model.trim(),
    providerLabel: custom.name || "自定义 API",
  });
}
