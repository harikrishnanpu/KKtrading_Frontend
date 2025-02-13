// PurchaseReport.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import useAuth from 'hooks/useAuth';

const PurchaseReport = () => {
  const navigate = useNavigate();
  const { user: userInfo } = useAuth();

  // State for all purchases from API
  const [purchases, setPurchases] = useState([]);
  // Filtered or flattened data for display
  const [filteredData, setFilteredData] = useState([]);

  // UI states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Drawer/Sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Filters
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sellerName, setSellerName] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [itemName, setItemName] = useState('');
  const [amountThreshold, setAmountThreshold] = useState('');

  // Sorting
  const [sortField, setSortField] = useState('totals.totalPurchaseAmount');
  const [sortDirection, setSortDirection] = useState('asc');

  // Report type
  const [isItemReport, setIsItemReport] = useState(false);

  // Autocomplete suggestions
  const [sellerSuggestions, setSellerSuggestions] = useState([]);
  const [invoiceSuggestions, setInvoiceSuggestions] = useState([]);
  const [itemSuggestions, setItemSuggestions] = useState([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Computed total amount
  const [totalAmount, setTotalAmount] = useState(0);

  // Fetch purchase data from server
  const fetchPurchases = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/api/purchases/sort/purchase-report/');
      setPurchases(response.data);
    } catch (err) {
      setError('Failed to fetch purchases.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, []);

  // Flattened list of items for Item Report
  const getItemsList = useMemo(() => {
    return purchases.flatMap((purchase) =>
      purchase.items.map((item) => ({
        purchaseId: purchase.purchaseId,
        invoiceNo: purchase.invoiceNo,
        invoiceDate: purchase.invoiceDate,
        sellerName: purchase.sellerName,
        sellerAddress: purchase.sellerAddress || '-',
        itemName: item.name,
        quantity: item.quantity,
        quantityInNumbers: item.quantityInNumbers,
        sUnit: item.sUnit,
        psRatio: item.psRatio,
        length: item.length,
        breadth: item.breadth,
        actLength: item.actLength,
        actBreadth: item.actBreadth,
        size: item.size,
        pUnit: item.pUnit,
        cashPartPrice: item.cashPartPrice,
        billPartPrice: item.billPartPrice,
        cashPartPriceInNumbers: item.cashPartPriceInNumbers,
        billPartPriceInNumbers: item.billPartPriceInNumbers,
        allocatedOtherExpense: item.allocatedOtherExpense,
        totalPriceInNumbers: item.totalPriceInNumbers,
        gstPercent: item.gstPercent,
      }))
    );
  }, [purchases]);

  // Helper to get nested field value for sorting
  const getFieldValue = (obj, field) => {
    return field.split('.').reduce((o, i) => (o ? o[i] : null), obj);
  };

  // Filter and sort data based on states
  const filterAndSortData = () => {
    // Decide which dataset to use
    let data = isItemReport ? getItemsList : purchases;

    // Filter by date range
    if (fromDate) {
      const fromTime = new Date(fromDate).setHours(0, 0, 0, 0);
      data = data.filter((entry) => {
        const entryTime = new Date(entry.invoiceDate).setHours(0, 0, 0, 0);
        return entryTime >= fromTime;
      });
    }
    if (toDate) {
      const toTime = new Date(toDate).setHours(0, 0, 0, 0);
      data = data.filter((entry) => {
        const entryTime = new Date(entry.invoiceDate).setHours(0, 0, 0, 0);
        return entryTime <= toTime;
      });
    }

    // Filter by seller name
    if (sellerName.trim()) {
      data = data.filter((entry) =>
        entry.sellerName.toLowerCase().includes(sellerName.toLowerCase())
      );
    }

    // Filter by invoice number
    if (invoiceNo.trim()) {
      data = data.filter((entry) =>
        entry.invoiceNo.toLowerCase().includes(invoiceNo.toLowerCase())
      );
    }

    // Filter by item name (only if item report)
    if (isItemReport && itemName.trim()) {
      data = data.filter((entry) =>
        entry.itemName.toLowerCase().includes(itemName.toLowerCase())
      );
    }

    // Filter by amount threshold
    if (amountThreshold.trim()) {
      const threshold = parseFloat(amountThreshold) || 0;
      if (isItemReport) {
        data = data.filter(
          (entry) => (entry.totalPriceInNumbers || 0) >= threshold
        );
      } else {
        data = data.filter(
          (entry) => (entry.totals?.totalPurchaseAmount || 0) >= threshold
        );
      }
    }

    // Sort data
    if (sortField) {
      data.sort((a, b) => {
        const fieldA = getFieldValue(a, sortField);
        const fieldB = getFieldValue(b, sortField);
        if (sortDirection === 'asc') {
          return fieldA < fieldB ? -1 : fieldA > fieldB ? 1 : 0;
        } else {
          return fieldA > fieldB ? -1 : fieldA < fieldB ? 1 : 0;
        }
      });
    }

    setFilteredData(data);
    setCurrentPage(1);
  };

  // Run filterAndSortData whenever relevant states change
  useEffect(() => {
    filterAndSortData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    fromDate,
    toDate,
    sellerName,
    invoiceNo,
    itemName,
    amountThreshold,
    sortField,
    sortDirection,
    purchases,
    isItemReport,
  ]);

  // Compute total amount
  useEffect(() => {
    let total = 0;
    if (isItemReport) {
      total = filteredData.reduce(
        (sum, item) => sum + (item.totalPriceInNumbers || 0),
        0
      );
    } else {
      total = filteredData.reduce(
        (sum, purchase) => sum + (purchase.totals?.totalPurchaseAmount || 0),
        0
      );
    }
    setTotalAmount(total);
  }, [filteredData, isItemReport]);

  // Autocomplete suggestions
  useEffect(() => {
    const sellerNames = [...new Set(purchases.map((p) => p.sellerName))];
    setSellerSuggestions(sellerNames);

    const invoiceNumbers = [...new Set(purchases.map((p) => p.invoiceNo))];
    setInvoiceSuggestions(invoiceNumbers);

    const items = [
      ...new Set(purchases.flatMap((p) => p.items.map((i) => i.name))),
    ];
    setItemSuggestions(items);
  }, [purchases]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginateData = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Generate PDF
  const generatePDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'A4',
    });
    doc.setProperties({
      title: isItemReport ? 'Purchase Item Report' : 'Purchase Report',
      author: 'Your App',
      creator: 'Your App',
    });

    const title = isItemReport ? 'Purchase Item Report' : 'Purchase Report';
    doc.setFontSize(14);
    doc.text(title, 40, 40);

    doc.setFontSize(10);
    doc.text(`Date Range: ${fromDate || 'All'} to ${toDate || 'All'}`, 40, 60);
    doc.text(`Seller Name: ${sellerName || 'All'}`, 40, 75);
    doc.text(`Total Amount: Rs. ${totalAmount.toFixed(2)}`, 40, 90);

    let tableColumn = [];
    let tableRows = [];

    if (isItemReport) {
      tableColumn = [
        'Invoice No',
        'Date',
        'Seller Name',
        'Seller Addr',
        'Item Name',
        'Qty',
        'Qty#',
        'S Unit',
        'PS Ratio',
        'Len',
        'Brdth',
        'Act Len',
        'Act Brdth',
        'Size',
        'P Unit',
        'Cash Price',
        'Bill Price',
        'Cash#',
        'Bill#',
        'Other Exp',
        'Total#',
        'GST %',
      ];

      filteredData.forEach((item) => {
        tableRows.push([
          item.invoiceNo,
          new Date(item.invoiceDate).toLocaleDateString(),
          item.sellerName,
          item.sellerAddress,
          item.itemName,
          item.quantity,
          item.quantityInNumbers,
          item.sUnit || '-',
          item.psRatio !== undefined ? item.psRatio : '-',
          item.length !== undefined ? item.length : '-',
          item.breadth !== undefined ? item.breadth : '-',
          item.actLength !== undefined ? item.actLength : '-',
          item.actBreadth !== undefined ? item.actBreadth : '-',
          item.size || '-',
          item.pUnit || '-',
          `Rs. ${item.cashPartPrice?.toFixed(2) || '0.00'}`,
          `Rs. ${item.billPartPrice?.toFixed(2) || '0.00'}`,
          item.cashPartPriceInNumbers ?? '-',
          item.billPartPriceInNumbers ?? '-',
          `Rs. ${item.allocatedOtherExpense?.toFixed(2) || '0.00'}`,
          item.totalPriceInNumbers ?? '-',
          item.gstPercent !== undefined ? `${item.gstPercent}%` : '-',
        ]);
      });
    } else {
      tableColumn = [
        'Invoice No',
        'Date',
        'Seller Name',
        'Seller Addr',
        'Total Amt',
        'Grand Total Amt',
      ];

      filteredData.forEach((purchase) => {
        tableRows.push([
          purchase.invoiceNo,
          new Date(purchase.invoiceDate).toLocaleDateString(),
          purchase.sellerName,
          purchase.sellerAddress || '-',
          `Rs. ${purchase.totals?.totalPurchaseAmount?.toFixed(2) || '0.00'}`,
          `Rs. ${
            purchase.totals?.grandTotalPurchaseAmount?.toFixed(2) || '0.00'
          }`,
        ]);
      });
    }

    doc.autoTable({
      startY: 110,
      head: [tableColumn],
      body: tableRows,
      styles: { fontSize: 7 },
      headStyles: { fillColor: [220, 20, 60] }, // Crimson red
      margin: { left: 40, right: 40 },
      didDrawPage: (data) => {
        const pageCount = doc.internal.getNumberOfPages();
        const currentPage = doc.internal.getCurrentPageInfo().pageNumber;
        doc.setFontSize(8);
        doc.text(
          `Page ${currentPage} of ${pageCount}`,
          data.settings.margin.left + 180,
          doc.internal.pageSize.height - 10
        );
      },
    });

    const fileName = isItemReport
      ? 'purchase_item_report.pdf'
      : 'purchase_report.pdf';
    doc.save(fileName);
  };

  // Export to CSV
  const exportToCSV = () => {
    let headers = [];
    const rows = [];

    if (isItemReport) {
      headers = [
        'Invoice No',
        'Date',
        'Seller Name',
        'Seller Addr',
        'Item Name',
        'Quantity',
        'Quantity In Numbers',
        'S Unit',
        'PS Ratio',
        'Length',
        'Breadth',
        'Act Length',
        'Act Breadth',
        'Size',
        'P Unit',
        'Cash Part Price',
        'Bill Part Price',
        'Cash Part#',
        'Bill Part#',
        'Allocated Other Expense',
        'Total Price#',
        'GST %',
      ];

      filteredData.forEach((item) => {
        rows.push([
          item.invoiceNo,
          new Date(item.invoiceDate).toLocaleDateString(),
          item.sellerName,
          item.sellerAddress,
          item.itemName,
          item.quantity,
          item.quantityInNumbers,
          item.sUnit || '-',
          item.psRatio !== undefined ? item.psRatio : '-',
          item.length !== undefined ? item.length : '-',
          item.breadth !== undefined ? item.breadth : '-',
          item.actLength !== undefined ? item.actLength : '-',
          item.actBreadth !== undefined ? item.actBreadth : '-',
          item.size || '-',
          item.pUnit || '-',
          item.cashPartPrice?.toFixed(2) || '0.00',
          item.billPartPrice?.toFixed(2) || '0.00',
          item.cashPartPriceInNumbers ?? '-',
          item.billPartPriceInNumbers ?? '-',
          item.allocatedOtherExpense?.toFixed(2) || '0.00',
          item.totalPriceInNumbers ?? '-',
          item.gstPercent !== undefined ? `${item.gstPercent}%` : '-',
        ]);
      });
    } else {
      headers = [
        'Invoice No',
        'Date',
        'Seller Name',
        'Seller Addr',
        'Total Purchase Amount',
        'Grand Total Amount',
      ];

      filteredData.forEach((purchase) => {
        rows.push([
          purchase.invoiceNo,
          new Date(purchase.invoiceDate).toLocaleDateString(),
          purchase.sellerName,
          purchase.sellerAddress || '-',
          purchase.totals?.totalPurchaseAmount?.toFixed(2) || '0.00',
          purchase.totals?.grandTotalPurchaseAmount?.toFixed(2) || '0.00',
        ]);
      });
    }

    // Build CSV content
    const csvContent = [
      headers.join(','), // header row
      ...rows.map((r) =>
        r
          .map((val) =>
            typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val
          )
          .join(',')
      ),
    ].join('\n');

    // Download as CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      isItemReport ? 'purchase_item_report.csv' : 'purchase_report.csv'
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Reset all filters
  const resetFilters = () => {
    setFromDate('');
    setToDate('');
    setSellerName('');
    setInvoiceNo('');
    setItemName('');
    setAmountThreshold('');
    setSortField('totals.totalPurchaseAmount');
    setSortDirection('asc');
    setIsItemReport(false);
    setCurrentPage(1);
  };

  // Renders the filter sidebar content
  const renderFilterSidebar = () => (
    <div className="bg-white w-64 min-h-full border-r p-3 flex flex-col">
      {/* Toggle between Purchase or Item Report */}
      <div className="flex items-center mb-2">
        <input
          type="checkbox"
          checked={isItemReport}
          onChange={(e) => setIsItemReport(e.target.checked)}
          className="mr-2"
        />
        <label className="text-sm font-bold text-gray-700">
          Purchase Item Report
        </label>
      </div>

      {/* From Date */}
      <div className="mb-2">
        <label className="block text-xs font-bold mb-1">From Date</label>
        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          className="w-full border border-gray-300 rounded p-1 text-xs"
        />
      </div>

      {/* To Date */}
      <div className="mb-2">
        <label className="block text-xs font-bold mb-1">To Date</label>
        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          className="w-full border border-gray-300 rounded p-1 text-xs"
        />
      </div>

      {/* Seller Name */}
      <div className="mb-2">
        <label className="block text-xs font-bold mb-1">Seller Name</label>
        <input
          type="text"
          value={sellerName}
          onChange={(e) => setSellerName(e.target.value)}
          list="sellerSuggestions"
          className="w-full border border-gray-300 rounded p-1 text-xs"
          placeholder="Enter Seller Name"
        />
        <datalist id="sellerSuggestions">
          {sellerSuggestions.map((name, i) => (
            <option key={i} value={name} />
          ))}
        </datalist>
      </div>

      {/* Invoice No */}
      <div className="mb-2">
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
          {invoiceSuggestions.map((no, i) => (
            <option key={i} value={no} />
          ))}
        </datalist>
      </div>

      {/* Item Name (only if Item Report) */}
      {isItemReport && (
        <div className="mb-2">
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
            {itemSuggestions.map((name, i) => (
              <option key={i} value={name} />
            ))}
          </datalist>
        </div>
      )}

      {/* Amount Threshold */}
      <div className="mb-2">
        <label className="block text-xs font-bold mb-1">Amount ≥</label>
        <input
          type="number"
          value={amountThreshold}
          onChange={(e) => setAmountThreshold(e.target.value)}
          className="w-full border border-gray-300 rounded p-1 text-xs"
          min="0"
          placeholder="Enter Amount"
        />
      </div>

      {/* Sort Field */}
      <div className="mb-2">
        <label className="block text-xs font-bold mb-1">Sort Field</label>
        <select
          value={sortField}
          onChange={(e) => setSortField(e.target.value)}
          className="w-full border border-gray-300 rounded p-1 text-xs"
        >
          {isItemReport ? (
            <>
              <option value="itemName">Item Name</option>
              <option value="sellerName">Seller Name</option>
              <option value="invoiceDate">Invoice Date</option>
              <option value="totalPriceInNumbers">Total Price In Numbers</option>
            </>
          ) : (
            <>
              <option value="totals.totalPurchaseAmount">
                Total Purchase Amount
              </option>
              <option value="totals.grandTotalPurchaseAmount">
                Grand Total Purchase Amount
              </option>
              <option value="invoiceDate">Invoice Date</option>
              <option value="sellerName">Seller Name</option>
            </>
          )}
        </select>
      </div>

      {/* Sort Direction */}
      <div className="mb-4">
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

      {/* Action Buttons */}
      <div className="flex flex-col space-y-1">
        <button
          onClick={generatePDF}
          className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 rounded text-xs"
        >
          Generate PDF
        </button>
        <button
          onClick={exportToCSV}
          className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 rounded text-xs"
        >
          Export CSV
        </button>
        <button
          onClick={resetFilters}
          className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 rounded text-xs"
        >
          Reset Filters
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-full w-full">
      {/* Sidebar for larger screens (always visible on md+) */}
      <div className="hidden md:flex">{renderFilterSidebar()}</div>

      {/* Drawer overlay for mobile screens */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      {/* Actual drawer content for mobile screens */}
      <div
        className={`fixed top-0 left-0 h-full z-50 bg-white border-r transform transition-transform md:hidden ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ width: '16rem' }}
      >
        {renderFilterSidebar()}
      </div>

      {/* Main Content */}
      <div className="flex-1 p-2">
        {/* Button to open sidebar on mobile */}
        <div className="md:hidden mb-2">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-2 rounded text-xs"
          >
            Open Filters
          </button>
        </div>

        {/* Total amount */}
        <div className="bg-white p-2 rounded-lg shadow-md mb-2">
          <p className="text-sm font-bold text-gray-700">
            {isItemReport ? 'Purchase Item Report' : 'Purchase Report'}
          </p>
          <p className="text-xs text-gray-500">
            Total Amount: Rs. {totalAmount.toFixed(2)}
          </p>
        </div>

        {/* Loading, Error, No Data */}
        {loading && (
          <p className="text-center text-gray-500 text-xs">Loading...</p>
        )}
        {!loading && error && (
          <p className="text-red-500 text-center text-xs">{error}</p>
        )}
        {!loading && !error && filteredData.length === 0 && (
          <p className="text-center text-gray-500 text-xs">
            No purchases found for the selected criteria.
          </p>
        )}

        {/* Table & Cards (only render if data exists) */}
        {!loading && !error && filteredData.length > 0 && (
          <>
            {/* Responsive scroll container for the table */}
            <div className="hidden md:block overflow-auto bg-white rounded-lg shadow-md">
              <table className="min-w-full text-xs text-gray-500">
                <thead className="bg-red-600 text-white">
                  <tr>
                    {isItemReport ? (
                      <>
                        <th className="px-2 py-1 text-left">Invoice No</th>
                        <th className="px-2 py-1">Invoice Date</th>
                        <th className="px-2 py-1">Seller Name</th>
                        <th className="px-2 py-1">Seller Address</th>
                        <th className="px-2 py-1">Item Name</th>
                        <th className="px-2 py-1">Quantity</th>
                        <th className="px-2 py-1">Qty In Numbers</th>
                        <th className="px-2 py-1">S Unit</th>
                        <th className="px-2 py-1">PS Ratio</th>
                        <th className="px-2 py-1">Length</th>
                        <th className="px-2 py-1">Breadth</th>
                        <th className="px-2 py-1">Act Length</th>
                        <th className="px-2 py-1">Act Breadth</th>
                        <th className="px-2 py-1">Size</th>
                        <th className="px-2 py-1">P Unit</th>
                        <th className="px-2 py-1">Cash Part Price</th>
                        <th className="px-2 py-1">Bill Part Price</th>
                        <th className="px-2 py-1">
                          Cash Part Price In Numbers
                        </th>
                        <th className="px-2 py-1">
                          Bill Part Price In Numbers
                        </th>
                        <th className="px-2 py-1">Allocated Other Expense</th>
                        <th className="px-2 py-1">Total Price In Numbers</th>
                        <th className="px-2 py-1">GST Percent</th>
                      </>
                    ) : (
                      <>
                        <th className="px-2 py-1 text-left">Invoice No</th>
                        <th className="px-2 py-1">Invoice Date</th>
                        <th className="px-2 py-1">Seller Name</th>
                        <th className="px-2 py-1">Seller Address</th>
                        <th className="px-2 py-1">Total Purchase Amount</th>
                        <th className="px-2 py-1">
                          Grand Total Purchase Amount
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {paginateData().map((entry, idx) => (
                    <tr
                      key={
                        isItemReport
                          ? `${entry.purchaseId}-item-${idx}`
                          : `${entry.purchaseId}-purchase-${idx}`
                      }
                      className="border-b hover:bg-gray-50"
                    >
                      {isItemReport ? (
                        <>
                          <td className="px-2 py-1">{entry.invoiceNo}</td>
                          <td className="px-2 py-1">
                            {new Date(entry.invoiceDate).toLocaleDateString()}
                          </td>
                          <td className="px-2 py-1">{entry.sellerName}</td>
                          <td className="px-2 py-1">{entry.sellerAddress}</td>
                          <td className="px-2 py-1">{entry.itemName}</td>
                          <td className="px-2 py-1">{entry.quantity}</td>
                          <td className="px-2 py-1">
                            {entry.quantityInNumbers}
                          </td>
                          <td className="px-2 py-1">
                            {entry.sUnit || '-'}
                          </td>
                          <td className="px-2 py-1">
                            {entry.psRatio !== undefined ? entry.psRatio : '-'}
                          </td>
                          <td className="px-2 py-1">
                            {entry.length !== undefined ? entry.length : '-'}
                          </td>
                          <td className="px-2 py-1">
                            {entry.breadth !== undefined ? entry.breadth : '-'}
                          </td>
                          <td className="px-2 py-1">
                            {entry.actLength !== undefined
                              ? entry.actLength
                              : '-'}
                          </td>
                          <td className="px-2 py-1">
                            {entry.actBreadth !== undefined
                              ? entry.actBreadth
                              : '-'}
                          </td>
                          <td className="px-2 py-1">{entry.size || '-'}</td>
                          <td className="px-2 py-1">{entry.pUnit || '-'}</td>
                          <td className="px-2 py-1 text-right">
                            Rs. {entry.cashPartPrice?.toFixed(2) || '0.00'}
                          </td>
                          <td className="px-2 py-1 text-right">
                            Rs. {entry.billPartPrice?.toFixed(2) || '0.00'}
                          </td>
                          <td className="px-2 py-1">
                            {entry.cashPartPriceInNumbers ?? '-'}
                          </td>
                          <td className="px-2 py-1">
                            {entry.billPartPriceInNumbers ?? '-'}
                          </td>
                          <td className="px-2 py-1 text-right">
                            Rs. {entry.allocatedOtherExpense?.toFixed(2) || '0.00'}
                          </td>
                          <td className="px-2 py-1">
                            {entry.totalPriceInNumbers ?? '-'}
                          </td>
                          <td className="px-2 py-1 text-center">
                            {entry.gstPercent !== undefined
                              ? `${entry.gstPercent}%`
                              : '-'}
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-2 py-1">{entry.invoiceNo}</td>
                          <td className="px-2 py-1">
                            {new Date(entry.invoiceDate).toLocaleDateString()}
                          </td>
                          <td className="px-2 py-1">{entry.sellerName}</td>
                          <td className="px-2 py-1">
                            {entry.sellerAddress || '-'}
                          </td>
                          <td className="px-2 py-1 text-right">
                            Rs. {entry.totals?.totalPurchaseAmount?.toFixed(2) || '0.00'}
                          </td>
                          <td className="px-2 py-1 text-right">
                            Rs. {entry.totals?.grandTotalPurchaseAmount?.toFixed(2) || '0.00'}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Cards for mobile */}
            <div className="md:hidden space-y-2">
              {paginateData().map((entry, index) => (
                <div
                  key={
                    isItemReport
                      ? `${entry.purchaseId}-item-m-${index}`
                      : `${entry.purchaseId}-purchase-m-${index}`
                  }
                  className="bg-white rounded-lg shadow-md p-2"
                >
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-bold text-red-600">
                      Invoice No: {entry.invoiceNo}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(entry.invoiceDate).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="text-xs text-gray-600">
                    Seller: {entry.sellerName}
                  </p>
                  <p className="text-xs text-gray-600">
                    Seller Address: {entry.sellerAddress || '-'}
                  </p>

                  {isItemReport && (
                    <>
                      <p className="text-xs text-gray-600 mt-1">
                        Item: {entry.itemName}
                      </p>
                      <p className="text-xs text-gray-600">
                        Quantity: {entry.quantity}
                      </p>
                      <p className="text-xs text-gray-600">
                        Quantity#: {entry.quantityInNumbers}
                      </p>
                      <p className="text-xs text-gray-600">
                        S Unit: {entry.sUnit || '-'}
                      </p>
                      <p className="text-xs text-gray-600">
                        PS Ratio:{' '}
                        {entry.psRatio !== undefined ? entry.psRatio : '-'}
                      </p>
                      <p className="text-xs text-gray-600">
                        Length:{' '}
                        {entry.length !== undefined ? entry.length : '-'}
                      </p>
                      <p className="text-xs text-gray-600">
                        Breadth:{' '}
                        {entry.breadth !== undefined ? entry.breadth : '-'}
                      </p>
                      <p className="text-xs text-gray-600">
                        Act Length:{' '}
                        {entry.actLength !== undefined
                          ? entry.actLength
                          : '-'}
                      </p>
                      <p className="text-xs text-gray-600">
                        Act Breadth:{' '}
                        {entry.actBreadth !== undefined
                          ? entry.actBreadth
                          : '-'}
                      </p>
                      <p className="text-xs text-gray-600">
                        Size: {entry.size || '-'}
                      </p>
                      <p className="text-xs text-gray-600">
                        P Unit: {entry.pUnit || '-'}
                      </p>
                      <p className="text-xs text-gray-600">
                        Cash Part Price: Rs.{' '}
                        {entry.cashPartPrice?.toFixed(2) || '0.00'}
                      </p>
                      <p className="text-xs text-gray-600">
                        Bill Part Price: Rs.{' '}
                        {entry.billPartPrice?.toFixed(2) || '0.00'}
                      </p>
                      <p className="text-xs text-gray-600">
                        Cash Part#: {entry.cashPartPriceInNumbers ?? '-'}
                      </p>
                      <p className="text-xs text-gray-600">
                        Bill Part#: {entry.billPartPriceInNumbers ?? '-'}
                      </p>
                      <p className="text-xs text-gray-600">
                        Allocated Other Expense: Rs.{' '}
                        {entry.allocatedOtherExpense?.toFixed(2) || '0.00'}
                      </p>
                    </>
                  )}

                  <div className="flex justify-between mt-2">
                    {isItemReport ? (
                      <>
                        <p className="text-xs text-gray-600 font-bold">
                          Total#: {entry.totalPriceInNumbers ?? '-'}
                        </p>
                        <p className="text-xs text-gray-600 font-bold">
                          GST: {entry.gstPercent !== undefined
                            ? `${entry.gstPercent}%`
                            : '-'}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-xs text-gray-600 font-bold">
                          Total: Rs.{' '}
                          {entry.totals?.totalPurchaseAmount?.toFixed(2) ||
                            '0.00'}
                        </p>
                        <p className="text-xs text-gray-600 font-bold">
                          Grand Total: Rs.{' '}
                          {entry.totals?.grandTotalPurchaseAmount?.toFixed(2) ||
                            '0.00'}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-3">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
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
                onClick={() => handlePageChange(currentPage + 1)}
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
      </div>
    </div>
  );
};

export default PurchaseReport;
