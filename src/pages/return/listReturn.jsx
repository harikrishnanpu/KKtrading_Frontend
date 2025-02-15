// src/screens/ReturnListingScreen.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { FaRecycle, FaTimes, FaEye } from 'react-icons/fa';
import useAuth from 'hooks/useAuth';

import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Slide from '@mui/material/Slide';
import IconButton from '@mui/material/IconButton';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function ReturnListingScreen() {
  const navigate = useNavigate();
  const [returnsData, setReturnsData] = useState([]);
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [loading, setLoading] = useState(true);
  const [printLoading, setPrintLoading] = useState(false);
  const [error, setError] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Filters & Sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [startReturnDate, setStartReturnDate] = useState('');
  const [endReturnDate, setEndReturnDate] = useState('');
  const [sortField, setSortField] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');

  // Return Type Tabs (All, Billing Return, Purchase Return)
  const [returnTypeTab, setReturnTypeTab] = useState('All');

  // Sidebar for filters in mobile
  const [showSidebar, setShowSidebar] = useState(false);

  const { user: userInfo } = useAuth();

  // 1) Fetch all returns
  const fetchReturns = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/returns'); // Adjust the endpoint if needed
      setReturnsData(data);
    } catch (err) {
      setError('Failed to fetch returns.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, []);

  // 2) Computed / Filtered Returns
  const filteredReturns = useMemo(() => {
    let data = [...returnsData];

    // Search by multiple fields
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      data = data.filter((r) => {
        // Adjust these fields based on your schema
        const rNo = r.returnNo?.toLowerCase() || '';
        const bNo = r.billingNo?.toLowerCase() || '';
        const pNo = r.purchaseNo?.toLowerCase() || '';
        const cName = r.customerName?.toLowerCase() || '';
        const sName = r.sellerName?.toLowerCase() || '';

        return (
          rNo.includes(lowerSearch) ||
          bNo.includes(lowerSearch) ||
          pNo.includes(lowerSearch) ||
          cName.includes(lowerSearch) ||
          sName.includes(lowerSearch)
        );
      });
    }

    // Date Range Filter (returnDate)
    if (startReturnDate && endReturnDate) {
      const start = new Date(startReturnDate);
      const end = new Date(endReturnDate);
      data = data.filter((r) => {
        const rDate = new Date(r.returnDate);
        return rDate >= start && rDate <= end;
      });
    }

    // Return Type Tabs: All, Billing Return, Purchase Return
    data = data.filter((r) => {
      const type = r.returnType?.toLowerCase() || '';
      if (returnTypeTab === 'All') return true;
      if (returnTypeTab === 'Billing Return' && type === 'bill') return true;
      if (returnTypeTab === 'Purchase Return' && type === 'purchase') return true;
      return false;
    });

    // Sorting
    if (sortField) {
      data.sort((a, b) => {
        let aVal = a[sortField];
        let bVal = b[sortField];

        // Handle nested fields if any
        if (sortField.includes('.')) {
          const fields = sortField.split('.');
          aVal = fields.reduce((acc, curr) => acc && acc[curr], a);
          bVal = fields.reduce((acc, curr) => acc && acc[curr], b);
        }

        // Convert to lowercase if string
        if (typeof aVal === 'string') aVal = aVal.toLowerCase();
        if (typeof bVal === 'string') bVal = bVal.toLowerCase();

        if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return data;
  }, [
    returnsData,
    searchTerm,
    startReturnDate,
    endReturnDate,
    returnTypeTab,
    sortField,
    sortOrder,
  ]);

  // 3) Pagination
  const totalPages = Math.ceil(filteredReturns.length / itemsPerPage);
  const paginatedReturns = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredReturns.slice(start, start + itemsPerPage);
  }, [filteredReturns, currentPage]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // 4) Print Return Invoice
  const printReturnInvoice = async (returnEntry) => {
    setPrintLoading(true);
    try {
      // Only send returnNo or the full doc as needed
      const response = await api.post(
        '/api/print/generate-return-invoice-html',
        { returnNo: returnEntry.returnNo },
        { responseType: 'blob' }
      );

      // Create a Blob from the response
      const blob = new Blob([response.data], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err) {
      console.error('Error printing return invoice:', err);
      alert('Failed to load the return invoice. Please try again.');
    } finally {
      setPrintLoading(false);
    }
  };

  // 5) Remove
  const handleRemove = async (id) => {
    if (window.confirm('Are you sure you want to remove this return entry?')) {
      try {
        await api.delete(`/api/returns/return/delete/${id}`); // Adjust endpoint as needed
        const updated = returnsData.filter((r) => r._id !== id);
        setReturnsData(updated);
      } catch (err) {
        setError('Error occurred while deleting the return.');
        console.error(err);
      }
    }
  };

  // 6) View
  const handleView = (returnEntry) => {
    setSelectedReturn(returnEntry);
  };
  const closeModal = () => {
    setSelectedReturn(null);
  };

  // 7) Reset Filters
  const resetFilters = () => {
    setSearchTerm('');
    setStartReturnDate('');
    setEndReturnDate('');
    setSortField('');
    setSortOrder('asc');
    setReturnTypeTab('All');
  };

  // 8) Sidebar Toggle
  const toggleSidebar = () => {
    setShowSidebar((prev) => !prev);
  };

  // 9) Calculate Totals
  const totals = useMemo(() => {
    let totalBillingReturns = 0;
    let totalPurchaseReturns = 0;

    filteredReturns.forEach((r) => {
      const amount = parseFloat(r.netReturnAmount) || 0;
      if (r.returnType?.toLowerCase() === 'bill') {
        totalBillingReturns += amount;
      } else if (r.returnType?.toLowerCase() === 'purchase') {
        totalPurchaseReturns += amount;
      }
    });

    return {
      totalBillingReturns,
      totalPurchaseReturns,
      grandTotal: totalBillingReturns + totalPurchaseReturns,
    };
  }, [filteredReturns]);

  // 10) Skeletons
  const renderTableSkeleton = () => {
    const skeletonRows = Array.from({ length: itemsPerPage }, (_, i) => i);
    return (
      <table className="w-full text-xs text-gray-500 bg-white shadow-md rounded-lg overflow-hidden">
        <thead className="bg-gray-200">
          <tr>
            <th className="px-4 py-2 text-left">Return No</th>
            <th className="px-2 py-2">Return Date</th>
            <th className="px-2 py-2">Type</th>
            <th className="px-2 py-2">Net Amount</th>
            <th className="px-2 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {skeletonRows.map((row) => (
            <tr key={row} className="hover:bg-gray-100 divide-y">
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
    );
  };

  const renderCardSkeleton = () => {
    const skeletonCards = Array.from({ length: itemsPerPage }, (_, i) => i);
    return skeletonCards.map((card) => (
      <div
        key={card}
        className="bg-white rounded-lg shadow-md p-4 mb-4 animate-pulse"
      >
        <Skeleton height={20} width={`60%`} />
        <Skeleton height={10} width={`80%`} className="mt-2" />
        <Skeleton height={10} width={`70%`} className="mt-1" />
        <div className="flex mt-4 space-x-2">
          <Skeleton height={30} width={60} />
          <Skeleton height={30} width={60} />
          <Skeleton height={30} width={60} />
        </div>
      </div>
    ));
  };

  // 11) Render status indicator or color
  const renderStatusIndicator = (r) => {
    // Based on isApproved
    const color = r.isApproved ? 'green' : 'red';
    return (
      <span className="relative flex h-3 w-3 mx-auto">
        <span
          className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-${color}-400 opacity-75`}
        ></span>
        <span
          className={`relative inline-flex rounded-full h-3 w-3 bg-${color}-500`}
        ></span>
      </span>
    );
  };

  // 12) Render card (mobile)
  const renderCard = (r) => (
    <div
      key={r._id}
      className="bg-white rounded-lg shadow-md p-4 mb-4 transition-transform transform hover:scale-100 duration-200"
    >
      <div className="flex justify-between items-center">
        <p
          onClick={() => handleView(r)}
          className={`text-md flex cursor-pointer font-bold ${
            r.isApproved ? 'text-red-600' : 'text-yellow-600'
          }`}
        >
          {r.returnNo}{' '}
          {r.isApproved && (
            <img
              className="h-4 w-4 ml-1 mt-1"
              src="/images/tick.svg"
              alt="Approved"
            />
          )}
        </p>
        <div>{renderStatusIndicator(r)}</div>
      </div>
      <p className="text-gray-600 text-xs mt-2">Return Type: {r.returnType}</p>
      <p className="text-gray-600 text-xs mt-1">
        Return Date: {new Date(r.returnDate).toLocaleDateString()}
      </p>
      <p className="text-gray-600 text-xs mt-1">
        Net Amount: ₹{parseFloat(r.netReturnAmount || 0).toFixed(2)}
      </p>
      <div className="flex mt-4 text-xs space-x-2">
        <button
          onClick={() => printReturnInvoice(r)}
          className="bg-red-500 hover:bg-red-600 text-white px-3 font-bold py-1 rounded flex items-center"
        >
          <i className="fa fa-print mr-1"></i> Print
        </button>
        <button
          onClick={() => handleView(r)}
          className="bg-red-500 hover:bg-red-600 text-white px-3 font-bold py-1 rounded flex items-center"
        >
          <FaEye className="mr-1" /> View
        </button>
        <button
          onClick={() => handleRemove(r._id)}
          className="bg-red-500 hover:bg-red-600 text-white px-3 font-bold py-1 rounded flex items-center"
        >
          <i className="fa fa-trash mr-1"></i> Remove
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Print Loading Spinner */}
      {printLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="flex flex-col items-center">
            <i className="fa fa-spinner fa-spin text-white text-4xl mb-4"></i>
            <p className="text-white text-xs">Generating Return Invoice...</p>
          </div>
        </div>
      )}

      {/* Sidebar for mobile filters */}
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
        <h2 className="text-md font-bold text-red-600 mb-4">Filters & Sorting</h2>
        {/* Search */}
        <div className="mb-4">
          <label className="block text-xs font-bold mb-1" htmlFor="search">
            Search
          </label>
          <input
            type="text"
            id="search"
            placeholder="Return No, BillingNo, PurchaseNo, Customer, Seller..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-red-300 rounded px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-red-400"
          />
        </div>
        {/* ReturnDate Start/End */}
        <div className="mb-4">
          <label className="block text-xs font-bold mb-1" htmlFor="startReturnDate">
            Start Return Date
          </label>
          <input
            type="date"
            id="startReturnDate"
            value={startReturnDate}
            onChange={(e) => setStartReturnDate(e.target.value)}
            className="w-full border border-red-300 rounded px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-red-400"
          />
        </div>
        <div className="mb-4">
          <label className="block text-xs font-bold mb-1" htmlFor="endReturnDate">
            End Return Date
          </label>
          <input
            type="date"
            id="endReturnDate"
            value={endReturnDate}
            onChange={(e) => setEndReturnDate(e.target.value)}
            className="w-full border border-red-300 rounded px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-red-400"
          />
        </div>

        {/* Return Type Filter */}
        <div className="mb-4">
          <label className="block text-xs font-bold mb-1" htmlFor="returnType">
            Return Type
          </label>
          <select
            id="returnType"
            value={returnTypeTab}
            onChange={(e) => setReturnTypeTab(e.target.value)}
            className="w-full border border-red-300 rounded px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-red-400"
          >
            <option value="All">All</option>
            <option value="Billing Return">Billing Return</option>
            <option value="Purchase Return">Purchase Return</option>
          </select>
        </div>

        <div className="flex justify-end mt-4">
          <button
            onClick={resetFilters}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-xs font-bold flex items-center"
          >
            <i className="fa fa-refresh mr-1" /> Reset Filters
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && <p className="text-red-500 text-center mb-4 text-xs">{error}</p>}

      {/* Status Tabs */}
      <div className="flex flex-wrap justify-center sm:justify-start space-x-2 mb-4">
        {['All', 'Billing Return', 'Purchase Return'].map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setReturnTypeTab(tab);
              setCurrentPage(1);
            }}
            className={`px-3 py-1 rounded text-xs font-bold ${
              returnTypeTab === tab
                ? 'bg-red-600 text-white'
                : 'bg-gray-50 text-red-700 hover:bg-red-100'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Desktop Filters */}
      <div className="hidden md:block bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="flex flex-col space-y-4 sm:flex-row sm:flex-wrap sm:space-y-0 sm:space-x-4">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-bold mb-1" htmlFor="search">
              Search
            </label>
            <input
              type="text"
              id="search"
              placeholder="Return No, BillingNo, PurchaseNo, Customer, Seller..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-red-300 rounded px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-red-400"
            />
          </div>
          {/* Date Range */}
          <div className="min-w-[150px]">
            <label className="block text-xs font-bold mb-1" htmlFor="startReturnDate">
              Start Return Date
            </label>
            <input
              type="date"
              id="startReturnDate"
              value={startReturnDate}
              onChange={(e) => setStartReturnDate(e.target.value)}
              className="w-full border border-red-300 rounded px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-red-400"
            />
          </div>
          <div className="min-w-[150px]">
            <label className="block text-xs font-bold mb-1" htmlFor="endReturnDate">
              End Return Date
            </label>
            <input
              type="date"
              id="endReturnDate"
              value={endReturnDate}
              onChange={(e) => setEndReturnDate(e.target.value)}
              className="w-full border border-red-300 rounded px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-red-400"
            />
          </div>

          {/* Return Type Filter */}
          <div className="min-w-[150px]">
            <label className="block text-xs font-bold mb-1" htmlFor="returnType">
              Return Type
            </label>
            <select
              id="returnType"
              value={returnTypeTab}
              onChange={(e) => setReturnTypeTab(e.target.value)}
              className="w-full border border-red-300 rounded px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-red-400"
            >
              <option value="All">All</option>
              <option value="Billing Return">Billing Return</option>
              <option value="Purchase Return">Purchase Return</option>
            </select>
          </div>

          <div className="flex justify-end mt-4 sm:mt-0">
            <button
              onClick={resetFilters}
              className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded text-xs font-bold flex items-center"
            >
              <i className="fa fa-refresh mr-1" /> Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap justify-center sm:justify-start gap-4">
          <div className="bg-white p-4 rounded-lg shadow-md flex-1 min-w-[200px]">
            <p className="text-xs font-bold text-red-600">Total Billing Returns</p>
            <p className="text-xs text-gray-500">
              {returnsData.filter(r => r.returnType?.toLowerCase() === 'bill').length} returns
            </p>
            <p className="text-sm font-bold text-gray-700">
              ₹{returnsData
                .filter(r => r.returnType?.toLowerCase() === 'bill')
                .reduce((acc, r) => acc + (parseFloat(r.netReturnAmount) || 0), 0)
                .toFixed(2)}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md flex-1 min-w-[200px]">
            <p className="text-xs font-bold text-red-600">Total Purchase Returns</p>
            <p className="text-xs text-gray-500">
              {returnsData.filter(r => r.returnType?.toLowerCase() === 'purchase').length} returns
            </p>
            <p className="text-sm font-bold text-gray-700">
              ₹{returnsData
                .filter(r => r.returnType?.toLowerCase() === 'purchase')
                .reduce((acc, r) => acc + (parseFloat(r.netReturnAmount) || 0), 0)
                .toFixed(2)}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md flex-1 min-w-[200px]">
            <p className="text-xs font-bold text-red-600">Grand Total</p>
            <p className="text-xs text-gray-500">
              {returnsData.length} returns
            </p>
            <p className="text-sm font-bold text-gray-700">
              ₹{returnsData
                .reduce((acc, r) => acc + (parseFloat(r.netReturnAmount) || 0), 0)
                .toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div>
          <div className="hidden md:block">{renderTableSkeleton()}</div>
          <div className="md:hidden">{renderCardSkeleton()}</div>
        </div>
      ) : paginatedReturns.length === 0 ? (
        <p className="text-center text-gray-500 text-xs">
          No returns match your search or filter criteria.
        </p>
      ) : (
        <>
          {/* Table for Large Screens */}
          <div className="hidden md:block">
            <table className="w-full text-xs text-gray-500 bg-white shadow-md rounded-lg overflow-hidden">
              <thead className="bg-red-600 text-xs text-white">
                <tr className="divide-y">
                  <th className="px-4 py-2 text-left">Status</th>
                  <th
                    className="px-2 py-2 cursor-pointer"
                    onClick={() => {
                      setSortField('returnNo');
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    }}
                  >
                    Return No{' '}
                    {sortField === 'returnNo' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="px-2 py-2 cursor-pointer"
                    onClick={() => {
                      setSortField('returnDate');
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    }}
                  >
                    Return Date{' '}
                    {sortField === 'returnDate' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-2 py-2">Type</th>
                  <th
                    className="px-2 py-2 cursor-pointer"
                    onClick={() => {
                      setSortField('netReturnAmount');
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    }}
                  >
                    Net Amount{' '}
                    {sortField === 'netReturnAmount' &&
                      (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-2 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedReturns.map((r) => (
                  <tr key={r._id} className="hover:bg-gray-100 divide-y divide-x">
                    <td className="px-4 py-2 text-center">{renderStatusIndicator(r)}</td>
                    <td
                      onClick={() => handleView(r)}
                      className={`px-2 cursor-pointer flex text-xs font-bold py-2 ${
                        r.isApproved ? 'text-red-600' : 'text-yellow-600'
                      }`}
                    >
                      {r.returnNo}{' '}
                      {r.isApproved && (
                        <img
                          className="h-2 w-2 ml-1 mt-1"
                          src="/images/tick.svg"
                          alt="Approved"
                        />
                      )}
                    </td>
                    <td className="px-2 text-xs py-2">
                      {new Date(r.returnDate).toLocaleDateString()}
                    </td>
                    <td className="px-2 text-xs py-2 capitalize">{r.returnType}</td>
                    <td className="px-2 text-xs py-2">
                      ₹{parseFloat(r.netReturnAmount || 0).toFixed(2)}
                    </td>
                    <td className="px-2 text-xs py-2">
                      <div className="flex text-xs space-x-1">
                        <button
                          onClick={() => printReturnInvoice(r)}
                          className="bg-red-500 hover:bg-red-600 text-white px-2 font-bold py-1 rounded flex items-center"
                        >
                          <i className="fa fa-print mr-1"></i> Print
                        </button>
                        <button
                          onClick={() => handleView(r)}
                          className="bg-red-500 hover:bg-red-600 text-white px-2 font-bold py-1 rounded flex items-center"
                        >
                          <FaEye className="mr-1" /> View
                        </button>
                        <button
                          onClick={() => handleRemove(r._id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-2 font-bold py-1 rounded flex items-center"
                        >
                          <i className="fa fa-trash mr-1"></i> Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cards for Mobile Screens */}
          <div className="md:hidden">{paginatedReturns.map(renderCard)}</div>

          {/* Pagination */}
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

      {/* MUI Dialog for Viewing Return Details */}
      <Dialog
        fullScreen
        open={Boolean(selectedReturn)}
        onClose={closeModal}
        TransitionComponent={Transition}
      >
        <DialogTitle>
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <FaRecycle className="text-red-600" />
              <span className="text-lg font-bold text-red-600">
                Return Details - {selectedReturn?.returnNo}
              </span>
            </div>
            <IconButton onClick={closeModal}>
              <FaTimes />
            </IconButton>
          </div>
        </DialogTitle>
        <DialogContent dividers className="p-4 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {/* Left side info */}
            <div>
              {selectedReturn?.returnType?.toLowerCase() === 'bill' ? (
                <>
                  <p className="mb-1">
                    Billing No:{' '}
                    <span className="text-gray-700">
                      {selectedReturn.billingNo}
                    </span>
                  </p>
                  <p className="mb-1">
                    Customer Name:{' '}
                    <span className="text-gray-700">
                      {selectedReturn.customerName}
                    </span>
                  </p>
                  <p className="mb-1">
                    Customer Address:{' '}
                    <span className="text-gray-700">
                      {selectedReturn.customerAddress}
                    </span>
                  </p>
                </>
              ) : selectedReturn?.returnType?.toLowerCase() === 'purchase' ? (
                <>
                  <p className="mb-1">
                    Purchase No:{' '}
                    <span className="text-gray-700">
                      {selectedReturn.purchaseNo}
                    </span>
                  </p>
                  <p className="mb-1">
                    Seller Name:{' '}
                    <span className="text-gray-700">
                      {selectedReturn.sellerName}
                    </span>
                  </p>
                  <p className="mb-1">
                    Seller Address:{' '}
                    <span className="text-gray-700">
                      {selectedReturn.sellerAddress}
                    </span>
                  </p>
                </>
              ) : null}
            </div>
            {/* Right side info */}
            <div>
              <p className="mb-1">
                Return Date:{' '}
                <span className="text-gray-700">
                  {new Date(selectedReturn?.returnDate).toLocaleDateString()}
                </span>
              </p>
              <p className="mb-1">
                Discount:{' '}
                <span className="text-gray-700">
                  ₹{parseFloat(selectedReturn?.discount || 0).toFixed(2)}
                </span>
              </p>
              {selectedReturn?.otherExpenses &&
                selectedReturn?.otherExpenses.length > 0 && (
                  <p className="mb-1">
                    Other Expenses:{' '}
                    <span className="text-gray-700">
                      ₹
                      {selectedReturn.otherExpenses
                        .reduce(
                          (acc, oe) => acc + (parseFloat(oe.amount) || 0),
                          0
                        )
                        .toFixed(2)}
                    </span>
                  </p>
                )}
            </div>
          </div>

          <hr className="my-4" />

          {/* Products Table */}
          <h3 className="text-md font-bold text-red-600 mb-2">
            Products ({selectedReturn?.products?.length || 0})
          </h3>
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-sm text-gray-500">
              <thead className="bg-gray-100 text-xs uppercase text-gray-700">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Item ID</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Qty</th>
                  <th className="px-4 py-3">Unit</th>
                  <th className="px-4 py-3">Return Price</th>
                  <th className="px-4 py-3">Discount</th>
                  <th className="px-4 py-3">Total Amount</th>
                </tr>
              </thead>
              <tbody>
                {selectedReturn?.products?.map((prod, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs font-medium text-gray-900 whitespace-nowrap">
                      {idx + 1}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {prod.item_id || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {prod.name || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {prod.quantity || '0'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {prod.unit || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      ₹{parseFloat(prod.returnPrice || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      ₹
                      {(
                        (parseFloat(selectedReturn.discount || 0) /
                          selectedReturn.products.length) *
                        parseFloat(prod.quantity || 0)
                      ).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      ₹
                      {(
                        parseFloat(prod.quantity || 0) *
                          parseFloat(prod.returnPrice || 0) -
                        (parseFloat(selectedReturn.discount || 0) /
                          selectedReturn.products.length) *
                          parseFloat(prod.quantity || 0)
                      ).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="text-right">
            <p className="text-sm mb-1">
              Subtotal:{' '}
              <span className="text-gray-600">
                ₹{parseFloat(selectedReturn?.returnAmount || 0).toFixed(2)}
              </span>
            </p>
            {selectedReturn?.cgst > 0 && (
              <p className="text-sm mb-1">
                CGST:{' '}
                <span className="text-gray-600">
                  ₹{parseFloat(selectedReturn?.cgst || 0).toFixed(2)}
                </span>
              </p>
            )}
            {selectedReturn?.sgst > 0 && (
              <p className="text-sm mb-1">
                SGST:{' '}
                <span className="text-gray-600">
                  ₹{parseFloat(selectedReturn?.sgst || 0).toFixed(2)}
                </span>
              </p>
            )}
            <p className="text-sm mb-1">
              Total Tax:{' '}
              <span className="text-gray-600">
                ₹{parseFloat(selectedReturn?.totalTax || 0).toFixed(2)}
              </span>
            </p>
            <p className="text-md font-bold mb-1">
              Grand Total:{' '}
              <span className="text-gray-800">
                ₹{parseFloat(selectedReturn?.netReturnAmount || 0).toFixed(2)}
              </span>
            </p>
          </div>

          {/* Other Expenses Table */}
          {selectedReturn?.otherExpenses &&
            selectedReturn?.otherExpenses.length > 0 && (
              <>
                <hr className="my-4" />
                <h3 className="text-md font-bold text-red-600 mb-2">
                  Other Expenses ({selectedReturn?.otherExpenses.length})
                </h3>
                <div className="overflow-x-auto mb-4">
                  <table className="w-full text-sm text-gray-500">
                    <thead className="bg-gray-100 text-xs uppercase text-gray-700">
                      <tr>
                        <th className="px-4 py-3">#</th>
                        <th className="px-4 py-3">Amount</th>
                        <th className="px-4 py-3">Remark</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedReturn?.otherExpenses.map((oe, idx) => (
                        <tr key={idx} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3 text-xs font-medium text-gray-900 whitespace-nowrap">
                            {idx + 1}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-600">
                            ₹{parseFloat(oe.amount || 0).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-600">
                            {oe.remark || 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
        </DialogContent>
      </Dialog>
    </>
  );
}
