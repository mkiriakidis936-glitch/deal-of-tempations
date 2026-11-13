import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

export default function CustomFormQuestions({ formType, value = {}, onChange, className = '' }) {
  const [questions, setQuestions] = useState([]);
  useEffect(() => {
    let active = true;
    base44.entities.AppSetting.filter({ key: 'admin_form_questions' }, { limit: 1 }).then(({ items }) => {
      if (active) setQuestions(items?.[0]?.value?.forms?.[formType] || []);
    }).catch(() => {});
    return () => { active = false; };
  }, [formType]);

  if (!questions.length) return null;
  const setAnswer = (id, answer) => onChange({ ...value, [id]: answer });
  return <div className={className}>
    {questions.map((question) => <div key={question.id} className="space-y-2">
      {question.image && <img src={question.image} alt="" loading="lazy" className="max-h-40 w-full rounded-lg object-cover" />}
      <label className="block text-sm font-bold">{question.label}{question.required ? ' *' : ''}
        {question.type === 'textarea' ? <textarea rows={3} required={question.required} className="mt-1 w-full rounded-lg border border-current/20 bg-black/30 p-2" value={value[question.id] || ''} onChange={(e) => setAnswer(question.id, e.target.value)} /> :
        question.type === 'select' ? <select required={question.required} className="mt-1 w-full rounded-lg border border-current/20 bg-black/30 p-2" value={value[question.id] || ''} onChange={(e) => setAnswer(question.id, e.target.value)}><option value="">Επίλεξε…</option>{(question.options || []).map((option) => <option key={option} value={option}>{option}</option>)}</select> :
        <input required={question.required} className="mt-1 w-full rounded-lg border border-current/20 bg-black/30 p-2" value={value[question.id] || ''} onChange={(e) => setAnswer(question.id, e.target.value)} />}
      </label>
    </div>)}
  </div>;
}
