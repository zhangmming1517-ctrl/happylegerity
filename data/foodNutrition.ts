/**
 * 食物营养知识库（每 100g 可食部）
 * 用于 RAG 检索，供 LLM 参考热量、蛋白质、脂肪、碳水等
 * 数据来源参考：中国食物成分表、常见营养数据库，可自行扩充
 */
export interface FoodNutrition {
  /** 标准名称 */
  name: string;
  /** 别名/关键词，用于检索匹配 */
  aliases?: string[];
  /** 热量 kcal/100g */
  calories: number;
  /** 蛋白质 g/100g */
  protein: number;
  /** 脂肪 g/100g */
  fat: number;
  /** 碳水化合物 g/100g */
  carbs: number;
  /** 说明，如 "熟" "生" "可食部" */
  note?: string;
}

export const FOOD_NUTRITION_DB: FoodNutrition[] = [
  // 谷薯类
  { name: '米饭', aliases: ['白米饭', '大米饭'], calories: 130, protein: 2.7, fat: 0.3, carbs: 28.2, note: '熟' },
  { name: '糙米饭', aliases: ['糙米'], calories: 112, protein: 2.6, fat: 0.9, carbs: 23.5, note: '熟' },
  { name: '燕麦', aliases: ['燕麦片', '麦片'], calories: 389, protein: 16.9, fat: 6.9, carbs: 66.3 },
  { name: '全麦面包', aliases: ['全麦吐司', '吐司'], calories: 246, protein: 10.7, fat: 3.5, carbs: 45.8 },
  { name: '面条', aliases: ['挂面', '小麦面'], calories: 284, protein: 9.6, fat: 0.7, carbs: 61.9 },
  { name: '土豆', aliases: ['马铃薯', '洋芋'], calories: 77, protein: 2, fat: 0.1, carbs: 17.5, note: '熟' },
  { name: '红薯', aliases: ['地瓜', '番薯'], calories: 86, protein: 1.6, fat: 0.1, carbs: 20.1, note: '熟' },
  { name: '玉米', aliases: ['玉米粒'], calories: 86, protein: 3.3, fat: 1.2, carbs: 19, note: '熟' },
  { name: '馒头', aliases: ['白馒头'], calories: 221, protein: 7, fat: 1.1, carbs: 45.7 },
  { name: '包子', aliases: ['肉包', '菜包'], calories: 220, protein: 7.2, fat: 5.5, carbs: 35.6 },
  // 肉禽蛋
  { name: '鸡胸肉', aliases: ['鸡胸', '鸡脯'], calories: 133, protein: 31, fat: 1.2, carbs: 0, note: '熟' },
  { name: '鸡腿肉', aliases: ['鸡腿'], calories: 211, protein: 26, fat: 11, carbs: 0, note: '熟带皮' },
  { name: '牛腩', aliases: ['牛肉', '炖牛肉'], calories: 250, protein: 26, fat: 15, carbs: 0, note: '熟' },
  { name: '猪瘦肉', aliases: ['瘦肉', '里脊'], calories: 143, protein: 21, fat: 6.2, carbs: 0, note: '熟' },
  { name: '排骨', aliases: ['猪排骨'], calories: 278, protein: 18, fat: 23, carbs: 0, note: '熟' },
  { name: '肥肠', aliases: ['猪大肠'], calories: 196, protein: 12.9, fat: 16.2, carbs: 0, note: '熟' },
  { name: '鸡蛋', aliases: ['水煮蛋', '煮蛋',"溏心蛋"], calories: 155, protein: 13, fat: 11, carbs: 1.1, note: '可食部' },
  { name: '香肠', aliases: ['川味香肠', '腊肠'], calories: 300, protein: 12, fat: 27, carbs: 4, note: '熟' },
  // 奶豆
  { name: '牛奶', aliases: ['鲜奶', '纯牛奶'], calories: 54, protein: 3, fat: 3.2, carbs: 3.4, note: '全脂/100ml' },
  { name: '豆浆', aliases: ['豆奶'], calories: 31, protein: 2.9, fat: 1.6, carbs: 1.1, note: '100ml' },
  { name: '豆腐', aliases: ['北豆腐', '嫩豆腐'], calories: 76, protein: 8.1, fat: 4.2, carbs: 1.9 },
  { name: '豆腐干', aliases: ['香干'], calories: 140, protein: 16.2, fat: 9.7, carbs: 3.6 },
  // 蔬菜
  { name: '西兰花', aliases: ['西蓝花', '青花菜'], calories: 34, protein: 2.8, fat: 0.4, carbs: 7, note: '熟' },
  { name: '菠菜', aliases: ['青菜', '叶菜'], calories: 23, protein: 2.9, fat: 0.4, carbs: 3.6, note: '熟' },
  { name: '生菜', aliases: ['莴苣叶'], calories: 15, protein: 1.4, fat: 0.2, carbs: 2.9, note: '生' },
  { name: '黄瓜', aliases: ['青瓜'], calories: 15, protein: 0.7, fat: 0.1, carbs: 3.6, note: '生' },
  { name: '番茄', aliases: ['西红柿'], calories: 18, protein: 0.9, fat: 0.2, carbs: 3.9, note: '生' },
  { name: '萝卜', aliases: ['白萝卜', '胡萝卜'], calories: 20, protein: 0.9, fat: 0.1, carbs: 4.7, note: '生' },
  { name: '胡萝卜', aliases: ['红萝卜'], calories: 41, protein: 0.9, fat: 0.2, carbs: 9.6, note: '生' },
  { name: '茄子', aliases: ['紫茄'], calories: 25, protein: 1.2, fat: 0.2, carbs: 6, note: '熟' },
  { name: '青椒', aliases: ['甜椒', '彩椒'], calories: 20, protein: 1.1, fat: 0.2, carbs: 4.6, note: '生' },
  { name: '洋葱', aliases: ['葱头'], calories: 40, protein: 1.1, fat: 0.1, carbs: 9.4, note: '生' },
  { name: '绿豆', aliases: ['绿豆汤'], calories: 105, protein: 7.4, fat: 0.5, carbs: 19.2, note: '熟' },
  { name: '折耳根', aliases: ['鱼腥草'], calories: 44, protein: 2.6, fat: 0.2, carbs: 10.2, note: '生' },
  // 水果
  { name: '蓝莓', aliases: [], calories: 57, protein: 0.7, fat: 0.3, carbs: 14.5 },
  { name: '苹果', aliases: [], calories: 52, protein: 0.3, fat: 0.2, carbs: 14 },
  { name: '香蕉', aliases: [], calories: 89, protein: 1.1, fat: 0.3, carbs: 22.8 },
  { name: '橙子', aliases: ['橙'], calories: 47, protein: 0.9, fat: 0.1, carbs: 11.8 },
  // 油脂与其它
  { name: '食用油', aliases: ['植物油', '炒菜油', '橄榄油'], calories: 884, protein: 0, fat: 100, carbs: 0 },
  { name: '坚果', aliases: ['核桃', '杏仁', '腰果'], calories: 600, protein: 15, fat: 55, carbs: 20, note: '混合约值' },
  { name: '沙拉', aliases: ['蔬菜沙拉'], calories: 35, protein: 1.5, fat: 2, carbs: 4, note: '无酱约值' },
];
