
export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE'
}

export enum ActivityLevel {
  SEDENTARY = 'SEDENTARY', // 不运动
  LOW = 'LOW',             // 每周 1-2 次
  MODERATE = 'MODERATE',   // 每周 3-4 次
  HIGH = 'HIGH'            // 每周 5 次以上
}

export enum DietGoal {
  LOSE_WEIGHT = 'LOSE_WEIGHT',
  FAT_LOSS = 'FAT_LOSS',
  MUSCLE_GAIN = 'MUSCLE_GAIN'
}

export enum DietMode {
  BUYING = 'BUYING',        // 模式 A：采买模式
  FRIDGE = 'FRIDGE'         // 模式 B：清冰箱模式
}

export interface UserProfile {
  age: number;
  weight: number;
  height: number;
  gender: Gender;
  activityLevel: ActivityLevel;
  goal: DietGoal;
  dislikes: string; // Moved here for long-term storage
}

export interface DietConfig {
  mode: DietMode;
  flavorPreference: string[]; // Updated to multi-select
  wantedIngredients?: string; // Mode A
  existingIngredients?: string; // Mode B
  enableMealPrepRepetition: boolean;
  /** 购物清单食材种类上限，不设或 0 表示不限制 */
  maxIngredients?: number;
}

export interface Meal {
  name: string;
  calories: number;
  /** 该餐各食物用量（克数等），如 "米饭150g、鸡胸肉100g、菠菜80g" */
  portion?: string;
}

export interface DailyPlan {
  day: string;
  breakfast: Meal;
  lunch: Meal;
  dinner: Meal;
}

export interface ShoppingItem {
  name: string;
  amount: string;
}

export interface Recipe {
  dishName: string;
  steps: string[];
}

export interface WeeklyPlanResponse {
  dailyPlans: DailyPlan[];
  shoppingList: ShoppingItem[];
  seasonings: string[];
  recipes: Recipe[];
}

export interface HealthMetrics {
  bmi: number;
  tdee: number;
  targetCalories: number;
  bmiCategory: string;
}

/** 内置 API 提供商 */
export type BuiltinApiProvider = 'gemini' | 'openai';

/** 自定义 API（默认按 OpenAI 兼容格式调用） */
export interface CustomApiProvider {
  id: string;
  name: string;
  baseUrl: string;
  model: string;
  apiKey: string;
}

/** API 设置（持久化到 localStorage） */
export interface ApiSettings {
  /** 当前选中的 provider id（内置为 gemini/openai，自定义为 custom_xxx） */
  selectedProviderId: string;
  /** 内置 API 的 key */
  builtinApiKeys: Partial<Record<BuiltinApiProvider, string>>;
  /** 用户自定义 API 列表 */
  customProviders: CustomApiProvider[];
}
