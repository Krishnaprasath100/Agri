'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
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
  numberToIndianWords,
} from '@/lib/utils';
import {
  ChevronDown,
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

// Seed records that match the user reference design out of the box
const DEFAULT_LEDGER_ENTRIES: LedgerRow[] = [
  {
    id: 'seed-1',
    type: 'expense',
    date: '2026-10-10',
    crop: 'Paddy',
    details: 'Fertilizer Purchase',
    person: 'Murugan Fertilizer Store',
    account: 'Axis ••1234',
    accountPrefix: 'Paid from',
    income: 0,
    expense: 5000,
  },
  {
    id: 'seed-2',
    type: 'expense',
    date: '2026-10-09',
    crop: 'Paddy',
    details: 'Labour Wages',
    person: 'Ramasamy',
    account: 'SBI ••5678',
    accountPrefix: 'Paid from',
    income: 0,
    expense: 3500,
  },
  {
    id: 'seed-3',
    type: 'income',
    date: '2026-10-08',
    crop: 'Banana',
    details: 'Crop Sales',
    person: 'Kumar Trader',
    account: 'Axis ••1234',
    accountPrefix: 'Received in',
    income: 45000,
    expense: 0,
  },
  {
    id: 'seed-4',
    type: 'expense',
    date: '2026-10-07',
    crop: 'Banana',
    details: 'Seedling Purchase',
    person: 'Selvam Nursery',
    account: 'HDFC ••9012',
    accountPrefix: 'Paid from',
    income: 0,
    expense: 10000,
  },
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
  } catch {}
  return dateStr;
}

function getMonthYear(dateStr: string): string {
  if (!dateStr) return '';
  try {
    if (/^\d{2}\.\d{2}\.\d{4}$/.test(dateStr)) {
      const parts = dateStr.split('.');
      const monthIdx = parseInt(parts[1], 10) - 1;
      if (monthIdx >= 0 && monthIdx < 12) {
        return `${MONTH_NAMES[monthIdx]} ${parts[2]}`;
      }
    }
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length === 3) {
      const monthIdx = parseInt(parts[1], 10) - 1;
      if (monthIdx >= 0 && monthIdx < 12) {
        return `${MONTH_NAMES[monthIdx]} ${parts[0]}`;
      }
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
    }
  } catch {}
  return '';
}

