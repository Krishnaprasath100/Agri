'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { AppShell } from '@/components/layout/AppShell';
import { ChoicePicker } from '@/components/forms/ChoicePicker';
import { DateField } from '@/components/forms/DateField';
import {
  getCropCycles,
  getExpenseTypeOptions,
  getLedgerAccounts,
  getLedgerContacts,
  getQuickCropChoices,
  saveExpense,
  saveExpenseTypeOption,
  saveIncome,
  saveQuickCropChoice,
  saveLedgerContact,
  saveLedgerAccount,
} from '@/lib/services/dataService';
import {
  CropCycle,
  ExpenseTypeOption,
  LedgerAccount,
  LedgerContact,
} from '@/types';
import {
  formatIndianCurrencyInput,
} from '@/lib/utils';
import { ArrowDownCircle, ArrowUpCircle, Save } from 'lucide-react';

const defaultExpenseTypes = [
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
  'Other',
];

const defaultQuickCrops = [
  'Paddy (Rice)',
  'Wheat',
  'Maize',
  'Cotton',
  'Sugarcane',
  'Banana',
  'Tomato',
  'Onion',
  'Potato',
  'Chilli',
  'Groundnut',
  'Soybean',
  'Millet',
  'Turmeric',
  'Coconut',
];

const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function EntryPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [kind, setKind] = useState<'expense' | 'income'>('expense');
  const [crops, setCrops] = useState<CropCycle[]>([]);
  const [payees, setPayees] = useState<LedgerContact[]>([]);
  const [persons, setPersons] = useState<LedgerContact[]>([]);
  const [accounts, setAccounts] = useState<LedgerAccount[]>([]);
  const [types, setTypes] = useState<ExpenseTypeOption[]>([]);
  const [savedQuickCrops, setSavedQuickCrops] = useState<string[]>([]);

  const [form, setForm] = useState({
    date: getTodayDate(),
    crop: '',
    counterparty: '',
    account: '',
    expenseType: '',
    amount: '',
    notes: '',
  });
  const [displayAmount, setDisplayAmount] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;

    getCropCycles(user.uid).then(setCrops);
    setPayees(getLedgerContacts(user.uid, 'payee'));
    setPersons(getLedgerContacts(user.uid, 'person'));

    const accountList = getLedgerAccounts(user.uid);
    setAccounts(accountList);
    setTypes(getExpenseTypeOptions(user.uid));
    setSavedQuickCrops(getQuickCropChoices(user.uid));
  }, [user]);

  const selectedPlanting = crops.find((crop) => crop.cropCycleId === form.crop);
  const cropName =
    selectedPlanting?.cropType ||
    (form.crop.startsWith('quick:') ? form.crop.slice(6) : form.crop);
  const contacts = kind === 'expense' ? payees : persons;

  const allTypes = [
    ...defaultExpenseTypes,
    ...types.map((type) => type.name),
  ].filter((value, index, list) => list.indexOf(value) === index);

  const allQuickCrops = [...defaultQuickCrops, ...savedQuickCrops].filter(
    (crop, index, list) =>
      list.findIndex((item) => item.toLowerCase() === crop.toLowerCase()) === index
  );

  // Unified inline creation inside the choose boxes
  const handleCreateCrop = (name: string) => {
    if (!user || !name.trim()) return;
    const cleanName = name.trim().replace(/\s+/g, ' ');
    const updated = saveQuickCropChoice(user.uid, cleanName);
    setSavedQuickCrops(updated);
    setForm((prev) => ({ ...prev, crop: `quick:${cleanName}` }));
    setError('');
  };

  const handleCreateExpenseType = (name: string) => {
    if (!user || !name.trim()) return;
    const cleanName = name.trim().replace(/\s+/g, ' ');
    const saved = saveExpenseTypeOption({ userId: user.uid, name: cleanName });
    setTypes((current) =>
      current.some((type) => type.name.toLowerCase() === saved.name.toLowerCase())
        ? current
        : [...current, saved]
    );
    setForm((prev) => ({ ...prev, expenseType: cleanName }));
    setError('');
  };

  const handleCreatePayee = (name: string) => {
    if (!user || !name.trim()) return;
    const cleanName = name.trim().replace(/\s+/g, ' ');
    const kindType = kind === 'expense' ? 'payee' : 'person';
    const saved = saveLedgerContact({ userId: user.uid, name: cleanName, kind: kindType });
    if (kind === 'expense') {
      setPayees((prev) => [...prev, saved]);
    } else {
      setPersons((prev) => [...prev, saved]);
    }
    setForm((prev) => ({ ...prev, counterparty: cleanName }));
    setError('');
  };

  const handleCreateAccount = (displayName: string) => {
    if (!user || !displayName.trim()) return;
    const cleanName = displayName.trim().replace(/\s+/g, ' ');
    const saved = saveLedgerAccount({ userId: user.uid, displayName: cleanName, accountType: 'Savings', isDefault: false });
    setAccounts((prev) => [...prev, saved]);
    setForm((prev) => ({ ...prev, account: cleanName }));
    setError('');
  };

  // Live comma formatting for amount
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // Allow digits and only one decimal point
    const cleaned = raw.replace(/[^0-9.]/g, '');
    const dotIndex = cleaned.indexOf('.');
    const sanitized =
      dotIndex !== -1
        ? cleaned.slice(0, dotIndex + 1) + cleaned.slice(dotIndex + 1).replace(/\./g, '')
        : cleaned;

    const formatted = formatIndianCurrencyInput(sanitized);
    setDisplayAmount(formatted);
    setForm((prev) => ({ ...prev, amount: sanitized }));
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;

    const amount = Number(form.amount);
    if (!form.date || !cropName || !amount || amount <= 0 || (kind === 'expense' && !form.expenseType)) {
      setError(
        kind === 'expense'
          ? 'Choose a date, crop, and expense type, then enter an amount greater than zero.'
          : 'Choose a date and crop, then enter an amount greater than zero.'
      );
      return;
    }

    if (kind === 'expense') {
      await saveExpense({
        userId: user.uid,
        cropCycleId: selectedPlanting?.cropCycleId,
        cropName,
        type: form.expenseType,
        payee: form.counterparty || undefined,
        paidFromAccount: form.account || undefined,
        amount,
        description: form.notes || `${form.expenseType} for ${cropName}`,
        notes: form.notes || undefined,
        expenseDate: form.date,
      });
    } else {
      await saveIncome({
        userId: user.uid,
        cropCycleId: selectedPlanting?.cropCycleId,
        cropType: cropName,
        quantity: 1,
        quantityUnit: 'bags',
        unitPrice: amount,
        buyerName: form.counterparty || undefined,
        notes: form.notes || undefined,
        saleDate: form.date,
      });
    }

    router.push('/ledger');
  };

  const [activeField, setActiveField] = useState<string>('field-crop');
  const [isMobile, setIsMobile] = useState(false);

  // Strictly enable mobile-specific workflow ONLY for mobile app / phones (<= 767px)
  // Desktop and Tab view (website) remain in standard desktop mode.
  useEffect(() => {
    const check = () => {
      setIsMobile(typeof window !== 'undefined' && window.innerWidth <= 767);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const getFieldsSequence = useCallback(() => {
    return kind === 'expense'
      ? [
          'field-crop',
          'field-expense-type',
          'field-counterparty',
          'field-account',
          'field-amount',
          'field-date',
          'field-notes',
        ]
      : [
          'field-crop',
          'field-counterparty',
          'field-account',
          'field-amount',
          'field-date',
          'field-notes',
        ];
  }, [kind]);

  // When user selects or taps a field on mobile:
  // Scroll it smoothly to the top of the mobile viewport so options open downwards in open space
  // and the keyboard stays docked at the bottom without hiding options.
  // On Desktop and Tab (> 767px), do NOT scroll or alter page position!
  const scrollToField = useCallback((fieldId: string) => {
    setActiveField(fieldId);
    if (typeof window === 'undefined' || window.innerWidth > 767) {
      return;
    }
    setTimeout(() => {
      const el = document.getElementById(fieldId);
      if (el) {
        const rect = el.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const targetY = scrollTop + rect.top - 8;
        window.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' });
      }
    }, 40);
  }, []);

  // Advance automatically to the next option after a selection (strictly for mobile app)
  const moveToNextField = useCallback(
    (currentFieldId: string) => {
      const seq = getFieldsSequence();
      const idx = seq.indexOf(currentFieldId);
      if (idx !== -1 && idx < seq.length - 1) {
        const nextId = seq[idx + 1];
        scrollToField(nextId);
        setTimeout(() => {
          const nextEl = document.getElementById(nextId);
          const focusable = nextEl?.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLButtonElement>(
            'input:not([type="hidden"]), textarea, .choice-picker-trigger'
          );
          focusable?.focus();
        }, 120);
      }
    },
    [getFieldsSequence, scrollToField]
  );

  // Listen to keyboard Next/Prev buttons
  useEffect(() => {
    const handleNav = (e: Event) => {
      const custom = e as CustomEvent<{ direction: 'next' | 'prev' }>;
      const seq = getFieldsSequence();
      const currentIdx = activeField ? seq.indexOf(activeField) : 0;

      if (custom.detail?.direction === 'next') {
        const nextIdx = currentIdx < seq.length - 1 ? currentIdx + 1 : 0;
        const nextId = seq[nextIdx];
        scrollToField(nextId);
        setTimeout(() => {
          const el = document.getElementById(nextId);
          el?.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLButtonElement>(
            'input:not([type="hidden"]), textarea, .choice-picker-trigger'
          )?.focus();
        }, 120);
      } else {
        const prevIdx = currentIdx > 0 ? currentIdx - 1 : seq.length - 1;
        const prevId = seq[prevIdx];
        scrollToField(prevId);
        setTimeout(() => {
          const el = document.getElementById(prevId);
          el?.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLButtonElement>(
            'input:not([type="hidden"]), textarea, .choice-picker-trigger'
          )?.focus();
        }, 120);
      }
    };

    window.addEventListener('agri:navigate-field', handleNav);
    return () => window.removeEventListener('agri:navigate-field', handleNav);
  }, [activeField, getFieldsSequence, scrollToField]);

  // Hide upper bar on mobile while entering details; display as soon as each required detail is filled
  const isFormFilled = Boolean(
    form.date.trim() &&
    (form.crop.trim() || cropName.trim()) &&
    (kind === 'expense' ? Boolean(form.expenseType.trim()) : true) &&
    form.amount.trim() &&
    Number(form.amount) > 0
  );

  return (
    <AppShell hideTopNavOnMobile={!isFormFilled}>
      <div className="page-header">
        <div>
          <h1 className="page-title">New {kind === 'expense' ? 'Expense' : 'Income'} Entry</h1>
          <p className="page-subtitle">Record income or expenditure for your agricultural activities.</p>
        </div>
      </div>

      <section className="card" style={{ maxWidth: 1100, paddingBottom: isMobile ? 360 : 24 }}>
        <div
          style={{
            display: 'flex',
            gap: 10,
            paddingBottom: 20,
            marginBottom: 24,
            borderBottom: '1.5px solid var(--border-subtle)',
          }}
        >
          <button
            className={`btn ${kind === 'income' ? 'btn-primary' : 'btn-secondary'}`}
            type="button"
            onClick={() => setKind('income')}
          >
            <ArrowUpCircle size={16} /> Income
          </button>
          <button
            className={`btn ${kind === 'expense' ? 'btn-primary' : 'btn-secondary'}`}
            type="button"
            onClick={() => setKind('expense')}
          >
            <ArrowDownCircle size={16} /> Expense
          </button>
        </div>

        <form onSubmit={save}>
          <div className="grid-2">
            {/* Crop / Planting with in-box search and add */}
            <div
              id="field-crop"
              className={`form-group ${activeField === 'field-crop' ? 'form-group-active' : ''}`}
              onClick={() => scrollToField('field-crop')}
            >
              <label className="form-label">Crop / planting</label>
              <ChoicePicker
                ariaLabel="Crop or planting"
                value={form.crop}
                placeholder="Choose a crop"
                isOpen={isMobile ? activeField === 'field-crop' : undefined}
                onOpenChange={(open) => {
                  if (open) scrollToField('field-crop');
                  else if (isMobile && activeField === 'field-crop') setActiveField('');
                }}
                onOpen={() => scrollToField('field-crop')}
                onChange={(crop) => {
                  setForm((prev) => ({ ...prev, crop }));
                  if (isMobile) {
                    moveToNextField('field-crop');
                  }
                }}
                allowCreate
                createPlaceholder="Type or search crop to add..."
                onCreate={handleCreateCrop}
                options={[
                  ...crops.map((crop) => ({
                    value: crop.cropCycleId,
                    label: `${crop.cropType}${crop.farmName ? ` · ${crop.farmName}` : ''}`,
                    group: 'Your plantings',
                  })),
                  ...allQuickCrops.map((crop) => ({
                    value: `quick:${crop}`,
                    label: crop,
                    group: 'Quick crop choices',
                  })),
                ]}
              />
            </div>

            {/* Expense Type with in-box search and add */}
            {kind === 'expense' && (
              <div
                id="field-expense-type"
                className={`form-group ${activeField === 'field-expense-type' ? 'form-group-active' : ''}`}
                onClick={() => scrollToField('field-expense-type')}
              >
                <label className="form-label">Expense type</label>
                <ChoicePicker
                  ariaLabel="Expense type"
                  value={form.expenseType}
                  placeholder="Choose an expense type"
                  isOpen={isMobile ? activeField === 'field-expense-type' : undefined}
                  onOpenChange={(open) => {
                    if (open) scrollToField('field-expense-type');
                    else if (isMobile && activeField === 'field-expense-type') setActiveField('');
                  }}
                  onOpen={() => scrollToField('field-expense-type')}
                  onChange={(expenseType) => {
                    setForm((prev) => ({ ...prev, expenseType }));
                    if (isMobile) {
                      moveToNextField('field-expense-type');
                    }
                  }}
                  allowCreate
                  createPlaceholder="Type or search expense type..."
                  onCreate={handleCreateExpenseType}
                  options={allTypes.map((type) => ({
                    value: type,
                    label: type,
                    group: 'Expense types',
                  }))}
                />
              </div>
            )}

            {/* Payee / Counterparty with in-box search and add */}
            <div
              id="field-counterparty"
              className={`form-group ${activeField === 'field-counterparty' ? 'form-group-active' : ''}`}
              onClick={() => scrollToField('field-counterparty')}
            >
              <label className="form-label">{kind === 'expense' ? 'Payee' : 'Received from'}</label>
              <ChoicePicker
                ariaLabel={kind === 'expense' ? 'Payee' : 'Person'}
                value={form.counterparty}
                placeholder={`Choose ${kind === 'expense' ? 'a payee' : 'a person'} (optional)`}
                isOpen={isMobile ? activeField === 'field-counterparty' : undefined}
                onOpenChange={(open) => {
                  if (open) scrollToField('field-counterparty');
                  else if (isMobile && activeField === 'field-counterparty') setActiveField('');
                }}
                onSkip={isMobile ? () => moveToNextField('field-counterparty') : undefined}
                skipLabel="Skip (Optional) →"
                onOpen={() => scrollToField('field-counterparty')}
                onChange={(counterparty) => {
                  setForm((prev) => ({ ...prev, counterparty }));
                  if (isMobile) {
                    moveToNextField('field-counterparty');
                  }
                }}
                allowCreate
                createPlaceholder={`Type or search ${kind === 'expense' ? 'payee' : 'person'}...`}
                onCreate={handleCreatePayee}
                options={contacts.map((contact) => ({
                  value: contact.name,
                  label: contact.name,
                }))}
              />
            </div>

            {/* Account with in-box search and add */}
            <div
              id="field-account"
              className={`form-group ${activeField === 'field-account' ? 'form-group-active' : ''}`}
              onClick={() => scrollToField('field-account')}
            >
              <label className="form-label">
                {kind === 'expense' ? 'Paid from account' : 'Received into account'}
              </label>
              <ChoicePicker
                ariaLabel="Account"
                value={form.account}
                placeholder="Choose an account"
                isOpen={isMobile ? activeField === 'field-account' : undefined}
                onOpenChange={(open) => {
                  if (open) scrollToField('field-account');
                  else if (isMobile && activeField === 'field-account') setActiveField('');
                }}
                onSkip={isMobile ? () => moveToNextField('field-account') : undefined}
                skipLabel="Skip (Optional) →"
                onOpen={() => scrollToField('field-account')}
                onChange={(account) => {
                  setForm((prev) => ({ ...prev, account }));
                  if (isMobile) {
                    moveToNextField('field-account');
                  }
                }}
                allowCreate
                createPlaceholder="Type or search bank account..."
                onCreate={handleCreateAccount}
                options={accounts.map((account) => ({
                  value: account.displayName,
                  label: account.displayName,
                }))}
              />
            </div>

            {/* Amount with Indian comma formatting */}
            <div
              id="field-amount"
              className={`form-group ${activeField === 'field-amount' ? 'form-group-active' : ''}`}
              onClick={() => scrollToField('field-amount')}
            >
              <label className="form-label">Amount (₹)</label>
              <input
                type="text"
                inputMode="decimal"
                className="form-input"
                value={displayAmount}
                onFocus={() => scrollToField('field-amount')}
                onChange={handleAmountChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (isMobile) {
                      moveToNextField('field-amount');
                    }
                  }
                }}
                placeholder="0.00"
                style={{
                  fontWeight: 650,
                  fontSize: '1.05rem',
                  letterSpacing: '0.02em',
                }}
              />
            </div>
          </div>

          {/* Last Section: Transaction Date (defaulted to current date, editable) & Notes */}
          <div className="grid-2" style={{ marginTop: 12 }}>
            <div
              id="field-date"
              className={`form-group ${activeField === 'field-date' ? 'form-group-active' : ''}`}
              onClick={() => scrollToField('field-date')}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <label className="form-label" style={{ marginBottom: 0 }}>Date</label>
                {isMobile && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: '2px 8px', fontSize: '0.75rem', height: 24, borderRadius: 6, fontWeight: 650 }}
                    onClick={() => moveToNextField('field-date')}
                  >
                    Next →
                  </button>
                )}
              </div>
              <DateField
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                placeholder="dd-mm-yyyy"
              />
              <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: 4 }}>
                Defaulted to today's date. Click to change if needed.
              </div>
            </div>

            <div
              id="field-notes"
              className={`form-group ${activeField === 'field-notes' ? 'form-group-active' : ''}`}
              onClick={() => scrollToField('field-notes')}
            >
              <label className="form-label">Notes</label>
              <textarea
                rows={2}
                className="form-textarea"
                value={form.notes}
                onFocus={() => scrollToField('field-notes')}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder={kind === 'expense' ? 'What was this expense for?' : 'What income did you receive?'}
              />
            </div>
          </div>

          {error && (
            <p className="form-error" style={{ marginBottom: 14 }}>
              {error}
            </p>
          )}

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
            <button className="btn btn-secondary" type="button" onClick={() => router.push('/ledger')}>
              Cancel
            </button>
            <button className="btn btn-primary" type="submit">
              <Save size={16} /> Save {kind === 'expense' ? 'Expense' : 'Income'}
            </button>
          </div>
        </form>
      </section>
    </AppShell>
  );
}
