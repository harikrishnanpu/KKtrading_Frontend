import React from 'react';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  textAlign: 'center',
  borderRadius: 2,
};

const ErrorModal = ({ message, onClose }) => {
  return (
    <Modal
      open={true}
      onClose={onClose}
      aria-labelledby="error-modal-title"
      aria-describedby="error-modal-description"
    >
      <Box sx={style}>
        <ErrorOutlineIcon 
          color="error" 
          sx={{ fontSize: 60, mb: 2 }} 
        />
        <Typography 
          id="error-modal-title" 
          variant="h6" 
          component="h2"
          gutterBottom
        >
          Error Occurred!
        </Typography>
        <Typography 
          id="error-modal-description" 
          sx={{ mt: 2, mb: 3 }}
        >
          {message}
        </Typography>
        <Button
          variant="outlined"
          color="error"
          onClick={onClose}
        >
          Close
        </Button>
      </Box>
    </Modal>
  );
};

export default ErrorModal;

