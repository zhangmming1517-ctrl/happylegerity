
import React, { useState, useMemo, useEffect } from 'react';
import { 
  ChevronRight, 
  Settings, 
  User, 
  CheckCircle2, 
  Utensils, 
  ShoppingCart, 
  ChevronLeft,
  Flame,
  Info,
  X,
  ShieldAlert,
  Copy,
  Check
} from 'lucide-react';
import { 
  UserProfile, 
  DietConfig, 
  HealthMetrics, 
  WeeklyPlanResponse, 
  Gender, 
  ActivityLevel, 
  DietGoal, 
  DietMode 
} from './types';
import { calculateHealthMetrics } from './utils/calculators';
import { generateWeeklyPlan } from './services/geminiService';

const STORAGE_KEY = 'minimalist_diet_profile';

const Disclaimer: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`px-6 py-4 bg-gray-50 border-t border-gray-100 ${className}`}>
    <div className="flex items-start gap-2 text-gray-400">
      <ShieldAlert size={14} className="mt-0.5 flex-shrink-0" />
      <p className="text-[10px] leading-relaxed">
        免责声明：本食谱由AI生成，仅供健康饮食规划参考，不作为医疗建议。过敏人群请核实食材。如患有基础疾病，请咨询医生后再使用。
      </p>
    </div>
  </div>
);

