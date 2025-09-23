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
  const [sidebarAccounts, setSidebarAccounts] = useState([]); // For sidebar display
  const [paginatedAccounts, setPaginatedAccounts] = useState([]); // For main table
  const [selectedAccount, setSelectedAccount] = useState(null); // For modal
  const [loading, setLoading] = useState(false); // Combined loading state
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const [totalPages, setTotalPages] = useState(1);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // For mobile sidebar

  // Totals states
  const [totalBill, setTotalBill] = useState(0);
  const [totalPaid, setTotalPaid] = useState(0);
  const [totalPending, setTotalPending] = useState(0);

  // Filter and sorting states
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [billAmountMin, setBillAmountMin] = useState('');
  const [billAmountMax, setBillAmountMax] = useState('');
  const [pendingAmountMin, setPendingAmountMin] = useState('');
  const [pendingAmountMax, setPendingAmountMax] = useState('');
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [accountSearch, setAccountSearch] = useState('');
  const [selectedAccountIds, setSelectedAccountIds] = useState(() => {
    const stored = localStorage.getItem('selectedCustomerAccountIds');
    return stored ? JSON.parse(stored) : [];
  });

  // Handle Select All for visible sidebar accounts
  const handleSelectAll = (isChecked) => {
    let updatedSelections;
    const visibleIds = sidebarAccounts.map((acc) => acc._id);
    if (isChecked) {
      updatedSelections = [...new Set([...selectedAccountIds, ...visibleIds])];
    } else {
      updatedSelections = selectedAccountIds.filter((id) => !visibleIds.includes(id));
    }
    setSelectedAccountIds(updatedSelections);
    localStorage.setItem('selectedCustomerAccountIds', JSON.stringify(updatedSelections));
    setCurrentPage(1); // Reset to first page to reflect selection changes
  };

  // Handle individual account selection
  const handleAccountSelectionChange = (accountId) => {
    let updatedSelections;
    if (selectedAccountIds.includes(accountId)) {
      updatedSelections = selectedAccountIds.filter((id) => id !== accountId);
    } else {
      updatedSelections = [...selectedAccountIds, accountId];
    }
    setSelectedAccountIds(updatedSelections);
    localStorage.setItem('selectedCustomerAccountIds', JSON.stringify(updatedSelections));
    setCurrentPage(1); // Reset to first page to reflect selection changes
  };

  // Fetch accounts for both sidebar and table
  const fetchAccounts = useCallback(
    async (page = 1) => {
      setLoading(true);
      setError(''); // Clear previous errors
      try {
        const params = {
          page,
          limit: itemsPerPage,
          search: accountSearch || undefined,
          paymentStatus: paymentStatusFilter || undefined,
          billMin: billAmountMin || undefined,
          billMax: billAmountMax || undefined,
          pendingMin: pendingAmountMin || undefined,
          pendingMax: pendingAmountMax || undefined,
          sortField,
          sortDirection,
        };

        // Include selected account IDs to ensure they are fetched
        if (selectedAccountIds.length > 0) {
          params.ids = selectedAccountIds.join(',');
        }

        const response = await api.get('/api/customer/accounts', { params });
        const accounts = response.data.accounts.map((account) => ({
          ...account,
          bills: account.bills || [],
          payments: account.payments || [],
        }));

        // Update paginated accounts (table)
        setPaginatedAccounts(accounts);
        setTotalPages(Math.ceil(response.data.totalCount / itemsPerPage));
        setTotalBill(response.data.totals.totalBill);
        setTotalPaid(response.data.totals.totalPaid);
        setTotalPending(response.data.totals.totalPending);
        setCurrentPage(page);

        // Update sidebar accounts: use table accounts + selected accounts
        // Fetch additional selected accounts if not in current table data
        const tableAccountIds = accounts.map((acc) => acc._id);
        const missingSelectedIds = selectedAccountIds.filter((id) => !tableAccountIds.includes(id));
        let sidebarAccountsData = [...accounts];

        if (missingSelectedIds.length > 0) {
          const selectedParams = {
            limit: missingSelectedIds.length,
            ids: missingSelectedIds.join(','),
            sortField: 'createdAt',
            sortDirection: 'desc',
          };
          const selectedResponse = await api.get('/api/customer/accounts', { params: selectedParams });
          const selectedAccounts = selectedResponse.data.accounts.map((account) => ({
            ...account,
            bills: account.bills || [],
            payments: account.payments || [],
          }));
          sidebarAccountsData = [...new Set([...accounts, ...selectedAccounts])];
        }

        setSidebarAccounts(sidebarAccountsData);
      } catch (err) {
        setError('Failed to fetch accounts.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [
      accountSearch,
      paymentStatusFilter,
      billAmountMin,
      billAmountMax,
      pendingAmountMin,
      pendingAmountMax,
      sortField,
      sortDirection,
      selectedAccountIds,
    ]
  );

  // Debounced search handler
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

  // Initial fetch and whenever filters/selection changes
  useEffect(() => {
    fetchAccounts(1);
  }, [
    accountSearch,
    paymentStatusFilter,
    billAmountMin,
    billAmountMax,
    pendingAmountMin,
    pendingAmountMax,
    sortField,
    sortDirection,
    selectedAccountIds,
    fetchAccounts,
  ]);

  // PDF Generation
  const generatePDF = (account) => {
    setPdfLoading(true);
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text('Customer Account Statement', 14, 20);
    doc.setFontSize(10);
    doc.text(`Account ID: ${account.accountId}`, 14, 28);
    doc.text(`Customer Name: ${account.customerName}`, 14, 34);
    doc.text(`Total Bill Amount: ₹${account.totalBillAmount.toFixed(2)}`, 14, 40);
    doc.text(`Paid Amount: ₹${account.paidAmount.toFixed(2)}`, 14, 46);
    doc.text(`Pending Amount: ₹${account.pendingAmount.toFixed(2)}`, 14, 52);
    doc.text(`Created At: ${new Date(account.createdAt).toLocaleString()}`, 14, 58);

    // Bills Table
    doc.setFontSize(12);
    doc.text('Bills', 14, 70);
    const billsData = account.bills.map((bill, index) => [
      index + 1,
      bill.invoiceNo,
      `₹${bill.billAmount.toFixed(2)}`,
      new Date(bill.invoiceDate).toLocaleDateString(),
      bill.deliveryStatus,
    ]);

    doc.autoTable({
      startY: 74,
      head: [['#', 'Invoice No.', 'Bill Amount', 'Invoice Date', 'Delivery Status']],
      body: billsData,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [46, 204, 113] },
    });

    // Payments Table
    const finalY = doc.lastAutoTable.finalY + 8;
    doc.setFontSize(12);
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
      startY: finalY + 4,
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
        // Remove from selections
        const updatedSelections = selectedAccountIds.filter((accountId) => accountId !== id);
        setSelectedAccountIds(updatedSelections);
        localStorage.setItem('selectedCustomerAccountIds', JSON.stringify(updatedSelections));
        // Refetch accounts
        await fetchAccounts(1);
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

  // Render loading skeletons
  const renderSkeleton = () => {
    const skeletonRows = Array.from({ length: itemsPerPage }, (_, index) => index);
    return (
      <div className="w-full">
        {/* Desktop Table Skeleton */}
        <div className="hidden md:block">
          <table className="w-full text-xs text-gray-500 bg-white shadow-md rounded-lg overflow-hidden">
            <thead className="bg-gray-200">
              <tr>
                <th className="px-3 py-1 text-left">Account ID</th>
                <th className="px-3 py-1">Customer Name</th>
                <th className="px-3 py-1">Total Bill</th>
                <th className="px-3 py-1">Paid Amount</th>
                <th className="px-3 py-1">Pending Amount</th>
                <th className="px-3 py-1">Created At</th>
                <th className="px-3 py-1">Actions</th>
              </tr>
            </thead>
            <tbody>
              {skeletonRows.map((row) => (
                <tr key={row} className="hover:bg-gray-100">
                  <td className="px-3 py-1">
                    <Skeleton height={8} />
                  </td>
                  <td className="px-3 py-1">
                    <Skeleton height={8} />
                  </td>
                  <td className="px-3 py-1">
                    <Skeleton height={8} />
                  </td>
                  <td className="px-3 py-1">
                    <Skeleton height={8} />
                  </td>
                  <td className="px-3 py-1">
                    <Skeleton height={8} />
                  </td>
                  <td className="px-3 py-1">
                    <Skeleton height={8} />
                  </td>
                  <td className="px-3 py-1">
                    <Skeleton height={8} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Mobile Cards Skeleton */}
        <div className="md:hidden flex flex-col space-y-3">
          {skeletonRows.map((row) => (
            <div key={row} className="bg-white p-3 rounded shadow">
              <Skeleton height={8} width="50%" className="mb-1" />
              <Skeleton height={8} width="70%" className="mb-1" />
              <Skeleton height={8} width="30%" className="mb-1" />
              <Skeleton height={8} width="80%" className="mb-1" />
              <Skeleton height={8} width="40%" />
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Pagination handler
  const handlePageChange = async (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      await fetchAccounts(page);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
      {/* Filter Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 md:static md:inset-auto md:w-64 bg-white p-4 shadow-lg rounded-r-lg transition-transform duration-300 ease-in-out z-50`}
      >
        <h2 className="text-sm font-bold text-red-600 mb-4 text-center">Filter Accounts</h2>
        {/* Mobile Close Button */}
        <div className="md:hidden flex justify-end mb-2">
          <button onClick={() => setIsSidebarOpen(false)} className="text-red-500 text-lg">
            &times;
          </button>
        </div>
        {/* Search Input */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search by ID/Name"
            onChange={handleAccountSearchChange}
            className="border border-gray-300 text-xs p-2 rounded w-full focus:outline-none focus:ring-1 focus:ring-red-500 transition duration-200"
          />
        </div>
        {/* Select Accounts */}
        <div className="mb-4">
          <h3 className="text-xs font-semibold text-gray-700 mb-2">Select Accounts</h3>
          <div className="flex items-center mb-2">
            <input
              type="checkbox"
              checked={sidebarAccounts.length > 0 && sidebarAccounts.every((acc) => selectedAccountIds.includes(acc._id))}
              onChange={(e) => handleSelectAll(e.target.checked)}
              className="mr-1 h-3 w-3 text-red-600 focus:ring-red-500 border-gray-300 rounded"
            />
            <span className="text-xs text-gray-700">Select All Visible</span>
          </div>
          <div className="max-h-48 overflow-auto border border-gray-200 p-2 rounded bg-gray-50">
            {loading ? (
              <p className="text-center text-gray-500 text-xs">Loading...</p>
            ) : sidebarAccounts.length === 0 ? (
              <p className="text-center text-gray-500 text-xs">No accounts found. Try searching.</p>
            ) : (
              sidebarAccounts.map((acc) => (
                <div key={acc._id} className="flex items-center mb-1">
                  <input
                    type="checkbox"
                    checked={selectedAccountIds.includes(acc._id)}
                    onChange={() => handleAccountSelectionChange(acc._id)}
                    className="mr-1 h-3 w-3 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                  />
                  <span className="text-xs text-gray-700 truncate">
                    {acc.accountId} - {acc.customerName}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
        {/* Payment Status Filter */}
        <div className="mb-4">
          <h3 className="text-xs font-semibold text-gray-700 mb-2">Payment Status</h3>
          <select
            value={paymentStatusFilter}
            onChange={(e) => {
              setPaymentStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="border border-gray-300 text-xs p-2 rounded w-full focus:outline-none focus:ring-1 focus:ring-red-500"
          >
            <option value="">All</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
          </select>
        </div>
        {/* Bill Amount Range Filter */}
        <div className="mb-4">
          <h3 className="text-xs font-semibold text-gray-700 mb-2">Bill Amount (₹)</h3>
          <div className="flex space-x-2">
            <input
              type="number"
              placeholder="Min"
              value={billAmountMin}
              onChange={(e) => {
                setBillAmountMin(e.target.value);
                setCurrentPage(1);
              }}
              className="border border-gray-300 text-xs p-2 rounded w-1/2"
              min="0"
            />
            <input
              type="number"
              placeholder="Max"
              value={billAmountMax}
              onChange={(e) => {
                setBillAmountMax(e.target.value);
                setCurrentPage(1);
              }}
              className="border border-gray-300 text-xs p-2 rounded w-1/2"
              min="0"
            />
          </div>
        </div>
        {/* Pending Amount Range Filter */}
        <div className="mb-4">
          <h3 className="text-xs font-semibold text-gray-700 mb-2">Pending Amount (₹)</h3>
          <div className="flex space-x-2">
            <input
              type="number"
              placeholder="Min"
              value={pendingAmountMin}
              onChange={(e) => {
                setPendingAmountMin(e.target.value);
                setCurrentPage(1);
              }}
              className="border border-gray-300 text-xs p-2 rounded w-1/2"
              min="0"
            />
            <input
              type="number"
              placeholder="Max"
              value={pendingAmountMax}
              onChange={(e) => {
                setPendingAmountMax(e.target.value);
                setCurrentPage(1);
              }}
              className="border border-gray-300 text-xs p-2 rounded w-1/2"
              min="0"
            />
          </div>
        </div>
        {/* Sorting Options */}
        <div className="mb-4">
          <h3 className="text-xs font-semibold text-gray-700 mb-2">Sort By</h3>
          <div className="flex space-x-2">
            <select
              value={sortField}
              onChange={(e) => {
                setSortField(e.target.value);
                setCurrentPage(1);
              }}
              className="border border-gray-300 text-xs p-2 rounded w-1/2"
            >
              <option value="createdAt">Created At</option>
              <option value="totalBillAmount">Total Bill</option>
              <option value="paidAmount">Paid Amount</option>
              <option value="pendingAmount">Pending Amount</option>
            </select>
            <select
              value={sortDirection}
              onChange={(e) => {
                setSortDirection(e.target.value);
                setCurrentPage(1);
              }}
              className="border border-gray-300 text-xs p-2 rounded w-1/2"
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
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 text-xs font-bold w-full transition duration-200"
          >
            Apply
          </button>
        </div>
      </div>

      {/* Mobile Filter Toggle Button */}
      <div className="md:hidden flex justify-end p-2 bg-white shadow-md">
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="bg-red-500 text-white px-4 py-2 rounded shadow-md hover:bg-red-600 transition duration-200 text-xs"
        >
          Filters
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
      <div className="flex-1 p-4 md:p-6">
        {/* Totals Section */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className="bg-white p-3 rounded-lg shadow">
            <h3 className="text-xs font-bold text-gray-700 mb-1">Total Bill</h3>
            <p className="text-sm font-extrabold text-green-600">₹{totalBill.toFixed(2)}</p>
          </div>
          <div className="bg-white p-3 rounded-lg shadow">
            <h3 className="text-xs font-bold text-gray-700 mb-1">Total Paid</h3>
            <p className="text-sm font-extrabold text-blue-600">₹{totalPaid.toFixed(2)}</p>
          </div>
          <div className="bg-white p-3 rounded-lg shadow">
            <h3 className="text-xs font-bold text-gray-700 mb-1">Total Pending</h3>
            <p className="text-sm font-extrabold text-red-600">₹{totalPending.toFixed(2)}</p>
          </div>
        </div>

        {/* PDF Loading Spinner */}
        {pdfLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="flex flex-col items-center">
              <i className="fa fa-spinner fa-spin text-white text-3xl mb-2"></i>
              <p className="text-white text-xs">Generating PDF...</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <p className="text-red-500 text-center mb-4 text-xs">{error}</p>
        )}

        {/* Content Loading */}
        {loading ? (
          renderSkeleton()
        ) : paginatedAccounts.length === 0 ? (
          <p className="text-center text-gray-500 text-xs">
            No accounts available.
          </p>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-xs text-gray-600 bg-white shadow-md rounded-lg overflow-hidden">
                <thead className="bg-red-600 text-xs text-white uppercase">
                  <tr>
                    <th className="px-3 py-2 text-left">ID</th>
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">Bill (₹)</th>
                    <th className="px-3 py-2">Paid (₹)</th>
                    <th className="px-3 py-2">Pending (₹)</th>
                    <th className="px-3 py-2">Created</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedAccounts.map((account) => (
                    <tr
                      key={account._id}
                      className="border-b hover:bg-gray-50 transition duration-200"
                    >
                      <td className="px-3 py-2 text-xs font-bold text-red-600">
                        {account.accountId}
                      </td>
                      <td className="px-3 py-2 text-xs">
                        {account.customerName}
                      </td>
                      <td className="px-3 py-2 text-xs">
                        ₹{account.totalBillAmount.toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-xs text-blue-600 font-semibold">
                        ₹{account.paidAmount.toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-xs text-red-600 font-semibold">
                        ₹{account.pendingAmount.toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-xs">
                        {new Date(account.createdAt).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: '2-digit',
                          year: '2-digit',
                        })}
                      </td>
                      <td className="px-3 py-2 text-xs">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleView(account)}
                            className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 flex items-center text-xs transition duration-200"
                          >
                            <i className="fa fa-eye mr-1 text-xs"></i> View
                          </button>
                          {userInfo.isSuper && (
                            <button
                              onClick={() => handleRemove(account._id)}
                              className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 flex items-center text-xs transition duration-200"
                            >
                              <i className="fa fa-trash mr-1 text-xs"></i> Delete
                            </button>
                          )}
                          <button
                            onClick={() => navigate(`/customer/edit/${account._id}`)}
                            className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 flex items-center text-xs transition duration-200"
                          >
                            <i className="fa fa-edit mr-1 text-xs"></i> Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden flex flex-col space-y-3">
              {paginatedAccounts.map((account) => (
                <div key={account._id} className="bg-white p-3 rounded-lg shadow">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-xs font-bold text-red-600">
                      ID: {account.accountId}
                    </h3>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleView(account)}
                        className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 text-xs"
                      >
                        <i className="fa fa-eye"></i>
                      </button>
                      <button
                        onClick={() => generatePDF(account)}
                        className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 text-xs"
                      >
                        <i className="fa fa-file-pdf-o"></i>
                      </button>
                      {userInfo.isSuper && (
                        <button
                          onClick={() => handleRemove(account._id)}
                          className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 text-xs"
                        >
                          <i className="fa fa-trash"></i>
                        </button>
                      )}
                      <button
                        onClick={() => navigate(`/customer/edit/${account._id}`)}
                        className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 text-xs"
                      >
                        <i className="fa fa-edit"></i>
                      </button>
                    </div>
                  </div>
                  <p className="text-xs mb-1">
                    <span className="font-semibold">Name: </span>
                    {account.customerName}
                  </p>
                  <p className="text-xs mb-1">
                    <span className="font-semibold">Bill: </span>
                    ₹{account.totalBillAmount.toFixed(2)}
                  </p>
                  <p className="text-xs mb-1">
                    <span className="font-semibold">Paid: </span>
                    ₹{account.paidAmount.toFixed(2)}
                  </p>
                  <p className="text-xs mb-1">
                    <span className="font-semibold">Pending: </span>
                    ₹{account.pendingAmount.toFixed(2)}
                  </p>
                  <p className="text-xs">
                    <span className="font-semibold">Created: </span>
                    {new Date(account.createdAt).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: '2-digit',
                      year: '2-digit',
                    })}
                  </p>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-4">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || loading}
                className={`px-4 py-2 rounded-lg text-xs font-bold ${
                  currentPage === 1 || loading
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-red-500 text-white hover:bg-red-600 transition duration-200'
                }`}
              >
                Previous
              </button>
              <span className="text-xs text-gray-600">
                Page {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || loading}
                className={`px-4 py-2 rounded-lg text-xs font-bold ${
                  currentPage === totalPages || loading
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-red-500 text-white hover:bg-red-600 transition duration-200'
                }`}
              >
                Next
              </button>
            </div>
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
          '& .MuiDialog-paper': {
            width: '100%',
            maxWidth: 'md',
            height: '80vh',
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
            overflowY: 'auto',
            boxShadow: 'none',
            margin: 0,
          },
        }}
      >
        <DialogTitle sx={{ m: 0, p: 2, fontWeight: 'bold', fontSize: '1rem' }}>
          {selectedAccount?.customerName}
          <IconButton
            aria-label="close"
            onClick={closeModal}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: 'grey.500',
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 2, overflowY: 'auto' }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4 text-xs">
            <p>
              <span className="font-semibold">Bill Amount:</span> ₹
              {selectedAccount?.totalBillAmount.toFixed(2)}
            </p>
            <p>
              <span className="font-semibold">Paid:</span> ₹
              {selectedAccount?.paidAmount.toFixed(2)}
            </p>
            <p>
              <span className="font-semibold">Pending:</span> ₹
              {selectedAccount?.pendingAmount.toFixed(2)}
            </p>
            <p>
              <span className="font-semibold">Created:</span>{' '}
              {new Date(selectedAccount?.createdAt).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: '2-digit',
              })}
            </p>
          </div>
          {/* Bills Table */}
          <h3 className="text-sm font-semibold text-green-600 mb-2">Bills</h3>
          <div className="overflow-x-auto border border-gray-200 rounded">
            <table className="min-w-full text-xs text-gray-600 divide-y divide-gray-200">
              <thead className="bg-gray-100 text-xs uppercase text-gray-700">
                <tr>
                  <th className="px-2 py-1">#</th>
                  <th className="px-2 py-1">Invoice</th>
                  <th className="px-2 py-1">Amount (₹)</th>
                  <th className="px-2 py-1">Date</th>
                  <th className="px-2 py-1">Remark</th>
                  <th className="px-2 py-1">Status</th>
                </tr>
              </thead>
              <tbody>
                {selectedAccount?.bills && selectedAccount.bills.length > 0 ? (
                  selectedAccount.bills.map((bill, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-2 py-1">{index + 1}</td>
                      <td className="px-2 py-1">{bill.invoiceNo}</td>
                      <td className="px-2 py-1">₹{bill.billAmount.toFixed(2)}</td>
                      <td className="px-2 py-1">
                        {new Date(bill.invoiceDate).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: '2-digit',
                          year: '2-digit',
                        })}
                      </td>
                      <td className="px-2 py-1">{bill.remark || '-'}</td>
                      <td className="px-2 py-1">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            bill.deliveryStatus === 'Delivered'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {bill.deliveryStatus}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-2 py-1 text-center text-gray-500">
                      No bills.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {/* Payments Table */}
          <h3 className="text-sm font-semibold text-red-600 mb-2 mt-4">Payments</h3>
          <div className="overflow-x-auto border border-gray-200 rounded">
            <table className="min-w-full text-xs text-gray-600 divide-y divide-gray-200">
              <thead className="bg-gray-100 text-xs uppercase text-gray-700">
                <tr>
                  <th className="px-2 py-1">Amount (₹)</th>
                  <th className="px-2 py-1">By</th>
                  <th className="px-2 py-1">Remark</th>
                  <th className="px-2 py-1">Date</th>
                  <th className="px-2 py-1">Method</th>
                </tr>
              </thead>
              <tbody>
                {selectedAccount?.payments && selectedAccount.payments.length > 0 ? (
                  selectedAccount.payments.map((payment, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td
                        className={`px-2 py-1 ${
                          payment.amount >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        ₹{payment.amount.toFixed(2)}
                      </td>
                      <td className="px-2 py-1">{payment.submittedBy}</td>
                      <td className="px-2 py-1">{payment.remark || '-'}</td>
                      <td className="px-2 py-1">
                        {new Date(payment.date).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: '2-digit',
                          year: '2-digit',
                        })}
                      </td>
                      <td className="px-2 py-1">{payment.method}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-2 py-1 text-center text-gray-500">
                      No payments.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerAccountList;