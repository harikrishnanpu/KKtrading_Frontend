// src/components/SummaryModal.js
import React, { useEffect, useRef, useState, forwardRef } from 'react';
import PropTypes from 'prop-types';
import useAuth from 'hooks/useAuth';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  IconButton,
  TextField,
  Select,
  MenuItem,
  Button,
  Grid,
  Slide,
  Box,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { CloseCircle } from 'iconsax-react'; // Importing CloseCircle from iconsax-react
import SubmitButton from 'components/submitButton';

// Transition component for Slide animation from bottom
const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function SummaryModal({
  customerName,
  invoiceNo,
  totalAmount,
  amountWithoutGST,
  cgst,
  sgst,
  discount,
  setDiscount,
  receivedAmount,
  setReceivedAmount,
  paymentMethod,
  setPaymentMethod,
  receivedDate,
  setReceivedDate,
  onClose,
  onSubmit,
  isSubmitting,
  salesmanName,
  totalProducts,
  roundOff,
  setRoundOff,
  roundOffRef,
  handleLocalSave,
  unloading,
  setUnloading,
  transportation,
  setTransportation,
  handling,
  setHandling,
  remark,
  setRemark,
  grandTotal,
  accounts,
  discountRef,
  paymentMethodRef,
  receivedDateRef,
  unloadingRef,
  transportationRef,
  handlingRef,
  remarkRef,
  changeRef,
  receivedAmountRef,
  neededToPurchase,
  setNeededToPurchase,
  isApproved,
  setIsApproved,
}) {
  const remainingAmount = (parseFloat(parseFloat(grandTotal)) - parseFloat(receivedAmount)).toFixed(2);

  const { user: userInfo } = useAuth(); // Get the logged-in user info
  const [fetchedReceivedAmount, setFetchedReceivedAmount] = useState(0);
  const [fetchedRemainingAmount, setFetchedRemainingAmount] = useState(0);

  useEffect(() => {
    if (discountRef.current) {
      discountRef.current.focus();
    }
  }, [discountRef.current]);

  
  useEffect(() => {
    setFetchedReceivedAmount(receivedAmount);
    setFetchedRemainingAmount((parseFloat(parseFloat(grandTotal)) - parseFloat(receivedAmount)).toFixed(2));
  }, [discount, receivedAmount, grandTotal]);

  return (
    <Dialog
      open
      onClose={onClose}
      TransitionComponent={Transition}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          height: '75vh',
          margin: 0,
          bottom: 0,
          position: 'fixed',
          borderBottomLeftRadius: 2,
          borderBottomRightRadius: 2,
        },
      }}
    >
      <DialogTitle sx={{ m: 0, p: 2 }}>
        <Grid container justifyContent="space-between" alignItems="center">
          <Grid item>
            <Typography variant="subtitle1" component="div" color="error">
              <strong>Invoice No:</strong> {invoiceNo || "N/A"}
            </Typography>
          </Grid>
          <Grid item>
            <IconButton
              aria-label="close"
              onClick={onClose}
              sx={{
                color: (theme) => theme.palette.grey[500],
              }}
            >
              <CloseCircle size="24" color="#9e9e9e" variant="Outline" /> {/* Using CloseCircle icon */}
            </IconButton>
          </Grid>
        </Grid>
      </DialogTitle>
      <DialogContent dividers sx={{ overflowY: 'auto' }}>
        <Box mb={2}>
          <Typography variant="body2" color="textSecondary">
            <strong>Discount:</strong> {(discount).toFixed(2)}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            <strong>Bill Amount:</strong> ₹{parseFloat(totalAmount).toFixed(2)}
          </Typography>
          <Typography variant="h6" color="textSecondary">
            <strong>Total Amount:</strong> ₹{(parseFloat(grandTotal)).toFixed(2)}
          </Typography>
        </Box>

        {/* Payment Details */}
        {userInfo?.isAdmin && 
         
         <div className="mt-4 grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs">Discount</label>
            <input
              type="number"
              ref={discountRef}
              value={discount || 0}
              onKeyDown={(e)=> changeRef(e, receivedAmountRef)}
              onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
              className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
              placeholder="Enter Discount"
            />
            </div>

            <div>

            <label className="block text-xs">Received Amount</label>
            <input
            ref={receivedAmountRef}
              type="number"
              placeholder="Enter Received Amount"
              value={receivedAmount || 0}
              onKeyDown={(e)=> changeRef(e, paymentMethodRef)}
              onChange={(e) =>
                setReceivedAmount(Math.min(parseFloat(e.target.value) || 0, parseFloat(grandTotal)))
              }
              className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
            />
            </div>

            <div>

            <label className="block text-xs">Payment Method</label>
            <select
            ref={paymentMethodRef}
              value={paymentMethod}
              onKeyDown={(e)=> changeRef(e, receivedDateRef)}

              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
            >
      {accounts.map((acc) => (
        <option key={acc.accountId} value={acc.accountId}>
          {acc.accountName}
        </option>
      ))}
            </select>

            </div>
            <div>

            <label className="block text-xs">Received Date</label>
            <input
  ref={receivedDateRef}
  onKeyDown={(e) => changeRef(e, unloadingRef)}
  type="datetime-local"
  value={receivedDate}
  onChange={(e) => setReceivedDate(e.target.value)}
  className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
/>


            </div>

            <div>

<label className="block text-xs">Unloading Charge</label>
<input
  type="number"
  onKeyDown={(e)=> changeRef(e, transportationRef)}
  ref={unloadingRef}
  placeholder="Enter Unloading Charge"
  value={unloading || 0}
  onChange={(e) =>
    setUnloading(parseFloat(e.target.value))
  }
  className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
/>
</div>

<div>

<label className="block text-xs">Transportation Charge</label>
<input
  type="number"
  onKeyDown={(e)=> changeRef(e, handlingRef)}
  ref={transportationRef}
  placeholder="Enter Received Amount"
  value={transportation || 0}
  onChange={(e) =>
    setTransportation(parseFloat(e.target.value))
  }
  className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
/>
</div>



<div>

<label className="block text-xs">Handling / Other Charges</label>
<input
  type="number"
  ref={handlingRef}
  placeholder="Enter Handling Charge"
  value={handling || 0}
  onChange={(e) =>
    setHandling(parseFloat(e.target.value))
  }
  onKeyDown={(e)=> changeRef(e, roundOffRef)}
  className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
/>
</div>

<div>

<label className="block text-xs">Round Off</label>
<input
  type="number"
  ref={roundOffRef}
  min={0}
  placeholder="Enter Round Off"
  value={roundOff}
  onChange={(e) =>
    setRoundOff(parseFloat(e.target.value || 0))
  }
  onKeyDown={(e)=> changeRef(e, remarkRef)}
  className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
/>
</div>

<div>

<label className="block text-xs">Bill Remark</label>
<input
  type="text"
  ref={remarkRef}
  onKeyDown={(e) => {
    if (e.key === "Enter") {
      onSubmit(); // Corrected to match the prop name
    }
  }}
  placeholder="Enter Remark"
  value={remark}
  onChange={(e) => 
    setRemark(e.target.value)
  }
  className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
/>
</div>

<Box mt={2}>
          <FormControlLabel
            control={
              <Checkbox
                checked={neededToPurchase}
                onChange={(e) => setNeededToPurchase(e.target.checked)}
              />
            }
            label="Needed to Purchase Items"
          />
        </Box>

        <Box mt={2}>
          <FormControlLabel
            control={
              <Checkbox
                checked={isApproved}
                onChange={(e) => setIsApproved(e.target.checked)}
              />
            }
            label="Is Approved"
          />
        </Box>

          </div> }

        {/* Additional Information (if any) can be added here */}
      </DialogContent>
      <DialogActions sx={{ padding: 2 }}>
        <Grid container justifyContent="flex-end" spacing={2}>
          <Grid item>
            <Button
              variant="outlined"
              color="error"
              size="small"
              onClick={() => {
                if (handleLocalSave) handleLocalSave();
                else alert('Update the bill by clicking the submit button');
              }}
            >
              Save
            </Button>
          </Grid>
          <Grid item>
          <SubmitButton
  onSubmit={onSubmit}
  isSubmitting={isSubmitting}
  userInfo={userInfo}
