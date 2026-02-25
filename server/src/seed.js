import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import { nowIso } from './store.js';

export function seedIfEmpty(db) {
  if (db.users.length > 0) return;

  const pass = bcrypt.hashSync('demo1234', 10);

  // ─── 5 collab users ───────────────────────────────────────────────────────
  const collabUsers = [
    {
      id: nanoid(), email: 'collab1@collab.local', password_hash: pass,
      profile: {
        display_name: 'Анна Смирнова', brand_name: 'AnnStyle',
        region: 'Москва', about: 'Производим женскую одежду, ищем партнёра для совместной капсулы.',
        marketplaces: ['wildberries'], categories: ['одежда', 'мода'],
        biz_type: 'ИП', sales_monthly_rub: 450000,
        legal_name: 'ИП Смирнова А.В.', inn: '770111222333', phone: '+79991000001',
        contact_email: 'collab1@collab.local'
      }
    },
    {
      id: nanoid(), email: 'collab2@collab.local', password_hash: pass,
      profile: {
        display_name: 'Максим Орлов', brand_name: 'OrlovHome',
        region: 'Санкт-Петербург', about: 'Товары для дома и декор. Хотим запустить совместный набор с текстильщиками.',
        marketplaces: ['wildberries', 'ozon'], categories: ['дом', 'декор'],
        biz_type: 'ООО', sales_monthly_rub: 820000,
        legal_name: 'ООО "Орлов Хоум"', inn: '7812001002', phone: '+79991000002',
        contact_email: 'collab2@collab.local'
      }
    },
    {
      id: nanoid(), email: 'collab3@collab.local', password_hash: pass,
      profile: {
        display_name: 'Светлана Ким', brand_name: 'KBeauty',
        region: 'Новосибирск', about: 'К-бьюти косметика. Ищем коллаборацию с уходовыми брендами.',
        marketplaces: ['ozon'], categories: ['косметика', 'уход'],
        biz_type: 'ИП', sales_monthly_rub: 310000,
        legal_name: 'ИП Ким С.О.', inn: '540333444555', phone: '+79991000003',
        contact_email: 'collab3@collab.local'
      }
    },
    {
      id: nanoid(), email: 'collab4@collab.local', password_hash: pass,
      profile: {
        display_name: 'Дмитрий Волков', brand_name: 'SportPack',
        region: 'Екатеринбург', about: 'Спортивный инвентарь и аксессуары. Ищем партнёра для кросс-промо.',
        marketplaces: ['wildberries', 'ozon', 'yandex'], categories: ['спорт', 'фитнес'],
        biz_type: 'ООО', sales_monthly_rub: 1500000,
        legal_name: 'ООО "СпортПак"', inn: '6612345678', phone: '+79991000004',
        contact_email: 'collab4@collab.local'
      }
    },
    {
      id: nanoid(), email: 'collab5@collab.local', password_hash: pass,
      profile: {
        display_name: 'Екатерина Новак', brand_name: 'GreenFood',
        region: 'Краснодар', about: 'Органические продукты питания. Хотим запустить коллаб с эко-упаковщиками.',
        marketplaces: ['ozon', 'yandex'], categories: ['еда', 'эко'],
        biz_type: 'ИП', sales_monthly_rub: 670000,
        legal_name: 'ИП Новак Е.А.', inn: '231555666777', phone: '+79991000005',
        contact_email: 'collab5@collab.local'
      }
    }
  ];

  // ─── 5 service users ──────────────────────────────────────────────────────
  const serviceUsers = [
    {
      id: nanoid(), email: 'service1@collab.local', password_hash: pass,
      profile: {
        display_name: 'Игорь Петров', brand_name: 'LogiPro',
        region: 'Казань', about: 'Фулфилмент и логистика для WB и Ozon. Приёмка, хранение, упаковка, отгрузка.',
        marketplaces: ['wildberries', 'ozon'], categories: ['логистика', 'фулфилмент'],
        biz_type: 'ООО', sales_monthly_rub: 0,
        legal_name: 'ООО "ЛогиПро"', inn: '1655001002', phone: '+79992000001',
        contact_email: 'service1@collab.local'
      }
    },
    {
      id: nanoid(), email: 'service2@collab.local', password_hash: pass,
      profile: {
        display_name: 'Ольга Фролова', brand_name: 'DesignLab',
        region: 'Москва', about: 'Дизайн карточек товаров и инфографики для маркетплейсов. Быстро и недорого.',
        marketplaces: ['wildberries', 'ozon', 'yandex'], categories: ['дизайн', 'маркетинг'],
        biz_type: 'Самозанятый', sales_monthly_rub: 0,
        legal_name: 'Фролова О.М.', inn: '770888999000', phone: '+79992000002',
        contact_email: 'service2@collab.local'
      }
    },
    {
      id: nanoid(), email: 'service3@collab.local', password_hash: pass,
      profile: {
        display_name: 'Алексей Зайцев', brand_name: 'PhotoShot',
        region: 'Санкт-Петербург', about: 'Профессиональная фотосъёмка товаров. Студия в СПб, выезд по всей России.',
        marketplaces: ['wildberries', 'ozon'], categories: ['фото', 'контент'],
        biz_type: 'Самозанятый', sales_monthly_rub: 0,
        legal_name: 'Зайцев А.П.', inn: '781222333444', phone: '+79992000003',
        contact_email: 'service3@collab.local'
      }
    },
    {
      id: nanoid(), email: 'service4@collab.local', password_hash: pass,
      profile: {
        display_name: 'Марина Соколова', brand_name: 'AdBoost',
        region: 'Москва', about: 'Настройка рекламы на WB и Ozon. Аудит, стратегия, ведение кампаний.',
        marketplaces: ['wildberries', 'ozon'], categories: ['реклама', 'маркетинг'],
        biz_type: 'ИП', sales_monthly_rub: 0,
        legal_name: 'ИП Соколова М.Д.', inn: '770444555666', phone: '+79992000004',
        contact_email: 'service4@collab.local'
      }
    },
    {
      id: nanoid(), email: 'service5@collab.local', password_hash: pass,
      profile: {
        display_name: 'Никита Рябов', brand_name: 'PackPrint',
        region: 'Ростов-на-Дону', about: 'Производство упаковки и полиграфии. Малые тиражи от 100 шт.',
        marketplaces: ['wildberries', 'ozon', 'yandex'], categories: ['упаковка', 'полиграфия'],
        biz_type: 'ООО', sales_monthly_rub: 0,
        legal_name: 'ООО "ПакПринт"', inn: '614777888999', phone: '+79992000005',
        contact_email: 'service5@collab.local'
      }
    }
  ];

  // ─── 5 supplier users ─────────────────────────────────────────────────────
  const supplierUsers = [
    {
      id: nanoid(), email: 'supplier1@collab.local', password_hash: pass,
      profile: {
        display_name: 'Тимур Ахметов', brand_name: 'TextilOpt',
        region: 'Иваново', about: 'Оптовые поставки текстиля: ткани, постельное бельё, полотенца. Производство РФ.',
        marketplaces: ['wildberries', 'ozon'], categories: ['текстиль', 'дом'],
        biz_type: 'ООО', sales_monthly_rub: 2400000,
        legal_name: 'ООО "ТекстильОпт"', inn: '3702010203', phone: '+79993000001',
        contact_email: 'supplier1@collab.local'
      }
    },
    {
      id: nanoid(), email: 'supplier2@collab.local', password_hash: pass,
      profile: {
        display_name: 'Лариса Мухина', brand_name: 'ChinaGoods',
        region: 'Владивосток', about: 'Закупка и доставка товаров из Китая. Работаем с Alibaba, 1688. Растаможка под ключ.',
        marketplaces: ['wildberries', 'ozon', 'yandex'], categories: ['импорт', 'электроника', 'дом'],
        biz_type: 'ООО', sales_monthly_rub: 5800000,
        legal_name: 'ООО "Чайна Гудс"', inn: '2502030405', phone: '+79993000002',
        contact_email: 'supplier2@collab.local'
      }
    },
    {
      id: nanoid(), email: 'supplier3@collab.local', password_hash: pass,
      profile: {
        display_name: 'Вадим Степанов', brand_name: 'PlastOpt',
        region: 'Уфа', about: 'Поставки пластиковых изделий для дома и офиса. Собственное производство.',
        marketplaces: ['wildberries'], categories: ['пластик', 'дом', 'офис'],
        biz_type: 'ИП', sales_monthly_rub: 1100000,
        legal_name: 'ИП Степанов В.Р.', inn: '0274050607', phone: '+79993000003',
        contact_email: 'supplier3@collab.local'
      }
    },
    {
      id: nanoid(), email: 'supplier4@collab.local', password_hash: pass,
      profile: {
        display_name: 'Наталья Громова', brand_name: 'CosmRaw',
        region: 'Москва', about: 'Сырьё и ингредиенты для косметических производств. Сертифицированные поставки.',
        marketplaces: ['ozon'], categories: ['косметика', 'сырьё'],
        biz_type: 'ООО', sales_monthly_rub: 3200000,
        legal_name: 'ООО "КосмРо"', inn: '7701234567', phone: '+79993000004',
        contact_email: 'supplier4@collab.local'
      }
    },
    {
      id: nanoid(), email: 'supplier5@collab.local', password_hash: pass,
      profile: {
        display_name: 'Роман Сидоров', brand_name: 'FoodBase',
        region: 'Воронеж', about: 'Оптовые поставки продуктов питания и специй. Работаем с фермерами ЦФО.',
        marketplaces: ['ozon', 'yandex'], categories: ['еда', 'продукты'],
        biz_type: 'ООО', sales_monthly_rub: 4100000,
        legal_name: 'ООО "ФудБейс"', inn: '3601234568', phone: '+79993000005',
        contact_email: 'supplier5@collab.local'
      }
    }
  ];

  const allUsers = [...collabUsers, ...serviceUsers, ...supplierUsers];

  // Push users
  db.users.push(...allUsers.map(u => ({
    id: u.id,
    email: u.email,
    password_hash: u.password_hash,
    created_at: nowIso()
  })));

  // Push profiles
  db.profiles.push(...allUsers.map(u => ({
    user_id: u.id,
    ...u.profile,
    trust_missing: [],
    updated_at: nowIso(),
    logo_path: null
  })));

  // ─── Listings ─────────────────────────────────────────────────────────────

  // 5 collab listings
  db.listings.push(
    {
      id: nanoid(), owner_user_id: collabUsers[0].id, kind: 'collab', published: true,
      title: 'Коллаборация: капсула одежды + аксессуары',
      description: 'Ищем партнёра с аксессуарами или упаковкой для совместной капсульной коллекции. WB приоритет.',
      region: 'Москва', marketplaces: ['wildberries'], categories: ['одежда', 'аксессуары'],
      tags: ['коллаборация', 'капсула'], created_at: nowIso()
    },
    {
      id: nanoid(), owner_user_id: collabUsers[1].id, kind: 'collab', published: true,
      title: 'Совместный набор для дома',
      description: 'Органайзеры + текстиль + подарочная упаковка. Ищем текстильного партнёра.',
      region: 'Санкт-Петербург', marketplaces: ['wildberries', 'ozon'], categories: ['дом', 'декор'],
      tags: ['набор', 'дом'], created_at: nowIso()
    },
    {
      id: nanoid(), owner_user_id: collabUsers[2].id, kind: 'collab', published: true,
      title: 'К-бьюти + уходовая косметика: совместный дроп',
      description: 'Хотим запустить совместный дроп с уходовым брендом. Сильная аудитория в Ozon.',
      region: 'Новосибирск', marketplaces: ['ozon'], categories: ['косметика', 'уход'],
      tags: ['бьюти', 'коллаборация'], created_at: nowIso()
    },
    {
      id: nanoid(), owner_user_id: collabUsers[3].id, kind: 'collab', published: true,
      title: 'Кросс-промо: спорт + спортивное питание',
      description: 'Ищем партнёра из сферы спортивного питания или одежды для совместных активностей.',
      region: 'Екатеринбург', marketplaces: ['wildberries', 'ozon'], categories: ['спорт', 'фитнес'],
      tags: ['кросс-промо', 'спорт'], created_at: nowIso()
    },
    {
      id: nanoid(), owner_user_id: collabUsers[4].id, kind: 'collab', published: true,
      title: 'Эко-продукты + эко-упаковка: партнёрство',
      description: 'Производим органические продукты, нужен партнёр с экологичной упаковкой для совместного запуска.',
      region: 'Краснодар', marketplaces: ['ozon', 'yandex'], categories: ['еда', 'эко'],
      tags: ['эко', 'органик'], created_at: nowIso()
    }
  );

  // 5 service listings
  db.listings.push(
    {
      id: nanoid(), owner_user_id: serviceUsers[0].id, kind: 'service', published: true,
      title: 'Фулфилмент и логистика для WB и Ozon',
      description: 'Приёмка, хранение, упаковка, отгрузка на склады маркетплейсов. Договор, отчётность, личный менеджер.',
      region: 'Казань', marketplaces: ['wildberries', 'ozon'], categories: ['логистика'],
      tags: ['фулфилмент', 'услуги'], created_at: nowIso()
    },
    {
      id: nanoid(), owner_user_id: serviceUsers[1].id, kind: 'service', published: true,
      title: 'Дизайн карточек и инфографика для маркетплейсов',
      description: 'Создаём продающие карточки товаров: инфографика, рич-контент, обложки. Опыт 3+ года.',
      region: 'Москва', marketplaces: ['wildberries', 'ozon', 'yandex'], categories: ['дизайн'],
      tags: ['дизайн', 'инфографика'], created_at: nowIso()
    },
    {
      id: nanoid(), owner_user_id: serviceUsers[2].id, kind: 'service', published: true,
      title: 'Профессиональная фотосъёмка товаров',
      description: 'Студийная и выездная съёмка. Ретушь, обтравка, пакет карточек под WB/Ozon под ключ.',
      region: 'Санкт-Петербург', marketplaces: ['wildberries', 'ozon'], categories: ['фото'],
      tags: ['фото', 'съёмка'], created_at: nowIso()
    },
    {
      id: nanoid(), owner_user_id: serviceUsers[3].id, kind: 'service', published: true,
      title: 'Настройка и ведение рекламы на WB и Ozon',
      description: 'Аудит кампаний, стратегия, автоставки, аналитика. Прозрачная отчётность еженедельно.',
      region: 'Москва', marketplaces: ['wildberries', 'ozon'], categories: ['реклама'],
      tags: ['реклама', 'продвижение'], created_at: nowIso()
    },
    {
      id: nanoid(), owner_user_id: serviceUsers[4].id, kind: 'service', published: true,
      title: 'Упаковка и полиграфия малыми тиражами',
      description: 'Коробки, пакеты, стикеры, вкладыши. Тиражи от 100 шт. Доставка по РФ.',
      region: 'Ростов-на-Дону', marketplaces: ['wildberries', 'ozon'], categories: ['упаковка'],
      tags: ['упаковка', 'полиграфия'], created_at: nowIso()
    }
  );

  // 5 supplier listings
  db.listings.push(
    {
      id: nanoid(), owner_user_id: supplierUsers[0].id, kind: 'supplier', published: true,
      title: 'Оптовые поставки текстиля — производство РФ',
      description: 'Постельное бельё, полотенца, кухонный текстиль. Сертификаты, собственное производство в Иваново.',
      region: 'Иваново', marketplaces: ['wildberries', 'ozon'], categories: ['текстиль'],
      tags: ['поставщик', 'текстиль'], created_at: nowIso()
    },
    {
      id: nanoid(), owner_user_id: supplierUsers[1].id, kind: 'supplier', published: true,
      title: 'Закупка и доставка из Китая под ключ',
      description: 'Поиск поставщиков на Alibaba/1688, проверка, растаможка, доставка на склад WB/Ozon.',
      region: 'Владивосток', marketplaces: ['wildberries', 'ozon', 'yandex'], categories: ['импорт'],
      tags: ['Китай', 'поставщик'], created_at: nowIso()
    },
    {
      id: nanoid(), owner_user_id: supplierUsers[2].id, kind: 'supplier', published: true,
      title: 'Пластиковые изделия для дома — собственное производство',
      description: 'Органайзеры, контейнеры, подставки. OEM/ODM. Тираж от 500 шт.',
      region: 'Уфа', marketplaces: ['wildberries'], categories: ['пластик', 'дом'],
      tags: ['поставщик', 'производство'], created_at: nowIso()
    },
    {
      id: nanoid(), owner_user_id: supplierUsers[3].id, kind: 'supplier', published: true,
      title: 'Сертифицированное сырьё для косметики',
      description: 'Масла, экстракты, эмульгаторы. Вся документация. Работаем с малыми косметическими производствами.',
      region: 'Москва', marketplaces: ['ozon'], categories: ['косметика', 'сырьё'],
      tags: ['сырьё', 'косметика'], created_at: nowIso()
    },
    {
      id: nanoid(), owner_user_id: supplierUsers[4].id, kind: 'supplier', published: true,
      title: 'Оптовые поставки продуктов и специй от фермеров ЦФО',
      description: 'Крупы, специи, сухофрукты, мёд. Прямые контракты с фермерами. Сертификаты качества.',
      region: 'Воронеж', marketplaces: ['ozon', 'yandex'], categories: ['еда', 'продукты'],
      tags: ['поставщик', 'фермерское'], created_at: nowIso()
    }
  );
}
