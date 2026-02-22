/**
 * 共用的 Prompt 构建与 JSON 解析工具
 * 供所有 AI 服务（Gemini、OpenAI、Kimi 等）统一使用
 */
import { UserProfile, DietConfig, HealthMetrics, WeeklyPlanResponse, DietMode } from "../types";
import { getNutritionReferenceForPrompt } from "./ragNutrition";

/** 构建周计划请求的完整 prompt 文本（供所有 AI 服务共用） */
export function buildWeeklyPlanPrompt(
  profile: UserProfile,
  metrics: HealthMetrics,
  config: DietConfig
): string {
  const flavorStr = config.flavorPreference.length > 0 ? config.flavorPreference.join('、') : '不限';
  
  // 备菜重复逻辑配置
  const repetitionSetting = config.enableMealPrepRepetition
    ? '【开启备菜重复】每餐默认 3-4 种组合，可灵活搭配循环。'
    : '【关闭重复】每日菜品尽量不同。';

  const prompt = `
# Role: 极简全能营养师,五星级厨师

## UserProfile
- 基础: ${profile.gender === 'MALE' ? '男' : '女'}, ${profile.age}岁, ${profile.goal}
- 热量: ${metrics.targetCalories} kcal/日
- 模式: ${config.mode === DietMode.BUYING ? '采买(新购)' : '清冰箱(现有)'}
- 主食: ${config.staplePreference}
- 口味: ${flavorStr}
- 偏好/忌口: ${config.mode === DietMode.BUYING ? `想吃(${config.wantedIngredients || '不限'})` : `已有(${config.existingIngredients})`} / 忌口(${profile.dislikes || '无'})
- 逻辑: ${repetitionSetting}

<Constraints>
1. **主食平衡**: 除非明确禁米饭，否则全周 50% 正餐必须含米饭/粗粮饭；面食为辅。
2. **菜品多样性（核心强制规则）**: 
   - **绝对禁止规则**：任意两天（包括相邻或隔天）的早中晚三餐组合不得完全相同。周一≠周二≠周三≠周四≠周五≠周六≠周日，每天必须是独特的菜品组合。
   - **错误示例（严禁）**：周一(煎蛋+牛奶+燕麦、米饭+青椒肉丝+番茄炒蛋、米饭+清蒸鱼+炒青菜) = 周三(相同组合) ❌
   - **正确做法**：优先采购少量食材，但通过以下方式创造7天不同的菜品组合：
     * 烹饪方法变化：同一食材用不同做法（鸡胸肉→煎鸡胸、鸡肉沙拉、番茄炖鸡、宫保鸡丁）
     * 搭配组合变化：相同主料配不同辅料（牛肉+土豆、牛肉+洋葱、牛肉+西兰花）
     * 餐次打散分配：同一道菜可在不同天的不同餐次出现，但不能让整天的三餐组合重复
   - **验证要求**：生成后请自查，确保7天的dailyPlans中，任意两天的(breakfast.name + lunch.name + dinner.name)组合都不相同。
3. **备菜一致性**: 开启重复时，组合必须选大锅易烹饪、易储存食材。
4. **清单规则**: 
   - 【总采购清单 shoppingList】每种食材只出现一条，amount 为该食材全周总用量。全周所有用到该食材的菜品，其用量相加 = 该条 amount。清单条目数（食材种类数）必须严格满足下方「食材种类上限」。
   - 【食材种类上限】${config.maxIngredients && config.maxIngredients > 0 ? `**强制**：shoppingList 的条目数不得超过 ${config.maxIngredients} 种。若当前设计会超出，必须合并食材、减少品种或一材多做直至 ≤ ${config.maxIngredients} 种，不得违反。` : '不限制种类数。'}
   - 【菜谱做法 recipes】每道菜的 ingredients 写**该道菜在全周被做的总用量**。例如：土豆烧牛腩一周做 3 次、共需牛腩 500g，则该菜 ingredients 写「牛腩500g」；炒牛腩一周 3 次共 500g，写「牛腩500g」。同一食材在各道菜 ingredients 中的用量之和，必须等于 shoppingList 中该食材的 amount（如牛腩 500+500=1000，清单中牛腩为 1000g）。调味料写「适量」。
   - 清冰箱模式需在 amount 字段标注"(可选/已有)"。
5. **安全禁忌**: 严禁相克搭配(如牛奶+橙子)；少油少盐；步骤限3步。
</Constraints>

<OutputSpecs>
1. **name**: 仅写组合好的菜名，多道菜用"、"分隔。禁用"一份..."或罗列原料。
2. **portion**: 与 name 一一对应，写"菜名+克数(g/ml)"。严禁为空，严禁使用"约"。
3. **结构**: 周一至周日(早/午/晚)。每餐需含蛋白质、碳水、优质脂肪。
4. **饮食习惯**: 
   - 早餐: 奶/蛋/燕麦/包子/吐司等传统项，禁重油重辣。
   - 午/晚餐: 必须包含主食+菜+蛋白质。午餐分量充足，晚餐可轻食但须配比合理。
5. **热量要求**: 
   - **每日热量必须准确计算**：每日三餐的总热量(breakfast.calories + lunch.calories + dinner.calories)应根据实际食材和份量精确计算，不同的食材搭配必定产生不同的总热量值。
   - **禁止重复总热量**：严禁多天出现相同的每日总热量，除非食材组合和份量完全相同。不同的菜品组合必须反映真实的热量差异。
   - **热量范围**：每日总热量应在目标热量的 ±10% 范围内波动(${metrics.targetCalories * 0.9} - ${metrics.targetCalories * 1.1} kcal)，但每天的具体值必须根据实际食材计算得出。
6. **菜谱做法（recipes）**: 每道菜必须包含：
   - dishName: 菜名
   - ingredients: 该菜在全周的总用量，格式如"土豆200g、牛腩500g、姜片适量"。要求：各道菜中同一食材的克数相加 = shoppingList 中该食材的 amount。调味料写"适量"。
   - steps: 烹饪步骤（限3步）
7. **数据一致性校验（强制）**：
   - **每日菜谱portion总重量** = 当日所有菜品portion中的克数之和
   - **采购清单shoppingList总重量** = 各食材amount的克数之和(不含"适量"调味料)
   - **菜谱做法recipes总重量** = 各菜品ingredients中所有食材克数之和(不含"适量"调味料)
   - **强制要求**：以上三个总重量必须接近一致(允许 ±5% 误差)。如不一致，必须重新计算调整。
8. **菜品去重最终验证（强制）**：
   - 生成完成后，请逐一检查周一至周日的每日菜品组合(breakfast.name + lunch.name + dinner.name)。
   - 确保7天中任意两天的完整组合都不相同。如果发现重复，必须修改其中一天的菜品，通过调整烹饪方法或食材搭配使其不同。
   - 检查标准：对比每天的三餐菜名字符串，不得存在完全相同的情况。
</OutputSpecs>

请根据以上设定，生成一周食谱及采购清单。
`;

  // 控制 RAG 参考长度，减少服务端过载与 503 风险
  const nutritionRef = getNutritionReferenceForPrompt(config, 20);
  const compactRef =
    nutritionRef.length > 1800 ? `${nutritionRef.slice(0, 1800)}\n（营养参考已截断）` : nutritionRef;
  return compactRef ? `${prompt.trimEnd()}\n${compactRef}` : prompt.trim();
}

