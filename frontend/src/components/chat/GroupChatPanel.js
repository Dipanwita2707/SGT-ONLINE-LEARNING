import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography, IconButton, TextField, Button, List, ListItem, ListItemText, Divider, Tooltip } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import { ensureRoom, fetchMessages, sendMessage, deleteMessage } from '../../api/chatApi';
import io from 'socket.io-client';

let socketInstance = null;

export default function GroupChatPanel({ open, onClose, courseId, sectionId, title, currentUser }) {
  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const listRef = useRef(null);
  const canDelete = ['admin','hod','dean'].includes(currentUser?.role);

  // Init socket
  useEffect(() => {
    if (!open) return;
    const token = localStorage.getItem('token');
    if (!socketInstance) {
      socketInstance = io('/', {
        auth: { token }
      });
    }
    return () => {
      // do not disconnect globally to allow reuse across panels
    };
  }, [open]);

  useEffect(() => {
    if (!open || !courseId || !sectionId) return;
    console.log('[GroupChatPanel] Attempting to create room with:', { courseId, sectionId, currentUser });
    let active = true;
    (async () => {
      try {
        const r = await ensureRoom(courseId, sectionId);
        if (!active) return;
        setRoom(r);
        const msgs = await fetchMessages(r._id);
        if (!active) return;
        setMessages(msgs);
        scrollToBottom();
        if (socketInstance) {
          socketInstance.emit('join_room', { roomId: r._id });
        }
      } catch (e) {
        console.error('[GroupChatPanel] Failed to load chat:', e);
        if (active) setError('Failed to load chat');
      }
    })();
    return () => { active = false; };
  }, [open, courseId, sectionId]);

  // Listen for realtime events
  useEffect(() => {
    if (!socketInstance) return;
    function onNew(message) {
      setMessages(prev => prev.some(m => m._id === message._id) ? prev : [...prev, message]);
      scrollToBottom();
    }
    function onDeleted(payload) {
      setMessages(prev => prev.map(m => m._id === payload.messageId ? { ...m, deleted: true } : m));
    }
    socketInstance.on('message_new', onNew);
    socketInstance.on('message_deleted', onDeleted);
    return () => {
      socketInstance.off('message_new', onNew);
      socketInstance.off('message_deleted', onDeleted);
    };
  }, [room?._id]);

  function scrollToBottom() {
    if (listRef.current) {
      setTimeout(() => {
        listRef.current.scrollTop = listRef.current.scrollHeight;
      }, 50);
    }
  }

  async function handleSend() {
    if (!input.trim() || !room) return;
    const body = input.trim();
    setInput('');
    try {
      await sendMessage(room._id, body);
      // message will arrive via socket broadcast
    } catch (e) {
      setError('Send failed');
    }
  }

  async function handleDelete(id) {
    try {
      await deleteMessage(id);
      setMessages(prev => prev.map(m => m._id === id ? { ...m, deleted: true } : m));
    } catch (e) {
      // ignore
    }
  }

  const displayName = (m) => {
    if (m.senderRole === 'admin') return 'Admin';
    return `${m.senderName || ''}`.trim();
  };

  return (
    <Box sx={{
      position: 'fixed',
      top: 0,
      right: open ? 0 : -420,
      width: 400,
      height: '100vh',
      bgcolor: 'background.paper',
      boxShadow: 4,
      zIndex: 1400,
      display: 'flex',
      flexDirection: 'column',
      transition: 'right 0.3s ease'
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', p:1, borderBottom: '1px solid #ddd' }}>
        <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
          {title || 'Group Chat'}
        </Typography>
        <IconButton size="small" onClick={onClose}><CloseIcon /></IconButton>
      </Box>
      <Box ref={listRef} sx={{ flexGrow: 1, overflowY: 'auto', p:1 }}>
        <List dense>
          {messages.map(m => (
            <React.Fragment key={m._id}>
              <ListItem alignItems="flex-start" sx={{ opacity: m.deleted ? 0.5 : 1 }}>
                <ListItemText
                  primary={m.deleted ? '(message deleted)' : m.body}
                  secondary={`${m.senderRole === 'admin' ? 'Admin' : (m.senderRole || '')} • ${new Date(m.createdAt).toLocaleTimeString()}`}
                />
                {canDelete && !m.deleted && (
                  <Tooltip title="Delete message">
                    <IconButton edge="end" size="small" onClick={() => handleDelete(m._id)}>
                      <DeleteIcon fontSize="inherit" />
                    </IconButton>
                  </Tooltip>
                )}
              </ListItem>
              <Divider />
            </React.Fragment>
          ))}
        </List>
      </Box>
      <Box sx={{ p:1, borderTop: '1px solid #ddd' }}>
        <TextField
          size="small"
          fullWidth
          placeholder="Type a message"
          value={input}
          onChange={(e)=>setInput(e.target.value)}
          onKeyDown={(e)=>{ if(e.key==='Enter'){ e.preventDefault(); handleSend(); } }}
        />
        <Button sx={{ mt:1 }} fullWidth variant="contained" onClick={handleSend} disabled={!input.trim()}>Send</Button>
        {error && <Typography color="error" variant="caption">{error}</Typography>}
      </Box>
    </Box>
  );
}
