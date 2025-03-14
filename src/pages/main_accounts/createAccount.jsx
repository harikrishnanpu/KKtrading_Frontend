import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import useAuth from 'hooks/useAuth';

export default function PaymentAccountForm() {
  const navigate = useNavigate();

  const [accountName, setAccountName] = useState('');
  const [balance, setBalance] = useState(0);
  const [showSuccessMessage, setShowSuccessMessage] = useState('');
  const [showErrorMessage, setShowErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);

  const { user: userInfo } = useAuth();

  const accountNameRef = useRef();
  const balanceRef = useRef();

  function changeRef(e, nextRef) {
    if (e.key === 'Enter') {
      e.preventDefault();
      nextRef.current?.focus();
    }
  }

  const handleSubmitDamageBill = async (e) => {
    e.preventDefault();
    if (!accountName) {
      alert('Please fill all required fields');
      return;
    }
    setIsSubmitting(true);

    try {
      const response = await api.post('/api/accounts/create', {
        accountName,
        balance: parseFloat(balance) || 0,
        userId: userInfo?._id,
      });

      if (response.status === 201) {
        setShowSuccessMessage('Account created successfully.');
        setShowErrorMessage('');
        setAccountName('');
        setBalance(0);
      } else {
        setShowErrorMessage('Failed to create account. Please try again.');
      }
    } catch (error) {
      setShowErrorMessage('Failed to create account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto-hide alerts after 3 seconds
  useEffect(() => {
    if (showSuccessMessage || showErrorMessage) {
      const timer = setTimeout(() => {
        setShowSuccessMessage('');
        setShowErrorMessage('');
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [showSuccessMessage, showErrorMessage]);

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto mt-5 bg-white shadow-lg rounded-lg p-8">
        <div className="flex justify-between mb-4">
          <p className="text-sm font-bold mb-5 text-gray-500">
            <i className="fa fa-list" />
          </p>
          <div className="text-right">
            <button
              onClick={handleSubmitDamageBill}
              disabled={isSubmitting}
              className={`mb-2 bg-red-500 text-sm text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600 ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? 'Creating...' : 'Creating Account'}
            </button>
            <p className="text-xs text-gray-400">Fill all fields before submission</p>
          </div>
        </div>

        {/* User Information */}
        <div className="mb-6">
          <label className="block text-xs text-gray-700 mb-2">Account Name</label>
          <input
            type="text"
            ref={accountNameRef}
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            onKeyDown={(e) => changeRef(e, balanceRef)}
            className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
            placeholder="Enter Account Name"
          />
        </div>

        <div className="mb-6">
          <label className="block text-xs text-gray-700 mb-2">Balance Amount</label>
          <input
            type="number"
            ref={balanceRef}
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
            placeholder="Enter Balance Amount"
          />
        </div>
      </div>

      {/* Alerts placed at the bottom of the page */}
      <div className="max-w-4xl mx-auto mt-4">
        {showSuccessMessage && (
          <div className="bg-green-500 text-white px-4 py-2 rounded shadow-md mb-2">
            {showSuccessMessage}
          </div>
        )}
        {showErrorMessage && (
          <div className="bg-red-500 text-white px-4 py-2 rounded shadow-md mb-2">
            {showErrorMessage}
          </div>
        )}
      </div>
    </div>
  );
}
