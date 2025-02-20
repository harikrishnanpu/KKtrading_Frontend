import React, { useState, useEffect, useCallback } from "react";
import api from "pages/api";
import PropTypes from "prop-types";
import debounce from "lodash.debounce";

/**
 * DeliveredProducts
 *
 * A mobile-friendly card component for specifying
 * partial or complete delivery for a single product item.
 */
const DeliveredProducts = ({ dp, handleDeliveredQuantityChange, billIndex }) => {
  const [deliveredBoxesInput, setDeliveredBoxesInput] = useState("");
  const [deliveredPiecesInput, setDeliveredPiecesInput] = useState("");
  const [deliveredBoxes, setDeliveredBoxes] = useState(0);
  const [deliveredPieces, setDeliveredPieces] = useState(0);
  const [psRatio, setPsRatio] = useState(1); // Default to 1 to handle psRatio <= 1
  const [maxBoxes, setMaxBoxes] = useState(0);
  const [maxPieces, setMaxPieces] = useState(dp.pendingQuantity);
  const [error, setError] = useState("");
  const [isChecked, setIsChecked] = useState(false);

  // Fetch PS Ratio from backend
  useEffect(() => {
    const fetchPsRatio = async () => {
      try {
        const response = await api.get(`/api/users/driver/getPSratio/${dp.item_id}`);
        const fetchedPsRatio = parseFloat(response.data.psRatio);
        setPsRatio(isNaN(fetchedPsRatio) || fetchedPsRatio < 1 ? 1 : fetchedPsRatio);
      } catch (err) {
        console.error("Error fetching PS ratio:", err);
        setPsRatio(1);
      }
    };

    fetchPsRatio();
  }, [dp.item_id]);

  // Calculate max boxes and pieces
  useEffect(() => {
    const total = parseInt(dp.pendingQuantity, 10) || 0;
    if (psRatio > 1) {
      const boxes = Math.floor(total / psRatio);
      const pieces = total % psRatio;
      setMaxBoxes(boxes);
      setMaxPieces(pieces);
    } else {
      setMaxBoxes(0);
      setMaxPieces(total);
    }
  }, [psRatio, dp.pendingQuantity]);

  // Initialize delivered (boxes/pieces) from dp.deliveredQuantity
  useEffect(() => {
    const totalDelivered = parseInt(dp.deliveredQuantity, 10) || 0;
    if (psRatio > 1) {
      const boxes = Math.floor(totalDelivered / psRatio);
      const pieces = totalDelivered % psRatio;
      setDeliveredBoxesInput(boxes.toString());
      setDeliveredPiecesInput(pieces.toString());
      setDeliveredBoxes(boxes);
      setDeliveredPieces(pieces);
    } else {
      setDeliveredBoxesInput("0");
      setDeliveredPiecesInput(totalDelivered.toString());
      setDeliveredBoxes(0);
      setDeliveredPieces(totalDelivered);
    }
  }, [psRatio, dp.deliveredQuantity]);

  // Debounced update to parent
  const debouncedHandleDeliveredQuantityChange = useCallback(
    debounce((newTotal) => {
      handleDeliveredQuantityChange(billIndex, dp.item_id, newTotal);
    }, 300),
    [billIndex, dp.item_id, handleDeliveredQuantityChange]
  );

  useEffect(() => {
    return () => {
      debouncedHandleDeliveredQuantityChange.cancel();
    };
  }, [debouncedHandleDeliveredQuantityChange]);

  // If no pending quantity left, don't render
  if (dp.pendingQuantity === 0) {
    return null;
  }

  // Handle checking "Deliver All"
  const handleCheckboxChange = () => {
    const newChecked = !isChecked;
    setIsChecked(newChecked);

    if (newChecked) {
      // Deliver all pending
      setDeliveredBoxes(maxBoxes);
      setDeliveredBoxesInput(maxBoxes.toString());
      setDeliveredPieces(maxPieces);
      setDeliveredPiecesInput(maxPieces.toString());
      setError("");

      const totalDelivered = maxBoxes * psRatio + maxPieces;
      handleDeliveredQuantityChange(billIndex, dp.item_id, totalDelivered);
    } else {
      // Reset
      setDeliveredBoxes(0);
      setDeliveredPieces(0);
      setDeliveredBoxesInput("0");
      setDeliveredPiecesInput("0");
      setError("");
      handleDeliveredQuantityChange(billIndex, dp.item_id, 0);
    }
  };

  // Handle Boxes input
  const handleBoxChange = (value) => {
    setDeliveredBoxesInput(value);
    const boxes = parseInt(value, 10);
    if (isNaN(boxes) || boxes < 0) {
      setError("Please enter a valid number of boxes.");
      return;
    }

    if (boxes > maxBoxes) {
      setError(`Maximum available boxes: ${maxBoxes}`);
      setDeliveredBoxes(maxBoxes);
      setDeliveredBoxesInput(maxBoxes.toString());
      const totalDelivered = maxBoxes * psRatio + deliveredPieces;
      debouncedHandleDeliveredQuantityChange(totalDelivered);
    } else {
      setError("");
      setDeliveredBoxes(boxes);
      const totalDelivered = boxes * psRatio + deliveredPieces;
      debouncedHandleDeliveredQuantityChange(totalDelivered);
    }
  };

  // Handle Pieces input
  const handlePieceChange = (value) => {
    setDeliveredPiecesInput(value);
    const pieces = parseInt(value, 10);
    if (isNaN(pieces) || pieces < 0) {
      setError("Please enter a valid number of pieces.");
      return;
    }

    if (psRatio > 1 && pieces > psRatio - 1) {
      setError(`Maximum available pieces: ${psRatio - 1}`);
      setDeliveredPieces(psRatio - 1);
      setDeliveredPiecesInput((psRatio - 1).toString());
      const totalDelivered = deliveredBoxes * psRatio + (psRatio - 1);
      debouncedHandleDeliveredQuantityChange(totalDelivered);
      return;
    }

    // Ensure not exceeding pending quantity
    const potentialTotal = deliveredBoxes * psRatio + pieces;
    if (potentialTotal > dp.pendingQuantity) {
      setError(`Total delivered exceeds pending quantity (${dp.pendingQuantity}).`);
      const adjustedPieces = Math.max(0, dp.pendingQuantity - deliveredBoxes * psRatio);
      setDeliveredPieces(adjustedPieces);
      setDeliveredPiecesInput(adjustedPieces.toString());
      const totalDelivered = deliveredBoxes * psRatio + adjustedPieces;
      debouncedHandleDeliveredQuantityChange(totalDelivered);
      return;
    }

    setError("");
    setDeliveredPieces(pieces);
    debouncedHandleDeliveredQuantityChange(potentialTotal);
  };

  return (
    <div className="bg-white p-4 border rounded-lg shadow-sm">
      {/* Header row */}
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-bold text-gray-700">{dp.name}</span>
        <input
          type="checkbox"
          checked={isChecked}
          onChange={handleCheckboxChange}
          className="form-checkbox h-4 w-4 text-red-600"
          title="Deliver all pending"
        />
      </div>

      {/* Details row */}
      <div className="flex flex-col text-xs text-gray-600 mb-2 space-y-1">
        <div>
          <span className="font-bold">ID:</span> {dp.item_id}
        </div>
        <div>
          <span className="font-bold">Ordered:</span> {dp.quantity}
        </div>
        <div>
          <span className="font-bold">Pending:</span> {dp.pendingQuantity}
        </div>
      </div>

      {/* If not fully checked => show inputs */}
      {!isChecked && psRatio > 1 && (
        <div className="flex flex-col gap-2 mb-2">
          {/* Boxes */}
          <div className="flex items-center gap-2">
            <label className="font-bold text-xs text-gray-600">Delivered (Boxes):</label>
            <input
              type="number"
              className={`px-2 py-1 text-xs border rounded-md w-20 ${
                error.includes("boxes") ? "border-red-500" : "border-gray-300"
              }`}
              value={deliveredBoxesInput}
              onChange={(e) => handleBoxChange(e.target.value)}
              min="0"
              max={maxBoxes}
              placeholder="0"
            />
          </div>
          {/* Pieces */}
          <div className="flex items-center gap-2">
            <label className="font-bold text-xs text-gray-600">Delivered (Pieces):</label>
            <input
              type="number"
              className={`px-2 py-1 text-xs border rounded-md w-20 ${
                error.includes("pieces") ? "border-red-500" : "border-gray-300"
              }`}
              value={deliveredPiecesInput}
              onChange={(e) => handlePieceChange(e.target.value)}
              min="0"
              max={psRatio - 1}
              placeholder="0"
            />
          </div>
        </div>
      )}

      {!isChecked && psRatio === 1 && (
        <div className="flex items-center gap-2 mb-2">
          <label className="font-bold text-xs text-gray-600">Delivered (Pieces):</label>
          <input
            type="number"
            className={`px-2 py-1 text-xs border rounded-md w-20 ${
              error.includes("pieces") ? "border-red-500" : "border-gray-300"
            }`}
            value={deliveredPiecesInput}
            onChange={(e) => handlePieceChange(e.target.value)}
            min="0"
            max={maxPieces}
            placeholder="0"
          />
        </div>
      )}

      {/* Current delivered qty */}
      <div className="flex justify-between items-center text-xs text-gray-600 mb-1">
        <span className="font-bold">Delivered Qty:</span>
        <span>
          {dp.deliveredQuantity || 0}{" "}
          {psRatio > 1
            ? `pcs (${deliveredBoxes} box + ${deliveredPieces} pcs)`
            : "pcs"}
        </span>
      </div>

      {/* Delivery status */}
      <div className="flex justify-between items-center text-xs text-gray-600">
        <span className="font-bold">Delivery Status:</span>
        <i
          className={`fa ${
            dp.isDelivered ? "fa-check text-green-500" : "fa-times text-red-500"
          }`}
        ></i>
      </div>

      {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
    </div>
  );
};

DeliveredProducts.propTypes = {
  dp: PropTypes.shape({
    name: PropTypes.string.isRequired,
    item_id: PropTypes.string.isRequired,
    quantity: PropTypes.number.isRequired,
    pendingQuantity: PropTypes.number.isRequired,
    deliveredQuantity: PropTypes.number,
    isDelivered: PropTypes.bool,
    isPartiallyDelivered: PropTypes.bool,
  }).isRequired,
  handleDeliveredQuantityChange: PropTypes.func.isRequired,
  billIndex: PropTypes.number.isRequired,
};

export default DeliveredProducts;
