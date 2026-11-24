'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { AppShell } from '@/components/layout/AppShell';
import {
  getCropCycles,
  getExpenses,
  getIncome,
  saveExpense,
  saveIncome,
  deleteExpense,
  deleteIncome,
} from '@/lib/services/dataService';
import { CropCycle, ExpenseRecord, IncomeRecord } from '@/types';
import {
  formatIndianCurrencyInput,
} from '@/lib/utils';
import { ChoicePicker } from '@/components/forms/ChoicePicker';
import { DateField } from '@/components/forms/DateField';
import {
  ChevronDown,
  Filter,
  Landmark,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from 'lucide-react';
import styles from './ledger.module.css';

interface LedgerRow {
  id: string;
  originalId?: string;
  type: 'income' | 'expense';
  date: string; // YYYY-MM-DD or DD.MM.YYYY
  crop: string;
  details: string;
  person: string;
  account: string;
  accountPrefix?: string; // 'Paid from' or 'Received in'
  income: number;
  expense: number;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '—';
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(dateStr)) return dateStr;
  try {
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${day.padStart(2, '0')}.${month.padStart(2, '0')}.${year}`;
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}.${month}.${year}`;
    }
  } catch { }
  return dateStr;
}

function getIsoDate(dateStr: string): string {
  if (!dateStr) return '';
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(dateStr)) {
    const parts = dateStr.split('.');
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  return dateStr.split('T')[0];
}

function getMonthName(dateStr: string): string {
  if (!dateStr) return '';
  try {
    if (/^\d{2}\.\d{2}\.\d{4}$/.test(dateStr)) {
      const parts = dateStr.split('.');
      const monthIdx = parseInt(parts[1], 10) - 1;
      if (monthIdx >= 0 && monthIdx < 12) {
        return MONTH_NAMES[monthIdx];
      }
    }
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length === 3) {
      const monthIdx = parseInt(parts[1], 10) - 1;
      if (monthIdx >= 0 && monthIdx < 12) {
        return MONTH_NAMES[monthIdx];
      }
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return MONTH_NAMES[d.getMonth()];
    }
  } catch { }
  return '';
}

