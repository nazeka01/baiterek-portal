// ============================================================
// ЯДРО ДВИЖКА: JSON-схема форм для no-code конструктора
// ============================================================

export type FieldType =
  | 'text'
  | 'number'
  | 'select'
  | 'multiselect'
  | 'radio'
  | 'checkbox'
  | 'date'
  | 'phone'
  | 'email'
  | 'iin_bin'       // ИИН/БИН — с маской и валидацией
  | 'currency'      // сумма в тенге с форматированием
  | 'textarea'
  | 'file_upload'
  | 'calculated'    // расчётное поле (формула)
  | 'info_block'    // информационный блок (не поле ввода)
  | 'divider';

export interface FieldOption {
  value: string;
  label: string;
  labelKz?: string;
}

export interface ValidationRule {
  type: 'required' | 'min' | 'max' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  value?: string | number;
  message: string;
}

// Условие показа/скрытия поля (логика ветвления)
export interface Condition {
  fieldId: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'in';
  value: string | number | string[];
}

export interface ConditionalLogic {
  action: 'show' | 'hide' | 'require' | 'set_value';
  conditions: Condition[];
  logicType: 'AND' | 'OR';
  setValue?: string; // для action = 'set_value'
}

// Источник данных для автозаполнения из mock API
export interface DataSource {
  type: 'egov_company' | 'egov_person' | 'dictionary' | 'calculated';
  endpoint?: string;
  fieldMapping?: Record<string, string>; // поле формы → поле ответа API
}

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  labelKz?: string;
  placeholder?: string;
  description?: string;   // подсказка под полем
  required?: boolean;
  disabled?: boolean;
  defaultValue?: string | number | boolean;
  options?: FieldOption[]; // для select/radio/multiselect
  validation?: ValidationRule[];
  conditionalLogic?: ConditionalLogic[];
  dataSource?: DataSource; // автозаполнение из внешнего сервиса
  formula?: string;        // для type='calculated', напр. "amount * 0.2"
  mask?: string;           // маска ввода: "+7 (###) ###-##-##"
  width?: 'full' | 'half' | 'third'; // ширина в сетке
  group?: string;          // группировка полей
  // для file_upload
  acceptedFormats?: string[];
  maxFileSizeMb?: number;
  maxFiles?: number;
}

export interface FormStep {
  id: string;
  title: string;
  titleKz?: string;
  description?: string;
  fields: FormField[];
  conditionalLogic?: ConditionalLogic[]; // можно скрыть целый шаг
}

// Схема услуги — то, что хранится в БД и редактируется конструктором
export interface ServiceSchema {
  id: string;
  slug: string;
  title: string;
  titleKz?: string;
  shortDescription: string;
  organization: string;    // БРК, ДАМУ, КазАгро, и т.д.
  category: string;
  stage?: number;          // этап (1, 2) — для многоэтапных услуг
  linkedServiceId?: string; // ID следующего этапа
  steps: FormStep[];
  documents: RequiredDocument[];
  conditions: string[];    // условия получения услуги
  duration: string;        // "до 30 рабочих дней"
  result: string;          // результат оказания услуги
  // Интеграция с ЕИШ
  eishEndpoint?: string;
  eishMethod?: string;
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface RequiredDocument {
  id: string;
  name: string;
  description?: string;
  required: boolean;
  format?: string;
}

// Заявка пользователя
export interface Application {
  id: string;
  serviceId: string;
  serviceTitle: string;
  userId: string;
  companyName?: string;
  status: ApplicationStatus;
  currentStep: number;
  data: Record<string, unknown>; // данные форм
  documents: UploadedDocument[];
  history: ApplicationEvent[];
  createdAt: string;
  updatedAt: string;
}

export type ApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'in_review'
  | 'additional_docs_required'
  | 'approved'
  | 'rejected'
  | 'completed';

export interface UploadedDocument {
  id: string;
  name: string;
  url: string;
  size: number;
  uploadedAt: string;
}

export interface ApplicationEvent {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  actor?: string;
}

// Пользователь
export interface User {
  id: string | number;
  iin?: string;
  bin?: string;
  fullName: string;
  email: string;
  phone: string;
  role: 'individual' | 'legal_entity' | 'author' | 'admin';
  companyName?: string;
  position?: string;
  canSign: boolean;
}

export interface News {
  Id: number;
  Title: string;
  TitleKz: string;
  Content: string;
  ContentKz: string;
  Organization: string;
  ImageUrl?: string;
  CreatedAt: string;
}

export interface Article {
  Id: number;
  Title: string;
  TitleKz: string;
  Category: string;
  CategoryKz: string;
  Content: string;
  ContentKz: string;
  CreatedAt: string;
}

export interface Booking {
  Id: number;
  UserId: number;
  UserName?: string;
  Organization: string;
  Date: string;
  TimeSlot: string;
  Topic: string;
  Status: 'pending' | 'approved' | 'rejected' | 'completed';
  CreatedAt: string;
}

export interface Notification {
  Id: number;
  UserId: number;
  Title: string;
  TitleKz: string;
  Message: string;
  MessageKz: string;
  IsRead: number;
  CreatedAt: string;
}

export interface AuditLog {
  Id: number;
  UserId: number;
  UserName?: string;
  Action: string;
  EntityType: string;
  EntityId: string;
  IpAddress?: string;
  CreatedAt: string;
}

export interface DocVersion {
  Id: number;
  ApplicationId: string;
  DocFieldId: string;
  Version: number;
  FileName: string;
  FileSize: number;
  FileUrl: string;
  UploadedBy: string;
  CreatedAt: string;
}

export interface Comment {
  Id: number;
  ApplicationId: string;
  UserId: number;
  UserName: string;
  Message: string;
  CreatedAt: string;
}

