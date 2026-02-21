
import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile, DietConfig, HealthMetrics, WeeklyPlanResponse, DietMode } from "../types";
import { getNutritionReferenceForPrompt } from "./ragNutrition";

export const generateWeeklyPlan = async (
  profile: UserProfile,
  metrics: HealthMetrics,
  config: DietConfig
): Promise<WeeklyPlanResponse> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
  
  // 验证 API Key
  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error('❌ Gemini API Key 未配置。请检查 .env.local 文件中是否正确设置了 VITE_GEMINI_API_KEY。详见 API_KEY_SETUP.md。');
  }
  
  const ai = new GoogleGenAI({ apiKey });

  const flavorStr = config.flavorPreference.length > 0 ? config.flavorPreference.join('、') : '不限';
  const maxIngredientRule =
    config.maxIngredients && config.maxIngredients > 0
      ? `7. 购物清单的食材种类数（条目数量）不得超过 ${config.maxIngredients} 种，必须严格满足。`
      : '';

  const prompt = `
    作为一名专业的、精通中西式菜肴的极简营养师，请为用户规划一周的健康饮食方案。
    用户画像：
    - 性别：${profile.gender === 'MALE' ? '男' : '女'}
    - 年龄：${profile.age}岁
    - 目标：${profile.goal}
    - 建议每日摄入热量：${metrics.targetCalories} kcal
    - 模式：${config.mode === DietMode.BUYING ? '模式A：采买模式' : '模式B：清冰箱模式'}
    - 口味偏好：${flavorStr}
    - 忌口：${profile.dislikes || '无'}
    ${config.mode === DietMode.BUYING ? `- 本周想吃：${config.wantedIngredients || '不限'}` : `- 已有食材：${config.existingIngredients}`}
    - 备菜重复逻辑：${config.enableMealPrepRepetition ? '允许重复' : '不建议重复'}

    核心约束：
    1. 严禁搭配禁忌（如牛奶+橙子）。
    2. 仅限健康人群，烹饪少油少盐。
    3. 购物清单必须聚合整周用量。
    4. 做法精简至3步。
    5. 打乱重复：即使允许重复，也严禁连续3天的一日三餐组合完全一致。三餐顺序或组合必须有变化。
    6. 重要：如果处于清冰箱模式，对已有食材在 amount 字段标注“(可选/已有)”。
    ${maxIngredientRule}

    一材多做法（必须遵守）：
    - 同一食材应尽量多种做法复用，一种食材可出现在多道不同菜品中。例如：土豆可做土豆丝、土豆烧牛腩、土豆泥等；鸡蛋可做番茄炒蛋、蛋花汤、厚蛋烧等。
    - 在满足口味与营养的前提下，优先用较少种类的食材通过不同做法搭配出一周食谱，减少采购品种、提高每种食材的利用次数。
    -你可以根据健康饮食原则自由组合食材。如果使用了不在我提供的参考列表里的食材，请根据你的知识库估算其单位热量和碳水、蛋白质、脂肪比例。

    营养与分量（必须遵守）：
    - 每一餐（早/午/晚）必须根据用户身体参数以及目标同时包含：① 蛋白质来源（肉、蛋、豆、奶等）② 主食（米饭、面、薯类等）③ 适量脂肪（烹调油、坚果等），保证三餐营养均衡。
    - name 字段：只写「组合好的菜名」。多道菜用顿号或、分隔，每项都是一道菜的名字。正确示例：午餐写「土豆烧牛腩、凉拌西兰花、米饭」；早餐写「牛奶燕麦、蓝莓」。禁止写「一份搭配的名字」（错误示例：「土豆烧牛腩搭配凉拌西兰花和米饭」）。禁止只写原料（错误示例：「土豆、牛腩、西兰花、米饭」）。
    - portion 字段：与 name 中每道菜一一对应，写「组合菜名+克数」，如「土豆烧牛腩200g、凉拌西兰花100g、米饭150g」或「牛奶燕麦300g、蓝莓50g」。不要使用「约」，直接写克数。不要拆成原料罗列。portion 不得为空，单位以克(g)或 ml 为主。

    饮食习惯（必须遵守）：
    - 食谱需符合绝大部分人的日常饮食习惯。早餐以常见早餐为主：如粥、牛奶、鸡蛋、面包、燕麦、包子、豆浆、吐司、麦片等，避免早餐出现重口味或明显不符合早餐习惯的菜品（如川味香肠、腊肉、重辣重油炒菜）。
    - 午餐须为正式一餐：有主食、有菜、有蛋白质，分量与搭配合理。不可用单一轻食充当一餐（如不可午餐只安排沙拉和黄瓜、不可只吃凉拌菜无主食）。
    - 晚餐可以为轻食，但必须搭配合理：有主食、有菜、有蛋白质，分量与搭配合理。。
    - 早餐、午餐、晚餐都须包含适量脂肪（烹调油、坚果等）。
  `;

  const nutritionRef = getNutritionReferenceForPrompt(config);
  const fullPrompt = nutritionRef ? prompt.trimEnd() + '\n' + nutritionRef : prompt;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: fullPrompt,
      config: {
        responseMimeType: "application/json",
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
                required: ["dishName", "steps"],
                properties: {
                  dishName: { type: Type.STRING },
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

    const cleanedJson = text.replace(/```json\n?/, '').replace(/```\n?$/, '').trim();
    return JSON.parse(cleanedJson) as WeeklyPlanResponse;
  } catch (e: any) {
    console.error("Gemini process error:", e);
    throw new Error(e.message || "生成计划失败，请重试。");
  }
};
