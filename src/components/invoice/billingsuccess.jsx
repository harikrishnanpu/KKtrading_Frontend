// BillingSuccess.js
import React, { useEffect, useRef, useState, forwardRef } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  IconButton,
  Button,
  Grid,
  Slide,
  Box,
} from '@mui/material';
import { CloseCircle } from 'iconsax-react';
import './billingSuccess.css';
import { useTabs } from 'contexts/TabsContext';

// Transition component for Slide animation from bottom
const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const BillingSuccess = ({ estimationNo, isAdmin, page='estimate' }) => {
  const navigate = useNavigate();
  const audioRef = useRef(null);
  const {closeTab,activeTab} = useTabs();
  const [open, setOpen] = useState(true);

  const handleContinue = () => {
    if (audioRef.current) {
      audioRef.current.play().catch((error) => {
        console.error('Error playing audio:', error);
      });
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      handleContinue();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setOpen(false);
    closeTab(activeTab);
    if(page == 'purchase'){
      navigate('/purchase/list/');
    }else{
      navigate('/invoice/list/');
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      TransitionComponent={Transition}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          margin: 0,
          bottom: 0,
          position: 'fixed',
          borderBottomLeftRadius: 2,
          borderBottomRightRadius: 2,
        },
      }}
      aria-labelledby="billing-success-title"
      aria-describedby="billing-success-description"
    >
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="subtitle1" component="div" color="error"></Typography>
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseCircle size="24" color="#9e9e9e" variant="Outline" />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Box display="flex" flexDirection="column" alignItems="center" textAlign="center" mb={2}>
        <div className="checkmark-container mb-6">
          <i className="fa fa-check checkmark"></i>
        </div>
          <Typography
            id="billing-success-title"
            variant="h6"
            component="div"
            fontWeight="bold"
            gutterBottom
          >
            Estimation No: {estimationNo || 'Error'}
          </Typography>
          {!isAdmin ? (
            <>
              <Typography
                variant="subtitle1"
                color="error"
                fontWeight="bold"
                gutterBottom
              >
                Successfully Submitted
              </Typography>
              <Typography
                variant="body2"
                color="textSecondary"
                fontStyle="italic"
                sx={{ animation: 'pulse 2s infinite' }}
              >
                Your Estimation Bill is successfully submitted to the Admin Panel for review.
              </Typography>
            </>
          ) : (
            <>
              <Typography
                variant="subtitle1"
                color="error"
                fontWeight="bold"
                gutterBottom
              >
                Successfully Submitted Bill
              </Typography>
              <Typography
                variant="body2"
                color="textSecondary"
                fontStyle="italic"
                sx={{ animation: 'pulse 2s infinite' }}
              >
                Your Bill is successfully submitted.
              </Typography>
            </>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', padding: 2 }}>
        <Button
          variant="outlined"
          color="error"
          onClick={handleClose}
          sx={{
            px: 4,
            py: 1,
            fontSize: '0.9rem',
            fontWeight: 'bold',
            borderRadius: 2,
            backgroundColor: 'error.main',
            '&:hover': {
              backgroundColor: 'error.dark',
            },
          }}
        >
          Continue
        </Button>
      </DialogActions>

      {/* Audio Element */}
      <audio ref={audioRef} src={`/sounds/success.mp3`} preload="auto" />
    </Dialog>
  );
};

// PropTypes for type checking
BillingSuccess.propTypes = {
  estimationNo: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  isAdmin: PropTypes.bool.isRequired,
};

export default BillingSuccess;