/>

          </Grid>
        </Grid>
      </DialogActions>
    </Dialog>
  );
}

// PropTypes for type checking
SummaryModal.propTypes = {
  customerName: PropTypes.string.isRequired,
  invoiceNo: PropTypes.string.isRequired,
  totalAmount: PropTypes.number.isRequired,
  amountWithoutGST: PropTypes.number.isRequired,
  cgst: PropTypes.number.isRequired,
  sgst: PropTypes.number.isRequired,
  discount: PropTypes.number.isRequired,
  setDiscount: PropTypes.func.isRequired,
  receivedAmount: PropTypes.number.isRequired,
  setReceivedAmount: PropTypes.func.isRequired,
  paymentMethod: PropTypes.string.isRequired,
  setPaymentMethod: PropTypes.func.isRequired,
  receivedDate: PropTypes.string.isRequired,
  setReceivedDate: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool.isRequired,
  salesmanName: PropTypes.string,
  totalProducts: PropTypes.number,
  roundOff: PropTypes.number.isRequired,
  setRoundOff: PropTypes.func.isRequired,
  roundOffRef: PropTypes.object.isRequired,
  handleLocalSave: PropTypes.func,
  unloading: PropTypes.number,
  setUnloading: PropTypes.func,
  transportation: PropTypes.number,
  setTransportation: PropTypes.func,
  handling: PropTypes.number,
  setHandling: PropTypes.func,
  remark: PropTypes.string,
  setRemark: PropTypes.func,
  grandTotal: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  accounts: PropTypes.arrayOf(
    PropTypes.shape({
      accountId: PropTypes.string.isRequired,
      accountName: PropTypes.string.isRequired,
    })
  ).isRequired,
  discountRef: PropTypes.object,
  paymentMethodRef: PropTypes.object,
  receivedDateRef: PropTypes.object,
  unloadingRef: PropTypes.object,
  transportationRef: PropTypes.object,
  handlingRef: PropTypes.object,
  remarkRef: PropTypes.object,
  changeRef: PropTypes.func.isRequired,
  receivedAmountRef: PropTypes.object,
};
