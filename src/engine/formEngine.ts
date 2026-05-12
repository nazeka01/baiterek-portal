// ============================================================
// ДВИЖОК ФОРМ — вычисление условий, формул, валидация
// Именно это делает систему no-code: бизнес-логика в JSON
// ============================================================

import { FormField, Condition, ConditionalLogic, ValidationRule } from '../types/schema';

export type FormValues = Record<string, unknown>;

// Проверяет одно условие
const evaluateCondition = (condition: Condition, values: FormValues): boolean => {
  const fieldValue = values[condition.fieldId];
  const condValue = condition.value;

  switch (condition.operator) {
    case 'eq':
      return String(fieldValue) === String(condValue);
    case 'neq':
      return String(fieldValue) !== String(condValue);
    case 'gt':
      return Number(fieldValue) > Number(condValue);
    case 'gte':
      return Number(fieldValue) >= Number(condValue);
    case 'lt':
      return Number(fieldValue) < Number(condValue);
    case 'lte':
      return Number(fieldValue) <= Number(condValue);
    case 'contains':
      return String(fieldValue).includes(String(condValue));
    case 'in':
      return Array.isArray(condValue) && condValue.includes(String(fieldValue));
    default:
      return false;
  }
};

// Вычисляет, выполняется ли группа условий
const evaluateLogic = (logic: ConditionalLogic, values: FormValues): boolean => {
  if (logic.logicType === 'AND') {
    return logic.conditions.every((c) => evaluateCondition(c, values));
  }
  return logic.conditions.some((c) => evaluateCondition(c, values));
};

// Определяет, должно ли поле быть видимым
export const isFieldVisible = (field: FormField, values: FormValues): boolean => {
  if (!field.conditionalLogic || field.conditionalLogic.length === 0) return true;

  const showRules = field.conditionalLogic.filter((l) => l.action === 'show');
  const hideRules = field.conditionalLogic.filter((l) => l.action === 'hide');

  // Если есть правила show — показываем только если хоть одно выполнено
  if (showRules.length > 0) {
    const shouldShow = showRules.some((rule) => evaluateLogic(rule, values));
    if (!shouldShow) return false;
  }

  // Если есть правила hide — скрываем если хоть одно выполнено
  if (hideRules.length > 0) {
    const shouldHide = hideRules.some((rule) => evaluateLogic(rule, values));
    if (shouldHide) return false;
  }

  return true;
};

// Вычисляет формулу расчётного поля
// Поддерживаемые операции: +, -, *, /, (), переменные из values
export const calculateFormula = (formula: string, values: FormValues): number | null => {
  try {
    // Заменяем имена полей на их значения
    let expression = formula;
    const fieldNames = Object.keys(values).sort((a, b) => b.length - a.length); // длинные сначала
    for (const fieldName of fieldNames) {
      const val = parseFloat(String(values[fieldName])) || 0;
      expression = expression.replace(new RegExp(`\\b${fieldName}\\b`, 'g'), String(val));
    }
    // Безопасное вычисление (только числа и операторы)
    if (/^[\d\s+\-*/().]+$/.test(expression)) {
      // eslint-disable-next-line no-new-func
      const result = new Function(`return (${expression})`)();
      return typeof result === 'number' && isFinite(result) ? Math.round(result) : null;
    }
    return null;
  } catch {
    return null;
  }
};

// Вычисляет все расчётные поля в форме (может быть несколько зависимых)
export const computeCalculatedFields = (fields: FormField[], values: FormValues): FormValues => {
  const result = { ...values };
  let changed = true;
  let iterations = 0;

  // Итеративно пересчитываем, пока есть изменения (зависимые поля)
  while (changed && iterations < 10) {
    changed = false;
    iterations++;
    for (const field of fields) {
      if (field.type === 'calculated' && field.formula) {
        const newVal = calculateFormula(field.formula, result);
        if (newVal !== null && newVal !== result[field.id]) {
          result[field.id] = newVal;
          changed = true;
        }
      }
    }
  }
  return result;
};

// Форматирует число как валюту
export const formatCurrency = (value: number | string | undefined): string => {
  if (value === undefined || value === '' || value === null) return '';
  const num = typeof value === 'string' ? parseFloat(value.replace(/\s/g, '')) : value;
  if (isNaN(num)) return String(value);
  return num.toLocaleString('ru-KZ') + ' ₸';
};

// Применяет маску ввода
export const applyMask = (value: string, mask: string): string => {
  let result = '';
  let valueIndex = 0;
  for (let i = 0; i < mask.length && valueIndex < value.length; i++) {
    if (mask[i] === '#') {
      if (/\d/.test(value[valueIndex])) {
        result += value[valueIndex];
        valueIndex++;
      } else {
        valueIndex++;
        i--;
      }
    } else {
      result += mask[i];
      if (value[valueIndex] === mask[i]) valueIndex++;
    }
  }
  return result;
};

// Валидирует одно поле
export const validateField = (
  field: FormField,
  value: unknown,
  allValues: FormValues
): string | null => {
  if (!isFieldVisible(field, allValues)) return null;

  const strValue = String(value ?? '').trim();
  const numValue = parseFloat(strValue.replace(/\s/g, '').replace('₸', ''));

  if (field.required && (!value || strValue === '')) {
    return `Поле "${field.label}" обязательно для заполнения`;
  }

  if (!field.validation) return null;

  for (const rule of field.validation) {
    switch (rule.type) {
      case 'required':
        if (!value || strValue === '') return rule.message;
        break;
      case 'minLength':
        if (strValue.length < Number(rule.value)) return rule.message;
        break;
      case 'maxLength':
        if (strValue.length > Number(rule.value)) return rule.message;
        break;
      case 'min':
        if (numValue < Number(rule.value)) return rule.message;
        break;
      case 'max':
        if (numValue > Number(rule.value)) return rule.message;
        break;
      case 'pattern':
        if (rule.value && !new RegExp(String(rule.value)).test(strValue)) return rule.message;
        break;
    }
  }

  return null;
};

// Валидирует все поля шага
export const validateStep = (
  fields: FormField[],
  values: FormValues
): Record<string, string> => {
  const errors: Record<string, string> = {};
  for (const field of fields) {
    if (!isFieldVisible(field, values)) continue;
    if (field.type === 'info_block' || field.type === 'divider' || field.type === 'calculated') continue;
    const error = validateField(field, values[field.id], values);
    if (error) errors[field.id] = error;
  }
  return errors;
};
