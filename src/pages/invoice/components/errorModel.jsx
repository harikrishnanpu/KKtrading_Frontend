import React from "react";
import { Dialog, Slide } from "@mui/material";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

// Slide-up transition for bottom sheet style
const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const ErrorModal = ({ open, message = "Something went wrong", onClose }) => {
  return (
    <Dialog
      open={open}
      TransitionComponent={Transition}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      PaperProps={{
        sx: {
          bottom: -40,
          left: 0,
          right: 0,
          borderRadius: "16px 16px 0 0",
          width: "90%",
          textAlign: "center",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 2,
        },
      }}
      sx={{
        "& .MuiDialog-container": {
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-end",
        },
      }}
    >
      <div className="flex flex-col items-center space-y-2">
        <ErrorOutlineIcon sx={{ fontSize: 40, color: "error.main" }} />
        <p className="text-xs font-bold text-red-700">{message}</p>
        <button
          className="mt-2 bg-red-500 text-white px-4 py-1 text-xs rounded hover:bg-red-600"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </Dialog>
  );
};

export default ErrorModal;