export default function LedgerPage() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [rows, setRows] = useState<LedgerRow[]>([]);
  const [crops, setCrops] = useState<CropCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters: "All Months", "All Crops", and Specific Date ("")
  const [selectedMonth, setSelectedMonth] = useState<string>('All Months');
  const [selectedCrop, setSelectedCrop] = useState<string>('All Crops');
  const [selectedDate, setSelectedDate] = useState<string>('');

  // Filter Modal State
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [draftMonth, setDraftMonth] = useState<string>('All Months');
  const [draftCrop, setDraftCrop] = useState<string>('All Crops');
  const [draftDate, setDraftDate] = useState<string>('');

  // Edit Modal State
  const [editingRow, setEditingRow] = useState<LedgerRow | null>(null);
  const [editDetails, setEditDetails] = useState('');
  const [editCrop, setEditCrop] = useState('');
  const [editPerson, setEditPerson] = useState('');
  const [editAccount, setEditAccount] = useState('');
  const [editAmount, setEditAmount] = useState<number>(0);
  const [editAmountDisplay, setEditAmountDisplay] = useState('');
  const [editDate, setEditDate] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const loadLedgerData = async (isManualRefresh: boolean = false) => {
    if (isManualRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const userId = user?.uid || 'demo-farmer';
      const [expenses, income, cropList] = await Promise.all([
        getExpenses(userId),
        getIncome(userId),
        getCropCycles(userId),
      ]);

      setCrops(cropList);

      const expenseRows: LedgerRow[] = expenses.map((item: ExpenseRecord) => ({
        id: `exp-${item.expenseId}`,
        originalId: item.expenseId,
        type: 'expense',
        date: item.expenseDate,
        crop:
          item.cropName ||
          cropList.find((c) => c.cropCycleId === item.cropCycleId)?.cropType ||
          '—',
        details: item.type,
        person: item.payee || '—',
        account: item.paidFromAccount || 'Cash in Hand',
        accountPrefix: 'Paid from',
        income: 0,
        expense: Number(item.amount) || 0,
      }));

      const incomeRows: LedgerRow[] = income.map((item: IncomeRecord) => ({
        id: `inc-${item.incomeId}`,
        originalId: item.incomeId,
        type: 'income',
        date: item.saleDate,
        crop: item.cropType || '—',
        details: item.notes || 'Crop Sales',
        person: item.buyerName || '—',
        account: 'Cash in Hand',
        accountPrefix: 'Received in',
        income: Number(item.totalAmount) || 0,
        expense: 0,
      }));

      const combined = [...expenseRows, ...incomeRows].sort((a, b) =>
        b.date.localeCompare(a.date)
      );

      setRows(combined);
    } catch (err) {
      console.error('Failed to load ledger data:', err);
      setRows([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadLedgerData();
  }, [user]);

  // Compute month choices: All Months + all 12 calendar months (display only months without year)
  const monthOptions = useMemo(() => {
    return ['All Months', ...MONTH_NAMES];
  }, []);

  // Compute crop choices
  const cropOptions = useMemo(() => {
    const set = new Set<string>();
    set.add('Paddy');
    set.add('Banana');
    crops.forEach((c) => set.add(c.cropType));
    rows.forEach((r) => {
      if (r.crop && r.crop !== '—') set.add(r.crop);
    });
    return ['All Crops', ...Array.from(set)];
  }, [rows, crops]);

  // Filtered Rows (supports Crop, Month, and Date separately)
  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      // Month filter
      if (selectedMonth && selectedMonth !== 'All Months') {
        const rowMonth = getMonthName(row.date);
        if (rowMonth !== selectedMonth) {
          return false;
        }
      }
      // Crop filter
      if (selectedCrop && selectedCrop !== 'All Crops') {
        if (row.crop.toLowerCase() !== selectedCrop.toLowerCase()) {
          return false;
        }
      }
      // Specific Date filter
      if (selectedDate && selectedDate.trim() !== '') {
        const rowIso = getIsoDate(row.date);
        if (rowIso !== selectedDate) {
          return false;
        }
      }
      return true;
    });
  }, [rows, selectedMonth, selectedCrop, selectedDate]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedMonth && selectedMonth !== 'All Months') count++;
    if (selectedCrop && selectedCrop !== 'All Crops') count++;
    if (selectedDate && selectedDate.trim() !== '') count++;
    return count;
  }, [selectedMonth, selectedCrop, selectedDate]);

  // Summary Totals
  const totalIncome = useMemo(
    () => filteredRows.reduce((sum, r) => sum + (Number(r.income) || 0), 0),
    [filteredRows]
  );
  const totalExpense = useMemo(
    () => filteredRows.reduce((sum, r) => sum + (Number(r.expense) || 0), 0),
    [filteredRows]
  );
  const balance = totalIncome - totalExpense;

  // Edit Modal Handlers
  const openEditModal = (row: LedgerRow) => {
    setEditingRow(row);
    setEditDetails(row.details);
    setEditCrop(row.crop);
    setEditPerson(row.person === '—' ? '' : row.person);
    setEditAccount(row.account);
    const amt = row.type === 'income' ? row.income : row.expense;
    setEditAmount(amt);
    setEditAmountDisplay(formatIndianCurrencyInput(amt));
    setEditDate(row.date);
  };

  const closeEditModal = () => {
    setEditingRow(null);
    setSavingEdit(false);
  };

  const handleSaveEdit = async () => {
    if (!editingRow) return;
    setSavingEdit(true);

    try {
      const userId = user?.uid || 'demo-farmer';
      const updatedRow: LedgerRow = {
        ...editingRow,
        details: editDetails,
        crop: editCrop,
        person: editPerson || '—',
        account: editAccount,
        date: editDate,
        income: editingRow.type === 'income' ? Number(editAmount) : 0,
        expense: editingRow.type === 'expense' ? Number(editAmount) : 0,
      };

      // If this is a real user database record, sync back to storage
      if (editingRow.originalId && user) {
        if (editingRow.type === 'expense') {
          await saveExpense({
            expenseId: editingRow.originalId,
            userId,
            cropCycleId: '',
            cropName: editCrop,
            type: editDetails,
            description: editDetails,
            amount: Number(editAmount),
            expenseDate: editDate,
            payee: editPerson,
            paidFromAccount: editAccount,
          });
        } else {
          await saveIncome({
            incomeId: editingRow.originalId,
            userId,
            cropType: editCrop,
            quantity: 1,
            quantityUnit: 'bags',
            unitPrice: Number(editAmount),
            saleDate: editDate,
            buyerName: editPerson,
            notes: editDetails,
          });
        }
      }

      // Update in state
      setRows((prev) =>
        prev.map((r) => (r.id === editingRow.id ? updatedRow : r))
      );
      closeEditModal();
    } catch (err) {
      console.error('Failed to save edit:', err);
      closeEditModal();
    }
  };

  const handleDeleteRow = async () => {
    if (!editingRow) return;
    const confirmDelete = window.confirm(
      'Are you sure you want to delete this ledger entry?'
    );
    if (!confirmDelete) return;

    setSavingEdit(true);
    try {
      const userId = user?.uid || 'demo-farmer';
      if (editingRow.originalId && user) {
        if (editingRow.type === 'expense') {
          await deleteExpense(editingRow.originalId, userId);
        } else {
          await deleteIncome(editingRow.originalId, userId);
        }
      }
      setRows((prev) => prev.filter((r) => r.id !== editingRow.id));
      closeEditModal();
    } catch (err) {
      console.error('Failed to delete row:', err);
      closeEditModal();
    }
  };

  return (
    <AppShell>
      <div className={styles.pageWrapper}>
        {/* 1. Summary Card: Total Income, Total Expenses, Balance */}
        <div className={styles.summaryCard}>
          <div className={styles.summaryCol}>
            <span className={styles.summaryLabel}>Total Income</span>
            <span className={styles.summaryIncome}>
              ₹{totalIncome.toLocaleString('en-IN')}
            </span>
          </div>

          <div className={styles.summaryCol}>
            <span className={styles.summaryLabel}>Total Expenses</span>
            <span className={styles.summaryExpense}>
              ₹{totalExpense.toLocaleString('en-IN')}
            </span>
          </div>

          <div className={styles.summaryCol}>
            <span className={styles.summaryLabel}>Balance</span>
            <span
              className={
                balance >= 0 ? styles.summaryBalance : styles.summaryExpense
              }
            >
              {balance >= 0
                ? `₹${balance.toLocaleString('en-IN')}`
                : `-₹${Math.abs(balance).toLocaleString('en-IN')}`}
            </span>
          </div>
        </div>

        {/* Active Filters Bar */}
        {activeFilterCount > 0 && (
          <div className={styles.activeFiltersBar}>
            <span className={styles.activeFiltersLabel}>Filters:</span>
            {selectedMonth !== 'All Months' && (
              <span className={styles.filterChip}>
                Month: <strong>{selectedMonth}</strong>
                <button
                  type="button"
                  onClick={() => setSelectedMonth('All Months')}
                  aria-label="Clear month filter"
                >
                  ✕
                </button>
              </span>
            )}
            {selectedCrop !== 'All Crops' && (
              <span className={styles.filterChip}>
                Crop: <strong>{selectedCrop}</strong>
                <button
                  type="button"
                  onClick={() => setSelectedCrop('All Crops')}
                  aria-label="Clear crop filter"
                >
                  ✕
                </button>
              </span>
            )}
            {selectedDate && (
              <span className={styles.filterChip}>
                Date: <strong>{formatDisplayDate(selectedDate)}</strong>
                <button
                  type="button"
                  onClick={() => setSelectedDate('')}
                  aria-label="Clear date filter"
                >
                  ✕
                </button>
              </span>
            )}
            <button
              type="button"
              className={styles.clearAllFiltersBtn}
              onClick={() => {
                setSelectedMonth('All Months');
                setSelectedCrop('All Crops');
                setSelectedDate('');
              }}
            >
              Clear All
            </button>
          </div>
        )}

        {/* 2. Table Container */}
        <div className={styles.tableContainer}>
          {/* Header */}
          <div className={styles.tableHeader}>
            <div className={`${styles.tableHeaderCol} ${styles.detailsHeaderCol}`}>
              <span className={styles.detailsTitle}>{t('Details')}</span>
              <button
                type="button"
                className={`${styles.detailsFilterBtn}${activeFilterCount > 0 ? ` ${styles.detailsFilterBtnActive}` : ''
                  }`}
                onClick={() => {
                  setDraftMonth(selectedMonth);
                  setDraftCrop(selectedCrop);
                  setDraftDate(selectedDate);
                  setIsFilterModalOpen(true);
                }}
                aria-label="Filter transactions"
                title="Filter by Crop, Month, or Date"
              >
                <Filter size={13} strokeWidth={2.4} className={styles.filterIcon} />
                <span>{t('Filter')}</span>
                {activeFilterCount > 0 && (
                  <span className={styles.filterBadgeCount}>{activeFilterCount}</span>
                )}
                <ChevronDown size={12} strokeWidth={2.4} className={styles.filterChevron} />
              </button>
            </div>
            <div
              className={`${styles.tableHeaderCol} ${styles.tableHeaderColBorder}`}
            >
              {t('Income')} ₹
            </div>
            <div
              className={`${styles.tableHeaderCol} ${styles.tableHeaderColBorder}`}
            >
              {t('Expenses')} ₹
            </div>
          </div>

          {/* Table Rows */}
          {loading ? (
            <div className={styles.emptyState}>
              <RefreshCw
                size={22}
                className="animate-spin"
                style={{ color: '#2563eb', marginBottom: 8, display: 'inline-block' }}
              />
              <div>Loading records...</div>
            </div>
          ) : filteredRows.length === 0 ? (
            <div className={styles.emptyState}>
              <div style={{ color: '#64748b', fontSize: '0.95rem', fontWeight: 600 }}>
                {rows.length === 0
                  ? 'No New Entry Found'
                  : `No ledger entries found for ${selectedMonth} • ${selectedCrop}.`}
              </div>
            </div>
          ) : (
            filteredRows.map((row) => (
              <div key={row.id} className={styles.tableRow}>
                {/* Column 1: Details */}
                <div className={styles.detailsCol}>
                  <span className={styles.rowDate}>
                    {formatDisplayDate(row.date)}
                  </span>
                  <span className={styles.rowCrop}>{row.crop}</span>
                  <span className={styles.rowCategory}>{row.details}</span>
                  {row.person && row.person !== '—' && (
                    <span className={styles.rowPerson}>{row.person}</span>
                  )}
                  <div className={styles.rowMetaRow}>
                    <div className={styles.rowAccount}>
                      <Landmark className={styles.bankIcon} />
                      <span>
                        {(row.accountPrefix ||
                          (row.type === 'income' ? 'Received in' : 'Paid from')) +
                          ': ' +
                          row.account}
                      </span>
                    </div>
                    <button
                      type="button"
                      className={styles.editButton}
                      onClick={() => openEditModal(row)}
                    >
                      <Pencil size={11} strokeWidth={2.5} />
                      <span>Edit</span>
                    </button>
                  </div>
                </div>

                {/* Column 2: Income ₹ */}
                <div className={styles.amountCol}>
                  {row.income > 0 ? (
                    <span className={styles.incomeAmount}>
                      {row.income.toLocaleString('en-IN')}
                    </span>
                  ) : (
                    <span className={styles.dash}>—</span>
                  )}
                </div>

                {/* Column 3: Expense ₹ */}
                <div className={styles.amountCol}>
                  {row.expense > 0 ? (
                    <span className={styles.expenseAmount}>
                      {row.expense.toLocaleString('en-IN')}
                    </span>
                  ) : (
                    <span className={styles.dash}>—</span>
                  )}
                </div>
              </div>
            ))
          )}

          {/* 4. Total Row */}
          {!loading && filteredRows.length > 0 && (
            <div className={styles.tableTotalRow}>
              <div className={styles.totalLabel}>Total</div>
              <div className={styles.totalIncome}>
                {totalIncome > 0 ? totalIncome.toLocaleString('en-IN') : '—'}
              </div>
              <div className={styles.totalExpense}>
                {totalExpense > 0 ? totalExpense.toLocaleString('en-IN') : '—'}
              </div>
            </div>
          )}
        </div>

        {/* 5. Lower Middle: "+ New Entry" button */}
        <div className={styles.lowerMiddleBar}>
          <Link href="/entry" className={styles.newEntryButton}>
            <Plus size={20} strokeWidth={2.8} />
            <span>New Entry</span>
          </Link>
        </div>

        {/* 6. Edit Modal */}
        {editingRow && (
          <div className={styles.modalOverlay} onClick={closeEditModal}>
            <div
              className={styles.modalCard}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>
                  Edit {editingRow.type === 'income' ? 'Income' : 'Expense'} Entry
                </h3>
                <button
                  type="button"
                  className={styles.modalClose}
                  onClick={closeEditModal}
                >
                  <X size={20} />
                </button>
              </div>

              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Date</label>
                  <input
                    type="date"
                    className={styles.formInput}
                    style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
                    value={
                      editDate.includes('-')
                        ? editDate.split('T')[0]
                        : new Date().toISOString().split('T')[0]
                    }
                    onChange={(e) => setEditDate(e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Crop</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
                    value={editCrop}
                    onChange={(e) => setEditCrop(e.target.value)}
                    placeholder="e.g. Paddy, Banana"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Details / Category</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
                    value={editDetails}
                    onChange={(e) => setEditDetails(e.target.value)}
                    placeholder="e.g. Fertilizer Purchase, Crop Sales"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    {editingRow.type === 'income' ? 'Buyer Name' : 'Payee / Store'}
                  </label>
                  <input
                    type="text"
                    className={styles.formInput}
                    style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
                    value={editPerson}
                    onChange={(e) => setEditPerson(e.target.value)}
                    placeholder="e.g. Murugan Store, Ramasamy"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Bank / Account</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
                    value={editAccount}
                    onChange={(e) => setEditAccount(e.target.value)}
                    placeholder="e.g. Axis ••1234, SBI ••5678"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Amount (₹)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    className={styles.formInput}
                    style={{ backgroundColor: '#ffffff', color: '#0f172a', fontWeight: 600 }}
                    value={editAmountDisplay}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9.]/g, '');
                      const dotIndex = raw.indexOf('.');
                      const sanitized =
                        dotIndex !== -1
                          ? raw.slice(0, dotIndex + 1) + raw.slice(dotIndex + 1).replace(/\./g, '')
                          : raw;
                      setEditAmountDisplay(formatIndianCurrencyInput(sanitized));
                      setEditAmount(Number(sanitized) || 0);
                    }}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.deleteBtn}
                  onClick={handleDeleteRow}
                  disabled={savingEdit}
                >
                  <Trash2 size={16} />
                  <span>Delete</span>
                </button>

                <button
                  type="button"
                  className={styles.saveBtn}
                  onClick={handleSaveEdit}
                  disabled={savingEdit}
                >
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}
        {/* 6. Filter Modal */}
        {isFilterModalOpen && (
          <div
            className={styles.modalOverlay}
            onClick={() => setIsFilterModalOpen(false)}
          >
            <div
              className={styles.modalCard}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <div
                  className={styles.modalTitle}
                  style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  <Filter size={18} style={{ color: '#2563eb' }} />
                  <span>Filter Ledger</span>
                </div>
                <button
                  type="button"
                  className={styles.modalClose}
                  onClick={() => setIsFilterModalOpen(false)}
                  aria-label="Close filter dialog"
                >
                  <X size={18} />
                </button>
              </div>

              <div className={styles.modalBody}>
                {/* Crop Filter */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Crop</label>
                  <ChoicePicker
                    ariaLabel="Filter by crop"
                    value={draftCrop}
                    placeholder="All Crops"
                    onChange={setDraftCrop}
                    options={cropOptions.map((c) => ({ value: c, label: c }))}
                  />
                </div>

                {/* Month Filter */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Month</label>
                  <ChoicePicker
                    ariaLabel="Filter by month"
                    value={draftMonth}
                    placeholder="All Months"
                    onChange={setDraftMonth}
                    options={monthOptions.map((m) => ({ value: m, label: m }))}
                  />
                </div>

                {/* Specific Date Filter */}
                <div className={styles.formGroup}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 2,
                    }}
                  >
                    <label className={styles.formLabel} style={{ marginBottom: 0 }}>
                      Specific Date (Optional)
                    </label>
                    {draftDate && (
                      <button
                        type="button"
                        onClick={() => setDraftDate('')}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#dc2626',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          padding: 0,
                        }}
                      >
                        Clear date
                      </button>
                    )}
                  </div>
                  <DateField
                    value={draftDate}
                    onChange={(e) => setDraftDate(e.target.value)}
                    placeholder="dd-mm-yyyy"
                  />
                  <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: 4 }}>
                    Choose a date to view entries for that specific day, or leave blank for all dates.
                  </div>
                </div>
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.resetFilterBtn}
                  onClick={() => {
                    setDraftMonth('All Months');
                    setDraftCrop('All Crops');
                    setDraftDate('');
                  }}
                >
                  Reset
                </button>

                <button
                  type="button"
                  className={styles.saveBtn}
                  onClick={() => {
                    setSelectedMonth(draftMonth);
                    setSelectedCrop(draftCrop);
                    setSelectedDate(draftDate);
                    setIsFilterModalOpen(false);
                  }}
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
