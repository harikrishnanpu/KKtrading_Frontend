import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, IconButton, Slide } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import useAuth from 'hooks/useAuth';
import AddUpdateModal from './components/addUpdate';
import StatusBadge from './components/statusBadge';
import api from 'pages/api';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const UpdateList = () => {
  const { user } = useAuth();
  const [updates, setUpdates]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [selected, setSelected] = useState(null);
  const [showAdd,  setShowAdd]  = useState(false);

  // fetch
  const fetchUpdates = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/updates', {  _id: user._id , name: user.name });
      setUpdates(data);
    } catch (e) {
      setError('Could not load updates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUpdates(); }, []);

  // memoised for small demo
  const sorted = useMemo(
    () => [...updates].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [updates]
  );

  /* ——— handlers ——— */
  const openAdd  = () => setShowAdd(true);
  const closeAdd = () => setShowAdd(false);

  const openView = (upd) => setSelected(upd);
  const closeView= () => setSelected(null);

  const onCreated = (newUpd) => {
    setUpdates([newUpd, ...updates]);
    closeAdd();
  };

  const onStatusChange = async (id, nextStatus) => {
    const { data } = await api.patch(`/api/updates/${id}/status`, { status: nextStatus ,  _id: user._id , name: user.name});
    setUpdates(updates.map((u) => (u._id === id ? data : u)));
  };

  /* ——— render ——— */
  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} height={80} />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold text-red-600">Project Updates</h1>
        <button
          onClick={openAdd}
          className="bg-red-500 text-white px-4 py-2 rounded text-xs font-bold"
        >
          + New Update
        </button>
      </div>

      {/* cards (mobile) */}
      <div className="md:hidden space-y-4">
        {sorted.map((u) => (
          <div
            key={u._id}
            onClick={() => openView(u)}
            className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg cursor-pointer"
          >
            <div className="flex justify-between items-center">
              <h2 className="font-bold text-sm text-red-600">{u.title}</h2>
              <StatusBadge status={u.status} />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {u.description?.slice(0, 80)}…
            </p>
            <p className="text-[10px] text-gray-400 mt-2">
              Requested by {u.requestedByName} ·{' '}
              {new Date(u.createdAt).toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {/* table (desktop) */}
      <div className="hidden md:block">
        <table className="w-full text-xs bg-white shadow-md rounded-lg overflow-hidden">
          <thead className="bg-red-600 text-white">
            <tr>
              <th className="px-3 py-2 text-left">Title</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Requested&nbsp;By</th>
              <th className="px-3 py-2">Created</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((u) => (
              <tr key={u._id} className="border-t hover:bg-gray-50">
                <td
                  onClick={() => openView(u)}
                  className="px-3 py-2 font-bold text-red-600 cursor-pointer"
                >
                  {u.title}
                </td>
                <td className="px-3 py-2">
                  <StatusBadge status={u.status} />
                </td>
                <td className="px-3 py-2 text-center">{u.requestedByName}</td>
                <td className="px-3 py-2 text-center">
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
                <td className="px-3 py-2 space-x-1 text-center">
                  {user.isAdmin && (
                    <>
                      {u.status !== 'resolved' && (
                        <button
                          onClick={() => onStatusChange(u._id, 'resolved')}
                          className="bg-green-500 text-white px-2 py-1 rounded"
                        >
                          Resolve
                        </button>
                      )}
                      {u.status !== 'not_resolved' && (
                        <button
                          onClick={() => onStatusChange(u._id, 'not_resolved')}
                          className="bg-yellow-500 text-white px-2 py-1 rounded text-[10px]"
                        >
                          Not&nbsp;Resolved
                        </button>
                      )}
                    </>
                  )}
                  <button
                    onClick={() => openView(u)}
                    className="bg-gray-200 px-2 py-1 rounded"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ---------- add modal ---------- */}
      {showAdd && (
        <AddUpdateModal open={showAdd} onClose={closeAdd} onCreated={onCreated} />
      )}

      {/* ---------- view modal ---------- */}
      {selected && (
        <Dialog
          open
          onClose={closeView}
          fullScreen
          TransitionComponent={Transition}
        >
          <DialogContent className="relative p-4 sm:p-8">
            <IconButton
              onClick={closeView}
              sx={{ position: 'absolute', top: 8, right: 8, color: 'gray' }}
            >
              <CloseIcon fontSize="large" />
            </IconButton>

            <h2 className="text-lg font-bold text-red-600 mb-4">
              {selected.title}
            </h2>
            <StatusBadge status={selected.status} />

            <p className="mt-4 whitespace-pre-wrap text-sm">
              {selected.description}
            </p>

            <p className="text-xs text-gray-500 mt-6">
              Requested by {selected.requestedByName} ·{' '}
              {new Date(selected.createdAt).toLocaleString()}
            </p>

            <h3 className="text-sm font-bold text-red-600 mt-8">
              Comments ({selected.comments.length})
            </h3>

            {selected.comments.length === 0 ? (
              <p className="text-xs text-gray-500">No comments yet.</p>
            ) : (
              <ul className="space-y-3 mt-3">
                {selected.comments.map((c) => (
                  <li
                    key={c._id}
                    className="bg-gray-100 p-2 rounded text-xs flex justify-between"
                  >
                    <span className="flex-1">
                      <strong>{c.commentedByName}: </strong>
                      {c.text}
                    </span>
                    <span className="text-[10px] text-gray-500 pl-2 shrink-0">
                      {new Date(c.createdAt).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default UpdateList;
