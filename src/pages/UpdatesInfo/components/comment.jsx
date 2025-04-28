import React, { useState } from 'react';
import { TextField } from '@mui/material';

const CommentItem = ({
  comment,
  onEdit,
  onDelete,
  onReply,
  user,
}) => {
  const [editMode, setEditMode] = useState(false);
  const [editText, setEditText] = useState(comment.text);

  const [replyMode, setReplyMode] = useState(false);
  const [replyText, setReplyText] = useState('');

  /* ------ helpers ------ */
  const handleEditSave = () => {
    if (!editText.trim()) return;
    onEdit(editText);
    setEditMode(false);
  };

  const handleReplySave = () => {
    if (!replyText.trim()) return;
    onReply(replyText);
    setReplyText('');
    setReplyMode(false);
  };

  /* ------ UI ------ */
  return (
    <li className="bg-gray-100 p-3 rounded text-xs space-y-2">
      {/* main row */}
      <div className="flex justify-between">
        {!editMode ? (
          <span className="flex-1">
            <strong>{comment.commentedByName}: </strong>
            {comment.text}
          </span>
        ) : (
          <TextField
            size="small"
            fullWidth
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
          />
        )}
        <span className="text-[10px] text-gray-500 pl-2 shrink-0">
          {new Date(comment.createdAt).toLocaleString()}
        </span>
      </div>

      {/* action row */}
      <div className="space-x-2">
        {comment.commentedBy === user._id && (
          <>
            {!editMode ? (
              <button
                onClick={() => setEditMode(true)}
                className="text-[10px] text-blue-600"
              >
                Edit
              </button>
            ) : (
              <button
                onClick={handleEditSave}
                className="text-[10px] text-blue-600"
              >
                Save
              </button>
            )}
            <button
              onClick={onDelete}
              className="text-[10px] text-red-600"
            >
              Delete
            </button>
          </>
        )}
        <button
          onClick={() => setReplyMode((p) => !p)}
          className="text-[10px] text-gray-600"
        >
          {replyMode ? 'Cancel' : 'Reply'}
        </button>
      </div>

      {/* reply composer */}
      {replyMode && (
        <div className="pl-4">
          <TextField
            size="small"
            fullWidth
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write a reply…"
          />
          <button
            onClick={handleReplySave}
            className="mt-1 bg-red-500 hover:bg-red-600 text-white px-2 py-[2px] rounded text-[10px]"
          >
            Send
          </button>
        </div>
      )}

      {/* replies list */}
      {comment.replies?.length > 0 && (
        <ul className="space-y-2 pl-4 border-l border-gray-300 mt-2">
          {comment.replies.map((r) => (
            <li key={r._id} className="text-[11px]">
              <strong>{r.repliedByName}: </strong>
              {r.text}{' '}
              <span className="text-[9px] text-gray-500">
                {new Date(r.createdAt).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
};

export default CommentItem;