// ==================== JSON 解析核心逻辑（全新重写，更健壮） ====================

/**
 * 预处理 AI 返回的原始文本
 * - 移除 markdown 代码块标记
 * - 移除 BOM
 * - 替换智能引号为标准引号
 * - 移除尾随逗号
 */
function preprocessRawText(raw: string): string {
  return raw
    .replace(/```json\s*/gi, "")
    .replace(/```\s*$/g, "")
    .replace(/^\uFEFF/, "")
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    .replace(/,(\s*[}\]])/g, "$1")
    .trim();
}

/**
 * 提取 JSON 对象的多种候选文本
 * 策略：
 * 1. 原始文本
 * 2. 第一个 { 到最后一个 } 之间的内容
 * 3. 使用状态机提取完整的 JSON 对象
 */
function extractJsonCandidates(text: string): string[] {
  const candidates: string[] = [];
  
  // 候选 1：原始文本
  if (text) candidates.push(text);
  
  // 候选 2：第一个 { 到最后一个 }
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    candidates.push(text.slice(firstBrace, lastBrace + 1));
  }
  
  // 候选 3：使用状态机提取完整 JSON 对象
  const extracted = extractJsonObjectByStateMachine(text);
  if (extracted) candidates.push(extracted);
  
  return candidates;
}

/**
 * 使用状态机提取第一个完整的 JSON 对象
 */
function extractJsonObjectByStateMachine(text: string): string | null {
  let inString = false;
  let escaped = false;
  let depth = 0;
  let start = -1;
  
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }
    
    if (ch === '"') {
      inString = true;
      continue;
    }
    
    if (ch === "{") {
      if (depth === 0) start = i;
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0 && start !== -1) {
        return text.slice(start, i + 1);
      }
      if (depth < 0) break;
    }
  }
  
  return null;
}

