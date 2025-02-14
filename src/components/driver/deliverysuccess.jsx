// DeliverySuccess.js

import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, Slide } from "@mui/material";

// A helper for the slide-up transition
const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const DeliverySuccess = ({ deliveryNo, invoiceNo, setDeliveryModal }) => {
  const navigate = useNavigate();
  const audioRef = useRef(null);

  // Play audio if possible
  const handleContinue = () => {
    if (audioRef.current) {
      audioRef.current.play().catch((error) => {
        console.error("Error playing audio:", error);
      });
    }
  };

  useEffect(() => {
    // Automatically trigger audio after 1 second
    const timer = setTimeout(() => {
      handleContinue();
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Dialog
      open={true}
      TransitionComponent={Transition}
      // Close when backdrop is clicked, if you'd like
      onClose={() => setDeliveryModal(false)}
      // Make it full width; you can remove or change as you wish
      fullWidth
      // Disable default Paper margin so we can position at bottom
      PaperProps={{
        sx: {
          bottom: -40,
          left: 0,
          right: 0,
          borderRadius: "16px 16px 0 0", // Rounded top corners
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
      {/* We replicate your existing styling within the Dialog content. */}
      <div className="bg-white rounded-t-lg shadow-xl w-full py-40 flex flex-col items-center relative">
        {/* Close button at top-right (optional) */}
        <button
          className="absolute top-4 right-4 text-gray-500"
          onClick={() => setDeliveryModal(false)}
        >
          <i className="fa fa-times text-xl" />
        </button>

        {/* Animated Checkmark */}
        <div className="checkmark-container mb-6">
          <i className="fa fa-check checkmark"></i>
        </div>

        <h1 className="text-sm font-bold mb-2">
          Invoice No: {invoiceNo || "error"}
        </h1>

        {/* Success Message */}
        <h2 className="text-sm font-bold text-red-800 mb-4">
          Successfully Updated Delivery
        </h2>
        <p className="text-gray-600 italic text-gray-300 animate-pulse mb-6 text-xs text-center">
          Your Delivery With Invoice No. {invoiceNo || "error"} is Successfully
          Updated
        </p>
        <p className="text-gray-600 italic text-gray-300 animate-pulse mb-6 text-xs text-center">
          Delivery Id: {deliveryNo || "error"}
        </p>

        {/* Continue Button */}
        <button
          onClick={() => setDeliveryModal(false)}
          className="mt-4 px-6 text-xs font-bold py-2 bg-red-600 text-white rounded hover:bg-red-700 transition duration-300"
        >
          Continue
        </button>

        {/* Audio element */}
        <audio ref={audioRef} src={`/sounds/success.mp3`} preload="auto" />
      </div>
    </Dialog>
  );
};

export default DeliverySuccess;
