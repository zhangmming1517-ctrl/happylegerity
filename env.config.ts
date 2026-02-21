/**
 * 自定义需要配置的 Key 类别与说明
 * - key: 环境变量名，与 .env.local 中的变量名一致
 * - label: 可选，用于文档或界面展示
 * - alias: 可选，在代码中可用的别名（如 process.env.API_KEY），便于兼容已有代码
 */
export interface EnvKeyOption {
  /** 环境变量名，对应 .env.local 中的 KEY=value */
  key: string;
  /** 展示名称/说明（可选） */
  label?: string;
  /** 代码中使用的别名，如 'API_KEY' 则 process.env.API_KEY 会得到本 key 的值 */
  alias?: string;
}

/** 在此数组中添加/删除/修改需要配置的 key，值在 .env.local 中填写 */
export const envKeys: EnvKeyOption[] = [
  {
    key: 'VITE_GEMINI_API_KEY',
    label: 'Gemini API 密钥',
    alias: 'API_KEY', // 代码中可用 process.env.API_KEY
  },
  // 示例：添加更多 key 时取消注释并填写 .env.local
  // { key: 'OPENAI_API_KEY', label: 'OpenAI API 密钥' },
  // { key: 'CUSTOM_SERVICE_KEY', label: '自定义服务密钥', alias: 'SERVICE_KEY' },
];
