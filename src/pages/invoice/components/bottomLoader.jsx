import React from "react";
import { Dialog, Slide, CircularProgress } from "@mui/material";

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const BottomLoader = ({ open, text = "Loading..." }) => {
  return (
    <Dialog
      open={open}
      TransitionComponent={Transition}
      disableScrollLock={true} // CRITICAL: Prevents scroll lock issues
      disableRestoreFocus={true} // Prevents focus restoration issues
      disableEnforceFocus={true} // No focus trap for loading modals
      hideBackdrop={false} // Show backdrop
      disableEscapeKeyDown={true} // Prevent ESC closing
      keepMounted={false} // Remove from DOM when closed
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
      <div className="flex flex-col items-center">
        <CircularProgress />
        <p className="text-xs font-bold mt-2">{text}</p>
      </div>
    </Dialog>
  );
};

export default BottomLoader;