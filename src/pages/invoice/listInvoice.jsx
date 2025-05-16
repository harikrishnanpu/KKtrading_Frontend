// BillingList.js
// =============================================================================
// Importing React and supporting libraries
// =============================================================================
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { FaUser } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import useAuth from 'hooks/useAuth';

// =============================================================================
// MUI Imports
// =============================================================================
import Dialog from '@mui/material/Dialog';
import Slide from '@mui/material/Slide';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import BillingCard from './components/mobileviewCard';
import NeededToPurchaseDialog from './components/neededtoPurchase';
import ErrorModal from './components/errorModel';

// =============================================================================
// Transition Component for Dialog (Slide Up Animation)
// =============================================================================
const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

// =============================================================================
// Helper Components: StatusIndicator and ProfitBadge
// =============================================================================

/**
 * StatusIndicator
 * Renders an animated colored dot based on the billing’s delivery and payment statuses.
 */
const StatusIndicator = ({ billing }) => {
  let colorClass = 'bg-red-500';
  if (billing.deliveryStatus === 'Delivered' && billing.paymentStatus === 'Paid') {
    colorClass = 'bg-green-500';
  } else if (
    (billing.deliveryStatus === 'Delivered' && billing.paymentStatus !== 'Paid') ||
    (billing.deliveryStatus !== 'Delivered' && billing.paymentStatus === 'Paid')
  ) {
    colorClass = 'bg-yellow-500';
  }
  return (
    <motion.div
      className={`w-3 h-3 rounded-full ${colorClass}`}
      animate={{ scale: [1, 1.2, 1] }}
      transition={{ duration: 1.5, repeat: Infinity }}
    />
  );
};

const StatusIndicatorForNeedPurchase = ({ billing }) => {
  let colorClass = 'bg-red-500';
if( billing.isneededToPurchase && billing.neededToPurchase.length > 0 && billing.neededToPurchase.every(item => item.purchased && item.verified) ){
  colorClass = "bg-green-500"
}
  return (
    <motion.div
      className={`w-3 h-3 rounded-full ${colorClass}`}
      animate={{ scale: [1, 1.2, 1] }}
      transition={{ duration: 1.5, repeat: Infinity }}
    />
  );
};



/**
 * ProfitBadge
 * Renders a small badge indicating the profit percentage with color coding.
 */
const ProfitBadge = ({ value }) => (
  <span
    className={`px-2 py-1 rounded-full text-xs font-semibold ${
      value >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
    }`}
  >
    {value >= 0 ? '+' : ''}
    {value.toFixed(2)}%
  </span>
);

