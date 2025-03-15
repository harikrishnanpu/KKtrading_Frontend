// src/screens/EditSellerPaymentPage.js
import React, { useState, useEffect, useRef, forwardRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api"; // Adjust the import path as necessary
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import useAuth from "hooks/useAuth";

// MUI Imports for Dialog Modal
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Slide from "@mui/material/Slide";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import CloseIcon from "@mui/icons-material/Close";

const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const EditSellerPaymentPage = () => {
  const [sellerName, setSellerName] = useState("");
  const [supplierDetails, setSupplierDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [remark, setRemark] = useState("");
  const [remarkType, setRemarkType] = useState("CASH"); // "CASH" or "BILL"
  const [remainingAmount, setRemainingAmount] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [addPaymentModal, setAddPaymentModal] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const navigate = useNavigate();
  const { user: userInfo } = useAuth();

  const sellerNameRef = useRef();

  // Fetch Payment Accounts on mount
  useEffect(() => {
    const fetchAccounts = async () => {
      setIsLoading(true);
      try {
        const response = await api.get("/api/accounts/allaccounts");
        const getPaymentMethod = response.data.map((acc) => acc.accountId);
        if (getPaymentMethod.length > 0) {
          setPaymentMethod(getPaymentMethod[0]);
        } else {
          setPaymentMethod(null);
        }
        setAccounts(response.data);
      } catch (err) {
        setErrorMessage("Failed to fetch payment accounts.");
        setShowErrorModal(true);
        setTimeout(() => setShowErrorModal(false), 3000);
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAccounts();
  }, []);

  // Fetch Suggestions for Seller Name (still calling them "seller" for consistency)
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (sellerName) {
        try {
          const response = await api.get(
            `/api/sellerpayments/suggestions?search=${sellerName}`
          );
          setSuggestions(response.data);
        } catch (error) {
          console.error("Error fetching suggestions:", error);
        }
      } else {
        setSuggestions([]);
      }
    };

    const debounceFetch = setTimeout(() => {
      fetchSuggestions();
    }, 300);

    return () => clearTimeout(debounceFetch);
  }, [sellerName]);

  // Fetch Supplier Details based on selected suggestion
  const handleFetchSupplierDetails = async (id) => {
    setIsLoading(true);
    try {
      const response = await api.get(`/api/sellerpayments/get-seller/${id}`);
      if (!response.data) {
        throw new Error("Invalid supplier response");
      }
      setSupplierDetails(response.data);
      setRemainingAmount(response.data.totalPendingAmount ?? 0);
    } catch (error) {
      console.error("Error fetching supplier:", error);
      setErrorMessage("Error fetching supplier details.");
      setShowErrorModal(true);
      setTimeout(() => setShowErrorModal(false), 3000);
    } finally {
      setIsLoading(false);
    }
  };
  

  // Handle Add Payment action
  const handleAddPayment = async () => {
    if (!supplierDetails) return;
    if (!paymentAmount || !paymentMethod || !paymentDate) {
      setErrorMessage("Please enter a valid payment amount, method, and date.");
      setShowErrorModal(true);
      setTimeout(() => setShowErrorModal(false), 3000);
      return;
    }
    if (Number(paymentAmount) <= 0) {
      setErrorMessage("Payment amount must be greater than zero.");
      setShowErrorModal(true);
      setTimeout(() => setShowErrorModal(false), 3000);
      return;
    }
    if (Number(paymentAmount) > remainingAmount) {
      setErrorMessage("Payment amount cannot exceed the remaining amount.");
      setShowErrorModal(true);
      setTimeout(() => setShowErrorModal(false), 3000);
      return;
    }
    setIsLoading(true);
    try {
      // Build final remark based on the selected type (CASH or BILL)
      // (Drop-down label says "CASHPART/BILLPART," but actual value is "CASH"/"BILL".)
      const finalRemark = `${remarkType}: ${remark}`;

      // Endpoint may remain the same if your backend hasn't changed for adding payments
      await api.post(`/api/sellerpayments/add-payments/${supplierDetails._id}`, {
        amount: Number(paymentAmount),
        method: paymentMethod,
        remark: finalRemark,
        date: paymentDate,
        userId: userInfo._id,
        sellerId: supplierDetails.sellerId,
        sellerName: supplierDetails.sellerName,
      });

      // Re-fetch updated details
     await  handleFetchSupplierDetails(supplierDetails._id);

      // Reset form fields
      setPaymentAmount("");
      setPaymentMethod(accounts.length ? accounts[0].accountId : "");
      setPaymentDate("");
      setRemark("");
      setRemarkType("CASH");
      setErrorMessage("");

      // Show success message
      setSuccessMessage("Payment added successfully!");
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 3000);
      setAddPaymentModal(false);
    } catch (error) {
      console.error("Error adding payment:", error);
      setErrorMessage("Error adding payment. Please try again.");
      setShowErrorModal(true);
      setTimeout(() => setShowErrorModal(false), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setSellerName(suggestion.sellerName);
    setSuggestions([]);
    handleFetchSupplierDetails(suggestion._id);
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

  // Shortcuts for pending amounts if needed
  const cashPartPending =
  supplierDetails?.totalCashPart && supplierDetails?.totalCashPartGiven
    ? supplierDetails.totalCashPart - supplierDetails.totalCashPartGiven
    : 0;

const billPartPending =
  supplierDetails?.totalBillPart && supplierDetails?.totalBillPartGiven
    ? supplierDetails.totalBillPart - supplierDetails.totalBillPartGiven
    : 0;


  return (
    <div className="p-2">
      {/* Navigation Tabs */}
      <div className="flex justify-center gap-8">
        <button
          className={`font-bold text-xs focus:outline-none relative pb-2 transition-all duration-300 ${
            activeSection === "home"
              ? "text-red-600 border-b-2 border-red-600"
              : "text-gray-600"
          }`}
          onClick={() => setActiveSection("home")}
        >
          Home
          {activeSection === "home" && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-red-600 transition-all duration-300"></span>
          )}
        </button>
        <button
          className={`font-bold text-xs focus:outline-none relative pb-2 transition-all duration-300 ${
            activeSection === "prevPayments"
              ? "text-red-600 border-b-2 border-red-600"
              : "text-gray-600"
          }`}
          onClick={() => setActiveSection("prevPayments")}
        >
          Previous payments
          {activeSection === "prevPayments" && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-red-600 transition-all duration-300"></span>
          )}
        </button>
      </div>

      <div className="flex flex-col justify-center items-center p-2">
        <div className="bg-white shadow-xl rounded-lg w-full max-w-lg p-4">
          {/* Seller Name Input & Suggestions */}
          {!supplierDetails && (
            <>
              <div className="mb-4">
                <div className="relative w-full">
                  <label className="font-bold text-xs text-gray-500">
                    Supplier Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter Supplier Name"
                    value={sellerName}
                    onKeyDown={handleKeyDown}
                    onChange={(e) => setSellerName(e.target.value)}
                    ref={sellerNameRef}
                    className="w-full p-2 pr-8 focus:outline-none focus:border-red-300 focus:ring-red-300 border-gray-300 rounded-md text-xs"
                  />
                  <i
                    onClick={() => setSellerName(" ")}
                    className="fa fa-angle-down absolute right-3 bottom-0 transform -translate-y-1/2 text-gray-400 cursor-pointer"
                  ></i>
                </div>
              </div>
              {suggestions.length > 0 && (
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
                        {suggestion.sellerName}
                      </span>
                      <i className="fa fa-arrow-right text-gray-300" />
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          {/* Supplier Details & Payment Summary */}
          {isLoading ? (
            <div>
              <Skeleton height={30} count={1} />
              <Skeleton height={20} count={3} style={{ marginTop: "10px" }} />
            </div>
          ) : (
            supplierDetails && (
              <>
                {activeSection === "home" && (
                  <div className="mt-4">
                    {/* Supplier Header and Payment Status Badge */}
                    <div className="border-b pb-4 flex justify-between items-center relative">
                      <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900">
                        {supplierDetails.sellerName}
                      </h5>
                      {(() => {
                        // Payment status logic using totalPendingAmount & paidAmount
                        let paymentStatus = "";
                        let paymentStatusClass = "";
                        const { totalPendingAmount, paidAmount } = supplierDetails;

                        if (totalPendingAmount === 0) {
                          paymentStatus = "Paid";
                          paymentStatusClass =
                            "text-green-600 bg-green-200 hover:bg-green-300 hover:scale-105";
                        } else if (paidAmount === 0 && totalPendingAmount > 0) {
                          paymentStatus = "Unpaid";
                          paymentStatusClass =
                            "text-red-600 bg-red-200 hover:bg-red-300 hover:scale-105";
                        } else if (totalPendingAmount > 0 && paidAmount > 0) {
                          paymentStatus = "Partial";
                          paymentStatusClass =
                            "text-yellow-600 bg-yellow-200 hover:bg-yellow-300 hover:scale-105";
                        }

                        return (
                          <p
                            className={`mt-auto mr-2 mb-auto py-2 w-40 text-center ml-auto rounded-full text-xs font-bold z-20 shadow-md transition-all duration-300 ease-in-out transform ${paymentStatusClass}`}
                          >
                            Payment: {paymentStatus}
                          </p>
                        );
                      })()}
                    </div>

                    {/* Billing Summary */}
                    <div className="flex justify-between mt-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-gray-600">
                          Total Billed Amount:
                        </span>
                        {/* 
                          Previously: totalAmountBilled 
                          Now you can show combined total: 
                          totalBillAmount + totalCashPart 
                        */}
                        <span className="text-sm font-bold text-gray-800">
                          ₹
                          {(
                            supplierDetails.totalBillAmount +
                            supplierDetails.totalCashPart
                          ).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-gray-600">
                          Paid Amount:
                        </span>
                        <span className="text-sm font-bold text-green-600">
                          ₹{supplierDetails.paidAmount.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-gray-600">
                          Remaining Amount:
                        </span>
                        <span className="text-sm font-bold text-red-600">
                          ₹{supplierDetails.totalPendingAmount.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Responsive Cards for Totals, Given & Pending */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
                      {/* Billed amounts in grey */}
                      <div className="bg-white shadow-md rounded-lg p-4">
                        <div className="text-xs text-gray-500">Bill Part Billed</div>
                        <div className="text-lg font-bold text-gray-700">
                          ₹{supplierDetails.totalBillPart.toFixed(2)}
                        </div>
                      </div>
                      <div className="bg-white shadow-md rounded-lg p-4">
                        <div className="text-xs text-gray-500">Cash Part Billed</div>
                        <div className="text-lg font-bold text-gray-700">
                          ₹{supplierDetails.totalCashPart.toFixed(2)}
                        </div>
                      </div>
                      {/* Given amounts in green */}
                      <div className="bg-white shadow-md rounded-lg p-4">
                        <div className="text-xs text-gray-500">Bill Part Given</div>
                        <div className="text-lg font-bold text-green-600">
                          ₹{supplierDetails.totalBillPartGiven.toFixed(2)}
                        </div>
                      </div>
                      <div className="bg-white shadow-md rounded-lg p-4">
                        <div className="text-xs text-gray-500">Cash Part Given</div>
                        <div className="text-lg font-bold text-green-600">
                          ₹{supplierDetails.totalCashPartGiven.toFixed(2)}
                        </div>
                      </div>
                      {/* Pending amounts in yellow */}
                      <div className="bg-white shadow-md rounded-lg p-4">
                        <div className="text-xs text-gray-500">Bill Part Pending</div>
                        <div className="text-lg font-bold text-yellow-600">
                          ₹
                          {(
                            supplierDetails.totalBillPart -
                            supplierDetails.totalBillPartGiven
                          ).toFixed(2)}
                        </div>
                      </div>
                      <div className="bg-white shadow-md rounded-lg p-4">
                        <div className="text-xs text-gray-500">Cash Part Pending</div>
                        <div className="text-lg font-bold text-yellow-600">
                          ₹
                          {(
                            supplierDetails.totalCashPart -
                            supplierDetails.totalCashPartGiven
                          ).toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {/* Add Payment Button */}
                    <div className="mt-6">
                      <button
                        className="bg-blue-500 text-white font-bold text-xs px-4 py-2 rounded-lg"
                        onClick={() => setAddPaymentModal(true)}
                      >
                        Add Payment
                      </button>
                    </div>

                    {/* Bills Section (replaces "billings") */}
                    <div className="mt-6">
                      <h3 className="text-md font-bold text-gray-600 mb-2">
                        Bills
                      </h3>
                      {(!supplierDetails.bills || supplierDetails.bills.length === 0) ? (
                        <p className="text-xs text-gray-500">No bills found.</p>
                      ) : (
                        <div className="grid grid-cols-1 gap-4">
                          {supplierDetails.bills.map((bill, index) => (
                            <div
                              key={index}
                              className="bg-white shadow-md rounded-lg p-4 flex justify-between items-center"
                            >
                              <div>
                                <p className="text-sm text-gray-700 font-semibold">
                                  Invoice No: {bill.invoiceNo}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Amount: ₹{bill.billAmount.toFixed(2)}
                                </p>
                                {bill.cashPart ? (
                                  <p className="text-xs text-gray-500">
                                    Cash Part: ₹{bill.cashPart.toFixed(2)}
                                  </p>
                                ) : null}
                                {bill.remark && (
                                  <p className="text-xs text-gray-500">
                                    Remark: {bill.remark}
                                  </p>
                                )}
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">
                                  {new Date(bill.invoiceDate).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeSection === "prevPayments" && (
                  <div className="mt-6">
                    <h3 className="text-md font-bold text-gray-600 mb-2">
                      Payments
                    </h3>
                    {(!supplierDetails.payments ||
                      supplierDetails.payments.length === 0) ? (
                      <p className="text-xs text-gray-500">No payments made yet.</p>
                    ) : (
                      <div className="grid grid-cols-1 gap-4">
                        {supplierDetails.payments.map((payment, index) => {
                          // Lookup account name by comparing payment.method (accountId) with accounts list
                          const account = accounts.find(
                            (acc) => acc.accountId === payment.method
                          );
                          const accountName = account
                            ? account.accountName
                            : payment.method;
                          return (
                            <div
                              key={index}
                              className="bg-white shadow-md rounded-lg p-4 flex justify-between items-center"
                            >
                              <div>
                                <p className="text-sm text-gray-700 font-semibold">
                                  {accountName}: ₹{payment.amount.toFixed(2)}
                                </p>
                                {payment.remark && (
                                  <p className="text-xs text-gray-500">
                                    Remark: {payment.remark}
                                  </p>
                                )}
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">
                                  {new Date(payment.date).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </>
            )
          )}

          {/* Error and Success Alerts */}
          {showErrorModal && (
            <div className="fixed top-4 right-4 bg-red-500 text-white p-3 rounded-md shadow-md animate-slideIn">
              <p className="text-xs">{errorMessage}</p>
            </div>
          )}
          {showSuccessModal && (
            <div className="fixed top-4 right-4 bg-green-500 text-white p-3 rounded-md shadow-md animate-slideIn">
              <p className="text-xs">{successMessage}</p>
            </div>
          )}

          {/* Add Payment Modal using MUI Dialog */}
          <Dialog
            open={addPaymentModal}
            TransitionComponent={Transition}
            keepMounted
            onClose={() => setAddPaymentModal(false)}
            PaperProps={{
              style: {
                position: "fixed",
                bottom: 0,
                margin: 0,
                width: "100%",
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
              },
            }}
            fullWidth
            maxWidth="sm"
          >
            <DialogTitle>
              Add Payment
              <IconButton
                aria-label="close"
                onClick={() => setAddPaymentModal(false)}
                sx={{
                  position: "absolute",
                  right: 8,
                  top: 8,
                }}
              >
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">
                    Payment Amount
                  </label>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) =>
                      setPaymentAmount(
                        e.target.value > remainingAmount
                          ? remainingAmount
                          : e.target.value
                      )
                    }
                    max={remainingAmount}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-red-300 focus:ring-red-300 text-xs"
                    placeholder={`Max: ₹${remainingAmount.toFixed(2)}`}
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
                    Payment Date
                  </label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-red-300 focus:ring-red-300 text-xs"
                  />
                </div>
                {/* New Select input for remark type */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">
                    Remark Type
                  </label>
                  <select
                    value={remarkType}
                    onChange={(e) => setRemarkType(e.target.value)}
                    className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                  >
                    {/* The displayed text is CASHPART/BILLPART, 
                        the actual value is "CASH"/"BILL" */}
                    <option value="CASH">CASHPART</option>
                    <option value="BILL">BILLPART</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">
                    Custom Remark
                  </label>
                  <input
                    type="text"
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-red-300 focus:ring-red-300 text-xs"
                    placeholder="Enter remark (optional)"
                  />
                </div>
              </div>
            </DialogContent>
            <DialogActions>
              <Button
                onClick={handleAddPayment}
                variant="outlined"
                color="primary"
                disabled={isLoading}
              >
                Submit Payment
              </Button>
            </DialogActions>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default EditSellerPaymentPage;
