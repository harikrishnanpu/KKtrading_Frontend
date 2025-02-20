import React, { useEffect, useRef } from "react";
import { Dialog, Slide } from "@mui/material";

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

/**
 * DeliverySuccess
 *
 * A success pop-up to confirm that the final delivery
 * was successfully updated.
 */
const DeliverySuccess = ({ deliveryNo, invoiceNo, setDeliveryModal }) => {
  const audioRef = useRef(null);

  const handleContinue = () => {
    if (audioRef.current) {
      audioRef.current.play().catch((error) => {
        console.error("Error playing audio:", error);
      });
    }
  };

  useEffect(() => {
    // Play success audio automatically after 1 second
    const timer = setTimeout(() => {
      handleContinue();
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Dialog
      open={true}
      TransitionComponent={Transition}
      onClose={() => setDeliveryModal(false)}
      fullWidth
      PaperProps={{
        sx: {
          bottom: 0,
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
      <div className="bg-white rounded-t-lg shadow-xl w-full py-8 flex flex-col items-center relative">
        {/* Close Button */}
        <button
          className="absolute top-4 right-4 text-gray-500"
          onClick={() => setDeliveryModal(false)}
        >
          <i className="fa fa-times text-xl" />
        </button>

        {/* Checkmark */}
        <div className="checkmark-container mb-6">
          <i className="fa fa-check checkmark text-green-600 text-4xl" />
        </div>

        <h1 className="text-sm font-bold mb-2 text-gray-700">
          Invoice No: {invoiceNo || "N/A"}
        </h1>

        {/* Success Message */}
        <h2 className="text-sm font-bold text-red-700 mb-4">
          Delivery Updated Successfully
        </h2>
        <p className="text-gray-600 italic text-gray-500 mb-4 text-xs text-center">
          Your delivery with Invoice No. {invoiceNo || "N/A"} is successfully
          updated.
        </p>
        <p className="text-gray-600 italic text-gray-500 mb-6 text-xs text-center">
          Delivery Id: {deliveryNo || "N/A"}
        </p>

        {/* Continue Button */}
        <button
          onClick={() => setDeliveryModal(false)}
          className="mt-4 px-6 text-xs font-bold py-2 bg-red-600 text-white rounded hover:bg-red-700 transition duration-300"
        >
          Continue
        </button>

        {/* Audio Element */}
        <audio ref={audioRef} src={`/sounds/success.mp3`} preload="auto" />
      </div>
    </Dialog>
  );
};

export default DeliverySuccess;
