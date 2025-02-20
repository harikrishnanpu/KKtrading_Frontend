import React, { useState, useEffect, forwardRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import useAuth from "hooks/useAuth";

// ---- MUI Imports ----
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slide,
  Button,
  ClickAwayListener,
} from "@mui/material";

// ---- Transition for bottom-slide-in effect ----
const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const EmployeePaymentExpensePage = () => {
  const navigate = useNavigate();
  const { user: userInfo } = useAuth();

  const [invoiceNo, setInvoiceNo] = useState("");
  const [billingDetails, setBillingDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // For invoice suggestions
  const [suggestions, setSuggestions] = useState([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

  // Payment-related states
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentRemark, setPaymentRemark] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentDateTime, setPaymentDateTime] = useState(() => {
    // Default to current local datetime in input's value format (YYYY-MM-DDTHH:MM)
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  });

  // Remaining amount on the invoice
  const [remainingAmount, setRemainingAmount] = useState(0);

  // Expenses
  const [otherExpenses, setOtherExpenses] = useState([{ amount: 0, remark: "" }]);

  // Tab navigation
  const [activeSection, setActiveSection] = useState("Billing Details");

  // Accounts
  const [accounts, setAccounts] = useState([]);

  // For success & error modals
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // -------------------------
  //   FETCH ACCOUNTS
  // -------------------------
  useEffect(() => {
    const fetchAccounts = async () => {
      setIsLoading(true);
      try {
        const response = await api.get("/api/accounts/allaccounts");
        const getPaymentMethod = response.data.map((acc) => acc.accountId);

        if (getPaymentMethod.length > 0) {
          // default to first account
          const firstAccountId = getPaymentMethod[0];
          setPaymentMethod(firstAccountId);
        } else {
          setPaymentMethod(null);
        }

        setAccounts(response.data);
      } catch (err) {
        setErrorMessage("Failed to fetch payment accounts.");
        setShowErrorModal(true);
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAccounts();
  }, []);

  // -------------------------
  //   FETCH SUGGESTIONS
  // -------------------------
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (invoiceNo.trim()) {
        try {
          const response = await api.get(
            `/api/billing/billing/suggestions?search=${invoiceNo.trim()}`
          );
          setSuggestions(response.data);
        } catch (error) {
          console.error("Error fetching suggestions:", error);
        }
      } else {
        setSuggestions([]);
      }
    };

    fetchSuggestions();
  }, [invoiceNo]);

  // -------------------------
  //   GET BILLING DETAILS
  // -------------------------
  const handleFetchBilling = async (id) => {
    if (!invoiceNo) {
      setErrorMessage("Please enter an invoice number.");
      setShowErrorModal(true);
      return;
    }
    setIsLoading(true);
    try {
      const response = await api.get(`/api/billing/${id}`);
      const data = response.data;
      setBillingDetails(data);

      // Calculate remaining amount
      const totalPaid = data.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
      const invoiceRemaining = (data.grandTotal || 0) - totalPaid;
      setRemainingAmount(invoiceRemaining);

    } catch (error) {
      console.error("Error fetching billing data:", error);
      setErrorMessage("Error fetching billing data. Please check the invoice number.");
      setShowErrorModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------------
  //   ADD PAYMENT
  // -------------------------
  const handleAddPayment = async () => {
    if (!billingDetails) return;
    if (!paymentAmount || !paymentMethod) {
      setErrorMessage("Please enter a valid payment amount and method.");
      setShowErrorModal(true);
      return;
    }

    const parsedDate = new Date(paymentDateTime);
    if (isNaN(parsedDate.getTime())) {
      setErrorMessage("Please select a valid payment date and time.");
      setShowErrorModal(true);
      return;
    }

    setIsLoading(true);
    try {
      const updatedPaymentStatus =
        Number(paymentAmount) >= billingDetails.grandTotal
          ? "Paid"
          : Number(paymentAmount) > 0
          ? "Partial"
          : "Pending";

      await api.post("/api/users/billing/update-payment", {
        invoiceNo: billingDetails.invoiceNo,
        paymentAmount,
        paymentMethod,
        paymentStatus: updatedPaymentStatus,
        paymentRemark,
        userId: userInfo._id,
        date: parsedDate, // send the selected date/time
      });

      // Refresh the billing details
      await handleFetchBilling(billingDetails._id);

      // Reset fields
      setPaymentAmount("");
      setPaymentRemark("");
      setPaymentMethod(accounts.length > 0 ? accounts[0].accountId : "");
      setShowSuccessModal(true);
      setActiveSection("Billing Details");
    } catch (error) {
      console.error("Error adding payment:", error);
      setErrorMessage("Error adding payment. Please try again.");
      setShowErrorModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------------
  //   DELETE EXPENSE
  //   (Top-level only)
  // -------------------------
  const handleDeleteExpense = async (expenseId) => {
    if (!billingDetails) return;
    setIsLoading(true);
    try {
      await api.delete(
        `/api/billing/billing/${billingDetails._id}/deleteExpense/${expenseId}`
      );
      // Refresh billing details after deletion
      await handleFetchBilling(billingDetails._id);
    } catch (error) {
      console.error("Error deleting expense:", error);
      setErrorMessage("Error deleting expense. Please try again.");
      setShowErrorModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------------
  //   ADD OTHER EXPENSES
  //   (Top-level only)
  // -------------------------
  const handleAddExpenses = async () => {
    if (!billingDetails) return;

    // Validate otherExpenses
    const validOtherExpenses = Array.isArray(otherExpenses)
      ? otherExpenses.filter((expense) => expense.amount > 0 && expense.remark)
      : [];

    if (validOtherExpenses.length === 0) {
      setErrorMessage("Please enter at least one expense with an amount and remark.");
      setShowErrorModal(true);
      return;
    }

    setIsLoading(true);
    try {
      await api.post(`/api/billing/billing/${billingDetails._id}/addExpenses`, {
        otherExpenses: validOtherExpenses,
        userId: userInfo._id,
        paymentMethod,
      });

      await handleFetchBilling(billingDetails._id);

      // Reset the expense input fields
      setOtherExpenses([{ amount: 0, remark: "" }]);
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Error adding expenses:", error);
      setErrorMessage("Error adding expenses.");
      setShowErrorModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------------
  //   HANDLERS
  // -------------------------
  const handleOtherExpensesChange = (index, field, value) => {
    const updatedExpenses = [...otherExpenses];
    updatedExpenses[index][field] =
      field === "amount" ? parseFloat(value) || 0 : value;
    setOtherExpenses(updatedExpenses);
  };

  const handleAddExpense = () => {
    setOtherExpenses([...otherExpenses, { amount: 0, remark: "" }]);
  };

  const handleSuggestionClick = (suggestion) => {
    setInvoiceNo(suggestion.invoiceNo);
    setSuggestions([]);
    handleFetchBilling(suggestion._id);
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      setSelectedSuggestionIndex((prevIndex) =>
        prevIndex < suggestions.length - 1 ? prevIndex + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      setSelectedSuggestionIndex((prevIndex) =>
        prevIndex > 0 ? prevIndex - 1 : suggestions.length - 1
      );
    } else if (e.key === "Enter" && selectedSuggestionIndex >= 0) {
      handleSuggestionClick(suggestions[selectedSuggestionIndex]);
    }
  };

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
  };

  const closeErrorModal = () => {
    setShowErrorModal(false);
    setErrorMessage("");
  };

  // Helper to get account name from ID
  const getAccountName = (accountId) => {
    const matched = accounts.find((acc) => acc.accountId === accountId);
    return matched ? matched.accountName : accountId;
  };

  // -------------------------
  //   RENDER
  // -------------------------
  return (
    <div className="p-3 min-h-screen">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed  inset-0 z-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
        </div>
      )}

      {/* Top Navigation for Sections */}
      <div className="flex justify-center gap-4 mb-6 flex-wrap">
        {["Billing Details", "Payment Section", "Expense Section", "Previous Payments"].map(
          (section) => (
            <button
              key={section}
              className={`font-bold text-xs focus:outline-none relative pb-2 transition-all duration-300 ${
                activeSection === section
                  ? "text-red-600 border-b-2 border-red-600"
                  : "text-gray-600"
              }`}
              onClick={() => setActiveSection(section)}
            >
              {section}
              {activeSection === section && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-red-600 transition-all duration-300"></span>
              )}
            </button>
          )
        )}
      </div>

      <div className="flex flex-col justify-center items-center">
        <div className="bg-white shadow-xl rounded-lg w-full max-w-2xl p-4">
          {/* If no billingDetails, show search input & suggestions */}
          {!billingDetails && (
            <div className="mb-4">
              <div className="relative w-full">
                <label className="font-bold text-xs text-gray-500">Invoice No.</label>
                <input
                  type="text"
                  placeholder="Enter Invoice Number"
                  value={invoiceNo}
                  onKeyDown={handleKeyDown}
                  onChange={(e) => setInvoiceNo(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-red-200 focus:ring-red-500 text-xs"
                />
                <i
                  onClick={() => setInvoiceNo("")}
                  className="fa fa-chevron-down absolute cursor-pointer right-3 bottom-3 text-gray-400"
                ></i>
              </div>
            </div>
          )}

          {!billingDetails && suggestions.length > 0 && (
            <ul className="bg-white divide-y shadow-lg rounded-md overflow-hidden mb-4 border border-gray-300">
              {suggestions.map((suggestion, index) => (
                <li
                  key={suggestion._id}
                  className={`p-4 cursor-pointer hover:bg-gray-100 flex justify-between ${
                    index === selectedSuggestionIndex ? "bg-gray-200" : ""
                  }`}
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <span className="font-bold text-xs text-gray-500">
                    {suggestion.invoiceNo}
                  </span>
                  <i className="fa fa-arrow-right text-gray-300" />
                </li>
              ))}
            </ul>
          )}

          {/* Main Content once billingDetails is fetched */}
          {billingDetails && (
            <div>
              {/* ------------------------- */}
              {/*  Billing Details Section  */}
              {/* ------------------------- */}
              {activeSection === "Billing Details" && (
                <div>
                  <div className="mt-4 border-b pb-4 flex justify-between items-center relative">
                    <h5 className="mb-2 text-2xl ml-2 font-bold tracking-tight text-gray-900">
                      {billingDetails.invoiceNo}
                    </h5>

                    {/* Payment Status Badge */}
                    <p
                      className={`mt-auto mr-2 mb-auto py-2 w-32 text-center ml-auto rounded-full text-xs font-bold shadow-md transition-all duration-300 ease-in-out transform ${
                        billingDetails.paymentStatus === "Paid"
                          ? "text-green-600 bg-green-200 hover:bg-green-300 hover:scale-105"
                          : billingDetails.paymentStatus === "Partial"
                          ? "text-yellow-600 bg-yellow-200 hover:bg-yellow-300 hover:scale-105"
                          : "text-red-600 bg-red-200 hover:bg-red-300 hover:scale-105"
                      }`}
                    >
                      {billingDetails.paymentStatus}
                    </p>
                  </div>

                  {/* Basic Info */}
                  <div className="flex-col pt-3">
                    <p className="mt-1 text-xs font-bold text-gray-600">
                      Customer: {billingDetails.customerName}
                    </p>
                    <p className="mt-1 text-xs font-normal text-gray-700">
                      Exp. Delivery Date:{" "}
                      {new Date(billingDetails.expectedDeliveryDate).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex justify-between mt-1">
                    <p className="text-xs text-gray-600">
                      Customer Address:{" "}
                      <span className="font-bold text-gray-500">
                        {billingDetails.customerAddress}
                      </span>
                    </p>
                  </div>

                  {/* Financial Summary */}
                  <div className="mt-4 bg-gray-50 p-3 mb-4 rounded-lg">
                    <div className="flex text-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-gray-600">
                          Grand Total
                        </span>
                        <span className="text-sm font-bold text-gray-800">
                          {billingDetails.grandTotal?.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-gray-600">
                          Received
                        </span>
                        <span className="text-sm font-bold text-green-600">
                          {billingDetails.billingAmountReceived?.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-gray-600">
                          Remaining
                        </span>
                        <span className="text-sm font-bold text-red-600">
                          {remainingAmount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Fuel & Expenses Summaries */}
                  <div className="mt-4 bg-gray-50 p-3 mb-4 rounded-lg">
                    <div className="flex text-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-gray-600">
                          Total Fuel Charge
                        </span>
                        <span className="text-sm font-bold text-gray-800">
                          {billingDetails.totalFuelCharge?.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-gray-600">
                          Total Other Exp
                        </span>
                        <span className="text-sm font-bold text-gray-800">
                          {billingDetails.totalOtherExpenses?.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Summary */}
                  <div className="mt-4 border-t space-y-2 border-gray-200 pt-4">
                    <h4 className="text-md font-bold text-gray-700">Payment Summary</h4>
                    <p className="text-xs mt-2 text-gray-500 font-semibold">
                      Total Payments In:{" "}
                      {(
                        billingDetails.payments?.reduce(
                          (sum, payment) => sum + payment.amount,
                          0
                        ) || 0
                      ).toFixed(2)}
                    </p>
                    <p className="text-xs mt-1 text-gray-500 font-semibold">
                      Net Balance (In - Expenses):{" "}
                      {(
                        (billingDetails.payments?.reduce(
                          (sum, payment) => sum + payment.amount,
                          0
                        ) || 0) -
                        (billingDetails.otherExpenses?.reduce(
                          (sum, expense) => sum + expense.amount,
                          0
                        ) || 0) -
                        // Also minus the deliveries' other expenses if you'd like
                        0
                      ).toFixed(2)}
                    </p>
                  </div>
                </div>
              )}

              {/* ------------------------- */}
              {/*  Payment Section         */}
              {/* ------------------------- */}
              {activeSection === "Payment Section" && (
                <div className="mt-6 pt-4">
                  <h3 className="text-md font-bold text-gray-600 mb-2">Add Payment</h3>
                  <div className="flex flex-col gap-4">
                    <p className="mt-1 text-xs font-medium text-gray-600">
                      Remaining Amount:{" "}
                      <span className="font-bold text-red-500">
                        {remainingAmount.toFixed(2)}
                      </span>
                    </p>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">
                        Payment Amount
                      </label>
                      <input
                        type="number"
                        value={paymentAmount}
                        onChange={(e) =>
                          setPaymentAmount(
                            Math.min(Number(e.target.value), remainingAmount)
                          )
                        }
                        className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">
                        Payment Remark
                      </label>
                      <input
                        type="text"
                        value={paymentRemark}
                        onChange={(e) => setPaymentRemark(e.target.value)}
                        className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">
                        Payment Method
                      </label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                      >
                        {accounts.map((acc) => (
                          <option key={acc.accountId} value={acc.accountId}>
                            {acc.accountName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">
                        Payment Date & Time
                      </label>
                      <input
                        type="datetime-local"
                        value={paymentDateTime}
                        onChange={(e) => setPaymentDateTime(e.target.value)}
                        className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                      />
                    </div>
                    <button
                      className="bg-red-500 text-white font-bold text-xs px-4 py-3 rounded-lg mt-4 hover:bg-red-600 transition"
                      onClick={handleAddPayment}
                      disabled={isLoading}
                    >
                      Submit Payment
                    </button>
                  </div>
                </div>
              )}

              {/* ------------------------- */}
              {/*  Expense Section         */}
              {/* ------------------------- */}
              {activeSection === "Expense Section" && (
                <div className="mt-6 pt-4">
                  <h3 className="text-md font-bold text-gray-600 mb-2">Add Expenses</h3>
                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">
                        Payment Method
                      </label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                      >
                        {accounts.map((acc) => (
                          <option key={acc.accountId} value={acc.accountId}>
                            {acc.accountName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="mt-4">
                      <h3 className="text-xs font-bold text-gray-500 mb-1">
                        Add Other Expenses
                      </h3>
                      {otherExpenses?.map((expense, index) => (
                        <div key={index} className="flex gap-2 mb-2">
                          <input
                            type="number"
                            value={expense.amount}
                            onChange={(e) =>
                              handleOtherExpensesChange(index, "amount", e.target.value)
                            }
                            placeholder="Amount"
                            className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                          />
                          <input
                            type="text"
                            value={expense.remark}
                            onChange={(e) =>
                              handleOtherExpensesChange(index, "remark", e.target.value)
                            }
                            placeholder="Remark"
                            className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                          />
                        </div>
                      ))}
                      <button
                        onClick={handleAddExpense}
                        className="text-xs font-bold text-blue-500 hover:text-blue-700 mt-2"
                      >
                        + Add Expense
                      </button>
                    </div>
                    <button
                      className="bg-red-500 text-white font-bold text-xs px-4 py-3 rounded-lg mt-4 hover:bg-red-600 transition"
                      onClick={handleAddExpenses}
                      disabled={isLoading}
                    >
                      Submit Expenses
                    </button>
                  </div>
                </div>
              )}

              {/* ------------------------- */}
              {/*  Previous Payments       */}
              {/* ------------------------- */}
              {activeSection === "Previous Payments" && (
                <div className="mt-6">
                  <h3 className="text-md font-bold text-gray-600 mb-2">
                    Previous Payments
                  </h3>
                  {/* List of payments */}
                  <ul className="divide-y divide-gray-200 mb-4">
                    {billingDetails.payments?.map((payment, index) => (
                      <li key={index} className="py-2 text-xs flex flex-col">
                        <span className="text-sm text-gray-700 font-semibold">
                          {getAccountName(payment.method)}: {payment.amount.toFixed(2)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(payment.date).toLocaleString()}
                        </span>
                        {payment.remark && (
                          <span className="text-[10px] italic text-gray-400">
                            {payment.remark}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>

                  {/* Top-Level Other Expenses */}
                  <div className="mt-4">
                    <h4 className="text-sm font-bold text-gray-600 mb-2">
                      Billing Other Expenses
                    </h4>
                    <ul className="divide-y divide-gray-200 text-xs">
                      {billingDetails.otherExpenses?.map((expense) => (
                        <li
                          key={expense._id}
                          className="py-2 flex justify-between items-center"
                        >
                          <div>
                            <p className="text-sm text-gray-700 font-semibold">
                              {expense.amount.toFixed(2)} - {expense.remark}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(expense.date).toLocaleString()}
                            </p>
                            {/* Show method as account name if it exists */}
                            {expense.method && (
                              <p className="text-[10px] text-gray-400 italic">
                                {getAccountName(expense.method)}
                              </p>
                            )}
                          </div>
                          {/* Delete button for top-level expenses only */}
                          <button
                            className="text-xs text-red-500 hover:text-red-700"
                            onClick={() => handleDeleteExpense(expense._id)}
                          >
                            <i className="fa fa-trash" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Delivery-Level Other Expenses */}
                  <div className="mt-4">
                    <h4 className="text-sm font-bold text-gray-600 mb-2">
                      Delivery Expenses
                    </h4>
                    {billingDetails.deliveries?.map((delivery) => (
                      <div key={delivery.deliveryId} className="mb-4">
                        <h5 className="text-xs font-bold text-gray-500 mb-1">
                          Delivery ID: {delivery.deliveryId}
                        </h5>
                        <ul className="divide-y divide-gray-200 text-xs">
                          {delivery.otherExpenses?.map((expense) => (
                            <li
                              key={expense._id}
                              className="py-2 flex justify-between items-center"
                            >
                              <div>
                                <p className="text-sm text-gray-700 font-semibold">
                                  {expense.amount.toFixed(2)} - {expense.remark}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {new Date(expense.date).toLocaleString()}
                                </p>
                                {expense.method && (
                                  <p className="text-[10px] text-gray-400 italic">
                                    {getAccountName(expense.method)}
                                  </p>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>

                  {/* Total Other Expenses */}
                  <div className="mt-4 border-t border-gray-200 pt-4 text-xs">
                    <p className="text-sm text-gray-800 font-semibold">
                      Total Other Expenses:{" "}
                      {billingDetails.totalOtherExpenses?.toFixed(2)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ------------------------- */}
      {/*   Success Dialog (MUI)   */}
      {/* ------------------------- */}
      <Dialog
        open={showSuccessModal}
        onClose={closeSuccessModal}
        TransitionComponent={Transition}
        keepMounted
        hideBackdrop
        PaperProps={{
          style: {
            position: "fixed",
            bottom: 0,
            margin: 0,
            width: "100%",
            borderRadius: "8px 8px 0 0",
          },
        }}
        // We use ClickAwayListener to close on outside click
        // but we wrap the inside content, so outside of that content closes the dialog
      >
        <ClickAwayListener onClickAway={closeSuccessModal}>
          <div>
            <DialogTitle className="text-center font-bold text-gray-600">
              Update Successful
            </DialogTitle>
            <DialogContent>
              <p className="text-xs italic text-gray-400 mt-1 mb-2 text-center">
                Successfully updated the billing information.
              </p>
            </DialogContent>
            <DialogActions>
              <div className="w-full flex justify-center pb-2">
                <Button
                  variant="outlined"
                  color="success"
                  size="small"
                  onClick={closeSuccessModal}
                >
                  OK
                </Button>
              </div>
            </DialogActions>
          </div>
        </ClickAwayListener>
      </Dialog>

      {/* ------------------------- */}
      {/*   Error Dialog (MUI)     */}
      {/* ------------------------- */}
      <Dialog
        open={showErrorModal}
        onClose={closeErrorModal}
        TransitionComponent={Transition}
        keepMounted
        hideBackdrop
        PaperProps={{
          style: {
            position: "fixed",
            bottom: 0,
            margin: 0,
            width: "100%",
            borderRadius: "8px 8px 0 0",
          },
        }}
      >
        <ClickAwayListener onClickAway={closeErrorModal}>
          <div>
            <DialogTitle className="text-center font-bold text-red-500">
              Error
            </DialogTitle>
            <DialogContent>
              <p className="text-xs italic text-gray-400 mt-1 mb-2 text-center">
                {errorMessage}
              </p>
            </DialogContent>
            <DialogActions>
              <div className="w-full flex justify-center pb-2">
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  onClick={closeErrorModal}
                >
                  Close
                </Button>
              </div>
            </DialogActions>
          </div>
        </ClickAwayListener>
      </Dialog>
    </div>
  );
};

export default EmployeePaymentExpensePage;
