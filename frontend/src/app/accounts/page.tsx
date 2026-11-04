'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { AppShell } from '@/components/layout/AppShell';
import { ChoicePicker } from '@/components/forms/ChoicePicker';
import { deleteLedgerAccount, getLedgerAccounts, saveLedgerAccount } from '@/lib/services/dataService';
import { LedgerAccount } from '@/types';
import { Landmark, Plus, Trash2, Wallet, X } from 'lucide-react';

type AccountForm = Omit<LedgerAccount, 'id' | 'userId' | 'createdAt'>;

const emptyForm: AccountForm = {
  displayName: '',
  bankName: '',
  accountNumber: '',
  ifsc: '',
  branch: '',
  accountType: 'Savings',
  isDefault: false,
};

const POPULAR_BANKS = [
  'State Bank of India (SBI)',
  'Punjab National Bank (PNB)',
  'Bank of Baroda (BOB)',
  'Canara Bank',
  'Union Bank of India',
  'Indian Bank',
  'Central Bank of India',
  'Bank of India (BOI)',
  'Indian Overseas Bank (IOB)',
  'UCO Bank',
  'Bank of Maharashtra',
  'Punjab & Sind Bank',
  'HDFC Bank',
  'ICICI Bank',
  'Axis Bank',
  'Kotak Mahindra Bank',
  'IndusInd Bank',
  'Federal Bank',
  'IDBI Bank',
  'Yes Bank',
  'Bandhan Bank',
  'Regional Rural Bank (Gramin Bank)',
  'District Central Cooperative Bank (DCCB)',
  'State Cooperative Agriculture & Rural Dev Bank',
  'Primary Agricultural Credit Society (PACS)',
  'India Post Payments Bank (IPPB)',
  'AU Small Finance Bank',
  'Equitas Small Finance Bank',
  'Ujjivan Small Finance Bank',
];

const BRANCH_TYPES = [
  'Rural / Village Branch',
  'Mandi / APMC Market Yard Branch',
  'Agricultural Development Branch (ADB)',
  'Semi-Urban / Taluk Branch',
  'District Head Branch',
  'Main Branch',
  'Town / City Branch',
  'Commercial / Market Center Branch',
  'Cooperative Society Counter',
  'Extension Counter / Mini Branch',
];

function AccountFields({
  form,
  onChange,
  inputRef,
  idPrefix = 'main',
}: {
  form: AccountForm;
  onChange: (value: AccountForm) => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  idPrefix?: string;
}) {
  const bankOptions = React.useMemo(() => {
    const list = POPULAR_BANKS.map((bank, index) => ({
      value: bank,
      label: bank,
      group:
        index < 12
          ? 'Public Sector / Nationalized Banks'
          : index < 21
          ? 'Leading Private Banks'
          : 'Agricultural & Cooperative / Rural Banks',
    }));
    if (form.bankName && !POPULAR_BANKS.includes(form.bankName)) {
      list.unshift({
        value: form.bankName,
        label: form.bankName,
        group: 'Custom Bank',
      });
    }
    return list;
  }, [form.bankName]);

  const branchOptions = React.useMemo(() => {
    const list = BRANCH_TYPES.map((branch) => ({
      value: branch,
      label: branch,
      group: 'Branch types',
    }));
    if (form.branch && !BRANCH_TYPES.includes(form.branch)) {
      list.unshift({
        value: form.branch,
        label: form.branch,
        group: 'Custom Branch',
      });
    }
    return list;
  }, [form.branch]);

  return (
    <>
      <div className="grid-2" style={{ gap: 14 }}>
        <div className="form-group">
          <label className="form-label">Account display name *</label>
          <input
            ref={inputRef}
            className="form-input"
            value={form.displayName}
            onChange={(e) => onChange({ ...form, displayName: e.target.value })}
            placeholder="e.g. SBI · Farm Account or Axis · Personal"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Bank name</label>
          <ChoicePicker
            ariaLabel="Bank name"
            value={form.bankName || ''}
            placeholder="Choose or search bank name"
            onChange={(bankName) => onChange({ ...form, bankName })}
            allowCreate
            createPlaceholder="Type or search bank name..."
            onCreate={(bankName) => onChange({ ...form, bankName })}
            options={bankOptions}
          />
        </div>
      </div>

      <div className="grid-2" style={{ gap: 14 }}>
        <div className="form-group">
          <label className="form-label">Account number</label>
          <input
            className="form-input"
            value={form.accountNumber || ''}
            onChange={(e) => onChange({ ...form, accountNumber: e.target.value })}
            placeholder="Account number"
          />
        </div>

        <div className="form-group">
          <label className="form-label">IFSC code</label>
          <input
            className="form-input"
            value={form.ifsc || ''}
            onChange={(e) => onChange({ ...form, ifsc: e.target.value })}
            placeholder="IFSC code"
          />
        </div>
      </div>

      <div className="grid-2" style={{ gap: 14 }}>
        <div className="form-group">
          <label className="form-label">Branch</label>
          <ChoicePicker
            ariaLabel="Branch"
            value={form.branch || ''}
            placeholder="Choose or search branch"
            onChange={(branch) => onChange({ ...form, branch })}
            allowCreate
            createPlaceholder="Type or search branch name..."
            onCreate={(branch) => onChange({ ...form, branch })}
            options={branchOptions}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Account type</label>
          <ChoicePicker
            ariaLabel="Account type"
            value={form.accountType}
            placeholder="Choose an account type"
            onChange={(accountType) => onChange({ ...form, accountType: accountType as LedgerAccount['accountType'] })}
            options={[{ value: 'Savings', label: 'Savings' }, { value: 'Current', label: 'Current' }]}
          />
        </div>
      </div>

      <label
        style={{
          display: 'flex',
          gap: 8,
          alignItems: 'center',
          marginBottom: 18,
          fontSize: '.9rem',
          fontWeight: 500,
        }}
      >
        <input
          type="checkbox"
          checked={form.isDefault}
          onChange={(e) => onChange({ ...form, isDefault: e.target.checked })}
        />
        Use this as default account
      </label>
    </>
  );
}

