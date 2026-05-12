// ============================================================
// СХЕМА УСЛУГИ: "Приобретение авиатранспорта и вагонов в лизинг"
// I Этап — Предварительная заявка (wagons_ind)
// II Этап — Основная заявка (wagons_exp)
//
// ВАЖНО: эта схема генерируется конструктором и хранится в БД.
// Здесь она задана статически только для демонстрации MVP.
// В реальной системе — загружается через API.
// ============================================================

import { ServiceSchema } from '../types/schema';

export const leasingServiceStage1: ServiceSchema = {
  id: 'svc_wagons_ind',
  slug: 'wagons_ind',
  title: 'Приобретение авиатранспорта и вагонов в лизинг — I Этап',
  titleKz: 'Авиакөлік және вагондарды лизингке алу — I Кезең',
  shortDescription:
    'Предварительная заявка на финансовый лизинг авиатранспорта или железнодорожных вагонов через БРК Лизинг',
  organization: 'БРК Лизинг',
  category: 'Лизинг',
  stage: 1,
  linkedServiceId: 'svc_wagons_exp',
  duration: 'до 15 рабочих дней',
  result: 'Индикативное решение о возможности финансирования',
  conditions: [
    'Компания — резидент Республики Казахстан',
    'Срок деятельности — не менее 1 года',
    'Отсутствие просроченной задолженности перед бюджетом',
    'Стоимость предмета лизинга — от 80 млн тенге',
  ],
  eishEndpoint: '/api/eish/brk-leasing/stage1',
  eishMethod: 'POST',
  status: 'published',
  createdAt: '2024-01-15T00:00:00Z',
  updatedAt: '2024-06-01T00:00:00Z',
  documents: [
    {
      id: 'doc1',
      name: 'Устав компании',
      required: true,
      format: 'PDF',
    },
    {
      id: 'doc2',
      name: 'Свидетельство о регистрации',
      required: true,
      format: 'PDF',
    },
    {
      id: 'doc3',
      name: 'Финансовая отчётность за последние 2 года',
      required: true,
      format: 'PDF, XLSX',
    },
    {
      id: 'doc4',
      name: 'Бизнес-план проекта',
      required: true,
      format: 'PDF, DOCX',
    },
    {
      id: 'doc5',
      name: 'Коммерческое предложение от поставщика',
      required: false,
      format: 'PDF',
    },
  ],
  steps: [
    // ШАГ 1: Информация о компании (автозаполнение из eGov)
    {
      id: 'step_company',
      title: 'Сведения о компании',
      titleKz: 'Компания туралы мәліметтер',
      description: 'Данные заполняются автоматически из базы данных eGov по введённому БИН',
      fields: [
        {
          id: 'bin',
          type: 'iin_bin',
          label: 'БИН компании',
          placeholder: '____________',
          required: true,
          mask: '############',
          validation: [
            { type: 'required', message: 'Введите БИН компании' },
            { type: 'minLength', value: 12, message: 'БИН должен содержать 12 цифр' },
          ],
          dataSource: {
            type: 'egov_company',
            fieldMapping: {
              company_name: 'nameRu',
              company_name_kz: 'nameKz',
              oked: 'oked',
              oked_name: 'okedName',
              director: 'director',
              address: 'address',
              registration_date: 'registrationDate',
            },
          },
          width: 'half',
        },
        {
          id: 'company_name',
          type: 'text',
          label: 'Наименование компании',
          required: true,
          disabled: true, // заполняется автоматически из eGov
          description: 'Заполняется автоматически',
          width: 'full',
        },
        {
          id: 'oked_name',
          type: 'text',
          label: 'Вид деятельности (ОКЭД)',
          required: true,
          disabled: true,
          description: 'Заполняется автоматически',
          width: 'half',
        },
        {
          id: 'registration_date',
          type: 'text',
          label: 'Дата регистрации',
          disabled: true,
          description: 'Заполняется автоматически',
          width: 'half',
        },
        {
          id: 'director',
          type: 'text',
          label: 'Руководитель',
          required: true,
          disabled: true,
          description: 'Заполняется автоматически',
          width: 'half',
        },
        {
          id: 'address',
          type: 'text',
          label: 'Юридический адрес',
          required: true,
          disabled: true,
          description: 'Заполняется автоматически',
          width: 'full',
        },
        {
          id: 'contact_phone',
          type: 'phone',
          label: 'Контактный телефон',
          placeholder: '+7 (___) ___-__-__',
          required: true,
          mask: '+7 (###) ###-##-##',
          width: 'half',
        },
        {
          id: 'contact_email',
          type: 'email',
          label: 'Контактный email',
          required: true,
          width: 'half',
        },
      ],
    },

    // ШАГ 2: Предмет лизинга — с ветвлением по типу
    {
      id: 'step_subject',
      title: 'Предмет лизинга',
      titleKz: 'Лизинг нысаны',
      fields: [
        {
          id: 'leasing_type',
          type: 'radio',
          label: 'Тип предмета лизинга',
          required: true,
          options: [
            { value: 'aviation', label: 'Авиатранспорт (воздушные суда)' },
            { value: 'wagons', label: 'Железнодорожные вагоны' },
          ],
          width: 'full',
        },
        // ---- Поля для авиатранспорта (показываются при leasing_type = 'aviation')
        {
          id: 'aviation_type',
          type: 'select',
          label: 'Тип воздушного судна',
          required: true,
          options: [
            { value: 'passenger', label: 'Пассажирское ВС' },
            { value: 'cargo', label: 'Грузовое ВС' },
            { value: 'helicopter', label: 'Вертолёт' },
          ],
          conditionalLogic: [
            {
              action: 'show',
              conditions: [{ fieldId: 'leasing_type', operator: 'eq', value: 'aviation' }],
              logicType: 'AND',
            },
          ],
          width: 'half',
        },
        {
          id: 'aircraft_model',
          type: 'text',
          label: 'Модель воздушного судна',
          placeholder: 'Например: Boeing 737-800',
          conditionalLogic: [
            {
              action: 'show',
              conditions: [{ fieldId: 'leasing_type', operator: 'eq', value: 'aviation' }],
              logicType: 'AND',
            },
          ],
          width: 'half',
        },
        {
          id: 'aircraft_quantity',
          type: 'number',
          label: 'Количество воздушных судов',
          required: true,
          defaultValue: 1,
          validation: [
            { type: 'min', value: 1, message: 'Минимум 1 единица' },
            { type: 'max', value: 20, message: 'Максимум 20 единиц' },
          ],
          conditionalLogic: [
            {
              action: 'show',
              conditions: [{ fieldId: 'leasing_type', operator: 'eq', value: 'aviation' }],
              logicType: 'AND',
            },
          ],
          width: 'half',
        },
        // ---- Поля для вагонов (показываются при leasing_type = 'wagons')
        {
          id: 'wagon_type',
          type: 'select',
          label: 'Тип вагонов',
          required: true,
          options: [
            { value: 'covered', label: 'Крытые вагоны' },
            { value: 'flatcar', label: 'Платформы' },
            { value: 'tank', label: 'Цистерны' },
            { value: 'hopper', label: 'Хопперы' },
            { value: 'container', label: 'Контейнеровозы' },
          ],
          conditionalLogic: [
            {
              action: 'show',
              conditions: [{ fieldId: 'leasing_type', operator: 'eq', value: 'wagons' }],
              logicType: 'AND',
            },
          ],
          width: 'half',
        },
        {
          id: 'wagon_quantity',
          type: 'number',
          label: 'Количество вагонов',
          required: true,
          defaultValue: 10,
          validation: [
            { type: 'min', value: 1, message: 'Минимум 1 вагон' },
            { type: 'max', value: 1000, message: 'Максимум 1000 вагонов' },
          ],
          conditionalLogic: [
            {
              action: 'show',
              conditions: [{ fieldId: 'leasing_type', operator: 'eq', value: 'wagons' }],
              logicType: 'AND',
            },
          ],
          width: 'half',
        },
        // ---- Общие поля для обоих типов
        {
          id: 'supplier_country',
          type: 'select',
          label: 'Страна поставщика',
          required: true,
          options: [
            { value: 'kz', label: 'Казахстан' },
            { value: 'ru', label: 'Россия' },
            { value: 'cn', label: 'Китай' },
            { value: 'eu', label: 'Европа' },
            { value: 'other', label: 'Другое' },
          ],
          width: 'half',
        },
        {
          id: 'asset_cost',
          type: 'currency',
          label: 'Стоимость предмета лизинга (тенге)',
          required: true,
          description: 'Минимальная сумма — 80 000 000 тенге',
          validation: [
            { type: 'required', message: 'Укажите стоимость' },
            { type: 'min', value: 80000000, message: 'Минимальная сумма — 80 млн тенге' },
          ],
          width: 'half',
        },
      ],
    },

    // ШАГ 3: Параметры финансирования + расчётные поля
    {
      id: 'step_financing',
      title: 'Параметры финансирования',
      titleKz: 'Қаржыландыру параметрлері',
      fields: [
        {
          id: 'leasing_term_years',
          type: 'select',
          label: 'Срок лизинга',
          required: true,
          options: [
            { value: '3', label: '3 года' },
            { value: '5', label: '5 лет' },
            { value: '7', label: '7 лет' },
            { value: '10', label: '10 лет' },
          ],
          width: 'half',
        },
        {
          id: 'advance_percent',
          type: 'select',
          label: 'Авансовый платёж',
          required: true,
          options: [
            { value: '15', label: '15%' },
            { value: '20', label: '20%' },
            { value: '25', label: '25%' },
            { value: '30', label: '30%' },
          ],
          width: 'half',
        },
        // Расчётные поля — вычисляются автоматически по формуле
        {
          id: 'advance_amount',
          type: 'calculated',
          label: 'Сумма авансового платежа (тенге)',
          formula: 'asset_cost * (advance_percent / 100)',
          disabled: true,
          width: 'half',
        },
        {
          id: 'financing_amount',
          type: 'calculated',
          label: 'Сумма финансирования (тенге)',
          formula: 'asset_cost - advance_amount',
          disabled: true,
          width: 'half',
        },
        {
          id: 'monthly_payment_approx',
          type: 'calculated',
          label: 'Ориентировочный ежемесячный платёж (тенге)',
          formula: 'financing_amount / (leasing_term_years * 12)',
          disabled: true,
          description: '* Приблизительный расчёт без учёта вознаграждения',
          width: 'full',
        },
        {
          id: 'purpose',
          type: 'textarea',
          label: 'Цель приобретения и описание проекта',
          required: true,
          placeholder: 'Опишите цель приобретения предмета лизинга и ожидаемый экономический эффект',
          validation: [
            { type: 'minLength', value: 50, message: 'Минимум 50 символов' },
            { type: 'maxLength', value: 2000, message: 'Максимум 2000 символов' },
          ],
          width: 'full',
        },
      ],
    },

    // ШАГ 4: Документы
    {
      id: 'step_documents',
      title: 'Документы',
      titleKz: 'Құжаттар',
      description: 'Загрузите необходимые документы. Файлы принимаются в форматах PDF, DOCX, XLSX',
      fields: [
        {
          id: 'doc_charter',
          type: 'file_upload',
          label: 'Устав компании',
          required: true,
          acceptedFormats: ['.pdf'],
          maxFileSizeMb: 10,
          maxFiles: 1,
          width: 'full',
        },
        {
          id: 'doc_registration',
          type: 'file_upload',
          label: 'Свидетельство о государственной регистрации',
          required: true,
          acceptedFormats: ['.pdf'],
          maxFileSizeMb: 5,
          maxFiles: 1,
          width: 'full',
        },
        {
          id: 'doc_financial',
          type: 'file_upload',
          label: 'Финансовая отчётность за последние 2 года',
          required: true,
          acceptedFormats: ['.pdf', '.xlsx', '.xls'],
          maxFileSizeMb: 20,
          maxFiles: 4,
          description: 'Баланс, ОПУ, отчёт о движении денег',
          width: 'full',
        },
        {
          id: 'doc_business_plan',
          type: 'file_upload',
          label: 'Бизнес-план проекта',
          required: true,
          acceptedFormats: ['.pdf', '.docx'],
          maxFileSizeMb: 20,
          maxFiles: 1,
          width: 'full',
        },
        {
          id: 'doc_supplier_offer',
          type: 'file_upload',
          label: 'Коммерческое предложение от поставщика',
          required: false,
          acceptedFormats: ['.pdf'],
          maxFileSizeMb: 10,
          maxFiles: 2,
          description: 'При наличии',
          width: 'full',
        },
      ],
    },
  ],
};

