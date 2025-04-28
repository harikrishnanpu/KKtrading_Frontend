// src/screens/UpdateList.jsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  IconButton,
  Slide,
  TextField,
} from '@mui/material';
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

  /* —— comment composer —— */
  const [commentText, setCommentText]   = useState('');
  const [posting,     setPosting]       = useState(false);

  /* —— fetch —— */
  const fetchUpdates = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/updates',{ _id: user._id , name: user.name });
      setUpdates(data);
    } catch {
      setError('Could not load updates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUpdates(); }, []);

  const sorted = useMemo(
    () => [...updates].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [updates]
  );

  /* —— handlers —— */
  const openAdd   = () => setShowAdd(true);
  const closeAdd  = () => setShowAdd(false);
  const openView  = (upd) => setSelected(upd);
  const closeView = () => {
    setSelected(null);
    setCommentText('');
  };

  const onCreated = (newUpd) => {
    setUpdates([newUpd, ...updates]);
    closeAdd();
  };

  const onStatusChange = async (id, nextStatus) => {
    const { data } = await api.patch(`/api/updates/${id}/status`, { status: nextStatus , _id: user._id , name: user.name  });
    setUpdates((prev) => prev.map((u) => (u._id === id ? data : u)));
    if (selected?._id === id) setSelected(data);
  };

  const onDelete = async (id) => {
    if (!window.confirm('Delete this update?')) return;
    try {
      await api.delete(`/api/updates/${id}`);
      setUpdates((prev) => prev.filter((u) => u._id !== id));
      if (selected?._id === id) closeView();
    } catch {
      alert('Delete failed');
    }
  };

  const postComment = async () => {
    if (!commentText.trim()) return;
    setPosting(true);
    try {
      const { data } = await api.post(`/api/updates/${selected._id}/comment`, {
        text: commentText,
      });
      // server returns full updated doc
      setUpdates((prev) => prev.map((u) => (u._id === data._id ? data : u)));
      setSelected(data);
      setCommentText('');
    } catch {
      alert('Could not post comment');
    } finally {
      setPosting(false);
    }
  };

  /* —— loading skeleton —— */
  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} height={80} />
        ))}
      </div>
    );
  }

  /* —— UI —— */
  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold text-red-600">Project Updates</h1>
        <button
          onClick={openAdd}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-xs font-bold shadow"
        >
          + New Update
        </button>
      </div>

      {error && <p className="text-xs text-red-500 mb-4">{error}</p>}

      {/* ————————— Mobile cards ————————— */}
      <div className="md:hidden space-y-4">
        {sorted.map((u) => (
          <div
            key={u._id}
            onClick={() => openView(u)}
            className="bg-white/70 backdrop-blur p-4 rounded-lg shadow cursor-pointer transition hover:shadow-lg"
          >
            <div className="flex justify-between items-center">
              <h2 className="font-semibold text-sm text-gray-800">{u.title}</h2>
              <StatusBadge status={u.status} />
            </div>
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
              {u.description}
            </p>
            <p className="text-[10px] text-gray-400 mt-2">
              {new Date(u.createdAt).toLocaleString()} · {u.requestedByName}
            </p>
          </div>
        ))}
      </div>

      {/* ————————— Desktop table ————————— */}
      <div className="hidden md:block">
        <table className="w-full text-xs bg-white shadow rounded-lg overflow-hidden">
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Title</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Requested&nbsp;By</th>
              <th className="px-3 py-2 font-medium">Created</th>
              <th className="px-3 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((u) => (
              <tr key={u._id} className="border-t hover:bg-gray-50">
                <td
                  onClick={() => openView(u)}
                  className="px-3 py-2 font-semibold text-gray-800 cursor-pointer"
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
                <td className="px-3 py-2 flex flex-wrap gap-1 justify-center">
                  {user.isAdmin && (
                    <>
                      {u.status !== 'resolved' && (
                        <button
                          onClick={() => onStatusChange(u._id, 'resolved')}
                          className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded"
                        >
                          Resolve
                        </button>
                      )}
                      {u.status !== 'not_resolved' && (
                        <button
                          onClick={() => onStatusChange(u._id, 'not_resolved')}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded text-[10px]"
                        >
                          Not&nbsp;Resolved
                        </button>
                      )}
                      <button
                        onClick={() => onDelete(u._id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded"
                      >
                        Delete
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => openView(u)}
                    className="bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ————————— Add-update modal ————————— */}
      {showAdd && (
        <AddUpdateModal open={showAdd} onClose={closeAdd} onCreated={onCreated} />
      )}

      {/* ————————— Detail / comments modal ————————— */}
      {selected && (
        <Dialog
          open
          onClose={closeView}
          fullScreen
          TransitionComponent={Transition}
        >
          <DialogContent className="relative p-4 sm:p-8 max-w-3xl mx-auto">
            <IconButton
              onClick={closeView}
              sx={{ position: 'absolute', top: 8, right: 8, color: 'gray' }}
            >
              <CloseIcon fontSize="large" />
            </IconButton>

            {/* Header */}
            <h2 className="text-2xl font-bold text-gray-800 mb-1">
              {selected.title}
            </h2>
            <div className="flex items-center gap-2 mb-4">
              <StatusBadge status={selected.status} />
              <span className="text-xs text-gray-500">
                {new Date(selected.createdAt).toLocaleString()} · {selected.requestedByName}
              </span>
            </div>

            {/* Description */}
            <p className="whitespace-pre-wrap text-sm text-gray-700">
              {selected.description || '(no description)'}
            </p>

            {/* Comments */}
            <h3 className="text-sm font-semibold text-gray-800 mt-8">
              Comments ({selected.comments.length})
            </h3>

            {selected.comments.length === 0 ? (
              <p className="text-xs text-gray-500 mt-2">No comments yet.</p>
            ) : (
              <ul className="space-y-3 mt-3">
                {selected.comments.map((c) => (
                  <li
                    key={c._id}
                    className="bg-gray-100 p-3 rounded text-xs flex justify-between"
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

            {/* Composer */}
            <div className="mt-6">
              <TextField
                fullWidth
                size="small"
                placeholder="Write a comment…"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                multiline
                minRows={3}
                variant="outlined"
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={postComment}
                  disabled={posting || !commentText.trim()}
                  className={`px-4 py-1 rounded text-xs font-bold ${
                    posting || !commentText.trim()
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-red-500 hover:bg-red-600 text-white'
                  }`}
                >
                  {posting ? 'Posting…' : 'Send'}
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default UpdateList;
