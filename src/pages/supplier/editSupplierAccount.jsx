import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import useAuth from 'hooks/useAuth';

const SupplierAccountEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [sellerId, setsellerId] = useState('');
  const [sellerName, setsellerName] = useState('');
  const [sellerAddress, setsellerAddress] = useState('');
  const [bills, setBills] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [paymentAccounts, setPaymentAccounts] = useState([]);
  const { user: userInfo } = useAuth();

  const sellerIdRef = useRef();
  const sellerNameRef = useRef();
  const supplierContactRef = useRef();
  const billRefs = useRef([]);
  const paymentRefs = useRef([]);

  useEffect(() => {
    fetchSupplierAccount();
    fetchAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchSupplierAccount = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/seller/get/${id}`);
      const account = response.data;
      setsellerId(account.sellerId);
      setsellerName(account.sellerName);
      setsellerAddress(account.sellerAddress);
      setBills(account.bills || []);
      setPayments(account.payments || []);
    } catch (err) {
      setError('Failed to fetch supplier account data.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      const response = await api.get('/api/accounts/allaccounts');
      setPaymentAccounts(response.data);
    } catch (err) {
      setError('Failed to fetch payment accounts.');
    }
  };

  // Bill handlers
  const handleBillChange = (index, field, value) => {
    const updatedBills = [...bills];
    if (field === 'billAmount' || field === 'cashPart') {
      value = parseFloat(value);
      if (isNaN(value) || value < 0) value = 0;
      value = Number(value.toFixed(2)); // keep 2 decimals
    }
    updatedBills[index][field] = value;
    setBills(updatedBills);
  };

  const addBill = () => {
    setBills([...bills, { invoiceNo: '', billAmount: 0, cashPart: 0, invoiceDate: '', remark: '' }]);
  };

  const removeBill = (index) => {
    const updatedBills = bills.filter((_, i) => i !== index);
    setBills(updatedBills);
  };

  // Payment handlers
  const handlePaymentChange = (index, field, value) => {
    const updatedPayments = [...payments];
    if (field === 'amount') {
      value = parseFloat(value);
      if (isNaN(value) || value < 0) value = 0;
      value = Number(value.toFixed(2));
    }
    updatedPayments[index][field] = value;
    setPayments(updatedPayments);
  };

  const addPayment = () => {
    setPayments([...payments, { amount: 0, date: '', method: '', submittedBy: userInfo._id, remark: '' }]);
  };

  const removePayment = (index) => {
    const updatedPayments = payments.filter((_, i) => i !== index);
    setPayments(updatedPayments);
  };

  const validateForm = () => {
    if (!sellerId.trim()) { setError('Supplier ID is required.'); return false; }
    if (!sellerName.trim()) { setError('Supplier Name is required.'); return false; }
    if (!sellerAddress.trim()) { setError('Supplier Contact Number is required.'); return false; }

    for (let i = 0; i < bills.length; i++) {
      const bill = bills[i];
      if (!bill.invoiceNo.trim()) { setError(`Invoice Number is required for Bill ${i + 1}.`); return false; }
      if (bill.billAmount < 0) { setError(`Bill Amount must be non-negative for Bill ${i + 1}.`); return false; }
    }

    const invoiceNos = bills.map(b => b.invoiceNo.trim());
    if (new Set(invoiceNos).size !== invoiceNos.length) { setError('Duplicate invoice numbers are not allowed.'); return false; }

    for (let i = 0; i < payments.length; i++) {
      const payment = payments[i];
      if (payment.amount < 0) { setError(`Payment Amount must be non-negative for Payment ${i + 1}.`); return false; }
      if (!payment.method) { setError(`Payment method is required for Payment ${i + 1}.`); return false; }
    }

    setError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setFormSubmitting(true);

    const payload = {
      supplierId: sellerId.trim(),
      supplierName: sellerName.trim(),
      supplierAddress: sellerAddress.trim(),
      bills: bills.map(bill => ({
        invoiceNo: bill.invoiceNo.trim(),
        billAmount: Number(bill.billAmount.toFixed(2)),
        cashPart: Number(bill.cashPart.toFixed(2)),
        invoiceDate: bill.invoiceDate ? new Date(bill.invoiceDate) : new Date(),
        remark: bill.remark,
      })),
      payments: payments.map(payment => ({
        amount: Number(payment.amount.toFixed(2)),
        date: payment.date ? new Date(payment.date) : new Date(),
        submittedBy: payment.submittedBy || userInfo._id,
        remark: payment.remark,
        method: payment.method,
      })),
      userId: userInfo?._id,
    };

    try {
      const response = await api.put(`/api/seller/${id}/update`, payload);
      if (response.status === 200) {
        setSuccessMessage('Supplier account updated successfully.');
        setTimeout(() => { navigate('/supplier/account'); }, 2000);
      } else {
        setError('Failed to update supplier account. Please try again.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update supplier account.');
      console.error(err);
    } finally {
      setFormSubmitting(false);
    }
  };


  // Rendering Skeletons
  const renderSkeleton = () => {
    return (
      <div className="max-w-4xl mx-auto mt-5 bg-white shadow-lg rounded-lg p-8">
        <div className="mb-6">
          <label className="block text-xs text-gray-700 mb-2">Supplier ID</label>
          <Skeleton height={40} />
        </div>

        <div className="mb-6">
          <label className="block text-xs text-gray-700 mb-2">Supplier Name</label>
          <Skeleton height={40} />
        </div>

        <div className="mb-6">
          <label className="block text-xs text-gray-700 mb-2">Supplier Contact Number</label>
          <Skeleton height={40} />
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-bold text-gray-700 mb-2">Bills</h3>
          {[...Array(2)].map((_, index) => (
            <div key={index} className="border border-gray-200 p-4 rounded-lg mb-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-700 mb-1">Invoice Number</label>
                  <Skeleton height={30} />
                </div>
                <div>
                  <label className="block text-xs text-gray-700 mb-1">Bill Amount (₹)</label>
                  <Skeleton height={30} />
                </div>
                <div>
                  <label className="block text-xs text-gray-700 mb-1">Invoice Date</label>
                  <Skeleton height={30} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-bold text-gray-700 mb-2">Payments</h3>
          {[...Array(2)].map((_, index) => (
            <div key={index} className="border border-gray-200 p-4 rounded-lg mb-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs text-gray-700 mb-1">Payment Amount (₹)</label>
                  <Skeleton height={30} />
                </div>
                <div>
                  <label className="block text-xs text-gray-700 mb-1">Payment Date</label>
                  <Skeleton height={30} />
                </div>
                <div>
                  <label className="block text-xs text-gray-700 mb-1">Submitted By</label>
                  <Skeleton height={30} />
                </div>
                <div>
                  <label className="block text-xs text-gray-700 mb-1">Remark</label>
                  <Skeleton height={30} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          className="bg-red-500 text-white text-sm font-bold py-2 px-4 rounded-lg opacity-50 cursor-not-allowed"
          disabled
        >
          Update Account
        </button>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6">

      {/* Error Message */}
      {error && (
        <p className="text-red-500 text-center mb-4 text-xs">{error}</p>
      )}

      {/* Success Message */}
      {successMessage && (
        <p className="text-red-500 text-center mb-4 text-xs">{successMessage}</p>
      )}

      {/* Loading Skeletons */}
      {loading ? (
        renderSkeleton()
      ) : (
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto mt-5 bg-white shadow-lg rounded-lg p-8">
          {/* Supplier Information */}
          <div className="mb-6">
            <label className="block text-xs text-gray-700 mb-2">
              Supplier ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              ref={sellerIdRef}
              value={sellerId}
              onChange={(e) => setsellerId(e.target.value)}
              onKeyDown={(e) => changeRef(e, sellerNameRef)}
              className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
              placeholder="Enter Supplier ID"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-xs text-gray-700 mb-2">
              Supplier Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              ref={sellerNameRef}
              value={sellerName}
              onChange={(e) => setsellerName(e.target.value)}
              onKeyDown={(e) => changeRef(e, supplierContactRef)}
              className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
              placeholder="Enter Supplier Name"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-xs text-gray-700 mb-2">
              Supplier Address <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              ref={supplierContactRef}
              value={sellerAddress}
              onChange={(e) => setsellerAddress(e.target.value)}
              onKeyDown={(e) => changeRef(e, billRefs.current[0])}
              className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
              placeholder="Enter Supplier Contact Number"
              required
            />
          </div>

          {/* Bills Section */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-gray-700 mb-2">Bills</h3>
            {bills.map((bill, index) => (
              <div key={index} className="border border-gray-200 p-4 rounded-lg mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-xs font-semibold text-gray-600">Bill {index + 1}</h4>
                  {bills.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeBill(index)}
                      className="text-red-500 text-sm"
                      aria-label={`Remove Bill ${index + 1}`}
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-gray-700 mb-1">
                      Invoice Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={bill.invoiceNo}
                      onChange={(e) => handleBillChange(index, 'invoiceNo', e.target.value)}
                      ref={(el) => (billRefs.current[index] = el)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const nextField = billRefs.current[index + 1] || paymentRefs.current[0];
                          nextField?.focus();
                        }
                      }}
                      className="w-full border border-gray-300 px-2 py-1 rounded-md text-xs"
                      placeholder="Enter Invoice Number"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-700 mb-1">
                      Bill Amount (₹) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={bill.billAmount}
                      onChange={(e) => handleBillChange(index, 'billAmount', e.target.value)}
                      className="w-full border border-gray-300 px-2 py-1 rounded-md text-xs"
                      placeholder="Enter Bill Amount"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-700 mb-1">
                      Purchase Amount (₹) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={bill.cashPart}
                      onChange={(e) => handleBillChange(index, 'cashPart', e.target.value)}
                      className="w-full border border-gray-300 px-2 py-1 rounded-md text-xs"
                      placeholder="Enter Bill Amount"
                      required
                    />
                  </div>


                  <div>
                    <label className="block text-xs text-gray-700 mb-1">Invoice Date</label>
                    <input
                      type="date"
                      value={bill.invoiceDate ? bill.invoiceDate.slice(0, 10) : ''}
                      onChange={(e) => handleBillChange(index, 'invoiceDate', e.target.value)}
                      className="w-full border border-gray-300 px-2 py-1 rounded-md text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-700 mb-1">Remark</label>
                    <input
                      type="text"
                      value={bill.remark}
                      onChange={(e) => handleBillChange(index, 'remark', e.target.value)}
                      className="w-full border border-gray-300 px-2 py-1 rounded-md text-xs"
                    />
                  </div>

                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addBill}
              className="bg-red-500 text-white text-xs font-semibold py-1 px-3 rounded-lg hover:bg-red-600"
            >
              Add Another Bill
            </button>
          </div>

          {/* Payments Section */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-gray-700 mb-2">Payments</h3>
            {payments.map((payment, index) => (
              <div key={index} className="border border-gray-200 p-4 rounded-lg mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-xs font-semibold text-gray-600">Payment {index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => removePayment(index)}
                      className="text-red-500 text-sm"
                      aria-label={`Remove Payment ${index + 1}`}
                    >
                      Remove
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs text-gray-700 mb-1">
                      Payment Amount (₹) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={payment.amount}
                      onChange={(e) => handlePaymentChange(index, 'amount', e.target.value)}
                      ref={(el) => (paymentRefs.current[index] = el)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const nextField = paymentRefs.current[index + 1] || null;
                          nextField?.focus();
                        }
                      }}
                      className="w-full border border-gray-300 px-2 py-1 rounded-md text-xs"
                      placeholder="Enter Payment Amount"
                      
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-700 mb-1">Payment Date</label>
                    <input
                      type="date"
                      value={payment.date ? payment.date.slice(0, 10) : ''}
                      onChange={(e) => handlePaymentChange(index, 'date', e.target.value)}
                      className="w-full border border-gray-300 px-2 py-1 rounded-md text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-700 mb-1">
                      Payment From <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={payment.method}
                      onChange={(e) => handlePaymentChange(index, 'method', e.target.value)}
                      className="w-full border border-gray-300 px-2 py-1 rounded-md text-xs"
                    >
                      <option value="">Select Account</option>
                      {paymentAccounts.map((account) => (
                        <option key={account.accountId} value={account.accountId}>
                          {account.accountName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-700 mb-1">Remark</label>
                    <input
                      type="text"
                      value={payment.remark}
                      onChange={(e) => handlePaymentChange(index, 'remark', e.target.value)}
                      className="w-full border border-gray-300 px-2 py-1 rounded-md text-xs"
                      placeholder="Enter Remark"
                    />
                  </div>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addPayment}
              className="bg-red-500 text-white text-xs font-semibold py-1 px-3 rounded-lg hover:bg-red-600"
            >
              Add Another Payment
            </button>
          </div>

          {/* Submit Button */}
          <div className="text-right">
            <button
              type="submit"
              disabled={formSubmitting && !userInfo.isSuper ? true : false}
              className={`bg-red-500 text-white text-sm font-bold py-2 px-4 rounded-lg hover:bg-red-600 ${
                formSubmitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {formSubmitting ? 'Updating...' : 'Update Account'}
            </button>
            <p className="text-xs text-gray-400 mt-1">
              Fill all required fields before submission
            </p>
          </div>
        </form>
      )}
    </div>
  );
};

export default SupplierAccountEdit;
