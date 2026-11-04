'use client';

import React, { useEffect, useState } from 'react';
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
    date: '',
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

  return (
    <AppShell>
      <div className="page-header">
        <div>
          <h1 className="page-title">New {kind === 'expense' ? 'Expense' : 'Income'} Entry</h1>
          <p className="page-subtitle">Record income or expenditure for your agricultural activities.</p>
        </div>
      </div>

      <section className="card" style={{ maxWidth: 1100 }}>
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
            <div className="form-group">
              <label className="form-label">Date</label>
              <DateField
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                placeholder="dd-mm-yyyy"
              />
            </div>

            {/* Crop / Planting with in-box search and add */}
            <div className="form-group">
              <label className="form-label">Crop / planting</label>
              <ChoicePicker
                ariaLabel="Crop or planting"
                value={form.crop}
                placeholder="Choose a crop"
                onChange={(crop) => setForm({ ...form, crop })}
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
              <div className="form-group">
                <label className="form-label">Expense type</label>
                <ChoicePicker
                  ariaLabel="Expense type"
                  value={form.expenseType}
                  placeholder="Choose an expense type"
                  onChange={(expenseType) => setForm({ ...form, expenseType })}
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
            <div className="form-group">
              <label className="form-label">{kind === 'expense' ? 'Payee' : 'Received from'}</label>
              <ChoicePicker
                ariaLabel={kind === 'expense' ? 'Payee' : 'Person'}
                value={form.counterparty}
                placeholder={`Choose ${kind === 'expense' ? 'a payee' : 'a person'} (optional)`}
                onChange={(counterparty) => setForm({ ...form, counterparty })}
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
            <div className="form-group">
              <label className="form-label">
                {kind === 'expense' ? 'Paid from account' : 'Received into account'}
              </label>
              <ChoicePicker
                ariaLabel="Account"
                value={form.account}
                placeholder="Choose an account"
                onChange={(account) => setForm({ ...form, account })}
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
            <div className="form-group">
              <label className="form-label">Amount (₹)</label>
              <input
                type="text"
                inputMode="decimal"
                className="form-input"
                value={displayAmount}
                onChange={handleAmountChange}
                placeholder="0.00"
                style={{
                  fontWeight: 650,
                  fontSize: '1.05rem',
                  letterSpacing: '0.02em',
                }}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea
              rows={3}
              className="form-textarea"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder={kind === 'expense' ? 'What was this expense for?' : 'What income did you receive?'}
            />
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
