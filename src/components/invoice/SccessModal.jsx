// SuccessModal.jsx
import { useTabs } from 'contexts/TabsContext';
import React from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';

export default function SuccessModal({ page = 'other', message }) {
  const navigate = useNavigate();
  const { closeTab, activeTab } = useTabs();

  return (
    <motion.div
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className="fixed top-32 right-16 flex flex-col sm:flex-row sm:items-center sm:justify-between
                 w-[90%] sm:w-auto max-w-sm bg-green-500 px-5 text-white py-4 rounded-lg shadow-lg z-[10000000]"
    >
      <p className="text-sm font-bold mb-2 sm:mb-0">{message}</p>
      {page === 'edit_invoice' && (
        <button
          onClick={() => {
            closeTab(activeTab);
            navigate('/invoice/list');
          }}
          className="border border-white px-3 py-1 rounded bg-white text-green-600
                     hover:bg-gray-100 transition text-sm font-medium"
        >
          Continue
        </button>
      )}
    </motion.div>
  );
}
