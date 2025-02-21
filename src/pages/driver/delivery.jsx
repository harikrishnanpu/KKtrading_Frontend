import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import DeliverySuccess from "components/driver/deliverysuccess";
import DeliveredProducts from "components/driver/deliveredProducts";
import useAuth from "hooks/useAuth";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  useMediaQuery,
  useTheme,
  IconButton,
} from "@mui/material";
import LoadingModal from "components/LoadingModal";
import { FaSync } from "react-icons/fa";

const DriverBillingPage = () => {
  const [invoiceNo, setInvoiceNo] = useState("");
  const [assignedBills, setAssignedBills] = useState([]);
  const [driverName, setDriverName] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [deliveryStarted, setDeliveryStarted] = useState(false);
  const [myDeliveries, setMyDeliveries] = useState([]);
  const [searchInvoiceNo, setSearchInvoiceNo] = useState("");
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [deliveredModal, setShowDeliveredModal] = useState(false);
  const [currentDelivered, setCurrentDelivered] = useState({
    invoiceNo: "",
    deliveryId: "",
  });
  const [accounts, setAccounts] = useState([]);

  // NEW: Date range filters for My Deliveries
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const navigate = useNavigate();
  const { user: userInfo } = useAuth();
  const theme = useTheme();
  // Make modals full screen for extra-small screens (mobile-friendly)
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  // --------------------------------------------------
  // 1. Load from LocalStorage on Component Mount
  // --------------------------------------------------
  useEffect(() => {
    const storedAssignedBills = localStorage.getItem("assignedBills");
    const storedDeliveryStarted = localStorage.getItem("deliveryStarted");
    const storedDriverName = localStorage.getItem("driverName");

    if (storedAssignedBills) {
      setAssignedBills(JSON.parse(storedAssignedBills));
    }
    if (storedDeliveryStarted === "true") {
      setDeliveryStarted(true);
    }
    // If driver name was stored, use it; otherwise use userInfo name
    if (storedDriverName) {
      setDriverName(storedDriverName);
    } else {
      setDriverName(userInfo?.name || "");
    }
  }, [userInfo?.name]);

  // --------------------------------------------------
  // 2. Fetch Payment Accounts
  // --------------------------------------------------
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const response = await api.get("/api/accounts/allaccounts");
        setAccounts(response.data);
      } catch (err) {
        setError("Failed to fetch payment accounts.");
        console.error(err);
      }
    };
    fetchAccounts();
  }, []);

  // --------------------------------------------------
  // 3. Persist to LocalStorage whenever
  //    assignedBills, deliveryStarted, driverName changes
  // --------------------------------------------------
  useEffect(() => {
    if (assignedBills.length > 0) {
      localStorage.setItem("assignedBills", JSON.stringify(assignedBills));
      localStorage.setItem("deliveryStarted", deliveryStarted.toString());
      localStorage.setItem("driverName", driverName);
    } else {
      localStorage.removeItem("assignedBills");
      localStorage.removeItem("deliveryStarted");
    }
  }, [assignedBills, deliveryStarted, driverName]);
  

  // --------------------------------------------------
  // 4. Fetch invoice suggestions based on invoiceNo input
  // --------------------------------------------------
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (invoiceNo) {
        try {
          const response = await api.get(
            `/api/billing/billing/driver/suggestions?search=${invoiceNo}`
          );
          setSuggestions(response.data);
          console.log(response.data);
        } catch (error) {
          console.error("Error fetching suggestions:", error);
        }
      } else {
        setSuggestions([]);
      }
    };

    fetchSuggestions();
  }, [invoiceNo]);

  // --------------------------------------------------
  // 5. Fetch My Deliveries
  //    Includes searchInvoiceNo, fromDate, toDate, userId
  // --------------------------------------------------
  const fetchMyDeliveries = async () => {
    if (!driverName || !userInfo?._id) return;
    try {

      const params = new URLSearchParams();
      params.append("driverName", driverName);
      if (searchInvoiceNo) {
        params.append("invoiceNo", searchInvoiceNo);
      }
      if (fromDate) {
        params.append("fromDate", fromDate);
      }
      if (toDate) {
        params.append("toDate", toDate);
      }
      // userId param is used on the server side to ensure correct driver
      params.append("userId", userInfo._id);

      const url = `/api/billing/deliveries/all?${params.toString()}`;
      const response = await api.get(url);
      setMyDeliveries(response.data);
    } catch (error) {
      console.error("Error fetching deliveries:", error);
      setError("Failed to fetch deliveries. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger fetch on mount and whenever search or date changes
  useEffect(() => {
    fetchMyDeliveries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [driverName, searchInvoiceNo, fromDate, toDate, userInfo?._id]);

  // --------------------------------------------------
  // 6. Handle Bill Assignment
  // --------------------------------------------------
  const handleAssignBill = async (id) => {
    if (!invoiceNo) {
      setError("Please enter an invoice number.");
      return;
    }
    try {
      setIsLoading(true);
      const response = await api.get(`/api/billing/${id}`);
      const billingData = response.data;

      // Check if the bill is already assigned
      const isAlreadyAssigned = assignedBills.some(
        (bill) => bill.invoiceNo === billingData.invoiceNo
      );

      if (!isAlreadyAssigned) {
        // Initialize deliveredProducts with default values based on ordered quantity
        const deliveredProducts = billingData.products.map((product) => {
          const previousDeliveredQuantity = product.deliveredQuantity || 0;
          const pendingQuantity = product.quantity - previousDeliveredQuantity;
          return {
            item_id: product.item_id,
            deliveredQuantity: pendingQuantity,
            isDelivered: false,
            isPartiallyDelivered: false,
            pendingQuantity,
            name: product.name,
            quantity: product.quantity,
          };
        });

        // Assign first account by default, if available
        const firstAccountId = accounts.length ? accounts[0].accountId : "";

        setAssignedBills((prevBills) => [
          ...prevBills,
          {
            ...billingData,
            newPaymentStatus: billingData.paymentStatus,
            remainingAmount:
              billingData.grandTotal -
              (billingData.payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0),
            receivedAmount:
              billingData.payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0,
            deliveredProducts,
            paymentAmount: null,
            paymentMethod: firstAccountId,
            kmTravelled: "",
            startingKm: "",
            endKm: "",
            fuelCharge: "",
            bata: "",
            vehicleNumber: "",
            otherExpenses: [{ amount: 0, remark: "", isNew: true }],
            totalOtherExpenses: 0,
            showDetails: true,
            activeSection: "Billing Details",
            deliveryId: "",
            showModal: false,
            modalStep: 1,
            method: "",
          },
        ]);
        setError("");
      } else {
        setError("This invoice is already assigned.");
      }

      setInvoiceNo("");
    } catch (error) {
      setError("Error fetching billing details. Please check the invoice number.");
    } finally {
      setIsLoading(false);
    }
  };

  // --------------------------------------------------
  // 7. Get Current Geolocation
  // --------------------------------------------------
  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        return reject(new Error("Geolocation not supported in this browser."));
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error fetching location:", error);
          reject(error);
        }
      );
    });
  };

  // --------------------------------------------------
  // 8. Handle Start Delivery
  //    - Mark 'deliveryStarted' as true
  //    - For each assigned bill, create a new "delivery" on the backend
  // --------------------------------------------------
  const handleStartDelivery = async () => {
    if (assignedBills.length === 0) {
      setError("No bills assigned to start delivery.");
      return;
    }
    setError("");
    setDeliveryStarted(true);

    try {
      setIsLoading(true);
      const startLocation = await getCurrentLocation();

      for (let i = 0; i < assignedBills.length; i++) {
        const bill = assignedBills[i];
        try {
          const deliveryId = `${userInfo._id}-${bill.invoiceNo}-${Date.now()}`;
          await api.post("/api/users/billing/start-delivery", {
            userId: userInfo._id,
            driverName,
            invoiceNo: bill.invoiceNo,
            startLocation: [startLocation.longitude, startLocation.latitude],
            deliveryId,
          });

          // Update state with the newly created deliveryId
          setAssignedBills((prevBills) => {
            const updatedBills = [...prevBills];
            updatedBills[i].deliveryId = deliveryId;
            return updatedBills;
          });
        } catch (error) {
          console.error(`Error starting delivery for invoice ${bill.invoiceNo}:`, error);
          alert(`Error starting delivery for invoice ${bill.invoiceNo}.`);
        }
      }
    } catch (error) {
      console.error("Failed to get start location", error);
      setError("Failed to get current location.");
    } finally {
      setIsLoading(false);
    }
  };

  // --------------------------------------------------
  // 9. Handle Suggestion Click
  // --------------------------------------------------
  const handleSuggestionClick = (suggestion) => {
    setSuggestions([]);
    handleAssignBill(suggestion._id);
  };

  // Keyboard nav for suggestions
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

  // --------------------------------------------------
  // 10. Delivered Quantity Change Handler
  // --------------------------------------------------
  const handleDeliveredQuantityChange = (billIndex, productId, totalDelivered) => {
    const parsedQuantity = parseInt(totalDelivered, 10) || 0;
    setAssignedBills((prevBills) => {
      const updatedBills = [...prevBills];
      const bill = updatedBills[billIndex];
      const productIndex = bill.deliveredProducts.findIndex((p) => p.item_id === productId);
      if (productIndex >= 0) {
        const deliveredProduct = bill.deliveredProducts[productIndex];
        const newDeliveredQuantity = Math.min(parsedQuantity, deliveredProduct.quantity);
        deliveredProduct.deliveredQuantity = newDeliveredQuantity;

        if (newDeliveredQuantity === deliveredProduct.quantity) {
          deliveredProduct.isDelivered = true;
          deliveredProduct.isPartiallyDelivered = false;
        } else if (newDeliveredQuantity > 0) {
          deliveredProduct.isDelivered = false;
          deliveredProduct.isPartiallyDelivered = true;
        } else {
          deliveredProduct.isDelivered = false;
          deliveredProduct.isPartiallyDelivered = false;
        }
      }
      return updatedBills;
    });
  };

  // --------------------------------------------------
  // 11. Handle Payment Submit
  // --------------------------------------------------
  const handlePaymentSubmit = async (billIndex) => {
    const bill = assignedBills[billIndex];
    if (!bill.paymentAmount || bill.paymentAmount <= 0 || !bill.paymentMethod) {
      setError("Please enter a valid payment amount and method.");
      return;
    }

    try {
      setIsLoading(true);
      await api.post("/api/users/billing/update-payment", {
        invoiceNo: bill.invoiceNo,
        paymentAmount: bill.paymentAmount,
        paymentMethod: bill.paymentMethod,
        userId: userInfo._id,
      });

      const response = await api.get(`/api/billing/${bill._id}`);
      const updatedBillData = response.data;

      const firstAccountId = accounts.length ? accounts[0].accountId : "";

      setAssignedBills((prevBills) => {
        const updatedBills = [...prevBills];
        const updatedIndex = updatedBills.findIndex((b) => b.invoiceNo === bill.invoiceNo);
        if (updatedIndex !== -1) {
          updatedBills[updatedIndex] = {
            ...updatedBills[updatedIndex],
            ...updatedBillData,
            newPaymentStatus: updatedBillData.paymentStatus,
            remainingAmount:
              updatedBillData.grandTotal -
              (updatedBillData.payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0),
            receivedAmount:
              updatedBillData.payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0,
            paymentAmount: 0,
            paymentMethod: firstAccountId,
          };
        }
        return updatedBills;
      });

      setError("");
      setShowSuccessModal(true);
    } catch (error) {
      setError("Error updating payment status.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // --------------------------------------------------
  // 12. Delivery Submit Flow
  // --------------------------------------------------
  const handleDelivered = (billIndex) => {
    setAssignedBills((prevBills) => {
      const updatedBills = [...prevBills];
      updatedBills[billIndex].showModal = true;
      updatedBills[billIndex].modalStep = 1;
      return updatedBills;
    });
  };

  const handleNext = (billIndex) => {
    setAssignedBills((prevBills) => {
      const updatedBills = [...prevBills];
      updatedBills[billIndex].modalStep = 2;
      return updatedBills;
    });
  };

  const handleSubmit = async (billIndex) => {
    setIsLoading(true);
    const bill = assignedBills[billIndex];

    // Close the modal
    setAssignedBills((prevBills) => {
      const updatedBills = [...prevBills];
      updatedBills[billIndex].showModal = false;
      return updatedBills;
    });

    try {
      const endLocation = await getCurrentLocation();
      if (endLocation) {
        const deliveredProducts = bill.deliveredProducts.map((dp) => ({
          item_id: dp.item_id,
          deliveredQuantity: dp.deliveredQuantity,
        }));

        const updatedOtherExpenses = bill.otherExpenses
          .filter(
            (exp) =>
              exp.isNew ||
              exp.isEdited ||
              (typeof exp.amount === "number" && exp.amount > 0) ||
              exp.remark
          )
          .map((exp) => ({
            id: exp._id || null,
            amount: parseFloat(exp.amount) || 0,
            remark: exp.remark || "",
          }));

        const payload = {
          userId: userInfo._id,
          invoiceNo: bill.invoiceNo,
          driverName,
          endLocation: [endLocation.longitude, endLocation.latitude],
          deliveredProducts,
          kmTravelled: parseFloat(bill.kmTravelled) || 0,
          startingKm: parseFloat(bill.startingKm) || 0,
          endKm: parseFloat(bill.endKm) || 0,
          deliveryId: bill.deliveryId,
          fuelCharge: parseFloat(bill.fuelCharge) || 0,
          bata: parseFloat(bill.bata) || 0,
          vehicleNumber: bill.vehicleNumber,
          otherExpenses: updatedOtherExpenses,
          method: bill.method || "",
        };

        await api.post("/api/users/billing/end-delivery", payload);

        setCurrentDelivered({ invoiceNo: bill.invoiceNo, deliveryId: bill.deliveryId });
        setAssignedBills((prevBills) => {
          const updatedBills = [...prevBills];
          updatedBills.splice(billIndex, 1);
          // If no assigned bills remain, reset "deliveryStarted"
          if (updatedBills.length === 0) {
            setDeliveryStarted(false);
          }
          return updatedBills;
        });

        setShowDeliveredModal(true);
        localStorage.removeItem("assignedBills");
        localStorage.removeItem("deliveryStarted");
        setTimeout(() => setShowSuccessModal(false), 3000);
      }
    } catch (error) {
      console.error("Error updating delivery status:", error);
      setError("Error updating delivery status.");
    } finally {
      setIsLoading(false);
    }
  };

  // --------------------------------------------------
  // 13. Other Expenses Handlers
  // --------------------------------------------------
  const handleOtherExpensesChange = (billIndex, index, field, value) => {
    setAssignedBills((prevBills) => {
      const updatedBills = [...prevBills];
      const updatedExpenses = [...updatedBills[billIndex].otherExpenses];
      updatedExpenses[index][field] =
        field === "amount" ? parseFloat(value) || 0 : value;
      updatedExpenses[index].isEdited = true; // Mark as edited
      updatedBills[billIndex].otherExpenses = updatedExpenses;
      return updatedBills;
    });
  };

  const handleAddExpense = (billIndex) => {
    setAssignedBills((prevBills) => {
      const updatedBills = [...prevBills];
      updatedBills[billIndex].otherExpenses.push({
        amount: 0,
        remark: "",
        isNew: true,
      });
      return updatedBills;
    });
  };

  // --------------------------------------------------
  // 14. Cancel a Delivery
  // --------------------------------------------------
  const handleCancel = async (billIndex) => {
    const bill = assignedBills[billIndex];

    // If user has not yet started delivery for that invoice (deliveryId not set),
    // simply remove from assigned bills
    if (!bill.deliveryId) {
      setAssignedBills((prevBills) => {
        const updatedBills = [...prevBills];
        updatedBills.splice(billIndex, 1);
        // If none remain, reset
        if (updatedBills.length === 0) {
          setDeliveryStarted(false);
        }
        return updatedBills;
      });
      return;
    }

    try {
      setIsLoading(true);
      await api.post("/api/users/billing/cancel-delivery", {
        userId: userInfo._id,
        driverName,
        invoiceNo: bill.invoiceNo,
        deliveryId: bill.deliveryId,
        cancelReason: "Cancelled by driver",
      });
      setAssignedBills((prevBills) => {
        const updatedBills = [...prevBills];
        updatedBills.splice(billIndex, 1);
        if (updatedBills.length === 0) {
          setDeliveryStarted(false);
        }
        return updatedBills;
      });
      alert("Delivery cancelled successfully.");
      localStorage.removeItem("assignedBills");
      localStorage.removeItem("deliveryStarted");
    } catch (error) {
      console.error("Error cancelling delivery:", error);
      alert("Failed to cancel delivery. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // --------------------------------------------------
  // 15. Edit/Update an existing Delivery
  // --------------------------------------------------
  const handleUpdateDelivery = async () => {
    if (!selectedDelivery) return;

    try {
      setIsLoading(true);
      // Filter new or edited expenses
      const filteredExpenses = selectedDelivery.otherExpenses.filter(
        (exp) =>
          exp.isNew ||
          exp.isEdited ||
          (typeof exp.amount === "number" && exp.amount > 0) ||
          exp.remark
      );

      const updatedOtherExpenses = filteredExpenses.map((exp) => ({
        id: exp._id || null,
        amount: parseFloat(exp.amount) || 0,
        remark: exp.remark || "",
      }));

      const deliveredProducts = selectedDelivery.productsDelivered.map((dp) => ({
        item_id: dp.item_id,
        deliveredQuantity: dp.deliveredQuantity || 0,
      }));

      const payload = {
        deliveryId: selectedDelivery.deliveryId,
        startingKm: parseFloat(selectedDelivery.startingKm) || 0,
        endKm: parseFloat(selectedDelivery.endKm) || 0,
        fuelCharge: parseFloat(selectedDelivery.fuelCharge) || 0,
        bata: parseFloat(selectedDelivery.bata) || 0,
        vehicleNumber: selectedDelivery.vehicleNumber,
        method: selectedDelivery.method || "",
        updatedOtherExpenses,
        deliveredProducts,
      };

      const response = await api.put("/api/billing/update-delivery/update", payload);

      if (response.status === 200) {
        alert("Successfully updated");
        setShowDeliveryModal(false);
        setSelectedDelivery(null);
        await fetchMyDeliveries();
      } else {
        alert("Update failed: " + response.data.message);
      }
    } catch (error) {
      console.error("Error updating delivery:", error);
      alert("Error updating delivery: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --------------------------------------------------
  // 16. Delete a Delivery
  // --------------------------------------------------
  const handleDeleteDelivery = async (deliveryId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this delivery? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      setIsLoading(true);
      const response = await api.delete(`/api/billing/deliveries/${deliveryId}`);

      if (response.status === 200) {
        alert("Delivery deleted successfully.");
        await fetchMyDeliveries();
      } else {
        alert("Failed to delete delivery: " + response.data.message);
      }
    } catch (error) {
      console.error("Error deleting delivery:", error);
      alert("Error deleting delivery. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // --------------------------------------------------
  // 17. Decide which section to show
  //     - If localStorage said "deliveryStarted = true"
  //       and assignedBills is not empty, skip "home"
  // --------------------------------------------------
  useEffect(() => {
    if (deliveryStarted && assignedBills.length > 0) {
      setActiveSection("inProgress");
    }
  }, [deliveryStarted, assignedBills]);

  return (
    <div className="min-h-screen pb-10 bg-gray-50">
      {/* Loading Overlay */}
      {isLoading && <LoadingModal open={isLoading} />}

      <div className="flex flex-col items-center px-4 py-4 md:py-8">
        <div className="bg-white shadow-xl rounded-lg w-full max-w-5xl p-6">
          {/* ----------------------------------------------
              Tabs / Navigation
              ---------------------------------------------- */}
          {!deliveryStarted && (
            <div className="flex justify-center gap-8 mb-4">
              <button
                className={`font-bold text-xs focus:outline-none relative pb-2 transition-all duration-300 ${
                  activeSection === "home"
                    ? "text-red-600 border-b-2 border-red-600"
                    : "text-gray-600"
                }`}
                onClick={() => setActiveSection("home")}
              >
                Home
                {activeSection === "home" && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-red-600 transition-all duration-300"></span>
                )}
              </button>
              <button
                className={`font-bold text-xs focus:outline-none relative pb-2 transition-all duration-300 ${
                  activeSection === "my"
                    ? "text-red-600 border-b-2 border-red-600"
                    : "text-gray-600"
                }`}
                onClick={() => setActiveSection("my")}
              >
                My Deliveries
                {activeSection === "my" && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-red-600 transition-all duration-300"></span>
                )}
              </button>
              <button
                className={`font-bold text-xs focus:outline-none relative pb-2 transition-all duration-300 ${
                  activeSection === "assign"
                    ? "text-red-600 border-b-2 border-red-600"
                    : "text-gray-600"
                }`}
                onClick={() => setActiveSection("assign")}
              >
                Start Delivery
                {activeSection === "assign" && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-red-600 transition-all duration-300"></span>
                )}
              </button>
            </div>
          )}

          {/* ----------------------------------------------
              1) Home Section (shown only if no ongoing delivery)
              ---------------------------------------------- */}
          {activeSection === "home" && !deliveryStarted && (
            <div>

            <div className="text-center p-4 items-center ml-auto mr-auto">
              <p className="text-xs font-bold text-gray-600 mb-4">Quick Access</p>


              <button
                className="bg-red-500 hover:bg-red-600 text-white font-bold text-xs px-4 py-2 mt-4 rounded w-full md:w-1/2"
                onClick={() => setActiveSection("my")}
              >
                My Deliveries
              </button>
              <br/>
              <button
                className="bg-red-500 hover:bg-red-600 text-white font-bold text-xs px-4 py-2 mt-4 rounded w-full md:w-1/2"
                onClick={() => setActiveSection("assign")}
                >
                Start Delivery
              </button>

                </div>
            </div>
          )}

          {/* ----------------------------------------------
              2) Start Delivery Section (assign new bills)
              ---------------------------------------------- */}
          {activeSection === "assign" && !deliveryStarted && (
            <>
              <div className="mb-6">
                <label className="font-bold text-xs text-gray-500">Driver Name</label>
                <input
                  type="text"
                  placeholder="Enter Driver Name"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:border-red-200 focus:ring-red-500 text-xs"
                />
                <div className="relative w-full mt-4">
                  <label className="font-bold text-xs text-gray-500">Invoice No.</label>
                  <input
                    type="text"
                    placeholder="Enter Invoice Number"
                    value={invoiceNo}
                    onKeyDown={handleKeyDown}
                    onChange={(e) => setInvoiceNo(e.target.value)}
                    className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:border-red-200 focus:ring-red-500 text-xs"
                    readOnly={driverName.length === 0}
                  />
                  <i
                    onClick={() => setInvoiceNo(" ")}
                    className="fa fa-angle-down absolute right-3 bottom-3 text-gray-400 cursor-pointer"
                    title="Clear Text"
                  ></i>
                </div>
              </div>

              {/* Suggestions list */}
              {suggestions.length > 0 && (
                <ul className="bg-white divide-y shadow-lg rounded-md overflow-hidden mb-4 border border-gray-300 max-h-48 overflow-y-auto">
                  {suggestions.map((suggestion, index) => (
                    <li
                      key={suggestion._id}
                      className={`p-4 cursor-pointer hover:bg-gray-100 flex justify-between ${
                        index === selectedSuggestionIndex ? "bg-gray-200" : ""
                      }`}
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      <span className="font-bold text-xs text-gray-500">{suggestion.invoiceNo}</span>
                      <i className="fa fa-arrow-right text-gray-300" />
                    </li>
                  ))}
                </ul>
              )}

              {error && <p className="text-red-500 text-center text-xs mt-4">{error}</p>}

              {/* Assigned Bills Preview */}
              {assignedBills.length > 0 && (
                <div className="assigned-bills-preview mb-6">
                  <h3 className="font-bold text-gray-600 mb-2 text-sm">
                    Bills to be Delivered
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {assignedBills.map((bill, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg shadow">
                        <h4 className="font-bold text-gray-800 mb-1 text-xs">
                          Invoice No: {bill.invoiceNo}
                        </h4>
                        <p className="text-xs text-gray-600">
                          Customer: {bill.customerName}
                        </p>
                        <p className="text-xs text-gray-600">
                          Address: {bill.customerAddress}
                        </p>
                        <p className="text-xs font-bold text-gray-600">
                          Net Amount: ₹ {bill.grandTotal}
                        </p>
                        <p className="text-xs text-gray-600">
                          Products: {bill.deliveredProducts?.length}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                className="bg-red-500 hover:bg-red-600 text-white font-bold text-xs px-4 py-2 mt-4 rounded w-full"
                onClick={handleStartDelivery}
                disabled={assignedBills.length === 0}
              >
                Start Delivery
              </button>
            </>
          )}

          {/* ----------------------------------------------
              3) Delivery In-Progress Section
                 (Shown if deliveryStarted && assignedBills.length > 0)
              ---------------------------------------------- */}
          {((deliveryStarted && assignedBills.length > 0) || activeSection === "inProgress") && (
            <div>
              <p className="font-bold text-sm mb-6 text-gray-600">{assignedBills.length > 0 ? 'Currently Assigned Invoices' : 'Refresh Page'}</p>
              {assignedBills.map((bill, billIndex) => (
                <div
                  key={bill.invoiceNo}
                  className="mb-8 border-t-2 border-red-300 pt-4 pb-4"
                >
                  <h5 className="text-sm font-bold tracking-tight text-gray-600 mb-2">
                    Invoice No: {bill.invoiceNo}
                  </h5>

                  {/* Tab Toggle for each Bill */}
                  <div className="flex justify-center gap-8 mt-4">
                    <button
                      className={`font-bold text-xs focus:outline-none relative pb-2 transition-all duration-300 ${
                        bill.activeSection === "Billing Details"
                          ? "text-red-600 border-b-2 border-red-600"
                          : "text-gray-600"
                      }`}
                      onClick={() =>
                        setAssignedBills((prevBills) => {
                          const updatedBills = [...prevBills];
                          updatedBills[billIndex].activeSection = "Billing Details";
                          return updatedBills;
                        })
                      }
                    >
                      Billing Details
                      {bill.activeSection === "Billing Details" && (
                        <span className="absolute bottom-0 left-0 w-full h-0.5 bg-red-600"></span>
                      )}
                    </button>

                    <button
                      className={`font-bold text-xs focus:outline-none relative pb-2 transition-all duration-300 ${
                        bill.activeSection === "Payment Section"
                          ? "text-red-600 border-b-2 border-red-600"
                          : "text-gray-600"
                      }`}
                      onClick={() =>
                        setAssignedBills((prevBills) => {
                          const updatedBills = [...prevBills];
                          updatedBills[billIndex].activeSection = "Payment Section";
                          return updatedBills;
                        })
                      }
                    >
                      Payment Section
                      {bill.activeSection === "Payment Section" && (
                        <span className="absolute bottom-0 left-0 w-full h-0.5 bg-red-600"></span>
                      )}
                    </button>
                  </div>

                  {/* Bill Details */}
                  {bill.showDetails && (
                    <div>
                      {/* ----------------- Billing Details Section ----------------- */}
                      {bill.activeSection === "Billing Details" && (
                        <div className="mt-4">
                          <div className="space-y-1 text-xs text-gray-600 bg-gray-50 p-3 rounded-md">
                            <div className="flex flex-col md:flex-row justify-between">
                              <p className="font-bold">
                                Customer: {bill.customerName}
                              </p>
                              <p>Address: {bill.customerAddress}</p>
                            </div>
                            <div className="flex flex-col md:flex-row justify-between">
                              <p>Salesman: {bill.salesmanName}</p>
                              <p>
                                Invoice Date:{" "}
                                {new Date(bill.invoiceDate).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex flex-col md:flex-row justify-between">
                              <p>
                                Expected Delivery:{" "}
                                {new Date(bill.expectedDeliveryDate).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex flex-col md:flex-row justify-between font-bold text-gray-600">
                              <p>Bill Amount: ₹ {bill.grandTotal}</p>
                              <p>Discount: ₹ {bill.discount}</p>
                            </div>
                            <div className="flex flex-col md:flex-row justify-between">
                              <p className="text-green-600">
                                Received: ₹ {bill.receivedAmount}
                              </p>
                              <p className="font-bold text-red-600">
                                Remaining: ₹ {bill.remainingAmount}
                              </p>
                            </div>
                            <div className="flex flex-col md:flex-row justify-between font-bold">
                              <p className="text-gray-600">
                                Payment Status: {bill.paymentStatus}
                              </p>
                              <p className="text-gray-600">Delivery Status: In Transit</p>
                            </div>
                          </div>

                          {/* Products Table */}
                          <div className="mt-3">
                            {/* Desktop Table */}
                            <div className="hidden md:block overflow-x-auto">
                              <table className="w-full text-xs text-left text-gray-700">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                                  <tr>
                                    <th className="px-2 py-3">Product</th>
                                    <th className="px-2 py-3">ID</th>
                                    <th className="px-2 py-3">Qty Ordered</th>
                                    <th className="px-2 py-3">Qty Pending</th>
                                    <th className="px-2 py-3">Qty Delivered</th>
                                    <th className="px-2 py-3">Delivered?</th>
                                    <th className="px-2 py-3">Partially?</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {bill.deliveredProducts.map((dp, index) => {
                                    const shortName =
                                      dp.name.length > 20
                                        ? dp.name.slice(0, 15) + "..."
                                        : dp.name;
                                    return (
                                      <tr key={index} className="bg-white border-b">
                                        <th scope="row" className="px-2 py-2 font-semibold text-gray-600">
                                          {shortName}
                                        </th>
                                        <td className="px-2 py-2">{dp.item_id}</td>
                                        <td className="px-2 py-2">{dp.quantity}</td>
                                        <td className="px-2 py-2">{dp.pendingQuantity}</td>
                                        <td className="px-2 py-2">
                                          <input
                                            type="number"
                                            min="0"
                                            max={dp.pendingQuantity}
                                            value={dp.deliveredQuantity}
                                            onChange={(e) =>
                                              handleDeliveredQuantityChange(
                                                billIndex,
                                                dp.item_id,
                                                e.target.value
                                              )
                                            }
                                            className="w-16 p-1 border border-gray-300 rounded text-center"
                                          />
                                        </td>
                                        <td className="px-2 py-2 text-center">
                                          <i
                                            className={`fa ${
                                              dp.isDelivered
                                                ? "fa-check text-red-500"
                                                : "fa-times text-gray-400"
                                            }`}
                                          ></i>
                                        </td>
                                        <td className="px-2 py-2 text-center">
                                          <i
                                            className={`fa ${
                                              dp.isPartiallyDelivered
                                                ? "fa-check text-yellow-600"
                                                : "fa-times text-gray-400"
                                            }`}
                                          ></i>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>

                            {/* Mobile Layout */}
                            <div className="md:hidden space-y-4 mt-4">
                              {bill.deliveredProducts.map((dp, index) => (
                                <DeliveredProducts
                                  key={dp.item_id}
                                  dp={dp}
                                  billIndex={billIndex}
                                  handleDeliveredQuantityChange={handleDeliveredQuantityChange}
                                />
                              ))}
                            </div>
                          </div>

                          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2 mt-6">
                            <button
                              className="bg-red-500 hover:bg-red-600 text-white font-bold text-xs px-4 py-2 rounded-md w-full md:w-auto"
                              onClick={() => handleDelivered(billIndex)}
                            >
                              Continue
                            </button>
                            <button
                              className="bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold text-xs px-4 py-2 rounded-md w-full md:w-auto"
                              onClick={() => handleCancel(billIndex)}
                            >
                              Cancel Delivery
                            </button>
                          </div>

                          {/* Submit Delivery Modal */}
                          <Dialog
                            open={bill.showModal}
                            onClose={() =>
                              setAssignedBills((prevBills) => {
                                const updatedBills = [...prevBills];
                                updatedBills[billIndex].showModal = false;
                                return updatedBills;
                              })
                            }
                            fullWidth
                            maxWidth="sm"
                            fullScreen={fullScreen}
                          >
                            {bill.modalStep === 1 && (
                              <>
                                <DialogTitle className="text-sm font-bold text-gray-600">
                                  Delivery Summary
                                </DialogTitle>
                                <DialogContent>
                                  <div className="text-xs text-gray-600 space-y-2 mt-2">
                                    <p>
                                      <span className="font-bold">Invoice Number:</span>{" "}
                                      {bill.invoiceNo}
                                    </p>
                                    <p>
                                      <span className="font-bold">Customer:</span>{" "}
                                      {bill.customerName}
                                    </p>
                                    <p>
                                      <span className="font-bold">Address:</span>{" "}
                                      {bill.customerAddress}
                                    </p>
                                    <p>
                                      <span className="font-bold">Expected Delivery Date:</span>{" "}
                                      {new Date(bill.expectedDeliveryDate).toLocaleDateString()}
                                    </p>
                                    <p>
                                      <span className="font-bold">Bill Amount:</span> ₹{" "}
                                      {bill.grandTotal}
                                    </p>
                                    <p>
                                      <span className="font-bold">Received Amount:</span> ₹{" "}
                                      {bill.receivedAmount}
                                    </p>
                                    <p>
                                      <span className="font-bold">Remaining Balance:</span> ₹{" "}
                                      {bill.remainingAmount}
                                    </p>
                                  </div>

                                  <div className="mt-4">
                                    <h6 className="text-xs font-bold text-gray-700 mb-2">
                                      Delivered Products:{" "}
                                      {bill.deliveredProducts?.length}
                                    </h6>
                                    <ul className="list-disc list-inside text-xs text-gray-700 space-y-1">
                                      {bill.deliveredProducts.map((dp) => {
                                        const productName =
                                          dp.name.length > 30
                                            ? dp.name.slice(0, 30) + ".."
                                            : dp.name;
                                        if (dp.deliveredQuantity > 0) {
                                          return (
                                            <li
                                              key={dp.item_id}
                                              className="bg-gray-100 p-2 rounded-lg mb-1"
                                            >
                                              <div className="flex justify-between">
                                                <p className="font-bold">{dp.item_id}</p>
                                                <p className="font-bold">{productName}</p>
                                              </div>
                                              <p className="font-bold">
                                                Delivered Quantity: {dp.deliveredQuantity}
                                              </p>
                                            </li>
                                          );
                                        }
                                        return null;
                                      })}
                                    </ul>
                                  </div>
                                </DialogContent>
                                <DialogActions>
                                  <Button
                                    variant="outlined"
                                    color="primary"
                                    size="small"
                                    onClick={() => handleNext(billIndex)}
                                  >
                                    Next
                                  </Button>
                                </DialogActions>
                              </>
                            )}

                            {bill.modalStep === 2 && (
                              <>
                                <DialogTitle className="text-sm font-bold text-red-500">
                                  Additional Details
                                </DialogTitle>
                                <DialogContent>
                                  <div className="flex flex-col gap-4 mt-2 text-xs">
                                    <div>
                                      <label className="block text-gray-500 mb-1">
                                        Starting KM
                                      </label>
                                      <input
                                        type="number"
                                        value={bill.startingKm}
                                        onChange={(e) =>
                                          setAssignedBills((prevBills) => {
                                            const updatedBills = [...prevBills];
                                            const val = parseFloat(e.target.value) || 0;
                                            updatedBills[billIndex].startingKm = val;
                                            updatedBills[billIndex].kmTravelled =
                                              (parseFloat(updatedBills[billIndex].endKm) || 0) -
                                              val;
                                            return updatedBills;
                                          })
                                        }
                                        className="w-full border border-gray-300 px-3 py-2 rounded-md"
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-gray-500 mb-1">Ending KM</label>
                                      <input
                                        type="number"
                                        value={bill.endKm}
                                        onChange={(e) =>
                                          setAssignedBills((prevBills) => {
                                            const updatedBills = [...prevBills];
                                            const newEndKm = parseFloat(e.target.value) || 0;
                                            updatedBills[billIndex].endKm = newEndKm;
                                            const distance =
                                              newEndKm -
                                              (parseFloat(updatedBills[billIndex].startingKm) || 0);
                                            updatedBills[billIndex].kmTravelled = distance;

                                            // Example auto-calculations:
                                            updatedBills[billIndex].fuelCharge = (
                                              (distance / 10) *
                                              96
                                            ).toFixed(2);
                                            updatedBills[billIndex].bata = (distance * 2).toFixed(
                                              2
                                            );
                                            return updatedBills;
                                          })
                                        }
                                        className="w-full border border-gray-300 px-3 py-2 rounded-md"
                                      />
                                    </div>

                                    <div>
                                      <label className="block font-bold text-gray-500 mb-1">
                                        Distance Travelled (km)
                                      </label>
                                      <input
                                        type="number"
                                        value={bill.kmTravelled}
                                        readOnly
                                        className="w-full border bg-gray-100 border-gray-300 px-3 py-2 rounded-md"
                                      />
                                    </div>

                                    <div>
                                      <label className="block font-bold text-gray-500 mb-1">
                                        Fuel Charge
                                      </label>
                                      <input
                                        type="number"
                                        value={bill.fuelCharge}
                                        onChange={(e) =>
                                          setAssignedBills((prevBills) => {
                                            const updatedBills = [...prevBills];
                                            updatedBills[billIndex].fuelCharge =
                                              parseFloat(e.target.value) || 0;
                                            return updatedBills;
                                          })
                                        }
                                        className="w-full border border-gray-300 px-3 py-2 rounded-md"
                                      />
                                    </div>

                                    <div>
                                      <label className="block font-bold text-gray-500 mb-1">
                                        Bata
                                      </label>
                                      <input
                                        type="number"
                                        value={bill.bata}
                                        onChange={(e) =>
                                          setAssignedBills((prevBills) => {
                                            const updatedBills = [...prevBills];
                                            updatedBills[billIndex].bata =
                                              parseFloat(e.target.value) || 0;
                                            return updatedBills;
                                          })
                                        }
                                        className="w-full border border-gray-300 px-3 py-2 rounded-md"
                                      />
                                    </div>

                                    <div>
                                      <label className="block font-bold text-gray-500 mb-1">
                                        Vehicle No.
                                      </label>
                                      <input
                                        type="text"
                                        value={bill.vehicleNumber}
                                        onChange={(e) =>
                                          setAssignedBills((prevBills) => {
                                            const updatedBills = [...prevBills];
                                            updatedBills[billIndex].vehicleNumber = e.target.value;
                                            return updatedBills;
                                          })
                                        }
                                        className="w-full border border-gray-300 px-3 py-2 rounded-md"
                                      />
                                    </div>

                                    <div>
                                      <h6 className="text-xs font-bold text-gray-500 mb-1">
                                        Other Expenses
                                      </h6>
                                      {bill.otherExpenses.map((expense, idx) => (
                                        <div key={idx} className="flex gap-2 mb-2">
                                          <input
                                            type="number"
                                            value={expense.amount}
                                            onChange={(e) =>
                                              handleOtherExpensesChange(
                                                billIndex,
                                                idx,
                                                "amount",
                                                e.target.value
                                              )
                                            }
                                            placeholder="Amount"
                                            className="w-full border border-gray-300 px-3 py-2 rounded-md"
                                          />
                                          <input
                                            type="text"
                                            value={expense.remark}
                                            onChange={(e) =>
                                              handleOtherExpensesChange(
                                                billIndex,
                                                idx,
                                                "remark",
                                                e.target.value
                                              )
                                            }
                                            placeholder="Remark"
                                            className="w-full border border-gray-300 px-3 py-2 rounded-md"
                                          />
                                        </div>
                                      ))}
                                      <Button
                                        onClick={() => handleAddExpense(billIndex)}
                                        sx={{ textTransform: "none", fontSize: "0.7rem" }}
                                      >
                                        + Add Expense
                                      </Button>
                                    </div>

                                    <div>
                                      <label className="block font-bold text-gray-500 mb-1">
                                        Expense Payment Method
                                      </label>
                                      <select
                                        value={bill.method || ""}
                                        onChange={(e) =>
                                          setAssignedBills((prevBills) => {
                                            const updatedBills = [...prevBills];
                                            updatedBills[billIndex].method = e.target.value;
                                            return updatedBills;
                                          })
                                        }
                                        className="w-full border border-gray-300 px-3 py-2 rounded-md"
                                      >
                                        <option value="">Select method</option>
                                        {accounts.map((acc) => (
                                          <option key={acc.accountId} value={acc.accountId}>
                                            {acc.accountName}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                  </div>
                                </DialogContent>
                                <DialogActions>
                                  <Button
                                    variant="outlined"
                                    color="inherit"
                                    size="small"
                                    onClick={() =>
                                      setAssignedBills((prevBills) => {
                                        const updatedBills = [...prevBills];
                                        updatedBills[billIndex].modalStep = 1;
                                        return updatedBills;
                                      })
                                    }
                                  >
                                    Back
                                  </Button>
                                  <Button
                                    variant="outlined"
                                    color="primary"
                                    size="small"
                                    onClick={() => handleSubmit(billIndex)}
                                  >
                                    Submit
                                  </Button>
                                </DialogActions>
                              </>
                            )}
                          </Dialog>
                        </div>
                      )}

                      {/* ----------------- Payment Section ----------------- */}
                      {bill.activeSection === "Payment Section" && (
                        <div className="mt-6 pt-4 border-t text-xs">
                          <div className="flex flex-col md:flex-row md:justify-between mb-4 md:items-center border-b pb-4">
                            <p
                              className={`md:mb-0 mb-2 ${
                                bill.newPaymentStatus === "Paid"
                                  ? "bg-green-200 text-green-700"
                                  : bill.newPaymentStatus === "Partial"
                                  ? "bg-yellow-200 text-yellow-700"
                                  : "bg-red-200 text-red-700"
                              } text-center font-bold py-2 px-4 rounded-md w-full md:w-auto`}
                            >
                              {bill.newPaymentStatus}
                            </p>
                            <div className="mt-2 md:mt-0 text-right">
                              <button
                                className="bg-red-500 hover:bg-red-600 text-white font-bold text-xs px-4 py-2 rounded-md"
                                onClick={() => handlePaymentSubmit(billIndex)}
                              >
                                Submit Payment
                              </button>
                              <p className="italic text-gray-400 text-xs mt-1">
                                Ensure valid fields before submission
                              </p>
                            </div>
                          </div>

                          <h3 className="text-sm font-bold text-gray-600 mb-2">
                            Add Payment
                          </h3>
                          <div className="flex flex-col gap-4">
                            <div>
                              <label className="block text-xs font-bold text-gray-500 mb-1">
                                Payment Amount
                              </label>
                              <input
                                type="number"
                                value={bill.paymentAmount || ""}
                                onChange={(e) =>
                                  setAssignedBills((prevBills) => {
                                    const updatedBills = [...prevBills];
                                    updatedBills[billIndex].paymentAmount = Math.min(
                                      Number(e.target.value) || 0,
                                      bill.remainingAmount
                                    );
                                    return updatedBills;
                                  })
                                }
                                className="w-full border border-gray-300 px-3 py-2 rounded-md text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-gray-500 mb-1">
                                Payment Method
                              </label>
                              <select
                                value={bill.paymentMethod || ""}
                                onChange={(e) =>
                                  setAssignedBills((prevBills) => {
                                    const updatedBills = [...prevBills];
                                    updatedBills[billIndex].paymentMethod = e.target.value;
                                    return updatedBills;
                                  })
                                }
                                className="w-full border border-gray-300 px-3 py-2 rounded-md text-xs"
                              >
                                {accounts.map((acc) => (
                                  <option key={acc.accountId} value={acc.accountId}>
                                    {acc.accountName}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-gray-500 mb-1">
                                Remaining Amount
                              </label>
                              <p className="font-bold text-gray-600">
                                ₹ {bill.remainingAmount}
                              </p>
                            </div>
                          </div>

                          {error && (
                            <p className="text-red-500 text-center text-xs mt-4">
                              {error}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ----------------------------------------------
              Success Modal for Payment
              ---------------------------------------------- */}
          <Dialog open={showSuccessModal} onClose={() => setShowSuccessModal(false)}>
            <DialogTitle className="text-md font-bold text-gray-500">
              Operation Successful
            </DialogTitle>
            <DialogContent>
              <DialogContentText className="text-xs italic text-gray-400 mt-1 mb-5">
                Successfully updated the billing information.
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button
                variant="contained"
                color="primary"
                size="small"
                onClick={() => setShowSuccessModal(false)}
              >
                <i className="fa fa-check" />
              </Button>
            </DialogActions>
          </Dialog>

          {/* ----------------------------------------------
              Delivered Modal (if needed)
              ---------------------------------------------- */}
          {deliveredModal && (
            <DeliverySuccess
              invoiceNo={currentDelivered?.invoiceNo}
              deliveryNo={currentDelivered?.deliveryId}
              setDeliveryModal={setShowDeliveredModal}
            />
          )}

          {/* ----------------------------------------------
              My Deliveries Section
              ---------------------------------------------- */}
          {activeSection === "my" && !deliveryStarted && (
            <div className="my-deliveries-section mt-6 text-xs">
              <h2 className="text-xl font-bold text-gray-600 mb-4">My Deliveries</h2>
              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-2 items-center mb-4">
                <input
                  type="text"
                  placeholder="Search by Invoice No."
                  value={searchInvoiceNo}
                  onChange={(e) => setSearchInvoiceNo(e.target.value)}
                  className="w-full md:w-44 p-2 border border-gray-300 rounded-md focus:outline-none focus:border-red-300 focus:ring-red-300 text-xs"
                />
                <div className="flex mt-2 space-x-4">
                <div className="flex items-center space-x-2">
                  <label className="text-gray-500 font-bold text-xs">From:</label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="p-2 border border-gray-300 rounded-md text-xs"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <label className="text-gray-500 font-bold text-xs">To:</label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="p-2 border border-gray-300 rounded-md text-xs"
                  />
                </div>
                <IconButton
                  color="primary"
                  size="small"
                  onClick={fetchMyDeliveries}
                  title="Refresh"
                >
                  <FaSync />
                </IconButton>
                </div>
              </div>

              {/* Deliveries List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myDeliveries.map((delivery) => (
                  <div
                    onClick={() => {
                      setSelectedDelivery(delivery);
                      setShowDeliveryModal(true);
                    }}
                    key={delivery.deliveryId}
                    className="bg-white cursor-pointer shadow-md rounded-lg p-4 relative"
                  >
                    {/* Delete button (stop event propagation) */}
                    <button
                      className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteDelivery(delivery.deliveryId);
                      }}
                      title="Delete Delivery"
                    >
                      <i className="fa fa-trash"></i>
                    </button>

                    <h3 className="text-md font-bold text-gray-600 mb-1">
                      Invoice No: {delivery.invoiceNo}
                    </h3>
                    <p className="text-xs text-gray-500">
                      Customer: {delivery.customerName}
                    </p>
                    <p className="text-xs text-gray-500">
                      Billing Amount: ₹ {delivery.grandTotal}
                    </p>
                    <p className="text-xs text-gray-500">
                      Payment Status: {delivery.paymentStatus}
                    </p>
                    <p className="text-xs text-gray-500">
                      Delivery Status: {delivery.deliveryStatus}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ----------------------------------------------
              Edit Delivery Modal
              ---------------------------------------------- */}
          <Dialog
            open={showDeliveryModal && !!selectedDelivery}
            onClose={() => {
              setShowDeliveryModal(false);
              setSelectedDelivery(null);
            }}
            fullWidth
            maxWidth="sm"
            fullScreen={fullScreen}
          >
            <DialogTitle className="text-sm font-bold text-gray-600">
              Edit Delivery Details - Invoice No: {selectedDelivery?.invoiceNo}
            </DialogTitle>
            <DialogContent dividers>
              {selectedDelivery && (
                <div className="text-xs text-gray-600 space-y-4">
                  <div className="space-y-1">
                    <p>
                      <span className="font-bold">Customer:</span>{" "}
                      {selectedDelivery?.customerName}
                    </p>
                    <p>
                      <span className="font-bold">Address:</span>{" "}
                      {selectedDelivery?.customerAddress}
                    </p>
                    <p>
                      <span className="font-bold">Billing Amount:</span> ₹{" "}
                      {selectedDelivery?.grandTotal}
                    </p>
                    <p>
                      <span className="font-bold">Payment Status:</span>{" "}
                      {selectedDelivery?.paymentStatus}
                    </p>
                    <p>
                      <span className="font-bold">Delivery Status:</span>{" "}
                      {selectedDelivery?.deliveryStatus}
                    </p>
                  </div>

                  {/* Distance & Charges */}
                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="block text-gray-500">Starting KM</label>
                      <input
                        type="number"
                        value={selectedDelivery?.startingKm || 0}
                        onChange={(e) =>
                          setSelectedDelivery((prev) => ({
                            ...prev,
                            startingKm: parseFloat(e.target.value) || 0,
                            kmTravelled:
                              (parseFloat(prev.endKm) || 0) -
                              (parseFloat(e.target.value) || 0),
                          }))
                        }
                        className="w-full border border-gray-300 px-3 py-2 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-500">Ending KM</label>
                      <input
                        type="number"
                        value={selectedDelivery?.endKm || 0}
                        onChange={(e) =>
                          setSelectedDelivery((prev) => {
                            const newEndKm = parseFloat(e.target.value) || 0;
                            const distance =
                              newEndKm - (parseFloat(prev.startingKm) || 0);
                            return {
                              ...prev,
                              endKm: newEndKm,
                              kmTravelled: distance,
                              // example auto-calcs
                              fuelCharge: ((distance / 10) * 96).toFixed(2),
                              bata: (distance * 2).toFixed(2),
                            };
                          })
                        }
                        className="w-full border border-gray-300 px-3 py-2 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-500">
                        Distance Travelled (km)
                      </label>
                      <input
                        type="number"
                        value={selectedDelivery?.kmTravelled || 0}
                        readOnly
                        className="w-full border bg-gray-100 border-gray-300 px-3 py-2 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-500">
                        Fuel Charge
                      </label>
                      <input
                        type="number"
                        value={selectedDelivery?.fuelCharge || 0}
                        onChange={(e) =>
                          setSelectedDelivery((prev) => ({
                            ...prev,
                            fuelCharge: parseFloat(e.target.value) || 0,
                          }))
                        }
                        className="w-full border border-gray-300 px-3 py-2 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-500">Bata</label>
                      <input
                        type="number"
                        value={selectedDelivery?.bata || 0}
                        onChange={(e) =>
                          setSelectedDelivery((prev) => ({
                            ...prev,
                            bata: parseFloat(e.target.value) || 0,
                          }))
                        }
                        className="w-full border border-gray-300 px-3 py-2 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-500">
                        Vehicle Number
                      </label>
                      <input
                        type="text"
                        value={selectedDelivery?.vehicleNumber || ""}
                        onChange={(e) =>
                          setSelectedDelivery((prev) => ({
                            ...prev,
                            vehicleNumber: e.target.value,
                          }))
                        }
                        className="w-full border border-gray-300 px-3 py-2 rounded-md"
                      />
                    </div>
                  </div>

                  {/* Other Expenses */}
                  <div>
                    <h6 className="text-xs font-bold text-gray-500 mb-1">
                      Other Expenses
                    </h6>
                    {selectedDelivery?.otherExpenses?.map((expense, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <input
                          type="number"
                          value={expense.amount || 0}
                          onChange={(e) => {
                            const updatedExpenses = [
                              ...selectedDelivery.otherExpenses,
                            ];
                            updatedExpenses[index] = {
                              ...updatedExpenses[index],
                              amount: parseFloat(e.target.value) || 0,
                              isEdited: true,
                            };
                            setSelectedDelivery((prev) => ({
                              ...prev,
                              otherExpenses: updatedExpenses,
                            }));
                          }}
                          placeholder="Amount"
                          className="w-1/2 p-2 border border-gray-300 rounded-md"
                        />
                        <input
                          type="text"
                          value={expense.remark || ""}
                          onChange={(e) => {
                            const updatedExpenses = [
                              ...selectedDelivery.otherExpenses,
                            ];
                            updatedExpenses[index] = {
                              ...updatedExpenses[index],
                              remark: e.target.value,
                              isEdited: true,
                            };
                            setSelectedDelivery((prev) => ({
                              ...prev,
                              otherExpenses: updatedExpenses,
                            }));
                          }}
                          placeholder="Remark"
                          className="w-1/2 p-2 border border-gray-300 rounded-md"
                        />
                      </div>
                    ))}
                    <Button
                      onClick={() => {
                        setSelectedDelivery((prev) => ({
                          ...prev,
                          otherExpenses: [
                            ...(prev.otherExpenses || []),
                            { amount: 0, remark: "", isNew: true },
                          ],
                        }));
                      }}
                      sx={{ textTransform: "none", fontSize: "0.7rem" }}
                    >
                      + Add Expense
                    </Button>
                  </div>

                  {/* Expense Payment Method */}
                  <div>
                    <label className="block font-bold text-gray-500 mb-1">
                      Expense Payment Method
                    </label>
                    <select
                      value={selectedDelivery?.method || ""}
                      onChange={(e) =>
                        setSelectedDelivery((prev) => ({
                          ...prev,
                          method: e.target.value,
                        }))
                      }
                      className="w-full border border-gray-300 px-3 py-2 rounded-md"
                    >
                      <option value="">Select Method</option>
                      {accounts.map((acc) => (
                        <option key={acc.accountId} value={acc.accountId}>
                          {acc.accountName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Delivered Products Editing */}
                  <div className="mt-4">
                    <h6 className="font-bold text-gray-700">
                      Delivered Products:
                    </h6>
                    <div className="space-y-4 mt-2">
                      {selectedDelivery?.productsDelivered?.map((dp, index) => (
                        <div key={dp.item_id} className="border-b pb-2 text-xs">
                          <p className="font-bold">Item ID: {dp.item_id}</p>
                          <label className="block text-gray-500 mt-2">
                            Delivered Quantity
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={dp.deliveredQuantity || 0}
                            onChange={(e) => {
                              const updated = [
                                ...selectedDelivery.productsDelivered,
                              ];
                              updated[index].deliveredQuantity =
                                parseFloat(e.target.value) || 0;
                              updated[index].isEdited = true;
                              setSelectedDelivery((prev) => ({
                                ...prev,
                                productsDelivered: updated,
                              }));
                            }}
                            className="w-full border border-gray-300 px-3 py-1 rounded-md"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
            <DialogActions>
              <Button
                variant="outlined"
                color="inherit"
                size="small"
                onClick={() => {
                  setShowDeliveryModal(false);
                  setSelectedDelivery(null);
                }}
              >
                Close
              </Button>
              <Button
                variant="outlined"
                color="primary"
                size="small"
                onClick={handleUpdateDelivery}
              >
                Save
              </Button>
            </DialogActions>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default DriverBillingPage;
