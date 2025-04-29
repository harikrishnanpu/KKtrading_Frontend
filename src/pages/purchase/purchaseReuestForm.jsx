import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function PurchaseRequestPreview({ data, onBack }) {
  const navigate = useNavigate();
  return (
    <div className="max-w-3xl mx-auto bg-white shadow p-6">
      <button onClick={onBack} className="text-blue-600 mb-4 text-xs">
        ← Back
      </button>
      <h2 className="text-lg font-bold text-center mb-4">
        Purchase Request&nbsp;#{data._id.substring(0, 6)}
      </h2>

      <div className="grid grid-cols-2 gap-4 text-xs mb-6">
        <div>
          <p className="font-semibold">Request&nbsp;From</p>
          <p>{data.requestFrom.name}</p>
          <p className="text-gray-500">{data.requestFrom.address}</p>
        </div>
        <div>
          <p className="font-semibold">Request&nbsp;To</p>
          <p>{data.requestTo.name}</p>
          <p className="text-gray-500">{data.requestTo.address}</p>
        </div>
        <div>
          <p className="font-semibold">Date</p>
          <p>{new Date(data.requestDate).toLocaleDateString()}</p>
        </div>
        <div>
          <p className="font-semibold">Status</p>
          <p>{data.status}</p>
        </div>
      </div>

      <table className="w-full text-xs border mb-4">
        <thead>
          <tr className="bg-gray-100">
            <th className="py-1 px-2 text-left">ID</th>
            <th className="py-1 px-2 text-left">Name</th>
            <th className="py-1 px-2 text-center">Qty (P-Unit)</th>
            <th className="py-1 px-2 text-center">P-Unit</th>
            <th className="py-1 px-2 text-center">Qty (NOS)</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((it) => (
            <tr key={it.itemId} className="border-t">
              <td className="px-2 py-1">{it.itemId}</td>
              <td className="px-2 py-1">{it.name}</td>
              <td className="text-center">{it.quantity}</td>
              <td className="text-center">{it.pUnit}</td>
              <td className="text-center">{it.quantityInUnits}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="text-center text-xs text-gray-400">
        Print this page as PDF if a hard copy is required
      </p>
      <button onClick={()=>{ navigate('/purchase/list-purchase-request/') }} className='bg-red-600 text-center font-bold text-xs text-white p-2 ml-auto mr-auto rounded-md'>All Request Forms</button>
    </div>
  );
}