/**
 * 深度清理和修复 JSON 文本
 * 处理常见的 LLM 输出问题：
 * 1. 字符串内的未转义换行符
 * 2. 缺失的逗号（属性之间）
 * 3. 未闭合的字符串
 * 4. 未闭合的数组/对象
 */
function repairJsonText(text: string): string {
  let result = "";
  let inString = false;
  let escaped = false;
  let lastChar = "";
  
  // 第一遍：处理字符串内的换行符和转义
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    
    if (inString) {
      if (escaped) {
        result += ch;
        escaped = false;
        lastChar = ch;
        continue;
      }
      
      if (ch === "\\") {
        result += ch;
        escaped = true;
        lastChar = ch;
        continue;
      }
      
      if (ch === '"') {
        result += ch;
        inString = false;
        lastChar = ch;
        continue;
      }
      
      // 字符串内的换行符需要转义
      if (ch === "\n") {
        result += "\\n";
        lastChar = "n";
        continue;
      }
      
      // 忽略 \r
      if (ch === "\r") {
        continue;
      }
      
      result += ch;
      lastChar = ch;
      continue;
    }
    
    // 不在字符串内
    if (ch === '"') {
      inString = true;
    }
    
    result += ch;
    lastChar = ch;
  }
  
  // 第二遍：修复缺失的逗号（属性值后直接换行接下一个属性）
  // 正则：属性值的闭合引号后，跟着空白和换行，然后是下一个属性的开始引号
  result = result.replace(/"(\s*)\n(\s*)"/g, '",\n"');
  
  // 第三遍：检查并修复未闭合的字符串
  inString = false;
  escaped = false;
  let stringOpenIndex = -1;
  
  for (let i = 0; i < result.length; i++) {
    const ch = result[i];
    
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
        stringOpenIndex = -1;
      }
    } else if (ch === '"') {
      inString = true;
      stringOpenIndex = i;
    }
  }
  
  // 如果最后还在字符串内，补上闭合引号
  if (inString && stringOpenIndex >= 0) {
    result += '"';
  }
  
  // 第四遍：补全未闭合的数组和对象
  let openBraces = 0;
  let openBrackets = 0;
  inString = false;
  escaped = false;
  
  for (let i = 0; i < result.length; i++) {
    const ch = result[i];
    
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }
    
    if (ch === '"') {
      inString = true;
    } else if (ch === "{") {
      openBraces++;
    } else if (ch === "}") {
      openBraces--;
    } else if (ch === "[") {
      openBrackets++;
    } else if (ch === "]") {
      openBrackets--;
    }
  }
  
  // 补全未闭合的括号（先闭合数组，再闭合对象）
  if (openBrackets > 0) {
    result += "]".repeat(openBrackets);
  }
  if (openBraces > 0) {
    result += "}".repeat(openBraces);
  }
  
  return result.trim();
}

/**
 * 解析 AI 返回的 JSON 文本为 WeeklyPlanResponse
 * 采用多级容错策略：
 * 1. 预处理原始文本
 * 2. 提取多种候选 JSON
 * 3. 对每个候选尝试修复并解析
 * 4. 如果都失败，抛出详细错误信息
 */
export function parsePlanJson(raw: string): WeeklyPlanResponse {
  // 第一步：预处理
  const preprocessed = preprocessRawText(raw);
  
  // 第二步：提取候选
  const candidates = extractJsonCandidates(preprocessed);
  
  // 第三步：尝试解析每个候选
  const errors: Array<{ candidate: string; error: string }> = [];
  
  for (const candidate of candidates) {
    // 尝试直接解析
    try {
      const parsed = JSON.parse(candidate);
      return parsed as WeeklyPlanResponse;
    } catch (directError: any) {
      errors.push({ 
        candidate: candidate.slice(0, 100), 
        error: directError?.message || "unknown" 
      });
      
      // 尝试修复后解析
      try {
        const repaired = repairJsonText(candidate);
        const parsed = JSON.parse(repaired);
        return parsed as WeeklyPlanResponse;
      } catch (repairError: any) {
        errors.push({ 
          candidate: `${candidate.slice(0, 50)}...(repaired)`, 
          error: repairError?.message || "repair failed" 
        });
      }
    }
  }
  
  // 第四步：所有尝试都失败，抛出详细错误
  const firstError = errors[0]?.error || "未知错误";
  const errorDetails = errors.length > 1 
    ? `\n共尝试 ${errors.length} 种修复策略，均失败。` 
    : "";
  
  throw new Error(
    `模型返回格式异常，无法解析为 JSON。\n` +
    `解析错误: ${firstError}${errorDetails}\n` +
    `原始文本长度: ${raw.length} 字符`
  );
}