const App: React.FC = () => {
  const [page, setPage] = useState<'onboarding' | 'home' | 'plan_input' | 'result'>('home');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRecipes, setShowRecipes] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // 隐藏 iOS Safari 地址栏
  useEffect(() => {
    const hideAddressBar = () => {
      if (/iPhone|iPad|iPod/.test(navigator.userAgent) && window.scrollY === 0) {
        window.scrollTo(0, 1);
      }
    };
    window.addEventListener('scroll', hideAddressBar);
    window.addEventListener('orientationchange', () => setTimeout(hideAddressBar, 100));
    hideAddressBar();
    return () => {
      window.removeEventListener('scroll', hideAddressBar);
      window.removeEventListener('orientationchange', hideAddressBar);
    };
  }, []);

  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {
      age: 25,
      weight: 65.0,
      height: 170,
      gender: Gender.MALE,
      activityLevel: ActivityLevel.SEDENTARY,
      goal: DietGoal.FAT_LOSS,
      dislikes: ''
    };
  });

  const [ageInput, setAgeInput] = useState(profile.age.toString());
  const [heightInput, setHeightInput] = useState(profile.height.toString());
  const [weightInput, setWeightInput] = useState(profile.weight.toString());

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      setPage('onboarding');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  }, [profile]);

  const [config, setConfig] = useState<DietConfig>({
    mode: DietMode.BUYING,
    flavorPreference: ['清淡'],
    wantedIngredients: '',
    existingIngredients: '',
    enableMealPrepRepetition: true,
    maxIngredients: undefined
  });

  const [plan, setPlan] = useState<WeeklyPlanResponse | null>(null);
  const metrics = useMemo(() => calculateHealthMetrics(profile), [profile]);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await generateWeeklyPlan(profile, metrics, config);
      setPlan(result);
      setPage('result');
    } catch (err: any) {
      setError(err.message || '系统繁忙，请重试');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!plan) return;

    let text = `🥗 我的本周健康饮食计划\n\n`;
    text += `【目标】${getGoalLabel(profile.goal)} (建议摄入 ${metrics.targetCalories} kcal/日)\n\n`;
    
    const mealLine = (m: { name?: string; calories?: number; portion?: string } | null) => (m?.portion || m?.name || '待定').replace(/约/g, '');
    text += `📅 三餐安排：\n`;
    plan.dailyPlans.forEach(d => {
      text += `${d.day}：\n`;
      text += `  - 早餐: ${mealLine(d.breakfast)}\n`;
      text += `  - 午餐: ${mealLine(d.lunch)}\n`;
      text += `  - 晚餐: ${mealLine(d.dinner)}\n`;
    });

    text += `\n🛒 采购清单：\n`;
    plan.shoppingList.forEach(item => {
      text += `- ${item.name}: ${item.amount}\n`;
    });

    if (plan.seasonings && plan.seasonings.length > 0) {
      text += `\n🧂 所需调料：\n${plan.seasonings.join('、')}\n`;
    }

    text += `\n---\n来自：AI 极简饮食助手`;

    navigator.clipboard.writeText(text).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }).catch(err => {
      console.error('Failed to copy: ', err);
    });
  };

  const toggleFlavor = (flavor: string) => {
    setConfig(prev => {
      const current = prev.flavorPreference;
      if (current.includes(flavor)) {
        return { ...prev, flavorPreference: current.filter(f => f !== flavor) };
      } else {
        return { ...prev, flavorPreference: [...current, flavor] };
      }
    });
  };

  const getGoalLabel = (goal: DietGoal) => {
    switch(goal) {
      case DietGoal.LOSE_WEIGHT: return '减重';
      case DietGoal.FAT_LOSS: return '减脂';
      case DietGoal.MUSCLE_GAIN: return '增肌';
    }
  };

  const renderOnboarding = () => (
    <div className="flex flex-col h-full bg-white">
      <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
        <h1 className="text-2xl font-bold text-gray-900 mt-8 mb-2">欢迎来到极简饮食</h1>
        <p className="text-gray-500 mb-8 text-sm">我们需要了解您的身体数据以计算基础代谢</p>

        <div className="space-y-6 pb-12">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">年龄</label>
              <input 
                type="number" 
                value={ageInput} 
                onChange={(e) => {
                  setAgeInput(e.target.value);
                  const val = parseInt(e.target.value);
                  if (!isNaN(val)) setProfile({...profile, age: val});
                }}
                className="w-full bg-gray-50 border-none rounded-2xl p-4 text-lg font-semibold focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">性别</label>
              <div className="flex bg-gray-50 rounded-2xl p-1">
                <button 
                  onClick={() => setProfile({...profile, gender: Gender.MALE})}
                  className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${profile.gender === Gender.MALE ? 'bg-white shadow-sm text-green-600' : 'text-gray-400'}`}
                >男</button>
                <button 
                  onClick={() => setProfile({...profile, gender: Gender.FEMALE})}
                  className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${profile.gender === Gender.FEMALE ? 'bg-white shadow-sm text-green-600' : 'text-gray-400'}`}
                >女</button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">身高 (cm)</label>
              <input 
                type="number" 
                value={heightInput} 
                onChange={(e) => {
                  setHeightInput(e.target.value);
                  const val = parseInt(e.target.value);
                  if (!isNaN(val)) setProfile({...profile, height: val});
                }}
                className="w-full bg-gray-50 border-none rounded-2xl p-4 text-lg font-semibold"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">体重 (kg)</label>
              <input 
                type="number" 
                step="0.1"
                value={weightInput} 
                onChange={(e) => {
                  setWeightInput(e.target.value);
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val)) setProfile({...profile, weight: val});
                }}
                className="w-full bg-gray-50 border-none rounded-2xl p-4 text-lg font-semibold"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">运动水平</label>
            <div className="grid grid-cols-1 gap-2">
              {[
                { id: ActivityLevel.SEDENTARY, label: '不运动', desc: '久坐办公，几乎无运动' },
                { id: ActivityLevel.LOW, label: '轻度', desc: '每周运动 1-2 次' },
                { id: ActivityLevel.MODERATE, label: '中度', desc: '每周运动 3-4 次' },
                { id: ActivityLevel.HIGH, label: '高强度', desc: '每周运动 5 次以上' },
              ].map((level) => (
                <button
                  key={level.id}
                  onClick={() => setProfile({...profile, activityLevel: level.id})}
                  className={`flex items-center justify-between p-4 rounded-2xl border text-left transition-all ${profile.activityLevel === level.id ? 'bg-green-50 border-green-500 ring-1 ring-green-500 shadow-sm' : 'bg-gray-50 border-gray-100'}`}
                >
                  <div>
                    <p className={`text-sm font-bold ${profile.activityLevel === level.id ? 'text-green-700' : 'text-gray-700'}`}>{level.label}</p>
                    <p className="text-[10px] text-gray-400">{level.desc}</p>
                  </div>
                  {profile.activityLevel === level.id && <CheckCircle2 size={18} className="text-green-600" />}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">长期忌口</label>
            <input 
              placeholder="如：香菜、海鲜、花生 (选填)"
              value={profile.dislikes}
              onChange={(e) => setProfile({...profile, dislikes: e.target.value})}
              className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-medium"
            />
          </div>

          <div className="pt-4">
            <button 
              onClick={() => setPage('home')}
              className="w-full bg-green-600 text-white font-bold py-5 rounded-[24px] shadow-xl shadow-green-100 active:scale-[0.98] transition-all"
            >
              保存并进入应用
            </button>
          </div>
        </div>
      </div>
      <Disclaimer />
    </div>
  );

  const renderHome = () => (
    <div className="flex flex-col h-full bg-[#FBFBFD]">
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <header className="px-6 pt-12 pb-4 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">你好</h1>
            <p className="text-gray-500 font-medium">今天想吃点什么？</p>
          </div>
          <button 
            onClick={() => setPage('onboarding')}
            className="w-10 h-10 bg-white rounded-full shadow-sm border border-gray-100 flex items-center justify-center active:scale-95 transition-all"
          >
            <Settings size={20} className="text-gray-400" />
          </button>
        </header>

        <section className="px-6 py-4">
          <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <span className="flex items-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                <User size={14} className="mr-1" /> 我的身体数据
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${metrics.bmiCategory === '正常' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                {metrics.bmiCategory}
              </span>
            </div>
            <div className="flex justify-between items-end">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-800 tracking-tighter">{metrics.bmi}</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">BMI</p>
              </div>
              <div className="w-[1px] h-8 bg-gray-100 mb-1"></div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-800 tracking-tighter">≈{metrics.tdee}</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">TDEE</p>
              </div>
              <div className="w-[1px] h-8 bg-gray-100 mb-1"></div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600 tracking-tighter">{metrics.targetCalories}</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">建议摄入</p>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 py-4">
          <h2 className="text-lg font-bold text-gray-800 mb-3 px-1">本周目标</h2>
          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
            {[
              { id: DietGoal.LOSE_WEIGHT, label: '减重' },
              { id: DietGoal.FAT_LOSS, label: '减脂' },
              { id: DietGoal.MUSCLE_GAIN, label: '增肌' },
            ].map(g => (
              <button 
                key={g.id}
                onClick={() => setProfile({...profile, goal: g.id})}
                className={`px-8 py-3 rounded-full text-sm font-bold transition-all whitespace-nowrap shadow-sm border ${
                  profile.goal === g.id ? 'bg-green-500 text-white border-green-500' : 'bg-white text-gray-500 border-gray-100'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </section>

        <section className="px-6 py-4 flex flex-col gap-4 pb-12">
          <button 
            onClick={() => {
              setConfig({...config, mode: DietMode.BUYING});
              setPage('plan_input');
            }}
            className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-100 flex items-center justify-between group active:scale-[0.98] transition-all"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500 mr-4">
                <ShoppingCart size={24} />
              </div>
              <div className="text-left">
                <p className="text-base font-bold text-gray-800">一周食谱 (采买模式)</p>
                <p className="text-xs text-gray-400">基于口味和目标生成购物清单</p>
              </div>
            </div>
            <ChevronRight className="text-gray-300" />
          </button>

          <button 
            onClick={() => {
              setConfig({...config, mode: DietMode.FRIDGE});
              setPage('plan_input');
            }}
            className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-100 flex items-center justify-between group active:scale-[0.98] transition-all"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 mr-4">
                <Utensils size={24} />
              </div>
              <div className="text-left">
                <p className="text-base font-bold text-gray-800">一周食谱 (现有食材)</p>
                <p className="text-xs text-gray-400">最大化利用您的冰箱库存</p>
              </div>
            </div>
            <ChevronRight className="text-gray-300" />
          </button>
        </section>
      </div>
      <Disclaimer />
    </div>
  );

  const renderInputPage = () => (
    <div className="flex flex-col h-full bg-white relative">
      <header className="px-4 pt-12 pb-4 flex items-center sticky top-0 bg-white z-10 border-b border-gray-50">
        <button onClick={() => setPage('home')} className="p-2 active:scale-95 transition-all"><ChevronLeft size={24}/></button>
        <h2 className="flex-1 text-center font-bold text-lg">{config.mode === DietMode.BUYING ? '规划采买' : '清冰箱模式'}</h2>
        <div className="w-10"></div>
      </header>
      
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 no-scrollbar scroll-smooth">
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase mb-3 block tracking-widest">口味偏好 (可多选)</label>
          <div className="flex flex-wrap gap-2">
            {['清淡', '香辣', '酱香', '酸甜', '西式'].map(t => (
              <button 
                key={t} 
                onClick={() => toggleFlavor(t)}
                className={`px-5 py-3 rounded-2xl border text-sm font-bold transition-all ${
                  config.flavorPreference.includes(t) 
                  ? 'bg-green-500 text-white border-green-500 shadow-md shadow-green-100' 
                  : 'bg-gray-50 text-gray-500 border-gray-100'
                }`}
              >{t}</button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase mb-3 block tracking-widest">食材种类上限</label>
          <p className="text-[10px] text-gray-400 mb-2">控制采购清单品种数，同一食材可做多道菜（如土豆→土豆丝、土豆烧牛腩）</p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setConfig({ ...config, maxIngredients: undefined })}
              className={`px-5 py-3 rounded-2xl border text-sm font-bold transition-all ${
                config.maxIngredients == null
                  ? 'bg-green-500 text-white border-green-500 shadow-md shadow-green-100'
                  : 'bg-gray-50 text-gray-500 border-gray-100'
              }`}
            >
              不限制
            </button>
            <span className="text-gray-400 text-sm">或</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={99}
                placeholder="自定义数量"
                value={config.maxIngredients ?? ''}
                onChange={(e) => {
                  const v = e.target.value.trim();
                  const n = v === '' ? undefined : parseInt(v, 10);
                  if (v === '' || (Number.isInteger(n) && n != null && n >= 1 && n <= 99)) {
                    setConfig({ ...config, maxIngredients: n });
                  }
                }}
                className="w-24 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold text-center focus:outline-none focus:ring-2 focus:ring-green-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="text-sm text-gray-500 font-medium">种</span>
            </div>
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase mb-3 block tracking-widest">批量备菜逻辑</label>
          <div className="flex items-center justify-between bg-gray-50 p-5 rounded-[24px]">
            <div>
              <p className="text-sm font-bold text-gray-800">允许食谱重复</p>
              <p className="text-[10px] text-gray-400 mt-0.5">提高备菜效率，减少浪费</p>
            </div>
            <button 
              onClick={() => setConfig({...config, enableMealPrepRepetition: !config.enableMealPrepRepetition})}
              className={`w-12 h-6 rounded-full relative transition-colors ${config.enableMealPrepRepetition ? 'bg-green-500' : 'bg-gray-200'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${config.enableMealPrepRepetition ? 'right-1' : 'left-1'}`}></div>
            </button>
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase mb-3 block tracking-widest">食材说明</label>
          <div className="space-y-4">
            {config.mode === DietMode.BUYING ? (
              <input 
                type="text" 
                placeholder="本周想吃的食材 (选填)" 
                value={config.wantedIngredients}
                onChange={(e) => setConfig({...config, wantedIngredients: e.target.value})}
                className="w-full h-14 bg-gray-50 rounded-[20px] px-5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-400 transition-all" 
              />
            ) : (
              <textarea 
                placeholder="冰箱现有的食材清单..." 
                rows={4}
                value={config.existingIngredients}
                onChange={(e) => setConfig({...config, existingIngredients: e.target.value})}
                className="w-full bg-gray-50 rounded-[20px] p-5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-400 transition-all resize-none" 
              />
            )}
            <div className="flex items-center gap-2 px-1 text-gray-400">
              <span className="text-[10px] italic">长期忌口：{profile.dislikes || '无'}</span>
            </div>
          </div>
        </div>
        
        <div className="h-24"></div>
      </div>

      <div className="px-6 py-6 bg-white border-t border-gray-100 z-20">
        <button 
          onClick={handleGenerate}
          disabled={loading}
          className="w-full bg-green-600 text-white h-14 rounded-full font-bold text-lg shadow-xl shadow-green-100 active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-70"
        >
          {loading ? (
            <div className="flex items-center gap-3">
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              <span>正在智能规划...</span>
            </div>
          ) : '一键生成食谱'}
        </button>
        {error && <p className="text-red-500 text-center text-[11px] mt-2 font-medium">{error}</p>}
      </div>
    </div>
  );

  const renderPlanResult = () => (
    <div className="flex flex-col h-full bg-[#FBFBFD] relative">
      <header className="px-4 pt-12 pb-4 flex items-center sticky top-0 bg-white z-10 border-b border-gray-50">
        <button onClick={() => setPage('home')} className="p-2 active:scale-95 transition-all"><ChevronLeft size={24}/></button>
        <h2 className="flex-1 text-center font-bold text-lg">规划方案</h2>
        <button 
          onClick={copyToClipboard}
          className="p-2 active:scale-95 transition-all text-green-600 flex items-center gap-1"
          title="复制本周食谱与清单"
        >
          {copySuccess ? <Check size={20} /> : <Copy size={20} />}
          <span className="text-[10px] font-bold uppercase">{copySuccess ? '已复制' : '复制'}</span>
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-6 pt-6 no-scrollbar pb-32">
        <div className="bg-green-600 rounded-[28px] p-6 text-white mb-8 shadow-xl shadow-green-100 flex items-center justify-between">
          <div>
            <p className="text-green-100 text-[10px] font-bold uppercase tracking-widest mb-1">本周目标：{getGoalLabel(profile.goal)}</p>
            <p className="text-2xl font-bold">{metrics.targetCalories} <span className="text-sm font-normal opacity-70">kcal / 日</span></p>
          </div>
          <Flame size={36} className="text-white/30" />
        </div>

        <div className="mb-10">
          <h3 className="text-lg font-bold text-gray-800 mb-5 flex items-center">
            <Utensils size={18} className="mr-2 text-green-600" /> 三餐安排
          </h3>
          <div className="flex flex-col gap-4">
            {plan?.dailyPlans.map((d, idx) => (
              <div key={idx} className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-50">
                <div className="flex justify-between items-center mb-3">
                  <p className="text-sm font-bold text-green-700">{d.day}</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">
                    共 {(d.breakfast?.calories || 0) + (d.lunch?.calories || 0) + (d.dinner?.calories || 0)} kcal
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-gray-50 p-2.5 rounded-xl">
                    <span className="text-[9px] text-gray-400 font-bold block uppercase mb-1">早</span>
                    <span className="text-[11px] font-bold text-gray-700 line-clamp-3 leading-tight block">{(d.breakfast?.portion || d.breakfast?.name || '待定').replace(/约/g, '')}</span>
                  </div>
                  <div className="bg-gray-50 p-2.5 rounded-xl">
                    <span className="text-[9px] text-gray-400 font-bold block uppercase mb-1">午</span>
                    <span className="text-[11px] font-bold text-gray-700 line-clamp-3 leading-tight block">{(d.lunch?.portion || d.lunch?.name || '待定').replace(/约/g, '')}</span>
                  </div>
                  <div className="bg-gray-50 p-2.5 rounded-xl">
                    <span className="text-[9px] text-gray-400 font-bold block uppercase mb-1">晚</span>
                    <span className="text-[11px] font-bold text-gray-700 line-clamp-3 leading-tight block">{(d.dinner?.portion || d.dinner?.name || '待定').replace(/约/g, '')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-8">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-lg font-bold text-gray-800 flex items-center">
              <ShoppingCart size={18} className="mr-2 text-green-600" /> 购物清单
            </h3>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-100 px-2 py-1 rounded-full">
              共 {plan?.shoppingList?.length || 0} 项
            </span>
          </div>
          <div className="bg-white rounded-[28px] border border-gray-50 shadow-sm p-6">
            <div className="space-y-4">
              {plan?.shoppingList?.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between group">
                  <div className="flex items-center flex-1 pr-4">
                    <div className="w-5 h-5 rounded-md border-2 border-gray-100 mr-4 flex-shrink-0 flex items-center justify-center transition-colors">
                    </div>
                    <span className="text-sm font-medium text-gray-700 break-words">{item.name}</span>
                  </div>
                  <span className={`text-sm font-bold flex-shrink-0 ${item.amount.includes('可选') || item.amount.includes('自有') || item.amount.includes('已有') ? 'text-amber-500' : 'text-green-600'}`}>
                    {item.amount}
                  </span>
                </div>
              ))}
            </div>
            {plan?.seasonings && plan.seasonings.length > 0 && (
              <div className="mt-8 pt-6 border-t border-dashed border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 mb-3 uppercase tracking-widest">所需调料</p>
                <div className="flex flex-wrap gap-2">
                  {plan.seasonings.map((t, idx) => (
                    <span key={idx} className="text-[11px] bg-gray-50 text-gray-500 px-3 py-1.5 rounded-lg font-bold border border-gray-100">{t}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        <Disclaimer className="mb-8" />
      </div>

      <div className="absolute bottom-6 left-0 right-0 px-6 flex gap-3 z-30">
        <button 
          onClick={() => setShowRecipes(true)}
          className="flex-1 bg-gray-900 text-white h-14 rounded-full font-bold shadow-xl shadow-gray-200 active:scale-[0.98] transition-all flex items-center justify-center"
        >
          查看具体做法
        </button>
        <button 
          onClick={handleGenerate}
          disabled={loading}
          className="w-14 h-14 bg-white border border-gray-100 rounded-full flex items-center justify-center text-gray-400 shadow-sm active:scale-[0.95] transition-all"
        >
          {loading ? (
             <svg className="animate-spin h-6 w-6 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          ) : (
            <CheckCircle2 size={24} className="text-green-500" />
          )}
        </button>
      </div>

      {showRecipes && plan && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex flex-col justify-end">
          <div className="bg-white rounded-t-[32px] p-8 max-h-[85%] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom duration-300 no-scrollbar">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-bold text-gray-800">烹饪指南</h3>
              <button onClick={() => setShowRecipes(false)} className="p-2 bg-gray-100 rounded-full text-gray-400"><X size={20}/></button>
            </div>
            <div className="space-y-8 pb-10">
              {plan.recipes.map((recipe, idx) => (
                <div key={idx}>
                  <p className="font-bold text-gray-800 text-lg flex items-center">
                    <span className="w-1.5 h-6 bg-green-500 rounded-full mr-3"></span>
                    {recipe.dishName}
                  </p>
                  <div className="mt-4 space-y-4">
                    {recipe.steps?.map((step, sIdx) => (
                      <div key={sIdx} className="flex gap-4 items-start">
                        <span className="flex-shrink-0 w-6 h-6 bg-green-50 text-green-600 rounded-lg text-xs font-bold flex items-center justify-center">{sIdx + 1}</span>
                        <p className="text-sm text-gray-600 leading-relaxed font-medium">{step}</p>
                      </div>
                    ))}
                  </div>
                  {idx < plan.recipes.length - 1 && <div className="h-px bg-gray-50 mt-8"></div>}
                </div>
              ))}
            </div>
            <button 
              onClick={() => setShowRecipes(false)}
              className="w-full bg-gray-900 text-white h-14 rounded-full font-bold active:scale-[0.98] transition-all"
            >
              已掌握，返回方案
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-md mx-auto h-screen bg-white shadow-2xl relative font-sans select-none flex flex-col overflow-hidden">
      <div className="h-full w-full overflow-hidden">
        {page === 'onboarding' && renderOnboarding()}
        {page === 'home' && renderHome()}
        {page === 'plan_input' && renderInputPage()}
        {page === 'result' && renderPlanResult()}
      </div>
      <style>{`
        .shadow-up { box-shadow: 0 -4px 12px -2px rgba(0, 0, 0, 0.05); }
      `}</style>
    </div>
  );
};

export default App;
