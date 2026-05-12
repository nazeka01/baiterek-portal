// ============================================================
// MOCK API — имитация ЕИШ и eGov IDP
// ============================================================

export interface EgovCompanyData {
  bin: string;
  nameRu: string;
  nameKz: string;
  registrationDate: string;
  oked: string;       // вид деятельности
  okedName: string;
  region: string;
  address: string;
  director: string;
  status: 'active' | 'inactive';
}

export interface EgovPersonData {
  iin: string;
  fullName: string;
  birthDate: string;
  address: string;
  documentNumber: string;
}

// Имитация запроса к eGov по БИН
export const mockEgovGetCompany = async (bin: string): Promise<EgovCompanyData | null> => {
  await delay(800); // реалистичная задержка
  const companies: Record<string, EgovCompanyData> = {
    '123456789012': {
      bin: '123456789012',
      nameRu: 'ТОО "АвиаТранс Казахстан"',
      nameKz: '"AviaTrans Kazakhstan" ЖШС',
      registrationDate: '2015-03-15',
      oked: '51.10',
      okedName: 'Деятельность воздушного транспорта',
      region: 'Алматы',
      address: 'г. Алматы, ул. Жандосова, 55',
      director: 'Сейткали Ержан Бекович',
      status: 'active',
    },
    '987654321098': {
      bin: '987654321098',
      nameRu: 'АО "ГрузовагонСервис"',
      nameKz: '"GruzovagonService" АҚ',
      registrationDate: '2010-07-22',
      oked: '49.20',
      okedName: 'Деятельность грузового железнодорожного транспорта',
      region: 'Астана',
      address: 'г. Астана, пр. Мангилик Ел, 55/17',
      director: 'Ахметов Дамир Нурланович',
      status: 'active',
    },
  };
  // Если БИН не найден — возвращаем демо-данные
  if (companies[bin]) return companies[bin];
  if (bin.length === 12) {
    return {
      bin,
      nameRu: 'ТОО "Демо Компания"',
      nameKz: '"Demo Company" ЖШС',
      registrationDate: '2020-01-01',
      oked: '68.20',
      okedName: 'Аренда и управление недвижимостью',
      region: 'Алматы',
      address: 'г. Алматы, ул. Абая, 1',
      director: 'Иванов Иван Иванович',
      status: 'active',
    };
  }
  return null;
};

// Имитация запроса к eGov по ИИН
export const mockEgovGetPerson = async (iin: string): Promise<EgovPersonData | null> => {
  await delay(600);
  if (iin.length === 12) {
    return {
      iin,
      fullName: 'Сериков Алмас Бекович',
      birthDate: '1985-06-12',
      address: 'г. Астана, ул. Бейбитшилик, 25, кв. 14',
      documentNumber: 'AB1234567',
    };
  }
  return null;
};

// Имитация отправки заявки в ЕИШ (BPM-систему организации)
export const mockEishSubmitApplication = async (
  endpoint: string,
  data: Record<string, unknown>
): Promise<{ success: boolean; applicationId: string; message: string }> => {
  await delay(1200);
  console.log('[MOCK ЕИШ] Отправка заявки на endpoint:', endpoint, data);
  return {
    success: true,
    applicationId: `BRK-${Date.now().toString().slice(-8)}`,
    message: 'Заявка успешно зарегистрирована в системе БРК Лизинг',
  };
};

// Имитация получения статуса заявки из ЕИШ
export const mockEishGetStatus = async (
  applicationId: string
): Promise<{ status: string; message: string; updatedAt: string }> => {
  await delay(400);
  const statuses = ['in_review', 'in_review', 'in_review', 'additional_docs_required', 'approved'];
  const rand = statuses[Math.floor(Math.random() * statuses.length)];
  return {
    status: rand,
    message: 'Заявка находится на рассмотрении в БРК Лизинг',
    updatedAt: new Date().toISOString(),
  };
};

// Имитация авторизации через eGov IDP
export const mockEgovAuth = async (
  iin: string,
  password: string
): Promise<{ success: boolean; token: string; user: Record<string, unknown> }> => {
  await delay(700);
  if (password.length < 3) {
    return { success: false, token: '', user: {} };
  }
  const person = await mockEgovGetPerson(iin);
  return {
    success: true,
    token: `egov_token_${Date.now()}`,
    user: {
      iin,
      fullName: person?.fullName || 'Тестовый Пользователь',
      role: 'individual',
    },
  };
};

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
