import React, { useState } from 'react';
import { Dialog, DialogContent, IconButton, Slide } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import api from 'pages/api';
import useAuth from 'hooks/useAuth';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const AddUpdateModal = ({ open, onClose, onCreated }) => {
  const [title,       setTitle]       = useState('');
  const [description, setDescription] = useState('');
  const [saving,      setSaving]      = useState(false);
  const [err,         setErr]         = useState('');
  const { user } = useAuth();

  const save = async () => {
    if (!title.trim()) return setErr('Title is required');
    setSaving(true);
    try {
      const { data } = await api.post('/api/updates', { title, description, _id: user._id , name: user.name  });
      onCreated(data);
    } catch (e) {
      setErr('Could not create update');
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" TransitionComponent={Transition}>
      <DialogContent className="relative p-6">
        <IconButton onClick={onClose} sx={{ position: 'absolute', top: 8, right: 8 }}>
          <CloseIcon />
        </IconButton>

        <h2 className="text-lg font-bold text-red-600 mb-4">New Update</h2>

        {err && <p className="text-xs text-red-500 mb-2">{err}</p>}

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="w-full border border-red-300 rounded px-3 py-2 text-sm focus:outline-none mb-4"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={6}
          placeholder="Description / details"
          className="w-full border border-red-300 rounded px-3 py-2 text-sm focus:outline-none"
        />

        <div className="mt-6 text-right">
          <button
            onClick={save}
            disabled={saving}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-xs font-bold"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddUpdateModal;
