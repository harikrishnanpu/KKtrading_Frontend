// src/screens/SalesReport.jsx
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

// ─── MUI ─────────────────────────────────────────────────────────────
import {
  Dialog,
  DialogContent,
  IconButton,
  Slide
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

// ─── Dialog slide-up transition ─────────────────────────────────────
const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

// ─── Tiny badge component for profit % ──────────────────────────────
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

// ─── Main component ────────────────────────────────────────────────
const SalesReport = () => {
  const navigate = useNavigate();
  const { user: userInfo } = useAuth();

  // ── Core data ────────────────────────────────────────────────────
  const [billings, setBillings]               = useState([]);
  const [products, setProducts]               = useState([]);   // for cost lookup
  const [filteredBillings, setFilteredBillings] = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [error, setError]                     = useState('');

  // ── Filters & sorting ────────────────────────────────────────────
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

  // ── Pagination ───────────────────────────────────────────────────
  const itemsPerPage   = 15;
  const [currentPage, setCurrentPage] = useState(1);

  // ── Totals ───────────────────────────────────────────────────────
  const [totalAmount, setTotalAmount] = useState(0);

  // ── Suggestions (autocomplete) ───────────────────────────────────
  const [customerSuggestions, setCustomerSuggestions] = useState([]);
  const [salesmanSuggestions, setSalesmanSuggestions] = useState([]);
  const [invoiceSuggestions, setInvoiceSuggestions]   = useState([]);
  const [itemSuggestions, setItemSuggestions]         = useState([]);

  // ── Modal state ──────────────────────────────────────────────────
  const [selectedBilling, setSelectedBilling] = useState(null);

  // ───────────────────── FETCH DATA ────────────────────────────────
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

  // Build fast lookup for cost price
  const productMap = useMemo(() => {
    const map = {};
    products.forEach((p) => (map[p.item_id] = p));
    return map;
  }, [products]);

  // ───────────────────── PROFIT CALCULATOR ─────────────────────────
  const calcProfit = (billing) => {
    let totalCost = 0;
    let totalRevenue = 0;

    billing.products.forEach((p) => {
      const prod = productMap[p.item_id];
      const costUnit = parseFloat(prod?.price || 0);
      totalCost += costUnit * p.quantity;
      totalRevenue += parseFloat(p.selledPrice) * p.quantity;
    });

    const otherExp = (billing.otherExpenses || []).reduce(
      (sum, e) => sum + parseFloat(e.amount || 0),
      0
    );
    const fuel     = parseFloat(billing.totalFuelCharge || 0);

    const profit   = totalRevenue - totalCost - otherExp - fuel;
    const margin   = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

    return { totalCost, totalRevenue, totalProfit: profit, profitPercentage: margin, otherExp, fuel };
  };

  // ───────────────────── FILTER + SORT ─────────────────────────────
  useEffect(() => {
    let data = [...billings];

    if (fromDate)
      data = data.filter((b) => new Date(b.invoiceDate).toISOString().split('T')[0] >= fromDate);
    if (toDate)
      data = data.filter((b) => new Date(b.invoiceDate).toISOString().split('T')[0] <= toDate);
    if (customerName)
      data = data.filter((b) => b.customerName.toLowerCase().includes(customerName.toLowerCase()));
    if (salesmanName)
      data = data.filter((b) => b.salesmanName.toLowerCase().includes(salesmanName.toLowerCase()));
    if (invoiceNo)
      data = data.filter((b) => b.invoiceNo.toLowerCase().includes(invoiceNo.toLowerCase()));
    if (paymentStatus)
      data = data.filter((b) => b.paymentStatus.toLowerCase() === paymentStatus.toLowerCase());
    if (deliveryStatus)
      data = data.filter((b) => b.deliveryStatus.toLowerCase() === deliveryStatus.toLowerCase());
    if (itemName)
      data = data.filter((b) =>
        b.products.some((p) => p.name.toLowerCase().includes(itemName.toLowerCase()))
      );
    if (amountThreshold)
      data = data.filter((b) => b.billingAmount >= parseFloat(amountThreshold));

    // sort
    data.sort((a, b) => {
      const av = a[sortField];
      const bv = b[sortField];
      if (av < bv) return sortDirection === 'asc' ? -1 : 1;
      if (av > bv) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredBillings(data);
  }, [
    billings,
    fromDate, toDate, customerName, salesmanName, invoiceNo,
    paymentStatus, deliveryStatus, itemName, amountThreshold,
    sortField, sortDirection
  ]);

  // update total
  useEffect(() => {
    const t = filteredBillings.reduce((s, b) => s + (b.billingAmount - b.discount), 0);
    setTotalAmount(t);
  }, [filteredBillings]);

  // suggestions
  useEffect(() => {
    setCustomerSuggestions([...new Set(billings.map((b) => b.customerName))]);
    setSalesmanSuggestions([...new Set(billings.map((b) => b.salesmanName))]);
    setInvoiceSuggestions([...new Set(billings.map((b) => b.invoiceNo))]);
    setItemSuggestions([
      ...new Set(billings.flatMap((b) => b.products.map((p) => p.name)))
    ]);
  }, [billings]);

  // ── pagination helpers ───────────────────────────────────────────
  const totalPages = Math.ceil(filteredBillings.length / itemsPerPage);
  const paginatedBillings = () => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredBillings.slice(start, start + itemsPerPage);
  };
  const pageChange = (p) => p >= 1 && p <= totalPages && setCurrentPage(p);

  // ── modal helpers ────────────────────────────────────────────────
  const viewBilling = (b) => setSelectedBilling(b);
  const closeModal  = () => setSelectedBilling(null);

  // ───────────────────── PDF (unchanged) ───────────────────────────
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
    const rows = filteredBillings.map((b) => [
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

  // ───────────────────── RENDER ────────────────────────────────────
  return (
    <>
      {/* ─── Total card ───────────────────────────────────────────── */}
      <div className="bg-white p-4 w-60 rounded-lg shadow-md mb-2">
        <p className="text-sm font-bold text-gray-700">
          Total Amount: Rs.&nbsp;{totalAmount.toFixed(2)}
        </p>
      </div>

      {/* ─── Filters box ──────────────────────────────────────────── */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
          {/* each filter input exactly as before… */}
          {/* From Date */}
          <div>
            <label className="block text-xs font-bold mb-1">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full border border-gray-300 rounded p-1 text-xs"
            />
          </div>
          {/* To Date */}
          <div>
            <label className="block text-xs font-bold mb-1">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full border border-gray-300 rounded p-1 text-xs"
            />
          </div>
          {/* Customer */}
          <div>
            <label className="block text-xs font-bold mb-1">Customer Name</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              list="customerSuggestions"
              placeholder="Enter Customer Name"
              className="w-full border border-gray-300 rounded p-1 text-xs"
            />
            <datalist id="customerSuggestions">
              {customerSuggestions.map((n,i)=><option key={i} value={n}/>)}
            </datalist>
          </div>
          {/* Salesman */}
          <div>
            <label className="block text-xs font-bold mb-1">Salesman Name</label>
            <input
              type="text"
              value={salesmanName}
              onChange={(e) => setSalesmanName(e.target.value)}
              list="salesmanSuggestions"
              placeholder="Enter Salesman Name"
              className="w-full border border-gray-300 rounded p-1 text-xs"
            />
            <datalist id="salesmanSuggestions">
              {salesmanSuggestions.map((n,i)=><option key={i} value={n}/>)}
            </datalist>
          </div>
          {/* Invoice No */}
          <div>
            <label className="block text-xs font-bold mb-1">Invoice No</label>
            <input
              type="text"
              value={invoiceNo}
              onChange={(e) => setInvoiceNo(e.target.value)}
              list="invoiceSuggestions"
              placeholder="Enter Invoice No"
              className="w-full border border-gray-300 rounded p-1 text-xs"
            />
            <datalist id="invoiceSuggestions">
              {invoiceSuggestions.map((n,i)=><option key={i} value={n}/>)}
            </datalist>
          </div>
          {/* Payment Status */}
          <div>
            <label className="block text-xs font-bold mb-1">Payment Status</label>
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
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
              onChange={(e) => setDeliveryStatus(e.target.value)}
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
              onChange={(e) => setItemName(e.target.value)}
              list="itemSuggestions"
              placeholder="Enter Item Name"
              className="w-full border border-gray-300 rounded p-1 text-xs"
            />
            <datalist id="itemSuggestions">
              {itemSuggestions.map((n,i)=><option key={i} value={n}/>)}
            </datalist>
          </div>
          {/* Amount ≥ */}
          <div>
            <label className="block text-xs font-bold mb-1">Amount ≥</label>
            <input
              type="number"
              value={amountThreshold}
              onChange={(e) => setAmountThreshold(e.target.value)}
              placeholder="Enter Amount"
              className="w-full border border-gray-300 rounded p-1 text-xs"
            />
          </div>
          {/* Sort field */}
          <div>
            <label className="block text-xs font-bold mb-1">Sort Field</label>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value)}
              className="w-full border border-gray-300 rounded p-1 text-xs"
            >
              <option value="invoiceDate">Invoice Date</option>
              <option value="billingAmount">Billing Amount</option>
              <option value="customerName">Customer Name</option>
              <option value="salesmanName">Salesman Name</option>
            </select>
          </div>
          {/* Sort dir */}
          <div>
            <label className="block text-xs font-bold mb-1">Sort Direction</label>
            <select
              value={sortDirection}
              onChange={(e) => setSortDirection(e.target.value)}
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
              className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-1 rounded text-xs"
            >
              Generate PDF
            </button>
          </div>
        </div>
      </div>

      {/* ─── Error / loading ───────────────────────────────────────── */}
      {error && <p className="text-red-500 text-center text-xs mb-2">{error}</p>}

      {loading ? (
        <p className="text-xs text-center text-gray-500">Loading…</p>
      ) : filteredBillings.length === 0 ? (
        <p className="text-center text-gray-500 text-xs">
          No billings found for the selected criteria.
        </p>
      ) : (
        <>
          {/* ─── Desktop table ─────────────────────────────────────── */}
          <div className="hidden md:block">
            <table className="w-full text-xs text-gray-500 bg-white shadow-md rounded-lg overflow-hidden">
              <thead className="bg-red-600 text-white">
                <tr className="divide-y">
                  <th className="px-2 py-1 text-left">Invoice No</th>
                  <th className="px-2 py-1">Invoice Date</th>
                  <th className="px-2 py-1">Salesman</th>
                  <th className="px-2 py-1">Customer</th>
                  <th className="px-2 py-1">Billing Amount</th>
                  <th className="px-2 py-1">Discount</th>
                  <th className="px-2 py-1">Net Amount</th>
                  <th className="px-2 py-1">Payment</th>
                  <th className="px-2 py-1">Delivery</th>
                </tr>
              </thead>
              <tbody>
                {paginatedBillings().map((b) => (
                  <tr key={b.invoiceNo} className="hover:bg-gray-100 divide-y divide-x">
                    <td
                      onClick={() => viewBilling(b)}
                      className="px-2 py-2 text-center font-bold cursor-pointer text-red-600 hover:underline"
                    >
                      {b.invoiceNo}
                    </td>
                    <td className="px-2 py-1">
                      {new Date(b.invoiceDate).toLocaleDateString()}
                    </td>
                    <td className="px-2 py-1">{b.salesmanName}</td>
                    <td className="px-2 py-1">{b.customerName}</td>
                    <td className="px-2 py-1">Rs.&nbsp;{b.grandTotal.toFixed(2)}</td>
                    <td className="px-2 py-1">Rs.&nbsp;{b.discount.toFixed(2)}</td>
                    <td className="px-2 py-1">
                      Rs.&nbsp;{(b.billingAmount).toFixed(2)}
                    </td>
                    <td
                      className={`px-2 py-1 font-bold text-center ${
                        b.paymentStatus === 'Paid' ? 'text-green-500' : 'text-red-500'
                      }`}
                    >
                      {b.paymentStatus}
                    </td>
                    <td
                      className={`px-2 py-1 font-bold text-center ${
                        b.deliveryStatus === 'Delivered' ? 'text-green-500' : 'text-red-500'
                      }`}
                    >
                      {b.deliveryStatus}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ─── Mobile cards ──────────────────────────────────────── */}
          <div className="md:hidden">
            {paginatedBillings().map((b) => (
              <div key={b.invoiceNo} className="bg-white rounded-lg shadow-md p-2 mb-2">
                <div className="flex justify-between items-center">
                  <p
                    className="text-sm font-bold text-red-600 cursor-pointer"
                    onClick={() => viewBilling(b)}
                  >
                    Invoice No: {b.invoiceNo}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(b.invoiceDate).toLocaleDateString()}
                  </p>
                </div>
                <p className="text-gray-600 text-xs mt-1">
                  Customer: {b.customerName}
                </p>
                <p className="text-gray-600 text-xs mt-1">
                  Salesman: {b.salesmanName}
                </p>
                <p className="text-gray-600 text-xs mt-1">
                  Payment Status: {b.paymentStatus}
                </p>
                <p className="text-gray-600 text-xs mt-1">
                  Delivery Status: {b.deliveryStatus}
                </p>
                <div className="flex justify-between mt-2">
                  <p className="text-gray-600 text-xs font-bold">
                    Billing: Rs.&nbsp;{b.grandTotal.toFixed(2)}
                  </p>
                  <p className="text-gray-600 text-xs font-bold">
                    Net: Rs.&nbsp;{(b.billingAmount).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* ─── Pagination controls ─────────────────────────────── */}
          <div className="flex justify-between items-center mt-2">
            <button
              onClick={() => pageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-2 text-xs font-bold py-1 rounded-lg ${
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
              className={`px-2 text-xs font-bold py-1 rounded-lg ${
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

      {/* ───────────────── View-details Modal ────────────────────── */}
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
                {/* Header */}
                <h2 className="text-2xl font-bold text-red-600 mb-4">
                  Invoice #{selectedBilling.invoiceNo}
                </h2>

                {/* Basic info grid */}
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
                      <span className="font-bold">Payment&nbsp;Status:</span>&nbsp;
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
                      <span className="font-bold">Remark:</span>&nbsp;
                      {selectedBilling.remark || '--'}
                    </p>
                  </div>
                </div>

                {/* Products table */}
                <h3 className="text-lg font-bold text-red-600 mb-4">
                  Products ({selectedBilling.products.length})
                </h3>
                <div className="overflow-x-auto mb-6">
                  <table className="w-full text-xs text-gray-500">
                    <thead className="bg-gray-100 text-gray-700">
                      <tr>
                        <th className="px-4 py-2">Id</th>
                        <th className="px-4 py-2">Product</th>
                        {userInfo.isAdmin && <th className="px-4 py-2">Cost&nbsp;₹</th>}
                        <th className="px-4 py-2">Sell&nbsp;₹</th>
                        <th className="px-4 py-2">Qty</th>
                        {userInfo.isSuper && (
                          <>
                            <th className="px-4 py-2">Profit&nbsp;%</th>
                            <th className="px-4 py-2">Total&nbsp;₹</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {selectedBilling.products.map((p, idx) => {
                        const cost = parseFloat(productMap[p.item_id]?.price || 0);
                        const sell = parseFloat(p.selledPrice);
                        const qty  = p.quantity;
                        const profitPct = sell > 0 ? ((sell - cost) / sell) * 100 : 0;
                        const totalProf = (sell - cost) * qty;

                        return (
                          <tr key={idx} className="text-center border-b hover:bg-gray-50">
                            <td className="px-4 py-2 font-semibold">{p.item_id}</td>
                            <td className="px-4 py-2">{p.name}</td>
                            {userInfo.isAdmin && (
                              <td className="px-4 py-2">₹{cost.toFixed(2)}</td>
                            )}
                            <td className="px-4 py-2">₹{sell.toFixed(2)}</td>
                            <td className="px-4 py-2">{qty}</td>
                            {userInfo.isSuper && (
                              <>
                                <td className="px-4 py-2">
                                  <ProfitBadge value={profitPct} />
                                </td>
                                <td className="px-4 py-2 font-semibold">
                                  ₹{totalProf.toFixed(2)}
                                </td>
                              </>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Summary cards (super only) */}
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
