/* eslint-disable no-restricted-globals */
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from 'pages/api';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import useAuth from 'hooks/useAuth';
import { Dialog, DialogContent, IconButton, Slide } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { FaPrint, FaPlus, FaFilter, FaUser, FaEye } from 'react-icons/fa';

const Transition = React.forwardRef((p, ref) => (
  <Slide direction="up" ref={ref} {...p} />
));

export default function PurchaseRequestList() {
  const navigate = useNavigate();
  const { user: userInfo } = useAuth();

  /* ───────── state ───────── */
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [htmlLoading, setHtmlLoading] = useState(false);
  const [error, setError] = useState('');

  const [selected, setSelected] = useState(null);
  const [showSidebar, setShowSidebar] = useState(false);

  /* pagination */
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  /* filters */
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  /* sort */
  const [sortField, setSortField] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');

  /* purchase-id list (for linking) */
  const [purchaseIds, setPurchaseIds] = useState([]);

  /* ───────── fetch ───────── */
  useEffect(() => {
    (async () => {
      try {
        const [{ data: reqs }, { data: purchases }] = await Promise.all([
          api.get('/api/purchase-requests'),
          api.get('/api/products/purchases/all', {
            params: { fields: '_id,purchaseId' },
          }),
        ]);
        setRequests(reqs);
        setPurchaseIds(purchases.map((p) => ({ id: p._id, label: p.purchaseId })));
      } catch {
        setError('Failed to fetch data');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ───────── helpers ───────── */
  const patchRequest = (id, patch) =>
    setRequests((rs) => rs.map((r) => (r._id === id ? { ...r, ...patch } : r)));

  const changeStatus = async (id, newStatus) => {
    const { data } = await api.put(`/api/purchase-requests/${id}`, {
      status: newStatus,
    });
    patchRequest(id, data);
  };

  const linkPurchase = async (id, purchaseId) => {
    const { data } = await api.put(`/api/purchase-requests/${id}`, {
      linkedPurchaseId: purchaseId,
    });
    patchRequest(id, data);
  };

  const handlePrint = async (req) => {
    setHtmlLoading(true);
    try {
      const { data: html } = await api.post('/api/print/generate-request-letter', req);
      const w = window.open('', '', 'width=1000,height=700');
      w.document.write(html);
      w.document.close();
    } catch {
      setError('Print failed');
    } finally {
      setHtmlLoading(false);
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
    setStatusFilter('all');
    setSortField('');
    setSortOrder('asc');
  };

  /* ───────── compute lists ───────── */
  const filtered = useMemo(() => {
    let d = [...requests];
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      d = d.filter(
        (r) =>
          r.requestFrom.name.toLowerCase().includes(q) ||
          r.requestTo.name.toLowerCase().includes(q) ||
          r._id.toLowerCase().includes(q)
      );
    }
    if (startDate) d = d.filter((r) => new Date(r.requestDate) >= new Date(startDate));
    if (endDate) d = d.filter((r) => new Date(r.requestDate) <= new Date(endDate));
    if (statusFilter !== 'all') d = d.filter((r) => r.status === statusFilter);
    if (sortField) {
      const get = (o, p) => p.split('.').reduce((x, k) => x?.[k], o);
      d.sort((a, b) => {
        let A = get(a, sortField),
          B = get(b, sortField);
        if (typeof A === 'string') {
          A = A.toLowerCase();
          B = B.toLowerCase();
        }
        if (A < B) return sortOrder === 'asc' ? -1 : 1;
        if (A > B) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return d;
  }, [requests, searchTerm, startDate, endDate, statusFilter, sortField, sortOrder]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const pageData = useMemo(
    () => filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
    [filtered, currentPage]
  );

  /* stats */
  const stats = useMemo(
    () => ({
      total: filtered.length,
      items: filtered.reduce((s, r) => s + r.items.length, 0),
      pending: filtered.filter((r) => r.status === 'pending').length,
      received: filtered.filter((r) => r.status === 'received').length,
      notSub: filtered.filter((r) => r.status === 'not-submitted').length,
    }),
    [filtered]
  );

  /* ───────── UI helpers ───────── */
  const StatusPill = ({ r }) => {
    const color = {
      pending: 'bg-yellow-100 text-yellow-800',
      received: 'bg-green-100 text-green-800',
      'not-submitted': 'bg-gray-200 text-gray-800',
    }[r.status];

    return (
      <select
        value={r.status === 'received' ? r.linkedPurchaseId || 'received' : r.status}
        onChange={(e) => {
          const val = e.target.value;
          if (['pending', 'not-submitted'].includes(val)) changeStatus(r._id, val);
          else if (val === 'received') changeStatus(r._id, 'received');
          else linkPurchase(r._id, val);
        }}
        className={`${color} uppercase text-xs font-bold rounded-full px-3 py-1 appearance-none cursor-pointer border-none focus:outline-none`}
      >
        <option hidden value={r.status}>
          {r.status === 'received' && r.linkedPurchaseId
            ? `RECEIVED • ${purchaseIds.find((p) => p.id === r.linkedPurchaseId)?.label || r.linkedPurchaseId.slice(-6)}`
            : r.status.toUpperCase()}
        </option>
        <option value="pending">PENDING</option>
        <option value="received">RECEIVED</option>
        <option value="not-submitted">NOT SUBMITTED</option>
        {r.status === 'received' &&
          purchaseIds.map((p) => (
            <option key={p.id} value={p.id}>
              LINK → {p.label}
            </option>
          ))}
      </select>
    );
  };

  const TableSkeleton = () => (
    <table className="w-full bg-white rounded-lg shadow">
      <tbody>
        {Array.from({ length: itemsPerPage }).map((_, i) => (
          <tr key={i}>
            {Array(9)
              .fill(0)
              .map((__, j) => (
                <td key={j} className="p-2">
                  <Skeleton />
                </td>
              ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
  const CardSkeleton = () =>
    Array.from({ length: itemsPerPage }).map((_, i) => (
      <Skeleton key={i} height={140} className="mb-4 rounded-lg" />
    ));

  /* card (mobile) */
  const Card = (r) => (
    <div key={r._id} className="bg-white rounded-lg shadow p-4 mb-4">
      <div className="flex justify-between mb-2">
        <h3
          onClick={() => setSelected(r)}
          className="text-red-600 font-bold text-xs tracking-wide cursor-pointer"
        >
          {r._id.slice(-6).toUpperCase()}
        </h3>
        <span className="text-gray-500 text-xs">
          {new Date(r.requestDate).toLocaleDateString()}
        </span>
      </div>
      <p className="text-xs">
        <strong>From :</strong> {r.requestFrom.name}
      </p>
      <p className="text-xs">
        <strong>To :</strong> {r.requestTo.name}
      </p>
      <p className="text-xs">
        <strong>Items :</strong> {r.items.length}
      </p>
      <div className="my-2">
        <StatusPill r={r} />
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => setSelected(r)}
          className="flex-1 bg-red-600 text-white text-xs py-2 rounded"
        >
          View
        </button>
        <button
          onClick={() => handlePrint(r)}
          className="flex-1 bg-red-600 text-white text-xs py-2 rounded"
        >
          Print
        </button>
      </div>
    </div>
  );

  /* ───────── render ───────── */
  return (
    <>
      {htmlLoading && (
        <div className="fixed inset-0 bg-black/50 z-50 flex flex-col items-center justify-center">
          <i className="fa fa-spinner fa-spin text-white text-3xl mb-2" />
          <p className="text-white text-xs">Preparing letter…</p>
        </div>
      )}

      {/* top */}
      <div className="flex flex-wrap items-center justify-between mb-4 gap-4">
        <button
          onClick={() => navigate('/purchase/create-purchase-request')}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-xs flex items-center gap-2"
        >
          <FaPlus /> New Request
        </button>
        <div className="flex flex-wrap gap-2">
          {['all', 'pending', 'received', 'not-submitted'].map((s) => (
            <button
              key={s}
              onClick={() => {
                setStatusFilter(s);
                setCurrentPage(1);
              }}
              className={`px-3 py-1 rounded text-xs font-semibold ${
                statusFilter === s
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {s === 'all' ? 'ALL' : s.replace('-', ' ').toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* stats */}
      <div className="grid grid-cols-2 xs:grid-cols-3 md:grid-cols-5 gap-4 mb-6">
        {[
          ['Total Req', stats.total],
          ['Total Items', stats.items],
          ['Pending', stats.pending],
          ['Received', stats.received],
          ['Not-Sub', stats.notSub],
        ].map(([l, v]) => (
          <div key={l} className="bg-white shadow rounded-lg p-4 text-center">
            <p className="text-xs text-gray-500">{l}</p>
            <p className="text-lg font-bold text-gray-800">{v}</p>
          </div>
        ))}
      </div>

      {/* desktop filter box */}
      <div className="hidden md:flex flex-wrap bg-white shadow rounded-lg p-4 mb-6 gap-4">
        <div className="flex-1 min-w-[180px]">
          <label className="block text-xs font-semibold mb-1">Search</label>
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="From / To / ID…"
            className="w-full border border-gray-300 rounded px-3 py-2 text-xs"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">Start</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 text-xs"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">End</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 text-xs"
          />
        </div>
        <button
          onClick={resetFilters}
          className="bg-red-600 text-white px-4 py-2 rounded text-xs"
        >
          Reset
        </button>
      </div>

      {error && <p className="text-red-600 text-center text-xs mb-4">{error}</p>}

      {loading ? (
        <>
          <div className="hidden md:block">
            <TableSkeleton />
          </div>
          <div className="md:hidden">{CardSkeleton()}</div>
        </>
      ) : filtered.length === 0 ? (
        <p className="text-center text-gray-500 text-xs">No requests found.</p>
      ) : (
        <>
          {/* desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-xs bg-white shadow rounded-lg">
              <thead className="bg-red-600 text-white">
                <tr>
                  {['ID', 'Date', 'Submitted', 'From', 'To', 'Items', 'Status', 'Actions'].map(
                    (h) => (
                      <th key={h} className="px-3 py-2">
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {pageData.map((r) => (
                  <tr key={r._id} className="border-b hover:bg-gray-50">
                    <td
                      onClick={() => setSelected(r)}
                      className="px-3 py-2 text-red-600 font-semibold cursor-pointer"
                    >
                      {r._id.slice(-6).toUpperCase()}
                    </td>
                    <td className="px-3 py-2">{new Date(r.requestDate).toLocaleDateString()}</td>
                    <td className="px-3 py-2">{r.submittedBy || '—'}</td>
                    <td className="px-3 py-2">{r.requestFrom.name}</td>
                    <td className="px-3 py-2">{r.requestTo.name}</td>
                    <td className="px-3 py-2 text-center">{r.items.length}</td>
                    <td className="px-3 py-2">
                      <StatusPill r={r} />
                    </td>
                    <td className="px-3 py-2 flex gap-2">
                      <button
                        className="bg-red-600 text-white px-2 py-1 rounded"
                        onClick={() => setSelected(r)}
                      >
                        <FaEye />
                      </button>
                      <button
                        className="bg-red-600 text-white px-2 py-1 rounded"
                        onClick={() => handlePrint(r)}
                      >
                        <FaPrint />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* mobile cards */}
          <div className="md:hidden">{pageData.map(Card)}</div>

          {/* pagination */}
          <div className="mt-4 flex justify-between items-center">
            <button
              onClick={() => setCurrentPage((p) => p - 1)}
              disabled={currentPage === 1}
              className={`px-4 py-2 text-xs font-semibold rounded ${
                currentPage === 1
                  ? 'bg-gray-200 text-gray-400'
                  : 'bg-red-600 text-white'
              }`}
            >
              Prev
            </button>
            <span className="text-xs text-gray-600">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => p + 1)}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 text-xs font-semibold rounded ${
                currentPage === totalPages
                  ? 'bg-gray-200 text-gray-400'
                  : 'bg-red-600 text-white'
              }`}
            >
              Next
            </button>
          </div>
        </>
      )}

      {/* modal */}
      {selected && (
        <Dialog open fullScreen TransitionComponent={Transition} onClose={() => setSelected(null)}>
          <DialogContent className="relative p-6">
            <IconButton
              onClick={() => setSelected(null)}
              sx={{ position: 'absolute', top: 8, right: 8, color: 'gray' }}
            >
              <CloseIcon fontSize="large" />
            </IconButton>

            <h2 className="text-xs font-bold text-red-600 mb-4 flex items-center gap-2">
              <FaUser /> Purchase Request • {selected._id.slice(-6).toUpperCase()}
            </h2>

            {/* meta */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mb-6">
              <div>
                <p>
                  <strong>From :</strong> {selected.requestFrom.name}
                </p>
                <p className="text-gray-500 text-xs">{selected.requestFrom.address}</p>
                <p>
                  <strong>Date :</strong> {new Date(selected.requestDate).toLocaleString()}
                </p>
                <p>
                  <strong>Submitted :</strong> {selected.submittedBy || '—'}
                </p>
              </div>
              <div>
                <p>
                  <strong>To :</strong> {selected.requestTo.name}
                </p>
                <p className="text-gray-500 text-xs">{selected.requestTo.address}</p>
                <div className="mt-1">
                  <StatusPill r={selected} />
                </div>
              </div>
            </div>

            {/* items */}
            <h3 className="text-xs font-bold text-red-600 mb-2">
              Items ({selected.items.length})
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-2 py-1">#</th>
                    <th className="px-2 py-1">ID</th>
                    <th className="px-2 py-1">Name</th>
                    <th className="px-2 py-1">Qty</th>
                    <th className="px-2 py-1">Unit</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.items.map((it, i) => (
                    <tr key={i} className="border-b">
                      <td className="px-2 py-1">{i + 1}</td>
                      <td className="px-2 py-1">{it.itemId || '—'}</td>
                      <td className="px-2 py-1">{it.name}</td>
                      <td className="px-2 py-1 text-center">{it.quantity}</td>
                      <td className="px-2 py-1 text-center">{it.pUnit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-10 text-right">
              <p className="inline-block border-t border-gray-400 pt-2 text-xs">
                Authorized Signature
              </p>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* mobile filter FAB */}
      <button
        onClick={() => setShowSidebar(true)}
        className="md:hidden fixed bottom-6 right-6 bg-red-600 p-3 rounded-full shadow-lg text-white"
      >
        <FaFilter />
      </button>

      {/* sidebar */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 ${showSidebar ? 'block' : 'hidden'} md:hidden`}
        onClick={() => setShowSidebar(false)}
      />
      <div
        className={`fixed top-0 right-0 h-full bg-white shadow-md p-4 w-64 z-50 transform ${
          showSidebar ? 'translate-x-0' : 'translate-x-full'
        } transition-transform md:hidden`}
      >
        <h2 className="text-xs font-bold text-red-600 mb-4">Filters</h2>
        <label className="block text-xs font-bold mb-1">Search</label>
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2 text-xs mb-3"
        />
        <label className="block text-xs font-bold mb-1">Start Date</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2 text-xs mb-3"
        />
        <label className="block text-xs font-bold mb-1">End Date</label>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2 text-xs mb-3"
        />
        <button
          onClick={resetFilters}
          className="bg-red-600 text-white w-full py-2 rounded text-xs"
        >
          Reset
        </button>
      </div>
    </>
  );
}
