import React from 'react';
import { Button } from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';

export default function GroupChatButton({ onClick, size='small', variant='outlined' }) {
  return (
    <Button size={size} variant={variant} startIcon={<ChatIcon />} onClick={onClick}>
      Group Chat
    </Button>
  );
}
