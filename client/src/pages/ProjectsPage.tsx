import React, { useEffect, useState } from 'react';
import TopNav from '../components/TopNav';
import Footer from '../components/Footer';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import { api, Project } from '../api';

export default function ProjectsPage() {
  const [items, setItems] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const p = await api.listProjects();
      setItems(p);
    } catch (e: any) {
      setToast(e.message || 'Ошибка');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const atLimit = items.length >= 3;

  return (
    <>
      <TopNav />
      <div className="container page">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <h1 className="sectionTitle">Мои проекты</h1>
          <button className="btn btn-primary" disabled={atLimit} onClick={() => { setEditing(null); setOpen(true); }}>
            + Новый проект
          </button>
        </div>
        <div className="small">В MVP можно создать до 3 проектов. Проект прикладывается к заявке на match.</div>

        <hr className="hr" />

        {loading ? (
          <div>Загрузка…</div>
        ) : items.length === 0 ? (
          <div className="card cardPad">Проектов нет. Создай первый — он понадобится для заявки.</div>
        ) : (
          <div className="list">
            {items.map(p => (
              <div className="card cardPad" key={p.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <div>
                    <div className="cardTitle">{p.title}</div>
                    <div className="small" style={{ whiteSpace: 'pre-wrap' }}>{p.idea}</div>
                    {p.goals ? <div className="small"><b>Цели:</b> {p.goals}</div> : null}
                    {p.investments ? <div className="small"><b>Вложения:</b> {p.investments}</div> : null}
                    {p.responsibilities ? <div className="small"><b>Ответственности:</b> {p.responsibilities}</div> : null}
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn" onClick={() => { setEditing(p); setOpen(true); }}>Редактировать</button>
                    <button
                      className="btn btn-ghost"
                      onClick={async () => {
                        if (!confirm('Удалить проект?')) return;
                        try {
                          await api.deleteProject(p.id);
                          setToast('Удалено');
                          await load();
                        } catch (e: any) {
                          setToast(e.message || 'Ошибка');
                        }
                      }}
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={open} title={editing ? 'Редактировать проект' : 'Новый проект'} onClose={() => setOpen(false)}>
        <ProjectForm
          initial={editing}
          onDone={async () => {
            setOpen(false);
            await load();
            setToast('Сохранено');
          }}
          onError={(m) => setToast(m)}
        />
      </Modal>

      <Toast message={toast} onClose={() => setToast(null)} />
      <Footer />
    </>
  );
}

function ProjectForm({
  initial,
  onDone,
  onError
}: {
  initial: Project | null;
  onDone: () => void;
  onError: (m: string) => void;
}) {
  const [title, setTitle] = useState(initial?.title || '');
  const [idea, setIdea] = useState(initial?.idea || '');
  const [goals, setGoals] = useState(initial?.goals || '');
  const [investments, setInvestments] = useState(initial?.investments || '');
  const [responsibilities, setResponsibilities] = useState(initial?.responsibilities || '');
  const [busy, setBusy] = useState(false);

  async function save() {
    try {
      setBusy(true);
      if (!title.trim() || !idea.trim()) return onError('Нужны название и идея.');
      if (initial) {
        await api.updateProject(initial.id, {
          title: title.trim(),
          idea: idea.trim(),
          goals: goals.trim() || null,
          investments: investments.trim() || null,
          responsibilities: responsibilities.trim() || null
        });
      } else {
        await api.createProject({
          title: title.trim(),
          idea: idea.trim(),
          goals: goals.trim() || null,
          investments: investments.trim() || null,
          responsibilities: responsibilities.trim() || null
        });
      }
      onDone();
    } catch (e: any) {
      onError(e.message || 'Ошибка');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="formRow">
      <label className="label">Название</label>
      <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />

      <label className="label">Идея</label>
      <textarea className="input" rows={4} value={idea} onChange={(e) => setIdea(e.target.value)} />

      <label className="label">Цели</label>
      <input className="input" value={goals} onChange={(e) => setGoals(e.target.value)} placeholder="Опционально" />

      <label className="label">Вложения</label>
      <input className="input" value={investments} onChange={(e) => setInvestments(e.target.value)} placeholder="Опционально" />

      <label className="label">Ответственности сторон</label>
      <textarea className="input" rows={3} value={responsibilities} onChange={(e) => setResponsibilities(e.target.value)} placeholder="Опционально" />

      <div className="cardActions">
        <button className="btn btn-primary" onClick={save} disabled={busy}>
          {busy ? 'Сохраняю…' : 'Сохранить'}
        </button>
      </div>
    </div>
  );
}