export default function LedgerPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<LedgerRow[]>(DEFAULT_LEDGER_ENTRIES);
  const [crops, setCrops] = useState<CropCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters matching reference design: "October 2026" & "All Crops"
  const [selectedMonth, setSelectedMonth] = useState<string>('October 2026');
  const [selectedCrop, setSelectedCrop] = useState<string>('All Crops');

  const [monthDropdownOpen, setMonthDropdownOpen] = useState(false);
  const [cropDropdownOpen, setCropDropdownOpen] = useState(false);

  const monthDropdownRef = useRef<HTMLDivElement>(null);
  const cropDropdownRef = useRef<HTMLDivElement>(null);

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

      const hasUserData = expenses.length > 0 || income.length > 0;

      if (!hasUserData) {
        // Use default seed rows matching user reference screenshot
        setRows(DEFAULT_LEDGER_ENTRIES);
        setSelectedMonth('October 2026');
      } else {
        const expenseRows: LedgerRow[] = expenses.map((item: ExpenseRecord) => ({
          id: `exp-${item.expenseId}`,
          originalId: item.expenseId,
          type: 'expense',
          date: item.expenseDate,
          crop:
            item.cropName ||
            cropList.find((c) => c.cropCycleId === item.cropCycleId)?.cropType ||
            'Paddy',
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
          crop: item.cropType || 'Crop',
          details: item.notes || 'Crop Sales',
          person: item.buyerName || '—',
          account: 'Axis ••1234',
          accountPrefix: 'Received in',
          income: Number(item.totalAmount) || 0,
          expense: 0,
        }));

        const combined = [...expenseRows, ...incomeRows].sort((a, b) =>
          b.date.localeCompare(a.date)
        );

        setRows(combined);

        // Auto-select latest month if current filter has no items
        const availableMonths = Array.from(
          new Set(combined.map((r) => getMonthYear(r.date)).filter(Boolean))
        );
        if (availableMonths.length > 0 && !availableMonths.includes(selectedMonth)) {
          setSelectedMonth(availableMonths[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load ledger data:', err);
      setRows(DEFAULT_LEDGER_ENTRIES);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadLedgerData();
  }, [user]);

  // Handle clicking outside of dropdowns to close them
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        monthDropdownRef.current &&
        !monthDropdownRef.current.contains(event.target as Node)
      ) {
        setMonthDropdownOpen(false);
      }
      if (
        cropDropdownRef.current &&
        !cropDropdownRef.current.contains(event.target as Node)
      ) {
        setCropDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Compute month choices: All Months + all 12 calendar months
  const monthOptions = useMemo(() => {
    const currentYear = new Date().getFullYear() || 2026;
    const years = new Set<number>([2026, currentYear]);

    rows.forEach((r) => {
      if (r.date) {
        if (/^\d{2}\.\d{2}\.\d{4}$/.test(r.date)) {
          const parts = r.date.split('.');
          const y = parseInt(parts[2], 10);
          if (!isNaN(y)) years.add(y);
        } else {
          const parts = r.date.split('T')[0].split('-');
          if (parts.length === 3) {
            const y = parseInt(parts[0], 10);
            if (!isNaN(y)) years.add(y);
          }
        }
      }
    });

    const months: string[] = ['All Months'];

    const sortedYears = Array.from(years).sort((a, b) => b - a);
    sortedYears.forEach((year) => {
      MONTH_NAMES.forEach((m) => {
        months.push(`${m} ${year}`);
      });
    });

    return months;
  }, [rows]);

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

  // Filtered Rows
  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      // Month filter
      if (selectedMonth && selectedMonth !== 'All Months') {
        const rowMonth = getMonthYear(row.date);
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
      return true;
    });
  }, [rows, selectedMonth, selectedCrop]);

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
        {/* 1. Top Filters: [ October 2026 ∨ ] [ All Crops ∨ ] */}
        <div className={styles.filterRow}>
          {/* Month Filter Dropdown */}
          <div className={styles.filterBox} ref={monthDropdownRef}>
            <button
              type="button"
              className={styles.filterButton}
              onClick={() => {
                setMonthDropdownOpen(!monthDropdownOpen);
                setCropDropdownOpen(false);
              }}
              aria-label="Filter by month"
            >
              <span>{selectedMonth}</span>
              <ChevronDown
                size={18}
                style={{
                  transform: monthDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease',
                  color: '#1b6343',
                }}
              />
            </button>

            {monthDropdownOpen && (
              <div className={styles.filterMenu}>
                {monthOptions.map((m) => (
                  <div
                    key={m}
                    className={`${styles.filterOption} ${
                      selectedMonth === m ? styles.filterOptionActive : ''
                    }`}
                    onClick={() => {
                      setSelectedMonth(m);
                      setMonthDropdownOpen(false);
                    }}
                  >
                    {m}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Crop Filter Dropdown */}
          <div className={styles.filterBox} ref={cropDropdownRef}>
            <button
              type="button"
              className={styles.filterButton}
              onClick={() => {
                setCropDropdownOpen(!cropDropdownOpen);
                setMonthDropdownOpen(false);
              }}
              aria-label="Filter by crop"
            >
              <span>{selectedCrop}</span>
              <ChevronDown
                size={18}
                style={{
                  transform: cropDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease',
                  color: '#1b6343',
                }}
              />
            </button>

            {cropDropdownOpen && (
              <div className={styles.filterMenu}>
                {cropOptions.map((c) => (
                  <div
                    key={c}
                    className={`${styles.filterOption} ${
                      selectedCrop === c ? styles.filterOptionActive : ''
                    }`}
                    onClick={() => {
                      setSelectedCrop(c);
                      setCropDropdownOpen(false);
                    }}
                  >
                    {c}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 2. Summary Card: Total Income, Total Expenses, Balance */}
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

        {/* 3. Table Container */}
        <div className={styles.tableContainer}>
          {/* Header */}
          <div className={styles.tableHeader}>
            <div className={styles.tableHeaderCol}>Details</div>
            <div
              className={`${styles.tableHeaderCol} ${styles.tableHeaderColBorder}`}
            >
              Income ₹
            </div>
            <div
              className={`${styles.tableHeaderCol} ${styles.tableHeaderColBorder}`}
            >
              Expense ₹
            </div>
          </div>

          {/* Table Rows */}
          {loading ? (
            <div className={styles.emptyState}>
              <RefreshCw
                size={22}
                className="animate-spin"
                style={{ color: '#1b6343', marginBottom: 8, display: 'inline-block' }}
              />
              <div>Loading records...</div>
            </div>
          ) : filteredRows.length === 0 ? (
            <div className={styles.emptyState}>
              No ledger entries found for {selectedMonth} &bull; {selectedCrop}.
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
                  {editAmount > 0 && (
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1b6343', marginTop: 4 }}>
                      ₹ {editAmountDisplay} <span style={{ color: '#64748b', fontWeight: 400 }}>({numberToIndianWords(editAmount)})</span>
                    </div>
                  )}
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
      </div>
    </AppShell>
  );
}
