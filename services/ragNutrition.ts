/**
 * RAG 外挂：从食物营养知识库检索相关条目，供 LLM 参考
 * 按用户输入的食材/偏好做关键词匹配，返回格式化后的营养参考文本
 */
import { DietConfig, DietMode } from '../types';
import { FOOD_NUTRITION_DB, type FoodNutrition } from '../data/foodNutrition';

/** 从配置中提取可用于检索的关键词（食材名、偏好等） */
function extractKeywords(config: DietConfig): string[] {
  const raw: string[] = [];
  if (config.wantedIngredients?.trim()) {
    raw.push(...config.wantedIngredients.split(/[,，、\s]+/).map((s) => s.trim()).filter(Boolean));
  }
  if (config.existingIngredients?.trim()) {
    raw.push(...config.existingIngredients.split(/[,，、\s]+/).map((s) => s.trim()).filter(Boolean));
  }
  return [...new Set(raw)];
}

/** 判断某条食物是否与任意关键词匹配（名称或别名包含关键词，或关键词包含名称） */
function matchFood(food: FoodNutrition, keywords: string[]): boolean {
  if (keywords.length === 0) return false;
  const nameLower = food.name.toLowerCase();
  const aliasesLower = (food.aliases ?? []).map((a) => a.toLowerCase());
  for (const kw of keywords) {
    const k = kw.toLowerCase();
    if (nameLower.includes(k) || k.includes(nameLower)) return true;
    if (aliasesLower.some((a) => a.includes(k) || k.includes(a))) return true;
  }
  return false;
}

/** 基础常驻条目（保证 LLM 总有常见主食、蛋白、蔬菜参考） */
const BASE_NAMES = new Set([
  '米饭', '燕麦', '全麦面包', '鸡蛋', '鸡胸肉', '牛腩', '牛奶', '豆腐',
  '土豆', '西兰花', '菠菜', '番茄', '食用油', '黄瓜', '萝卜', '排骨',
]);

/**
 * 根据当前配置检索相关食物营养数据，并格式化为可注入 prompt 的参考文本
 * @param config 当前饮食配置（用于提取想吃的/已有食材）
 * @param maxEntries 最多返回条数，避免 prompt 过长；默认 50
 */
export function getNutritionReferenceForPrompt(
  config: DietConfig,
  maxEntries: number = 50
): string {
  const keywords = extractKeywords(config);
  const matched: FoodNutrition[] = [];
  const base: FoodNutrition[] = [];

  for (const food of FOOD_NUTRITION_DB) {
    if (BASE_NAMES.has(food.name)) {
      base.push(food);
    } else if (matchFood(food, keywords)) {
      matched.push(food);
    }
  }

  // 合并：优先用户相关，再补足基础；去重按 name
  const seen = new Set<string>();
  const result: FoodNutrition[] = [];
  for (const f of [...matched, ...base]) {
    if (result.length >= maxEntries) break;
    if (seen.has(f.name)) continue;
    seen.add(f.name);
    result.push(f);
  }

  if (result.length === 0) return '';

  const lines = result.map(
    (f) =>
      `- ${f.name}${f.note ? `（${f.note}）` : ''}：热量${f.calories}kcal、蛋白质${f.protein}g、脂肪${f.fat}g、碳水${f.carbs}g`
  );
  return `
【食物营养参考（每100g可食部，供规划分量与搭配时参考）】
${lines.join('\n')}
请在设计食谱与 portion 时参考以上数据，使分量与营养更合理。`;
}
