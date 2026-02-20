import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import { nowIso } from './store.js';

export function seedIfEmpty(db) {
  if (db.users.length > 0) return;

  const pass = bcrypt.hashSync('demo1234', 10);
  const demoUsers = [
    { id: nanoid(), email: 'demo1@collab.local', password_hash: pass },
    { id: nanoid(), email: 'demo2@collab.local', password_hash: pass },
    { id: nanoid(), email: 'demo3@collab.local', password_hash: pass }
  ];

  db.users.push(...demoUsers.map(u => ({ ...u, created_at: nowIso() })));

  db.profiles.push(
    {
      user_id: demoUsers[0].id,
      display_name: 'Demo Seller 1',
      brand_name: 'Brand One',
      region: 'Москва',
      about: 'Продаём товары для дома. Ищем коллаборации.',
      marketplaces: ['wildberries'],
      categories: ['дом'],
      biz_type: 'ИП',
      sales_monthly_rub: 350000,
      // private
      legal_name: 'ИП Иванов И.И.',
      inn: '770123456789',
      phone: '+79990000001',
      contact_email: 'demo1@collab.local',
      updated_at: nowIso(),
      logo_path: null
    },
    {
      user_id: demoUsers[1].id,
      display_name: 'Demo Seller 2',
      brand_name: 'Brand Two',
      region: 'Санкт‑Петербург',
      about: 'Делаем одежду, нужен дизайнер и продвижение.',
      marketplaces: ['wildberries', 'ozon'],
      categories: ['одежда'],
      biz_type: 'ООО',
      sales_monthly_rub: 1200000,
      legal_name: 'ООО "Бренд Ту"',
      inn: '7812345678',
      phone: '+79990000002',
      contact_email: 'demo2@collab.local',
      updated_at: nowIso(),
      logo_path: null
    },
    {
      user_id: demoUsers[2].id,
      display_name: 'Demo Seller 3',
      brand_name: 'LogiPro',
      region: 'Казань',
      about: 'Оказываем услуги фулфилмента.',
      marketplaces: ['wildberries'],
      categories: ['логистика'],
      biz_type: 'ИП',
      sales_monthly_rub: 0,
      legal_name: 'ИП Петров П.П.',
      inn: '165012345678',
      phone: '+79990000003',
      contact_email: 'demo3@collab.local',
      updated_at: nowIso(),
      logo_path: null
    }
  );

  const listing1 = {
    id: nanoid(),
    owner_user_id: demoUsers[1].id,
    kind: 'collab',
    title: 'Коллаборация: капсула одежды + аксессуары',
    description: 'Ищем партнёра с аксессуарами/упаковкой для совместного продукта.',
    region: 'Санкт‑Петербург',
    marketplaces: ['wildberries'],
    categories: ['одежда', 'аксессуары'],
    tags: ['коллаборация'],
    created_at: nowIso()
  };

  const listing2 = {
    id: nanoid(),
    owner_user_id: demoUsers[2].id,
    kind: 'service',
    title: 'Фулфилмент и логистика для WB',
    description: 'Приёмка, хранение, упаковка, отгрузка. Договор, отчётность.',
    region: 'Казань',
    marketplaces: ['wildberries'],
    categories: ['логистика'],
    tags: ['услуги'],
    created_at: nowIso()
  };

  db.listings.push(listing1, listing2);

  const project = {
    id: nanoid(),
    owner_user_id: demoUsers[0].id,
    title: 'Совместный набор для дома',
    idea: 'Собрать комплект: органайзеры + текстиль + подарочная упаковка.',
    goals: 'Увеличить средний чек и охват на WB.',
    investments: 'до 200k',
    responsibilities: 'Мы: производство органайзеров. Партнёр: текстиль/упаковка.',
    created_at: nowIso(),
    updated_at: nowIso()
  };

  db.projects.push(project);

  // demo pending request: demo1 -> listing1 (demo2)
  db.match_requests.push({
    id: nanoid(),
    from_user_id: demoUsers[0].id,
    to_user_id: demoUsers[1].id,
    listing_id: listing1.id,
    project_id: project.id,
    pitch: 'Есть производство органайзеров, можем собрать совместную капсулу.',
    status: 'pending',
    created_at: nowIso(),
    updated_at: nowIso()
  });
}
