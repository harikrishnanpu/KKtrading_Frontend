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
import CommentItem from './components/comment';
import StatusBadge from './components/statusBadge';
import api from 'pages/api';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const UpdateList = () => {
  const { user } = useAuth();

  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [selected, setSelected] = useState(null);
  const [showAdd, setShowAdd]   = useState(false);

  const [commentText, setCommentText] = useState('');
  const [posting, setPosting] = useState(false);

  /* ---- fetch ---- */
  const fetchUpdates = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/updates');
      setUpdates(data.updates || data);    // supports both shapes
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

  /* ---- helpers ---- */
  const openAdd  = () => setShowAdd(true);
  const closeAdd = () => setShowAdd(false);

  const openView  = (u) => setSelected(u);
  const closeView = () => { setSelected(null); setCommentText(''); };

  const onCreated = (u) => { setUpdates([u, ...updates]); closeAdd(); };

  const replaceUpdate = (u) =>
    setUpdates((p) => p.map((x) => (x._id === u._id ? u : x)));

  const onStatusChange = async (id, status) => {
    const { data } = await api.patch(`/api/updates/${id}/status`, { status, _id: user._id, name: user.name });
    replaceUpdate(data);
    if (selected?._id === id) setSelected(data);
  };

  const onDeleteUpdate = async (id) => {
    if (!window.confirm('Delete this update?')) return;
    await api.delete(`/api/updates/${id}`);
    setUpdates((p) => p.filter((u) => u._id !== id));
    if (selected?._id === id) closeView();
  };

  /* ---- comments ---- */
  const addComment = async () => {
    if (!commentText.trim()) return;
    setPosting(true);
    const { data } = await api.post(`/api/updates/${selected._id}/comment`,
      { text: commentText, _id: user._id, name: user.name });
    replaceUpdate(data);
    setSelected(data);
    setCommentText('');
    setPosting(false);
  };

  const editComment = async (commentId, text) => {
    const { data } = await api.patch(`/api/updates/${selected._id}/comment/${commentId}`,
      { text, _id: user._id, name: user.name });
    replaceUpdate(data);
    setSelected(data);
  };

  const deleteComment = async (commentId) => {
    if (!window.confirm('Delete comment?')) return;
    const { data } = await api.delete(`/api/updates/${selected._id}/comment/${commentId}`,
      { data: { _id: user._id } });
    replaceUpdate(data);
    setSelected(data);
  };

  const addReply = async (commentId, text) => {
    const { data } = await api.post(`/api/updates/${selected._id}/comment/${commentId}/reply`,
      { text, _id: user._id, name: user.name });
    replaceUpdate(data);
    setSelected(data);
  };

  /* ---- loading skeleton ---- */
  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} height={80} />
        ))}
      </div>
    );
  }

  /* ---- UI ---- */
  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold text-red-600">Project Updates</h1>
        <button
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-xs font-bold shadow"
          onClick={openAdd}
        >
          + New Update
        </button>
      </div>

      {error && <p className="text-xs text-red-500 mb-4">{error}</p>}

      {/* mobile cards */}
      <div className="md:hidden space-y-4">
        {sorted.map((u) => (
          <div
            key={u._id}
            className="bg-white/70 backdrop-blur p-4 rounded-lg shadow cursor-pointer hover:shadow-lg transition"
            onClick={() => openView(u)}
          >
            <div className="flex justify-between items-center">
              <h2 className="font-semibold text-sm text-gray-800">{u.title}</h2>
              <StatusBadge status={u.status} />
            </div>
            <div className="prose prose-xs mt-1 line-clamp-2" dangerouslySetInnerHTML={{ __html: u.description }} />
            <p className="text-[10px] text-gray-400 mt-2">
              {new Date(u.createdAt).toLocaleString()} · {u.requestedByName}
            </p>
          </div>
        ))}
      </div>

      {/* desktop table */}
      <div className="hidden md:block">
        <table className="w-full text-xs bg-white shadow rounded-lg overflow-hidden">
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Title</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Requester</th>
              <th className="px-3 py-2 font-medium">Created</th>
              <th className="px-3 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((u) => (
              <tr key={u._id} className="border-t hover:bg-gray-50">
                <td onClick={() => openView(u)} className="px-3 py-2 font-semibold cursor-pointer text-gray-800">
                  {u.title}
                </td>
                <td className="px-3 py-2"><StatusBadge status={u.status} /></td>
                <td className="px-3 py-2 text-center">{u.requestedByName}</td>
                <td className="px-3 py-2 text-center">{new Date(u.createdAt).toLocaleDateString()}</td>
                <td className="px-3 py-2 flex flex-wrap gap-1 justify-center">
                  {user.isAdmin && (
                    <>
                      {u.status !== 'resolved' && (
                        <button
                          className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded"
                          onClick={() => onStatusChange(u._id, 'resolved')}
                        >
                          Resolve
                        </button>
                      )}
                      <button
                        className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded"
                        onClick={() => onDeleteUpdate(u._id)}
                      >
                        Delete
                      </button>
                    </>
                  )}
                  <button
                    className="bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded"
                    onClick={() => openView(u)}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* add modal */}
      {showAdd && (
        <AddUpdateModal open={showAdd} onClose={closeAdd} onCreated={onCreated} user={user} />
      )}

      {/* view / comments modal */}
      {selected && (
        <Dialog open onClose={closeView} fullScreen TransitionComponent={Transition}>
          <DialogContent className="relative p-4 sm:p-8 max-w-3xl mx-auto">
            <IconButton onClick={closeView} sx={{ position: 'absolute', top: 8, right: 8 }}>
              <CloseIcon fontSize="large" />
            </IconButton>

            <h2 className="text-2xl font-bold text-gray-800 mb-1">{selected.title}</h2>
            <div className="flex items-center gap-2 mb-4">
              <StatusBadge status={selected.status} />
              <span className="text-xs text-gray-500">
                {new Date(selected.createdAt).toLocaleString()} · {selected.requestedByName}
              </span>
            </div>

            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: selected.description || '<p>(no description)</p>' }}
            />

            {/* comment composer */}
            <div className="mt-8">
              <TextField
                fullWidth
                size="small"
                placeholder="Write a comment…"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                variant="outlined"
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={addComment}
                  disabled={posting || !commentText.trim()}
                  className={`px-4 py-1 rounded text-xs font-bold ${
                    posting || !commentText.trim()
                      ? 'bg-gray-300 text-gray-500'
                      : 'bg-red-500 hover:bg-red-600 text-white'
                  }`}
                >
                  {posting ? 'Posting…' : 'Send'}
                </button>
              </div>
            </div>

            {/* comments list */}
            <h3 className="text-sm font-semibold text-gray-800 mt-8">
              Comments ({selected.comments.length})
            </h3>
            {selected.comments.length === 0 ? (
              <p className="text-xs text-gray-500 mt-2">No comments yet.</p>
            ) : (
              <ul className="space-y-3 mt-3">
                {selected.comments.map((c) => (
                  <CommentItem
                    key={c._id}
                    comment={c}
                    user={user}
                    onEdit={(txt) => editComment(c._id, txt)}
                    onDelete={() => deleteComment(c._id)}
                    onReply={(txt) => addReply(c._id, txt)}
                  />
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
