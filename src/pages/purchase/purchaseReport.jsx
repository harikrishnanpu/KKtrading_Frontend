// PurchaseReport.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import useAuth from 'hooks/useAuth';

const PurchaseReport = () => {
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter States
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sellerName, setSellerName] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [itemName, setItemName] = useState('');
  const [amountThreshold, setAmountThreshold] = useState('');

  // Sorting States
  const [sortField, setSortField] = useState('totals.totalPurchaseAmount');
  const [sortDirection, setSortDirection] = useState('asc');

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Total Amount
  const [totalAmount, setTotalAmount] = useState(0);

  // Toggle between Purchase Report and Purchase Item Report
  const [isItemReport, setIsItemReport] = useState(false);

  // Autocomplete Suggestions
  const [sellerSuggestions, setSellerSuggestions] = useState([]);
  const [invoiceSuggestions, setInvoiceSuggestions] = useState([]);
  const [itemSuggestions, setItemSuggestions] = useState([]);

  const { user: userInfo } = useAuth();

  // Fetch Purchases from API
  const fetchPurchases = async () => {
    setLoading(true);
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

  // Generate a flattened list of items for Item Report
  const getItemsList = useMemo(() => {
    return purchases.flatMap((purchase) =>
      purchase.items.map((item) => ({
        purchaseId: purchase.purchaseId,
        invoiceNo: purchase.invoiceNo,
        invoiceDate: purchase.invoiceDate,
        sellerName: purchase.sellerName,
        sellerAddress: purchase.sellerAddress || '-', // Added Seller Address
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

  // Function to handle filtering
  const filterData = () => {
    let data = isItemReport ? getItemsList : purchases;

    if (isItemReport) {
      data = getItemsList;
    } else {
      data = purchases;
    }

    // Filter by date range
    if (fromDate) {
      data = data.filter((entry) => {
        const entryDate = new Date(entry.invoiceDate).setHours(0, 0, 0, 0);
        const filterFromDate = new Date(fromDate).setHours(0, 0, 0, 0);
        return entryDate >= filterFromDate;
      });
    }
    if (toDate) {
      data = data.filter((entry) => {
        const entryDate = new Date(entry.invoiceDate).setHours(0, 0, 0, 0);
        const filterToDate = new Date(toDate).setHours(0, 0, 0, 0);
        return entryDate <= filterToDate;
      });
    }

    // Filter by seller name
    if (sellerName) {
      data = data.filter((entry) =>
        entry.sellerName.toLowerCase().includes(sellerName.toLowerCase())
      );
    }

    // Filter by invoice number
    if (invoiceNo) {
      data = data.filter((entry) =>
        entry.invoiceNo.toLowerCase().includes(invoiceNo.toLowerCase())
      );
    }

    // Filter by item name (only for Item Report)
    if (isItemReport && itemName) {
      data = data.filter((entry) =>
        entry.itemName.toLowerCase().includes(itemName.toLowerCase())
      );
    }

    // Filter by amount threshold
    if (amountThreshold) {
      if (isItemReport) {
        data = data.filter(
          (entry) => entry.totalPriceInNumbers >= parseFloat(amountThreshold)
        );
      } else {
        data = data.filter(
          (entry) =>
            entry.totals?.totalPurchaseAmount >= parseFloat(amountThreshold)
        );
      }
    }

    // Sort by selected field
    if (sortField) {
      data.sort((a, b) => {
        const fieldA = getFieldValue(a, sortField);
        const fieldB = getFieldValue(b, sortField);

        if (sortDirection === 'asc') {
          if (fieldA < fieldB) return -1;
          if (fieldA > fieldB) return 1;
          return 0;
        } else {
          if (fieldA > fieldB) return -1;
          if (fieldA < fieldB) return 1;
          return 0;
        }
      });
    }

    setFilteredData(data);
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Helper function to get nested field value
  const getFieldValue = (obj, field) => {
    return field.split('.').reduce((o, i) => (o ? o[i] : null), obj);
  };

  // Update filtered data whenever filters or report mode change
  useEffect(() => {
    filterData();
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

  // Compute total amount based on current mode
  useEffect(() => {
    if (isItemReport) {
      const total = filteredData.reduce(
        (sum, item) => sum + (item.totalPriceInNumbers || 0),
        0
      );
      setTotalAmount(total);
    } else {
      const total = filteredData.reduce(
        (sum, purchase) => sum + (purchase.totals?.totalPurchaseAmount || 0),
        0
      );
      setTotalAmount(total);
    }
  }, [filteredData, isItemReport]);

  // Suggestions for autocomplete
  useEffect(() => {
    const sellerNames = [...new Set(purchases.map((p) => p.sellerName))];
    setSellerSuggestions(sellerNames);

    const invoiceNumbers = [...new Set(purchases.map((p) => p.invoiceNo))];
    setInvoiceSuggestions(invoiceNumbers);

    const items = [
      ...new Set(
        purchases.flatMap((p) => p.items.map((i) => i.name))
      ),
    ];
    setItemSuggestions(items);
  }, [purchases]);

  // Paginate data
  const paginateData = () => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  };

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Generate PDF based on current mode
  const generatePDF = () => {
    const doc = new jsPDF();
    const title = isItemReport ? 'Purchase Item Report' : 'Purchase Report';
    doc.text(title, 14, 15);
    doc.setFontSize(12);
    doc.text(
      `Date Range: ${fromDate || 'All'} to ${toDate || 'All'}`,
      14,
      25
    );
    doc.text(`Seller Name: ${sellerName || 'All'}`, 14, 32);
    doc.text(`Total Amount: Rs. ${totalAmount.toFixed(2)}`, 14, 39);

    let tableColumn = [];
    let tableRows = [];

    if (isItemReport) {
      tableColumn = [
        'Invoice No',
        'Invoice Date',
        'Seller Name',
        'Seller Address', // Added Seller Address
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
        'Cash Part Price In Numbers',
        'Bill Part Price In Numbers',
        'Allocated Other Expense',
        'Total Price In Numbers',
        'GST Percent',
      ];

      filteredData.forEach((item) => {
        const itemData = [
          item.invoiceNo,
          new Date(item.invoiceDate).toLocaleDateString(),
          item.sellerName,
          item.sellerAddress || '-',
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
          `Rs. ${item.cashPartPrice.toFixed(2)}`,
          `Rs. ${item.billPartPrice.toFixed(2)}`,
          item.cashPartPriceInNumbers ?? '-',
          item.billPartPriceInNumbers ?? '-',
          `Rs. ${item.allocatedOtherExpense.toFixed(2)}`,
          item.totalPriceInNumbers ?? '-',
          `${item.gstPercent}%`,
        ];
        tableRows.push(itemData);
      });
    } else {
      tableColumn = [
        'Invoice No',
        'Invoice Date',
        'Seller Name',
        'Seller Address', // Added Seller Address
        'Total Purchase Amount',
        'Grand Total Purchase Amount', // Added Grand Total Purchase Amount
      ];

      filteredData.forEach((purchase) => {
        const purchaseData = [
          purchase.invoiceNo,
          new Date(purchase.invoiceDate).toLocaleDateString(),
          purchase.sellerName,
          purchase.sellerAddress || '-',
          `Rs. ${purchase.totals?.totalPurchaseAmount?.toFixed(2) || '0.00'}`,
          `Rs. ${purchase.totals?.grandTotalPurchaseAmount?.toFixed(2) || '0.00'}`,
        ];
        tableRows.push(purchaseData);
      });
    }

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 45,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [220, 20, 60] }, // Red header
      tableLineColor: [0, 0, 0],
      tableLineWidth: 0.1,
    });

    const fileName = isItemReport
      ? 'purchase_item_report.pdf'
      : 'purchase_report.pdf';
    doc.save(fileName);
  };

  return (
    <>
      {/* Header */}

        <div className="flex items-center">
          <label className="flex items-center text-xs font-bold text-gray-700">
            <input
              type="checkbox"
              checked={isItemReport}
              onChange={(e) => setIsItemReport(e.target.checked)}
              className="mr-2"
            />
            Purchase Item Report
          </label>
          <i className="fa fa-file-text text-gray-500 text-lg ml-2" />
        </div>

      {/* Filters */}
      <div className="bg-white p-2 rounded-lg shadow-md mb-2">
        <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-8 gap-2">
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

          {/* Seller Name */}
          <div>
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
              {sellerSuggestions.map((name, index) => (
                <option key={index} value={name} />
              ))}
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
              className="w-full border border-gray-300 rounded p-1 text-xs"
              placeholder="Enter Invoice No"
            />
            <datalist id="invoiceSuggestions">
              {invoiceSuggestions.map((no, index) => (
                <option key={index} value={no} />
              ))}
            </datalist>
          </div>

          {/* Item Name (only for Item Report) */}
          {isItemReport && (
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
                {itemSuggestions.map((name, index) => (
                  <option key={index} value={name} />
                ))}
              </datalist>
            </div>
          )}

          {/* Amount Threshold */}
          <div>
            <label className="block text-xs font-bold mb-1">Amount ≥</label>
            <input
              type="number"
              value={amountThreshold}
              onChange={(e) => setAmountThreshold(e.target.value)}
              className="w-full border border-gray-300 rounded p-1 text-xs"
              placeholder="Enter Amount"
              min="0"
            />
          </div>

          {/* Sort Field */}
          <div>
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

          {/* Generate PDF */}
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

      {/* Total Amount */}
      <div className="bg-white p-2 rounded-lg shadow-md mb-2">
        <p className="text-sm font-bold text-gray-700">
          Total Amount: Rs. {totalAmount.toFixed(2)}
        </p>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="text-center text-gray-500 text-xs">
          Loading purchases...
        </div>
      ) : (
        <>
          {/* Error Message */}
          {error && (
            <p className="text-red-500 text-center mb-2 text-xs">{error}</p>
          )}

          {/* No Data Message */}
          {filteredData.length === 0 ? (
            <p className="text-center text-gray-500 text-xs">
              No purchases found for the selected criteria.
            </p>
          ) : (
            <>
              {/* Table for Large Screens */}
              <div className="hidden md:block">
                <table className="w-full text-xs text-gray-500 bg-white shadow-md rounded-lg overflow-hidden">
                  <thead
                    className="bg-red-600 text-xs text-white"
                  >
                    <tr className="divide-y">
                      {isItemReport ? (
                        <>
                          <th className="px-2 py-1 text-left">Invoice No</th>
                          <th className="px-2 py-1">Invoice Date</th>
                          <th className="px-2 py-1">Seller Name</th>
                          <th className="px-2 py-1">Seller Address</th> {/* Added */}
                          <th className="px-2 py-1">Item Name</th>
                          <th className="px-2 py-1">Quantity</th>
                          <th className="px-2 py-1">Quantity In Numbers</th>
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
                          <th className="px-2 py-1">Cash Part Price In Numbers</th>
                          <th className="px-2 py-1">Bill Part Price In Numbers</th>
                          <th className="px-2 py-1">Allocated Other Expense</th>
                          <th className="px-2 py-1">Total Price In Numbers</th>
                          <th className="px-2 py-1">GST Percent</th>
                        </>
                      ) : (
                        <>
                          <th className="px-2 py-1 text-left">Invoice No</th>
                          <th className="px-2 py-1">Invoice Date</th>
                          <th className="px-2 py-1">Seller Name</th>
                          <th className="px-2 py-1">Seller Address</th> {/* Added */}
                          <th className="px-2 py-1">Total Purchase Amount</th>
                          <th className="px-2 py-1">Grand Total Purchase Amount</th> {/* Added */}
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {paginateData().map((entry, index) => (
                      <tr
                        key={
                          isItemReport
                            ? `${entry.purchaseId}-${index}`
                            : entry.purchaseId
                        }
                        className="hover:bg-gray-100 divide-y divide-x"
                      >
                        {isItemReport ? (
                          <>
                            <td className="px-2 py-1 text-center">
                              {entry.invoiceNo}
                            </td>
                            <td className="px-2 py-1">
                              {new Date(entry.invoiceDate).toLocaleDateString()}
                            </td>
                            <td className="px-2 py-1">{entry.sellerName}</td>
                            <td className="px-2 py-1">{entry.sellerAddress}</td> {/* Added */}
                            <td className="px-2 py-1">{entry.itemName}</td>
                            <td className="px-2 py-1 text-center">
                              {entry.quantity}
                            </td>
                            <td className="px-2 py-1 text-center">
                              {entry.quantityInNumbers}
                            </td>
                            <td className="px-2 py-1">{entry.sUnit || '-'}</td>
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
                              {entry.actLength !== undefined ? entry.actLength : '-'}
                            </td>
                            <td className="px-2 py-1">
                              {entry.actBreadth !== undefined ? entry.actBreadth : '-'}
                            </td>
                            <td className="px-2 py-1">{entry.size || '-'}</td>
                            <td className="px-2 py-1">{entry.pUnit || '-'}</td>
                            <td className="px-2 py-1 text-right">
                              Rs. {entry.cashPartPrice?.toFixed(2) || '0.00'}
                            </td>
                            <td className="px-2 py-1 text-right">
                              Rs. {entry.billPartPrice?.toFixed(2) || '0.00'}
                            </td>
                            <td className="px-2 py-1 text-center">
                              {entry.cashPartPriceInNumbers ?? '-'}
                            </td>
                            <td className="px-2 py-1 text-center">
                              {entry.billPartPriceInNumbers ?? '-'}
                            </td>
                            <td className="px-2 py-1 text-right">
                              Rs. {entry.allocatedOtherExpense?.toFixed(2) || '0.00'}
                            </td>
                            <td className="px-2 py-1 text-center">
                              {entry.totalPriceInNumbers ?? '-'}
                            </td>
                            <td className="px-2 py-1 text-center">
                              {entry.gstPercent !== undefined ? `${entry.gstPercent}%` : '-'}
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-2 py-1 text-center">
                              {entry.invoiceNo}
                            </td>
                            <td className="px-2 py-1">
                              {new Date(entry.invoiceDate).toLocaleDateString()}
                            </td>
                            <td className="px-2 py-1">{entry.sellerName}</td>
                            <td className="px-2 py-1">{entry.sellerAddress || '-'}</td> {/* Added */}
                            <td className="px-2 py-1 text-right">
                              Rs. {entry.totals?.totalPurchaseAmount?.toFixed(2) || '0.00'}
                            </td>
                            <td className="px-2 py-1 text-right">
                              Rs. {entry.totals?.grandTotalPurchaseAmount?.toFixed(2) || '0.00'}
                            </td> {/* Added */}
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Cards for Small Screens */}
              <div className="md:hidden">
                {paginateData().map((entry, index) => (
                  <div
                    key={
                      isItemReport
                        ? `${entry.purchaseId}-${index}`
                        : entry.purchaseId
                    }
                    className="bg-white rounded-lg shadow-md p-2 mb-2"
                  >
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-bold text-red-600">
                        Invoice No: {entry.invoiceNo}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(entry.invoiceDate).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="text-gray-600 text-xs mt-1">
                      Seller: {entry.sellerName}
                    </p>
                    <p className="text-gray-600 text-xs">
                      Seller Address: {entry.sellerAddress || '-'}
                    </p> {/* Added */}
                    {isItemReport && (
                      <>
                        <p className="text-gray-600 text-xs mt-1">
                          Item: {entry.itemName}
                        </p>
                        <p className="text-gray-600 text-xs">
                          Quantity: {entry.quantity}
                        </p>
                        <p className="text-gray-600 text-xs">
                          Quantity In Numbers: {entry.quantityInNumbers}
                        </p>
                        <p className="text-gray-600 text-xs">
                          S Unit: {entry.sUnit || '-'}
                        </p>
                        <p className="text-gray-600 text-xs">
                          PS Ratio: {entry.psRatio !== undefined ? entry.psRatio : '-'}
                        </p>
                        <p className="text-gray-600 text-xs">
                          Length: {entry.length !== undefined ? entry.length : '-'}
                        </p>
                        <p className="text-gray-600 text-xs">
                          Breadth: {entry.breadth !== undefined ? entry.breadth : '-'}
                        </p>
                        <p className="text-gray-600 text-xs">
                          Act Length: {entry.actLength !== undefined ? entry.actLength : '-'}
                        </p>
                        <p className="text-gray-600 text-xs">
                          Act Breadth: {entry.actBreadth !== undefined ? entry.actBreadth : '-'}
                        </p>
                        <p className="text-gray-600 text-xs">
                          Size: {entry.size || '-'}
                        </p>
                        <p className="text-gray-600 text-xs">
                          P Unit: {entry.pUnit || '-'}
                        </p>
                        <p className="text-gray-600 text-xs">
                          Cash Part Price: Rs. {entry.cashPartPrice?.toFixed(2) || '0.00'}
                        </p>
                        <p className="text-gray-600 text-xs">
                          Bill Part Price: Rs. {entry.billPartPrice?.toFixed(2) || '0.00'}
                        </p>
                        <p className="text-gray-600 text-xs">
                          Cash Part Price In Numbers: {entry.cashPartPriceInNumbers ?? '-'}
                        </p>
                        <p className="text-gray-600 text-xs">
                          Bill Part Price In Numbers: {entry.billPartPriceInNumbers ?? '-'}
                        </p>
                        <p className="text-gray-600 text-xs">
                          Allocated Other Expense: Rs. {entry.allocatedOtherExpense?.toFixed(2) || '0.00'}
                        </p>
                      </>
                    )}
                    <div className="flex justify-between mt-2">
                      {isItemReport ? (
                        <>
                          <p className="text-gray-600 text-xs font-bold">
                            Total Price In Numbers: {entry.totalPriceInNumbers ?? '-'}
                          </p>
                          <p className="text-gray-600 text-xs font-bold">
                            GST Percent: {entry.gstPercent !== undefined ? `${entry.gstPercent}%` : '-'}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-gray-600 text-xs font-bold">
                            Total Amount: Rs. {entry.totals?.totalPurchaseAmount?.toFixed(2) || '0.00'}
                          </p>
                          <p className="text-gray-600 text-xs font-bold">
                            Grand Total Amount: Rs. {entry.totals?.grandTotalPurchaseAmount?.toFixed(2) || '0.00'}
                          </p> {/* Added */}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex justify-between items-center mt-2">
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
        </>
      )}
    </>
  );
};

export default PurchaseReport;
