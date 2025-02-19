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

  // States for purchases and filters
  const [purchases, setPurchases] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Sidebar (filter panel) state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Filter values
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sellerName, setSellerName] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [itemName, setItemName] = useState('');
  const [amountThreshold, setAmountThreshold] = useState('');

  // Sorting options
  const [sortField, setSortField] = useState('totals.totalPurchaseAmount');
  const [sortDirection, setSortDirection] = useState('asc');

  // Report type: Purchase vs. Purchase Item Report
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

  // Helper to format numbers with two decimals
  const formatNumber = (value) => {
    return typeof value === 'number' && !isNaN(value)
      ? value.toFixed(2)
      : value !== undefined && value !== null
      ? value
      : '-';
  };

  // Fetch purchase data
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

  // Create flattened items list for item report
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

  // Helper: Get nested field value for sorting
  const getFieldValue = (obj, field) => {
    return field.split('.').reduce((o, i) => (o ? o[i] : null), obj);
  };

  // Filter and sort data based on filters and sorting options
  const filterAndSortData = () => {
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

    // Filter by Seller Name and Invoice No
    if (sellerName.trim()) {
      data = data.filter((entry) =>
        entry.sellerName.toLowerCase().includes(sellerName.toLowerCase())
      );
    }
    if (invoiceNo.trim()) {
      data = data.filter((entry) =>
        entry.invoiceNo.toLowerCase().includes(invoiceNo.toLowerCase())
      );
    }
    // Filter by Item Name (only if item report)
    if (isItemReport && itemName.trim()) {
      data = data.filter((entry) =>
        entry.itemName.toLowerCase().includes(itemName.toLowerCase())
      );
    }
    // Filter by Amount Threshold
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

    // Sorting
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

  // Compute total amount based on report type
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

  // Autocomplete suggestions for filters
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

  // Pagination helpers
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

  // Generate PDF Report
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
    doc.text(
      `Date Range: ${
        fromDate ? new Date(fromDate).toLocaleDateString() : 'All'
      } to ${toDate ? new Date(toDate).toLocaleDateString() : 'All'}`,
      40,
      60
    );
    doc.text(`Seller Name: ${sellerName || 'All'}`, 40, 75);
    doc.text(`Total Amount: Rs. ${formatNumber(totalAmount)}`, 40, 90);

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
          formatNumber(item.quantity),
          formatNumber(item.quantityInNumbers),
          item.sUnit || '-',
          item.psRatio !== undefined ? formatNumber(item.psRatio) : '-',
          item.length !== undefined ? formatNumber(item.length) : '-',
          item.breadth !== undefined ? formatNumber(item.breadth) : '-',
          item.actLength !== undefined ? formatNumber(item.actLength) : '-',
          item.actBreadth !== undefined ? formatNumber(item.actBreadth) : '-',
          item.size || '-',
          item.pUnit || '-',
          `Rs. ${formatNumber(item.cashPartPrice)}`,
          `Rs. ${formatNumber(item.billPartPrice)}`,
          item.cashPartPriceInNumbers !== undefined
            ? formatNumber(item.cashPartPriceInNumbers)
            : '-',
          item.billPartPriceInNumbers !== undefined
            ? formatNumber(item.billPartPriceInNumbers)
            : '-',
          `Rs. ${
            item.allocatedOtherExpense !== undefined
              ? formatNumber(item.allocatedOtherExpense)
              : '0.00'
          }`,
          item.totalPriceInNumbers !== undefined
            ? formatNumber(item.totalPriceInNumbers)
            : '-',
          item.gstPercent !== undefined ? `${formatNumber(item.gstPercent)}%` : '-',
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
          `Rs. ${
            purchase.totals?.totalPurchaseAmount !== undefined
              ? formatNumber(purchase.totals.totalPurchaseAmount)
              : '0.00'
          }`,
          `Rs. ${
            purchase.totals?.grandTotalPurchaseAmount !== undefined
              ? formatNumber(purchase.totals.grandTotalPurchaseAmount)
              : '0.00'
          }`,
        ]);
      });
    }

    doc.autoTable({
      startY: 110,
      head: [tableColumn],
      body: tableRows,
      styles: { fontSize: 7 },
      headStyles: { fillColor: [220, 20, 60] },
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

  // Export report as CSV
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
          formatNumber(item.quantity),
          formatNumber(item.quantityInNumbers),
          item.sUnit || '-',
          item.psRatio !== undefined ? formatNumber(item.psRatio) : '-',
          item.length !== undefined ? formatNumber(item.length) : '-',
          item.breadth !== undefined ? formatNumber(item.breadth) : '-',
          item.actLength !== undefined ? formatNumber(item.actLength) : '-',
          item.actBreadth !== undefined ? formatNumber(item.actBreadth) : '-',
          item.size || '-',
          item.pUnit || '-',
          formatNumber(item.cashPartPrice),
          formatNumber(item.billPartPrice),
          item.cashPartPriceInNumbers !== undefined
            ? formatNumber(item.cashPartPriceInNumbers)
            : '-',
          item.billPartPriceInNumbers !== undefined
            ? formatNumber(item.billPartPriceInNumbers)
            : '-',
          formatNumber(item.allocatedOtherExpense),
          item.totalPriceInNumbers !== undefined
            ? formatNumber(item.totalPriceInNumbers)
            : '-',
          item.gstPercent !== undefined ? `${formatNumber(item.gstPercent)}%` : '-',
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
          purchase.totals?.totalPurchaseAmount !== undefined
            ? formatNumber(purchase.totals.totalPurchaseAmount)
            : '0.00',
          purchase.totals?.grandTotalPurchaseAmount !== undefined
            ? formatNumber(purchase.totals.grandTotalPurchaseAmount)
            : '0.00',
        ]);
      });
    }

    const csvContent = [
      headers.join(','),
      ...rows.map((r) =>
        r
          .map((val) =>
            typeof val === 'string'
              ? `"${val.replace(/"/g, '""')}"`
              : val
          )
          .join(',')
      ),
    ].join('\n');

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

  // Render Filter Sidebar (using Tailwind only)
  const renderFilterSidebar = () => (
    <div className="bg-white h-full p-6 space-y-6 border-r">
      <h2 className="text-lg font-semibold text-gray-800 border-b pb-2">
        Filters
      </h2>

      {/* Report Type Toggle */}
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="itemReportToggle"
          checked={isItemReport}
          onChange={(e) => setIsItemReport(e.target.checked)}
          className="form-checkbox h-5 w-5 text-red-500"
        />
        <label htmlFor="itemReportToggle" className="text-sm font-medium text-gray-700">
          Purchase Item Report
        </label>
      </div>

      {/* Date Range */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">From Date</label>
        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          className="w-full rounded border-gray-300 focus:ring-red-500 focus:border-red-500 text-sm p-2"
        />
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">To Date</label>
        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          className="w-full rounded border-gray-300 focus:ring-red-500 focus:border-red-500 text-sm p-2"
        />
      </div>

      {/* Seller Name */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Seller Name</label>
        <input
          type="text"
          value={sellerName}
          onChange={(e) => setSellerName(e.target.value)}
          list="sellerSuggestions"
          placeholder="Enter Seller Name"
          className="w-full rounded border-gray-300 focus:ring-red-500 focus:border-red-500 text-sm p-2"
        />
        <datalist id="sellerSuggestions">
          {sellerSuggestions.map((name, idx) => (
            <option key={idx} value={name} />
          ))}
        </datalist>
      </div>

      {/* Invoice No */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Invoice No</label>
        <input
          type="text"
          value={invoiceNo}
          onChange={(e) => setInvoiceNo(e.target.value)}
          list="invoiceSuggestions"
          placeholder="Enter Invoice No"
          className="w-full rounded border-gray-300 focus:ring-red-500 focus:border-red-500 text-sm p-2"
        />
        <datalist id="invoiceSuggestions">
          {invoiceSuggestions.map((no, idx) => (
            <option key={idx} value={no} />
          ))}
        </datalist>
      </div>

      {/* Item Name (if Item Report) */}
      {isItemReport && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Item Name</label>
          <input
            type="text"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            list="itemSuggestions"
            placeholder="Enter Item Name"
            className="w-full rounded border-gray-300 focus:ring-red-500 focus:border-red-500 text-sm p-2"
          />
          <datalist id="itemSuggestions">
            {itemSuggestions.map((name, idx) => (
              <option key={idx} value={name} />
            ))}
          </datalist>
        </div>
      )}

      {/* Amount Threshold */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Amount ≥</label>
        <input
          type="number"
          value={amountThreshold}
          onChange={(e) => setAmountThreshold(e.target.value)}
          placeholder="Enter Amount"
          min="0"
          className="w-full rounded border-gray-300 focus:ring-red-500 focus:border-red-500 text-sm p-2"
        />
      </div>

      {/* Sorting Options */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Sort Field</label>
        <select
          value={sortField}
          onChange={(e) => setSortField(e.target.value)}
          className="w-full rounded border-gray-300 focus:ring-red-500 focus:border-red-500 text-sm p-2"
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
              <option value="totals.totalPurchaseAmount">Total Purchase Amount</option>
              <option value="totals.grandTotalPurchaseAmount">Grand Total Purchase Amount</option>
              <option value="invoiceDate">Invoice Date</option>
              <option value="sellerName">Seller Name</option>
            </>
          )}
        </select>
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Sort Direction</label>
        <select
          value={sortDirection}
          onChange={(e) => setSortDirection(e.target.value)}
          className="w-full rounded border-gray-300 focus:ring-red-500 focus:border-red-500 text-sm p-2"
        >
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col space-y-3 pt-3 border-t">
        <button
          onClick={generatePDF}
          className="w-full bg-red-500 hover:bg-red-600 text-white text-sm font-medium py-2 rounded"
        >
          Generate PDF
        </button>
        <button
          onClick={exportToCSV}
          className="w-full bg-red-500 hover:bg-red-600 text-white text-sm font-medium py-2 rounded"
        >
          Export CSV
        </button>
        <button
          onClick={resetFilters}
          className="w-full bg-gray-500 hover:bg-gray-600 text-white text-sm font-medium py-2 rounded"
        >
          Reset Filters
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen max-w-lg flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block md:w-80 border-r">
        {renderFilterSidebar()}
      </aside>

      {/* Mobile Sidebar Drawer */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      <aside
        className={`fixed top-0 left-0 z-50 h-full bg-white shadow-md transform transition-transform md:hidden ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } w-72`}
      >
        {renderFilterSidebar()}
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6">
        {/* Mobile: Button to open filters */}
        <div className="md:hidden mb-4">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="bg-red-500 hover:bg-red-600 text-white text-sm font-medium py-2 px-4 rounded"
          >
            Open Filters
          </button>
        </div>

        {/* Header & Filter Summary */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">
            {isItemReport ? 'Purchase Item Report' : 'Purchase Report'}
          </h1>
          <p className="text-gray-600 mt-1">
            Total Amount: Rs. {formatNumber(totalAmount)}
          </p>
          <div className="mt-3 p-4 bg-white rounded shadow">
            <p className="text-sm text-gray-700">
              Date Range:{' '}
              {fromDate ? new Date(fromDate).toLocaleDateString() : 'All'} to{' '}
              {toDate ? new Date(toDate).toLocaleDateString() : 'All'}
            </p>
            <p className="text-sm text-gray-700">
              Seller: {sellerName || 'All'} | Invoice: {invoiceNo || 'All'}{' '}
              {isItemReport && `| Item: ${itemName || 'All'}`} | Amount:{' '}
              {amountThreshold || 'All'}
            </p>
          </div>
        </div>

        {/* Loading, Error, or No Data Message */}
        {loading && (
          <p className="text-center text-gray-500 text-sm">Loading...</p>
        )}
        {!loading && error && (
          <p className="text-center text-red-500 text-sm">{error}</p>
        )}
        {!loading && !error && filteredData.length === 0 && (
          <p className="text-center text-gray-500 text-sm">
            No purchases found for the selected criteria.
          </p>
        )}

        {/* Desktop Table */}
        {!loading && !error && filteredData.length > 0 && (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-max table-auto text-sm text-gray-600">
                <thead className="bg-red-600 text-white">
                  <tr>
                    {isItemReport ? (
                      <>
                        <th className="px-3 py-2 text-left">Invoice No</th>
                        <th className="px-3 py-2">Date</th>
                        <th className="px-3 py-2">Seller Name</th>
                        <th className="px-3 py-2">Seller Addr</th>
                        <th className="px-3 py-2">Item Name</th>
                        <th className="px-3 py-2">Qty</th>
                        <th className="px-3 py-2">Qty#</th>
                        <th className="px-3 py-2">S Unit</th>
                        <th className="px-3 py-2">PS Ratio</th>
                        <th className="px-3 py-2">Len</th>
                        <th className="px-3 py-2">Brdth</th>
                        <th className="px-3 py-2">Act Len</th>
                        <th className="px-3 py-2">Act Brdth</th>
                        <th className="px-3 py-2">Size</th>
                        <th className="px-3 py-2">P Unit</th>
                        <th className="px-3 py-2">Cash Price</th>
                        <th className="px-3 py-2">Bill Price</th>
                        <th className="px-3 py-2">Cash#</th>
                        <th className="px-3 py-2">Bill#</th>
                        <th className="px-3 py-2">Other Exp</th>
                        <th className="px-3 py-2">Total#</th>
                        <th className="px-3 py-2">GST %</th>
                      </>
                    ) : (
                      <>
                        <th className="px-3 py-2 text-left">Invoice No</th>
                        <th className="px-3 py-2">Date</th>
                        <th className="px-3 py-2">Seller Name</th>
                        <th className="px-3 py-2">Seller Addr</th>
                        <th className="px-3 py-2">Total Amt</th>
                        <th className="px-3 py-2">Grand Total Amt</th>
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
                          <td className="px-3 py-2">{entry.invoiceNo}</td>
                          <td className="px-3 py-2">
                            {new Date(entry.invoiceDate).toLocaleDateString()}
                          </td>
                          <td className="px-3 py-2">{entry.sellerName}</td>
                          <td className="px-3 py-2">{entry.sellerAddress}</td>
                          <td className="px-3 py-2">{entry.itemName}</td>
                          <td className="px-3 py-2">{formatNumber(entry.quantity)}</td>
                          <td className="px-3 py-2">{formatNumber(entry.quantityInNumbers)}</td>
                          <td className="px-3 py-2">{entry.sUnit || '-'}</td>
                          <td className="px-3 py-2">
                            {entry.psRatio !== undefined ? formatNumber(entry.psRatio) : '-'}
                          </td>
                          <td className="px-3 py-2">
                            {entry.length !== undefined ? formatNumber(entry.length) : '-'}
                          </td>
                          <td className="px-3 py-2">
                            {entry.breadth !== undefined ? formatNumber(entry.breadth) : '-'}
                          </td>
                          <td className="px-3 py-2">
                            {entry.actLength !== undefined ? formatNumber(entry.actLength) : '-'}
                          </td>
                          <td className="px-3 py-2">
                            {entry.actBreadth !== undefined ? formatNumber(entry.actBreadth) : '-'}
                          </td>
                          <td className="px-3 py-2">{entry.size || '-'}</td>
                          <td className="px-3 py-2">{entry.pUnit || '-'}</td>
                          <td className="px-3 py-2 text-right">
                            Rs. {formatNumber(entry.cashPartPrice)}
                          </td>
                          <td className="px-3 py-2 text-right">
                            Rs. {formatNumber(entry.billPartPrice)}
                          </td>
                          <td className="px-3 py-2">
                            {entry.cashPartPriceInNumbers !== undefined
                              ? formatNumber(entry.cashPartPriceInNumbers)
                              : '-'}
                          </td>
                          <td className="px-3 py-2">
                            {entry.billPartPriceInNumbers !== undefined
                              ? formatNumber(entry.billPartPriceInNumbers)
                              : '-'}
                          </td>
                          <td className="px-3 py-2 text-right">
                            Rs. {entry.allocatedOtherExpense !== undefined ? formatNumber(entry.allocatedOtherExpense) : '0.00'}
                          </td>
                          <td className="px-3 py-2">
                            {entry.totalPriceInNumbers !== undefined
                              ? formatNumber(entry.totalPriceInNumbers)
                              : '-'}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {entry.gstPercent !== undefined ? `${formatNumber(entry.gstPercent)}%` : '-'}
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-3 py-2">{entry.invoiceNo}</td>
                          <td className="px-3 py-2">
                            {new Date(entry.invoiceDate).toLocaleDateString()}
                          </td>
                          <td className="px-3 py-2">{entry.sellerName}</td>
                          <td className="px-3 py-2">{entry.sellerAddress || '-'}</td>
                          <td className="px-3 py-2 text-right">
                            Rs. {entry.totals?.totalPurchaseAmount !== undefined ? formatNumber(entry.totals.totalPurchaseAmount) : '0.00'}
                          </td>
                          <td className="px-3 py-2 text-right">
                            Rs. {entry.totals?.grandTotalPurchaseAmount !== undefined ? formatNumber(entry.totals.grandTotalPurchaseAmount) : '0.00'}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
              {paginateData().map((entry, idx) => (
                <div
                  key={
                    isItemReport
                      ? `${entry.purchaseId}-item-m-${idx}`
                      : `${entry.purchaseId}-purchase-m-${idx}`
                  }
                  className="bg-white rounded-lg shadow p-4"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-bold text-red-600">
                      Invoice: {entry.invoiceNo}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(entry.invoiceDate).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-700">Seller: {entry.sellerName}</p>
                  <p className="text-xs text-gray-700">Address: {entry.sellerAddress || '-'}</p>
                  {isItemReport && (
                    <>
                      <p className="text-xs text-gray-700 mt-2">Item: {entry.itemName}</p>
                      <p className="text-xs text-gray-700">Quantity: {formatNumber(entry.quantity)}</p>
                      <p className="text-xs text-gray-700">Qty#: {formatNumber(entry.quantityInNumbers)}</p>
                      <p className="text-xs text-gray-700">S Unit: {entry.sUnit || '-'}</p>
                      <p className="text-xs text-gray-700">
                        PS Ratio: {entry.psRatio !== undefined ? formatNumber(entry.psRatio) : '-'}
                      </p>
                      <p className="text-xs text-gray-700">
                        Len: {entry.length !== undefined ? formatNumber(entry.length) : '-'}
                      </p>
                      <p className="text-xs text-gray-700">
                        Brdth: {entry.breadth !== undefined ? formatNumber(entry.breadth) : '-'}
                      </p>
                      <p className="text-xs text-gray-700">
                        Act Len: {entry.actLength !== undefined ? formatNumber(entry.actLength) : '-'}
                      </p>
                      <p className="text-xs text-gray-700">
                        Act Brdth: {entry.actBreadth !== undefined ? formatNumber(entry.actBreadth) : '-'}
                      </p>
                      <p className="text-xs text-gray-700">Size: {entry.size || '-'}</p>
                      <p className="text-xs text-gray-700">P Unit: {entry.pUnit || '-'}</p>
                      <p className="text-xs text-gray-700 text-right">
                        Cash: Rs. {formatNumber(entry.cashPartPrice)}
                      </p>
                      <p className="text-xs text-gray-700 text-right">
                        Bill: Rs. {formatNumber(entry.billPartPrice)}
                      </p>
                      <p className="text-xs text-gray-700 text-right">
                        Other Exp: Rs. {entry.allocatedOtherExpense !== undefined ? formatNumber(entry.allocatedOtherExpense) : '0.00'}
                      </p>
                      <div className="flex justify-between mt-2">
                        <span className="text-xs font-bold text-gray-700">
                          Total#: {entry.totalPriceInNumbers !== undefined ? formatNumber(entry.totalPriceInNumbers) : '-'}
                        </span>
                        <span className="text-xs font-bold text-gray-700">
                          GST: {entry.gstPercent !== undefined ? `${formatNumber(entry.gstPercent)}%` : '-'}
                        </span>
                      </div>
                    </>
                  )}
                  {!isItemReport && (
                    <div className="mt-2 flex justify-between">
                      <span className="text-xs font-bold text-gray-700">
                        Total: Rs. {entry.totals?.totalPurchaseAmount !== undefined ? formatNumber(entry.totals.totalPurchaseAmount) : '0.00'}
                      </span>
                      <span className="text-xs font-bold text-gray-700">
                        Grand Total: Rs. {entry.totals?.grandTotalPurchaseAmount !== undefined ? formatNumber(entry.totals.grandTotalPurchaseAmount) : '0.00'}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-6">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-4 py-2 text-sm font-medium rounded ${
                  currentPage === 1
                    ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                    : 'bg-red-500 text-white hover:bg-red-600'
                }`}
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-4 py-2 text-sm font-medium rounded ${
                  currentPage === totalPages
                    ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                    : 'bg-red-500 text-white hover:bg-red-600'
                }`}
              >
                Next
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default PurchaseReport;
