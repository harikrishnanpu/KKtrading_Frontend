// src/pages/StockRegistry.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';                           // axios instance
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import useAuth from 'hooks/useAuth';

const StockRegistry = () => {
  const navigate = useNavigate();
  const { user: userInfo } = useAuth();

  /* ───── state ──────────────────────────────────────────────── */
  const [logs, setLogs]                 = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');

  const [fromDate, setFromDate]         = useState('');
  const [toDate, setToDate]             = useState('');
  const [itemName, setItemName]         = useState('');
  const [brand, setBrand]               = useState('');
  const [category, setCategory]         = useState('');
  const [invoiceNo, setInvoiceNo]       = useState('');
  const [changeType, setChangeType]     = useState('');
  const [sortField, setSortField]       = useState('date');
  const [sortDirection, setSortDirection] = useState('asc');

  const itemsPerPage                    = 15;
  const [currentPage, setCurrentPage]   = useState(1);
  const [totalPages, setTotalPages]     = useState(1);

  /* ───── autocomplete suggestions (current page slice only) ─── */
  const [itemSuggestions, setItemSuggestions]         = useState([]);
  const [brandSuggestions, setBrandSuggestions]       = useState([]);
  const [categorySuggestions, setCategorySuggestions] = useState([]);
  const [invoiceSuggestions, setInvoiceSuggestions]   = useState([]);

  /* ───── fetch helper ───────────────────────────────────────── */
  const fetchLogs = async (page = 1) => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/products/stock/stock-logs', {
        params: {
          page,
          limit: itemsPerPage,
          fromDate,
          toDate,
          itemName,
          brand,
          category,
          invoiceNo,
          changeType,
          sortField,
          sortDirection
        }
      });

      setLogs(data.logs);
      setTotalPages(Math.ceil(data.total / itemsPerPage));
      setCurrentPage(page);

      setItemSuggestions(
        [...new Set(data.logs.map((l) => l.name))].filter(Boolean)
      );
      setBrandSuggestions(
        [...new Set(data.logs.map((l) => l.brand || ''))].filter(Boolean)
      );
      setCategorySuggestions(
        [...new Set(data.logs.map((l) => l.category || ''))].filter(Boolean)
      );
      setInvoiceSuggestions(
        [...new Set(data.logs.map((l) => l.invoiceNo || ''))].filter(Boolean)
      );
    } catch (err) {
      console.error(err);
      setError('Failed to fetch stock logs.');
    } finally {
      setLoading(false);
    }
  };

  /* ───── first load ─────────────────────────────────────────── */
  useEffect(() => {
    fetchLogs(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ───── reload on filter/sort change ───────────────────────── */
  useEffect(() => {
    fetchLogs(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    fromDate,
    toDate,
    itemName,
    brand,
    category,
    invoiceNo,
    changeType,
    sortField,
    sortDirection
  ]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) fetchLogs(page);
  };

  /* ───── PDF ────────────────────────────────────────────────── */
  const generatePDF = () => {
    const doc = new jsPDF();
    doc.text('Stock Registry Report', 14, 15);
    doc.setFontSize(12);
    doc.text(`Date Range: ${fromDate || 'All'} to ${toDate || 'All'}`, 14, 25);
    doc.text(`Filters:`, 14, 32);
    doc.text(`Item Name: ${itemName || 'All'}`, 14, 37);
    doc.text(`Brand: ${brand || 'All'}`, 14, 42);
    doc.text(`Category: ${category || 'All'}`, 14, 47);
    doc.text(`Invoice No: ${invoiceNo || 'All'}`, 14, 52);
    doc.text(`Change Type: ${changeType || 'All'}`, 14, 57);

    doc.autoTable({
      head: [
        [
          'Date',
          'Item Name',
          'Brand',
          'Category',
          'Change Type',
          'Invoice No',
          'Qty Change',
          'Final Stock'
        ]
      ],
      body: logs.map((log) => [
        new Date(log.date).toLocaleDateString(),
        log.name,
        log.brand,
        log.category,
        log.changeType,
        log.invoiceNo || '',
        log.quantityChange,
        log.finalStock
      ]),
      startY: 65,
      styles: { fontSize: 8 }
    });

    doc.save('stock_registry_report.pdf');
  };

  /* ───── UI ─────────────────────────────────────────────────── */
  return (
    <>
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-2">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
          {/* From / To date */}
          <div>
            <label className="block text-xs font-bold mb-1">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full border border-gray-300 rounded p-1 text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full border border-gray-300 rounded p-1 text-xs"
            />
          </div>

          {/* Item name */}
          <div>
            <label className="block text-xs font-bold mb-1">Item Name</label>
            <input
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              list="itemSuggestions"
              className="w-full border border-gray-300 rounded p-1 text-xs"
              placeholder="Enter Item Name"
            />
            <datalist id="itemSuggestions">
              {itemSuggestions.map((name, idx) => (
                <option key={idx} value={name} />
              ))}
            </datalist>
          </div>

          {/* Brand */}
          <div>
            <label className="block text-xs font-bold mb-1">Brand</label>
            <input
              type="text"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              list="brandSuggestions"
              className="w-full border border-gray-300 rounded p-1 text-xs"
              placeholder="Enter Brand"
            />
            <datalist id="brandSuggestions">
              {brandSuggestions.map((name, idx) => (
                <option key={idx} value={name} />
              ))}
            </datalist>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-bold mb-1">Category</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              list="categorySuggestions"
              className="w-full border border-gray-300 rounded p-1 text-xs"
              placeholder="Enter Category"
            />
            <datalist id="categorySuggestions">
              {categorySuggestions.map((name, idx) => (
                <option key={idx} value={name} />
              ))}
            </datalist>
          </div>

          {/* Invoice no */}
          <div>
            <label className="block text-xs font-bold mb-1">Invoice No</label>
            <input
              type="text"
              value={invoiceNo}
              onChange={(e) => setInvoiceNo(e.target.value)}
              list="invoiceSuggestions"
              className="w-full border border-gray-300 rounded p-1 text-xs"
              placeholder="Enter Invoice No"
            />
            <datalist id="invoiceSuggestions">
              {invoiceSuggestions.map((no, idx) => (
                <option key={idx} value={no} />
              ))}
            </datalist>
          </div>

          {/* Change type */}
          <div>
            <label className="block text-xs font-bold mb-1">Change Type</label>
            <select
              value={changeType}
              onChange={(e) => setChangeType(e.target.value)}
              className="w-full border border-gray-300 rounded p-1 text-xs"
            >
              <option value="">All</option>
              <option value="Purchase">Purchase</option>
              <option value="Sales (Billing)">Sales (Billing)</option>
              <option value="Return">Return</option>
              <option value="Damage">Damage</option>
              <option value="Opening Stock">Opening Stock</option>
            </select>
          </div>

          {/* Sort field & direction */}
          <div>
            <label className="block text-xs font-bold mb-1">Sort Field</label>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value)}
              className="w-full border border-gray-300 rounded p-1 text-xs"
            >
              <option value="date">Date</option>
              <option value="name">Item Name</option>
              <option value="brand">Brand</option>
              <option value="category">Category</option>
              <option value="quantityChange">Quantity Change</option>
            </select>
          </div>
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

      {/* Content */}
      {loading ? (
        <Skeleton count={5} />
      ) : (
        <>
          {error && (
            <p className="text-red-500 text-center mb-2 text-xs">{error}</p>
          )}

          {logs.length === 0 ? (
            <p className="text-center text-gray-500 text-xs">
              No stock logs found for the selected criteria.
            </p>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block">
                <table className="w-full text-xs text-gray-500 bg-white shadow-md rounded-lg overflow-hidden">
                  <thead className="bg-red-600 text-xs text-white">
                    <tr>
                      <th className="px-2 py-2 text-left">Date</th>
                      <th className="px-2 py-2">Item Id</th>
                      <th className="px-2 py-2">Item Name</th>
                      <th className="px-2 py-2">Brand</th>
                      <th className="px-2 py-2">Category</th>
                      <th className="px-2 py-2">Change Type</th>
                      <th className="px-2 py-2">Updated By</th>
                      <th className="px-2 py-2">Invoice No</th>
                      <th className="px-2 py-2">Qty Change</th>
                      <th className="px-2 py-2">Final Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log, idx) => (
                      <tr key={idx} className="hover:bg-gray-100 divide-x divide-y">
                        <td className="px-2 py-1 text-center">
                          {new Date(log.date).toLocaleString('en-IN', {
                            timeZone: 'Asia/Kolkata'
                          })}
                        </td>
                        <td className="px-2 py-2">{log.itemId}</td>
                        <td className="px-2 py-2">{log.name}</td>
                        <td className="px-2 py-2">{log.brand}</td>
                        <td className="px-2 py-2">{log.category}</td>
                        <td className="px-2 py-2">{log.changeType}</td>
                        <td className="px-2 py-2">{log.updatedBy}</td>
                        <td className="px-2 py-2">{log.invoiceNo || ''}</td>
                        <td
                          className={`px-3 py-2 font-bold ${
                            log.quantityChange > 0
                              ? 'text-green-600'
                              : log.quantityChange < 0
                              ? 'text-red-600'
                              : ''
                          }`}
                        >
                          {log.quantityChange > 0
                            ? `+${log.quantityChange}`
                            : log.quantityChange}
                        </td>
                        <td className="px-2 py-2 font-bold">
                          {log.finalStock}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden">
                {logs.map((log, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-lg shadow-md p-2 mb-2"
                  >
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-bold text-red-600">
                        {log.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(log.date).toLocaleString('en-IN', {
                          timeZone: 'Asia/Kolkata'
                        })}
                      </p>
                    </div>
                    <p className="text-gray-600 text-xs mt-1">
                      Brand: {log.brand}
                    </p>
                    <p className="text-gray-600 text-xs mt-1">
                      Category: {log.category}
                    </p>
                    <p className="text-gray-600 text-xs mt-1">
                      Change Type: {log.changeType}
                    </p>
                    <p className="text-gray-600 text-xs mt-1">
                      Invoice No: {log.invoiceNo || 'N/A'}
                    </p>
                    <div className="flex justify-between mt-2">
                      <p
                        className={`text-sm font-bold ${
                          log.quantityChange > 0
                            ? 'text-green-600'
                            : log.quantityChange < 0
                            ? 'text-red-600'
                            : ''
                        }`}
                      >
                        Qty:{' '}
                        {log.quantityChange > 0
                          ? `+${log.quantityChange}`
                          : log.quantityChange}
                      </p>
                      <p className="text-gray-600 text-xs font-bold">
                        Final Stock: {log.finalStock}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex justify-between items-center mt-2">
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
    </>
  );
};

export default StockRegistry;
