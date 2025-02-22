import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

// Import your custom DriverTracking component
import DriverTracking from "components/driver/deliveryTracking";

const DriverTrackingPage = () => {
  const navigate = useNavigate();

  // States
  const [invoiceNo, setInvoiceNo] = useState("");
  const [locationData, setLocationData] = useState([]);
  const [billingDetails, setBillingDetails] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState("billing");
  const [showModal, setShowModal] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // For location markers/polylines filtering
  const [filteredDeliveryId, setFilteredDeliveryId] = useState(null);

  // Function to handle filtering of deliveries
  const handleFilter = (deliveryId) => {
    setFilteredDeliveryId(deliveryId);
  };

  // Function to reset the filter
  const handleResetFilter = () => {
    setFilteredDeliveryId(null);
  };

  // Fetch suggestions as user types invoiceNo
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!invoiceNo) {
        setSuggestions([]);
        return;
      }
      try {
        setIsLoading(true);
        const response = await api.get(
          `/api/billing/billing/suggestions?search=${invoiceNo}`
        );
        setSuggestions(response.data);
        setError(null);
      } catch (err) {
        console.error("Error fetching suggestions:", err);
        setError("Could not fetch suggestions. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuggestions();
  }, [invoiceNo]);

  // Fetch location and billing data once user picks an invoice
  const fetchLocationData = async (invoiceNum) => {
    try {
      setIsLoading(true);
      setError(null);
      setBillingDetails(null);
      setLocationData([]);

      // Get location data
      const response = await api.get(`/api/users/locations/invoice/${invoiceNum}`);
      setLocationData(response.data || []);

      // Get billing data
      const billingResponse = await api.get(`/api/billing/getinvoice/${invoiceNum}`);
      setBillingDetails(billingResponse.data);

      // Switch to billing section on successful fetch
      setActiveSection("billing");
    } catch (err) {
      console.error(err);
      setError("No data found for this invoice or an error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  // Whenever invoiceNo changes and user has typed something
  useEffect(() => {
    if (invoiceNo && !showModal) {
      fetchLocationData(invoiceNo);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceNo]);

  // Handle user clicking a suggestion from the list
  const handleSuggestionClick = (suggestion) => {
    setInvoiceNo(suggestion.invoiceNo);
    setSuggestions([]);
    setShowModal(false);
    fetchLocationData(suggestion.invoiceNo);
  };

  // Keyboard navigation in suggestion list
  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      setSelectedSuggestionIndex((prevIndex) =>
        prevIndex < suggestions.length - 1 ? prevIndex + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      setSelectedSuggestionIndex((prevIndex) =>
        prevIndex > 0 ? prevIndex - 1 : suggestions.length - 1
      );
    } else if (e.key === "Enter" && selectedSuggestionIndex >= 0) {
      handleSuggestionClick(suggestions[selectedSuggestionIndex]);
    }
  };

  // Prepare markers and polylines for the map
  const markers = [];
  const polylines = [];

  if (locationData && locationData.length > 0) {
    locationData.forEach((location) => {
      const { startLocations, endLocations, deliveryId } = location;

      const numDeliveries = Math.max(
        startLocations ? startLocations.length : 0,
        endLocations ? endLocations.length : 0
      );

      for (let i = 0; i < numDeliveries; i++) {
        const startLocation = startLocations && startLocations[i];
        const endLocation = endLocations && endLocations[i];

        if (startLocation) {
          markers.push({
            position: {
              lat: startLocation.coordinates[1],
              lng: startLocation.coordinates[0],
            },
            label: `Start ${i + 1}`,
            deliveryId,
            type: "start",
            index: i + 1,
          });
        }

        if (endLocation) {
          markers.push({
            position: {
              lat: endLocation.coordinates[1],
              lng: endLocation.coordinates[0],
            },
            label: `End ${i + 1}`,
            deliveryId,
            type: "end",
            index: i + 1,
          });
        }

        if (startLocation && endLocation) {
          polylines.push({
            path: [
              {
                lat: startLocation.coordinates[1],
                lng: startLocation.coordinates[0],
              },
              {
                lat: endLocation.coordinates[1],
                lng: endLocation.coordinates[0],
              },
            ],
            options: {
              strokeColor: "#EF4444", // Tailwind red-500
              strokeOpacity: 0.8,
              strokeWeight: 2,
            },
            deliveryId,
          });
        }
      }
    });
  }

  // Render invoice input modal
  const renderInvoiceModal = () => {
    if (!showModal) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto p-4 relative">
          <div className="flex items-center justify-between mb-3">
            <h5 className="text-md font-semibold text-gray-700">
              Enter Invoice Number
            </h5>
            <span
              onClick={() => navigate("/")}
              className="text-sm text-gray-500 hover:text-gray-700 cursor-pointer"
            >
              Close
            </span>
          </div>

          <p className="text-xs text-gray-400 mb-2">
            (Select a suggestion to see invoice details)
          </p>

          <input
            type="text"
            value={invoiceNo}
            onChange={(e) => setInvoiceNo(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-400"
            placeholder="Type or paste invoice number..."
          />

          {isLoading && (
            <p className="text-xs text-center text-gray-500 mt-2">
              Loading suggestions...
            </p>
          )}

          {suggestions.length > 0 && (
            <ul className="bg-white border border-gray-300 rounded-md mt-3 divide-y max-h-48 overflow-y-auto text-sm">
              {suggestions.map((suggestion, index) => (
                <li
                  key={suggestion._id}
                  className={`p-2 cursor-pointer hover:bg-gray-100 flex justify-between ${
                    index === selectedSuggestionIndex ? "bg-gray-200" : ""
                  }`}
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <span className="text-gray-600 font-medium">
                    {suggestion.invoiceNo}
                  </span>
                  <i className="fa fa-arrow-right text-gray-400" />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  };

  // Render billing details
  const renderBillingSection = () => {
    if (!billingDetails) {
      return (
        <div className="p-4 mx-auto max-w-xl text-center text-sm text-gray-500">
          {isLoading
            ? "Loading billing details..."
            : "No billing details to show. Please enter a valid invoice."}
        </div>
      );
    }

    const {
      invoiceNo,
      customerName,
      deliveryStatus,
      paymentStatus,
      expectedDeliveryDate,
      products,
      deliveries,
      billingAmount,
      discount,
      customerAddress,
    } = billingDetails;

    return (
      <div className="bg-white rounded-lg shadow-md p-4 max-w-xl mx-auto space-y-3">
        <div className="flex items-start justify-between">
          <h5 className="text-md font-bold text-gray-700">{invoiceNo}</h5>
          {/* Indicator Dot */}
          <div className="flex-shrink-0">
            {deliveryStatus === "Delivered" && paymentStatus === "Paid" && (
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
            )}
            {deliveryStatus === "Delivered" && paymentStatus !== "Paid" && (
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
              </span>
            )}
            {deliveryStatus !== "Delivered" && paymentStatus === "Paid" && (
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
              </span>
            )}
            {deliveryStatus !== "Delivered" && paymentStatus !== "Paid" && (
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-600">
          <p className="font-semibold">Customer:</p>
          <p>{customerName}</p>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-600">
          <p className="font-semibold">Exp. Delivery Date:</p>
          <p>{new Date(expectedDeliveryDate).toLocaleDateString()}</p>
        </div>

        <div className="flex items-center justify-between text-sm">
          <p
            className={`font-semibold ${
              deliveryStatus !== "Delivered" ? "text-red-500" : "text-green-600"
            }`}
          >
            Delivery Sts:
          </p>
          <p
            className={`${
              deliveryStatus !== "Delivered" ? "text-red-500" : "text-green-600"
            }`}
          >
            {deliveryStatus}
          </p>
        </div>

        <div className="flex items-center justify-between text-sm">
          <p
            className={`font-semibold ${
              paymentStatus !== "Paid" ? "text-red-500" : "text-green-600"
            }`}
          >
            Payment Sts:
          </p>
          <p
            className={`${
              paymentStatus !== "Paid" ? "text-red-500" : "text-green-600"
            }`}
          >
            {paymentStatus}
          </p>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-600">
          <p className="font-semibold">Products Qty:</p>
          <p>{products.length}</p>
        </div>

        <div className="text-sm text-gray-600">
          <p className="font-semibold">Customer Address:</p>
          <p>{customerAddress}, Kerala, India</p>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-700">
          <p className="font-semibold">Delivery Assigned:</p>
          <p>{deliveries?.length || 0}</p>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-700">
          <p className="font-semibold">Bill Amount:</p>
          <p>
            {(billingAmount - (discount || 0)).toFixed(2)}
          </p>
        </div>

        {/* Check if any products exist */}
        {products && products.length > 0 ? (
          <div className="mt-3">
            <div className="overflow-x-auto border rounded">
              <table className="min-w-full text-sm text-gray-600">
                <thead className="bg-gray-50 border-b text-xs text-gray-700 uppercase">
                  <tr>
                    <th className="px-3 py-2 text-left">Product</th>
                    <th className="px-3 py-2 text-center">ID</th>
                    <th className="px-3 py-2 text-center">Qty</th>
                    <th className="px-3 py-2 text-center">Delivered</th>
                    <th className="px-3 py-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product, i) => (
                    <tr
                      key={i}
                      className="border-b hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-3 py-2 text-left font-medium text-gray-700">
                        {product.name.length > 14
                          ? product.name.slice(0, 14) + "..."
                          : product.name}
                      </td>
                      <td className="px-3 py-2 text-center">{product.item_id}</td>
                      <td className="px-3 py-2 text-center">{product.quantity}</td>
                      <td className="px-3 py-2 text-center">
                        {product.deliveredQuantity}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input
                          type="checkbox"
                          disabled
                          className="cursor-default text-green-500 focus:ring-0 focus:outline-0"
                          checked={product.deliveryStatus === "Delivered"}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <p className="mt-2 text-sm text-gray-500">
            No products listed in this invoice.
          </p>
        )}
      </div>
    );
  };

  // Render location tracking section
  const renderLocationSection = () => {
    if (isLoading) {
      return (
        <p className="text-center text-sm text-gray-500 mt-4">
          Loading location data...
        </p>
      );
    }

    // If there's no billing details or deliveries at all
    if (!billingDetails) {
      return (
        <p className="text-center text-gray-500 text-sm mt-4">
          No details available. Please enter a valid invoice.
        </p>
      );
    }

    // If the invoice has no deliveries assigned
    if (!billingDetails?.deliveries || billingDetails?.deliveries.length === 0) {
      return (
        <div className="max-w-lg mx-auto text-center p-4 bg-white shadow-md rounded mt-4">
          <p className="text-sm text-gray-600">
            No deliveries assigned for this invoice.
          </p>
        </div>
      );
    }

    // If there's no location data returned from the server
    if (!locationData || locationData.length === 0) {
      return (
        <div className="max-w-lg mx-auto text-center p-4 bg-white shadow-md rounded mt-4">
          <p className="text-sm text-gray-600">
            No location data available for this invoice.
          </p>
        </div>
      );
    }

    // If there is location data, render the DriverTracking component
    return (
      <div className="max-w-lg mx-auto mt-4">
        <DriverTracking
          locationData={locationData}
          billingDetails={billingDetails}
          markers={markers}
          polylines={polylines}
          handleFilter={handleFilter}
          handleResetFilter={handleResetFilter}
          filteredDeliveryId={filteredDeliveryId}
          mapContainerStyle={{ width: "100%", height: "500px" }}
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen">
      {/* Invoice Input Modal */}
      {renderInvoiceModal()}

      {/* Container */}
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        {/* Page Title */}
        <h1 className="text-md sm:text-2xl font-bold text-gray-700 text-center mb-6">
          Driver Tracking
        </h1>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-2 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Only show navigation tabs if we have some billing details or data */}
        {(billingDetails || locationData.length > 0) && (
          <div className="flex justify-center gap-4 mb-6">
            <button
              className={`text-sm font-semibold px-4 py-2 rounded transition-colors ${
                activeSection === "billing"
                  ? "bg-red-500 text-white"
                  : "bg-white text-gray-700 border border-gray-200 hover:bg-red-50"
              }`}
              onClick={() => setActiveSection("billing")}
            >
              Billing
            </button>
            <button
              className={`text-sm font-semibold px-4 py-2 rounded transition-colors ${
                activeSection === "location"
                  ? "bg-red-500 text-white"
                  : "bg-white text-gray-700 border border-gray-200 hover:bg-red-50"
              }`}
              onClick={() => setActiveSection("location")}
            >
              Location
            </button>
          </div>
        )}

        {/* Sections */}
        {activeSection === "billing" && renderBillingSection()}
        {activeSection === "location" && renderLocationSection()}

        {/* Loading indicator if user has closed the modal but triggered a fetch */}
        {isLoading && !showModal && (
          <p className="text-center text-gray-500 text-sm mt-4">
            Fetching details...
          </p>
        )}
      </div>
    </div>
  );
};

export default DriverTrackingPage;
