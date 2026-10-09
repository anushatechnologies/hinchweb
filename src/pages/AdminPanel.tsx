import React, { useState, useEffect, useRef } from 'react';
import { productApi } from '../api/productApi';
import { categoryApi } from '../api/categoryApi';
import { subcategoryApi } from '../api/subcategoryApi';
import { customerApi } from '../api/customerApi';
import { kycApi } from '../api/kycApi';
import { bannerApi } from '../api/bannerApi';
import { brandApi } from '../api/brandApi';
import { uploadApi } from '../api/uploadApi';
import { useToastStore } from '../store/useToastStore';
import type {
  Product,
  Category,
  Subcategory,
  Customer,
  KYCDocument,
  Banner,
  Brand,
} from '../types';
import {
  Package,
  Layers,
  Users,
  ShieldCheck,
  Image,
  Tag,
  CheckCircle2,
  XCircle,
  Trash2,
  Edit,
  Plus,
  Eye,
  RefreshCw,
  AlertTriangle,
  Upload,
  X,
  Building2,
} from 'lucide-react';

type AdminTab = 'products' | 'categories' | 'subcategories' | 'customers' | 'kyc' | 'banners' | 'brands';

export const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('products');
  const { showToast } = useToastStore();

  // ── Products ──────────────────────────────────────────────────────
  const [products, setProducts] = useState<Product[]>([]);
  const [pendingProducts, setPendingProducts] = useState<Product[]>([]);
  const [productView, setProductView] = useState<'all' | 'pending'>('all');
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  // ── Categories ────────────────────────────────────────────────────
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCats, setLoadingCats] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('Building');
  const [editCat, setEditCat] = useState<Category | null>(null);

  // ── Subcategories ─────────────────────────────────────────────────
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [newSubName, setNewSubName] = useState('');
  const [newSubCatId, setNewSubCatId] = useState<number | ''>('');
  const [editSub, setEditSub] = useState<Subcategory | null>(null);

  // ── Customers ─────────────────────────────────────────────────────
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  // ── KYC ───────────────────────────────────────────────────────────
  const [kycDocs, setKycDocs] = useState<KYCDocument[]>([]);
  const [loadingKyc, setLoadingKyc] = useState(false);
  const [kycRejectReason, setKycRejectReason] = useState('');
  const [rejectingKycId, setRejectingKycId] = useState<string | null>(null);

  // ── Banners ───────────────────────────────────────────────────────
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loadingBanners, setLoadingBanners] = useState(false);
  const [newBannerTitle, setNewBannerTitle] = useState('');
  const [newBannerSubtitle, setNewBannerSubtitle] = useState('');
  const [newBannerUrl, setNewBannerUrl] = useState('');
  const [newBannerTarget, setNewBannerTarget] = useState('/catalog');
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const bannerFileRef = useRef<HTMLInputElement>(null);

  // ── Brands ────────────────────────────────────────────────────────
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loadingBrands, setLoadingBrands] = useState(false);

  // ── Product Modals & Inspect ─────────────────────────────────────
  const [isCreateProductOpen, setIsCreateProductOpen] = useState(false);
  const [newProdTitle, setNewProdTitle] = useState('');
  const [newProdPrice, setNewProdPrice] = useState(1000);
  const [newProdCatId] = useState<number>(1);
  const [newProdSubId] = useState<number>(1);
  const [newProdBrand, setNewProdBrand] = useState('Tata Steel');
  const [newProdUnit, setNewProdUnit] = useState('MT');
  const [newProdMoq, setNewProdMoq] = useState(1);
  const [newProdStock, setNewProdStock] = useState(100);
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdImage, setNewProdImage] = useState('');

  const [selectedAdminProduct, setSelectedAdminProduct] = useState<Product | null>(null);

  // ── Customer Modals & Inspect ────────────────────────────────────
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustCompany, setNewCustCompany] = useState('');
  const [newCustGstin, setNewCustGstin] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // ─────────────────────────────── Loaders ─────────────────────────

  const loadProducts = async () => {
    setLoadingProducts(true);
    try {
      const [all, pending] = await Promise.all([
        productApi.getAdminProducts(),
        productApi.getAdminPendingProducts(),
      ]);
      setProducts(all);
      setPendingProducts(pending);
    } catch (err) {
      console.error(err);
      showToast('error', 'Failed to load products', 'Error');
    } finally {
      setLoadingProducts(false);
    }
  };

  const loadCategories = async () => {
    setLoadingCats(true);
    try {
      const cats = await categoryApi.getCategories({ includeSubcategories: false });
      setCategories(cats);
    } catch {
      showToast('error', 'Failed to load categories', 'Error');
    } finally {
      setLoadingCats(false);
    }
  };

  const loadSubcategories = async () => {
    setLoadingSubs(true);
    try {
      const subs = await subcategoryApi.getSubcategories();
      setSubcategories(subs);
    } catch {
      showToast('error', 'Failed to load subcategories', 'Error');
    } finally {
      setLoadingSubs(false);
    }
  };

  const loadCustomers = async () => {
    setLoadingCustomers(true);
    try {
      const data = await customerApi.getCustomers();
      setCustomers(data);
    } catch {
      showToast('error', 'Failed to load customers', 'Error');
    } finally {
      setLoadingCustomers(false);
    }
  };

  const loadKyc = async () => {
    setLoadingKyc(true);
    try {
      // Load KYC for all customers (admin view shows all)
      const docs = await kycApi.getDocuments(0); // 0 = admin: all docs
      setKycDocs(docs);
    } catch {
      showToast('error', 'Failed to load KYC documents', 'Error');
    } finally {
      setLoadingKyc(false);
    }
  };

  const loadBanners = async () => {
    setLoadingBanners(true);
    try {
      const data = await bannerApi.getBanners(false); // false = all banners incl inactive
      setBanners(data);
    } catch {
      showToast('error', 'Failed to load banners', 'Error');
    } finally {
      setLoadingBanners(false);
    }
  };

  const loadBrands = async () => {
    setLoadingBrands(true);
    try {
      const data = await brandApi.getBrands();
      setBrands(data);
    } catch {
      showToast('error', 'Failed to load brands', 'Error');
    } finally {
      setLoadingBrands(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'products') loadProducts();
    else if (activeTab === 'categories') loadCategories();
    else if (activeTab === 'subcategories') { loadSubcategories(); loadCategories(); }
    else if (activeTab === 'customers') loadCustomers();
    else if (activeTab === 'kyc') loadKyc();
    else if (activeTab === 'banners') loadBanners();
    else if (activeTab === 'brands') loadBrands();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // ─────────────────────────────── Actions ─────────────────────────

  // Products
  const handleApproveProduct = async (id: string) => {
    try {
      await productApi.approveProduct(id);
      setPendingProducts((p) => p.filter((x) => x.id !== id));
      showToast('success', 'Product approved successfully', 'Approved');
    } catch {
      showToast('error', 'Failed to approve product', 'Error');
    }
  };

  const handleRejectProduct = async (id: string) => {
    if (!rejectReason.trim()) {
      showToast('error', 'Please provide a rejection reason', 'Reason Required');
      return;
    }
    try {
      await productApi.rejectProduct(id, rejectReason);
      setPendingProducts((p) => p.filter((x) => x.id !== id));
      setRejectingId(null);
      setRejectReason('');
      showToast('success', 'Product rejected', 'Rejected');
    } catch {
      showToast('error', 'Failed to reject product', 'Error');
    }
  };

  const handleToggleProduct = async (product: Product) => {
    try {
      if (product.active) {
        await productApi.deactivateProduct(product.id);
        showToast('info', `Product "${product.title}" deactivated`, 'Deactivated');
      } else {
        await productApi.activateProduct(product.id);
        showToast('success', `Product "${product.title}" activated`, 'Activated');
      }
      setProducts((p) => p.map((x) => x.id === product.id ? { ...x, active: !x.active } : x));
    } catch {
      showToast('error', 'Failed to update product status', 'Error');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('Delete this product permanently?')) return;
    try {
      await productApi.deleteProduct(id);
      setProducts((p) => p.filter((x) => x.id !== id));
      showToast('success', 'Product deleted', 'Deleted');
    } catch {
      showToast('error', 'Failed to delete product', 'Error');
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdTitle.trim()) return;
    try {
      const created = await productApi.createProduct({
        title: newProdTitle.trim(),
        price: Number(newProdPrice),
        categoryId: Number(newProdCatId),
        subcategoryId: Number(newProdSubId),
        brand: newProdBrand,
        unit: newProdUnit,
        moq: Number(newProdMoq),
        stockQty: Number(newProdStock),
        description: newProdDesc || `${newProdTitle} industrial material`,
        imageUrl: newProdImage || 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&auto=format&fit=crop&q=80',
        gstRate: 18,
      });
      setProducts((p) => [created, ...p]);
      setIsCreateProductOpen(false);
      setNewProdTitle('');
      showToast('success', `Product "${created.title}" created successfully`, 'Product Created');
    } catch {
      showToast('error', 'Failed to create product', 'Error');
    }
  };

  const handleViewAdminProduct = async (id: string | number) => {
    try {
      const prod = await productApi.getAdminProductById(id);
      setSelectedAdminProduct(prod);
    } catch {
      const fallback = products.find((p) => p.id === String(id));
      if (fallback) setSelectedAdminProduct(fallback);
      else showToast('error', 'Failed to load product details', 'Error');
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdminProduct) return;
    try {
      const updated = await productApi.updateProduct(selectedAdminProduct.id, {
        title: selectedAdminProduct.title,
        price: selectedAdminProduct.price,
        description: selectedAdminProduct.description,
      });
      setProducts((p) => p.map((x) => x.id === updated.id ? updated : x));
      setSelectedAdminProduct(null);
      showToast('success', 'Product details saved', 'Updated');
    } catch {
      showToast('error', 'Failed to update product', 'Error');
    }
  };

  const handleStartEditCategory = async (cat: Category) => {
    try {
      const detailed = await categoryApi.getCategoryById(cat.categoryId);
      setEditCat(detailed);
    } catch {
      setEditCat(cat);
    }
  };

  const handleStartEditSubcategory = async (sub: Subcategory) => {
    try {
      const detailed = await subcategoryApi.getSubcategoryById(sub.subcategoryId);
      setEditSub(detailed);
    } catch {
      setEditSub(sub);
    }
  };


  // Categories
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      const cat = await categoryApi.createCategory({
        name: newCatName.trim(),
        iconName: newCatIcon || 'Building',
        description: `Industrial ${newCatName.trim()} products`,
        active: true,
        sortOrder: 1,
      });
      setCategories((p) => [...p, cat]);
      setNewCatName('');
      showToast('success', `Category "${cat.name}" created`, 'Created');
    } catch {
      showToast('error', 'Failed to create category', 'Error');
    }
  };

  const handleUpdateCategory = async () => {
    if (!editCat) return;
    try {
      const updated = await categoryApi.updateCategory(editCat.categoryId, {
        name: editCat.name,
        iconName: editCat.iconName,
      });
      setCategories((p) => p.map((c) => c.categoryId === updated.categoryId ? updated : c));
      setEditCat(null);
      showToast('success', 'Category updated', 'Updated');
    } catch {
      showToast('error', 'Failed to update category', 'Error');
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!window.confirm('Delete this category? This will affect all products in it.')) return;
    try {
      await categoryApi.deleteCategory(id);
      setCategories((p) => p.filter((c) => c.categoryId !== id));
      showToast('success', 'Category deleted', 'Deleted');
    } catch {
      showToast('error', 'Failed to delete category', 'Error');
    }
  };

  // Subcategories
  const handleCreateSubcategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubName.trim() || !newSubCatId) {
      showToast('error', 'Name and category are required', 'Missing Fields');
      return;
    }
    try {
      const sub = await subcategoryApi.createSubcategory({
        name: newSubName.trim(),
        categoryId: Number(newSubCatId),
        active: true,
        sortOrder: 1,
      });
      setSubcategories((p) => [...p, sub]);
      setNewSubName('');
      setNewSubCatId('');
      showToast('success', `Subcategory "${sub.name}" created`, 'Created');
    } catch {
      showToast('error', 'Failed to create subcategory', 'Error');
    }
  };

  const handleUpdateSubcategory = async () => {
    if (!editSub) return;
    try {
      const updated = await subcategoryApi.updateSubcategory(editSub.subcategoryId, {
        name: editSub.name,
      });
      setSubcategories((p) => p.map((s) => s.subcategoryId === updated.subcategoryId ? updated : s));
      setEditSub(null);
      showToast('success', 'Subcategory updated', 'Updated');
    } catch {
      showToast('error', 'Failed to update subcategory', 'Error');
    }
  };

  const handleDeleteSubcategory = async (id: number) => {
    if (!window.confirm('Delete this subcategory?')) return;
    try {
      await subcategoryApi.deleteSubcategory(id);
      setSubcategories((p) => p.filter((s) => s.subcategoryId !== id));
      showToast('success', 'Subcategory deleted', 'Deleted');
    } catch {
      showToast('error', 'Failed to delete subcategory', 'Error');
    }
  };

  // Customers
  const handleDeleteCustomer = async (id: string | number) => {
    if (!window.confirm('Delete this customer account?')) return;
    try {
      await customerApi.deleteCustomer(id);
      setCustomers((p) => p.filter((c) => String(c.id) !== String(id)));
      showToast('success', 'Customer deleted', 'Deleted');
    } catch {
      showToast('error', 'Failed to delete customer', 'Error');
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim() || !newCustEmail.trim()) {
      showToast('error', 'Customer name and email are required', 'Missing Fields');
      return;
    }
    try {
      const created = await customerApi.createCustomer({
        name: newCustName.trim(),
        email: newCustEmail.trim(),
        phone: newCustPhone.trim(),
        companyName: newCustCompany.trim(),
        gstin: newCustGstin.trim(),
        status: 'ACTIVE',
        creditLimit: 500000,
      });
      setCustomers((p) => [created, ...p]);
      setIsAddCustomerOpen(false);
      setNewCustName('');
      setNewCustEmail('');
      setNewCustPhone('');
      setNewCustCompany('');
      setNewCustGstin('');
      showToast('success', `Customer ${created.name} registered`, 'Created');
    } catch {
      showToast('error', 'Failed to create customer', 'Error');
    }
  };

  const handleViewCustomer = async (id: string | number) => {
    try {
      const detailed = await customerApi.getCustomerById(id);
      setSelectedCustomer(detailed);
    } catch {
      const fallback = customers.find((c: any) => String(c.id || c.customerId) === String(id));
      if (fallback) setSelectedCustomer(fallback);
      else showToast('error', 'Customer not found', 'Error');
    }
  };

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    try {
      const custId = (selectedCustomer as any).id || (selectedCustomer as any).customerId;
      const updated = await customerApi.updateCustomer(custId, {
        name: selectedCustomer.name,
        companyName: selectedCustomer.companyName,
        phone: selectedCustomer.phone,
        status: selectedCustomer.status,
      });
      setCustomers((p) => p.map((c: any) => (String(c.id || c.customerId) === String(custId)) ? updated : c));
      setSelectedCustomer(null);
      showToast('success', 'Customer record updated', 'Updated');
    } catch {
      showToast('error', 'Failed to update customer', 'Error');
    }
  };

  // KYC
  const handleVerifyKyc = async (docId: string | number) => {
    try {
      await kycApi.verifyDocument(docId);
      setKycDocs((p) => p.map((d) => String(d.id) === String(docId) ? { ...d, status: 'VERIFIED' } : d));
      showToast('success', 'Document verified', 'Verified');
    } catch {
      showToast('error', 'Failed to verify document', 'Error');
    }
  };

  const handleRejectKyc = async (docId: string | number) => {
    if (!kycRejectReason.trim()) {
      showToast('error', 'Please provide a rejection reason', 'Reason Required');
      return;
    }
    try {
      await kycApi.rejectDocument(docId, kycRejectReason);
      setKycDocs((p) => p.map((d) => String(d.id) === String(docId) ? { ...d, status: 'REJECTED' } : d));
      setRejectingKycId(null);
      setKycRejectReason('');
      showToast('info', 'Document rejected', 'Rejected');
    } catch {
      showToast('error', 'Failed to reject document', 'Error');
    }
  };

  // Banners
  const handleCreateBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBannerTitle.trim()) return;
    try {
      let imageUrl = newBannerUrl;

      // Upload file first if selected
      if (bannerFile) {
        const uploaded = await uploadApi.uploadFile(bannerFile, 'banner');
        imageUrl = uploaded.url || uploaded.fileUrl || imageUrl;
      }

      const banner = await bannerApi.createBanner({
        title: newBannerTitle.trim(),
        subtitle: newBannerSubtitle.trim(),
        imageUrl,
        targetUrl: newBannerTarget || '/catalog',
        active: true,
        sortOrder: banners.length + 1,
      });

      // Upload image to banner if we have a file but didn't upload yet
      if (bannerFile && !imageUrl) {
        await bannerApi.uploadBannerImage(banner.bannerId!, bannerFile);
      }

      setBanners((p) => [...p, banner]);
      setNewBannerTitle('');
      setNewBannerSubtitle('');
      setNewBannerUrl('');
      setNewBannerTarget('/catalog');
      setBannerFile(null);
      showToast('success', `Banner "${banner.title}" created`, 'Created');
    } catch {
      showToast('error', 'Failed to create banner', 'Error');
    }
  };

  // ─────────────────────────────── Tab Config ───────────────────────

  const tabs: { id: AdminTab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'products', label: 'Products', icon: <Package size={16} />, count: products.length },
    { id: 'categories', label: 'Categories', icon: <Layers size={16} />, count: categories.length },
    { id: 'subcategories', label: 'Subcategories', icon: <Tag size={16} />, count: subcategories.length },
    { id: 'customers', label: 'Customers', icon: <Users size={16} />, count: customers.length },
    { id: 'kyc', label: 'KYC Review', icon: <ShieldCheck size={16} />, count: kycDocs.filter(d => d.status === 'PENDING').length },
    { id: 'banners', label: 'Banners', icon: <Image size={16} />, count: banners.length },
    { id: 'brands', label: 'Brands', icon: <Building2 size={16} />, count: brands.length },
  ];

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      APPROVED: 'bg-emerald-100 text-emerald-700',
      PENDING: 'bg-amber-100 text-amber-700',
      REJECTED: 'bg-red-100 text-red-700',
      VERIFIED: 'bg-emerald-100 text-emerald-700',
      ACTIVE: 'bg-emerald-100 text-emerald-700',
      INACTIVE: 'bg-slate-100 text-slate-500',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${map[status?.toUpperCase()] || 'bg-slate-100 text-slate-500'}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-industrial-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-industrial-900 text-white px-6 py-6">
        <h1 className="text-2xl font-black tracking-tight">Admin Panel</h1>
        <p className="text-xs text-slate-400 mt-1">Manage products, categories, customers, KYC & banners</p>
      </div>

      {/* Tab Bar */}
      <div className="bg-white border-b border-industrial-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto py-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-brand-600 text-white shadow-lg shadow-brand-200'
                    : 'text-industrial-500 hover:bg-industrial-50 hover:text-industrial-900'
                }`}
              >
                {tab.icon}
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-industrial-100 text-industrial-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* ──── PRODUCTS ──────────────────────────────────────────── */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            {/* Sub-tab */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setProductView('all')}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${productView === 'all' ? 'bg-brand-600 text-white' : 'bg-white border border-industrial-200 text-industrial-600'}`}
              >
                All Products ({products.length})
              </button>
              <button
                onClick={() => setProductView('pending')}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${productView === 'pending' ? 'bg-amber-500 text-white' : 'bg-white border border-industrial-200 text-industrial-600'}`}
              >
                Pending Approval ({pendingProducts.length})
              </button>
              <button
                onClick={() => setIsCreateProductOpen(true)}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition-all shadow-sm"
              >
                <Plus size={14} /> New Product
              </button>
              <button onClick={loadProducts} className="ml-auto p-2 rounded-lg hover:bg-industrial-100 transition-colors" title="Refresh">
                <RefreshCw size={14} className={loadingProducts ? 'animate-spin text-brand-600' : 'text-industrial-500'} />
              </button>
            </div>

            {loadingProducts ? (
              <div className="flex items-center justify-center py-20 text-industrial-400">
                <RefreshCw size={24} className="animate-spin" />
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-industrial-100 overflow-hidden shadow-sm">
                <table className="w-full text-xs">
                  <thead className="bg-industrial-50 border-b border-industrial-100">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold text-industrial-600">Product</th>
                      <th className="text-left px-4 py-3 font-semibold text-industrial-600">Category</th>
                      <th className="text-right px-4 py-3 font-semibold text-industrial-600">Price</th>
                      <th className="text-center px-4 py-3 font-semibold text-industrial-600">Status</th>
                      <th className="text-right px-4 py-3 font-semibold text-industrial-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-industrial-50">
                    {(productView === 'all' ? products : pendingProducts).map((product) => (
                      <tr key={product.id} className="hover:bg-industrial-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {product.imageUrl && (
                              <img src={product.imageUrl} alt={product.title} className="w-10 h-10 rounded-lg object-cover border border-industrial-100" />
                            )}
                            <div>
                              <p className="font-semibold text-industrial-900 line-clamp-1">{product.title}</p>
                              <p className="text-industrial-400">SKU: {product.sku}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-industrial-600">
                          {product.categoryName || product.category}
                          {product.subcategoryName && <span className="text-industrial-400"> / {product.subcategoryName}</span>}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-semibold text-industrial-900">
                          ₹{product.price.toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {statusBadge(product.approvalStatus || (product.active ? 'ACTIVE' : 'INACTIVE'))}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            {productView === 'pending' ? (
                              <>
                                <button
                                  onClick={() => handleApproveProduct(product.id)}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-semibold"
                                >
                                  <CheckCircle2 size={12} /> Approve
                                </button>
                                {rejectingId === product.id ? (
                                  <div className="flex items-center gap-2">
                                    <input
                                      value={rejectReason}
                                      onChange={(e) => setRejectReason(e.target.value)}
                                      placeholder="Reason..."
                                      className="border border-red-200 rounded-lg px-2 py-1 text-xs w-40"
                                    />
                                    <button
                                      onClick={() => handleRejectProduct(product.id)}
                                      className="px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold text-xs"
                                    >
                                      Confirm
                                    </button>
                                    <button onClick={() => setRejectingId(null)} className="text-industrial-400 hover:text-industrial-600">
                                      <X size={14} />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setRejectingId(product.id)}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-500 hover:text-white transition-colors font-semibold"
                                  >
                                    <XCircle size={12} /> Reject
                                  </button>
                                )}
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleToggleProduct(product)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                    product.active
                                      ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                      : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                  }`}
                                >
                                  {product.active ? 'Deactivate' : 'Activate'}
                                </button>
                                <button
                                  onClick={() => handleViewAdminProduct(product.id)}
                                  className="p-1.5 text-industrial-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                                  title="Inspect / Edit Product Details"
                                >
                                  <Eye size={14} />
                                </button>
                                <button
                                  onClick={() => handleDeleteProduct(product.id)}
                                  className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {(productView === 'all' ? products : pendingProducts).length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-12 text-center text-industrial-400">
                          No products found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Create Product Modal */}
            {isCreateProductOpen && (
              <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
                  <div className="flex items-center justify-between border-b pb-3">
                    <h3 className="font-bold text-base text-industrial-900">Create New Catalog Product</h3>
                    <button onClick={() => setIsCreateProductOpen(false)} className="text-industrial-400 hover:text-industrial-600">
                      <X size={18} />
                    </button>
                  </div>
                  <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
                    <div>
                      <label className="block font-semibold text-industrial-700 mb-1">Product Title *</label>
                      <input
                        required
                        value={newProdTitle}
                        onChange={(e) => setNewProdTitle(e.target.value)}
                        placeholder="e.g. Fe 550D TMT Rebars 12mm"
                        className="w-full p-2.5 bg-industrial-50 border rounded-xl"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-industrial-700 mb-1">Price (₹) *</label>
                        <input
                          type="number"
                          required
                          value={newProdPrice}
                          onChange={(e) => setNewProdPrice(Number(e.target.value))}
                          className="w-full p-2.5 bg-industrial-50 border rounded-xl font-mono"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-industrial-700 mb-1">Brand</label>
                        <input
                          value={newProdBrand}
                          onChange={(e) => setNewProdBrand(e.target.value)}
                          className="w-full p-2.5 bg-industrial-50 border rounded-xl"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block font-semibold text-industrial-700 mb-1">Unit</label>
                        <input
                          value={newProdUnit}
                          onChange={(e) => setNewProdUnit(e.target.value)}
                          className="w-full p-2.5 bg-industrial-50 border rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-industrial-700 mb-1">MOQ</label>
                        <input
                          type="number"
                          value={newProdMoq}
                          onChange={(e) => setNewProdMoq(Number(e.target.value))}
                          className="w-full p-2.5 bg-industrial-50 border rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-industrial-700 mb-1">Stock Qty</label>
                        <input
                          type="number"
                          value={newProdStock}
                          onChange={(e) => setNewProdStock(Number(e.target.value))}
                          className="w-full p-2.5 bg-industrial-50 border rounded-xl"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block font-semibold text-industrial-700 mb-1">Image URL</label>
                      <input
                        value={newProdImage}
                        onChange={(e) => setNewProdImage(e.target.value)}
                        placeholder="https://images.unsplash.com/..."
                        className="w-full p-2.5 bg-industrial-50 border rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-industrial-700 mb-1">Description</label>
                      <textarea
                        rows={2}
                        value={newProdDesc}
                        onChange={(e) => setNewProdDesc(e.target.value)}
                        placeholder="High-grade structural construction steel..."
                        className="w-full p-2.5 bg-industrial-50 border rounded-xl"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-2 border-t">
                      <button
                        type="button"
                        onClick={() => setIsCreateProductOpen(false)}
                        className="px-4 py-2 text-industrial-600 font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl"
                      >
                        Create Product
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Inspect / Edit Product Modal */}
            {selectedAdminProduct && (
              <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
                  <div className="flex items-center justify-between border-b pb-3">
                    <h3 className="font-bold text-base text-industrial-900">Admin Product Details</h3>
                    <button onClick={() => setSelectedAdminProduct(null)} className="text-industrial-400 hover:text-industrial-600">
                      <X size={18} />
                    </button>
                  </div>
                  <form onSubmit={handleUpdateProduct} className="space-y-3 text-xs">
                    <div>
                      <label className="block font-semibold text-industrial-700 mb-1">Title</label>
                      <input
                        value={selectedAdminProduct.title}
                        onChange={(e) => setSelectedAdminProduct({ ...selectedAdminProduct, title: e.target.value })}
                        className="w-full p-2.5 bg-industrial-50 border rounded-xl font-semibold text-industrial-900"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-industrial-700 mb-1">Price (₹)</label>
                        <input
                          type="number"
                          value={selectedAdminProduct.price}
                          onChange={(e) => setSelectedAdminProduct({ ...selectedAdminProduct, price: Number(e.target.value) })}
                          className="w-full p-2.5 bg-industrial-50 border rounded-xl font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-industrial-700 mb-1">SKU</label>
                        <input
                          disabled
                          value={selectedAdminProduct.sku || 'AUTO-GENERATED'}
                          className="w-full p-2.5 bg-industrial-100 border rounded-xl font-mono text-industrial-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block font-semibold text-industrial-700 mb-1">Description</label>
                      <textarea
                        rows={3}
                        value={selectedAdminProduct.description || ''}
                        onChange={(e) => setSelectedAdminProduct({ ...selectedAdminProduct, description: e.target.value })}
                        className="w-full p-2.5 bg-industrial-50 border rounded-xl"
                      />
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="text-[11px] text-industrial-400 font-mono">
                        Product ID: {selectedAdminProduct.id}
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedAdminProduct(null)}
                          className="px-4 py-2 text-industrial-600 font-semibold"
                        >
                          Close
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ──── CATEGORIES ──────────────────────────────────────────── */}
        {activeTab === 'categories' && (
          <div className="space-y-6">
            {/* Create form */}
            <div className="bg-white rounded-2xl border border-industrial-100 p-6 shadow-sm">
              <h3 className="text-sm font-bold text-industrial-900 mb-4 flex items-center gap-2">
                <Plus size={16} className="text-brand-600" /> Create Category
              </h3>
              <form onSubmit={handleCreateCategory} className="flex items-end gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-industrial-600 mb-1">Category Name *</label>
                  <input
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="e.g. Safety Equipment"
                    className="w-full border border-industrial-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-industrial-600 mb-1">Icon Name</label>
                  <input
                    value={newCatIcon}
                    onChange={(e) => setNewCatIcon(e.target.value)}
                    placeholder="Building"
                    className="border border-industrial-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-400 w-32"
                  />
                </div>
                <button type="submit" className="px-5 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold hover:bg-brand-700 transition-colors">
                  Create
                </button>
              </form>
            </div>

            {loadingCats ? (
              <div className="flex justify-center py-16 text-industrial-400"><RefreshCw size={24} className="animate-spin" /></div>
            ) : (
              <div className="bg-white rounded-2xl border border-industrial-100 overflow-hidden shadow-sm">
                <table className="w-full text-xs">
                  <thead className="bg-industrial-50 border-b border-industrial-100">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold text-industrial-600">Category</th>
                      <th className="text-center px-4 py-3 font-semibold text-industrial-600">Products</th>
                      <th className="text-center px-4 py-3 font-semibold text-industrial-600">Active</th>
                      <th className="text-right px-4 py-3 font-semibold text-industrial-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-industrial-50">
                    {categories.map((cat) => (
                      <tr key={cat.categoryId} className="hover:bg-industrial-50/50 transition-colors">
                        <td className="px-4 py-3">
                          {editCat?.categoryId === cat.categoryId ? (
                            <div className="flex items-center gap-2">
                              <input
                                value={editCat.name}
                                onChange={(e) => setEditCat({ ...editCat, name: e.target.value })}
                                className="border border-brand-300 rounded-lg px-2 py-1 text-xs w-40 focus:outline-none focus:ring-1 focus:ring-brand-400"
                              />
                              <button onClick={handleUpdateCategory} className="px-3 py-1 bg-brand-600 text-white rounded-lg text-xs font-semibold">Save</button>
                              <button onClick={() => setEditCat(null)} className="text-industrial-400"><X size={14} /></button>
                            </div>
                          ) : (
                            <div>
                              <p className="font-semibold text-industrial-900">{cat.name}</p>
                              <p className="text-industrial-400">{cat.slug}</p>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center text-industrial-600">{cat.productCount || 0}</td>
                        <td className="px-4 py-3 text-center">
                          {cat.active ? <CheckCircle2 size={16} className="text-emerald-500 mx-auto" /> : <XCircle size={16} className="text-red-400 mx-auto" />}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => handleStartEditCategory(cat)} className="p-1.5 text-industrial-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors">
                              <Edit size={14} />
                            </button>
                            <button onClick={() => handleDeleteCategory(cat.categoryId)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {categories.length === 0 && (
                      <tr><td colSpan={4} className="px-4 py-12 text-center text-industrial-400">No categories found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ──── SUBCATEGORIES ───────────────────────────────────────── */}
        {activeTab === 'subcategories' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-industrial-100 p-6 shadow-sm">
              <h3 className="text-sm font-bold text-industrial-900 mb-4 flex items-center gap-2">
                <Plus size={16} className="text-brand-600" /> Create Subcategory
              </h3>
              <form onSubmit={handleCreateSubcategory} className="flex items-end gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-industrial-600 mb-1">Subcategory Name *</label>
                  <input
                    value={newSubName}
                    onChange={(e) => setNewSubName(e.target.value)}
                    placeholder="e.g. Hard Hats"
                    className="w-full border border-industrial-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-industrial-600 mb-1">Parent Category *</label>
                  <select
                    value={newSubCatId}
                    onChange={(e) => setNewSubCatId(e.target.value ? Number(e.target.value) : '')}
                    className="border border-industrial-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-400 min-w-[160px]"
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.categoryId} value={c.categoryId}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="px-5 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold hover:bg-brand-700 transition-colors">
                  Create
                </button>
              </form>
            </div>

            {loadingSubs ? (
              <div className="flex justify-center py-16"><RefreshCw size={24} className="animate-spin text-industrial-400" /></div>
            ) : (
              <div className="bg-white rounded-2xl border border-industrial-100 overflow-hidden shadow-sm">
                <table className="w-full text-xs">
                  <thead className="bg-industrial-50 border-b border-industrial-100">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold text-industrial-600">Subcategory</th>
                      <th className="text-left px-4 py-3 font-semibold text-industrial-600">Category</th>
                      <th className="text-center px-4 py-3 font-semibold text-industrial-600">Products</th>
                      <th className="text-right px-4 py-3 font-semibold text-industrial-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-industrial-50">
                    {subcategories.map((sub) => (
                      <tr key={sub.subcategoryId} className="hover:bg-industrial-50/50 transition-colors">
                        <td className="px-4 py-3">
                          {editSub?.subcategoryId === sub.subcategoryId ? (
                            <div className="flex items-center gap-2">
                              <input
                                value={editSub.name}
                                onChange={(e) => setEditSub({ ...editSub, name: e.target.value })}
                                className="border border-brand-300 rounded-lg px-2 py-1 text-xs w-40 focus:outline-none"
                              />
                              <button onClick={handleUpdateSubcategory} className="px-3 py-1 bg-brand-600 text-white rounded-lg text-xs font-semibold">Save</button>
                              <button onClick={() => setEditSub(null)} className="text-industrial-400"><X size={14} /></button>
                            </div>
                          ) : (
                            <div>
                              <p className="font-semibold text-industrial-900">{sub.name}</p>
                              <p className="text-industrial-400">{sub.slug}</p>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-industrial-600">{sub.categoryName}</td>
                        <td className="px-4 py-3 text-center text-industrial-600">{sub.productCount || 0}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => handleStartEditSubcategory(sub)} className="p-1.5 text-industrial-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors">
                              <Edit size={14} />
                            </button>
                            <button onClick={() => handleDeleteSubcategory(sub.subcategoryId)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {subcategories.length === 0 && (
                      <tr><td colSpan={4} className="px-4 py-12 text-center text-industrial-400">No subcategories found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ──── CUSTOMERS ───────────────────────────────────────────── */}
        {activeTab === 'customers' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-industrial-900">All Customers ({customers.length})</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsAddCustomerOpen(true)}
                  className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                >
                  <Plus size={14} /> Add Customer
                </button>
                <button onClick={loadCustomers} className="p-2 rounded-lg hover:bg-industrial-100 transition-colors">
                  <RefreshCw size={14} className={loadingCustomers ? 'animate-spin text-brand-600' : 'text-industrial-500'} />
                </button>
              </div>
            </div>
            {loadingCustomers ? (
              <div className="flex justify-center py-16"><RefreshCw size={24} className="animate-spin text-industrial-400" /></div>
            ) : (
              <div className="bg-white rounded-2xl border border-industrial-100 overflow-hidden shadow-sm">
                <table className="w-full text-xs">
                  <thead className="bg-industrial-50 border-b border-industrial-100">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold text-industrial-600">Customer</th>
                      <th className="text-left px-4 py-3 font-semibold text-industrial-600">Contact</th>
                      <th className="text-left px-4 py-3 font-semibold text-industrial-600">Company</th>
                      <th className="text-center px-4 py-3 font-semibold text-industrial-600">Status</th>
                      <th className="text-right px-4 py-3 font-semibold text-industrial-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-industrial-50">
                    {customers.map((cust: any) => (
                      <tr key={cust.id || cust.customerId} className="hover:bg-industrial-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-industrial-900">{cust.name || cust.fullName || '—'}</p>
                          <p className="text-industrial-400">ID: {cust.id || cust.customerId}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-industrial-600">{cust.email || '—'}</p>
                          <p className="text-industrial-400">{cust.phone || cust.mobile || '—'}</p>
                        </td>
                        <td className="px-4 py-3 text-industrial-600">{cust.companyName || '—'}</td>
                        <td className="px-4 py-3 text-center">
                          {statusBadge(cust.active !== false ? 'ACTIVE' : 'INACTIVE')}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleViewCustomer(cust.id || cust.customerId)}
                              className="p-1.5 text-industrial-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                              title="View / Edit Customer Details"
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteCustomer(cust.id || cust.customerId)}
                              className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Customer"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {customers.length === 0 && (
                      <tr><td colSpan={5} className="px-4 py-12 text-center text-industrial-400">No customers found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Add Customer Modal */}
            {isAddCustomerOpen && (
              <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
                  <div className="flex items-center justify-between border-b pb-3">
                    <h3 className="font-bold text-base text-industrial-900">Add New Customer</h3>
                    <button onClick={() => setIsAddCustomerOpen(false)} className="text-industrial-400 hover:text-industrial-600">
                      <X size={18} />
                    </button>
                  </div>
                  <form onSubmit={handleCreateCustomer} className="space-y-3 text-xs">
                    <div>
                      <label className="block font-semibold text-industrial-700 mb-1">Customer / Contact Name *</label>
                      <input
                        required
                        value={newCustName}
                        onChange={(e) => setNewCustName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full p-2.5 bg-industrial-50 border rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-industrial-700 mb-1">Official Email *</label>
                      <input
                        type="email"
                        required
                        value={newCustEmail}
                        onChange={(e) => setNewCustEmail(e.target.value)}
                        placeholder="buyer@enterprise.com"
                        className="w-full p-2.5 bg-industrial-50 border rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-industrial-700 mb-1">Phone Number</label>
                      <input
                        value={newCustPhone}
                        onChange={(e) => setNewCustPhone(e.target.value)}
                        placeholder="+91 9876543210"
                        className="w-full p-2.5 bg-industrial-50 border rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-industrial-700 mb-1">Company / Entity Name</label>
                      <input
                        value={newCustCompany}
                        onChange={(e) => setNewCustCompany(e.target.value)}
                        placeholder="L&T Construction Infra Ltd"
                        className="w-full p-2.5 bg-industrial-50 border rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-industrial-700 mb-1">GSTIN</label>
                      <input
                        value={newCustGstin}
                        onChange={(e) => setNewCustGstin(e.target.value)}
                        placeholder="27AAACL1234F1Z8"
                        className="w-full p-2.5 bg-industrial-50 border rounded-xl font-mono uppercase"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-2 border-t">
                      <button
                        type="button"
                        onClick={() => setIsAddCustomerOpen(false)}
                        className="px-4 py-2 text-industrial-600 font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl"
                      >
                        Register Customer
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Inspect / Edit Customer Modal */}
            {selectedCustomer && (
              <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
                  <div className="flex items-center justify-between border-b pb-3">
                    <h3 className="font-bold text-base text-industrial-900">Customer Details</h3>
                    <button onClick={() => setSelectedCustomer(null)} className="text-industrial-400 hover:text-industrial-600">
                      <X size={18} />
                    </button>
                  </div>
                  <form onSubmit={handleUpdateCustomer} className="space-y-3 text-xs">
                    <div>
                      <label className="block font-semibold text-industrial-700 mb-1">Full Name</label>
                      <input
                        value={selectedCustomer.name || (selectedCustomer as any).fullName || ''}
                        onChange={(e) => setSelectedCustomer({ ...selectedCustomer, name: e.target.value })}
                        className="w-full p-2.5 bg-industrial-50 border rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-industrial-700 mb-1">Company</label>
                      <input
                        value={selectedCustomer.companyName || ''}
                        onChange={(e) => setSelectedCustomer({ ...selectedCustomer, companyName: e.target.value })}
                        className="w-full p-2.5 bg-industrial-50 border rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-industrial-700 mb-1">Phone</label>
                      <input
                        value={selectedCustomer.phone || (selectedCustomer as any).mobile || ''}
                        onChange={(e) => setSelectedCustomer({ ...selectedCustomer, phone: e.target.value })}
                        className="w-full p-2.5 bg-industrial-50 border rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-industrial-700 mb-1">Account Status</label>
                      <select
                        value={selectedCustomer.status || 'ACTIVE'}
                        onChange={(e) => setSelectedCustomer({ ...selectedCustomer, status: e.target.value })}
                        className="w-full p-2.5 bg-industrial-50 border rounded-xl"
                      >
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="PENDING">PENDING</option>
                        <option value="SUSPENDED">SUSPENDED</option>
                      </select>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="text-[11px] text-industrial-400 font-mono">
                        Customer ID: {(selectedCustomer as any).id || (selectedCustomer as any).customerId}
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedCustomer(null)}
                          className="px-4 py-2 text-industrial-600 font-semibold"
                        >
                          Close
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ──── KYC ─────────────────────────────────────────────────── */}
        {activeTab === 'kyc' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-industrial-900">
                KYC Documents
                <span className="ml-2 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">
                  {kycDocs.filter(d => d.status === 'PENDING').length} Pending
                </span>
              </h3>
              <button onClick={loadKyc} className="p-2 rounded-lg hover:bg-industrial-100 transition-colors">
                <RefreshCw size={14} className={loadingKyc ? 'animate-spin text-brand-600' : 'text-industrial-500'} />
              </button>
            </div>
            {loadingKyc ? (
              <div className="flex justify-center py-16"><RefreshCw size={24} className="animate-spin text-industrial-400" /></div>
            ) : (
              <div className="space-y-3">
                {kycDocs.map((doc: any) => (
                  <div key={doc.id || doc.documentId} className="bg-white rounded-2xl border border-industrial-100 p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <p className="font-semibold text-industrial-900 text-sm">{doc.documentType || doc.type || 'KYC Document'}</p>
                          {statusBadge(doc.status || 'PENDING')}
                        </div>
                        <p className="text-xs text-industrial-500">Document ID: {doc.id || doc.documentId}</p>
                        {doc.fileUrl && (
                          <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-600 hover:underline flex items-center gap-1 mt-1">
                            <Eye size={12} /> View Document
                          </a>
                        )}
                        {doc.notes && <p className="text-xs text-industrial-500 mt-1">Notes: {doc.notes}</p>}
                      </div>
                      {doc.status === 'PENDING' && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleVerifyKyc(doc.id || doc.documentId)}
                            className="flex items-center gap-1 px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition-colors"
                          >
                            <CheckCircle2 size={13} /> Verify
                          </button>
                          {rejectingKycId === String(doc.id || doc.documentId) ? (
                            <div className="flex items-center gap-2">
                              <input
                                value={kycRejectReason}
                                onChange={(e) => setKycRejectReason(e.target.value)}
                                placeholder="Rejection reason..."
                                className="border border-red-200 rounded-lg px-2 py-1.5 text-xs w-48 focus:outline-none"
                              />
                              <button
                                onClick={() => handleRejectKyc(doc.id || doc.documentId)}
                                className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-semibold"
                              >
                                Confirm
                              </button>
                              <button onClick={() => setRejectingKycId(null)} className="text-industrial-400"><X size={14} /></button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setRejectingKycId(String(doc.id || doc.documentId))}
                              className="flex items-center gap-1 px-4 py-2 bg-red-100 text-red-600 rounded-xl text-xs font-bold hover:bg-red-500 hover:text-white transition-colors"
                            >
                              <AlertTriangle size={13} /> Reject
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {kycDocs.length === 0 && (
                  <div className="text-center py-16 text-industrial-400 bg-white rounded-2xl border border-industrial-100">
                    <ShieldCheck size={32} className="mx-auto mb-3 opacity-40" />
                    <p>No KYC documents found</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ──── BANNERS ─────────────────────────────────────────────── */}
        {activeTab === 'banners' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-industrial-100 p-6 shadow-sm">
              <h3 className="text-sm font-bold text-industrial-900 mb-4 flex items-center gap-2">
                <Plus size={16} className="text-brand-600" /> Create Banner
              </h3>
              <form onSubmit={handleCreateBanner} className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-industrial-600 mb-1">Title *</label>
                  <input value={newBannerTitle} onChange={(e) => setNewBannerTitle(e.target.value)}
                    placeholder="e.g. Monsoon Sale" required
                    className="w-full border border-industrial-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-400" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-industrial-600 mb-1">Subtitle</label>
                  <input value={newBannerSubtitle} onChange={(e) => setNewBannerSubtitle(e.target.value)}
                    placeholder="e.g. Up to 30% off"
                    className="w-full border border-industrial-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-400" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-industrial-600 mb-1">Image URL (or upload below)</label>
                  <input value={newBannerUrl} onChange={(e) => setNewBannerUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full border border-industrial-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-400" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-industrial-600 mb-1">Target URL</label>
                  <input value={newBannerTarget} onChange={(e) => setNewBannerTarget(e.target.value)}
                    placeholder="/catalog"
                    className="w-full border border-industrial-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-400" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-industrial-600 mb-1">Upload Image File</label>
                  <div
                    onClick={() => bannerFileRef.current?.click()}
                    className="border-2 border-dashed border-industrial-200 rounded-xl p-4 text-center cursor-pointer hover:border-brand-400 hover:bg-brand-50 transition-colors"
                  >
                    {bannerFile ? (
                      <p className="text-xs text-brand-600 font-semibold">{bannerFile.name}</p>
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-industrial-400">
                        <Upload size={20} />
                        <p className="text-xs">Click to upload banner image</p>
                      </div>
                    )}
                    <input ref={bannerFileRef} type="file" accept="image/*" className="hidden"
                      onChange={(e) => setBannerFile(e.target.files?.[0] || null)} />
                  </div>
                </div>
                <div className="col-span-2 flex justify-end">
                  <button type="submit" className="px-6 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold hover:bg-brand-700 transition-colors">
                    Create Banner
                  </button>
                </div>
              </form>
            </div>

            {loadingBanners ? (
              <div className="flex justify-center py-16"><RefreshCw size={24} className="animate-spin text-industrial-400" /></div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {banners.map((banner: any) => (
                  <div key={banner.id || banner.bannerId} className="bg-white rounded-2xl border border-industrial-100 overflow-hidden shadow-sm">
                    {banner.imageUrl && (
                      <img src={banner.imageUrl} alt={banner.title} className="w-full h-32 object-cover" />
                    )}
                    <div className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-industrial-900 text-sm">{banner.title}</p>
                          {banner.subtitle && <p className="text-xs text-industrial-500">{banner.subtitle}</p>}
                          <p className="text-xs text-brand-600 mt-1">→ {banner.targetUrl}</p>
                        </div>
                        {statusBadge(banner.active ? 'ACTIVE' : 'INACTIVE')}
                      </div>
                    </div>
                  </div>
                ))}
                {banners.length === 0 && (
                  <div className="col-span-2 text-center py-16 text-industrial-400 bg-white rounded-2xl border border-industrial-100">
                    <Image size={32} className="mx-auto mb-3 opacity-40" />
                    <p>No banners created yet</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ──── BRANDS ──────────────────────────────────────────────── */}
        {activeTab === 'brands' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-industrial-900">All Brands ({brands.length})</h3>
              <button onClick={loadBrands} className="p-2 rounded-lg hover:bg-industrial-100 transition-colors">
                <RefreshCw size={14} className={loadingBrands ? 'animate-spin text-brand-600' : 'text-industrial-500'} />
              </button>
            </div>
            {loadingBrands ? (
              <div className="flex justify-center py-16"><RefreshCw size={24} className="animate-spin text-industrial-400" /></div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {brands.map((brand) => (
                  <div key={brand.brandId} className="bg-white rounded-2xl border border-industrial-100 p-4 shadow-sm flex items-center gap-3 hover:border-brand-200 transition-colors">
                    {brand.imageUrl ? (
                      <img src={brand.imageUrl} alt={brand.name} className="w-10 h-10 rounded-xl object-contain border border-industrial-100" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-industrial-100 flex items-center justify-center text-industrial-400">
                        <Building2 size={18} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-industrial-900 text-sm truncate">{brand.name}</p>
                      <p className="text-xs text-industrial-400">{brand.productCount || 0} products</p>
                    </div>
                    {statusBadge(brand.active ? 'ACTIVE' : 'INACTIVE')}
                  </div>
                ))}
                {brands.length === 0 && (
                  <div className="col-span-3 text-center py-16 text-industrial-400 bg-white rounded-2xl border border-industrial-100">
                    <Building2 size={32} className="mx-auto mb-3 opacity-40" />
                    <p>No brands found</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