// II Этап
export const leasingServiceStage2: ServiceSchema = {
  id: 'svc_wagons_exp',
  slug: 'wagons_exp',
  title: 'Приобретение авиатранспорта и вагонов в лизинг — II Этап',
  titleKz: 'Авиакөлік және вагондарды лизингке алу — II Кезең',
  shortDescription:
    'Основная заявка на финансовый лизинг — II этап рассмотрения после получения положительного индикативного решения',
  organization: 'БРК Лизинг',
  category: 'Лизинг',
  stage: 2,
  linkedServiceId: 'svc_wagons_ind',
  duration: 'до 45 рабочих дней',
  result: 'Подписание договора финансового лизинга',
  conditions: [
    'Наличие положительного индикативного решения (I Этап)',
    'Выполнение условий, установленных по результатам I Этапа',
  ],
  eishEndpoint: '/api/eish/brk-leasing/stage2',
  eishMethod: 'POST',
  status: 'published',
  createdAt: '2024-01-15T00:00:00Z',
  updatedAt: '2024-06-01T00:00:00Z',
  documents: [
    { id: 'doc1', name: 'Документы по сделке купли-продажи', required: true, format: 'PDF' },
    { id: 'doc2', name: 'Договор с поставщиком', required: true, format: 'PDF' },
    { id: 'doc3', name: 'Документы по залоговому обеспечению', required: true, format: 'PDF' },
    { id: 'doc4', name: 'Заключение юридической экспертизы', required: false, format: 'PDF' },
  ],
  steps: [
    {
      id: 'step_prev_decision',
      title: 'Реквизиты индикативного решения',
      description: 'Введите номер заявки I Этапа, по которой получено положительное решение',
      fields: [
        {
          id: 'stage1_application_id',
          type: 'text',
          label: 'Номер заявки I Этапа',
          placeholder: 'BRK-XXXXXXXX',
          required: true,
          validation: [
            { type: 'required', message: 'Укажите номер заявки I Этапа' },
            { type: 'pattern', value: '^BRK-\\d{8}$', message: 'Формат: BRK-XXXXXXXX' },
          ],
          width: 'half',
        },
        {
          id: 'decision_date',
          type: 'date',
          label: 'Дата получения индикативного решения',
          required: true,
          width: 'half',
        },
      ],
    },
    {
      id: 'step_deal_params',
      title: 'Параметры сделки',
      fields: [
        {
          id: 'final_asset_cost',
          type: 'currency',
          label: 'Окончательная стоимость предмета лизинга (тенге)',
          required: true,
          width: 'half',
        },
        {
          id: 'final_advance_amount',
          type: 'currency',
          label: 'Сумма авансового платежа (тенге)',
          required: true,
          width: 'half',
        },
        {
          id: 'final_financing_amount',
          type: 'calculated',
          label: 'Сумма финансирования (тенге)',
          formula: 'final_asset_cost - final_advance_amount',
          disabled: true,
          width: 'half',
        },
        {
          id: 'supplier_name',
          type: 'text',
          label: 'Наименование поставщика',
          required: true,
          width: 'full',
        },
        {
          id: 'supplier_bin',
          type: 'iin_bin',
          label: 'БИН поставщика',
          required: true,
          mask: '############',
          width: 'half',
        },
        {
          id: 'collateral_type',
          type: 'select',
          label: 'Вид обеспечения',
          required: true,
          options: [
            { value: 'leasing_subject', label: 'Предмет лизинга' },
            { value: 'real_estate', label: 'Недвижимое имущество' },
            { value: 'guarantee', label: 'Поручительство' },
            { value: 'combined', label: 'Комбинированное' },
          ],
          width: 'half',
        },
      ],
    },
    {
      id: 'step_documents2',
      title: 'Документы II Этапа',
      fields: [
        {
          id: 'doc_deal',
          type: 'file_upload',
          label: 'Документы по сделке купли-продажи',
          required: true,
          acceptedFormats: ['.pdf'],
          maxFileSizeMb: 20,
          maxFiles: 5,
          width: 'full',
        },
        {
          id: 'doc_supplier_contract',
          type: 'file_upload',
          label: 'Договор с поставщиком (проект)',
          required: true,
          acceptedFormats: ['.pdf', '.docx'],
          maxFileSizeMb: 20,
          maxFiles: 1,
          width: 'full',
        },
        {
          id: 'doc_collateral',
          type: 'file_upload',
          label: 'Документы по залоговому обеспечению',
          required: true,
          acceptedFormats: ['.pdf'],
          maxFileSizeMb: 30,
          maxFiles: 10,
          width: 'full',
        },
      ],
    },
  ],
};
