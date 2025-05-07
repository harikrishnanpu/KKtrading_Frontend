// src/components/ErrorModal.jsx
import React from "react";
import { Dialog, Slide, Button } from "@mui/material";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

// Bottom‑sheet slide‑up transition
const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

/**
 * ErrorModal
 * Props:
 *  • open     – boolean  : show / hide
 *  • message  – string   : backend error message
 *  • onClose  – function : called when user taps Close
 */
const ErrorModal = ({ open, message = "Something went wrong", onClose }) => {
  return (
    <Dialog
         open={open}
         TransitionComponent={Transition}
         onClose={() => {}}
         fullWidth
         maxWidth="xs"
         PaperProps={{
           sx: {
             bottom: -40,
             left: 0,
             right: 0,
             borderRadius: "16px 16px 0 0", // Rounded top corners
             // maxHeight: "30vh", // Keep it compact
             width: "90%", // Responsive width
             textAlign: "center", // Center text inside Paper
             display: "flex",
             alignItems: "center",
             justifyContent: "center",
             padding: 2,
           },
         }}
         sx={{
           "& .MuiDialog-container": {
             display: "flex",
             justifyContent: "center", // Center horizontally
             alignItems: "flex-end",   // Stick to bottom
           },
         }}
       >
      <div className="flex flex-col items-center space-y-3">
        <ErrorOutlineIcon sx={{ fontSize: 40, color: "error.main" }} />
        <p className="text-sm font-semibold">{message}</p>
        <Button
          variant="outlined"
          color="error"
          size="small"
          onClick={onClose}
        >
          Close
        </Button>
      </div>
    </Dialog>
  );
};

export default ErrorModal;
