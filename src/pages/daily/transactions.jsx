// DailyTransactions.js
import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  forwardRef
} from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import useAuth from 'hooks/useAuth';
import { useGetMenuMaster } from 'api/menu';
import { BrowserView, MobileView } from 'react-device-detect';

// --- MUI Components ---
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Slide,
  IconButton,
  Typography
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

// -------------- Error & Success Modals (Tailwind) --------------
const ErrorModal = ({ message, onClose }) => (
  <div className="fixed inset-0 flex items-center justify-center z-50">
    <div className="bg-white rounded-md p-4 shadow-lg relative w-11/12 max-w-sm">
      <button
        onClick={onClose}
        className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl"
      >
        ×
      </button>
      <p className="text-sm text-gray-700">{message}</p>
    </div>
  </div>
);

const SuccessModal = ({ message, onClose }) => (
  <div className="fixed inset-0 flex items-start justify-center z-50">
    <div className="bg-green-500 text-white rounded-md p-4 shadow-lg relative w-11/12 max-w-sm mt-8 animate-slide-down">
      <button
        onClick={onClose}
        className="absolute top-2 right-2 text-white hover:text-gray-100 text-xl"
      >
        ×
      </button>
      <p className="text-sm">{message}</p>
    </div>
  </div>
);

// -------------- Slide Transition for MUI Dialog --------------
const SlideUpTransition = forwardRef(function SlideUpTransition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const DailyTransactions = () => {
  const navigate = useNavigate();
  const { user: userInfo } = useAuth();

  // Pull in menuMaster (for layout/drawer states if needed)
  const { menuMaster } = useGetMenuMaster();

  // States for transactions from various sources
  const [transactions, setTransactions] = useState([]);
  const [billings, setBillings] = useState([]);
  const [billingPayments, setBillingPayments] = useState([]);
  const [customerPayments, setCustomerPayments] = useState([]);
  const [otherExpenses, setOtherExpenses] = useState([]);
  const [purchasePayments, setPurchasePayments] = useState([]);
  const [transportPayments, setTransportPayments] = useState([]);

  // Categories & Accounts
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);

  // Loading & Error
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Success modal states
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Date filters
  const today = new Date().toISOString().slice(0, 10);
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);

  // Active tab: all, in, out, transfer
  const [activeTab, setActiveTab] = useState('all');

  // Totals
  const [totalIn, setTotalIn] = useState(0);
  const [totalOut, setTotalOut] = useState(0);
  const [totalTransfer, setTotalTransfer] = useState(0);

  // Dialog / Add Transaction
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('in');

  // Sidebar open/close (mobile only)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const sidebarRef = useRef(null);

  // Data for new transaction
  const [transactionData, setTransactionData] = useState({
    date: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16),
    amount: '',
    paymentFrom: '',
    paymentTo: '',
    category: '',
    method: '',
    remark: '',
    billId: '',
    purchaseId: '',
    transportId: '',
  });

  // For adding a new category
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);

  // Search & Filters & Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterMethod, setFilterMethod] = useState('');
  const [sortOption, setSortOption] = useState('date_desc');

  useEffect(() => {
    // Close sidebar on mobile screens by default
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  }, []);

  // Close sidebar when clicking outside of it
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target) &&
        isSidebarOpen
      ) {
        setIsSidebarOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSidebarOpen]);

  // -------------------------------
  // Fetch Categories
  // -------------------------------
  const fetchCategories = async () => {
    try {
      const catRes = await api.get('/api/daily/transactions/categories');
      setCategories(catRes.data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // -------------------------------
  // Success Modal Timeout
  // -------------------------------
  useEffect(() => {
    let timer;
    if (isSuccessOpen) {
      timer = setTimeout(() => {
        setIsSuccessOpen(false);
        setSuccessMessage('');
      }, 3000);
    }
    return () => clearTimeout(timer);
  }, [isSuccessOpen]);

  // -------------------------------
  // Generate Report
  // -------------------------------
  const handleGenerateReport = async () => {
    try {
      // Prepare the current filters and sorting options
      const reportParams = {
        fromDate,
        toDate,
        activeTab,
        filterCategory,
        filterMethod,
        searchQuery,
        sortOption,
      };

      // Prepare the data to send (allTransactions already reflects current filters/sorts)
      const reportData = allTransactions;

      // Send a POST request to the backend to generate the report
      const response = await api.post(
        '/api/print/daily/generate-report',
        { reportData, reportParams },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          responseType: 'text', // Expecting HTML content as text
        }
      );

      // Open a new popup window
      const reportWindow = window.open('', '_blank', 'width=1200,height=800');

      if (reportWindow) {
        // Write the received HTML content into the popup window
        reportWindow.document.write(response.data);
        reportWindow.document.close();
      } else {
        setError('Unable to open popup window. Please allow popups for this website.');
      }
    } catch (err) {
      setError('Failed to generate report.');
      console.error(err);
    }
  };

  // -------------------------------
  // Fetch All Transactions
  // -------------------------------
  const fetchTransactions = async () => {
    setLoading(true);
    setError('');
    try {
      // Make concurrent API calls
      const [
        catRes,
        dailyTransRes,
        billingRes,
        customerPayRes,
        purchaseRes,
        transportRes,
      ] = await Promise.all([
        api.get('/api/daily/transactions/categories'),
        api.get('/api/daily/transactions', { params: { fromDate, toDate } }),
        api.get('/api/daily/allbill/payments', { params: { fromDate, toDate } }),
        api.get('/api/customer/daily/payments', { params: { fromDate, toDate } }),
        api.get('/api/seller/daily/payments', { params: { fromDate, toDate } }),
        api.get('/api/transportpayments/daily/payments', { params: { fromDate, toDate } }),
      ]);

      // 1) Categories
      setCategories(catRes.data);

      // 2) Daily transactions
      const dailyTransWithSource = dailyTransRes.data.map((t) => ({
        ...t,
        source: 'daily',
      }));
      setTransactions(dailyTransWithSource);

      // 3) Billings (with payments & otherExpenses)
      const {
        billings: billingData,
        payments: paymentData,
        otherExpenses: expenseData,
      } = billingRes.data;
      setBillings(billingData);

      // Format & store the otherExpenses
      const formattedOtherExpenses = expenseData.map((exp, index) => {
        const hasInvoice = exp.invoiceNo ? true : false;
        return {
          ...exp,
          source: 'expense',
          _id: exp._id || `expense-${index}`,
          category: hasInvoice ? 'Bill Other Expense' : 'Other Expense',
          remark: exp.remark || 'Additional expense',
        };
      });
      setOtherExpenses(formattedOtherExpenses);

      // 4) Billing Payments
      setBillingPayments(paymentData);

      // 5) Customer Payments
      const customerPaymentsData = customerPayRes.data;
      setCustomerPayments(
        customerPaymentsData.flatMap((customer) =>
          (customer.payments || []).map((p, index) => ({
            ...p,
            source: 'customerPayment',
            paymentFrom: customer.customerName,
            _id: p._id || `customer-payment-${customer.customerId}-${index}`,
            category: p.category || 'Customer Payment',
            method: p.method || 'cash',
            date: p.date,
          }))
        )
      );

      // 6) Purchase Payments (all suppliers, aggregated)
      const purchasePaymentsData = purchaseRes.data; // array of suppliers
      setPurchasePayments(
        purchasePaymentsData.flatMap((supplier) =>
          (supplier.payments || []).map((p, index) => ({
            ...p,
            source: 'purchasePayment',
            sellerName: supplier.sellerName,
            _id: p._id || `purchase-${supplier._id}-${index}`,
            category: p.category || 'Purchase Payment',
            method: p.method || 'cash',
            date: p.date,
          }))
        )
      );

      // 7) Transport Payments
      const transportPaymentsData = transportRes.data;
      setTransportPayments(
        transportPaymentsData.flatMap((transport) =>
          (transport.payments || []).map((p, index) => ({
            ...p,
            source: 'transportPayment',
            transportName: transport.transportName,
            _id: p._id || `transport-${transport.transportId}-${index}`,
            category: p.category || 'Transport Payment',
            method: p.method || 'cash',
            date: p.date,
          }))
        )
      );

      // Recalc totals
      calculateTotals(
        dailyTransWithSource,
        paymentData,
        expenseData,
        customerPaymentsData.flatMap((customer) => customer.payments || []),
        purchasePaymentsData.flatMap((supplier) => supplier.payments || []),
        transportPaymentsData.flatMap((t) => t.payments || [])
      );
    } catch (err) {
      setError('Failed to fetch transactions.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------
  // Calculate Totals
  // -------------------------------
  const calculateTotals = (
    transactionsData,
    billingPaymentsData,
    expenseData,
    customerPaymentsData,
    purchasePaymentsData,
    transportPaymentsData
  ) => {
    let totalInAmount = 0;
    let totalOutAmount = 0;
    let totalTransferAmount = 0;

    // Daily transactions (in/out/transfer)
    transactionsData.forEach((trans) => {
      const amount = parseFloat(trans.amount) || 0;
      if (trans.type === 'in') totalInAmount += amount;
      else if (trans.type === 'out') totalOutAmount += amount;
      else if (trans.type === 'transfer') totalTransferAmount += amount;
    });

    // Billing Payments (in)
    billingPaymentsData.forEach((payment) => {
      totalInAmount += parseFloat(payment.amount) || 0;
    });

    // Customer Payments (in)
    customerPaymentsData.forEach((payment) => {
      totalInAmount += parseFloat(payment.amount) || 0;
    });

    // Other Expenses (out)
    expenseData.forEach((expense) => {
      totalOutAmount += parseFloat(expense.amount) || 0;
    });

    // Purchase Payments (out)
    purchasePaymentsData.forEach((payment) => {
      totalOutAmount += parseFloat(payment.amount) || 0;
    });

    // Transport Payments (out)
    transportPaymentsData.forEach((payment) => {
      totalOutAmount += parseFloat(payment.amount) || 0;
    });

    setTotalIn(Number(totalInAmount.toFixed(2)));
    setTotalOut(Number(totalOutAmount.toFixed(2)));
    setTotalTransfer(Number(totalTransferAmount.toFixed(2)));
  };

  // -------------------------------
  // On mount + whenever fromDate/toDate changes
  // -------------------------------
  useEffect(() => {
    fetchTransactions();
    const fetchAccounts = async () => {
      try {
        const accountsRes = await api.get('/api/accounts/allaccounts');
        setAccounts(accountsRes.data);
      } catch (err) {
        console.error('Failed to fetch accounts:', err);
      }
    };
    fetchAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromDate, toDate]);

  // -------------------------------
  // Tab Handler
  // -------------------------------
  const handleTabChange = (tab) => setActiveTab(tab);

  // -------------------------------
  // Open/Close Add Transaction Modal (MUI)
  // -------------------------------
  const openModal = (type) => {
    setModalType(type);
    setTransactionData({
      date: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16),
      amount: '',
      paymentFrom: '',
      paymentTo: '',
      category: '',
      method: '',
      remark: '',
      billId: '',
      purchaseId: '',
      transportId: '',
    });
    setNewCategoryName('');
    setShowAddCategory(false);
    setError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setError('');
  };

  // -------------------------------
  // Add Transaction (Submit)
  // -------------------------------
  const handleTransactionSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (isNaN(transactionData.amount) || parseFloat(transactionData.amount) <= 0) {
      setError('Please enter a valid amount.');
      return;
    }

    if (modalType === 'in' && !transactionData.paymentFrom.trim()) {
      setError('Please enter a payment source.');
      return;
    }

    if (modalType === 'out' && !transactionData.paymentTo.trim()) {
      setError('Please enter a payment destination.');
      return;
    }

    if (modalType === 'transfer') {
      if (!transactionData.paymentFrom.trim() || !transactionData.paymentTo.trim()) {
        setError('Please select both payment source and destination.');
        return;
      }
      if (transactionData.paymentFrom.trim() === transactionData.paymentTo.trim()) {
        setError('Payment source and destination cannot be the same.');
        return;
      }
    }

    if (!transactionData.category.trim() && !newCategoryName.trim()) {
      setError('Please select or enter a category.');
      return;
    }

    if (!transactionData.method.trim()) {
      setError('Please select a payment method.');
      return;
    }

    try {
      // If adding a new category
      if (showAddCategory) {
        if (!newCategoryName.trim()) {
          setError('Please enter a new category name.');
          return;
        }
        const categoryRes = await api.post('/api/daily/transactions/categories', {
          name: newCategoryName.trim(),
        });
        setCategories([...categories, categoryRes.data]);
        setTransactionData({
          ...transactionData,
          category: categoryRes.data.name,
        });
      }

      const payload = {
        ...transactionData,
        type: modalType,
        userId: userInfo._id,
      };

      // Different endpoints if it's a transfer or special categories
      if (modalType === 'transfer') {
        await api.post('/api/daily/trans/transfer', payload);
      } else if (transactionData.category === 'Purchase Payment') {
        // If user explicitly selects "Purchase Payment"
        await api.post('/api/purchases/purchases/payments', payload);
      } else if (transactionData.category === 'Transport Payment') {
        // If user explicitly selects "Transport Payment"
        await api.post('/api/transport/payments', payload);
      } else {
        // Regular daily transaction
        await api.post('/api/daily/transactions', payload);
      }

      // Show success
      setSuccessMessage('Transaction added successfully!');
      setIsSuccessOpen(true);

      // Close the dialog
      closeModal();

      // Refresh
      fetchTransactions();
    } catch (err) {
      setError('Failed to add transaction.');
      console.error(err);
    }
  };

  // -------------------------------
  // Add a New Category Directly
  // -------------------------------
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      setError('Category name cannot be empty.');
      return;
    }

    try {
      const response = await api.post('/api/daily/transactions/categories', {
        name: newCategoryName.trim(),
      });
      setCategories([...categories, response.data]); // Add new category to the list
      setTransactionData({ ...transactionData, category: response.data.name });
      setShowAddCategory(false);
      setNewCategoryName('');
      setError('');
    } catch (err) {
      if (err.response && err.response.status === 400) {
        setError(err.response.data.message || 'Error adding category.');
      } else {
        setError('Server error. Please try again later.');
      }
    }
  };

  // Toggle showAddCategory
  const handleAddNewCategoryToggle = () => {
    setShowAddCategory(!showAddCategory);
    setNewCategoryName('');
  };

  // -------------------------------
  // Delete Transaction (only from 'daily')
  // -------------------------------
  const handleDeleteTransaction = async (id) => {
    try {
      await api.delete(`/api/daily/transactions/${id}`);
      fetchTransactions();
    } catch (err) {
      setError('Failed to delete transaction.');
      console.error(err);
    }
  };

  // -------------------------------
  // Merge & Filter & Sort All Transactions
  // -------------------------------
  const allTransactions = useMemo(() => {
    // 1) Filter daily transactions by tab
    let mainFiltered;
    if (activeTab === 'all') mainFiltered = [...transactions];
    else mainFiltered = transactions.filter((t) => t.type === activeTab);

    // 2) Build typed arrays from others if tab = all or matches type (in/out).
    let billingPaymentsFormatted = [];
    let customerPaymentsFormatted = [];
    let expenses = [];
    let pPayments = [];
    let tPayments = [];

    // Billing (always in)
    if (activeTab === 'all' || activeTab === 'in') {
      billingPaymentsFormatted = billingPayments.map((payment, index) => ({
        _id: payment._id || `billing-payment-${index}`,
        date: payment.date,
        amount: payment.amount,
        paymentFrom: payment.paymentFrom || 'Unknown Customer',
        category: 'Billing Payment',
        method: payment.method || 'cash',
        remark: payment.remark || `Payment Received: ${payment.invoiceNo}`,
        type: 'in',
        source: 'billingPayment',
        invoiceNo: payment.invoiceNo, // keep invoiceNo if needed
      }));
    }

    // Customer payments (always in)
    if (activeTab === 'all' || activeTab === 'in') {
      customerPaymentsFormatted = customerPayments.map((payment) => ({
        ...payment,
        type: 'in',
      }));
    }

    // Other expenses (always out)
    if (activeTab === 'all' || activeTab === 'out') {
      expenses = otherExpenses.map((expense) => ({
        ...expense,
        type: 'out',
        paymentTo: expense.category === 'Bill Other Expense' ? 'Bill Other Expense' : 'Other Expense',
      }));
    }

    // Purchase Payments (always out)
    if (activeTab === 'all' || activeTab === 'out') {
      pPayments = purchasePayments.map((payment) => ({
        ...payment,
        type: 'out',
        paymentTo: payment.sellerName || 'Vendor',
        category: payment.category || 'Purchase Payment',
        method: payment.method || 'cash',
        remark: payment.remark || 'Payment towards purchase',
      }));
    }

    // Transport Payments (always out)
    if (activeTab === 'all' || activeTab === 'out') {
      tPayments = transportPayments.map((payment) => ({
        ...payment,
        type: 'out',
        paymentTo: payment.transportName || 'Transporter',
        category: payment.category || 'Transport Payment',
        method: payment.method || 'cash',
        remark: payment.remark || 'Payment towards transport',
      }));
    }

    // 3) Combine
    let combined = [
      ...mainFiltered,
      ...billingPaymentsFormatted,
      ...customerPaymentsFormatted,
      ...expenses,
      ...pPayments,
      ...tPayments,
    ];

    // 4) Remove duplicates based on _id (in case of weird overlaps)
    const uniqueMap = new Map();
    combined.forEach((item) => {
      if (!uniqueMap.has(item._id)) {
        uniqueMap.set(item._id, item);
      }
    });

    let filtered = [...uniqueMap.values()];

    // 5) Apply additional filters (category, method, search)
    if (filterCategory) {
      filtered = filtered.filter(
        (t) => t.category && t.category.toLowerCase() === filterCategory.toLowerCase()
      );
    }
    if (filterMethod) {
      filtered = filtered.filter(
        (t) => t.method && t.method.toLowerCase() === filterMethod.toLowerCase()
      );
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          (t.paymentFrom && t.paymentFrom.toLowerCase().includes(q)) ||
          (t.paymentTo && t.paymentTo.toLowerCase().includes(q)) ||
          (t.remark && t.remark.toLowerCase().includes(q)) ||
          (t.category && t.category.toLowerCase().includes(q)) ||
          (t.invoiceNo && t.invoiceNo.toLowerCase().includes(q))
      );
    }

    // 6) Sorting
    filtered.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      const amountA = parseFloat(a.amount) || 0;
      const amountB = parseFloat(b.amount) || 0;

      switch (sortOption) {
        case 'date_desc':
          return dateB - dateA; // latest first
        case 'date_asc':
          return dateA - dateB; // oldest first
        case 'amount_asc':
          return amountA - amountB; // low -> high
        case 'amount_desc':
          return amountB - amountA; // high -> low
        default:
          return dateB - dateA;
      }
    });

    return filtered;
  }, [
    transactions,
    billingPayments,
    customerPayments,
    otherExpenses,
    purchasePayments,
    transportPayments,
    activeTab,
    searchQuery,
    filterCategory,
    filterMethod,
    sortOption,
  ]);

  // -------------------------------
  // Render
  // -------------------------------
  return (
    <>
      {/* Error Modal */}
      {error && <ErrorModal message={error} onClose={() => setError('')} />}

      {/* Success Modal */}
      {isSuccessOpen && (
        <SuccessModal message={successMessage} onClose={() => setIsSuccessOpen(false)} />
      )}

      {/* Main Container */}
      <div className="flex lg:flex-row flex-col">
        {/* Sidebar */}
        <div
          ref={sidebarRef}
          className={`fixed inset-y-0 h-screen ${isSidebarOpen && 'pt-16'} rounded-md left-0 transform bg-white shadow-md w-64 z-40 transition-transform duration-300 ease-in-out
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            lg:translate-x-0 lg:static`}
        >
          <div className="p-4">
            <div className="flex  items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-800">Filters</h2>
              {/* Hide the hamburger in large screens since the sidebar is always open there */}
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="block lg:hidden text-gray-500 hover:text-gray-700 text-xl"
                title="Close Sidebar"
              >
                ×
              </button>
            </div>

            {/* Filters Section */}
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold mb-1 block">From Date</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="border border-gray-300 rounded-md p-1 text-xs focus:ring-red-500 focus:border-red-500 w-full"
                />
              </div>
              <div>
                <label className="text-xs font-bold mb-1 block">To Date</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="border border-gray-300 rounded-md p-1 text-xs focus:ring-red-500 focus:border-red-500 w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Category</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="border border-gray-300 rounded-md p-1 text-xs focus:ring-red-500 focus:border-red-500 w-full"
                >
                  <option value="">All</option>
                  {categories.map((cat, index) => (
                    <option key={index} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Method</label>
                <select
                  value={filterMethod}
                  onChange={(e) => setFilterMethod(e.target.value)}
                  className="border border-gray-300 rounded-md p-1 text-xs focus:ring-red-500 focus:border-red-500 w-full"
                >
                  <option value="">All</option>
                  {accounts.map((acc, index) => (
                    <option key={index} value={acc.accountId}>
                      {acc.accountName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Search</label>
                <input
                  type="text"
                  placeholder="Search remarks/source/invoice..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="border border-gray-300 rounded-md p-1 text-xs focus:ring-red-500 focus:border-red-500 w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Sort By</label>
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="border border-gray-300 rounded-md p-1 text-xs focus:ring-red-500 focus:border-red-500 w-full"
                >
                  <option value="date_desc">Date (Latest First)</option>
                  <option value="date_asc">Date (Oldest First)</option>
                  <option value="amount_asc">Amount (Low to High)</option>
                  <option value="amount_desc">Amount (High to Low)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side (Main Content) */}
        <div className="flex-1 p-4 transition-all duration-300">
          {/* Top bar with optional toggle (hamburger) for mobile */}
          <div className="flex items-center justify-between mb-2 lg:hidden">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-gray-700 hover:text-gray-900"
              title="Toggle Sidebar"
            >
              <i className="fa fa-bars text-xl"></i>
            </button>
            <h1 className="text-sm font-bold text-gray-700">Daily Transactions</h1>
          </div>

          {/* Totals Section */}
          <div className="flex space-x-4 p-2 rounded-lg">
            <div className="flex-1 bg-green-100 text-green-700 p-3 rounded-lg text-center">
              <p className="text-xs font-semibold">Payment In</p>
              <p className="text-md font-bold">₹ {totalIn.toFixed(2)}</p>
            </div>
            <div className="flex-1 bg-red-100 text-red-700 p-3 rounded-lg text-center">
              <p className="text-xs font-semibold">Payment Out</p>
              <p className="text-md font-bold">₹ {totalOut.toFixed(2)}</p>
            </div>
            <div className="flex-1 bg-blue-100 text-blue-700 p-3 rounded-lg text-center">
              <p className="text-xs font-semibold">Total Transfers</p>
              <p className="text-md font-bold">₹ {totalTransfer.toFixed(2)}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex justify-center p-2 rounded-lg">
            <div className="flex space-x-2 bg-gray-100 p-1 rounded-full">
              <button
                onClick={() => handleTabChange('all')}
                className={`px-4 py-1 text-xs rounded-full font-semibold ${
                  activeTab === 'all' ? 'bg-white text-red-600 shadow-md' : 'text-gray-600'
                }`}
              >
                All Payments
              </button>
              <button
                onClick={() => handleTabChange('in')}
                className={`px-4 py-1 text-xs rounded-full font-semibold ${
                  activeTab === 'in' ? 'bg-white text-red-600 shadow-md' : 'text-gray-600'
                }`}
              >
                Payment In
              </button>
              <button
                onClick={() => handleTabChange('out')}
                className={`px-4 py-1 text-xs rounded-full font-semibold ${
                  activeTab === 'out' ? 'bg-white text-red-600 shadow-md' : 'text-gray-600'
                }`}
              >
                Payment Out
              </button>
              <button
                onClick={() => handleTabChange('transfer')}
                className={`px-4 py-1 text-xs rounded-full font-semibold ${
                  activeTab === 'transfer' ? 'bg-white text-red-600 shadow-md' : 'text-gray-600'
                }`}
              >
                Transfer
              </button>
            </div>
          </div>

          {/* Transactions List */}
          <div className="p-4 mb-20">
            {loading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-200 animate-pulse rounded-lg"></div>
                ))}
              </div>
            ) : (
              <>
                {allTransactions.length === 0 ? (
                  <p className="text-center text-gray-500 text-xs">
                    No transactions found for the selected criteria.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {allTransactions.map((trans) => {
                      const dateObj = new Date(trans.date);
                      const isDaily = trans.source === 'daily'; // only daily transactions can be deleted

                      return (
                        <div
                          key={trans._id}
                          className="flex justify-between items-center p-2 bg-white shadow-sm rounded-lg"
                        >
                          <div>
                            {/* Category + invoiceNo (if any) */}
                            <p className="text-xs font-bold text-gray-700">
                              {trans.category}
                              {trans.invoiceNo ? ` (#${trans.invoiceNo})` : ''}
                            </p>
                            {/* Payment From / To / Transfer label */}
                            <p className="text-xs text-gray-500">
                              {trans.type === 'in'
                                ? `From: ${trans.paymentFrom}`
                                : trans.type === 'out'
                                ? `To: ${trans.paymentTo}`
                                : trans.type === 'transfer'
                                ? `Transfer: ${trans.paymentFrom} ➜ ${trans.paymentTo}`
                                : ''}
                            </p>
                            {/* Remark */}
                            <p className="text-xs text-gray-500 italic">{trans.remark}</p>
                          </div>
                          <div className="text-right">
                            {trans.type === 'in' && (
                              <p className="text-sm font-bold text-green-600">
                                +₹{parseFloat(trans.amount).toFixed(2)}
                              </p>
                            )}
                            {trans.type === 'out' && (
                              <p className="text-sm font-bold text-red-600">
                                -₹{parseFloat(trans.amount).toFixed(2)}
                              </p>
                            )}
                            {trans.type === 'transfer' && (
                              <p className="text-sm font-bold text-blue-600">
                                ₹{parseFloat(trans.amount).toFixed(2)}
                              </p>
                            )}
                            {/* Date display */}
                            <p className="text-xs text-gray-500">
                              {dateObj.toLocaleString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                            {/* Delete button (only daily) */}
                            {isDaily && (
                              <button
                                onClick={() => handleDeleteTransaction(trans._id)}
                                className="ml-3 text-red-500 hover:text-red-700 text-xs"
                                title="Delete Transaction"
                              >
                                <i className="fa fa-trash"></i>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Bottom Fixed Actions Bar */}
          <div
            style={{ zIndex: 1000 }}
            className="fixed bottom-0 left-0 right-0 w-full bg-white px-4 pt-4 pb-4 border-t shadow-inner flex justify-around"
          >
            <button
              onClick={() => openModal('in')}
              className="flex font-bold items-center justify-center bg-green-500 text-white w-12 h-12 rounded-full shadow-lg hover:bg-green-600 transition"
              title="Add Payment In"
            >
              +
            </button>

            <button
              onClick={() => openModal('transfer')}
              className="flex font-bold items-center justify-center bg-blue-500 text-white w-12 h-12 rounded-full shadow-lg hover:bg-blue-600 transition"
              title="Transfer Between Accounts"
            >
              <i className="fa fa-share" />
            </button>

            <button
              onClick={() => openModal('out')}
              className="flex font-bold items-center justify-center bg-red-500 text-white w-12 h-12 rounded-full shadow-lg hover:bg-red-600 transition"
              title="Add Payment Out"
            >
              -
            </button>

            {/* Generate Report Button */}
            <button
              onClick={handleGenerateReport}
              className="flex font-bold items-center justify-center bg-red-500 text-white w-12 h-12 rounded-full shadow-lg hover:bg-red-600 transition"
              title="Generate Report"
            >
              <i className="fa fa-file-pdf"></i>
            </button>
          </div>
        </div>
      </div>

      {/* ------------------ MUI Dialog for Add Transaction ------------------ */}
      <Dialog
        open={isModalOpen}
        onClose={closeModal}
        TransitionComponent={SlideUpTransition}
        fullWidth
        maxWidth="sm"
        // Style overrides: pinned to bottom, horizontally centered
        sx={{
          '& .MuiDialog-container': {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-end',
          },
          '& .MuiDialog-paper': {
            margin: 0,
            borderRadius: '8px 8px 0 0',
            width: '100%',
          },
        }}
      >
        <DialogTitle className="flex items-center justify-between">
          <Typography variant="subtitle1" className="font-bold">
            {modalType === 'in'
              ? 'Add Payment In'
              : modalType === 'out'
              ? 'Add Payment Out'
              : 'Transfer Between Accounts'}
          </Typography>
          <IconButton onClick={closeModal} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          {error && <p className="text-xs text-red-500 mb-2">{error}</p>}

          {/* Date & Time */}
          <TextField
            label="Date & Time"
            type="datetime-local"
            fullWidth
            margin="dense"
            size="small"
            value={transactionData.date}
            onChange={(e) => setTransactionData({ ...transactionData, date: e.target.value })}
            InputLabelProps={{ shrink: true }}
            required
          />

          {/* Payment From (for IN or TRANSFER) */}
          {(modalType === 'in' || modalType === 'transfer') && (
            <>
              {modalType === 'in' ? (
                <TextField
                  label="Payment From"
                  fullWidth
                  margin="dense"
                  size="small"
                  value={transactionData.paymentFrom}
                  onChange={(e) =>
                    setTransactionData({ ...transactionData, paymentFrom: e.target.value })
                  }
                  required
                />
              ) : (
                <FormControl fullWidth margin="dense" size="small">
                  <InputLabel>Payment From</InputLabel>
                  <Select
                    label="Payment From"
                    value={transactionData.paymentFrom}
                    onChange={(e) =>
                      setTransactionData({ ...transactionData, paymentFrom: e.target.value })
                    }
                    required
                  >
                    <MenuItem value="">Select Account</MenuItem>
                    {accounts.map((account, index) => (
                      <MenuItem key={index} value={account.accountId}>
                        {account.accountName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </>
          )}

          {/* Payment To (for OUT or TRANSFER) */}
          {(modalType === 'out' || modalType === 'transfer') && (
            <>
              {modalType === 'out' ? (
                <TextField
                  label="Payment To"
                  fullWidth
                  margin="dense"
                  size="small"
                  value={transactionData.paymentTo}
                  onChange={(e) =>
                    setTransactionData({ ...transactionData, paymentTo: e.target.value })
                  }
                  required
                />
              ) : (
                <FormControl fullWidth margin="dense" size="small">
                  <InputLabel>Payment To</InputLabel>
                  <Select
                    label="Payment To"
                    value={transactionData.paymentTo}
                    onChange={(e) =>
                      setTransactionData({ ...transactionData, paymentTo: e.target.value })
                    }
                    required
                  >
                    <MenuItem value="">Select Account</MenuItem>
                    {accounts.map((account, index) => (
                      <MenuItem key={index} value={account.accountId}>
                        {account.accountName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </>
          )}

          {/* Category */}
          {!showAddCategory ? (
            <FormControl fullWidth margin="dense" size="small">
              <InputLabel>Category</InputLabel>
              <Select
                label="Category"
                value={transactionData.category}
                onChange={(e) => {
                  if (e.target.value === 'add_new_category') {
                    setShowAddCategory(true);
                  } else {
                    setTransactionData({ ...transactionData, category: e.target.value });
                  }
                }}
                required
              >
                <MenuItem value="">Select Category</MenuItem>
                {categories.map((cat, index) => (
                  <MenuItem key={index} value={cat.name}>
                    {cat.name}
                  </MenuItem>
                ))}
                <MenuItem value="add_new_category">+ Add New Category</MenuItem>
              </Select>
            </FormControl>
          ) : (
            <div className="my-2">
              <TextField
                label="New Category"
                fullWidth
                margin="dense"
                size="small"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
              />
              <Button
                variant="outlined"
                color="success"
                size="small"
                onClick={handleAddCategory}
              >
                Save Category
              </Button>
              <Button
                variant="text"
                size="small"
                onClick={handleAddNewCategoryToggle}
                style={{ marginLeft: 8 }}
              >
                Cancel
              </Button>
            </div>
          )}

          {/* Amount */}
          <TextField
            label="Amount"
            type="number"
            fullWidth
            margin="dense"
            size="small"
            value={transactionData.amount}
            onChange={(e) => setTransactionData({ ...transactionData, amount: e.target.value })}
            required
            inputProps={{ min: '0.01', step: '0.01' }}
          />

          {/* Payment Method */}
          <FormControl fullWidth margin="dense" size="small">
            <InputLabel>Payment Method</InputLabel>
            <Select
              label="Payment Method"
              value={transactionData.method}
              onChange={(e) =>
                setTransactionData({ ...transactionData, method: e.target.value })
              }
              required
            >
              <MenuItem value="">Select Method</MenuItem>
              {accounts.map((account, index) => (
                <MenuItem key={index} value={account.accountId}>
                  {account.accountName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Remark */}
          <TextField
            label="Remark"
            multiline
            rows={2}
            fullWidth
            margin="dense"
            size="small"
            value={transactionData.remark}
            onChange={(e) => setTransactionData({ ...transactionData, remark: e.target.value })}
            placeholder="Optional remarks"
          />

        </DialogContent>

        <DialogActions>
          <Button variant="outlined" onClick={closeModal} size="small">
            Cancel
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            size="small"
            onClick={handleTransactionSubmit}
          >
            Add Transaction
          </Button>
        </DialogActions>
      </Dialog>

      {/* Tailwind Animations */}
      <style jsx>{`
        @keyframes slide-down {
          from {
            transform: translateY(-100%);
          }
          to {
            transform: translateY(0%);
          }
        }
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default DailyTransactions;