export default function AccountsPage() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<LedgerAccount[]>([]);
  const [form, setForm] = useState<AccountForm>(emptyForm);
  const [anotherForm, setAnotherForm] = useState<AccountForm>(emptyForm);
  const [showAnother, setShowAnother] = useState(false);
  const [error, setError] = useState('');
  const [anotherError, setAnotherError] = useState('');
  const anotherNameRef = useRef<HTMLInputElement>(null);

  const load = () => {
    if (user) {
      setAccounts(getLedgerAccounts(user.uid));
    }
  };

  useEffect(load, [user]);

  const persist = (draft: AccountForm): boolean => {
    if (!user || !draft.displayName.trim()) return false;
    saveLedgerAccount({
      userId: user.uid,
      ...draft,
      displayName: draft.displayName.trim(),
      bankName: draft.bankName?.trim() || undefined,
      accountNumber: draft.accountNumber?.trim() || undefined,
      ifsc: draft.ifsc?.trim() || undefined,
      branch: draft.branch?.trim() || undefined,
    });
    load();
    return true;
  };

  const saveMain = (event: React.FormEvent) => {
    event.preventDefault();
    if (!persist(form)) {
      setError('Account display name is required.');
      return;
    }
    setForm(emptyForm);
    setError('');
  };

  const openAnother = () => {
    setAnotherForm(emptyForm);
    setAnotherError('');
    setShowAnother(true);
    window.setTimeout(() => anotherNameRef.current?.focus(), 100);
  };

  const saveAnother = (event: React.FormEvent) => {
    event.preventDefault();
    if (!persist(anotherForm)) {
      setAnotherError('Account display name is required.');
      return;
    }
    setAnotherForm(emptyForm);
    setAnotherError('');
    setShowAnother(false);
  };

  return (
    <AppShell>
      <div className="page-header">
        <div>
          <h1 className="page-title">Add Account</h1>
          <p className="page-subtitle">
            Keep track of cash and bank accounts used for farm entries.
          </p>
        </div>
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        <section className="card">
          <div className="card-title" style={{ marginBottom: 20 }}>
            <Landmark size={20} /> Account details
          </div>

          <form onSubmit={saveMain}>
            <AccountFields form={form} onChange={setForm} idPrefix="main" />

            {error && (
              <p className="form-error" style={{ marginBottom: 12 }}>
                {error}
              </p>
            )}

            <button className="btn btn-primary" type="submit">
              <Plus size={16} /> Save Account
            </button>
          </form>
        </section>

        <section className="card" style={{ background: 'var(--primary-50)' }}>
          <div className="card-title" style={{ marginBottom: 16 }}>
            <Wallet size={20} /> Your accounts
          </div>

          <div style={{ display: 'grid', gap: 10 }}>
            {accounts.map((account) => (
              <div
                key={account.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 10,
                  padding: '12px 14px',
                  border: '1.5px solid var(--border-subtle)',
                  background: '#fff',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <div>
                  <strong>{account.displayName}</strong>
                  <div
                    style={{
                      fontSize: '.78rem',
                      color: 'var(--text-muted)',
                      marginTop: 3,
                    }}
                  >
                    {account.bankName || account.accountType}
                    {account.accountNumber ? ` · ••${account.accountNumber.slice(-4)}` : ''}
                    {account.isDefault ? ' · Default' : ''}
                  </div>
                </div>

                {account.id !== 'cash-in-hand' && (
                  <button
                    type="button"
                    className="btn-icon"
                    onClick={() => {
                      deleteLedgerAccount(account.id);
                      load();
                    }}
                    style={{ color: 'var(--loss-red)' }}
                    title="Delete account"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={openAnother}
            style={{ marginTop: 16, width: '100%' }}
          >
            <Plus size={16} /> Add Another Account
          </button>
        </section>
      </div>

      {showAnother && (
        <section
          className="card"
          style={{
            marginTop: 24,
            maxWidth: 1100,
            borderColor: 'var(--primary-300)',
          }}
        >
          <div className="card-header">
            <div className="card-title">
              <Landmark size={20} /> Additional account details
            </div>
            <button
              type="button"
              className="btn-icon"
              onClick={() => setShowAnother(false)}
              aria-label="Close additional account form"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={saveAnother}>
            <AccountFields
              form={anotherForm}
              onChange={setAnotherForm}
              inputRef={anotherNameRef}
              idPrefix="another"
            />

            {anotherError && (
              <p className="form-error" style={{ marginBottom: 12 }}>
                {anotherError}
              </p>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowAnother(false)}
              >
                Cancel
              </button>
              <button className="btn btn-primary" type="submit">
                <Plus size={16} /> Save Account
              </button>
            </div>
          </form>
        </section>
      )}
    </AppShell>
  );
}
