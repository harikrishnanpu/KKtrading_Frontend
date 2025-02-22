// src/components/SupplierAccountList.js

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  forwardRef
} from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { useNavigate } from "react-router-dom";
import api from "../api"; // custom Axios or fetch
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import debounce from "lodash.debounce";
import useAuth from "hooks/useAuth";

// MUI components
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import Slide from "@mui/material/Slide";
import CloseIcon from "@mui/icons-material/Close";

const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const SupplierAccountList = () => {
  const navigate = useNavigate();
  const { user : userInfo } = useAuth(); // If needed

  // Main states
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState("");

  // Aggregated from backend Purchase
  const [totalBillPartAll, setTotalBillPartAll] = useState(0);
  const [totalCashPartAll, setTotalCashPartAll] = useState(0);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Sidebar controls
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Global filters
  const [accountSearch, setAccountSearch] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("");
  const [billAmountMin, setBillAmountMin] = useState("");
  const [billAmountMax, setBillAmountMax] = useState("");
  const [pendingAmountMin, setPendingAmountMin] = useState("");
  const [pendingAmountMax, setPendingAmountMax] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "", direction: "asc" });

  // For multi-select
  const [selectedAccountIds, setSelectedAccountIds] = useState([]);

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((val) => {
      setAccountSearch(val);
      setCurrentPage(1);
    }, 300),
    []
  );

  const handleAccountSearchChange = (e) => {
    debouncedSearch(e.target.value);
  };

  // Fetch data from server
  const fetchAccounts = async () => {
    setLoading(true);
    try {
      // Should return { accounts, totalBillPartAll, totalCashPartAll }
      const res = await api.get("/api/seller/allaccounts");
      const { accounts, totalBillPartAll, totalCashPartAll } = res.data;

      // Insert arrays if missing
      const formatted = accounts.map((acc) => ({
        ...acc,
        bills: acc.bills || [],
        payments: acc.payments || []
      }));

      setAccounts(formatted);
      setTotalBillPartAll(totalBillPartAll);
      setTotalCashPartAll(totalCashPartAll);

      // Restore or select all
      const stored = localStorage.getItem("selectedSupplierAccountIds");
      if (stored) {
        setSelectedAccountIds(JSON.parse(stored));
      } else {
        const allIds = formatted.map((a) => a._id);
        setSelectedAccountIds(allIds);
        localStorage.setItem(
          "selectedSupplierAccountIds",
          JSON.stringify(allIds)
        );
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch supplier accounts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
    // eslint-disable-next-line
  }, []);

  // For each account, compute BillPartPaid, CashPartPaid, BillPartPending, CashPartPending
  const enrichedAccounts = useMemo(() => {
    return accounts.map((acc) => {
      let billPaid = 0;
      let cashPaid = 0;
      // Sum up payments
      for (const pay of acc.payments || []) {
        const remark = pay.remark?.toLowerCase() || "";
        if (remark.startsWith("bill:")) {
          billPaid += pay.amount;
        } else if (remark.startsWith("cash:")) {
          cashPaid += pay.amount;
        }
      }
      const billPend = (acc.totalBillPartBilled || 0) - billPaid;
      const cashPend = (acc.totalCashPartBilled || 0) - cashPaid;
      return {
        ...acc,
        billPartPaid: billPaid,
        cashPartPaid: cashPaid,
        billPartPending: billPend,
        cashPartPending: cashPend
      };
    });
  }, [accounts]);

  // Filter & sort
  const filteredAccounts = useMemo(() => {
    let temp = [...enrichedAccounts];

    if (paymentStatusFilter === "Paid") {
      temp = temp.filter((acc) => acc.pendingAmount === 0);
    } else if (paymentStatusFilter === "Pending") {
      temp = temp.filter((acc) => acc.pendingAmount !== 0);
    }

    // Bill range
    if (billAmountMin) {
      temp = temp.filter((acc) => acc.totalBillAmount >= parseFloat(billAmountMin));
    }
    if (billAmountMax) {
      temp = temp.filter((acc) => acc.totalBillAmount <= parseFloat(billAmountMax));
    }

    // Pending range
    if (pendingAmountMin) {
      temp = temp.filter((acc) => acc.pendingAmount >= parseFloat(pendingAmountMin));
    }
    if (pendingAmountMax) {
      temp = temp.filter((acc) => acc.pendingAmount <= parseFloat(pendingAmountMax));
    }

    // Search
    if (accountSearch.trim()) {
      const q = accountSearch.toLowerCase();
      temp = temp.filter(
        (acc) =>
          acc.sellerId?.toLowerCase().includes(q) ||
          acc.sellerName?.toLowerCase().includes(q)
      );
    }

    // Sort
    if (sortConfig.key) {
      temp.sort((a, b) => {
        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];

        // Date
        if (sortConfig.key === "createdAt") {
          valA = new Date(valA);
          valB = new Date(valB);
        }
        // Strings
        if (typeof valA === "string") {
          valA = valA.toLowerCase();
          valB = valB.toLowerCase();
        }

        if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
        if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return temp;
  }, [
    enrichedAccounts,
    paymentStatusFilter,
    billAmountMin,
    billAmountMax,
    pendingAmountMin,
    pendingAmountMax,
    accountSearch,
    sortConfig
  ]);

  // Select all listed
  const handleSelectAllListed = () => {
    const listedIds = filteredAccounts.map((acc) => acc._id);
    const allSelected = listedIds.every((id) => selectedAccountIds.includes(id));
    let newSelection;
    if (allSelected) {
      // unselect them
      newSelection = selectedAccountIds.filter((id) => !listedIds.includes(id));
    } else {
      // select them
      newSelection = Array.from(new Set([...selectedAccountIds, ...listedIds]));
    }
    setSelectedAccountIds(newSelection);
    localStorage.setItem("selectedSupplierAccountIds", JSON.stringify(newSelection));
  };

  // Toggle single
  const toggleSelection = (id) => {
    setSelectedAccountIds((prev) => {
      let updated;
      if (prev.includes(id)) {
        updated = prev.filter((x) => x !== id);
      } else {
        updated = [...prev, id];
      }
      localStorage.setItem("selectedSupplierAccountIds", JSON.stringify(updated));
      return updated;
    });
  };

  // final accounts to display
  const finalAccounts = useMemo(() => {
    return filteredAccounts.filter((acc) => selectedAccountIds.includes(acc._id));
  }, [filteredAccounts, selectedAccountIds]);

  // Pagination
  const totalPages = Math.ceil(finalAccounts.length / itemsPerPage);
  const currentPageAccounts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return finalAccounts.slice(start, start + itemsPerPage);
  }, [finalAccounts, currentPage, itemsPerPage]);

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  // Basic totals across displayed
  const totalBilled = useMemo(
    () => finalAccounts.reduce((sum, a) => sum + (a.totalBillAmount || 0), 0),
    [finalAccounts]
  );
  const totalPaid = useMemo(
    () => finalAccounts.reduce((sum, a) => sum + (a.paidAmount || 0), 0),
    [finalAccounts]
  );
  const totalPending = useMemo(
    () => finalAccounts.reduce((sum, a) => sum + (a.pendingAmount || 0), 0),
    [finalAccounts]
  );

  // For Bill part & Cash part paid across final accounts:
  const {
    totalBillPartPaidAll,
    totalBillPartPendingAll,
    totalCashPartPaidAll,
    totalCashPartPendingAll
  } = useMemo(() => {
    let billPaidSum = 0;
    let cashPaidSum = 0;
    let billPendSum = 0;
    let cashPendSum = 0;

    for (const acc of finalAccounts) {
      billPaidSum += acc.billPartPaid || 0;
      cashPaidSum += acc.cashPartPaid || 0;
      billPendSum += acc.billPartPending || 0;
      cashPendSum += acc.cashPartPending || 0;
    }

    return {
      totalBillPartPaidAll: billPaidSum,
      totalBillPartPendingAll: billPendSum,
      totalCashPartPaidAll: cashPaidSum,
      totalCashPartPendingAll: cashPendSum
    };
  }, [finalAccounts]);

  // PDF
  const generatePDF = (account) => {
    setPdfLoading(true);
    const doc = new jsPDF();

    doc.setFontSize(14);
    doc.text("Supplier Account Statement", 14, 20);

    doc.setFontSize(10);
    doc.text(`Supplier ID: ${account.sellerId || "-"}`, 14, 28);
    doc.text(`Supplier Name: ${account.sellerName || "-"}`, 14, 34);
    doc.text(`Supplier Address: ${account.sellerAddress || "-"}`, 14, 40);
    doc.text(`Supplier GST: ${account.sellerGst || "-"}`, 14, 46);

    doc.text(`Total Bill Amount: ₹${(account.totalBillAmount || 0).toFixed(2)}`, 14, 52);
    doc.text(`Paid Amount: ₹${(account.paidAmount || 0).toFixed(2)}`, 14, 58);
    doc.text(`Pending: ₹${(account.pendingAmount || 0).toFixed(2)}`, 14, 64);

    doc.text(
      `BillPart Billed: ₹${(account.totalBillPartBilled || 0).toFixed(2)}`,
      14,
      70
    );
    doc.text(
      `BillPart Paid: ₹${(account.billPartPaid || 0).toFixed(2)}`,
      14,
      76
    );
    doc.text(
      `BillPart Pending: ₹${(account.billPartPending || 0).toFixed(2)}`,
      14,
      82
    );

    doc.text(
      `CashPart Billed: ₹${(account.totalCashPartBilled || 0).toFixed(2)}`,
      14,
      88
    );
    doc.text(
      `CashPart Paid: ₹${(account.cashPartPaid || 0).toFixed(2)}`,
      14,
      94
    );
    doc.text(
      `CashPart Pending: ₹${(account.cashPartPending || 0).toFixed(2)}`,
      14,
      100
    );

    doc.text(
      `Created At: ${new Date(account.createdAt).toLocaleString()}`,
      14,
      106
    );

    // Bills
    doc.setFontSize(12);
    doc.text("Bills", 14, 116);
    const billsData = (account.bills || []).map((bill, idx) => [
      idx + 1,
      bill.invoiceNo,
      `₹${bill.billAmount.toFixed(2)}`,
      new Date(bill.invoiceDate).toLocaleDateString()
    ]);
    doc.autoTable({
      startY: 120,
      head: [["#", "InvoiceNo", "Amount(₹)", "Date"]],
      body: billsData,
      theme: "grid",
      styles: { fontSize: 8 },
      headStyles: { fillColor: [200, 0, 0] }
    });

    // Payments
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.text("Payments", 14, finalY);
    const paymentsData = (account.payments || []).map((p, i) => [
      i + 1,
      `₹${p.amount.toFixed(2)}`,
      p.method,
      p.submittedBy,
      p.remark || "-",
      new Date(p.date).toLocaleDateString(),
      p.referenceId
    ]);
    doc.autoTable({
      startY: finalY + 4,
      head: [["#", "Amount", "Method", "By", "Remark", "Date", "RefID"]],
      body: paymentsData,
      theme: "grid",
      styles: { fontSize: 8 },
      headStyles: { fillColor: [200, 0, 0] }
    });

    doc.save(`SupplierAccount_${account.sellerId}.pdf`);
    setPdfLoading(false);
  };

  // Delete
  const handleRemove = async (id) => {
    if (window.confirm("Are you sure you want to delete this supplier account?")) {
      try {
        await api.delete(`/api/seller/${id}/delete`);
        alert("Deleted successfully.");
        setAccounts((prev) => prev.filter((x) => x._id !== id));
        const updated = selectedAccountIds.filter((x) => x !== id);
        setSelectedAccountIds(updated);
        localStorage.setItem("selectedSupplierAccountIds", JSON.stringify(updated));
      } catch (err) {
        console.error(err);
        setError("Error while deleting.");
      }
    }
  };

  // Modal states
  const [activeModalTab, setActiveModalTab] = useState("bills");

  // Bills filters
  const [billsSearch, setBillsSearch] = useState("");
  const [billsDateFrom, setBillsDateFrom] = useState("");
  const [billsDateTo, setBillsDateTo] = useState("");
  const [billsSortKey, setBillsSortKey] = useState("invoiceDate");
  const [billsSortDirection, setBillsSortDirection] = useState("asc");

  // Bill pay filters
  const [billPaySearch, setBillPaySearch] = useState("");
  const [billPayDateFrom, setBillPayDateFrom] = useState("");
  const [billPayDateTo, setBillPayDateTo] = useState("");
  const [billPaySortKey, setBillPaySortKey] = useState("date");
  const [billPaySortDirection, setBillPaySortDirection] = useState("asc");

  // Cash pay filters
  const [cashPaySearch, setCashPaySearch] = useState("");
  const [cashPayDateFrom, setCashPayDateFrom] = useState("");
  const [cashPayDateTo, setCashPayDateTo] = useState("");
  const [cashPaySortKey, setCashPaySortKey] = useState("date");
  const [cashPaySortDirection, setCashPaySortDirection] = useState("asc");

  const handleView = (acc) => {
    setSelectedAccount(acc);
    setActiveModalTab("bills");

    // Reset
    setBillsSearch("");
    setBillsDateFrom("");
    setBillsDateTo("");
    setBillsSortKey("invoiceDate");
    setBillsSortDirection("asc");

    setBillPaySearch("");
    setBillPayDateFrom("");
    setBillPayDateTo("");
    setBillPaySortKey("date");
    setBillPaySortDirection("asc");

    setCashPaySearch("");
    setCashPayDateFrom("");
    setCashPayDateTo("");
    setCashPaySortKey("date");
    setCashPaySortDirection("asc");
  };

  const closeModal = () => setSelectedAccount(null);

  // Sort main table
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Helper to filter & sort payments
  const filterSortPayments = (payments, search, dFrom, dTo, sKey, sDir) => {
    let data = [...payments];
    // search
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(
        (p) =>
          p.method.toLowerCase().includes(q) ||
          p.submittedBy.toLowerCase().includes(q) ||
          (p.referenceId || "").toLowerCase().includes(q) ||
          (p.remark || "").toLowerCase().includes(q)
      );
    }
    // date range
    if (dFrom) {
      const from = new Date(dFrom);
      data = data.filter((p) => new Date(p.date) >= from);
    }
    if (dTo) {
      const to = new Date(dTo);
      data = data.filter((p) => new Date(p.date) <= to);
    }
    // sort
    data.sort((a, b) => {
      let valA = a[sKey];
      let valB = b[sKey];

      if (sKey === "date") {
        valA = new Date(valA);
        valB = new Date(valB);
      }
      if (typeof valA === "string") {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      if (valA < valB) return sDir === "asc" ? -1 : 1;
      if (valA > valB) return sDir === "asc" ? 1 : -1;
      return 0;
    });
    return data;
  };

  // Filter & sort bills
  const filteredBills = useMemo(() => {
    if (!selectedAccount) return [];
    let data = [...(selectedAccount.bills || [])];

    // search
    if (billsSearch.trim()) {
      const q = billsSearch.toLowerCase();
      data = data.filter((b) => b.invoiceNo.toLowerCase().includes(q));
    }
    // date
    if (billsDateFrom) {
      data = data.filter(
        (b) => new Date(b.invoiceDate) >= new Date(billsDateFrom)
      );
    }
    if (billsDateTo) {
      data = data.filter((b) => new Date(b.invoiceDate) <= new Date(billsDateTo));
    }
    // sort
    data.sort((a, b) => {
      let valA = a[billsSortKey];
      let valB = b[billsSortKey];
      if (billsSortKey === "invoiceDate") {
        valA = new Date(valA);
        valB = new Date(valB);
      } else if (typeof valA === "string") {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }
      if (valA < valB) return billsSortDirection === "asc" ? -1 : 1;
      if (valA > valB) return billsSortDirection === "asc" ? 1 : -1;
      return 0;
    });
    return data;
  }, [
    selectedAccount,
    billsSearch,
    billsDateFrom,
    billsDateTo,
    billsSortKey,
    billsSortDirection
  ]);

  // Bill part payments
  const filteredBillPayments = useMemo(() => {
    if (!selectedAccount) return [];
    const relevant = (selectedAccount.payments || []).filter((p) =>
      p.remark?.toLowerCase().startsWith("bill:")
    );
    return filterSortPayments(
      relevant,
      billPaySearch,
      billPayDateFrom,
      billPayDateTo,
      billPaySortKey,
      billPaySortDirection
    );
  }, [
    selectedAccount,
    billPaySearch,
    billPayDateFrom,
    billPayDateTo,
    billPaySortKey,
    billPaySortDirection
  ]);

  // Cash part payments
  const filteredCashPayments = useMemo(() => {
    if (!selectedAccount) return [];
    const relevant = (selectedAccount.payments || []).filter((p) =>
      p.remark?.toLowerCase().startsWith("cash:")
    );
    return filterSortPayments(
      relevant,
      cashPaySearch,
      cashPayDateFrom,
      cashPayDateTo,
      cashPaySortKey,
      cashPaySortDirection
    );
  }, [
    selectedAccount,
    cashPaySearch,
    cashPayDateFrom,
    cashPayDateTo,
    cashPaySortKey,
    cashPaySortDirection
  ]);

  // Sums in modal
  const billPaymentsSum = useMemo(() => {
    return filteredBillPayments.reduce((sum, p) => sum + p.amount, 0);
  }, [filteredBillPayments]);
  const cashPaymentsSum = useMemo(() => {
    return filteredCashPayments.reduce((sum, p) => sum + p.amount, 0);
  }, [filteredCashPayments]);

  // Skeleton
  const renderSkeleton = () => {
    const rows = Array.from({ length: itemsPerPage });
    return (
      <table className="w-full text-xs text-gray-500 bg-white shadow rounded overflow-hidden">
        <thead className="bg-gray-200">
          <tr className="divide-y">
            <th className="px-1 py-2">ID</th>
            <th className="px-1 py-2">Name</th>
            <th className="px-1 py-2">Address</th>
            <th className="px-1 py-2">Bill</th>
            <th className="px-1 py-2">Paid</th>
            <th className="px-1 py-2">Pending</th>
            <th className="px-1 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((_, i) => (
            <tr key={i} className="hover:bg-gray-100 divide-y divide-x">
              <td className="px-1 py-2">
                <Skeleton height={10} />
              </td>
              <td className="px-1 py-2">
                <Skeleton height={10} />
              </td>
              <td className="px-1 py-2">
                <Skeleton height={10} />
              </td>
              <td className="px-1 py-2">
                <Skeleton height={10} />
              </td>
              <td className="px-1 py-2">
                <Skeleton height={10} />
              </td>
              <td className="px-1 py-2">
                <Skeleton height={10} />
              </td>
              <td className="px-1 py-2">
                <Skeleton height={10} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-100">
      {/* SIDEBAR */}
      <div
        className={`fixed inset-y-0 left-0 transform ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 md:static md:inset-auto md:w-1/5 bg-white p-3 shadow transition-transform duration-300 ease-in-out z-50 text-xs`}
      >
        <h2
          onClick={() => setIsSidebarOpen(false)}
          className="font-bold text-red-600 mb-3 text-center cursor-pointer"
        >
          Filters
        </h2>

        {/* Search */}
        <div className="mb-3">
          <input
            type="text"
            placeholder="Search ID/Name"
            onChange={handleAccountSearchChange}
            className="border text-xs p-1 rounded w-full focus:outline-none focus:ring-1 focus:ring-red-400"
          />
        </div>

        {/* Payment Status */}
        <div className="mb-3">
          <p className="text-gray-700 font-semibold mb-1">Payment Status</p>
          <select
            value={paymentStatusFilter}
            onChange={(e) => {
              setPaymentStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="border text-xs p-1 rounded w-full"
          >
            <option value="">All</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
          </select>
        </div>

        {/* Bill Amount */}
        <div className="mb-3">
          <p className="text-gray-700 font-semibold mb-1">Bill Amount (₹)</p>
          <div className="flex space-x-2">
            <input
              type="number"
              placeholder="Min"
              value={billAmountMin}
              onChange={(e) => {
                setBillAmountMin(e.target.value);
                setCurrentPage(1);
              }}
              className="border p-1 text-xs rounded w-1/2"
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
              className="border p-1 text-xs rounded w-1/2"
              min="0"
            />
          </div>
        </div>

        {/* Pending Amount */}
        <div className="mb-3">
          <p className="text-gray-700 font-semibold mb-1">Pending (₹)</p>
          <div className="flex space-x-2">
            <input
              type="number"
              placeholder="Min"
              value={pendingAmountMin}
              onChange={(e) => {
                setPendingAmountMin(e.target.value);
                setCurrentPage(1);
              }}
              className="border p-1 text-xs rounded w-1/2"
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
              className="border p-1 text-xs rounded w-1/2"
              min="0"
            />
          </div>
        </div>

        {/* Sort */}
        <div className="mb-3">
          <p className="text-gray-700 font-semibold mb-1">Sort By</p>
          <div className="flex space-x-2">
            <select
              value={sortConfig.key}
              onChange={(e) => setSortConfig({ ...sortConfig, key: e.target.value })}
              className="border text-xs p-1 rounded w-1/2"
            >
              <option value="">Field</option>
              <option value="sellerId">ID</option>
              <option value="sellerName">Name</option>
              <option value="totalBillAmount">Total Bill</option>
              <option value="paidAmount">Paid</option>
              <option value="pendingAmount">Pending</option>
              <option value="createdAt">Created</option>
            </select>
            <select
              value={sortConfig.direction}
              onChange={(e) =>
                setSortConfig({ ...sortConfig, direction: e.target.value })
              }
              className="border text-xs p-1 rounded w-1/2"
            >
              <option value="asc">Asc</option>
              <option value="desc">Desc</option>
            </select>
          </div>
        </div>

        {/* Select Suppliers */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-gray-700 font-semibold">Select Suppliers</p>
            <button
              onClick={handleSelectAllListed}
              className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
            >
              Select All
            </button>
          </div>
          <div className="max-h-44 overflow-auto border p-1 rounded">
            {filteredAccounts.map((acc) => {
              const checked = selectedAccountIds.includes(acc._id);
              return (
                <label key={acc._id} className="flex items-center mb-1 text-xs">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleSelection(acc._id)}
                    className="mr-1"
                  />
                  <span>
                    {acc.sellerId} - {acc.sellerName}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        <div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="w-full bg-red-500 text-white py-1 rounded text-xs font-bold hover:bg-red-600"
          >
            Apply & Close
          </button>
        </div>
      </div>

      {/* Mobile filter button */}
      <div className="md:hidden flex justify-end p-2">
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="bg-red-500 text-white px-3 py-1 rounded text-xs"
        >
          Filters
        </button>
      </div>
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* MAIN CONTENT */}
      <div className="flex-1 p-2 md:p-4 lg:p-6 text-xs">
        {error && <p className="text-red-500 text-center mb-2">{error}</p>}

        {/* TOP CARDS: might be multiple rows to fit them all */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 mb-3">
          {/* Basic totals */}
          <div className="bg-white shadow rounded p-2 flex flex-col items-center">
            <p className="text-gray-400 text-[10px]">Total Billed</p>
            <p className="font-bold text-green-700">
              ₹{totalBilled.toFixed(2)}
            </p>
          </div>
          <div className="bg-white shadow rounded p-2 flex flex-col items-center">
            <p className="text-gray-400 text-[10px]">Total Paid</p>
            <p className="font-bold text-blue-700">
              ₹{totalPaid.toFixed(2)}
            </p>
          </div>
          <div className="bg-white shadow rounded p-2 flex flex-col items-center">
            <p className="text-gray-400 text-[10px]">Total Pending</p>
            <p className="font-bold text-red-700">
              ₹{totalPending.toFixed(2)}
            </p>
          </div>

          {/* Bill aggregator */}
          <div className="bg-white shadow rounded p-2 flex flex-col items-center">
            <p className="text-gray-400 text-[10px]">BillPart Billed</p>
            <p className="font-bold text-purple-700">
              ₹{totalBillPartAll.toFixed(2)}
            </p>
          </div>
          <div className="bg-white shadow rounded p-2 flex flex-col items-center">
            <p className="text-gray-400 text-[10px]">BillPart Paid</p>
            <p className="font-bold text-indigo-700">
              ₹{totalBillPartPaidAll.toFixed(2)}
            </p>
          </div>
          <div className="bg-white shadow rounded p-2 flex flex-col items-center">
            <p className="text-gray-400 text-[10px]">BillPart Pending</p>
            <p className="font-bold text-pink-700">
              {/* totalBillPartPendingAll = totalBillPartAll - totalBillPartPaidAll
                  But we actually computed it above, so use that: */}
              ₹{totalBillPartPendingAll.toFixed(2)}
            </p>
          </div>

          {/* Cash aggregator */}
          <div className="bg-white shadow rounded p-2 flex flex-col items-center">
            <p className="text-gray-400 text-[10px]">CashPart Billed</p>
            <p className="font-bold text-orange-700">
              ₹{totalCashPartAll.toFixed(2)}
            </p>
          </div>
          <div className="bg-white shadow rounded p-2 flex flex-col items-center">
            <p className="text-gray-400 text-[10px]">CashPart Paid</p>
            <p className="font-bold text-blue-700">
              ₹{totalCashPartPaidAll.toFixed(2)}
            </p>
          </div>
          <div className="bg-white shadow rounded p-2 flex flex-col items-center">
            <p className="text-gray-400 text-[10px]">CashPart Pending</p>
            <p className="font-bold text-red-700">
              ₹{totalCashPartPendingAll.toFixed(2)}
            </p>
          </div>
        </div>

        {/* PDF loading */}
        {pdfLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="flex flex-col items-center">
              <i className="fa fa-spinner fa-spin text-white text-3xl mb-2"></i>
              <p className="text-white text-xs">Generating PDF...</p>
            </div>
          </div>
        )}

        {/* TABLE or SKELETON */}
        {loading ? (
          renderSkeleton()
        ) : finalAccounts.length === 0 ? (
          <p className="text-center text-gray-500 mt-4">No supplier accounts to display.</p>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block">
              <table className="w-full text-[10px] text-gray-600 bg-white shadow rounded overflow-hidden">
                <thead className="bg-red-500 text-white">
                  <tr className="divide-y">
                    <th
                      className="px-1 py-2 cursor-pointer"
                      onClick={() => handleSort("sellerName")}
                    >
                      Name{" "}
                      {sortConfig.key === "sellerName" && (
                        <i
                          className={`fa fa-sort-${
                            sortConfig.direction === "asc" ? "asc" : "desc"
                          } ml-1`}
                        />
                      )}
                    </th>
                    <th
                      className="px-1 py-2 cursor-pointer"
                      onClick={() => handleSort("sellerAddress")}
                    >
                      Address
                      {sortConfig.key === "sellerAddress" && (
                        <i
                          className={`fa fa-sort-${
                            sortConfig.direction === "asc" ? "asc" : "desc"
                          } ml-1`}
                        />
                      )}
                    </th>
                    <th
                      className="px-1 py-2 cursor-pointer"
                      onClick={() => handleSort("totalBillAmount")}
                    >
                      Bill
                      {sortConfig.key === "totalBillAmount" && (
                        <i
                          className={`fa fa-sort-${
                            sortConfig.direction === "asc" ? "asc" : "desc"
                          } ml-1`}
                        />
                      )}
                    </th>
                    <th
                      className="px-1 py-2 cursor-pointer"
                      onClick={() => handleSort("paidAmount")}
                    >
                      Paid
                      {sortConfig.key === "paidAmount" && (
                        <i
                          className={`fa fa-sort-${
                            sortConfig.direction === "asc" ? "asc" : "desc"
                          } ml-1`}
                        />
                      )}
                    </th>
                    <th
                      className="px-1 py-2 cursor-pointer"
                      onClick={() => handleSort("pendingAmount")}
                    >
                      Pending
                      {sortConfig.key === "pendingAmount" && (
                        <i
                          className={`fa fa-sort-${
                            sortConfig.direction === "asc" ? "asc" : "desc"
                          } ml-1`}
                        />
                      )}
                    </th>
                    <th className="px-1 py-2">BillB</th>
                    <th className="px-1 py-2">BillPaid</th>
                    <th className="px-1 py-2">BillPend</th>
                    <th className="px-1 py-2">CashB</th>
                    <th className="px-1 py-2">CashPaid</th>
                    <th className="px-1 py-2">CashPend</th>
                    <th className="px-1 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentPageAccounts.map((acc) => (
                    <tr key={acc._id} className="hover:bg-gray-50 divide-y divide-x">
                      <td
                        onClick={() => navigate(`/supplier/edit/${acc._id}`)}
                        className="px-1 py-2 font-bold text-red-600 cursor-pointer"
                      >
                        {acc.sellerName}
                      </td>
                      <td className="px-1 py-2">{acc.sellerAddress}</td>
                      <td className="px-1 py-2">
                        ₹{(acc.totalBillAmount || 0).toFixed(2)}
                      </td>
                      <td className="px-1 py-2">
                        ₹{(acc.paidAmount || 0).toFixed(2)}
                      </td>
                      <td className="px-1 py-2">
                        ₹{(acc.pendingAmount || 0).toFixed(2)}
                      </td>
                      <td className="px-1 py-2 text-purple-700">
                        ₹{(acc.totalBillPartBilled || 0).toFixed(2)}
                      </td>
                      <td className="px-1 py-2 text-green-700">
                        ₹{(acc.billPartPaid || 0).toFixed(2)}
                      </td>
                      <td className="px-1 py-2 text-red-700">
                        ₹{(acc.billPartPending || 0).toFixed(2)}
                      </td>
                      <td className="px-1 py-2 text-orange-700">
                        ₹{(acc.totalCashPartBilled || 0).toFixed(2)}
                      </td>
                      <td className="px-1 py-2 text-green-700">
                        ₹{(acc.cashPartPaid || 0).toFixed(2)}
                      </td>
                      <td className="px-1 py-2 text-red-700">
                        ₹{(acc.cashPartPending || 0).toFixed(2)}
                      </td>
                      <td className="px-1 py-2">
                        <div className="flex flex-wrap gap-1">
                          <button
                            onClick={() => handleView(acc)}
                            className="bg-red-500 text-white px-1 py-1 rounded hover:bg-red-600"
                          >
                            <i className="fa fa-eye" />
                          </button>
                          <button
                            onClick={() => generatePDF(acc)}
                            className="bg-red-500 text-white px-1 py-1 rounded hover:bg-red-600"
                          >
                            <i className="fa fa-file-pdf-o" />
                          </button>
                        {userInfo.isSuper &&  <button
                            onClick={() => handleRemove(acc._id)}
                            className="bg-red-500 text-white px-1 py-1 rounded hover:bg-red-600"
                          >
                            <i className="fa fa-trash" />
                          </button> }
                          <button
                            onClick={() => navigate(`/supplier/edit/${acc._id}`)}
                            className="bg-red-500 text-white px-1 py-1 rounded hover:bg-red-600"
                          >
                            <i className="fa fa-edit" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden flex flex-col space-y-2">
              {currentPageAccounts.map((acc) => (
                <div key={acc._id} className="bg-white p-2 rounded shadow">
                  <p className="text-red-600 font-bold">Name: {acc.sellerName}</p>
                  <p>Address: {acc.sellerAddress}</p>
                  <p>Bill: ₹{(acc.totalBillAmount || 0).toFixed(2)}</p>
                  <p>Paid: ₹{(acc.paidAmount || 0).toFixed(2)}</p>
                  <p>Pending: ₹{(acc.pendingAmount || 0).toFixed(2)}</p>

                  <p className="text-purple-700">
                    BillB: ₹{(acc.totalBillPartBilled || 0).toFixed(2)}
                  </p>
                  <p className="text-green-700">
                    BillPaid: ₹{(acc.billPartPaid || 0).toFixed(2)}
                  </p>
                  <p className="text-red-700">
                    BillPend: ₹{(acc.billPartPending || 0).toFixed(2)}
                  </p>

                  <p className="text-orange-700">
                    CashB: ₹{(acc.totalCashPartBilled || 0).toFixed(2)}
                  </p>
                  <p className="text-green-700">
                    CashPaid: ₹{(acc.cashPartPaid || 0).toFixed(2)}
                  </p>
                  <p className="text-red-700">
                    CashPend: ₹{(acc.cashPartPending || 0).toFixed(2)}
                  </p>

                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleView(acc)}
                      className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                    >
                      <i className="fa fa-eye" />
                    </button>
                    <button
                      onClick={() => generatePDF(acc)}
                      className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                    >
                      <i className="fa fa-file" />
                    </button>
                   {userInfo.isSuper && <button
                      onClick={() => handleRemove(acc._id)}
                      className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                    >
                      <i className="fa fa-trash" />
                    </button> }
                    <button
                      onClick={() => navigate(`/supplier/edit/${acc._id}`)}
                      className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                    >
                      <i className="fa fa-edit" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded ${
                  currentPage === 1
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-red-500 text-white hover:bg-red-600"
                }`}
              >
                Prev
              </button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded ${
                  currentPage === totalPages
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-red-500 text-white hover:bg-red-600"
                }`}
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>

      {/* VIEW MODAL */}
      <Dialog
        open={Boolean(selectedAccount)}
        TransitionComponent={Transition}
        keepMounted
        onClose={closeModal}
        fullWidth
        maxWidth="md"
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          margin: 0,
          "& .MuiDialog-container": {
            display: "flex",
            alignItems: "flex-end"
          }
        }}
        PaperProps={{
          sx: {
            width: "100%",
            height: "80vh",
            borderTopLeftRadius: 10,
            borderTopRightRadius: 10,
            overflowY: "auto",
            boxShadow: "none"
          }
        }}
      >
        <DialogTitle sx={{ m: 0, p: 1, fontSize: "0.8rem", fontWeight: "bold" }}>
          {selectedAccount && (
            <>Supplier: {selectedAccount.sellerName || "-"}</>
          )}
          <IconButton
            aria-label="close"
            onClick={closeModal}
            sx={{
              position: "absolute",
              right: 2,
              top: 2,
              color: (theme) => theme.palette.grey[500]
            }}
            size="small"
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 1, overflowY: "auto" }}>
          {selectedAccount && (
            <div className="flex flex-col text-xs space-y-2">
              {/* Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <p><strong>ID:</strong> {selectedAccount.sellerId}</p>
                <p><strong>GST:</strong> {selectedAccount.sellerGst || "-"}</p>
                <p><strong>Total Bill:</strong> ₹{(selectedAccount.totalBillAmount || 0).toFixed(2)}</p>
                <p><strong>Paid:</strong> ₹{(selectedAccount.paidAmount || 0).toFixed(2)}</p>
                <p><strong>Pending:</strong> ₹{(selectedAccount.pendingAmount || 0).toFixed(2)}</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                <p className="text-purple-700">
                  <strong>BillB:</strong> ₹{(selectedAccount.totalBillPartBilled || 0).toFixed(2)}
                </p>
                <p className="text-green-700">
                  <strong>BillPaid:</strong> ₹{(selectedAccount.billPartPaid || 0).toFixed(2)}
                </p>
                <p className="text-red-700">
                  <strong>BillPend:</strong> ₹{(selectedAccount.billPartPending || 0).toFixed(2)}
                </p>

                <p className="text-orange-700">
                  <strong>CashB:</strong> ₹{(selectedAccount.totalCashPartBilled || 0).toFixed(2)}
                </p>
                <p className="text-green-700">
                  <strong>CashPaid:</strong> ₹{(selectedAccount.cashPartPaid || 0).toFixed(2)}
                </p>
                <p className="text-red-700">
                  <strong>CashPend:</strong> ₹{(selectedAccount.cashPartPending || 0).toFixed(2)}
                </p>
              </div>

              {/* Tab Switch */}
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => setActiveModalTab("bills")}
                  className={`px-2 py-1 rounded font-bold ${
                    activeModalTab === "bills"
                      ? "bg-red-500 text-white"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  Bills
                </button>
                <button
                  onClick={() => setActiveModalTab("billPayments")}
                  className={`px-2 py-1 rounded font-bold ${
                    activeModalTab === "billPayments"
                      ? "bg-red-500 text-white"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  Bill Part Pay
                </button>
                <button
                  onClick={() => setActiveModalTab("cashPayments")}
                  className={`px-2 py-1 rounded font-bold ${
                    activeModalTab === "cashPayments"
                      ? "bg-red-500 text-white"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  Cash Part Pay
                </button>
              </div>

              {/* BILLS TAB */}
              {activeModalTab === "bills" && (
                <div className="mt-2">
                  <div className="flex flex-wrap gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="InvoiceNo"
                      value={billsSearch}
                      onChange={(e) => setBillsSearch(e.target.value)}
                      className="border p-1 rounded w-[100px]"
                    />
                    <input
                      type="date"
                      value={billsDateFrom}
                      onChange={(e) => setBillsDateFrom(e.target.value)}
                      className="border p-1 rounded w-[120px]"
                    />
                    <input
                      type="date"
                      value={billsDateTo}
                      onChange={(e) => setBillsDateTo(e.target.value)}
                      className="border p-1 rounded w-[120px]"
                    />
                    <select
                      value={billsSortKey}
                      onChange={(e) => setBillsSortKey(e.target.value)}
                      className="border p-1 rounded"
                    >
                      <option value="invoiceDate">Date</option>
                      <option value="invoiceNo">InvoiceNo</option>
                      <option value="billAmount">Amount</option>
                    </select>
                    <select
                      value={billsSortDirection}
                      onChange={(e) => setBillsSortDirection(e.target.value)}
                      className="border p-1 rounded"
                    >
                      <option value="asc">Asc</option>
                      <option value="desc">Desc</option>
                    </select>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full text-center text-[10px] text-gray-700">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-1 py-1">#</th>
                          <th className="px-1 py-1">InvoiceNo</th>
                          <th className="px-1 py-1">Amount(₹)</th>
                          <th className="px-1 py-1">Date</th>
                          <th className="px-1 py-1">Remark</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredBills.length ? (
                          filteredBills.map((bill, i) => (
                            <tr key={i} className="border-b text-center hover:bg-gray-50">
                              <td className="px-1 py-1">{i + 1}</td>
                              <td className="px-1 py-1">{bill.invoiceNo}</td>
                              <td className="px-1 py-1">
                                ₹{bill.billAmount.toFixed(2)}
                              </td>
                              <td className="px-1 py-1">
                                {new Date(bill.invoiceDate).toLocaleDateString()}
                              </td>
                              <td className="px-1 py-1">
                                {bill.remark}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="text-center py-2 text-gray-400">
                              No bills found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* BILL PART PAYMENTS TAB */}
              {activeModalTab === "billPayments" && (
                <div className="mt-2">
                  <p className="mb-1">
                    <strong>Total Bill Part Payments:</strong>{" "}
                    <span className="text-green-600">₹{billPaymentsSum.toFixed(2)}</span>
                  </p>
                  <div className="flex flex-wrap gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Search.."
                      value={billPaySearch}
                      onChange={(e) => setBillPaySearch(e.target.value)}
                      className="border p-1 rounded w-[100px]"
                    />
                    <input
                      type="date"
                      value={billPayDateFrom}
                      onChange={(e) => setBillPayDateFrom(e.target.value)}
                      className="border p-1 rounded w-[120px]"
                    />
                    <input
                      type="date"
                      value={billPayDateTo}
                      onChange={(e) => setBillPayDateTo(e.target.value)}
                      className="border p-1 rounded w-[120px]"
                    />
                    <select
                      value={billPaySortKey}
                      onChange={(e) => setBillPaySortKey(e.target.value)}
                      className="border p-1 rounded"
                    >
                      <option value="date">Date</option>
                      <option value="method">Method</option>
                      <option value="amount">Amount</option>
                    </select>
                    <select
                      value={billPaySortDirection}
                      onChange={(e) => setBillPaySortDirection(e.target.value)}
                      className="border p-1 rounded"
                    >
                      <option value="asc">Asc</option>
                      <option value="desc">Desc</option>
                    </select>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full text-[10px] text-gray-700">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-1 py-1">#</th>
                          <th className="px-1 py-1">Amount(₹)</th>
                          <th className="px-1 py-1">Method</th>
                          <th className="px-1 py-1">Ref ID</th>
                          <th className="px-1 py-1">SubmittedBy</th>
                          <th className="px-1 py-1">Remark</th>
                          <th className="px-1 py-1">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredBillPayments.length ? (
                          filteredBillPayments.map((pay, idx) => (
                            <tr key={idx} className="border-b hover:bg-gray-50">
                              <td className="px-1 py-1">{idx + 1}</td>
                              <td
                                className={`px-1 py-1 ${
                                  pay.amount >= 0 ? "text-green-600" : "text-red-600"
                                }`}
                              >
                                ₹{pay.amount.toFixed(2)}
                              </td>
                              <td className="px-1 py-1">{pay.method}</td>
                              <td className="px-1 py-1">{pay.referenceId}</td>
                              <td className="px-1 py-1">{pay.submittedBy}</td>
                              <td className="px-1 py-1">{pay.remark || "-"}</td>
                              <td className="px-1 py-1">
                                {new Date(pay.date).toLocaleDateString()}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={7} className="text-center py-2 text-gray-400">
                              No payments found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* CASH PART PAYMENTS TAB */}
              {activeModalTab === "cashPayments" && (
                <div className="mt-2">
                  <p className="mb-1">
                    <strong>Total Cash Part Payments:</strong>{" "}
                    <span className="text-green-600">₹{cashPaymentsSum.toFixed(2)}</span>
                  </p>
                  <div className="flex flex-wrap gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Search.."
                      value={cashPaySearch}
                      onChange={(e) => setCashPaySearch(e.target.value)}
                      className="border p-1 rounded w-[100px]"
                    />
                    <input
                      type="date"
                      value={cashPayDateFrom}
                      onChange={(e) => setCashPayDateFrom(e.target.value)}
                      className="border p-1 rounded w-[120px]"
                    />
                    <input
                      type="date"
                      value={cashPayDateTo}
                      onChange={(e) => setCashPayDateTo(e.target.value)}
                      className="border p-1 rounded w-[120px]"
                    />
                    <select
                      value={cashPaySortKey}
                      onChange={(e) => setCashPaySortKey(e.target.value)}
                      className="border p-1 rounded"
                    >
                      <option value="date">Date</option>
                      <option value="method">Method</option>
                      <option value="amount">Amount</option>
                    </select>
                    <select
                      value={cashPaySortDirection}
                      onChange={(e) => setCashPaySortDirection(e.target.value)}
                      className="border p-1 rounded"
                    >
                      <option value="asc">Asc</option>
                      <option value="desc">Desc</option>
                    </select>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full text-[10px] text-gray-700">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-1 py-1">#</th>
                          <th className="px-1 py-1">Amount(₹)</th>
                          <th className="px-1 py-1">Method</th>
                          <th className="px-1 py-1">Ref ID</th>
                          <th className="px-1 py-1">SubmittedBy</th>
                          <th className="px-1 py-1">Remark</th>
                          <th className="px-1 py-1">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCashPayments.length ? (
                          filteredCashPayments.map((pay, idx) => (
                            <tr key={idx} className="border-b hover:bg-gray-50">
                              <td className="px-1 py-1">{idx + 1}</td>
                              <td
                                className={`px-1 py-1 ${
                                  pay.amount >= 0 ? "text-green-600" : "text-red-600"
                                }`}
                              >
                                ₹{pay.amount.toFixed(2)}
                              </td>
                              <td className="px-1 py-1">{pay.method}</td>
                              <td className="px-1 py-1">{pay.referenceId}</td>
                              <td className="px-1 py-1">{pay.submittedBy}</td>
                              <td className="px-1 py-1">{pay.remark || "-"}</td>
                              <td className="px-1 py-1">
                                {new Date(pay.date).toLocaleDateString()}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={7} className="text-center py-2 text-gray-400">
                              No payments found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SupplierAccountList;
