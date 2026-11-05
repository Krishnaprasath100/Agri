'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { AppShell } from '@/components/layout/AppShell';
import { ChoicePicker } from '@/components/forms/ChoicePicker';
import { DateField } from '@/components/forms/DateField';
import { CropStatusBadge } from '@/components/ui/CropStatusBadge';
import { GrowthTimeline } from '@/components/ui/GrowthTimeline';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { CropCycle, CropStatus, LandAreaUnit } from '@/types';
import { getCropCycles, saveCropCycle, deleteCropCycle } from '@/lib/services/dataService';
import { formatDate, getDaysRemaining } from '@/lib/utils';
import { validateCropCycleInput } from '@/lib/validation';
import {
  Sprout,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  Edit2,
  Trash2,
  Calendar,
  AlertCircle,
  MapPin,
  CheckCircle2,
  Clock,
  X,
} from 'lucide-react';
import styles from './crops.module.css';

const CROP_OPTIONS = [
  'Paddy (Rice)', 'Wheat', 'Maize', 'Cotton', 'Sugarcane', 'Banana', 'Tomato', 'Onion',
  'Potato', 'Chilli', 'Groundnut', 'Soybean', 'Millet', 'Turmeric', 'Coconut',
];

export default function CropsPage() {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const [crops, setCrops] = useState<CropCycle[]>([]);
  const [loading, setLoading] = useState(true);

  // Search, filter, and sort states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'seeding' | 'harvest'>('seeding');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modal states for Create/Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCrop, setEditingCrop] = useState<CropCycle | null>(null);
  const [formError, setFormError] = useState('');

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form inputs
  const [formData, setFormData] = useState({
    cropType: '',
    farmName: '',
    landArea: '',
    landAreaUnit: 'Acres' as LandAreaUnit,
    seedingDate: '',
    expectedHarvestDate: '',
    actualHarvestDate: '',
    status: 'Growing' as CropStatus,
    notes: '',
  });

  const loadCrops = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getCropCycles(user.uid);
      setCrops(data);
    } catch (err) {
      console.error('Failed to load crop cycles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCrops();
  }, [user]);

  const openCreateModal = () => {
    setEditingCrop(null);
    setFormData({
      cropType: '',
      farmName: '',
      landArea: '',
      landAreaUnit: 'Acres',
      seedingDate: '',
      expectedHarvestDate: '',
      actualHarvestDate: '',
      status: '' as CropStatus,
      notes: '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (crop: CropCycle) => {
    setEditingCrop(crop);
    setFormData({
      cropType: crop.cropType,
      farmName: crop.farmName || '',
      landArea: crop.landArea ? String(crop.landArea) : '',
      landAreaUnit: crop.landAreaUnit || 'Acres',
      seedingDate: crop.seedingDate,
      expectedHarvestDate: crop.expectedHarvestDate,
      actualHarvestDate: crop.actualHarvestDate || '',
      status: crop.status,
      notes: crop.notes || '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const validation = validateCropCycleInput(formData);
    if (!validation.isValid) {
      setFormError(validation.errors[0].message);
      return;
    }

    if (!user) return;

    await saveCropCycle({
      cropCycleId: editingCrop ? editingCrop.cropCycleId : undefined,
      userId: user.uid,
      cropType: formData.cropType,
      farmName: formData.farmName || undefined,
      landArea: formData.landArea ? Number(formData.landArea) : undefined,
      landAreaUnit: formData.landAreaUnit,
      seedingDate: formData.seedingDate,
      expectedHarvestDate: formData.expectedHarvestDate,
      actualHarvestDate: formData.actualHarvestDate || undefined,
      status: formData.status,
      notes: formData.notes || undefined,
    });

    setIsModalOpen(false);
    loadCrops();
  };

  const confirmDelete = async () => {
    if (!deleteId || !user) return;
    await deleteCropCycle(deleteId, user.uid);
    setDeleteId(null);
    loadCrops();
  };

  // Filter & Sort Logic
  const filteredCrops = crops
    .filter((c) => {
      const matchesSearch =
        c.cropType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.farmName && c.farmName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.notes && c.notes.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const dateA = sortBy === 'seeding' ? a.seedingDate : a.expectedHarvestDate;
      const dateB = sortBy === 'seeding' ? b.seedingDate : b.expectedHarvestDate;
      return sortOrder === 'asc' ? dateA.localeCompare(dateB) : dateB.localeCompare(dateA);
    });

  return (
    <AppShell>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('Plantings')}</h1>
          <p className="page-subtitle">
            {t("Keep each planting's income and expenses separate from sowing to harvest.")}
          </p>
        </div>

        <div className="header-actions">
          <button onClick={openCreateModal} className="btn btn-primary">
            <Plus size={16} /> {t('Add Planting')}
          </button>
        </div>
      </div>

      {/* Professional Filter and Search Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <Search size={17} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder={language === 'ta' ? 'நடவுகள், பயிர்கள், நிலங்களை தேடவும்...' : 'Search plantings, crops, plots...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className={styles.clearSearchBtn}
              onClick={() => setSearchQuery('')}
              title="Clear search"
              aria-label="Clear search"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Filter and Sort Controls */}
        <div className={styles.controlsGroup}>
          <div className={styles.filterWrapper}>
            <ChoicePicker
              ariaLabel="Crop status filter"
              value={statusFilter}
              placeholder={t('All Statuses')}
              onChange={setStatusFilter}
              options={[
                { value: 'ALL', label: t('All Statuses') },
                { value: 'Planned', label: t('Planned') },
                { value: 'Growing', label: t('Growing') },
                { value: 'Ready to Harvest', label: t('Ready to Harvest') },
                { value: 'Harvested', label: t('Harvested') },
              ]}
              className="choice-picker--compact"
            />
          </div>

          <div className={styles.sortGroup}>
            <span className={styles.sortLabel}>{t('Sort by:')}</span>
            <div className={styles.sortPickerWrapper}>
              <ChoicePicker
                ariaLabel="Sort crop list"
                value={sortBy}
                placeholder={t('Sort by:')}
                onChange={(value) => setSortBy(value as 'seeding' | 'harvest')}
                options={[
                  { value: 'seeding', label: t('Seeding Date') },
                  { value: 'harvest', label: t('Expected Harvest') },
                ]}
                className="choice-picker--compact"
              />
            </div>
            <button
              type="button"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className={styles.sortOrderBtn}
              title={`Sort order: ${sortOrder === 'asc' ? 'Ascending (oldest first)' : 'Descending (newest first)'}`}
              aria-label={`Toggle Sort Order (${sortOrder})`}
            >
              <ArrowUpDown size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Active filters / results summary */}
      {(searchQuery || statusFilter !== 'ALL') && (
        <div className={styles.resultsSummary}>
          <span>
            Showing <strong>{filteredCrops.length}</strong> of {crops.length} plantings
          </span>
          <button
            type="button"
            className={styles.resetFiltersLink}
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('ALL');
            }}
          >
            Reset filters
          </button>
        </div>
      )}

      {/* Crop Cycles Cards Grid */}
      {filteredCrops.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">
              <Sprout size={32} />
            </div>
            <div className="empty-state-title">No Crop Cycles Found</div>
            <p className="empty-state-text">
              {searchQuery || statusFilter !== 'ALL'
                ? 'Try adjusting your search query or status filter.'
                : 'Get started by creating your first planting.'}
            </p>
            <button onClick={openCreateModal} className="btn btn-primary">
              <Plus size={16} /> Add Planting
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.cropsGrid}>
          {filteredCrops.map((crop) => {
            const remaining = getDaysRemaining(crop.expectedHarvestDate);

            return (
              <div key={crop.cropCycleId} className={styles.cropCard}>
                {/* Header */}
                <div className={styles.cardHeader}>
                  <div className={styles.cropTitleGroup}>
                    <h3 className={styles.cropTitle} title={crop.cropType}>
                      {crop.cropType}
                    </h3>
                    <div className={styles.cropLocation}>
                      <MapPin size={13} color="var(--primary-600)" />
                      <span>{crop.farmName || 'General Land Plot'}</span>
                      {crop.landArea ? (
                        <span>• {crop.landArea} {crop.landAreaUnit}</span>
                      ) : null}
                    </div>
                  </div>

                  <div className={styles.cardActions}>
                    <CropStatusBadge status={crop.status} isOverdue={remaining.isOverdue} />
                    <button
                      type="button"
                      onClick={() => openEditModal(crop)}
                      className={styles.actionBtn}
                      title="Edit Crop Details"
                      aria-label={`Edit ${crop.cropType}`}
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteId(crop.cropCycleId)}
                      className={`${styles.actionBtn} ${styles.actionBtnDelete}`}
                      title="Delete Crop Cycle"
                      aria-label={`Delete ${crop.cropType}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Key Dates 2-Column Grid */}
                <div className={styles.keyDatesGrid}>
                  <div className={styles.keyDateCell}>
                    <span className={styles.keyDateLabel}>{t('Seeding Date')}</span>
                    <span className={styles.keyDateValue}>{formatDate(crop.seedingDate)}</span>
                  </div>
                  <div className={`${styles.keyDateCell} ${styles.keyDateCellRight}`}>
                    <span className={styles.keyDateLabel}>{t('Expected Harvest')}</span>
                    <span
                      className={`${styles.keyDateValue} ${
                        remaining.isOverdue && crop.status !== 'Harvested' ? styles.keyDateValueOverdue : ''
                      }`}
                    >
                      {formatDate(crop.expectedHarvestDate)}
                    </span>
                  </div>
                </div>

                {/* Growth Progress Timeline */}
                <GrowthTimeline crop={crop} />

                {/* Optional Notes */}
                {crop.notes && (
                  <div className={styles.notesCallout}>
                    <strong>Notes:</strong> {crop.notes}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCrop ? 'Edit Planting' : 'Add Planting'}
        subtitle="Choose the crop, plot, planting date, and cultivated land area."
        maxWidth="640px"
        contentClassName="planting-modal"
      >
        {formError && (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '0.85rem',
            }}
          >
            {formError}
          </div>
        )}

        <form onSubmit={handleSave} className="planting-form-box">
          <div className="form-group">
            <label className="form-label">Crop Name or Variety *</label>
            <ChoicePicker
              ariaLabel="Crop name"
              value={formData.cropType}
              placeholder="Choose a crop"
              onChange={(cropType) => setFormData({ ...formData, cropType })}
              allowCreate
              createPlaceholder="Type or search crop to add..."
              onCreate={(cropType) => setFormData({ ...formData, cropType })}
              options={[
                ...(formData.cropType && !CROP_OPTIONS.includes(formData.cropType)
                  ? [{ value: formData.cropType, label: formData.cropType, group: 'Custom Crop' }]
                  : []),
                ...CROP_OPTIONS.map((crop) => ({ value: crop, label: crop, group: 'Quick crop choices' })),
              ]}
            />
            <select
              className="form-input"
              style={{ display: 'none' }}
              value={formData.cropType}
              onChange={(e) => setFormData({ ...formData, cropType: e.target.value })}
              required
            >
              <option value="">Choose a crop</option>
              {CROP_OPTIONS.map((crop) => <option key={crop} value={crop}>{crop}</option>)}
            </select>
            <div style={{ color: 'var(--text-dim)', fontSize: '0.78rem', marginTop: '6px' }}>
              Choose a crop to create a planting. Add the specific variety in the notes.
            </div>
          </div>

          <div className="planting-form-grid planting-form-grid--area" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Field or Farm Plot Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="Choose or enter field / plot name"
                value={formData.farmName}
                onChange={(e) => setFormData({ ...formData, farmName: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Land Area & Unit</label>
              <div className="planting-area-row" style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="number"
                  step="0.1"
                  className="form-input"
                  placeholder="4.5"
                  value={formData.landArea}
                  onChange={(e) => setFormData({ ...formData, landArea: e.target.value })}
                />
                <div style={{ width: '110px', flexShrink: 0 }}>
                  <ChoicePicker ariaLabel="Land area unit" value={formData.landAreaUnit} placeholder="Unit" onChange={(landAreaUnit) => setFormData({ ...formData, landAreaUnit: landAreaUnit as LandAreaUnit })} options={['Acres', 'Hectares', 'Bigha', 'Guntha'].map((unit) => ({ value: unit, label: unit }))} />
                </div>
                <select
                  className="form-select"
                  style={{ display: 'none' }}
                  value={formData.landAreaUnit}
                  onChange={(e) => setFormData({ ...formData, landAreaUnit: e.target.value as any })}
                >
                  <option value="Acres">Acres</option>
                  <option value="Hectares">Hectares</option>
                  <option value="Bigha">Bigha</option>
                  <option value="Guntha">Guntha</option>
                </select>
              </div>
            </div>
          </div>

          <div className="planting-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Seeding Date *</label>
              <input
                type="hidden"
                value={formData.seedingDate}
                onChange={(e) => setFormData({ ...formData, seedingDate: e.target.value })}
                required
              />
              <DateField value={formData.seedingDate} onChange={(e) => setFormData({ ...formData, seedingDate: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Expected Harvest Date *</label>
              <input
                type="hidden"
                value={formData.expectedHarvestDate}
                onChange={(e) => setFormData({ ...formData, expectedHarvestDate: e.target.value })}
                required
              />
              <DateField value={formData.expectedHarvestDate} onChange={(e) => setFormData({ ...formData, expectedHarvestDate: e.target.value })} required />
            </div>
          </div>

          <div className="planting-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Current Status</label>
              <ChoicePicker ariaLabel="Planting status" value={formData.status} placeholder="Choose a status" onChange={(status) => setFormData({ ...formData, status: status as CropStatus })} options={['Planned', 'Growing', 'Ready to Harvest', 'Harvested'].map((status) => ({ value: status, label: status }))} />
              <select
                className="form-select"
                style={{ display: 'none' }}
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              >
                <option value="Planned">Planned</option>
                <option value="Growing">Growing</option>
                <option value="Ready to Harvest">Ready to Harvest</option>
                <option value="Harvested">Harvested</option>
              </select>
            </div>

            {formData.status === 'Harvested' && (
              <div className="form-group">
                <label className="form-label">Actual Harvest Date</label>
                <input
                  type="hidden"
                  value={formData.actualHarvestDate}
                  onChange={(e) => setFormData({ ...formData, actualHarvestDate: e.target.value })}
                />
                <DateField value={formData.actualHarvestDate} onChange={(e) => setFormData({ ...formData, actualHarvestDate: e.target.value })} />
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Notes & Field Observations</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="e.g. Soil testing completed; drip irrigation line 3 replaced."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingCrop ? 'Update Crop Cycle' : 'Save Crop Cycle'}
            </button>
          </div>
        </form>
      </Modal>

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        isOpen={Boolean(deleteId)}
        title="Delete Crop Cycle"
        message="Are you sure you want to remove this crop cycle? All associated growth records will be deleted."
        confirmLabel="Confirm Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </AppShell>
  );
}
