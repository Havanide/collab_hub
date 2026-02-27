import React, { useEffect, useMemo, useState } from 'react';
import { api, Listing, Project } from '../api';

interface Props {
  listing: Listing;
  onDone: () => void;
  onError: (m: string) => void;
}

export default function ProposeProjectForm({ listing, onDone, onError }: Props) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'existing' | 'new'>('existing');
  const [projectId, setProjectId] = useState<string>('');
  const [pitch, setPitch] = useState('');

  // new project fields
  const [title, setTitle] = useState('');
  const [idea, setIdea] = useState('');
  const [goals, setGoals] = useState('');
  const [investments, setInvestments] = useState('');
  const [responsibilities, setResponsibilities] = useState('');

  const atLimit = useMemo(() => projects.length >= 3, [projects.length]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api.listProjects()
      .then(p => { if (mounted) { setProjects(p); setProjectId(p[0]?.id || ''); } })
      .catch(() => onError('Не удалось загрузить проекты'))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  async function submit() {
    try {
      if (mode === 'existing') {
        if (!projectId) return onError('Выбери проект.');
        await api.sendMatchRequest({ listing_id: listing.id, project_id: projectId, pitch });
      } else {
        if (atLimit) return onError('Лимит проектов (3) достигнут.');
        if (!title.trim() || !idea.trim()) return onError('Нужны название и идея проекта.');
        await api.sendMatchRequest({
          listing_id: listing.id,
          pitch,
          project_create: {
            title: title.trim(),
            idea: idea.trim(),
            goals: goals.trim() || null,
            investments: investments.trim() || null,
            responsibilities: responsibilities.trim() || null,
          },
        });
      }
      onDone();
    } catch (e: any) {
      onError(`Ошибка: ${e.message}`);
    }
  }

  return (
    <div>
      <div className="small" style={{ marginBottom: 10 }}>
        Заявку нельзя отправить "в одну кнопку": она должна содержать конкретный проект (как и договорились).
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
        <button type="button" className={mode === 'existing' ? 'chip active' : 'chip'} onClick={() => setMode('existing')}>
          Предложить существующий
        </button>
        <button type="button" className={mode === 'new' ? 'chip active' : 'chip'} onClick={() => setMode('new')} disabled={atLimit}>
          Создать новый
        </button>
        {atLimit ? <span className="badge">Лимит проектов: 3</span> : null}
      </div>

      {loading ? <div className="small">Загрузка проектов…</div> : null}

      {mode === 'existing' ? (
        <div className="formRow">
          <label className="label">Выберите проект</label>
          <select className="input" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            {projects.length === 0 ? <option value="">— нет проектов —</option> : null}
            {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
        </div>
      ) : (
        <div className="formRow">
          <label className="label">Название проекта</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Напр. Совместный набор" />

          <label className="label">Идея (что делаем)</label>
          <textarea className="input" rows={3} value={idea} onChange={(e) => setIdea(e.target.value)} placeholder="Коротко: продукт/услуга, формат коллаборации" />

          <label className="label">Цели</label>
          <input className="input" value={goals} onChange={(e) => setGoals(e.target.value)} placeholder="Опционально" />

          <label className="label">Вложения</label>
          <input className="input" value={investments} onChange={(e) => setInvestments(e.target.value)} placeholder="Опционально" />

          <label className="label">Ответственности сторон</label>
          <textarea className="input" rows={3} value={responsibilities} onChange={(e) => setResponsibilities(e.target.value)} placeholder="Кто что делает" />
        </div>
      )}

      <div className="formRow" style={{ marginTop: 10 }}>
        <label className="label">Сообщение (опционально)</label>
        <textarea
          className="input"
          rows={4}
          value={pitch}
          onChange={(e) => setPitch(e.target.value)}
          placeholder="Почему это релевантно и чего вы хотите от партнёра"
        />
      </div>

      <div className="cardActions" style={{ marginTop: 12 }}>
        <button className="btn btn-primary" onClick={submit}>
          Отправить заявку
        </button>
      </div>
    </div>
  );
}
