import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { estimationApi } from '../api/estimationApi';
import type { Estimation, EstimationItem } from '../types';
import { CandidateProductModal } from '../components/common/CandidateProductModal';
import { QuotationModal } from '../components/common/QuotationModal';
import { useToastStore } from '../store/useToastStore';
import { formatINR, formatDate } from '../utils/formatters';
import {
  UploadCloud,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ArrowRight,
  Download,
  Calendar,
  Layers,
  Clock,
  ShieldCheck,
  History,
  FileCheck,
  RefreshCw,
  Search,
  Filter,
  Check,
} from 'lucide-react';

export const EstimationsPage: React.FC = () => {
  const { id: routeId } = useParams<{ id?: string }>();
  const { showToast } = useToastStore();

  const [activeTab, setActiveTab] = useState<'estimator' | 'history'>('estimator');
  const [currentEstimation, setCurrentEstimation] = useState<Estimation | null>(null);
  const [historyList, setHistoryList] = useState<Estimation[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  // Upload & Progress States
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgressStep, setUploadProgressStep] = useState<number | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Resolution Modal State
  const [resolvingItem, setResolvingItem] = useState<EstimationItem | null>(null);
  const [isResolving, setIsResolving] = useState(false);

  // Quotation Modal State
  const [isQuotationModalOpen, setIsQuotationModalOpen] = useState(false);
  const [isGeneratingQuotation, setIsGeneratingQuotation] = useState(false);

  // Search & Filter in History
  const [historySearch, setHistorySearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load estimation if routeId present or load initial data
  useEffect(() => {
    if (routeId) {
      estimationApi.getEstimationById(routeId).then((data) => {
        setCurrentEstimation(data);
        setActiveTab('estimator');
      });
    } else {
      // Default to initial stored estimation
      estimationApi.getEstimationHistory(1, 10).then((res) => {
        setHistoryList(res.data);
        if (res.data.length > 0 && !currentEstimation) {
          setCurrentEstimation(res.data[0]);
        }
      });
    }
  }, [routeId]);

  // Load history when tab is clicked
  const loadHistory = async () => {
    setIsHistoryLoading(true);
    try {
      const res = await estimationApi.getEstimationHistory(1, 20);
      setHistoryList(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const handleTabChange = (tab: 'estimator' | 'history') => {
    setActiveTab(tab);
    if (tab === 'history') {
      loadHistory();
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      validateAndSetFile(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(pdf|jpe?g|png)$/i)) {
      showToast('error', 'Please upload a valid PDF, JPG, or PNG document.', 'Unsupported File');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      showToast('error', 'File size exceeds the 15MB limit.', 'File Too Large');
      return;
    }
    setSelectedFile(file);
  };

  // Execute AI Analysis Flow
  const handleAnalyzeRequirement = async (overrideFile?: File) => {
    const fileToUpload = overrideFile || selectedFile;
    if (!fileToUpload) {
      showToast('error', 'Please select or drop a requirement document first.', 'No Document');
      return;
    }

    setIsAnalyzing(true);
    setUploadProgressStep(1); // Uploading document to secure cloud storage

    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setUploadProgressStep(2); // AI extracting bill of quantities and specifications

      await new Promise((resolve) => setTimeout(resolve, 1100));
      setUploadProgressStep(3); // Matching items with live inventory & wholesale pricing

      await new Promise((resolve) => setTimeout(resolve, 900));

      const newEst = await estimationApi.uploadRequirementDocument(fileToUpload);
      setCurrentEstimation(newEst);
      setSelectedFile(null);
      setUploadProgressStep(null);
      setIsAnalyzing(false);
      showToast(
        'success',
        `Extracted ${newEst.items.length} items from ${fileToUpload.name}!`,
        'AI Estimation Complete'
      );
    } catch (err: any) {
      setIsAnalyzing(false);
      setUploadProgressStep(null);
      showToast('error', err.message || 'Failed to process document with AI.', 'Extraction Error');
    }
  };

  // Sample quick launcher for demonstration
  const handleLaunchSampleBOQ = (sampleName: string) => {
    const mockFile = new File(['%PDF-1.4 Mock BOQ Data'], sampleName, {
      type: 'application/pdf',
    });
    setSelectedFile(mockFile);
    handleAnalyzeRequirement(mockFile);
  };

  // Ambiguous resolution modal triggers
  const handleOpenResolveModal = (item: EstimationItem) => {
    setResolvingItem(item);
  };

  const handleConfirmResolve = async (productId: number | string) => {
    if (!currentEstimation || !resolvingItem) return;
    setIsResolving(true);
    try {
      const updated = await estimationApi.resolveCandidateItem(
        currentEstimation.id,
        resolvingItem.itemId,
        productId
      );
      setCurrentEstimation(updated);
      showToast('success', `Product resolved and line items recalculated!`, 'Specification Matched');
      setResolvingItem(null);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to resolve item.', 'Error');
    } finally {
      setIsResolving(false);
    }
  };

  // Generate Official Quotation
  const handleGenerateQuotation = async () => {
    if (!currentEstimation) return;
    setIsGeneratingQuotation(true);
    try {
      const res = await estimationApi.generateOfficialQuotation(currentEstimation.id);
      setCurrentEstimation(res.estimation);
      showToast(
        'success',
        `Quotation ${res.quotationNumber} generated! Prices locked for 15 days.`,
        'Quotation Ready'
      );
      setIsQuotationModalOpen(true);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to generate quotation.', 'Error');
    } finally {
      setIsGeneratingQuotation(false);
    }
  };

  // Filter history
  const filteredHistory = historyList.filter((item) => {
    const matchesSearch =
      item.estimationNumber.toLowerCase().includes(historySearch.toLowerCase()) ||
      item.fileName.toLowerCase().includes(historySearch.toLowerCase()) ||
      (item.projectNotes || '').toLowerCase().includes(historySearch.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const hasMultipleMatches = currentEstimation?.items.some((it) => it.status === 'MULTIPLE_MATCHES');
  const unresolvedItems = currentEstimation?.items.filter((it) => it.status === 'MULTIPLE_MATCHES') || [];
  const firstUnresolvedItem = unresolvedItems[0];

  return (
    <div className="max-w-[1720px] w-full mx-auto px-4 sm:px-8 lg:px-12 py-8 space-y-8">
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-industrial-950 via-slate-900 to-red-950 text-white p-8 sm:p-10 shadow-xl border border-white/10">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-brand-400 animate-pulse" />
              <span>HinchMart AI Engine</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-tight">
              AI Requirement Estimation & Instant Official Quotation
            </h1>
            <p className="text-xs sm:text-sm text-industrial-300 leading-relaxed">
              Upload structural engineering drawings, Bill of Quantities (BOQ), or hand-written procurement notes. Our AI extracts materials, matches live wholesale tiers, and locks official project quotations in seconds.
            </p>
          </div>

          {/* Navigation Mode Pill */}
          <div className="flex bg-white/10 p-1.5 rounded-2xl backdrop-blur-md border border-white/15 self-start lg:self-center shrink-0">
            <button
              onClick={() => handleTabChange('estimator')}
              className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                activeTab === 'estimator'
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30'
                  : 'text-industrial-300 hover:text-white'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>AI Estimator</span>
            </button>
            <button
              onClick={() => handleTabChange('history')}
              className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                activeTab === 'history'
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30'
                  : 'text-industrial-300 hover:text-white'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Estimation History</span>
            </button>
          </div>
        </div>

        {/* Ambient decorative glowing circle */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {activeTab === 'estimator' ? (
        <div className="space-y-8">
          {/* SCREEN 1: Upload Requirement Document Card */}
          <div className="bg-white rounded-3xl border border-industrial-200 p-6 sm:p-8 shadow-card space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-industrial-100">
              <div>
                <h2 className="text-lg font-black text-industrial-950 flex items-center gap-2">
                  <UploadCloud className="w-5 h-5 text-brand-600" />
                  <span>1. Upload Project Requirement Document</span>
                </h2>
                <p className="text-xs text-industrial-500 mt-0.5">
                  Accepts Bill of Quantities (BOQ), tender schedules, blueprints, or site requirement lists (.pdf, .jpg, .png up to 15MB).
                </p>
              </div>

              {/* Sample BOQ Launchers */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold text-industrial-400">Quick Test:</span>
                <button
                  type="button"
                  onClick={() => handleLaunchSampleBOQ('Structural_BOQ_Phase2_Towers.pdf')}
                  className="px-3 py-1 bg-industrial-100 hover:bg-industrial-200 text-industrial-800 text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                >
                  🏢 Sample BOQ: Towers Steel & Cement
                </button>
                <button
                  type="button"
                  onClick={() => handleLaunchSampleBOQ('Electrical_Plumbing_Schedule.png')}
                  className="px-3 py-1 bg-industrial-100 hover:bg-industrial-200 text-industrial-800 text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                >
                  ⚡ Sample Schedule: Wires & UPVC Pipes
                </button>
              </div>
            </div>

            {/* Drag & Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                isDragging
                  ? 'border-brand-600 bg-brand-50/50 scale-[1.01]'
                  : selectedFile
                  ? 'border-emerald-500 bg-emerald-50/30'
                  : 'border-industrial-300 hover:border-brand-500 hover:bg-industrial-50/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileInputChange}
                className="hidden"
              />

              {selectedFile ? (
                <div className="space-y-2">
                  <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                    <FileCheck className="w-7 h-7" />
                  </div>
                  <div className="font-black text-sm text-industrial-950">{selectedFile.name}</div>
                  <div className="text-xs text-industrial-500">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for AI extraction
                  </div>
                  <div className="text-[11px] text-brand-600 font-bold underline pt-1">
                    Click to choose a different file
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-14 h-14 bg-industrial-100 text-industrial-600 rounded-2xl flex items-center justify-center mx-auto">
                    <UploadCloud className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="font-extrabold text-sm text-industrial-950">
                      Drag & Drop your requirement file here
                    </span>
                    <span className="text-xs text-industrial-500 block mt-1">
                      or click to browse from your device
                    </span>
                  </div>
                  <div className="text-[10px] text-industrial-400 uppercase tracking-widest font-bold">
                    PDF • JPG • PNG • Max 15MB
                  </div>
                </div>
              )}
            </div>

            {/* Upload & Analyze Action Button */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2 text-xs text-industrial-500">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Protected by 256-bit encryption • Direct cloud upload to <code>POST /api/estimations/upload</code></span>
              </div>

              <button
                type="button"
                onClick={() => handleAnalyzeRequirement()}
                disabled={!selectedFile || isAnalyzing}
                className="px-8 py-3.5 bg-brand-600 hover:bg-brand-500 text-white rounded-2xl text-xs font-black shadow-lg shadow-brand-600/30 flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Analyzing Document...</span>
                  </>
                ) : (
                  <>
                    <span>Analyze Requirement</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            {/* Step-by-Step Progress Animation */}
            {isAnalyzing && uploadProgressStep && (
              <div className="p-4 bg-industrial-950 text-white rounded-2xl space-y-3 animate-in fade-in">
                <div className="text-xs font-bold text-brand-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                  <span>AI Processing Pipeline</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all ${
                    uploadProgressStep >= 1 ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300' : 'bg-white/5 border-white/10 text-industrial-400'
                  }`}>
                    {uploadProgressStep > 1 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <RefreshCw className="w-4 h-4 animate-spin text-brand-400 shrink-0" />
                    )}
                    <span>1. Uploading to secure cloud storage...</span>
                  </div>

                  <div className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all ${
                    uploadProgressStep >= 2 ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300' : 'bg-white/5 border-white/10 text-industrial-400'
                  }`}>
                    {uploadProgressStep > 2 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : uploadProgressStep === 2 ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-brand-400 shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-industrial-600 shrink-0" />
                    )}
                    <span>2. AI extracting BOQ & specs...</span>
                  </div>

                  <div className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all ${
                    uploadProgressStep >= 3 ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300' : 'bg-white/5 border-white/10 text-industrial-400'
                  }`}>
                    {uploadProgressStep === 3 ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-brand-400 shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-industrial-600 shrink-0" />
                    )}
                    <span>3. Matching inventory & bulk pricing...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SCREEN 2: Estimation Review & Item Matching */}
          {currentEstimation && (
            <div className="space-y-6 animate-in fade-in">
              {/* Header Card & Summary */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* Left: Estimation Meta Info (8 cols) */}
                <div className="lg:col-span-8 bg-white rounded-3xl border border-industrial-200 p-6 sm:p-8 shadow-card flex flex-col justify-between">
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-industrial-400 uppercase tracking-wider">
                          Estimation Number:
                        </span>
                        <span className="text-xl font-black text-industrial-950 font-mono">
                          {currentEstimation.estimationNumber}
                        </span>
                      </div>

                      {/* Status Badge */}
                      {currentEstimation.status === 'QUOTATION_GENERATED' ? (
                        <span className="px-3 py-1 rounded-full bg-brand-100 text-brand-800 font-bold text-xs flex items-center gap-1 border border-brand-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-brand-600" />
                          <span>QUOTATION_GENERATED</span>
                        </span>
                      ) : currentEstimation.status === 'RESOLVED' ? (
                        <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center gap-1 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>ALL ITEMS RESOLVED</span>
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 font-bold text-xs flex items-center gap-1 border border-amber-200">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          <span>REQUIREMENTS_EXTRACTED</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-industrial-500 mb-4">
                      <span className="flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-industrial-400" />
                        <span>Source: <strong>{currentEstimation.fileName}</strong> ({currentEstimation.fileSizeFormatted || '1.8 MB'})</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-industrial-400" />
                        <span>Extracted: {formatDate(currentEstimation.createdAt)}</span>
                      </span>
                    </div>

                    <div className="p-3.5 bg-industrial-50 rounded-2xl border border-industrial-150 text-xs text-industrial-700">
                      <span className="font-extrabold text-industrial-900 block mb-0.5">Project Notes:</span>
                      {currentEstimation.projectNotes || 'Automated AI extraction from uploaded procurement bill of quantities.'}
                    </div>
                  </div>

                  {/* Ambiguity notice banner */}
                  {hasMultipleMatches && (
                    <div className="mt-4 p-3.5 bg-amber-50 border border-amber-300 rounded-2xl text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-medium shadow-sm">
                      <div className="flex items-center gap-2.5">
                        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                        <div>
                          <span className="font-bold text-amber-950">
                            {unresolvedItems.length} line item{unresolvedItems.length > 1 ? 's have' : ' has'} multiple valid manufacturer choices.
                          </span>{' '}
                          Click to select the exact brand/grade (e.g., {firstUnresolvedItem?.requirementText}) before generating your quotation.
                        </div>
                      </div>
                      {firstUnresolvedItem && (
                        <button
                          type="button"
                          onClick={() => handleOpenResolveModal(firstUnresolvedItem)}
                          className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5 shadow-md shadow-amber-600/20 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                          <span>Choose Product</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Right: Summary Card (4 cols) */}
                <div className="lg:col-span-4 bg-gradient-to-br from-industrial-950 via-slate-900 to-industrial-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-white/10 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="text-xs font-bold text-brand-400 uppercase tracking-wider flex items-center justify-between">
                      <span>Estimation Summary</span>
                      <span className="text-[11px] text-industrial-400">{currentEstimation.items.length} Extracted Items</span>
                    </div>

                    <div className="space-y-2 pt-2 text-xs">
                      <div className="flex justify-between text-industrial-300">
                        <span>Taxable Subtotal</span>
                        <span className="font-mono text-white">{formatINR(currentEstimation.subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-emerald-400 font-bold">
                        <span className="flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          <span>Tier Savings</span>
                        </span>
                        <span className="font-mono">- {formatINR(currentEstimation.tierSavings)}</span>
                      </div>
                      <div className="flex justify-between text-industrial-300">
                        <span>GST Total (18%)</span>
                        <span className="font-mono text-white">{formatINR(currentEstimation.gstTotal)}</span>
                      </div>
                      <div className="border-t border-white/15 pt-2 flex justify-between items-baseline">
                        <span className="font-bold text-sm text-white">Grand Total</span>
                        <span className="text-2xl font-black text-brand-400 font-mono">
                          {formatINR(currentEstimation.grandTotal)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions in summary card */}
                  <div className="mt-6 pt-4 border-t border-white/10 space-y-2">
                    {currentEstimation.status === 'QUOTATION_GENERATED' ? (
                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={() => setIsQuotationModalOpen(true)}
                          className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all"
                        >
                          <Download className="w-4 h-4" />
                          <span>Download Quotation (PDF)</span>
                        </button>
                        <div className="text-[10px] text-center text-amber-300 flex items-center justify-center gap-1">
                          <Clock className="w-3 h-3 text-amber-400" />
                          <span>Prices locked until {currentEstimation.validUntil ? formatDate(currentEstimation.validUntil) : '15 days'}</span>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleGenerateQuotation}
                        disabled={isGeneratingQuotation}
                        className="w-full py-3.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-black shadow-lg shadow-brand-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                      >
                        {isGeneratingQuotation ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Generating Official Quotation...</span>
                          </>
                        ) : (
                          <>
                            <FileCheck className="w-4 h-4" />
                            <span>Generate Official Quotation</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Interactive Items Table */}
              <div className="bg-white rounded-3xl border border-industrial-200 shadow-card overflow-hidden">
                <div className="p-6 border-b border-industrial-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-extrabold text-industrial-950 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-brand-600" />
                      <span>Extracted Bill of Quantities (BOQ) & Catalog Matches</span>
                    </h3>
                    <p className="text-xs text-industrial-500 mt-0.5">
                      Review extracted line items. Ambiguous items can be resolved with verified catalog choices.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 text-[11px]">
                      <CheckCircle2 className="w-3 h-3" /> MATCHED
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold border border-amber-200 text-[11px]">
                      <AlertTriangle className="w-3 h-3" /> MULTIPLE_MATCHES
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold border border-slate-200 text-[11px]">
                      <HelpCircle className="w-3 h-3" /> NOT_FOUND
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-industrial-100/75 text-industrial-700 font-black text-[11px] uppercase tracking-wider border-b border-industrial-200">
                        <th className="py-3.5 px-4">Requirement Text</th>
                        <th className="py-3.5 px-3 text-center">Quantity</th>
                        <th className="py-3.5 px-4">Matched HinchMart Product</th>
                        <th className="py-3.5 px-3 text-right">Unit Price</th>
                        <th className="py-3.5 px-3">Bulk Tier Applied</th>
                        <th className="py-3.5 px-2 text-center">GST</th>
                        <th className="py-3.5 px-4 text-right">Line Total</th>
                        <th className="py-3.5 px-3 text-center">Match Status</th>
                        <th className="py-3.5 px-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-industrial-200 text-industrial-800">
                      {currentEstimation.items.map((item) => (
                        <tr key={item.itemId} className="hover:bg-industrial-50/50 transition-colors">
                          {/* Requirement Text */}
                          <td className="py-4 px-4 font-bold text-industrial-950">
                            <div>{item.requirementText}</div>
                          </td>

                          {/* Quantity */}
                          <td className="py-4 px-3 text-center font-mono font-bold">
                            {item.quantity} {item.unit}
                          </td>

                          {/* Matched Product */}
                          <td className="py-4 px-4">
                            {item.matchedProductTitle ? (
                              <div className="flex items-center gap-2.5">
                                {item.matchedProductImage && (
                                  <img
                                    src={item.matchedProductImage}
                                    alt={item.matchedProductTitle}
                                    className="w-10 h-10 object-cover rounded-lg border border-industrial-200 shrink-0"
                                  />
                                )}
                                <div>
                                  <div className="font-extrabold text-industrial-950 line-clamp-1">
                                    {item.matchedProductTitle}
                                  </div>
                                  <div className="text-[10px] text-industrial-500">
                                    Brand: <strong>{item.matchedProductBrand || 'Standard'}</strong>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <span className="text-industrial-400 italic">
                                {item.status === 'MULTIPLE_MATCHES'
                                  ? `${item.candidateProducts?.length || 3} options available`
                                  : 'No catalog match'}
                              </span>
                            )}
                          </td>

                          {/* Unit Price */}
                          <td className="py-4 px-3 text-right font-mono font-bold text-industrial-950">
                            {item.unitPrice > 0 ? formatINR(item.unitPrice) : '—'}
                          </td>

                          {/* Bulk Tier */}
                          <td className="py-4 px-3 text-[11px] text-emerald-700 font-semibold">
                            {item.appliedTier || '—'}
                          </td>

                          {/* GST */}
                          <td className="py-4 px-2 text-center font-mono text-industrial-500">
                            {item.unitPrice > 0 ? `${item.gstRate}%` : '—'}
                          </td>

                          {/* Line Total */}
                          <td className="py-4 px-4 text-right font-mono font-black text-industrial-950">
                            {item.lineTotal > 0 ? formatINR(item.lineTotal) : '—'}
                          </td>

                          {/* Status Badge */}
                          <td className="py-4 px-3 text-center">
                            {item.status === 'MATCHED' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 text-[11px]">
                                <Check className="w-3 h-3" /> MATCHED
                              </span>
                            ) : item.status === 'RESOLVED' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 font-bold border border-teal-200 text-[11px]">
                                <CheckCircle2 className="w-3 h-3" /> RESOLVED
                              </span>
                            ) : item.status === 'MULTIPLE_MATCHES' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-bold border border-amber-200 text-[11px]">
                                <AlertTriangle className="w-3 h-3" /> MULTIPLE_MATCHES
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-bold border border-slate-200 text-[11px]">
                                <HelpCircle className="w-3 h-3" /> NOT_FOUND
                              </span>
                            )}
                          </td>

                          {/* Action Button */}
                          <td className="py-4 px-4 text-center">
                            {item.status === 'MULTIPLE_MATCHES' ? (
                              <button
                                type="button"
                                onClick={() => handleOpenResolveModal(item)}
                                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                              >
                                Choose Product
                              </button>
                            ) : item.status === 'RESOLVED' ? (
                              <button
                                type="button"
                                onClick={() => handleOpenResolveModal(item)}
                                className="px-2.5 py-1 text-industrial-500 hover:text-industrial-900 text-[11px] font-bold underline"
                              >
                                Change
                              </button>
                            ) : (
                              <span className="text-industrial-300">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* SCREEN 5: Customer Estimation History */
        <div className="bg-white rounded-3xl border border-industrial-200 shadow-card p-6 sm:p-8 space-y-6 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-industrial-100">
            <div>
              <h2 className="text-lg font-black text-industrial-950 flex items-center gap-2">
                <History className="w-5 h-5 text-brand-600" />
                <span>Customer AI Estimation & Quotation History</span>
              </h2>
              <p className="text-xs text-industrial-500 mt-0.5">
                Review past bill of quantity uploads, lock-in price validity dates, and download official PDF tax quotations.
              </p>
            </div>

            {/* Filter and Search */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-industrial-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search quotation # or file..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="pl-9 pr-3 py-2 bg-industrial-50 border border-industrial-200 rounded-xl text-xs text-industrial-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <Filter className="w-4 h-4 text-industrial-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="py-2 px-3 bg-industrial-50 border border-industrial-200 rounded-xl text-xs font-bold text-industrial-800 focus:outline-none"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="QUOTATION_GENERATED">Quotation Generated</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="REQUIREMENTS_EXTRACTED">Requirements Extracted</option>
                </select>
              </div>
            </div>
          </div>

          {/* History Table */}
          {isHistoryLoading ? (
            <div className="p-12 text-center text-xs text-industrial-400">Loading estimation records...</div>
          ) : filteredHistory.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 bg-industrial-100 rounded-2xl flex items-center justify-center mx-auto text-industrial-400">
                <FileText className="w-6 h-6" />
              </div>
              <div className="text-sm font-bold text-industrial-950">No estimations match your filter</div>
              <div className="text-xs text-industrial-500">Upload a new document to start receiving instant AI quotations.</div>
            </div>
          ) : (
            <div className="overflow-x-auto border border-industrial-200 rounded-2xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-industrial-100/75 text-industrial-700 font-extrabold text-[11px] uppercase tracking-wider border-b border-industrial-200">
                    <th className="py-3.5 px-4">Estimation #</th>
                    <th className="py-3.5 px-4">Uploaded Document Name</th>
                    <th className="py-3.5 px-3 text-center">Items</th>
                    <th className="py-3.5 px-4 text-right">Grand Total</th>
                    <th className="py-3.5 px-3 text-center">Status</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-industrial-200 text-industrial-800">
                  {filteredHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-industrial-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-industrial-950">
                        {item.estimationNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-industrial-950 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-brand-600 shrink-0" />
                          <span className="truncate max-w-xs">{item.fileName}</span>
                        </div>
                        {item.quotationNumber && (
                          <div className="text-[10px] text-emerald-700 font-mono mt-0.5">
                            Quotation: {item.quotationNumber}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-center font-bold font-mono">
                        {item.itemsCount || item.items.length} Items
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-black text-industrial-950">
                        {formatINR(item.grandTotal)}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        {item.status === 'QUOTATION_GENERATED' ? (
                          <span className="px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 font-bold border border-brand-200 text-[10px]">
                            QUOTATION_GENERATED
                          </span>
                        ) : item.status === 'RESOLVED' ? (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 text-[10px]">
                            RESOLVED
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-bold border border-amber-200 text-[10px]">
                            REQUIREMENTS_EXTRACTED
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-industrial-500 font-mono text-[11px]">
                        {formatDate(item.createdAt)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setCurrentEstimation(item);
                              setActiveTab('estimator');
                            }}
                            className="px-3 py-1 bg-industrial-100 hover:bg-industrial-200 text-industrial-900 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                          >
                            Review
                          </button>
                          {item.status === 'QUOTATION_GENERATED' && (
                            <button
                              type="button"
                              onClick={() => {
                                setCurrentEstimation(item);
                                setIsQuotationModalOpen(true);
                              }}
                              className="px-3 py-1 bg-brand-50 hover:bg-brand-100 text-brand-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>PDF</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Screen 3: Candidate Resolution Modal */}
      <CandidateProductModal
        isOpen={Boolean(resolvingItem)}
        item={resolvingItem}
        onClose={() => setResolvingItem(null)}
        onConfirmMatch={handleConfirmResolve}
        isSubmitting={isResolving}
      />

      {/* Screen 4 & 7: Official Quotation Modal & PDF Downloader */}
      <QuotationModal
        isOpen={isQuotationModalOpen}
        estimation={currentEstimation}
        onClose={() => setIsQuotationModalOpen(false)}
        onDownloadPdf={async () => {
          if (!currentEstimation) return;
          try {
            await estimationApi.downloadQuotationPdf(currentEstimation.id);
            showToast('success', 'Quotation PDF downloaded to your device.', 'PDF Export');
          } catch (err: any) {
            showToast('error', err?.message || 'Failed to download quotation PDF', 'PDF Error');
          }
        }}
      />
    </div>
  );
};
