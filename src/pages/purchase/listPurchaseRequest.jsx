/* eslint-disable no-restricted-globals */
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from 'pages/api';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import useAuth from 'hooks/useAuth';
import { Dialog, DialogContent, IconButton, Slide } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { FaFilter, FaPrint, FaPlus } from 'react-icons/fa';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function PurchaseRequestList() {
  const navigate = useNavigate();
  const { user: userInfo } = useAuth();

  // State
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [htmlLoading, setHtmlLoading] = useState(false);
  const [error, setError] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Filters & Sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');

  // Fetch data
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/api/purchase-requests');
        setRequests(data);
      } catch {
        setError('Failed to fetch requests.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Filtering + sorting
  const filtered = useMemo(() => {
    let d = [...requests];
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      d = d.filter(
        r =>
          r.requestFrom.name.toLowerCase().includes(q) ||
          r.requestTo.name.toLowerCase().includes(q) ||
          r._id.toLowerCase().includes(q)
      );
    }
    if (startDate) d = d.filter(r => new Date(r.requestDate) >= new Date(startDate));
    if (endDate)   d = d.filter(r => new Date(r.requestDate) <= new Date(endDate));
    if (statusFilter !== 'all') d = d.filter(r => r.status === statusFilter);
    if (sortField) {
      const get = (o, p) => p.split('.').reduce((x,k)=>x?.[k], o);
      d.sort((a,b) => {
        let A = get(a, sortField), B = get(b, sortField);
        if (typeof A === 'string') { A = A.toLowerCase(); B = B.toLowerCase(); }
        if (A < B) return sortOrder==='asc'? -1:1;
        if (A > B) return sortOrder==='asc'? 1:-1;
        return 0;
      });
    }
    return d;
  }, [requests, searchTerm, startDate, endDate, statusFilter, sortField, sortOrder]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const pageData = useMemo(
    () => filtered.slice((currentPage-1)*itemsPerPage, currentPage*itemsPerPage),
    [filtered, currentPage]
  );

  // Quick stats
  const stats = useMemo(() => {
    const total = filtered.length;
    const items = filtered.reduce((s, r) => s + r.items.length, 0);
    const pending = filtered.filter(r=>r.status==='pending').length;
    const received = filtered.filter(r=>r.status==='received').length;
    const notSub = filtered.filter(r=>r.status==='not-submitted').length;
    return { total, items, pending, received, notSub };
  }, [filtered]);

  // Helpers
  const resetFilters = () => {
    setSearchTerm(''); setStartDate(''); setEndDate('');
    setStatusFilter('all'); setSortField(''); setSortOrder('asc');
  };

  // Print letter
  const handlePrint = async req => {
    setHtmlLoading(true);
    try {
      const { data: html } = await api.post('/api/print/generate-request-letter', req);
      const win = window.open('', '', 'width=1000,height=700');
      win.document.write(html);
      win.document.close();
    } catch {
      setError('Print failed.');
    } finally {
      setHtmlLoading(false);
    }
  };

  // Update status
  const changeStatus = async (id, newStatus) => {
    try {
      const { data } = await api.put(`/api/purchase-requests/${id}`, { status: newStatus });
      setRequests(reqs => reqs.map(r => r._id === id ? data : r));
    } catch {
      setError('Status update failed.');
    }
  };

  // Skeleton loaders
  const CardSkeleton = () =>
    Array.from({ length: itemsPerPage }).map((_, i) => (
      <Skeleton key={i} height={140} className="mb-4 rounded-lg" />
    ));
  const TableSkeleton = () => (
    <table className="w-full bg-white rounded-lg shadow overflow-hidden">
      <tbody>
        {Array.from({ length: itemsPerPage }).map((_, i) => (
          <tr key={i} className="divide-x">
            {Array(7).fill(0).map((__, j) => (
              <td key={j} className="p-2"><Skeleton /></td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );

  // Status badge
  const StatusBadge = ({ status }) => {
    const map = {
      pending: 'bg-yellow-200 text-yellow-800',
      received: 'bg-green-200 text-green-800',
      'not-submitted': 'bg-gray-200 text-gray-800'
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-semibold ${map[status]}`}>
        {status.replace('-', ' ').toUpperCase()}
      </span>
    );
  };

  // Mobile card
  const Card = r => (
    <div key={r._id} className="bg-white rounded-lg shadow p-4 mb-4">
      <div className="flex justify-between mb-2">
        <h3
          onClick={()=>setSelectedRequest(r)}
          className="text-red-600 font-bold text-lg cursor-pointer"
        >
          {r._id.slice(-6).toUpperCase()}
        </h3>
        <span className="text-gray-500 text-xs">
          {new Date(r.requestDate).toLocaleDateString()}
        </span>
      </div>
      <p className="text-sm"><strong>From:</strong> {r.requestFrom.name}</p>
      <p className="text-sm"><strong>To:</strong> {r.requestTo.name}</p>
      <p className="text-sm"><strong>Items:</strong> {r.items.length}</p>
      <div className="flex items-center">
        <strong className="text-sm mr-1">Status:</strong>
        <select
          value={r.status}
          onChange={e=>changeStatus(r._id, e.target.value)}
          className="text-xs border border-gray-300 rounded px-2 py-1"
        >
          <option value="pending">PENDING</option>
          <option value="received">RECEIVED</option>
          <option value="not-submitted">NOT SUBMITTED</option>
        </select>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          onClick={()=>setSelectedRequest(r)}
          className="bg-red-600 text-white px-3 py-1 rounded text-xs flex-1"
        >
          View
        </button>
        <button
          onClick={()=>handlePrint(r)}
          className="bg-red-600 text-white px-3 py-1 rounded text-xs flex-1"
        >
          Print
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Generating overlay */}
      {htmlLoading && (
        <div className="fixed inset-0 bg-black/50 z-50 flex flex-col items-center justify-center">
          <i className="fa fa-spinner fa-spin text-white text-3xl mb-2" />
          <p className="text-white">Preparing letter…</p>
        </div>
      )}

      {/* Top controls */}
      <div className="flex flex-wrap items-center justify-between mb-4 gap-4">
        <button
          onClick={()=>navigate('/purchase/create-purchase-request')}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm flex items-center gap-2"
        >
          <FaPlus /> Add Purchase Request
        </button>
        <div className="flex flex-wrap gap-2">
          {['all','pending','received','not-submitted'].map(sf => (
            <button
              key={sf}
              onClick={()=>{ setStatusFilter(sf); setCurrentPage(1); }}
              className={`px-3 py-1 rounded text-xs font-semibold ${
                statusFilter===sf ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              {sf==='all' ? 'ALL' : sf.replace('-', ' ').toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-6">
        {[
          ['Total Req', stats.total],
          ['Total Items', stats.items],
          ['Pending', stats.pending],
          ['Received', stats.received],
          ['Not-Sub', stats.notSub],
        ].map(([label,val]) => (
          <div key={label} className="bg-white shadow rounded-lg p-4 text-center">
            <p className="text-xs text-gray-500">{label}</p>
            <p className="text-xl font-bold text-gray-800">{val}</p>
          </div>
        ))}
      </div>

      {/* Desktop filters */}
      <div className="hidden md:flex flex-wrap bg-white shadow rounded-lg p-4 mb-6 gap-4">
        <div className="flex-1 min-w-[180px]">
          <label className="block text-xs font-semibold mb-1">Search</label>
          <input
            value={searchTerm}
            onChange={e=>setSearchTerm(e.target.value)}
            placeholder="From / To / ID…"
            className="w-full border border-gray-300 rounded px-3 py-2 text-xs focus:ring-red-500 focus:border-red-500"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={e=>setStartDate(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 text-xs focus:ring-red-500 focus:border-red-500"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={e=>setEndDate(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 text-xs focus:ring-red-500 focus:border-red-500"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">Status</label>
          <select
            value={statusFilter}
            onChange={e=>setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 text-xs focus:ring-red-500 focus:border-red-500"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="received">Received</option>
            <option value="not-submitted">Not Submitted</option>
          </select>
        </div>
        <button
          onClick={resetFilters}
          className="bg-red-600 text-white px-4 py-2 rounded text-xs font-semibold hover:bg-red-700 self-end"
        >
          Reset
        </button>
      </div>

      {/* Error message */}
      {error && <div className="text-red-600 text-center mb-4">{error}</div>}

      {/* List */}
      {loading ? (
        <>
          <div className="hidden md:block"><TableSkeleton /></div>
          <div className="md:hidden">{CardSkeleton()}</div>
        </>
      ) : filtered.length === 0 ? (
        <div className="text-center text-gray-500">No requests found.</div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full bg-white shadow rounded-lg text-xs">
              <thead className="bg-red-600 text-white sticky top-0">
                <tr>
                  {['ID','Date','From','To','Items','Status','Actions'].map(h => (
                    <th key={h} className="px-3 py-2">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-gray-700">
                {pageData.map(r => (
                  <tr key={r._id} className="hover:bg-gray-50">
                    <td
                      onClick={()=>setSelectedRequest(r)}
                      className="px-3 py-2 font-semibold text-red-600 cursor-pointer"
                    >
                      {r._id.slice(-6).toUpperCase()}
                    </td>
                    <td className="px-3 py-2">{new Date(r.requestDate).toLocaleDateString()}</td>
                    <td className="px-3 py-2">{r.requestFrom.name}</td>
                    <td className="px-3 py-2">{r.requestTo.name}</td>
                    <td className="px-3 py-2 text-center">{r.items.length}</td>
                    <td className="px-3 py-2">
                    <select
  value={r.status}
  onChange={e => changeStatus(r._id, e.target.value)}
  className={`
    text-xs
    font-bold
    uppercase
    px-3 py-2
    rounded
    border
    appearance-none
    transition

    ${
      r.status === 'pending'
        ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
        : r.status === 'received'
        ? 'bg-green-100 text-green-800 border-green-300'
        : 'bg-gray-100 text-gray-800 border-gray-300'
    }
  `}
>
  <option value="pending">PENDING</option>
  <option value="received">RECEIVED</option>
  <option value="not-submitted">NOT SUBMITTED</option>
</select>

                    </td>
                    <td className="px-3 py-2">
                      <button
                        onClick={()=>handlePrint(r)}
                        className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700"
                      >
                        <FaPrint className="inline-block mr-1" /> Print
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden">{pageData.map(Card)}</div>

          {/* Pagination */}
          <div className="mt-4 flex justify-between items-center">
            <button
              onClick={()=>setCurrentPage(p=>p-1)}
              disabled={currentPage===1}
              className={`px-4 py-2 text-xs font-semibold rounded ${
                currentPage===1
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              Previous
            </button>
            <span className="text-xs text-gray-600">
              Page {currentPage} / {totalPages}
            </span>
            <button
              onClick={()=>setCurrentPage(p=>p+1)}
              disabled={currentPage===totalPages}
              className={`px-4 py-2 text-xs font-semibold rounded ${
                currentPage===totalPages
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              Next
            </button>
          </div>
        </>
      )}

      {/* Detail Modal */}
      {selectedRequest && (
        <Dialog
          open fullScreen
          onClose={()=>setSelectedRequest(null)}
          TransitionComponent={Transition}
        >
          <DialogContent className="relative p-6 lg:p-12 overflow-auto">
            <IconButton
              onClick={()=>setSelectedRequest(null)}
              sx={{ position:'absolute', top:16, right:16, color:'gray' }}
            >
              <CloseIcon fontSize="large"/>
            </IconButton>

            {/* Modal Header */}
            <h2 className="text-2xl font-bold text-red-600 mb-4">
              Purchase Request Details
            </h2>

            {/* Meta info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-6">
              <div>
                <p><strong>ID:</strong> {selectedRequest._id}</p>
                <p><strong>Date:</strong> {new Date(selectedRequest.requestDate).toLocaleString()}</p>
                <p><strong>From:</strong> {selectedRequest.requestFrom.name}</p>
                <p className="text-gray-500 text-xs">{selectedRequest.requestFrom.address}</p>
              </div>
              <div>
                <p><strong>To:</strong> {selectedRequest.requestTo.name}</p>
                <p className="text-gray-500 text-xs">{selectedRequest.requestTo.address}</p>
                <p className="flex items-center"><strong>Status:</strong>
                <select
  value={selectedRequest.status}
  onChange={e => changeStatus(selectedRequest._id, e.target.value)}
  className={`ml-2 text-xs font-bold uppercase px-2 py-1 rounded focus:outline-none transition
    ${
      selectedRequest.status === 'pending'
        ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
        : selectedRequest.status === 'received'
        ? 'bg-green-100 text-green-800 border border-green-300'
        : 'bg-gray-100 text-gray-800 border border-gray-300'
    }`
  }
>
  <option value="pending">Pending</option>
  <option value="received">Received</option>
  <option value="not-submitted">Not Submitted</option>
</select>

                </p>
              </div>
            </div>

            {/* Items table */}
            <h3 className="text-lg font-semibold mb-2">Items ({selectedRequest.items.length})</h3>
            <div className="overflow-x-auto mb-8">
              <table className="w-full text-sm text-gray-700">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2">#</th>
                    <th className="px-3 py-2">ID</th>
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2 text-center">Qty</th>
                    <th className="px-3 py-2 text-center">Unit</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedRequest.items.map((it, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-3 py-2">{i+1}</td>
                      <td className="px-3 py-2">{it.itemId}</td>
                      <td className="px-3 py-2">{it.name}</td>
                      <td className="px-3 py-2 text-center">{it.quantity}</td>
                      <td className="px-3 py-2 text-center">{it.pUnit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Authorized Signature */}
            <div className="mt-12 text-right">
              <p className="inline-block border-t border-gray-400 pt-2 text-sm">
                Authorized Signature
              </p>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Mobile Filter Button */}
      <button
        onClick={()=>setShowSidebar(true)}
        className="md:hidden fixed bottom-6 right-6 bg-red-600 p-3 rounded-full shadow-lg text-white"
      >
        <FaFilter />
      </button>
    </>
  );
}
