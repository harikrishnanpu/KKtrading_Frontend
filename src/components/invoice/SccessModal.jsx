// SuccessModal.jsx
import { useTabs } from 'contexts/TabsContext';
import React from 'react';
import { useNavigate } from 'react-router';

export default function SuccessModal({ page='other', message }) {
  const navigate = useNavigate();
  const {closeTab,activeTab} = useTabs();
  return (
<div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 flex justify-around items-center w-2/4 bg-green-500 text-white px-6 py-4 rounded shadow-lg z-50">
  <p className="text-sm font-bold mr-4">{message}</p>
  {page == 'edit_invoice' && <button onClick={()=>{
    closeTab(activeTab);
    navigate('/invoice/list')
  }} className="border border-white px-2 rounded bg-white text-green-600 hover:bg-gray-100 transition">Continue</button>}
</div>
  );
}
