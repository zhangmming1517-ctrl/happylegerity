
import { Gender, ActivityLevel, UserProfile, HealthMetrics, DietGoal } from '../types';

export const calculateHealthMetrics = (profile: UserProfile): HealthMetrics => {
  const { weight, height, age, gender, activityLevel, goal } = profile;

  // BMI = kg / m^2
  const bmi = weight / Math.pow(height / 100, 2);

  // BMR calculation (Mifflin-St Jeor)
  let bmr = (10 * weight) + (6.25 * height) - (5 * age);
  bmr = gender === Gender.MALE ? bmr + 5 : bmr - 161;

  // Activity Factor
  const factors = {
    [ActivityLevel.SEDENTARY]: 1.2,
    [ActivityLevel.LOW]: 1.375,
    [ActivityLevel.MODERATE]: 1.55,
    [ActivityLevel.HIGH]: 1.725,
  };

  const tdee = bmr * factors[activityLevel];

  // Target Calories based on Goal
  let targetCalories = tdee;
  if (goal === DietGoal.LOSE_WEIGHT) targetCalories -= 500;
  if (goal === DietGoal.FAT_LOSS) targetCalories -= 300;
  if (goal === DietGoal.MUSCLE_GAIN) targetCalories += 300;

  // BMI Category
  let bmiCategory = "正常";
  if (bmi < 18.5) bmiCategory = "偏瘦";
  else if (bmi >= 24 && bmi < 28) bmiCategory = "超重";
  else if (bmi >= 28) bmiCategory = "肥胖";

  return {
    bmi: Math.round(bmi * 10) / 10,
    tdee: Math.round(tdee),
    targetCalories: Math.round(targetCalories),
    bmiCategory
  };
};
