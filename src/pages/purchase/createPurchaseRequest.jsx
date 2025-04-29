/* eslint-disable no-restricted-globals */
import React, { useState, useRef } from 'react';
import api from 'pages/api';
import ItemSuggestionsSidebar from 'components/products/itemSuggestionSidebar';
import ErrorModal from 'components/ErrorModal';
import PurchaseRequestPreview from './purchaseReuestForm';
import { useNavigate } from 'react-router-dom';

export default function PurchaseRequestPage() {
    const navigate = useNavigate();
  /* ───────────────────────────── header fields ───────────────────────────── */
  const [requestFrom, setRequestFrom] = useState('KK Trading');
  const [requestFromAddr, setRequestFromAddr] = useState('Moncompu Champoakulam Road, Kerala, India');
  const [requestTo, setRequestTo] = useState('');
  const [requestToAddr, setRequestToAddr] = useState('');
  const [requestDate, setRequestDate] = useState(
    new Date().toISOString().substring(0, 10)
  );

  /* ─────────────────────────────── items ─────────────────────────────────── */
  const [items, setItems] = useState([]);
  const [itemId, setItemId] = useState('');
  const [itemName, setItemName] = useState('');
  const [itemBrand, setItemBrand] = useState('');
  const [itemCategory, setItemCategory] = useState('');
  const [itemQuantity, setItemQuantity] = useState('');
  const [itemUnit, setItemUnit] = useState('');
  const [sUnit, setSUnit] = useState('NOS');
  const [psRatio, setPsRatio] = useState('');
  const [length, setLength] = useState('');
  const [breadth, setBreadth] = useState('');
  const [actLength, setActLength] = useState('');
  const [actBreadth, setActBreadth] = useState('');
  const [size, setSize] = useState('');

  /* ───────────────────────────── suggestions UI ──────────────────────────── */
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestionsSidebar, setShowSuggestionsSidebar] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

  /* ───────────────────────────── misc state ──────────────────────────────── */
  const [error, setError] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [savedRequest, setSavedRequest] = useState(null);

  /* ───────────────────────────── refs ────────────────────────────────────── */
  const itemIdRef = useRef();
  const itemNameRef = useRef();

  /* ───────────────────────────── helpers ─────────────────────────────────── */
  const safeMultiply = (a, b) => (a && b ? parseFloat(a) * parseFloat(b) : 0);

  const clearItemFields = () => {
    setItemId('');
    setItemName('');
    setItemBrand('');
    setItemCategory('');
    setItemQuantity('');
    setItemUnit('');
    setPsRatio('');
    setLength('');
    setBreadth('');
    setActLength('');
    setActBreadth('');
    setSize('');
  };

  /* ───────────────────────────── add / remove item ───────────────────────── */
  const addItem = () => {
    if (
      !itemId ||
      !itemName ||
      !itemCategory ||
      itemQuantity === '' ||
      !itemUnit
    ) {
      setError('Please fill Item ID, Name, Category, Quantity & Unit');
      setShowErrorModal(true);
      return;
    }

    const q = parseFloat(itemQuantity);
    const ratio = parseFloat(psRatio) || 1;
    const area = safeMultiply(parseFloat(length), parseFloat(breadth)) || 1;

    let quantityInUnits = q;
    if (itemUnit === 'BOX') quantityInUnits = q * ratio;
    else if (itemUnit === 'SQFT') quantityInUnits = q / area;

    setItems([
      {
        itemId,
        name: itemName,
        brand: itemBrand,
        category: itemCategory,
        quantity: q,
        pUnit: itemUnit,
        sUnit,
        psRatio: ratio,
        length,
        breadth,
        actLength,
        actBreadth,
        size,
        quantityInUnits,
      },
      ...items,
    ]);

    clearItemFields();
    itemIdRef.current?.focus();
  };

  const removeItem = (idx) => setItems(items.filter((_, i) => i !== idx));

  /* ───────────────────────────── suggestions & keyboard nav ──────────────── */
  const handleItemIdChange = async (e) => {
    const val = e.target.value;
    setItemId(val);
    if (!val.trim()) {
      setSuggestions([]);
      setShowSuggestionsSidebar(false);
      setSelectedSuggestionIndex(-1);
      return;
    }
    try {
      const { data } = await api.get(
        `/api/products/searchform/search?q=${val}`
      );
      setSuggestions(data);
      setShowSuggestionsSidebar(data.length > 0);
      setSelectedSuggestionIndex(-1);
    } catch (err) {
      console.error(err);
    }
  };

  const handleItemIdKeyDown = (e) => {
    if (!showSuggestionsSidebar) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestionIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestionIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedSuggestionIndex >= 0) {
        const sel = suggestions[selectedSuggestionIndex];
        selectSuggestion(sel);
      }
    }
  };

  const selectSuggestion = (sug) => {
    setItemId(sug.item_id);
    setItemName(sug.name);
    setItemCategory(sug.category);
    setItemBrand(sug.brand);
    setShowSuggestionsSidebar(false);
    setSuggestions([]);
    setSelectedSuggestionIndex(-1);
    itemNameRef.current?.focus();
  };

  /* ───────────────────────────── submit form ─────────────────────────────── */
  const submitHandler = async () => {
    if (
      !requestFrom ||
      !requestFromAddr ||
      !requestTo ||
      !requestToAddr ||
      items.length === 0
    ) {
      setError('Header details & at least one item are required.');
      setShowErrorModal(true);
      return;
    }
    try {
      const { data } = await api.post('/api/purchase-requests', {
        requestFrom: { name: requestFrom, address: requestFromAddr },
        requestTo: { name: requestTo, address: requestToAddr },
        requestDate,
        items,
      });
      setSavedRequest(data);
      clearAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
      setShowErrorModal(true);
    }
  };

  const clearAll = () => {
    setRequestFrom('');
    setRequestFromAddr('');
    setRequestTo('');
    setRequestToAddr('');
    setItems([]);
  };

  /* ───────────────────────────── UI ──────────────────────────────────────── */
  if (savedRequest)
    return (
      <PurchaseRequestPreview
        data={savedRequest}
        onBack={() => setSavedRequest(null)}
      />
    );

  return (
    <div className="mx-auto mt-8 p-6 bg-white shadow-md rounded-md max-w-4xl">
      {showErrorModal && (
        <ErrorModal message={error} onClose={() => setShowErrorModal(false)} />
      )}

      {/* ╭──────────────── Header fields ────────────────╮ */}
      <div className='flex text-xs justify-between align-items-center mb-5'>
      <button
          className="py-2 px-6 bg-red-600 text-white rounded-md text-xs font-bold hover:bg-red-700"
          onClick={()=> navigate('/purchase/list-purchase-request')}
        >
          Back
        </button>
      <h2 className="text-base font-bold mb-6 text-gray-900">
        Create Purchase Request
      </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="flex flex-col">
          <label className="text-xs mb-1 text-gray-700">Request FROM</label>
          <input
            className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
            placeholder="Name"
            value={requestFrom}
            onChange={(e) => setRequestFrom(e.target.value)}
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs mb-1 text-gray-700">FROM Address</label>
          <input
            className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
            placeholder="Address"
            value={requestFromAddr}
            onChange={(e) => setRequestFromAddr(e.target.value)}
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs mb-1 text-gray-700">Request TO</label>
          <input
            className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
            placeholder="Name"
            value={requestTo}
            onChange={(e) => setRequestTo(e.target.value)}
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs mb-1 text-gray-700">TO Address</label>
          <input
            className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
            placeholder="Address"
            value={requestToAddr}
            onChange={(e) => setRequestToAddr(e.target.value)}
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs mb-1 text-gray-700">Request Date</label>
          <input
            type="date"
            className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
            value={requestDate}
            onChange={(e) => setRequestDate(e.target.value)}
          />
        </div>
      </div>

      {/* ╭──────────────── Item add inputs ───────────────╮ */}
      <h3 className="text-sm font-bold text-gray-900 mb-2">Items</h3>
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-3">
        <div className="flex flex-col">
          <label className="text-xs mb-1 text-gray-700">Item ID</label>
          <input
            ref={itemIdRef}
            className="border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
            placeholder="Search / Enter ID"
            value={itemId}
            onChange={handleItemIdChange}
            onKeyDown={handleItemIdKeyDown}
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs mb-1 text-gray-700">Name</label>
          <input
            ref={itemNameRef}
            className="border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs mb-1 text-gray-700">Brand</label>
          <input
            className="border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
            value={itemBrand}
            onChange={(e) => setItemBrand(e.target.value)}
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs mb-1 text-gray-700">Category</label>
          <input
            className="border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
            value={itemCategory}
            onChange={(e) => setItemCategory(e.target.value)}
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs mb-1 text-gray-700">Quantity</label>
          <input
            type="number"
            className="border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
            value={itemQuantity}
            onChange={(e) => setItemQuantity(e.target.value)}
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs mb-1 text-gray-700">P-Unit</label>
          <select
            className="border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
            value={itemUnit}
            onChange={(e) => setItemUnit(e.target.value)}
          >
            <option value="" disabled>
              Select
            </option>
            <option value="NOS">NOS</option>
            <option value="BOX">BOX</option>
            <option value="SQFT">SQFT</option>
          </select>
        </div>
      </div>
      <button
        className="py-2 px-4 bg-red-600 text-white text-xs font-bold rounded-md hover:bg-red-700 mb-6"
        onClick={addItem}
      >
        Add Item
      </button>

      {/* ╭──────────────── Items table ────────────────╮ */}
      {items.length > 0 && (
        <div className="overflow-x-auto mb-8">
          <table className="min-w-full table-auto bg-white shadow-md rounded-md">
            <thead>
              <tr className="bg-red-500 text-white text-xs">
                <th className="px-3 py-2 text-left">Item ID</th>
                <th className="px-3 py-2 text-left">Name</th>
                <th className="px-3 py-2 text-center">Qty (P-Unit)</th>
                <th className="px-3 py-2 text-center">P-Unit</th>
                <th className="px-3 py-2 text-center">Qty (NOS)</th>
                <th className="px-3 py-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-gray-600 text-xs">
              {items.map((it, idx) => (
                <tr
                  key={idx}
                  className={`border-b ${
                    idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                  }`}
                >
                  <td className="px-3 py-2">{it.itemId}</td>
                  <td className="px-3 py-2">{it.name}</td>
                  <td className="text-center">{it.quantity}</td>
                  <td className="text-center">{it.pUnit}</td>
                  <td className="text-center">{it.quantityInUnits}</td>
                  <td className="text-center">
                    <button
                      onClick={() => removeItem(idx)}
                      className="text-red-600 hover:text-red-800 text-xs"
                    >
                      <i className="fa fa-trash" aria-hidden="true"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ╭──────────────── submit ────────────────╮ */}
      <div className="flex justify-end">

        <button
          className="py-2 px-6 bg-red-600 text-white rounded-md text-sm font-bold hover:bg-red-700"
          onClick={()=> submitHandler()}
        >
          Submit Request
        </button>
      </div>

      {/* ╭──────────────── suggestion sidebar ─────╮ */}
      {showSuggestionsSidebar && (
        <ItemSuggestionsSidebar
          open={showSuggestionsSidebar}
          suggestions={suggestions}
          selectedIndex={selectedSuggestionIndex}
          onSelect={selectSuggestion}
          onClose={() => setShowSuggestionsSidebar(false)}
        />
      )}
    </div>
  );
}