// =============================================================================
// BillingList Component
// =============================================================================
const BillingList = () => {
  const navigate = useNavigate();
  const { user: userInfo } = useAuth();

// Add after your existing state declarations
const [neededToPurchaseOpen, setNeededToPurchaseOpen] = useState(false);
const [needtopurchaseBill, setNeededToPurchaseBill] = useState(null);

const handleNeedPurchase = (billing) => {
  setNeededToPurchaseBill(billing._id);
  setNeededToPurchaseOpen(true);
};


  // ---------------------------------------------------------------------------
  // State Variables
  // ---------------------------------------------------------------------------
  const [billings, setBillings] = useState([]);
  const [selectedBilling, setSelectedBilling] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState(null);
  const [products, setProducts] = useState([]);


const [stats, setStats] = useState({
  totalInvoices: 0,
  totalRevenue: 0,
  totalProfit: 0,
  totalCost: 0,
  totalOtherExpense: 0,
  totalFuelCharge: 0,
  totalPending: 0
});
const [totalPages, setTotalPages] = useState(0);   // server-derived page count


  // Pagination & Filtering State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const [searchTerm, setSearchTerm] = useState('');
  const [invoiceStartDate, setInvoiceStartDate] = useState('');
  const [invoiceEndDate, setInvoiceEndDate] = useState('');
  const [deliveryStartDate, setDeliveryStartDate] = useState('');
  const [deliveryEndDate, setDeliveryEndDate] = useState('');
  const [sortField, setSortField] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [statusTab, setStatusTab] = useState('All');
  const [showSidebar, setShowSidebar] = useState(false);

  // ---------------------------------------------------------------------------
  // Data Fetching: Billings and Products
  // ---------------------------------------------------------------------------
// helper: turn local filter state into the query‐string object
const buildQuery = () => ({
  page        : currentPage,
  limit       : itemsPerPage,
  search      : searchTerm,
  invoiceStartDate,
  invoiceEndDate,
  deliveryStartDate,
  deliveryEndDate,
  status      : statusTab,
  userId      : userInfo._id,
  isAdmin     : userInfo.isAdmin,
});

useEffect(() => {
  const controller = new AbortController();     // one controller for both calls
  setLoading(true);

  const billingsReq = api.get('/api/billing/list/pagenated', {
    params : buildQuery(),
    signal : controller.signal,
  });

  const productsReq = api.get('/api/products/product/all', {
    signal : controller.signal,
  });

  Promise.all([billingsReq, productsReq])
    .then(([billingsRes, productsRes]) => {
  const { billings, totalCount, stats: baseStats } = billingsRes.data;

  /* ------------------------------------------------------------------ */
  /* build a quick lookup for cost-price                                 */
  /* ------------------------------------------------------------------ */
  const costMap = {};
  productsRes.data.forEach(p => { costMap[p.item_id] = parseFloat(p.price || 0); });

  /* ------------------------------------------------------------------ */
  /* ① total **cost** of all invoices (purchase side)                   */
  /* ------------------------------------------------------------------ */
  const totalCost = billings.reduce((acc, inv) => {
    const invoiceCost = inv.products.reduce(
      (sum, p) => sum + costMap[p.item_id] * p.quantity,
      0
    );
    return acc + invoiceCost;
  }, 0);

  /* ------------------------------------------------------------------ */
  /* ② total **profit** (revenue – cost – otherExp – fuel)              */
  /*     baseStats already contains:                                    */
  /*        totalRevenue | totalOtherExpense | totalFuelCharge          */
  /* ------------------------------------------------------------------ */
  const totalProfit =
    (baseStats.totalRevenue ?? 0) -
    totalCost -
    (baseStats.totalOtherExpense ?? 0) -
    (baseStats.totalFuelCharge ?? 0);

  /* ------------------------------------------------------------------ */
  /* push everything into state                                         */
  /* ------------------------------------------------------------------ */
  setBillings(billings);
  setTotalPages(Math.ceil(totalCount / itemsPerPage));
  setProducts(productsRes.data);

  setStats({
    ...baseStats,  // keep what the server already calculated
    totalCost,
    totalProfit,
  });
})

    .catch(err => {
      if (err.name !== 'CanceledError')
        setError('Failed to fetch data');
    })
    .finally(() => setLoading(false));

  // cleanup → abort if deps change or component unmounts
  return () => controller.abort();
}, [
  currentPage,
  searchTerm,
  invoiceStartDate,
  invoiceEndDate,
  deliveryStartDate,
  deliveryEndDate,
  statusTab,
  sortField,
  sortOrder,
  userInfo._id,
  userInfo.isAdmin,
]);

  

  // ---------------------------------------------------------------------------
  // Build a mapping for product details (keyed by item_id)
  // ---------------------------------------------------------------------------
  const productMap = useMemo(() => {
    const map = {};
    products.forEach((prod) => {
      map[prod.item_id] = prod;
    });
    return map;
  }, [products]);

  // ---------------------------------------------------------------------------
  // Profit Calculation Function
  // ----------------------------------------------------------------------------
  /**
   * calculateProfit
   * For a given billing, computes:
   * - Total Cost (based on product cost and quantity)
   * - Total Revenue (selling price * quantity)
   * - Total Profit = Total Revenue – Total Cost
   * - Profit Percentage = (Total Profit / Total Cost) * 100
   */
  const calculateProfit = (billing) => {
    let totalCost = 0;
    let totalRevenue = 0;
    let totalOtherExpenses = 0;
    let totalFuelExpenese = parseFloat(billing.totalFuelCharge) || 0;


    billing.products.forEach((p) => {
      const product = productMap[p.item_id];
      const ItemSellingPrice = billing.total
      const cost = parseFloat(product?.price || 0);
      const revenue = parseFloat(p.selledPrice) * p.quantity;
      totalCost += cost * p.quantity;
      totalRevenue += revenue;
    });

// Calculate total other expenses from billing.otherExpenses and billing.deliveries[*].otherExpenses
const calculateTotalOtherExpenses = (billing) => {
  let totalOtherExpenses = 0;

  // Sum billing-level other expenses
  if (billing.otherExpenses && billing.otherExpenses.length > 0) {
    billing.otherExpenses.forEach((expense) => {
      totalOtherExpenses += parseFloat(expense.amount || 0);
    });
  }

  // Sum each delivery's other expenses
  if (billing.deliveries && billing.deliveries.length > 0) {
    billing.deliveries.forEach((delivery) => {
      if (delivery.otherExpenses && delivery.otherExpenses.length > 0) {
        delivery.otherExpenses.forEach((expense) => {
          totalOtherExpenses += parseFloat(expense.amount || 0);
        });
      }
      if(delivery.bata && delivery.bata !== undefined) {
        totalOtherExpenses += parseFloat(delivery.bata);
      }
    });
  }

  return totalOtherExpenses;
};

// Example usage:
// Assuming 'billing' is an object fetched from your database using the BillingSchema
const totalOtherExpense = calculateTotalOtherExpenses(billing);



    const totalProfit = totalRevenue - totalOtherExpense - totalFuelExpenese - totalCost;
    const profitPercentage = totalCost > 0 ? ( totalRevenue - totalOtherExpense - totalFuelExpenese - totalCost ) / totalRevenue * 100 : 0;

    return { totalCost, totalRevenue, totalProfit, profitPercentage, totalOtherExpense, totalFuelExpenese };
  };

  // ---------------------------------------------------------------------------
  // Filter and Sort the Billings
  // ---------------------------------------------------------------------------
  const filteredBillings = useMemo(() => {
    let data = [...billings];

    // Non-admin users see only their submitted and unapproved billings
    if (!userInfo.isAdmin) {
      data = data.filter((b) => b.submittedBy === userInfo._id && !b.isApproved);
    }

    // Search Filter: check invoiceNo, customerName, salesmanName, etc.
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      data = data.filter((b) =>
        Object.values(b)
          .filter((val) => val !== null && typeof val === 'string')
          .some((val) => val.toLowerCase().includes(lowerSearch))
      );
    }

    // Date Range Filters: Invoice Date and Expected Delivery Date
    const dateFilter = (date, start, end) =>
      (!start || new Date(date) >= new Date(start)) &&
      (!end || new Date(date) <= new Date(end));

    data = data.filter(
      (b) =>
        dateFilter(b.invoiceDate, invoiceStartDate, invoiceEndDate) &&
        dateFilter(b.expectedDeliveryDate, deliveryStartDate, deliveryEndDate)
    );

    // Status Filter
    const statusFilters = {
      All: () => true,
      Paid: (b) => b.paymentStatus === 'Paid',
      Pending: (b) => b.paymentStatus !== 'Paid' && b.isApproved,
      Unapproved: (b) => !b.isApproved,
      'Need to Purchase': (b) =>
    b.neededToPurchase &&
     b.neededToPurchase.length > 0 &&
     b.neededToPurchase.some(item => !item.purchased || !item.verified)
    };
    data = data.filter(statusFilters[statusTab]);

    // Sorting Logic
    if (sortField) {
      data.sort((a, b) => {
        let aVal = a[sortField];
        let bVal = b[sortField];

        // Support nested fields (e.g., "products.length")
        if (sortField.includes('.')) {
          const fields = sortField.split('.');
          aVal = fields.reduce((acc, curr) => acc[curr], a);
          bVal = fields.reduce((acc, curr) => acc[curr], b);
        }

        if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase();
          bVal = bVal.toLowerCase();
        }
        if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return data;
  }, [
    billings,
    searchTerm,
    invoiceStartDate,
    invoiceEndDate,
    deliveryStartDate,
    deliveryEndDate,
    sortField,
    sortOrder,
    statusTab,
    userInfo,
  ]);

  // ---------------------------------------------------------------------------
  // Pagination Calculations
  // ---------------------------------------------------------------------------
  // const totalPages = Math.ceil(filteredBillings.length / itemsPerPage);
  const paginatedBillings = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredBillings.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredBillings, currentPage]);

  // ---------------------------------------------------------------------------
  // Stats Calculation across all filtered billings (including pending amount)
  // ---------------------------------------------------------------------------
  // const stats = useMemo(() => {
  //   return filteredBillings.reduce(
  //     (acc, b) => {
  //       const profit = calculateProfit(b);
  //       const billingAmount = parseFloat(b.billingAmount) || 0;
  //       const received = parseFloat(b.billingAmountReceived) || 0;
  //       const pending = billingAmount - received;
  
  //       acc.totalInvoices += 1;
  //       acc.totalRevenue += profit.totalRevenue;
  //       acc.totalProfit += profit.totalProfit;
  //       acc.totalCost += profit.totalCost;
  //       // Accumulate total other expenses and fuel charges
  //       acc.totalOtherExpense += profit.totalOtherExpense;
  //       acc.totalFuelCharge += profit.totalFuelExpenese;
  //       if (b.paymentStatus !== 'Paid') {
  //         acc.totalPending += pending;
  //       }
  //       return acc;
  //     },
  //     {
  //       totalInvoices: 0,
  //       totalRevenue: 0,
  //       totalProfit: 0,
  //       totalCost: 0,
  //       totalOtherExpense: 0,
  //       totalFuelCharge: 0,
  //       totalPending: 0,
  //     }
  //   );
  // }, [filteredBillings]);
  

  // ---------------------------------------------------------------------------
  // Event Handlers for Admin Actions and Modal Controls
  // ---------------------------------------------------------------------------
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleView = (billing) => {
    setSelectedBilling(billing);
  };

  const closeModal = () => {
    setSelectedBilling(null);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setInvoiceStartDate('');
    setInvoiceEndDate('');
    setDeliveryStartDate('');
    setDeliveryEndDate('');
    setSortField('');
    setSortOrder('asc');
    setStatusTab('All');
  };

  const toggleSidebar = () => {
    setShowSidebar((prev) => !prev);
  };

  // ---------------------------------------------------------------------------
  // Admin Functions: Generate PDF, Print Invoice, Remove Billing, Approve Billing
  // ---------------------------------------------------------------------------
  const generatePDF = async (bill) => {
    setPdfLoading(true);
    try {
      const transformedProducts = bill.products.map((product) => {
        const { quantity, psRatio = '1', deliveredQuantity = 0 } = product;
        return { ...product, quantity, psRatio, deliveredQuantity };
      });
      const formData = {
        invoiceNo: bill.invoiceNo,
        customerName: bill.customerName,
        customerAddress: bill.customerAddress,
        customerContactNumber: bill.customerContactNumber,
        marketedBy: bill.marketedBy,
        salesmanName: bill.salesmanName,
        invoiceDate: bill.invoiceDate,
        expectedDeliveryDate: bill.expectedDeliveryDate,
        deliveryStatus: bill.deliveryStatus,
        billingAmountReceived: bill.billingAmountReceived || 0,
        payments: bill.payments || [],
        deliveries: bill.deliveries || [],
        products: transformedProducts,
      };

      const response = await api.post(
        '/api/print/generate-loading-slip-pdf',
        formData
      );
      const htmlContent = response.data;
      const printWindow = window.open('', '', 'height=800,width=600');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
      } else {
        alert('Popup blocked! Please allow popups for this website.');
      }
    } catch (err) {
      setError('Failed to generate PDF.');
      console.error(err);
    } finally {
      setPdfLoading(false);
    }
  };

  const printInvoice = async (bill) => {
    setPdfLoading(true);
    try {
      const cgst = (
        (parseFloat(bill.billingAmount) -
          parseFloat(bill.billingAmount / 1.18)) /
        2
      ).toFixed(2);
      const sgst = cgst;
      const subTotal = (
        parseFloat(bill.billingAmount) - parseFloat(cgst) - parseFloat(sgst)
      ).toFixed(2);

      const formData = {
        invoiceNo: bill.invoiceNo,
        invoiceDate: bill.invoiceDate,
        salesmanName: bill.salesmanName,
        expectedDeliveryDate: bill.expectedDeliveryDate,
        deliveryStatus: bill.deliveryStatus,
        salesmanPhoneNumber: bill.salesmanPhoneNumber,
        paymentStatus: bill.paymentStatus,
        billingAmount: bill.billingAmount,
        paymentAmount: bill.paymentAmount,
        paymentMethod: bill.paymentMethod || '',
        paymentReceivedDate: bill.updatedAt || '',
        customerName: bill.customerName,
        customerAddress: bill.customerAddress,
        customerContactNumber: bill.customerContactNumber,
        marketedBy: bill.marketedBy,
        subTotal,
        cgst,
        sgst,
        discount: bill.discount,
        products: bill.products.map((product) => ({
          item_id: product.item_id,
          name: product.name,
          category: product.category,
          brand: product.brand,
          quantity: product.quantity,
          sellingPrice: product.sellingPrice,
          enteredQty: product.enteredQty,
          selledPrice: product.selledPrice,
          unit: product.unit,
          size: product.size,
        })),
      };

      const response = await api.post('/generate-invoice-html', formData);
      const htmlContent = response.data;
      const printWindow = window.open('', '', 'height=800,width=600');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
      } else {
        alert('Popup blocked! Please allow popups for this website.');
      }
    } catch (error) {
      setError('Failed to print invoice.');
      console.error('Error:', error);
    } finally {
      setPdfLoading(false);
    }
  };

  const handleRemove = async (id, bill) => {
    if (window.confirm(`Are you sure you want to remove this billing ${bill}`)) {
      try {
        await api.delete(`/api/billing/billings/delete/${id}?userId=${userInfo._id}`);
        setBillings((prevBillings) => prevBillings.filter((billing) => billing._id !== id));
      } catch (error) {
        setError('Error occurred while deleting the billing.');
        console.error(error);
      }
    }
  };
  

  const handleApprove = async (bill) => {
    try {
      if (window.confirm('Are you sure you want to approve this billing?')) {
        await api.put(`/api/billing/bill/approve/${bill._id}`, { userId: userInfo._id });
        setBillings(
          billings.map((b) =>
            b._id === bill._id ? { ...b, isApproved: true } : b
          )
        );
      }
    } catch (error) {
      setError(error?.response?.data?.message || error?.message || 'Something went wrong');
      console.error(error);
    }
  };

  // =============================================================================
  // Render Functions for Skeleton Loaders, Desktop Table, and Mobile Cards
  // =============================================================================

  // Skeleton Loader for Table View
  const TableSkeleton = () => (
    <>
      {[...Array(itemsPerPage)].map((_, i) => (
        <tr key={i} className="hover:bg-gray-50">
          {[...Array(10)].map((_, j) => (
            <td key={j} className="p-4">
              <Skeleton height={20} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );

  // Skeleton Loader for Mobile Card View
  const CardSkeleton = () => {
    const skeletonCards = Array.from({ length: itemsPerPage }, (_, index) => index);
    return skeletonCards.map((card) => (
      <div
        key={card}
        className="bg-white rounded-lg shadow-md p-4 mb-4 animate-pulse"
      >
        <Skeleton height={20} width={`60%`} />
        <Skeleton height={10} width={`80%`} className="mt-2" />
        <Skeleton height={10} width={`70%`} className="mt-1" />
        <Skeleton height={10} width={`50%`} className="mt-1" />
        <div className="flex mt-4 space-x-2">
          <Skeleton height={30} width={60} />
          <Skeleton height={30} width={60} />
          <Skeleton height={30} width={60} />
          <Skeleton height={30} width={60} />
        </div>
      </div>
    ));
  };



  // Render Mobile Card for each Billing

  const renderCard = (billing) => {
    const profit = calculateProfit(billing);
    return (
      <BillingCard
        key={billing._id}
        billing={billing}
        userInfo={userInfo}
        profit={profit}
        handleView={handleView}
        handleRemove={handleRemove}
        handleApprove={handleApprove}
        generatePDF={generatePDF}
      />
    );
  };
  

  // =============================================================================
  // Main Render Return
  // =============================================================================
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* -------------------------------------------------------------------------
          PDF Loading Overlay
      ------------------------------------------------------------------------- */}
      {pdfLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="flex flex-col items-center">
            <i className="fa fa-spinner fa-spin text-white text-4xl mb-4"></i>
            <p className="text-white text-xs">Generating PDF...</p>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------------
          Mobile Sidebar for Filters (Overlay)
      ------------------------------------------------------------------------- */}
      <div
        className={`fixed z-50 inset-0 bg-black bg-opacity-50 ${
          showSidebar ? 'block' : 'hidden'
        } md:hidden`}
        onClick={() => setShowSidebar(false)}
      ></div>
      <div
        className={`fixed top-0 left-0 h-full bg-white shadow-md p-4 w-64 z-50 transform ${
          showSidebar ? 'translate-x-0' : '-translate-x-full'
        } transition-transform md:translate-x-0 md:static md:hidden md:p-0`}
      >
        <h2 className="text-md font-bold text-red-600 mb-4">
          Filters & Sorting
        </h2>
        {/* Search Input */}
        <div className="mb-4">
          <label className="block text-xs font-bold mb-1" htmlFor="search">
            Search
          </label>
          <input
            type="text"
            id="search"
            placeholder="Search by Invoice No, Customer, Salesman, Showroom..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-red-300 rounded px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-red-400"
          />
        </div>
        {/* Invoice Date Range */}
        <div className="mb-4">
          <label
            className="block text-xs font-bold mb-1"
            htmlFor="invoiceStartDate"
          >
            Invoice Start Date
          </label>
          <input
            type="date"
            id="invoiceStartDate"
            value={invoiceStartDate}
            onChange={(e) => setInvoiceStartDate(e.target.value)}
            className="w-full border border-red-300 rounded px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-red-400"
          />
        </div>
        <div className="mb-4">
          <label
            className="block text-xs font-bold mb-1"
            htmlFor="invoiceEndDate"
          >
            Invoice End Date
          </label>
          <input
            type="date"
            id="invoiceEndDate"
            value={invoiceEndDate}
            onChange={(e) => setInvoiceEndDate(e.target.value)}
            className="w-full border border-red-300 rounded px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-red-400"
          />
        </div>
        {/* Delivery Date Range */}
        <div className="mb-4">
          <label
            className="block text-xs font-bold mb-1"
            htmlFor="deliveryStartDate"
          >
            Delivery Start Date
          </label>
          <input
            type="datetime-local"
            id="deliveryStartDate"
            value={deliveryStartDate}
            onChange={(e) => setDeliveryStartDate(e.target.value)}
            className="w-full border border-red-300 rounded px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-red-400"
          />
        </div>
        <div className="mb-4">
          <label
            className="block text-xs font-bold mb-1"
            htmlFor="deliveryEndDate"
          >
            Delivery End Date
          </label>
          <input
            type="datetime-local"
            id="deliveryEndDate"
            value={deliveryEndDate}
            onChange={(e) => setDeliveryEndDate(e.target.value)}
            className="w-full border border-red-300 rounded px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-red-400"
          />
        </div>
        <div className="flex justify-end mt-4">
          <button
            onClick={resetFilters}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-xs font-bold"
          >
            reset
          </button>
        </div>
      </div>

      {/* -------------------------------------------------------------------------
          Error Message Display
      ------------------------------------------------------------------------- */}
<ErrorModal
   open={Boolean(error)}
   message={error}
   onClose={() => setError(null)}
 />

      {/* -------------------------------------------------------------------------
          Desktop Header and Stats (For Admin Users)
      ------------------------------------------------------------------------- */}
      {userInfo.isSuper && (
        <div className="mb-6 space-y-4">
          <div className="flex flex-wrap justify-center sm:justify-start gap-4">
            <motion.div
              className="bg-white p-4 rounded-lg shadow-md flex-1 min-w-[200px]"
              whileHover={{ scale: 1.02 }}
            >
              <p className="text-xs font-bold text-red-600">Total Invoices</p>
              <p className="text-xs text-gray-500">{stats.totalInvoices} invoices</p>
              <p className="text-sm font-bold text-gray-700">
                ₹{stats?.totalRevenue?.toLocaleString()}
              </p>
            </motion.div>
            <motion.div
              className="bg-white p-4 rounded-lg shadow-md flex-1 min-w-[200px]"
              whileHover={{ scale: 1.02 }}
            >
              <p className="text-xs font-bold text-green-600">Total Revenue</p>
              <p className="text-xs text-gray-500">{stats.totalInvoices} invoices</p>
              <p className="text-sm font-bold text-gray-700">
                ₹{stats?.totalRevenue?.toLocaleString()}
              </p>
            </motion.div>
            <motion.div
              className="bg-white p-4 rounded-lg shadow-md flex-1 min-w-[200px]"
              whileHover={{ scale: 1.02 }}
            >
              <p className="text-xs font-bold text-purple-600">Total Profit</p>
<p
  className={`text-xs text-gray-500 ${
    ((stats.totalRevenue ?? 0) -
      (stats.totalFuelCharge ?? 0) -
      (stats.totalOtherExpense ?? 0) -
      (stats.totalCost ?? 0)) > 0
      ? 'text-green-500'
      : 'text-red-500'
  }`}
>
Margin:{' '}
{(stats.totalRevenue ?? 0) > 0
  ? `${(
      ((stats.totalRevenue - (stats.totalCost ?? 0) - (stats.totalOtherExpense ?? 0) - (stats.totalFuelCharge ?? 0)) /
        stats.totalRevenue) *
      100
    ).toFixed(2)}%`
  : '0.00%'}

</p>



 <p className="text-sm font-bold text-gray-700">
  ₹{(stats?.totalProfit ?? 0).toLocaleString()}
</p>

            </motion.div>
            <motion.div
              className="bg-white p-4 rounded-lg shadow-md flex-1 min-w-[200px]"
              whileHover={{ scale: 1.02 }}
            >
              <p className="text-xs font-bold text-blue-600">Avg. Profit/Invoice</p>
              <p className="text-sm font-bold text-gray-700">
                ₹{(stats?.totalProfit / stats?.totalInvoices || 0).toLocaleString()}
              </p>
            </motion.div>
            {/* New Stat Card: Total Pending Amount */}
            <motion.div
              className="bg-white p-4 rounded-lg shadow-md flex-1 min-w-[200px]"
              whileHover={{ scale: 1.02 }}
            >
              <p className="text-xs font-bold text-orange-600">Total Pending</p>
              <p className="text-xs text-gray-500">
                {stats?.totalInvoices} invoices
              </p>
              <p className="text-sm font-bold text-gray-700">
                ₹{stats?.totalPending?.toLocaleString()}
              </p>
            </motion.div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------------
          Tabs for Status Filter (Desktop)
      ------------------------------------------------------------------------- */}
      <div className="flex flex-wrap justify-center sm:justify-start space-x-2 mb-4">
      {['All', 'Paid', 'Pending', 'Unapproved', 'Need to Purchase'].map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setStatusTab(tab);
              setCurrentPage(1);
            }}
            className={`px-3 py-1 rounded text-xs font-bold ${
              statusTab === tab
                ? 'bg-red-600 text-white'
                : 'bg-gray-50 text-red-700 hover:bg-red-100'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* -------------------------------------------------------------------------
          Desktop Filters
      ------------------------------------------------------------------------- */}
      <div className="hidden md:block bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="flex flex-col space-y-4 sm:flex-row sm:flex-wrap sm:space-y-0 sm:space-x-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-bold mb-1" htmlFor="search">
              Search
            </label>
            <input
              type="text"
              id="search"
              placeholder="Search by Invoice No, Customer, Salesman, Showroom..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-red-300 rounded px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-red-400"
            />
          </div>
          <div className="min-w-[150px]">
            <label className="block text-xs font-bold mb-1" htmlFor="invoiceStartDate">
              Invoice Start Date
            </label>
            <input
              type="date"
              id="invoiceStartDate"
              value={invoiceStartDate}
              onChange={(e) => setInvoiceStartDate(e.target.value)}
              className="w-full border border-red-300 rounded px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-red-400"
            />
          </div>
          <div className="min-w-[150px]">
            <label className="block text-xs font-bold mb-1" htmlFor="invoiceEndDate">
              Invoice End Date
            </label>
            <input
              type="date"
              id="invoiceEndDate"
              value={invoiceEndDate}
              onChange={(e) => setInvoiceEndDate(e.target.value)}
              className="w-full border border-red-300 rounded px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-red-400"
            />
          </div>
          <div className="min-w-[150px]">
            <label className="block text-xs font-bold mb-1" htmlFor="deliveryStartDate">
              Delivery Start Date
            </label>
            <input
              type="datetime-local"
              id="deliveryStartDate"
              value={deliveryStartDate}
              onChange={(e) => setDeliveryStartDate(e.target.value)}
              className="w-full border border-red-300 rounded px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-red-400"
            />
          </div>
          <div className="min-w-[150px]">
            <label className="block text-xs font-bold mb-1" htmlFor="deliveryEndDate">
              Delivery End Date
            </label>
            <input
              type="datetime-local"
              id="deliveryEndDate"
              value={deliveryEndDate}
              onChange={(e) => setDeliveryEndDate(e.target.value)}
              className="w-full border border-red-300 rounded px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-red-400"
            />
          </div>
          <div className="flex justify-end mt-4">
            <button
              onClick={resetFilters}
              className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded text-xs font-bold"
            >
               reset
            </button>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------------------
          Main Content: Desktop Table or Mobile Cards
      ------------------------------------------------------------------------- */}
      {loading ? (
        <div>
          <div className="hidden md:block">
            <table className="table w-full">
              <tbody>
                <TableSkeleton />
              </tbody>
            </table>
          </div>
          <div className="md:hidden">
            <CardSkeleton />
          </div>
        </div>
      ) : filteredBillings.length === 0 ? (
        <p className="text-center text-gray-500 text-xs">
          No invoices match your search and filter criteria.
        </p>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <table className="w-full text-xs text-gray-500 bg-white shadow-md rounded-lg overflow-hidden">
              <thead className="bg-red-600 text-xs text-white">
                <tr className="divide-y">
                  <th className="px-4 py-2 text-left">Status</th>
                  <th
                    className="px-2 py-2 cursor-pointer"
                    onClick={() => {
                      setSortField('invoiceNo');
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    }}
                  >
                    Invoice No {sortField === 'invoiceNo' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="px-2 py-2 cursor-pointer"
                    onClick={() => {
                      setSortField('invoiceDate');
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    }}
                  >
                    Invoice Date {sortField === 'invoiceDate' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="px-2 py-2 cursor-pointer"
                    onClick={() => {
                      setSortField('expectedDeliveryDate');
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    }}
                  >
                    Delivery Date {sortField === 'expectedDeliveryDate' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-2 py-2">Showroom</th>
                  <th className="px-2 py-2">Salesman</th>
                  <th className="px-2 py-2">Customer</th>
                  <th className="px-2 py-2">Products</th>
                  <th className="px-2 py-2">Payment</th>
                  <th className="px-2 py-2">Delivery</th>
                  <th className='px-2 py-2'>Total Amount</th>
                  <th className="px-2 py-2">Remark</th>
                  {userInfo.isSuper && <th className="px-2 py-2">P/L (%)</th>}
                  <th className="px-2 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedBillings.map((billing) => {
                  const profit = calculateProfit(billing);
                  return (
                    <motion.tr
                      key={billing._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="hover:bg-gray-100 divide-y divide-x"
                    >
                      <td className="px-4 py-2">
                        <div className='flex justify-between'>
                        <StatusIndicator billing={billing} />
                        { billing.neededToPurchase?.length > 0 && <StatusIndicatorForNeedPurchase billing={billing} /> }
                        </div>
                      </td>
                      <td
                        onClick={() => navigate(`/invoice/details/${billing._id}`)}
                        className={`px-2 cursor-pointer text-xs font-bold py-2 ${
                          billing.isApproved ? 'text-red-600' : 'text-yellow-600'
                        }`}
                      >
                        <div className='flex justify-between'>
                        {billing.invoiceNo}{' '}
                        {billing.isApproved && (
                          <img
                          className="h-2 w-2 ml-1 mt-1"
                          src="/images/tick.svg"
                          alt="Approved"
                          />
                        )}
                        </div>
                      </td>
                      <td className="px-2 text-xs py-2">
                        {format(new Date(billing.invoiceDate), 'dd MMM yyyy')}
                      </td>
                      <td className="px-2 text-xs py-2">
                        {format(new Date(billing.expectedDeliveryDate), 'dd MMM yyyy, HH:mm')}
                      </td>
                      <td className="px-2 text-xs py-2">
                        {billing.showroom == "Moncompu - Main Office" ? 'MNCP' : 'CGNSH'}
                      </td>
                      <td className="px-2 text-xs py-2">
                        {billing.salesmanName}
                      </td>
                      <td className="px-2 text-xs py-2">
                        {billing.customerName}
                      </td>
                      <td className="px-2 text-xs py-2">
                        {billing.products.length}
                      </td>
                      <td className="px-2 text-xs py-2">
                        {billing.paymentStatus}
                      </td>
                      <td className="px-2 text-xs py-2">
                        {billing.deliveryStatus}
                      </td>
                      <td className="px-2 text-xs font-bold py-2">
                        Rs.{billing.grandTotal}
                      </td>
                      <td className="px-2 text-xs py-2">
                        {billing.remark || '--'}
                      </td>
                      {userInfo.isSuper && (
                        <td className="px-2 text-xs py-2">
                          {profit ? (
                            <ProfitBadge value={profit.profitPercentage} />
                          ) : (
                            'N/A'
                          )}
                        </td>
                      )}
                      <td className="px-2 text-xs py-2">
                        <div className="flex mt-2 flex-wrap gap-2 text-xs space-x-1">
                          {userInfo.isAdmin && (
                            <button
                              onClick={() => navigate(`/invoice/edit/${billing._id}`)}
                              className="bg-red-500 hover:bg-red-600 text-white px-2 font-bold py-1 rounded flex items-center"
                            >
                              <i className="fa fa-pen mr-1"></i> Edit
                            </button>
                          )}
                          {userInfo.isAdmin && (
                            <button
                              onClick={() => generatePDF(billing)}
                              className="bg-red-500 hover:bg-red-600 text-white px-2 font-bold py-1 rounded flex items-center"
                            >
                              <i className="fa fa-truck mr-1"></i>
                            </button>
                          )}
                          <button
                            onClick={() => handleView(billing)}
                            className="bg-red-500 hover:bg-red-600 text-white px-2 font-bold py-1 rounded flex items-center"
                          >
                            <i className="fa fa-eye mr-1"></i> View
                          </button>
                          {userInfo.isAdmin && (
                            <button
                              onClick={() => handleRemove(billing._id,billing.invoiceNo)}
                              className="bg-red-500 hover:bg-red-600 text-white px-2 font-bold py-1 rounded flex items-center"
                            >
                              <i className="fa fa-trash mr-1"></i> Delete
                            </button>
                          )}
                          {userInfo.isAdmin && !billing.isApproved && (
                            <button
                              onClick={() => handleApprove(billing)}
                              className="bg-green-500 hover:bg-green-600 text-white px-2 font-bold py-1 rounded flex items-center"
                            >
                              Approve
                            </button>
                          )}

{userInfo.isAdmin && billing.neededToPurchase.length > 0 && (
    <button
      onClick={() => handleNeedPurchase(billing)}
      className="bg-blue-500 hover:bg-blue-600 text-white px-2 font-bold py-1 rounded flex items-center"
    >
      purchase
    </button>
  )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden">{paginatedBillings.map(renderCard)}</div>

          {/* Pagination Controls */}
          <div className="flex justify-between items-center mt-4">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-4 text-xs font-bold py-2 rounded-lg ${
                currentPage === 1
                  ? 'bg-red-200 text-red-500 cursor-not-allowed'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              Previous
            </button>
            <span className="text-xs text-gray-500">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`px-4 text-xs font-bold py-2 rounded-lg ${
                currentPage === totalPages
                  ? 'bg-red-200 text-red-500 cursor-not-allowed'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              Next
            </button>
          </div>
        </>
      )}

      {/* -------------------------------------------------------------------------
          Full-screen Modal for Viewing Detailed Billing Information
      ------------------------------------------------------------------------- */}
      <Dialog
        open={Boolean(selectedBilling)}
        onClose={closeModal}
        fullScreen
        TransitionComponent={Transition}
        sx={{
          zIndex: 1300,
          width: '100%',
          height: '100%',
          position: 'fixed',
          top: 0,
          left: 0,
        }}
      >
        <DialogContent className="relative p-4 sm:p-8">
          <IconButton
            onClick={closeModal}
            sx={{ position: 'absolute', top: 8, right: 8, color: 'gray' }}
          >
            <CloseIcon fontSize="large" />
          </IconButton>
          <AnimatePresence exitBeforeEnter>
            {selectedBilling && (
              <motion.div
                key="billingModal"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.4 }}
                className="bg-white rounded-xl p-8 shadow-lg"
              >
                {/* Modal Header */}
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-2xl font-bold text-red-600">
                    Invoice #{selectedBilling.invoiceNo}
                  </h2>
                </div>

                {/* ---------------------------------------------------------------------
                    Billing Basic Information
                --------------------------------------------------------------------- */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-6">
                  <div>
                    <p className="mb-1">
                      <span className="font-bold">Salesman:</span>{' '}
                      <span className="text-gray-700">{selectedBilling.salesmanName}</span>
                    </p>
                    <p className="mb-1">
                      <span className="font-bold">Marketed By:</span>{' '}
                      <span className="text-gray-700">{selectedBilling.marketedBy}</span>
                    </p>
                    <p className="mb-1 flex items-center">
                      <FaUser className="text-gray-400 mr-1" />
                      <span className="font-bold">Customer:</span>{' '}
                      <span className="text-gray-700 ml-1">{selectedBilling.customerName}</span>
                    </p>
                    <p className="mb-1">
                      <span className="font-bold">Address:</span>{' '}
                      <span className="text-gray-700">{selectedBilling.customerAddress}</span>
                    </p>
                    <p className="mb-1">
                      <span className="font-bold">Contact:</span>{' '}
                      <span className="text-gray-700">{selectedBilling.customerContactNumber}</span>
                    </p>
                    <p className="mb-1">
                      <span className="font-bold">Showroom:</span>{' '}
                      <span className="text-gray-700">{selectedBilling.showroom}</span>
                    </p>
                  </div>
                  <div>
                    <p className="mb-1">
                      <span className="font-bold">Invoice Date:</span>{' '}
                      <span className="text-gray-700">
                        {format(new Date(selectedBilling.invoiceDate), 'dd MMM yyyy, HH:mm')}
                      </span>
                    </p>
                    <p className="mb-1">
                      <span className="font-bold">Expected Delivery:</span>{' '}
                      <span className="text-gray-700">
                        {format(new Date(selectedBilling.expectedDeliveryDate), 'dd MMM yyyy, HH:mm')}
                      </span>
                    </p>
                    <p className="mb-1">
                      <span className="font-bold">Delivery Status:</span>{' '}
                      <span
                        className={`px-2 py-1 rounded text-white text-xs ${
                          selectedBilling.deliveryStatus === 'Delivered'
                            ? 'bg-green-500'
                            : selectedBilling.deliveryStatus === 'Partially Delivered'
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`}
                      >
                        {selectedBilling.deliveryStatus}
                      </span>
                    </p>
                    <p className="mb-1">
                      <span className="font-bold">Payment Status:</span>{' '}
                      <span
                        className={`px-2 py-1 rounded text-white text-xs ${
                          selectedBilling.paymentStatus === 'Paid'
                            ? 'bg-green-500'
                            : selectedBilling.paymentStatus === 'Partial'
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`}
                      >
                        {selectedBilling.paymentStatus}
                      </span>
                    </p>
                    <p className="mb-1">
                      <span className="font-bold">Remark:</span>{' '}
                      <span className="text-gray-700">{selectedBilling.remark}</span>
                    </p>
                  </div>
                </div>

                {/* ---------------------------------------------------------------------
                    Product Table with Profit Calculations
                    (Profit columns are rendered only for admin users)
                --------------------------------------------------------------------- */}
                <h3 className="text-lg font-bold text-red-600 mb-4">
                  Products ({selectedBilling.products.length})
                </h3>
                <div className="overflow-x-auto mb-6">
                  <table className="w-full text-sm text-gray-500">
                    <thead className="bg-gray-100 text-xs uppercase text-gray-700">
                      <tr>
                      <th className="px-4 py-3">Id</th>
                        <th className="px-4 py-3">Product</th>
                       {userInfo.isAdmin && <th className="px-4 py-3">Cost Price</th>}
                        <th className="px-4 py-3">Selling Price</th>
                        <th className="px-4 py-3">Qty</th>
                        {userInfo.isSuper && (
                          <>
                            <th className="px-4 py-3">Profit %</th>
                            <th className="px-4 py-3">Total Profit</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {selectedBilling.products.map((product, index) => {
                        const prodDetails = productMap[product.item_id];
                        const cost = parseFloat(prodDetails?.price || 0).toFixed(2);
                        const selling = parseFloat(product.selledPrice);
                        const qty = product.quantity;
                        const profitPerUnit = selling - cost;
                        const totalProfit = profitPerUnit * qty;
                        const profitPercent = cost > 0 ? ( (selling * qty ) - ( cost * qty ) ) / (selling * qty ) * 100  : 0;

                        return (
                          <tr
                            key={index}
                            className="hover:bg-gray-50 text-center border-b"
                          >
                            <td className="px-4 py-3 font-semibold">{product.item_id}</td>
                            <td className="px-4 py-3 font-semibold">{product.name}</td>
                            {userInfo.isAdmin && <td className="px-4 py-3">₹{cost}</td> }
                            <td className="px-4 py-3">₹{selling.toFixed(2)}</td>
                            <td className="px-4 py-3">{qty}</td>
                            {userInfo.isSuper && (
                              <>
                                <td className="px-4 py-3">
                                  <ProfitBadge value={profitPercent} />
                                </td>
                                <td className="px-4 py-3 font-semibold">
                                  ₹{totalProfit.toFixed(2)}
                                </td>
                              </>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* ---------------------------------------------------------------------
                    Summary Cards: Revenue, Cost, Profit, and Margin (Admin only)
                --------------------------------------------------------------------- */}
                {userInfo.isSuper && (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                    <div className="stats bg-green-50 shadow p-4 rounded-lg">
                      <div className="stat">
                        <div className="stat-title">Total Revenue</div>
                        <div className="stat-value text-green-600">
                          ₹{selectedBilling?.grandTotal?.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="stats bg-blue-50 shadow p-4 rounded-lg">
                      <div className="stat">
                        <div className="stat-title">Total Cost</div>
                        <div className="stat-value text-blue-600">
                          ₹{calculateProfit(selectedBilling)?.totalCost.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="stats bg-purple-50 shadow p-4 rounded-lg">
                      <div className="stat">
                        <div className="stat-title">Total Other Exp.</div>
                        <div className="stat-value text-purple-600">
                          ₹{calculateProfit(selectedBilling)?.totalOtherExpense.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="stats bg-green-50 shadow p-4 rounded-lg">
                      <div className="stat">
                        <div className="stat-title">Total Fuel Exp.</div>
                        <div className="stat-value text-green-600">
                          ₹{calculateProfit(selectedBilling)?.totalFuelExpenese.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="stats bg-purple-50 shadow p-4 rounded-lg">
                      <div className="stat">
                        <div className="stat-title">Net Profit</div>
                        <div className="stat-value text-purple-600">
                          ₹{calculateProfit(selectedBilling)?.totalProfit.toLocaleString()}
                        </div>
             <div className="stat-desc">
  {(() => {
    const profit = calculateProfit(selectedBilling);
    return profit.totalCost > 0 && profit.totalRevenue > 0
      ? `${(
          ((profit.totalRevenue - profit.totalFuelExpenese - profit.totalOtherExpense - profit.totalCost) /
            profit.totalRevenue) *
          100
        ).toFixed(2)}% Margin`
      : '0.00% Margin';
  })()}
</div>

                      </div>
                    </div>
                  </div>
                )}

                {/* ---------------------------------------------------------------------
                    Payments & Deliveries Section
                --------------------------------------------------------------------- */}
                <div className="flex justify-between items-center bg-gray-100 p-4 rounded-lg">
                  <div>
                    <h3 className="font-semibold mb-2">Payment Status</h3>
                    <span
                      className={`badge ${
                        selectedBilling.paymentStatus === 'Paid'
                          ? 'badge-success'
                          : selectedBilling.paymentStatus === 'Partial'
                          ? 'badge-warning'
                          : 'badge-error'
                      }`}
                    >
                      {selectedBilling.paymentStatus}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Delivery Status</h3>
                    <span
                      className={`badge ${
                        selectedBilling.deliveryStatus === 'Delivered'
                          ? 'badge-success'
                          : selectedBilling.deliveryStatus === 'Partially Delivered'
                          ? 'badge-warning'
                          : 'badge-error'
                      }`}
                    >
                      {selectedBilling.deliveryStatus}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>


      <NeededToPurchaseDialog 
  open={neededToPurchaseOpen}
  onClose={() => {
    setNeededToPurchaseOpen(false);
    setNeededToPurchaseBill(null);
  }}
  billingId={needtopurchaseBill}
  onSubmitSuccess={() => {
    // Optionally refresh your billing data here
    setNeededToPurchaseOpen(false);
    setCurrentBillingId(null);
  }}
/>

    </div>
  );
};

export default BillingList;
