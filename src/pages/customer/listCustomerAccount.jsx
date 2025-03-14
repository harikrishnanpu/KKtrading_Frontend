// src/components/CustomerAccountList.js

import React, { useState, useEffect, useCallback } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import debounce from 'lodash.debounce';
import useAuth from 'hooks/useAuth';

// Material-UI Imports for Modal
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import Slide from '@mui/material/Slide';
import CloseIcon from '@mui/icons-material/Close';

// Transition for MUI Dialog (slide up animation)
const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const CustomerAccountList = () => {
  const navigate = useNavigate();
  const { user: userInfo } = useAuth();

  // Main states
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // For mobile sidebar

  // Global filter and sorting states
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [billAmountMin, setBillAmountMin] = useState('');
  const [billAmountMax, setBillAmountMax] = useState('');
  const [pendingAmountMin, setPendingAmountMin] = useState('');
  const [pendingAmountMax, setPendingAmountMax] = useState('');
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');

  // Sidebar search and account selection
  const [accountSearch, setAccountSearch] = useState('');
  const [selectedAccountIds, setSelectedAccountIds] = useState([]);


  const handleSelectAll = (isChecked) => {
    if (isChecked) {
      const allIds = accounts.map((acc) => acc._id);
      setSelectedAccountIds(allIds);
      localStorage.setItem('selectedCustomerAccountIds', JSON.stringify(allIds));
    } else {
      setSelectedAccountIds([]);
      localStorage.setItem('selectedCustomerAccountIds', JSON.stringify([]));
    }
  };

  // Fetch all customer accounts
  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/customer/allaccounts');
      const formattedAccounts = response.data.map((account) => ({
        ...account,
        bills: account.bills || [],
        payments: account.payments || [],
      }));
      setAccounts(formattedAccounts);

      // Set default account selection (either from localStorage or select all)
      const storedSelection = localStorage.getItem('selectedCustomerAccountIds');
      if (storedSelection) {
        setSelectedAccountIds(JSON.parse(storedSelection));
      } else {
        const allIds = formattedAccounts.map((a) => a._id);
        setSelectedAccountIds(allIds);
        localStorage.setItem('selectedCustomerAccountIds', JSON.stringify(allIds));
      }
    } catch (err) {
      setError('Failed to fetch customer accounts.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  // Debounced search handler for sidebar search
  const debouncedSearch = useCallback(
    debounce((query) => {
      setAccountSearch(query);
      setCurrentPage(1);
    }, 300),
    []
  );

  const handleAccountSearchChange = (e) => {
    debouncedSearch(e.target.value);
  };

  // Filter accounts based on the selectedAccountIds and accountSearch
  const filteredAccounts = accounts.filter((acc) =>
    selectedAccountIds.includes(acc._id) &&
    (acc.accountId.toLowerCase().includes(accountSearch.toLowerCase()) ||
      acc.customerName.toLowerCase().includes(accountSearch.toLowerCase()))
  );

  // Apply additional filters for payment status and amount ranges
  const fullyFilteredAccounts = filteredAccounts.filter((acc) => {
    // Payment status filter
    if (paymentStatusFilter === 'Paid' && acc.pendingAmount !== 0) return false;
    if (paymentStatusFilter === 'Pending' && acc.pendingAmount === 0) return false;

    // Bill amount range filter
    if (billAmountMin && acc.totalBillAmount < parseFloat(billAmountMin)) return false;
    if (billAmountMax && acc.totalBillAmount > parseFloat(billAmountMax)) return false;

    // Pending amount range filter
    if (pendingAmountMin && acc.pendingAmount < parseFloat(pendingAmountMin)) return false;
    if (pendingAmountMax && acc.pendingAmount > parseFloat(pendingAmountMax)) return false;

    return true;
  });

  // Sort the filtered accounts
  fullyFilteredAccounts.sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];

    // If sorting by createdAt, convert to Date
    if (sortField === 'createdAt') {
      valA = new Date(valA);
      valB = new Date(valB);
    }

    if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
    if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(fullyFilteredAccounts.length / itemsPerPage);
  const paginateAccounts = () => {
    const start = (currentPage - 1) * itemsPerPage;
    return fullyFilteredAccounts.slice(start, start + itemsPerPage);
  };

  // Totals Calculation
  const totalBill = fullyFilteredAccounts.reduce((acc, account) => acc + account.totalBillAmount, 0);
  const totalPaid = fullyFilteredAccounts.reduce((acc, account) => acc + account.paidAmount, 0);
  const totalPending = fullyFilteredAccounts.reduce((acc, account) => acc + account.pendingAmount, 0);

  // PDF Generation
  const generatePDF = (account) => {
    setPdfLoading(true);
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Customer Account Statement', 14, 22);
    doc.setFontSize(12);
    doc.text(`Account ID: ${account.accountId}`, 14, 32);
    doc.text(`Customer Name: ${account.customerName}`, 14, 40);
    doc.text(`Total Bill Amount: ₹${account.totalBillAmount.toFixed(2)}`, 14, 48);
    doc.text(`Paid Amount: ₹${account.paidAmount.toFixed(2)}`, 14, 56);
    doc.text(`Pending Amount: ₹${account.pendingAmount.toFixed(2)}`, 14, 64);
    doc.text(`Created At: ${new Date(account.createdAt).toLocaleString()}`, 14, 72);

    // Bills Table
    doc.setFontSize(14);
    doc.text('Bills', 14, 86);
    const billsData = account.bills.map((bill, index) => [
      index + 1,
      bill.invoiceNo,
      `₹${bill.billAmount.toFixed(2)}`,
      new Date(bill.invoiceDate).toLocaleDateString(),
      bill.deliveryStatus,
    ]);

    doc.autoTable({
      startY: 90,
      head: [['#', 'Invoice No.', 'Bill Amount', 'Invoice Date', 'Delivery Status']],
      body: billsData,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [46, 204, 113] },
    });

    // Payments Table
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.text('Payments', 14, finalY);
    const paymentsData = account.payments.map((payment, index) => [
      index + 1,
      `₹${payment.amount.toFixed(2)}`,
      payment.submittedBy,
      payment.remark || '-',
      new Date(payment.date).toLocaleDateString(),
      payment.method,
    ]);

    doc.autoTable({
      startY: finalY + 5,
      head: [['#', 'Amount', 'Submitted By', 'Remark', 'Date', 'Method']],
      body: paymentsData,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [231, 76, 60] },
    });

    const pdfBlobUrl = doc.output('bloburl');
    window.open(pdfBlobUrl, '_blank', 'width=800,height=600');
    setPdfLoading(false);
  };

  // Remove a customer account
  const handleRemove = async (id) => {
    if (window.confirm('Are you sure you want to remove this customer account?')) {
      try {
        await api.delete(`/api/customer/${id}/delete`);
        alert('Successfully deleted');
        setAccounts(accounts.filter((account) => account._id !== id));
        const updatedSelection = selectedAccountIds.filter((aid) => aid !== id);
        setSelectedAccountIds(updatedSelection);
        localStorage.setItem('selectedCustomerAccountIds', JSON.stringify(updatedSelection));
      } catch (error) {
        setError('Error occurred while deleting the account.');
        console.error(error);
      }
    }
  };

  // Open account details (modal)
  const handleView = (account) => {
    setSelectedAccount(account);
  };

  const closeModal = () => {
    setSelectedAccount(null);
  };

  // Handle account selection checkbox in the sidebar
  const handleAccountSelectionChange = (accountId) => {
    let updatedSelections;
    if (selectedAccountIds.includes(accountId)) {
      updatedSelections = selectedAccountIds.filter((id) => id !== accountId);
    } else {
      updatedSelections = [...selectedAccountIds, accountId];
    }
    setSelectedAccountIds(updatedSelections);
    localStorage.setItem('selectedCustomerAccountIds', JSON.stringify(updatedSelections));
  };

  // Render loading skeletons
  const renderSkeleton = () => {
    const skeletonRows = Array.from({ length: itemsPerPage }, (_, index) => index);
    return (
      <div className="w-full">
        {/* Desktop Table Skeleton */}
        <div className="hidden md:block">
          <table className="w-full text-sm text-gray-500 bg-white shadow-md rounded-lg overflow-hidden">
            <thead className="bg-gray-200">
              <tr className="divide-y text-xs">
                <th className="px-4 py-2 text-left">Account ID</th>
                <th className="px-2 py-2">Customer Name</th>
                <th className="px-2 py-2">Total Bill</th>
                <th className="px-2 py-2">Paid Amount</th>
                <th className="px-2 py-2">Pending Amount</th>
                <th className="px-2 py-2">Created At</th>
                <th className="px-2 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {skeletonRows.map((row) => (
                <tr key={row} className="hover:bg-gray-100 divide-y divide-x">
                  <td className="px-4 py-2">
                    <Skeleton height={10} />
                  </td>
                  <td className="px-2 py-2">
                    <Skeleton height={10} />
                  </td>
                  <td className="px-2 py-2">
                    <Skeleton height={10} />
                  </td>
                  <td className="px-2 py-2">
                    <Skeleton height={10} />
                  </td>
                  <td className="px-2 py-2">
                    <Skeleton height={10} />
                  </td>
                  <td className="px-2 py-2">
                    <Skeleton height={10} />
                  </td>
                  <td className="px-2 py-2">
                    <Skeleton height={10} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Mobile Cards Skeleton */}
        <div className="md:hidden flex flex-col space-y-4">
          {skeletonRows.map((row) => (
            <div key={row} className="bg-white p-4 rounded shadow">
              <Skeleton height={10} width="60%" className="mb-2" />
              <Skeleton height={10} width="80%" className="mb-2" />
              <Skeleton height={10} width="40%" className="mb-2" />
              <Skeleton height={10} width="90%" className="mb-2" />
              <Skeleton height={10} width="50%" />
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Pagination handler
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
      {/* Filter Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 md:static md:inset-auto md:w-1/4 lg:w-1/5 bg-white p-4 shadow-md transition-transform duration-300 ease-in-out z-50`}
      >
        <h2 className="text-md font-bold text-red-600 mb-4 text-center">Filter Accounts</h2>
        {/* Mobile Close Button */}
        <div className="md:hidden flex justify-end mb-2">
          <button onClick={() => setIsSidebarOpen(false)} className="text-red-500 text-xl">
            &times;
          </button>
        </div>
        {/* Search Input */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search by Account ID/Customer Name"
            onChange={handleAccountSearchChange}
            className="border text-xs p-2 rounded w-full focus:outline-none focus:ring-1 focus:ring-red-500"
          />
        </div>
        {/* Select Accounts */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Select Accounts</h3>
          <div className="flex items-center mb-2">
            <input
              type="checkbox"
              checked={accounts.length > 0 && selectedAccountIds.length === accounts.length}
              onChange={(e) => handleSelectAll(e.target.checked)}
              className="mr-2"
            />
            <span className="text-xs text-gray-700">Select All</span>
          </div>
          <div className="max-h-60 overflow-auto border p-2 rounded">
            {accounts
              .filter(
                (acc) =>
                  acc.accountId.toLowerCase().includes(accountSearch.toLowerCase()) ||
                  acc.customerName.toLowerCase().includes(accountSearch.toLowerCase())
              )
              .map((acc) => (
                <div key={acc._id} className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    checked={selectedAccountIds.includes(acc._id)}
                    onChange={() => handleAccountSelectionChange(acc._id)}
                    className="mr-2"
                  />
                  <span className="text-xs text-gray-700">
                    {acc.accountId} - {acc.customerName}
                  </span>
                </div>
              ))}
          </div>
        </div>
        {/* Payment Status Filter */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Payment Status</h3>
          <select
            value={paymentStatusFilter}
            onChange={(e) => setPaymentStatusFilter(e.target.value)}
            className="border text-xs p-2 rounded w-full focus:outline-none focus:ring-1 focus:ring-red-500"
          >
            <option value="">All Statuses</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
          </select>
        </div>
        {/* Bill Amount Range Filter */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Bill Amount Range (₹)</h3>
          <div className="flex space-x-2">
            <input
              type="number"
              placeholder="Min"
              value={billAmountMin}
              onChange={(e) => setBillAmountMin(e.target.value)}
              className="border text-xs p-2 rounded w-1/2"
              min="0"
            />
            <input
              type="number"
              placeholder="Max"
              value={billAmountMax}
              onChange={(e) => setBillAmountMax(e.target.value)}
              className="border text-xs p-2 rounded w-1/2"
              min="0"
            />
          </div>
        </div>
        {/* Pending Amount Range Filter */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Pending Amount Range (₹)</h3>
          <div className="flex space-x-2">
            <input
              type="number"
              placeholder="Min"
              value={pendingAmountMin}
              onChange={(e) => setPendingAmountMin(e.target.value)}
              className="border text-xs p-2 rounded w-1/2"
              min="0"
            />
            <input
              type="number"
              placeholder="Max"
              value={pendingAmountMax}
              onChange={(e) => setPendingAmountMax(e.target.value)}
              className="border text-xs p-2 rounded w-1/2"
              min="0"
            />
          </div>
        </div>
        {/* Sorting Options */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Sort By</h3>
          <div className="flex space-x-2">
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value)}
              className="border text-xs p-2 rounded w-1/2 focus:outline-none focus:ring-1 focus:ring-red-500"
            >
              <option value="createdAt">Created At</option>
              <option value="totalBillAmount">Total Bill</option>
              <option value="paidAmount">Paid Amount</option>
              <option value="pendingAmount">Pending Amount</option>
            </select>
            <select
              value={sortDirection}
              onChange={(e) => setSortDirection(e.target.value)}
              className="border text-xs p-2 rounded w-1/2 focus:outline-none focus:ring-1 focus:ring-red-500"
            >
              <option value="desc">Desc</option>
              <option value="asc">Asc</option>
            </select>
          </div>
        </div>
        {/* Apply Filters Button */}
        <div className="flex justify-end">
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 text-xs font-bold w-full"
          >
            Apply Filters
          </button>
        </div>
      </div>

      {/* Mobile Filter Toggle Button */}
      <div className="md:hidden flex justify-end p-2">
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="bg-red-500 text-white px-4 py-2 rounded shadow"
        >
          Open Filters
        </button>
      </div>

      {/* Overlay for Mobile Sidebar */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Main Content */}
      <div className="flex-1 p-4 md:p-6 lg:p-8">
        {/* Totals Section */}
        <div className="flex flex-col sm:flex-row justify-between items-center shadow-md rounded-lg p-4 mb-4 space-y-4 sm:space-y-0">
          <div className="bg-white p-4 rounded shadow w-full sm:w-auto">
            <h3 className="text-sm font-bold text-gray-600">Total Bill</h3>
            <p className="text-sm sm:text-xs font-extrabold text-green-600">₹{totalBill.toFixed(2)}</p>
          </div>
          <div className="bg-white p-4 rounded shadow w-full sm:w-auto">
            <h3 className="text-sm font-bold text-gray-600">Total Paid</h3>
            <p className="text-sm sm:text-xs font-extrabold text-blue-600">₹{totalPaid.toFixed(2)}</p>
          </div>
          <div className="bg-white p-4 rounded shadow w-full sm:w-auto">
            <h3 className="text-sm font-bold text-gray-600">Total Pending</h3>
            <p className="text-sm sm:text-xs font-extrabold text-red-600">₹{totalPending.toFixed(2)}</p>
          </div>
        </div>

        {/* PDF Loading Spinner */}
        {pdfLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="flex flex-col items-center">
              <i className="fa fa-spinner fa-spin text-white text-4xl mb-4"></i>
              <p className="text-white text-xs">Generating PDF...</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && <p className="text-red-500 text-center mb-4 text-xs">{error}</p>}

        {/* Content Loading */}
        {loading ? (
          renderSkeleton()
        ) : (
          <>
            {fullyFilteredAccounts.length === 0 ? (
              <p className="text-center text-gray-500 text-xs">
                No customer accounts available.
              </p>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block">
                  <table className="w-full text-xs text-gray-500 bg-white shadow-md rounded-lg overflow-hidden">
                    <thead className="bg-red-600 text-xs text-white">
                      <tr className="divide-y">
                        <th className="px-4 py-2 text-left">Account ID</th>
                        <th className="px-2 py-2">Customer Name</th>
                        <th className="px-2 py-2">Total Bill (₹)</th>
                        <th className="px-2 py-2">Paid Amount (₹)</th>
                        <th className="px-2 py-2">Pending Amount (₹)</th>
                        <th className="px-2 py-2">Created At</th>
                        <th className="px-2 py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginateAccounts().map((account) => (
                        <tr
                          key={account._id}
                          className="hover:bg-gray-100 divide-y divide-x"
                        >
                          <td className="px-4 py-2 text-xs font-bold text-red-600">
                            {account.accountId}
                          </td>
                          <td className="px-2 py-2 text-xs">
                            {account.customerName}
                          </td>
                          <td className="px-2 py-2 text-xs">
                            ₹{account.totalBillAmount.toFixed(2)}
                          </td>
                          <td className="px-2 py-2 text-xs text-blue-600 font-semibold">
                            ₹{account.paidAmount.toFixed(2)}
                          </td>
                          <td className="px-2 py-2 text-xs text-red-600 font-semibold">
                            ₹{account.pendingAmount.toFixed(2)}
                          </td>
                          <td className="px-2 py-2 text-xs">
                            {new Date(account.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-2 py-2 text-xs">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleView(account)}
                                className="bg-red-500 text-white px-2 font-bold py-1 rounded hover:bg-red-600 flex items-center text-xs"
                              >
                                <i className="fa fa-eye mr-1"></i> View
                              </button>
                              <button
                                onClick={() => generatePDF(account)}
                                className="bg-red-500 text-white px-2 font-bold py-1 rounded hover:bg-red-600 flex items-center text-xs"
                              >
                                <i className="fa fa-file-pdf-o mr-1"></i> Download
                              </button>
                             {userInfo.isSuper && <button
                                onClick={() => handleRemove(account._id)}
                                className="bg-red-500 text-white px-2 font-bold py-1 rounded hover:bg-red-600 flex items-center text-xs"
                              >
                                <i className="fa fa-trash mr-1"></i> Delete
                              </button> }
                              <button
                                onClick={() => navigate(`/customer/edit/${account._id}`)}
                                className="bg-red-500 text-white px-2 font-bold py-1 rounded hover:bg-red-600 flex items-center text-xs"
                              >
                                <i className="fa fa-edit mr-1"></i> Edit
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden flex flex-col space-y-4">
                  {paginateAccounts().map((account) => (
                    <div key={account._id} className="bg-white p-4 rounded shadow">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm font-bold text-red-600">
                          Account ID: {account.accountId}
                        </h3>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleView(account)}
                            className="bg-red-500 text-white px-2 font-bold py-1 rounded hover:bg-red-600 text-xs"
                          >
                            <i className="fa fa-eye mr-1"></i>
                          </button>
                          <button
                            onClick={() => generatePDF(account)}
                            className="bg-red-500 text-white px-2 font-bold py-1 rounded hover:bg-red-600 text-xs"
                          >
                            <i className="fa fa-file-pdf-o mr-1"></i>
                          </button>
                          <button
                            onClick={() => handleRemove(account._id)}
                            className="bg-red-500 text-white px-2 font-bold py-1 rounded hover:bg-red-600 text-xs"
                          >
                            <i className="fa fa-trash mr-1"></i>
                          </button>
                          <button
                            onClick={() => navigate(`/customer/edit/${account._id}`)}
                            className="bg-red-500 text-white px-2 font-bold py-1 rounded hover:bg-red-600 text-xs"
                          >
                            <i className="fa fa-edit mr-1"></i>
                          </button>
                        </div>
                      </div>
                      <p className="text-xs">
                        <span className="font-semibold">Name: </span>
                        {account.customerName}
                      </p>
                      <p className="text-xs">
                        <span className="font-semibold">Total Bill: </span>
                        ₹{account.totalBillAmount.toFixed(2)}
                      </p>
                      <p className="text-xs">
                        <span className="font-semibold">Paid Amount: </span>
                        ₹{account.paidAmount.toFixed(2)}
                      </p>
                      <p className="text-xs">
                        <span className="font-semibold">Pending Amount: </span>
                        ₹{account.pendingAmount.toFixed(2)}
                      </p>
                      <p className="text-xs">
                        <span className="font-semibold">Created At: </span>
                        {new Date(account.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                <div className="flex justify-between items-center mt-4">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-4 text-xs font-bold py-2 rounded-lg ${
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
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-4 text-xs font-bold py-2 rounded-lg ${
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
          </>
        )}
      </div>

      {/* Full Transactions Modal using MUI Dialog */}
      <Dialog
        open={Boolean(selectedAccount)}
        TransitionComponent={Transition}
        keepMounted
        onClose={closeModal}
        fullWidth
        maxWidth="md"
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          margin: 0,
          '& .MuiDialog-container': {
            display: 'flex',
            alignItems: 'flex-end',
          },
        }}
        PaperProps={{
          sx: {
            width: '100%',
            height: '80vh',
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
            overflowY: 'auto',
            boxShadow: 'none',
          },
        }}
      >
        <DialogTitle sx={{ m: 0, p: 2, fontWeight: 'bold' }}>
          Customer: {selectedAccount?.customerName}
          <IconButton
            aria-label="close"
            onClick={closeModal}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ overflowY: 'auto', maxHeight: '60vh' }}>
          <div className="mt-2">
            {/* Account Details */}
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
              <div className='flex justify-between items-center space-x-2'>
                <p className="text-sm font-semibold">
                  Total Bill Amount: <span className="text-gray-900 font-bold">₹{selectedAccount?.totalBillAmount.toFixed(2)}</span>
                </p>
                <p className="text-sm font-semibold">
                  Paid Amount: <span className="text-blue-600 font-bold">₹{selectedAccount?.paidAmount.toFixed(2)}</span>
                </p>
                <p className="text-sm font-semibold">
                  Pending Amount: <span className="text-red-600 font-bold">₹{selectedAccount?.pendingAmount.toFixed(2)}</span>
                </p>
                <p className="text-sm font-semibold">
                  Created At: {new Date(selectedAccount?.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            {/* Bills Table */}
            <h3 className="text-md font-semibold text-green-600 mb-2">Bills</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs text-gray-500">
                <thead className="text-xs uppercase bg-gray-100 text-gray-700">
                  <tr>
                    <th className="px-4 py-2">#</th>
                    <th className="px-4 py-2">Invoice No.</th>
                    <th className="px-4 py-2">Bill Amount (₹)</th>
                    <th className="px-4 py-2">Invoice Date</th>
                    <th className="px-4 py-2">Remark</th>
                    <th className="px-4 py-2">Delivery Status</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedAccount?.bills && selectedAccount.bills.length > 0 ? (
                    selectedAccount.bills.map((bill, index) => (
                      <tr key={index} className="bg-white text-center border-b hover:bg-gray-50">
                        <td className="px-4 py-2 text-xs">{index + 1}</td>
                        <td className="px-4 py-2 text-xs">{bill.invoiceNo}</td>
                        <td className="px-4 py-2 text-xs">₹{bill.billAmount.toFixed(2)}</td>
                        <td className="px-4 py-2 text-xs">{new Date(bill.invoiceDate).toLocaleDateString()}</td>
                        <td className="px-4 py-2 text-xs">{bill.remark}</td>
                        <td className="px-4 py-2 text-xs">
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              bill.deliveryStatus === 'Delivered'
                                ? 'bg-green-200 text-green-800'
                                : 'bg-yellow-200 text-yellow-800'
                            }`}
                          >
                            {bill.deliveryStatus}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-4 py-2 text-xs text-center text-gray-500">
                        No bills available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* Payments Table */}
            <h3 className="text-md font-semibold text-red-600 mb-2 mt-4">Payments</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs text-gray-500">
                <thead className="text-xs uppercase bg-gray-100 text-gray-700">
                  <tr>
                    <th className="px-4 py-2">Amount (₹)</th>
                    <th className="px-4 py-2">Submitted By</th>
                    <th className="px-4 py-2">Remark</th>
                    <th className="px-4 py-2">Date</th>
                    <th className="px-4 py-2">Method</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedAccount?.payments && selectedAccount.payments.length > 0 ? (
                    selectedAccount.payments.map((payment, index) => (
                      <tr key={index} className="bg-white text-center border-b hover:bg-gray-50">
                        <td className={`px-4 py-2 text-xs ${payment.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ₹{payment.amount.toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-xs">{payment.submittedBy}</td>
                        <td className="px-4 py-2 text-xs">{payment.remark || '-'}</td>
                        <td className="px-4 py-2 text-xs">{new Date(payment.date).toLocaleDateString()}</td>
                        <td className="px-4 py-2 text-xs">{payment.method}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-4 py-2 text-xs text-center text-gray-500">
                        No payments available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerAccountList;
