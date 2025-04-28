import React, { useState } from 'react';
import { Dialog, DialogContent, IconButton, Slide } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import api from 'pages/api';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const AddUpdateModal = ({ open, onClose, onCreated, user }) => {
  const [title, setTitle] = useState('');
  const [desc,  setDesc]  = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const { data } = await api.post('/api/updates', {
        title,
        description: desc,
        _id:  user._id,
        name: user.name,
      });
      onCreated(data);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" TransitionComponent={Transition}>
      <DialogContent className="relative p-6 space-y-4">
        <IconButton onClick={onClose} sx={{ position: 'absolute', top: 8, right: 8 }}>
          <CloseIcon />
        </IconButton>

        <h2 className="text-lg font-bold text-gray-800">New Update</h2>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none"
        />

        <ReactQuill theme="snow" value={desc} onChange={setDesc} />

        <div className="text-right pt-2">
          <button
            disabled={saving}
            onClick={save}
            className={`px-4 py-2 rounded text-white text-xs font-bold ${
              saving ? 'bg-gray-400' : 'bg-red-500 hover:bg-red-600'
            }`}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddUpdateModal;
