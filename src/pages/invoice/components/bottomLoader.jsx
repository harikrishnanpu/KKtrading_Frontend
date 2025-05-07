import React from "react";
import { Dialog, Slide, CircularProgress } from "@mui/material";

// Slide-up transition for the dialog
const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const LoadingModal = ({ open }) => {
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
      <div className="flex flex-col items-center">
        <CircularProgress />
        <p className="text-xs font-bold mt-2">Loading...</p>
      </div>
    </Dialog>
  );
};

export default LoadingModal;
