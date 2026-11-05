'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { AppShell } from '@/components/layout/AppShell';
import {
  deleteExpenseTypeOption,
  getExpenseTypeOptions,
  saveExpenseTypeOption,
} from '@/lib/services/dataService';
import { ExpenseTypeOption } from '@/types';
import { Plus, Tag, Trash2 } from 'lucide-react';

const examples = [
  'Pesticide Purchase',
  'Weeding',
  'Fertilizer Purchase',
  'Labour Wages',
  'Irrigation',
  'Harvesting',
  'Seed Purchase',
  'Tractor Hire',
  'Land Preparation',
  'Transport Charges',
  'Electricity',
  'Equipment Repair',
];

export default function ExpenseTypesPage() {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const [types, setTypes] = useState<ExpenseTypeOption[]>([]);
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const load = () => {
    const uid = user?.uid || 'demo-farmer';
    setTypes(getExpenseTypeOptions(uid));
  };

  useEffect(load, [user]);

  const save = (event: React.FormEvent) => {
    event.preventDefault();
    const uid = user?.uid || 'demo-farmer';
    if (!name.trim()) {
      setError(language === 'ta' ? 'செலவு வகை பெயர் தேவை.' : 'Expense type name is required.');
      return;
    }

    saveExpenseTypeOption({ userId: uid, name: name.trim() });
    setName('');
    setError('');
    load();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('agri:data-updated'));
    }
  };

  return (
    <AppShell>
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('Add Expense Type')}</h1>
          <p className="page-subtitle">{t('Create a category for your farming expenses.')}</p>
        </div>
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        <section className="card">
          <div className="card-title" style={{ marginBottom: 20 }}>
            <Tag size={20} /> {t('Expense type details')}
          </div>

          <form onSubmit={save}>
            <div className="form-group">
              <label className="form-label">{t('Expense type name *')}</label>
              <input
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={language === 'ta' ? 'செலவு வகை பெயரை உள்ளிடவும்' : 'Enter expense type name'}
              />
            </div>

            <div
              style={{
                background: 'var(--primary-50)',
                border: '1.5px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: 16,
                marginBottom: 18,
              }}
            >
              <strong>{t('Quick examples')}</strong>
              <p
                style={{
                  color: 'var(--text-muted)',
                  fontSize: '.82rem',
                  margin: '4px 0 12px',
                }}
              >
                {t('Select an option to fill the name.')}
              </p>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  gap: 8,
                }}
              >
                {examples.map((example) => {
                  const label = language === 'ta' ? t(example) : example;
                  const isSelected = name === label;
                  return (
                    <button
                      key={example}
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setName(label);
                        setError('');
                      }}
                      style={{
                        justifyContent: 'flex-start',
                        whiteSpace: 'normal',
                        textAlign: 'left',
                        borderColor: isSelected ? 'var(--primary-600)' : undefined,
                        backgroundColor: isSelected ? '#e8f5ec' : undefined,
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {error && (
              <p className="form-error" style={{ marginBottom: 12 }}>
                {error}
              </p>
            )}

            <button className="btn btn-primary" type="submit">
              <Plus size={16} /> {t('Save Type')}
            </button>
          </form>
        </section>

        <section className="card" style={{ background: 'var(--primary-50)' }}>
          <div className="card-title" style={{ marginBottom: 16 }}>
            {t('Saved expense types')}
          </div>

          {types.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '.9rem' }}>
              {t('Saved types will appear in the New Entry expense dropdown.')}
            </p>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {types.map((type) => (
                <div
                  key={type.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 12,
                    padding: '12px 14px',
                    background: '#fff',
                    border: '1.5px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  <strong>{language === 'ta' ? t(type.name) : type.name}</strong>
                  <button
                    type="button"
                    className="btn-icon"
                    onClick={() => {
                      deleteExpenseTypeOption(type.id);
                      load();
                      if (typeof window !== 'undefined') {
                        window.dispatchEvent(new Event('agri:data-updated'));
                      }
                    }}
                    style={{ color: 'var(--loss-red)' }}
                    title={language === 'ta' ? 'செலவு வகையை நீக்கு' : 'Delete expense type'}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
