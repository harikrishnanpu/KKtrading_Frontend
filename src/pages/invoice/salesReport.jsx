/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import 'react-loading-skeleton/dist/skeleton.css';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import useAuth from 'hooks/useAuth';

import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUser } from 'react-icons/fa';

// ─── MUI ───────────────────────────────────────────────────────────
import {
  Dialog,
  DialogContent,
  IconButton,
  Slide
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

// ─── Transition for full-screen dialog ────────────────────────────
const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

// ─── Tiny badge for % profit ───────────────────────────────────────
const ProfitBadge = ({ value }) => (
  <span
    className={`px-2 py-3 rounded-full text-xs font-semibold ${
      value >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
    }`}
  >
    {value >= 0 ? '+' : ''}
    {value.toFixed(2)}%
  </span>
);

/* ────────────────────────────────────────────────────────── */
/*                       MAIN COMPONENT                      */
/* ────────────────────────────────────────────────────────── */
const SalesReport = () => {
  const navigate = useNavigate();           // reserved for future use
  const { user: userInfo } = useAuth();

  // ── Data pulled from server ─────────────────────────────────────
  const [billings, setBillings]   = useState([]);
  const [products, setProducts]   = useState([]);   // for cost lookup / brand-category
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');

  // ── Flattened product rows (one row per product line) ───────────
  const [flatProducts,     setFlatProducts]     = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);

  // ── Filters & sorting ───────────────────────────────────────────
  const [fromDate, setFromDate]           = useState('');
  const [toDate, setToDate]               = useState('');
  const [customerName, setCustomerName]   = useState('');
  const [salesmanName, setSalesmanName]   = useState('');
  const [invoiceNo, setInvoiceNo]         = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [deliveryStatus, setDeliveryStatus] = useState('');
  const [itemName, setItemName]           = useState('');
  const [amountThreshold, setAmountThreshold] = useState('');
  const [sortField, setSortField]         = useState('invoiceDate');
  const [sortDirection, setSortDirection] = useState('asc');

  // ── Pagination ──────────────────────────────────────────────────
  const itemsPerPage = 15;
  const [currentPage, setCurrentPage] = useState(1);

  // ── Totals ──────────────────────────────────────────────────────
  const [totalAmount, setTotalAmount] = useState(0);

  // ── Suggestions for datalists ───────────────────────────────────
  const [customerSuggestions, setCustomerSuggestions] = useState([]);
  const [salesmanSuggestions, setSalesmanSuggestions] = useState([]);
  const [invoiceSuggestions, setInvoiceSuggestions]   = useState([]);
  const [itemSuggestions, setItemSuggestions]         = useState([]);

  // ── Modal state (invoice detail) ────────────────────────────────
  const [selectedBilling, setSelectedBilling] = useState(null);

  /* ───────────────────────── FETCH DATA ────────────────────────── */
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [billingRes, productRes] = await Promise.all([
          api.get('/api/billing/sort/sales-report'),
          api.get('/api/products/product/all')
        ]);
        if (isMounted) {
          setBillings(billingRes.data);
          setProducts(productRes.data);
        }
      } catch (err) {
        if (isMounted) setError('Failed to fetch data.');
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => { isMounted = false; };
  }, []);

  /* ───────────────────── COST LOOKUP MAP ───────────────────────── */
  const productMap = useMemo(() => {
    const map = {};
    products.forEach((p) => (map[p.item_id] = p));
    return map;
  }, [products]);

  /* ─────────────────── FLATTEN BILLINGS → ROWS ─────────────────── */
  useEffect(() => {
    const rows = billings.flatMap((b) =>
      b.products.map((p) => ({
        ...p,                                      // name, item_id, qty, category, brand, unit
        invoiceNo:      b.invoiceNo,
        invoiceDate:    b.invoiceDate,
        customerName:   b.customerName,
        salesmanName:   b.salesmanName,
        paymentStatus:  b.paymentStatus,
        deliveryStatus: b.deliveryStatus,
        billingAmount:  b.billingAmount,           // for filters
      }))
    );
    setFlatProducts(rows);
  }, [billings]);

  /* ──────────────── PROFIT CALC FOR A BILLING ──────────────────── */
  const calcProfit = (billing) => {
    let cost = 0;
    let revenue = 0;

    billing.products.forEach((p) => {
      const prod = productMap[p.item_id];
      cost    += (parseFloat(prod?.price || 0) * p.quantity);
      revenue += (parseFloat(p.selledPrice)   * p.quantity);
    });

    const otherExp = (billing.otherExpenses || []).reduce(
      (s, e) => s + parseFloat(e.amount || 0), 0);
    const fuel = parseFloat(billing.totalFuelCharge || 0);

    const profit = revenue - cost - otherExp - fuel;
    const pct    = revenue > 0 ? (profit / revenue) * 100 : 0;

    return { totalCost: cost, totalRevenue: revenue,
             totalProfit: profit, profitPercentage: pct,
             otherExp, fuel };
  };

  /* ─────────── FILTER + SORT (on product rows) ─────────────────── */
  useEffect(() => {
    let data = [...flatProducts];

    if (fromDate)
      data = data.filter((r) =>
        new Date(r.invoiceDate).toISOString().split('T')[0] >= fromDate);
    if (toDate)
      data = data.filter((r) =>
        new Date(r.invoiceDate).toISOString().split('T')[0] <= toDate);
    if (customerName)
      data = data.filter((r) =>
        r.customerName.toLowerCase().includes(customerName.toLowerCase()));
    if (salesmanName)
      data = data.filter((r) =>
        r.salesmanName.toLowerCase().includes(salesmanName.toLowerCase()));
    if (invoiceNo)
      data = data.filter((r) =>
        r.invoiceNo.toLowerCase().includes(invoiceNo.toLowerCase()));
    if (paymentStatus)
      data = data.filter((r) =>
        r.paymentStatus.toLowerCase() === paymentStatus.toLowerCase());
    if (deliveryStatus)
      data = data.filter((r) =>
        r.deliveryStatus.toLowerCase() === deliveryStatus.toLowerCase());
    if (itemName)
      data = data.filter((r) =>
        r.name.toLowerCase().includes(itemName.toLowerCase()));
    if (amountThreshold)
      data = data.filter((r) =>
        r.billingAmount >= parseFloat(amountThreshold));

    // sort
    data.sort((a, b) => {
      const av = a[sortField];
      const bv = b[sortField];
      if (av < bv) return sortDirection === 'asc' ? -1 : 1;
      if (av > bv) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredProducts(data);
    setCurrentPage(1); // reset page on every filter change
  }, [
    flatProducts, fromDate, toDate, customerName, salesmanName,
    invoiceNo, paymentStatus, deliveryStatus, itemName,
    amountThreshold, sortField, sortDirection
  ]);

  /* ─────────────── TOTAL (sum of every row's total₹) ───────────── */
  useEffect(() => {
    const grand = filteredProducts.reduce(
      (s, r) => s + (parseFloat(r.selledPrice) * r.quantity), 0);
    setTotalAmount(grand);
  }, [filteredProducts]);

  /* ────────────── SUGGESTIONS FOR AUTOCOMPLETE ─────────────────── */
  useEffect(() => {
    setCustomerSuggestions([...new Set(billings.map(b => b.customerName))]);
    setSalesmanSuggestions([...new Set(billings.map(b => b.salesmanName))]);
    setInvoiceSuggestions([...new Set(billings.map(b => b.invoiceNo))]);
    setItemSuggestions([
      ...new Set(billings.flatMap(b => b.products.map(p => p.name)))
    ]);
  }, [billings]);

  /* ───────────────── PAGINATION HELPERS ────────────────────────── */
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedRows = () => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  };
  const pageChange = (p) =>
    p >= 1 && p <= totalPages && setCurrentPage(p);

  /* ───────────────── MODAL HELPERS ─────────────────────────────── */
  const viewBilling = (b) => setSelectedBilling(b);
  const closeModal  = () => setSelectedBilling(null);

  /* ────────────── EXPORT PDF (invoice-level) ───────────────────── */
  const generatePDF = () => {
    const doc = new jsPDF();
    doc.text('Sales Report', 14, 15);
    doc.setFontSize(12);
    doc.text(`Date Range: ${fromDate || 'All'} to ${toDate || 'All'}`, 14, 25);
    doc.text(`Customer Name: ${customerName || 'All'}`, 14, 32);
    doc.text(`Total Amount: Rs. ${totalAmount.toFixed(2)}`, 14, 39);

    const columns = [
      'Invoice No','Invoice Date','Salesman','Customer',
      'Billing Amount','Discount','Net Amount',
      'Payment','Delivery'
    ];
    const rows = billings.map(b => [
      b.invoiceNo,
      new Date(b.invoiceDate).toLocaleDateString(),
      b.salesmanName,
      b.customerName,
      `Rs. ${b.grandTotal.toFixed(2)}`,
      `Rs. ${b.discount.toFixed(2)}`,
      `Rs. ${(b.billingAmount).toFixed(2)}`,
      b.paymentStatus,
      b.deliveryStatus
    ]);
    doc.autoTable({ head:[columns], body:rows, startY:45, styles:{fontSize:8} });
    doc.save('sales_report.pdf');
  };

  /* ───────────────────────── RENDER ────────────────────────────── */
  return (
    <>
      {/* ─── Grand total card ────────────────────────────────────── */}
      <div className="bg-white p-4 w-60 rounded-lg shadow-md mb-2">
        <p className="text-sm font-bold text-gray-700">
          Total Amount: Rs.&nbsp;{totalAmount.toFixed(2)}
        </p>
      </div>

      {/* ─── Filters box ────────────────────────────────────────── */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
          {/* From Date */}
          <div>
            <label className="block text-xs font-bold mb-1">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              className="w-full border border-gray-300 rounded p-1 text-xs"
            />
          </div>
          {/* To Date */}
          <div>
            <label className="block text-xs font-bold mb-1">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              className="w-full border border-gray-300 rounded p-1 text-xs"
            />
          </div>
          {/* Customer */}
          <div>
            <label className="block text-xs font-bold mb-1">Customer Name</label>
            <input
              type="text"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              list="customerSuggestions"
              placeholder="Enter Customer Name"
              className="w-full border border-gray-300 rounded p-1 text-xs"
            />
            <datalist id="customerSuggestions">
              {customerSuggestions.map((n,i)=>(
                <option key={i} value={n} />
              ))}
            </datalist>
          </div>
          {/* Salesman */}
          <div>
            <label className="block text-xs font-bold mb-1">Salesman Name</label>
            <input
              type="text"
              value={salesmanName}
              onChange={e => setSalesmanName(e.target.value)}
              list="salesmanSuggestions"
              placeholder="Enter Salesman Name"
              className="w-full border border-gray-300 rounded p-1 text-xs"
            />
            <datalist id="salesmanSuggestions">
              {salesmanSuggestions.map((n,i)=>(
                <option key={i} value={n} />
              ))}
            </datalist>
          </div>
          {/* Invoice No */}
          <div>
            <label className="block text-xs font-bold mb-1">Invoice No</label>
            <input
              type="text"
              value={invoiceNo}
              onChange={e => setInvoiceNo(e.target.value)}
              list="invoiceSuggestions"
              placeholder="Enter Invoice No"
              className="w-full border border-gray-300 rounded p-1 text-xs"
            />
            <datalist id="invoiceSuggestions">
              {invoiceSuggestions.map((n,i)=>(
                <option key={i} value={n} />
              ))}
            </datalist>
          </div>
          {/* Payment Status */}
          <div>
            <label className="block text-xs font-bold mb-1">Payment Status</label>
            <select
              value={paymentStatus}
              onChange={e => setPaymentStatus(e.target.value)}
              className="w-full border border-gray-300 rounded p-1 text-xs"
            >
              <option value="">All</option>
              <option value="Paid">Paid</option>
              <option value="Partial">Partial</option>
              <option value="Unpaid">Unpaid</option>
            </select>
          </div>
          {/* Delivery Status */}
          <div>
            <label className="block text-xs font-bold mb-1">Delivery Status</label>
            <select
              value={deliveryStatus}
              onChange={e => setDeliveryStatus(e.target.value)}
              className="w-full border border-gray-300 rounded p-1 text-xs"
            >
              <option value="">All</option>
              <option value="Delivered">Delivered</option>
              <option value="Partially Delivered">Partially Delivered</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
          {/* Item Name */}
          <div>
            <label className="block text-xs font-bold mb-1">Item Name</label>
            <input
              type="text"
              value={itemName}
              onChange={e => setItemName(e.target.value)}
              list="itemSuggestions"
              placeholder="Enter Item Name"
              className="w-full border border-gray-300 rounded p-1 text-xs"
            />
            <datalist id="itemSuggestions">
              {itemSuggestions.map((n,i)=>(
                <option key={i} value={n} />
              ))}
            </datalist>
          </div>
          {/* Amount ≥ */}
          <div>
            <label className="block text-xs font-bold mb-1">Amount ≥</label>
            <input
              type="number"
              value={amountThreshold}
              onChange={e => setAmountThreshold(e.target.value)}
              placeholder="Enter Amount"
              className="w-full border border-gray-300 rounded p-1 text-xs"
            />
          </div>
          {/* Sort Field */}
          <div>
            <label className="block text-xs font-bold mb-1">Sort Field</label>
            <select
              value={sortField}
              onChange={e => setSortField(e.target.value)}
              className="w-full border border-gray-300 rounded p-1 text-xs"
            >
              <option value="invoiceDate">Invoice Date</option>
              <option value="customerName">Customer Name</option>
              <option value="salesmanName">Salesman Name</option>
              <option value="name">Product Name</option>
              <option value="billingAmount">Billing Amount</option>
              <option value="category">Category</option>
              <option value="brand">Brand</option>
            </select>
          </div>
          {/* Sort Direction */}
          <div>
            <label className="block text-xs font-bold mb-1">Sort Direction</label>
            <select
              value={sortDirection}
              onChange={e => setSortDirection(e.target.value)}
              className="w-full border border-gray-300 rounded p-1 text-xs"
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
          {/* PDF button */}
          <div className="flex items-end">
            <button
              onClick={generatePDF}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded text-xs"
            >
              Generate PDF
            </button>
          </div>
        </div>
      </div>

      {/* ─── Error / loading states ──────────────────────────────── */}
      {error && (
        <p className="text-red-500 text-center text-xs mb-2">{error}</p>
      )}

      {loading ? (
        <p className="text-xs text-center text-gray-500">Loading…</p>
      ) : filteredProducts.length === 0 ? (
        <p className="text-center text-gray-500 text-xs">
          No records found for the selected criteria.
        </p>
      ) : (
        <>
          {/* ─── Desktop table ────────────────────────────────────── */}
          <div className="hidden md:block">
            <table className="w-full text-xs text-gray-500 bg-white shadow-md rounded-lg overflow-hidden">
              <thead className="bg-red-600 text-white">
                <tr>
                  <th className="px-2 py-3 text-left">Invoice No</th>
                  <th className="px-2 py-3">Product</th>
                  <th className="px-2 py-3">Invoice Date</th>
                  <th className="px-2 py-3">Category</th>
                  <th className="px-2 py-3">Brand</th>
                  <th className="px-2 py-3">Qty</th>
                  <th className="px-2 py-3">Unit</th>
                  <th className="px-2 py-3">Sell&nbsp;₹</th>
                  <th className="px-2 py-3">Total&nbsp;₹</th>
                  <th className="px-2 py-3">Profit&nbsp;%</th>
                  <th className="px-2 py-3">Delivery</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRows().map(r => {
                  const cost  = parseFloat(productMap[r.item_id]?.price || 0);
                  const sell  = parseFloat(r.selledPrice);
                  const qty   = r.quantity;
                  const total = sell * qty;
                  const pct   = sell > 0 ? ((sell - cost) / sell) * 100 : 0;

                  return (
                    <tr
                      key={`${r.invoiceNo}-${r.item_id}`}
                      className="hover:bg-gray-100 divide-x divide-y"
                    >
                      <td
                        className="px-2 py-3 font-bold cursor-pointer text-red-600 hover:underline"
                        onClick={() =>
                          viewBilling(billings.find(b => b.invoiceNo === r.invoiceNo))
                        }
                      >
                        {r.invoiceNo}
                      </td>
                      <td className="px-2 py-3">{r.name}</td>
                      <td className="px-2 py-3">
                        {new Date(r.invoiceDate).toLocaleDateString()}
                      </td>
                      <td className="px-2 py-3">
                        {r.category || productMap[r.item_id]?.category || '--'}
                      </td>
                      <td className="px-2 py-3">
                        {r.brand || productMap[r.item_id]?.brand || '--'}
                      </td>
                      <td className="px-2 py-3 text-center">{qty}</td>
                      <td className="px-2 py-3 text-center">{r.unit}</td>
                      <td className="px-2 py-3 text-right">₹{sell.toFixed(2)}</td>
                      <td className="px-2 py-3 font-bold text-right">₹{total.toFixed(2)}</td>
                      <td className="px-2 py-3 text-center">
                        <ProfitBadge value={pct} />
                      </td>
                      <td
                        className={`px-2 py-3 text-center font-bold ${
                          r.deliveryStatus === 'Delivered'
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {r.deliveryStatus}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ─── Mobile cards ─────────────────────────────────────── */}
          <div className="md:hidden">
            {paginatedRows().map(r => {
              const cost  = parseFloat(productMap[r.item_id]?.price || 0);
              const sell  = parseFloat(r.selledPrice);
              const total = sell * r.quantity;
              const pct   = sell > 0 ? ((sell - cost) / sell) * 100 : 0;

              return (
                <div
                  key={`${r.invoiceNo}-${r.item_id}`}
                  className="bg-white rounded-lg shadow-md p-2 mb-2"
                >
                  <div className="flex justify-between items-center">
                    <p
                      className="text-sm font-bold text-red-600 cursor-pointer"
                      onClick={() =>
                        viewBilling(billings.find(b => b.invoiceNo === r.invoiceNo))
                      }
                    >
                      {r.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(r.invoiceDate).toLocaleDateString()}
                    </p>
                  </div>

                  <p className="text-gray-600 text-xs mt-1">
                    Invoice: {r.invoiceNo}
                  </p>
                  <p className="text-gray-600 text-xs mt-1">
                    Category: {r.category || productMap[r.item_id]?.category || '--'}
                  </p>
                  <p className="text-gray-600 text-xs mt-1">
                    Brand: {r.brand || productMap[r.item_id]?.brand || '--'}
                  </p>
                  <p className="text-gray-600 text-xs mt-1">
                    Qty: {r.quantity} {r.unit}
                  </p>
                  <p className="text-gray-600 text-xs mt-1">
                    Sell&nbsp;₹: {sell.toFixed(2)}
                  </p>
                  <p className="text-gray-600 text-xs font-bold mt-1">
                    Total&nbsp;₹: {total.toFixed(2)}
                  </p>
                  <p className="text-gray-600 text-xs mt-1 flex items-center">
                    Profit:&nbsp;<ProfitBadge value={pct} />
                  </p>
                  <p
                    className={`text-xs font-bold mt-1 ${
                      r.deliveryStatus === 'Delivered'
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {r.deliveryStatus}
                  </p>
                </div>
              );
            })}
          </div>

          {/* ─── Pagination controls ─────────────────────────────── */}
          <div className="flex justify-between items-center mt-2">
            <button
              onClick={() => pageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-2 py-3 text-xs font-bold rounded-lg ${
                currentPage === 1
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-red-500 text-white hover:bg-red-600'
              }`}
            >
              Previous
            </button>
            <span className="text-xs text-gray-500">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => pageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`px-2 py-3 text-xs font-bold rounded-lg ${
                currentPage === totalPages
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-red-500 text-white hover:bg-red-600'
              }`}
            >
              Next
            </button>
          </div>
        </>
      )}

      {/* ───────────────────────── MODAL ─────────────────────────── */}
      <Dialog
        fullScreen
        open={Boolean(selectedBilling)}
        onClose={closeModal}
        TransitionComponent={Transition}
      >
        <DialogContent className="relative p-4 sm:p-8">
          <IconButton
            onClick={closeModal}
            sx={{ position: 'absolute', top: 8, right: 8, color: 'gray' }}
          >
            <CloseIcon fontSize="large" />
          </IconButton>

          <AnimatePresence mode="wait">
            {selectedBilling && (
              <motion.div
                key="details"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.35 }}
                className="bg-white rounded-xl p-6 shadow-lg"
              >
                {/* ─── Header ─────────────────────────────────────── */}
                <h2 className="text-2xl font-bold text-red-600 mb-4">
                  Invoice #{selectedBilling.invoiceNo}
                </h2>

                {/* ─── Basic info grid ────────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-6">
                  <div>
                    <p className="mb-1">
                      <span className="font-bold">Salesman:</span>&nbsp;
                      {selectedBilling.salesmanName}
                    </p>
                    <p className="mb-1">
                      <span className="font-bold">Marketed By:</span>&nbsp;
                      {selectedBilling.marketedBy}
                    </p>
                    <p className="mb-1 flex items-center">
                      <FaUser className="text-gray-400 mr-1" />
                      <span className="font-bold">Customer:</span>&nbsp;
                      {selectedBilling.customerName}
                    </p>
                    <p className="mb-1">
                      <span className="font-bold">Address:</span>&nbsp;
                      {selectedBilling.customerAddress}
                    </p>
                    <p className="mb-1">
                      <span className="font-bold">Contact:</span>&nbsp;
                      {selectedBilling.customerContactNumber}
                    </p>
                    <p className="mb-1">
                      <span className="font-bold">Showroom:</span>&nbsp;
                      {selectedBilling.showroom}
                    </p>
                  </div>
                  <div>
                    <p className="mb-1">
                      <span className="font-bold">Invoice&nbsp;Date:</span>&nbsp;
                      {format(new Date(selectedBilling.invoiceDate), 'dd MMM yyyy, HH:mm')}
                    </p>
                    <p className="mb-1">
                      <span className="font-bold">Expected&nbsp;Delivery:</span>&nbsp;
                      {format(new Date(selectedBilling.expectedDeliveryDate), 'dd MMM yyyy, HH:mm')}
                    </p>
                    <p className="mb-1">
                      <span className="font-bold">Delivery&nbsp;Status:</span>&nbsp;
                      <span
                        className={`px-2 py-3 rounded text-white text-xs ${
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
                      <span className="font-bold">Payment&nbsp;Status:</span>&nbsp;
                      <span
                        className={`px-2 py-3 rounded text-white text-xs ${
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
                      <span className="font-bold">Remark:</span>&nbsp;
                      {selectedBilling.remark || '--'}
                    </p>
                  </div>
                </div>

                {/* ─── Products table inside modal ───────────────── */}
                <h3 className="text-lg font-bold text-red-600 mb-4">
                  Products ({selectedBilling.products.length})
                </h3>
                <div className="overflow-x-auto mb-6">
                  <table className="w-full text-xs text-gray-500">
                    <thead className="bg-gray-100 text-gray-700">
                      <tr>
                        <th className="px-4 py-3">Id</th>
                        <th className="px-4 py-3">Product</th>
                        {userInfo.isAdmin && (
                          <th className="px-4 py-3">Cost&nbsp;₹</th>
                        )}
                        <th className="px-4 py-3">Sell&nbsp;₹</th>
                        <th className="px-4 py-3">Qty</th>
                        {userInfo.isSuper && (
                          <>
                            <th className="px-4 py-3">Profit&nbsp;%</th>
                            <th className="px-4 py-3">Total&nbsp;₹</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {selectedBilling.products.map((p, idx) => {
                        const cost = parseFloat(productMap[p.item_id]?.price || 0);
                        const sell = parseFloat(p.selledPrice);
                        const qty  = p.quantity;
                        const pct  = sell > 0 ? ((sell - cost) / sell) * 100 : 0;
                        const tot  = (sell - cost) * qty;

                        return (
                          <tr
                            key={idx}
                            className="text-center border-b hover:bg-gray-50"
                          >
                            <td className="px-4 py-3 font-semibold">
                              {p.item_id}
                            </td>
                            <td className="px-4 py-3">{p.name}</td>
                            {userInfo.isAdmin && (
                              <td className="px-4 py-3">₹{cost.toFixed(2)}</td>
                            )}
                            <td className="px-4 py-3">₹{sell.toFixed(2)}</td>
                            <td className="px-4 py-3">{qty}</td>
                            {userInfo.isSuper && (
                              <>
                                <td className="px-4 py-3">
                                  <ProfitBadge value={pct} />
                                </td>
                                <td className="px-4 py-3 font-semibold">
                                  ₹{tot.toFixed(2)}
                                </td>
                              </>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* ─── Summary cards for super users ─────────────── */}
                {userInfo.isSuper && (() => {
                  const pr = calcProfit(selectedBilling);
                  return (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                      <div className="stats bg-green-50 shadow p-4 rounded-lg">
                        <div className="stat-title">Revenue</div>
                        <div className="stat-value text-green-600">
                          ₹{pr.totalRevenue.toLocaleString()}
                        </div>
                      </div>
                      <div className="stats bg-blue-50 shadow p-4 rounded-lg">
                        <div className="stat-title">Cost</div>
                        <div className="stat-value text-blue-600">
                          ₹{pr.totalCost.toLocaleString()}
                        </div>
                      </div>
                      <div className="stats bg-purple-50 shadow p-4 rounded-lg">
                        <div className="stat-title">Other Exp.</div>
                        <div className="stat-value text-purple-600">
                          ₹{pr.otherExp.toLocaleString()}
                        </div>
                      </div>
                      <div className="stats bg-green-50 shadow p-4 rounded-lg">
                        <div className="stat-title">Fuel</div>
                        <div className="stat-value text-green-600">
                          ₹{pr.fuel.toLocaleString()}
                        </div>
                      </div>
                      <div className="stats bg-purple-50 shadow p-4 rounded-lg">
                        <div className="stat-title">Net Profit</div>
                        <div className="stat-value text-purple-600">
                          ₹{pr.totalProfit.toLocaleString()}
                        </div>
                        <div className="stat-desc">
                          {pr.profitPercentage.toFixed(2)}% Margin
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SalesReport;
