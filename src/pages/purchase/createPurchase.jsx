import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "pages/api";
import BillingSuccess from "components/invoice/billingsuccess";
import useAuth from "hooks/useAuth";
import ErrorModal from "components/ErrorModal";
import ItemSuggestionsSidebar from "components/products/itemSuggestionSidebar";

export default function PurchasePage() {
  const [currentStep, setCurrentStep] = useState(1);

  // Seller Information
  const [sellerId, setSellerId] = useState("");
  const [sellerName, setSellerName] = useState("");
  const [sellerAddress, setSellerAddress] = useState("");
  const [sellerGst, setSellerGst] = useState("");
  const [sellerSuggestions, setSellerSuggestions] = useState([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [lastBillId, setLastBillId] = useState("");
  const [success, setSuccess] = useState(false);
  const [returnInvoice, setReturnInvoice] = useState("");
  const [otherExpenses, setOtherExpenses] = useState([]); // each element: { amount: "", remark: "" }
  

  const { user: userInfo } = useAuth();

  // Purchase Information
  const [purchaseId, setPurchaseId] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [billingDate, setBillingDate] = useState(
    new Date().toISOString().substring(0, 10)
  );
  const [invoiceDate, setInvoiceDate] = useState("");

  // Item Information
  const [items, setItems] = useState([]);
  const [itemLoading, setItemLoading] = useState(false);
  const [itemId, setItemId] = useState("");
  const [hsnCode, setHsnCode] = useState("");
  const [itemName, setItemName] = useState("");
  const [itemQuantity, setItemQuantity] = useState("");
  const [itemUnit, setItemUnit] = useState("");
  const [itemBrand, setItemBrand] = useState("");
  const [itemCategory, setItemCategory] = useState("");
  const [itemBillPrice, setItemBillPrice] = useState("");
  const [itemCashPrice, setItemCashPrice] = useState("");
  const [categories, setCategories] = useState([]);
  const [actLength, setActLength] = useState("");
  const [actBreadth, setActBreadth] = useState("");

  // New: GST at item level
  const [itemGst, setItemGst] = useState("18");

  // Item Additional Information
  const [sUnit, setSUnit] = useState("NOS");
  const [psRatio, setPsRatio] = useState("");
  const [length, setLength] = useState("");
  const [breadth, setBreadth] = useState("");
  const [size, setSize] = useState("");

  // Transportation Information
  const [logisticCompany, setLogisticCompany] = useState("");
  const [logisticBillId, setLogisticBillId] = useState("");
  const [logisticCompanyGst, setLogisticCompanyGst] = useState("");
  const [logisticAmount, setLogisticAmount] = useState("");
  const [logisticRemark, setLogisticRemark] = useState("");
  const [localCompany, setLocalCompany] = useState("");
  const [localBillId, setLocalBillId] = useState("");
  const [localCompanyGst, setLocalCompanyGst] = useState("");
  const [localAmount, setLocalAmount] = useState("");
  const [localRemark, setLocalRemark] = useState("");
  const [unloadingCharge, setUnloadCharge] = useState("");
  const [insurance, setInsurance] = useState("");
  const [damagePrice, setDamagePrice] = useState("");
  const [transportCompanies, setTransportCompanies] = useState([]);
  const [lastItemId, setLastItemId] = useState("");
  const [sellerSuggesstionIndex, setSellerSuggestionIndex] = useState(-1);
  const [itemstock, setItemStock] = useState("0");
  const [showSuggestionsSidebar, setShowSuggestionsSidebar] = useState(false);

  const [brands,setBrands] = useState([]);


  // Other States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  const navigate = useNavigate();

  // Refs for input fields to enable Enter navigation
  const sellerIdRef = useRef();
  const sellerNameRef = useRef();
  const sellerAddressRef = useRef();
  const sellerGstRef = useRef();
  const hsnCodeRef = useRef();
  const purchaseIdRef = useRef();
  const invoiceNoRef = useRef();
  const billingDateRef = useRef();
  const invoiceDateRef = useRef();
  const itemIdRef = useRef();
  const itemNameRef = useRef();
  const itemBrandRef = useRef();
  const itemCategoryRef = useRef();
  const itemBillPriceRef = useRef();
  const itemCashPriceRef = useRef();
  const itemUnitRef = useRef();
  const itemQuantityRef = useRef();
  const itemSunitRef = useRef();
  const itemlengthRef = useRef();
  const itemBreadthRef = useRef();
  const itemSizeRef = useRef();
  const itemPsRatioRef = useRef();
  const actLengthRef = useRef();
  const actBreadthRef = useRef();
  const itemGstRef = useRef();

  const unloadingRef = useRef();
  const insuranceRef = useRef();
  const damagePriceRef = useRef();

  const logisticCompanyRef = useRef();
  const logisticAmountRef = useRef();
  const localCompanyRef = useRef();
  const localAmountRef = useRef();

  // Effect to auto-hide messages after 3 seconds
  useEffect(() => {
    if (message || error) {
      const timer = setTimeout(() => {
        setMessage("");
        setError("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message, error]);

  // Fetch Last Bill ID on Mount
  useEffect(() => {
    const fetchLastBill = async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/api/purchases/lastOrder/id");
        const response = await api.get("/api/products/lastadded/id");
        const nextInvoiceNo = "KP" + parseInt(parseInt(data.slice(2), 10) + 1);
        if (data) {
          setLastBillId(data);
          setPurchaseId(nextInvoiceNo);
        }
        if (response.data) {
          setLastItemId(response.data);
        }
      } catch (error) {
        console.error("Error fetching last bill:", error);
        setError("Failed to fetch last billing information.");
      } finally {
        setLoading(false);
      }
    };
    fetchLastBill();
  }, []);

  // Effect to focus on the first input of each step
  useEffect(() => {
    if (currentStep === 1) {
      purchaseIdRef.current?.focus();
    } else if (currentStep === 2) {
      sellerAddressRef.current?.focus();
    } else if (currentStep === 3) {
      itemIdRef.current?.focus();
    } else if (currentStep === 4) {
      unloadingRef.current?.focus();
    }
  }, [currentStep]);

  // Fetch categories and transport companies on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoryRes = await api.get("/api/billing/purchases/categories");
        const brandRes = await api.get("/api/products/allbrands");
    
        setCategories(categoryRes.data.categories); // assuming response shape: { categories: [...] }
        setBrands(brandRes.data); // assuming response is just: [ "Brand1", "Brand2", ... ]
      } catch (error) {
        console.error("Error fetching categories or brands:", error);
      }
    };
    

    const fetchTransportCompanies = async () => {
      try {
        const { data } = await api.get("/api/purchases/get-all/transportCompany");
        const newData = [...data];
        setTransportCompanies(newData);
      } catch (error) {
        console.error("Error fetching transport companies:", error);
      }
    };

    fetchCategories();
    fetchTransportCompanies();
  }, []);

  // Handle Seller Name change with suggestions
  const handleSellerNameChange = async (e) => {
    const value = e.target.value;
    setSellerName(value);
    if (value.trim() === "") {
      setSellerSuggestions([]);
      setSellerId("");
      return;
    }
    try {
      const { data } = await api.get(
        `/api/billing/purchases/suggestions?q=${value}`
      );
      setSellerSuggestions(data.suggestions);
    } catch (err) {
      setError("Error fetching seller suggestions");
      setShowErrorModal(true);
    }
  };

  // Function to handle selecting a seller from suggestions
  const handleSelectSeller = (seller) => {
    setSellerName(seller.sellerName);
    setSellerId(seller.sellerId);
    setSellerAddress(seller.sellerAddress || "");
    setSellerGst(seller.sellerGst || "");
    setSellerSuggestions([]);
    invoiceNoRef.current?.focus();
  };

  // Function to generate a new seller ID
  const generateSellerId = async () => {
    try {
      const lastId = "KKSELLER" + Date.now().toString();
      setSellerId(lastId);
    } catch (err) {
      setError("Error generating seller ID");
      setShowErrorModal(true);
    }
  };

  // Function to handle adding items with consistent calculations
  const addItem = () => {
    // Validate all required fields
    if (
      !itemId ||
      !itemName ||
      !itemBrand ||
      !itemCategory ||
      itemBillPrice === "" ||
      itemCashPrice === "" ||
      !itemUnit ||
      itemQuantity === "" ||
      sUnit === "" ||
      psRatio === "" ||
      length === "" ||
      breadth === "" ||
      itemGst === "" ||
      hsnCode === "" 
    ) {
      setError("Please fill in all required fields before adding an item.");
      setShowErrorModal(true);
      return;
    }

    // Parse numerical inputs
    const parsedQuantity = parseFloat(itemQuantity);
    const parsedBillPrice = parseFloat(itemBillPrice);
    const parsedCashPrice = parseFloat(itemCashPrice);
    const productLength = parseFloat(length);
    const productBreadth = parseFloat(breadth);
    const productactLength = parseFloat(actLength);
    const productActBreadth = parseFloat(actBreadth);
    const productSize = size;
    const productPsRatio = parseFloat(psRatio);
    const productGst = parseFloat(itemGst);

    // Validate numerical inputs
    if (
      isNaN(parsedQuantity) ||
      parsedQuantity <= 0 ||
      isNaN(parsedBillPrice) ||
      parsedBillPrice < 0 ||
      isNaN(parsedCashPrice) ||
      parsedCashPrice < 0 ||
      isNaN(productLength) ||
      productLength <= 0 ||
      isNaN(productBreadth) ||
      productBreadth <= 0 ||
      isNaN(productPsRatio) ||
      isNaN(productactLength) ||
      productactLength <= 0 ||
      isNaN(productActBreadth) ||
      productActBreadth <= 0 ||
      productPsRatio <= 0 ||
      isNaN(productGst) ||
      productGst < 0
    ) {
      setError(
        "Please enter valid numerical values for quantity, price, gst, and dimensions."
      );
      setShowErrorModal(true);
      return;
    }

    // Prevent duplicate items
    if (items.some((item) => item.itemId === itemId)) {
      setError("This item is already added. Please adjust the quantity instead.");
      setShowErrorModal(true);
      return;
    }

    // Helper function to safely parse and multiply values
    const safeMultiply = (a, b) => (a && b ? parseFloat(a) * parseFloat(b) : 0);

    // Calculate area if length and breadth are present
    const area = safeMultiply(productLength, productBreadth);

    // By default, store the raw user input
    let quantityInNumbers = parsedQuantity;
    let billPriceInNumbers = parsedBillPrice;
    let cashPriceInNumbers = parsedCashPrice;

    // If unit is BOX or SQFT, convert to per NOS if needed
    if (itemUnit === "BOX") {
      quantityInNumbers = parsedQuantity * productPsRatio;
      billPriceInNumbers = parsedBillPrice / productPsRatio;
      // Do NOT include GST in cash part, so no further modification needed
      cashPriceInNumbers = parsedCashPrice / productPsRatio;
    } else if (itemUnit === "SQFT") {
      quantityInNumbers = parsedQuantity / area;
      billPriceInNumbers = parsedBillPrice * area;
      cashPriceInNumbers = parsedCashPrice * area;
    }

    const newItem = {
      itemId,
      name: itemName,
      brand: itemBrand,
      category: itemCategory,
      quantity: parsedQuantity,
      unit: itemUnit,
      billPrice: parsedBillPrice,
      cashPrice: parsedCashPrice,
      sUnit,
      psRatio: productPsRatio,
      length: productLength,
      breadth: productBreadth,
      actLength: productactLength,
      actBreadth: productActBreadth,
      size: productSize,
      quantityInNumbers,
      billPriceInNumbers,
      cashPriceInNumbers,
      gstPercent: productGst, // <-- NEW FIELD
      hsnCode: hsnCode
    };

    setItems([newItem, ...items]);
    clearItemFields();
    setMessage("Item added successfully!");
    itemIdRef.current.focus();
  };

  // Function to clear item input fields after adding
  const clearItemFields = () => {
    setItemId("");
    setItemName("");
    setItemBrand("");
    setItemCategory("");
    setItemBillPrice("");
    setItemCashPrice("");
    setItemUnit("");
    setItemQuantity("");
    setSUnit("NOS");
    setPsRatio("");
    setLength("");
    setBreadth("");
    setSize("");
    setActLength("");
    setActBreadth("");
    setItemStock("0");
    setHsnCode("");
    setItemGst("18"); // reset GST to default or empty
  };

  // Function to handle searching for an item by ID
  const handleSearchItem = async (item) => {
    if(!item){
      setError("Item Not Found.");
      setShowErrorModal(true);
      clearItemFields();
      }
    try {
      setItemLoading(true);
      const { data } = await api.get(`/api/products/itemId/${item.item_id}`);
      if (data) {
        setItemId(data.item_id);
        setItemName(data.name);
        setItemBrand(data.brand);
        setItemCategory(data.category);
        setItemBillPrice(data.billPrice);
        setItemCashPrice(data.cashPrice);
        setBreadth(data.breadth);
        setLength(data.length);
        setPsRatio(data.psRatio);
        setSize(data.size);
        setSUnit(data.sUnit);
        setItemUnit(data.pUnit);
        setHsnCode(data.hsnCode);
        setItemStock(data.countInStock);
        setActLength(data.actLength);
        setActBreadth(data.actBreadth);
        // If your backend has an item GST field, set it here; else default:
        setItemGst(data.gstPercent || "18");
        itemNameRef.current?.focus();
      } else {
        setError("Item not found.");
        setShowErrorModal(true);
        clearItemFields();
      }
    } catch (err) {
      setError("Error fetching item details.");
      setShowErrorModal(true);
      clearItemFields();
      setItemId(itemId);
    } finally {
      setItemLoading(false);
    }
  };

  // Function to add a new category
  const addCategory = () => {
    const newCategory = prompt("Enter new category:");
    if (newCategory && !categories.includes(newCategory)) {
      setCategories([...categories, newCategory]);
      setMessage(`Category "${newCategory}" added successfully!`);
      setItemCategory(newCategory);
    }
  };

  // Function to remove an item from the list
  const removeItem = (index) => {
    if (window.confirm("Are you sure you want to remove this item?")) {
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems);
      setMessage("Item removed successfully!");
    }
  };

  // Handle transport name changes
  const handletransportNameChange = async (e, type) => {
    if (type === "logistic") {
      setLogisticCompanyGst("");
    } else {
      setLocalCompanyGst("");
    }
    try {
      const { data } = await api.get(`/api/transportpayments/name/${e.target.value}`);
      if (type === "local") {
        setLocalCompanyGst(data.companyGst);
      } else if (type === "logistic") {
        console.log(data);
        setLogisticCompanyGst(data.companyGst);
      }
    } catch (err) {
      setError("Error fetching transporter details.");
      setShowErrorModal(true);
    }
  };

  // Function to handle editing item fields
  const handleItemFieldChange = (index, field, value) => {
    const updatedItems = [...items];
    updatedItems[index][field] = value;

    // Recalculate derived fields if necessary:
    // quantityInNumbers, billPriceInNumbers, cashPriceInNumbers.
    if (
      ["quantity", "billPrice", "cashPrice", "gstPercent"].includes(field)
    ) {
      const parsedQuantity = parseFloat(updatedItems[index].quantity);
      const parsedBillPrice = parseFloat(updatedItems[index].billPrice);
      const parsedCashPrice = parseFloat(updatedItems[index].cashPrice);
      const psRatio = parseFloat(updatedItems[index].psRatio);
      const productLength = parseFloat(updatedItems[index].length);
      const productBreadth = parseFloat(updatedItems[index].breadth);

      // Helper function to safely parse and multiply values
      const safeMultiply = (a, b) => (a && b ? parseFloat(a) * parseFloat(b) : 0);

      // Calculate area if length and breadth are present
      const area = safeMultiply(productLength, productBreadth);

      let quantityInNumbers = parsedQuantity || 0;
      let billPriceInNumbers = parsedBillPrice || 0;
      let cashPriceInNumbers = parsedCashPrice || 0;

      if (updatedItems[index].unit === "BOX") {
        quantityInNumbers = (parsedQuantity || 0) * (psRatio || 0);
        billPriceInNumbers = (parsedBillPrice || 0) / (psRatio || 1);
        // Do NOT add GST to cash part
        cashPriceInNumbers = (parsedCashPrice || 0) / (psRatio || 1);
      } else if (updatedItems[index].unit === "SQFT") {
        quantityInNumbers = (parsedQuantity || 0) / (area || 1);
        billPriceInNumbers = (parsedBillPrice || 0) * (area || 1);
        cashPriceInNumbers = (parsedCashPrice || 0) * (area || 1);
      }

      updatedItems[index].quantityInNumbers = quantityInNumbers;
      updatedItems[index].billPriceInNumbers = billPriceInNumbers;
      updatedItems[index].cashPriceInNumbers = cashPriceInNumbers;
    }

    setItems(updatedItems);
  };

  // ====== NEW GST CALCULATION PER ITEM =======
  // Calculate Total Amounts
  const calculateTotals = () => {
    let totalBillPartWithoutGst = 0;
    let totalBillGst = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalCashPart = 0;

    items.forEach((item) => {
        const q = parseFloat(item.quantityInNumbers) || 0;
        const bPrice = parseFloat(item.billPriceInNumbers) || 0;
        const cPrice = parseFloat(item.cashPriceInNumbers) || 0;
        const gstPercent = parseFloat(item.gstPercent) || 0;

        const itemBillWithoutGst = q * bPrice;
        const itemGstAmount = (itemBillWithoutGst * gstPercent) / 100;
        const iteminsurancewithoutGst =  (parseFloat(insurance) - parseFloat(insurance || 0) / 1.18 ) / 2 || 0;
        const itemCgst = itemGstAmount / 2 + iteminsurancewithoutGst;
        const itemSgst = itemGstAmount / 2 + iteminsurancewithoutGst;

        totalBillPartWithoutGst += itemBillWithoutGst;
        totalBillGst += itemGstAmount;
        totalCgst += itemCgst;
        totalSgst += itemSgst;

        const itemCashPart = q * cPrice;
        totalCashPart += itemCashPart;
    });

    const billPartTotal = totalBillPartWithoutGst + totalBillGst + parseFloat(insurance || 0); // Add insurance to Bill Part Total
    const cashPartTotal = totalCashPart;

    const amountWithoutGSTItems = totalBillPartWithoutGst + parseFloat(insurance || 0) / 1.18;
    const gstAmountItems = totalBillGst;
    const cgstItems = totalCgst;
    const sgstItems = totalSgst;

    const logisticAmountValue = parseFloat(logisticAmount || 0);
    const localAmountValue = parseFloat(localAmount || 0);
    const totalTransportationCharges = logisticAmountValue + localAmountValue;

    const gstRateTransport = 1.18;
    const amountWithoutGSTTransport = totalTransportationCharges / gstRateTransport;
    const gstAmountTransport = totalTransportationCharges - amountWithoutGSTTransport;
    const cgstTransport = gstAmountTransport / 2;
    const sgstTransport = gstAmountTransport / 2;

    const unloadingChargeValue = parseFloat(unloadingCharge || 0);
    const damagePriceValue = parseFloat(damagePrice || 0);

    const additionalExpensesSum = otherExpenses.reduce(
        (acc, curr) => acc + (parseFloat(curr.amount) || 0),
        0
    );

    const totalOtherExpenses = 
        totalTransportationCharges +
        unloadingChargeValue +
        damagePriceValue +
        additionalExpensesSum; // Removed insurance

    const totalItems = items.reduce(
        (acc, item) => acc + parseFloat(item.quantityInNumbers || 0),
        0
    );

    const perItemOtherExpense = totalItems > 0 ? totalOtherExpenses / totalItems : 0;

    const totalPurchaseAmount = billPartTotal + cashPartTotal;
    const grandTotalPurchaseAmount = totalPurchaseAmount + totalOtherExpenses;

    return {
        billPartTotal,
        cashPartTotal,
        amountWithoutGSTItems,
        gstAmountItems,
        cgstItems,
        sgstItems,
        totalTransportationCharges,
        amountWithoutGSTTransport,
        gstAmountTransport,
        cgstTransport,
        sgstTransport,
        totalOtherExpenses,
        perItemOtherExpense,
        totalPurchaseAmount,
        grandTotalPurchaseAmount,
    };
};

  // ====== END NEW GST CALC =======

  const {
    billPartTotal,
    cashPartTotal,
    amountWithoutGSTItems,
    gstAmountItems,
    cgstItems,
    sgstItems,
    totalTransportationCharges,
    amountWithoutGSTTransport,
    gstAmountTransport,
    cgstTransport,
    sgstTransport,
    totalOtherExpenses,
    perItemOtherExpense,
    totalPurchaseAmount,
    grandTotalPurchaseAmount,
  } = calculateTotals();

  // Handle Form Submission
  const submitHandler = async () => {
    setError("");

    if (!sellerName || !invoiceNo || items.length === 0) {
      setError("All fields are required before submission.");
      setShowErrorModal(true);
      return;
    }

    // Prepare purchase data
    const purchaseData = {
      sellerId,
      sellerName,
      sellerAddress,
      sellerGst,
      invoiceNo,
      purchaseId,
      billingDate,
      invoiceDate,
      otherExpenses,
      submittedBy: userInfo.name,
      items: items.map((item) => ({
          itemId: item.itemId || itemId,
          name: item.name,
          brand: item.brand,
          category: item.category,
          quantity: item.quantity,
          quantityInNumbers: item.quantityInNumbers,
          pUnit: item.unit,
          sUnit: item.sUnit,
          psRatio: item.psRatio,
          length: item.length,
          breadth: item.breadth,
          actLength: item.actLength,
          actBreadth: item.actBreadth,
          size: item.size,
          billPartPrice: item.billPrice,
          cashPartPrice: item.cashPrice,
          billPartPriceInNumbers: item.billPriceInNumbers * (1 + item.gstPercent / 100),
          cashPartPriceInNumbers: item.cashPriceInNumbers,
          allocatedOtherExpense: perItemOtherExpense * item.quantityInNumbers,
          hsnCode: item.hsnCode,
          totalPriceInNumbers:
              item.billPriceInNumbers * (1 + item.gstPercent / 100) + item.cashPriceInNumbers + perItemOtherExpense,
          gstPercent: item.gstPercent,
      })),
      totals: {
          billPartTotal, // Insurance is already included in billPartTotal in the updated calculation
          cashPartTotal,
          amountWithoutGSTItems,
          gstAmountItems,
          cgstItems,
          sgstItems,
          amountWithoutGSTTransport,
          gstAmountTransport,
          cgstTransport,
          sgstTransport,
          unloadingCharge,
          damagePrice,
          insurance,
          totalPurchaseAmount,
          totalOtherExpenses, // Insurance removed here
          grandTotalPurchaseAmount,
          transportationCharges: totalTransportationCharges,
      },
      transportationDetails: {
          logistic: {
              purchaseId: purchaseId,
              invoiceNo: invoiceNo,
              billId: logisticBillId,
              companyGst: logisticCompanyGst,
              transportCompanyName: logisticCompany,
              transportationCharges: logisticAmount,
              remark: logisticRemark,
          },
          local: {
              purchaseId: purchaseId,
              invoiceNo: invoiceNo,
              billId: localBillId,
              companyGst: localCompanyGst,
              transportCompanyName: localCompany,
              transportationCharges: localAmount,
              remark: localRemark,
          }
      },
  };
  

    try {
      setLoading(true);
      const returnData = await api.post("/api/products/purchase", purchaseData);
      setReturnInvoice(returnData.data);
      alert("Purchase submitted successfully!");
      // Reset form fields
      setCurrentStep(1);
      setSellerId("");
      setSellerName("");
      setSellerAddress("");
      setSellerGst("");
      setInvoiceNo("");
      setPurchaseId("");
      setBillingDate(new Date().toISOString().substring(0, 10));
      setInvoiceDate("");
      setItems([]);
      setLogisticCompany("");
      setLogisticAmount("");
      setLogisticRemark("");
      setLocalCompany("");
      setLocalAmount("");
      setLocalRemark("");
      setUnloadCharge("");
      setInsurance("");
      setDamagePrice("");
      setSuccess(true);
    } catch (error) {
      setError("Error submitting purchase. Please try again.");
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  // Handle Enter key navigation between fields
  const changeRef = (e, nextRef) => {
    if (e.key === "Enter") {
      e.preventDefault();
      nextRef?.current?.focus();
    }
  };


  const itemIdChange = async (e) => {
    const newValue = e.target.value;
    setItemId(newValue);
  
    if (!newValue.trim()) {
      setSuggestions([]);
      setError('');
      setShowSuggestionsSidebar(false);
      return;
    }
  
    try {
      const { data } = await api.get(`/api/products/searchform/search?q=${newValue}`);
      setSuggestions(data);
      setError('');
      if (data && data.length > 0) {
        setShowSuggestionsSidebar(true);
      } else {
        setShowSuggestionsSidebar(false);
      }
    } catch (err) {
      console.error('Error fetching suggestions:', err);
      setSuggestions([]);
      // setError('Error fetching product suggestions.');
      setShowSuggestionsSidebar(false);
    }
  };

  return (
    <div>
      {/* Loading Indicator */}
      {/* {(loading || itemLoading) && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white p-4 rounded-md shadow-md">
            <p className="text-sm font-bold">Loading...</p>
          </div>
        </div>
      )} */}

      {/* Error Modal */}
      {showErrorModal && (
        <ErrorModal 
        message={error || 'error'}
        onClose={() => setShowErrorModal(false)}
      />      )}

      {/* Main Content */}
      <div
        className={`mx-auto mt-8 p-6 bg-white shadow-md rounded-md ${
          currentStep !== 3 && "max-w-3xl"
        }`}
      >
        {success && (
          <BillingSuccess isAdmin={userInfo.isAdmin} estimationNo={returnInvoice} />
        )}
        {/* Step Indicator */}
        <div className="flex justify-between mb-5">
          <div className="text-left">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="mt-2 py-2 px-4 text-xs font-bold rounded-md bg-red-500 hover:bg-red-600 text-white"
              >
                Back
              </button>
            )}
          </div>
          <div className="text-right">
            {currentStep === 4 ? (
              <button
                onClick={()=> submitHandler()}
                disabled={loading}
                className="py-2 font-bold px-4 bg-red-600 text-white rounded-md hover:bg-red-700 text-xs"
              >
                Submit
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep + 1)}
                className="mt-6 text-xs py-2 px-4 bg-red-600 text-white font-bold rounded-md hover:bg-red-700"
              >
                Next
              </button>
            )}
            <p className="text-xs mt-1 text-gray-400">
              Please fill all fields before proceeding
            </p>
          </div>
        </div>

        {/* Total Amount Display */}
        {/* {currentStep === 4 && (
          <div className="bg-gray-100 p-4 space-y-2 rounded-lg shadow-inner mb-4">
            <div className="flex justify-between">
              <p className="text-xs font-bold">Bill Price Total:</p>
              <p className="text-xs">{billPartTotal.toFixed(2)}</p>
            </div>
            <div className="flex justify-between mt-2">
    <p className="text-xs font-bold">Insurance (Included in Bill Part):</p>
    <p className="text-xs">{parseFloat(insurance || 0).toFixed(2)}</p>
  </div>
            <div className="flex justify-between">
              <p className="text-xs">Amount without GST:</p>
              <p className="text-xs">{amountWithoutGSTItems.toFixed(2)}</p>
            </div>
            <div className="flex justify-between">
              <p className="text-xs">CGST :</p>
              <p className="text-xs">{cgstItems.toFixed(2)}</p>
            </div>
            <div className="flex justify-between">
              <p className="text-xs">SGST :</p>
              <p className="text-xs">{sgstItems.toFixed(2)}</p>
            </div>
            <div className="flex justify-between mt-2">
              <p className="text-xs font-bold">Purchase Expense Total:</p>
              <p className="text-xs">{cashPartTotal.toFixed(2)}</p>
            </div>
            <div className="flex justify-between mt-2">
              <p className="text-xs font-bold">Total Purchase Amount:</p>
              <p className="text-xs font-bold">
                {totalPurchaseAmount.toFixed(2)}
              </p>
            </div>
            <div className="flex justify-between mt-2">
              <p className="text-xs font-bold">Total Other Expenses:</p>
              <p className="text-xs">{totalOtherExpenses.toFixed(2)}</p>
            </div>
            <div className="flex justify-between mt-2">
              <p className="text-sm font-bold">Grand Total:</p>
              <p className="text-sm font-bold">
                {grandTotalPurchaseAmount.toFixed(2)}
              </p>
            </div>
          </div>
        )} */}

        {/* Form */}
        <div>
          <div className="space-y-8">
            {/* Step 1: Supplier Information */}
            {currentStep === 1 && (
              <div>
                <h2 className="text-sm font-bold text-gray-900">
                  Supplier Information
                </h2>
                <div className="mt-4 space-y-4">
                  <div className="flex flex-col">
                    <label className="text-xs flex justify-between mb-1 text-gray-700">
                      Purchase ID{" "}
                      <p className="text-xs italic text-gray-400">
                        Last Billed: {lastBillId}
                      </p>
                    </label>
                    <input
                      type="text"
                      placeholder="Purchase ID"
                      value={purchaseId}
                      ref={purchaseIdRef}
                      onChange={(e) => setPurchaseId(e.target.value)}
                      onKeyDown={(e) => changeRef(e, sellerNameRef)}
                      className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                      required
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="mb-1 text-xs text-gray-700">
                      Supplier Name
                    </label>
                    <input
                      type="text"
                      ref={sellerNameRef}
                      value={sellerName}
                      placeholder="Enter Supplier Name"
                      onChange={handleSellerNameChange}
                      onKeyDown={(e) => {
                        if (e.key === "ArrowDown") {
                          e.preventDefault();
                          setSellerSuggestionIndex((prevIndex) =>
                            prevIndex < sellerSuggestions.length - 1
                              ? prevIndex + 1
                              : prevIndex
                          );
                        } else if (e.key === "ArrowUp") {
                          e.preventDefault();
                          setSellerSuggestionIndex((prevIndex) =>
                            prevIndex > 0 ? prevIndex - 1 : prevIndex
                          );
                        } else if (e.key === "Enter") {
                          e.preventDefault();
                          if (
                            sellerSuggesstionIndex >= 0 &&
                            sellerSuggesstionIndex < sellerSuggestions.length
                          ) {
                            const selectedSeller =
                              sellerSuggestions[sellerSuggesstionIndex];
                            setSellerName(selectedSeller.sellerName);
                            setSellerGst(selectedSeller.sellerGst);
                            setSellerAddress(selectedSeller.sellerAddress);
                            setSellerId(selectedSeller.sellerId);
                            invoiceNoRef.current?.focus();
                            setSellerSuggestionIndex(-1); // Reset the index
                            setSellerSuggestions([]); // Clear suggestions
                          } else {
                            generateSellerId();
                            invoiceNoRef.current?.focus();
                          }
                        }
                      }}
                      className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                      required
                    />
                    {/* Suggestions Dropdown */}
                    {sellerSuggestions.length > 0 && (
                      <ul className="border border-gray-300 divide-y mt-1 rounded-md shadow-md max-h-40 overflow-y-auto">
                        {sellerSuggestions.map((suggestion, index) => (
                          <li
                            key={index}
                            className={`p-4 text-xs cursor-pointer hover:bg-gray-100 ${
                              index === sellerSuggesstionIndex
                                ? "bg-gray-200"
                                : ""
                            }`}
                            onClick={() => {
                              setSellerName(suggestion.sellerName);
                              setSellerGst(suggestion.sellerGst);
                              setSellerAddress(suggestion.sellerAddress);
                              setSellerId(suggestion.sellerId);
                              setSellerSuggestionIndex(-1); // Reset the index
                              setSellerSuggestions([]); // Clear suggestions
                              invoiceNoRef.current?.focus();
                            }}
                          >
                            {suggestion.sellerName}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Seller ID */}
                  <div className="flex flex-col">
                    <label className="mb-1 text-xs text-gray-700">
                      Supplier ID
                    </label>
                    <input
                      type="text"
                      ref={sellerIdRef}
                      value={sellerId}
                      placeholder="Supplier ID"
                      onChange={(e) => setSellerId(e.target.value)}
                      onKeyDown={(e) => changeRef(e, invoiceNoRef)}
                      className="w-full border border-gray-300 px-3 py-2 rounded-md bg-gray-100 focus:outline-none text-xs"
                      readOnly
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="mb-1 text-xs text-gray-700">
                      Invoice No.
                    </label>
                    <input
                      type="text"
                      ref={invoiceNoRef}
                      value={invoiceNo}
                      placeholder="Enter invoice number"
                      onChange={(e) => setInvoiceNo(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") setCurrentStep(2);
                      }}
                      className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Supplier Details */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="flex flex-col">
                  <label className="text-xs mb-1 text-gray-700">
                    Supplier Address
                  </label>
                  <input
                    type="text"
                    ref={sellerAddressRef}
                    placeholder="Supplier Address"
                    value={sellerAddress}
                    onKeyDown={(e) => changeRef(e, sellerGstRef)}
                    onChange={(e) => setSellerAddress(e.target.value)}
                    className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                    required
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-xs mb-1 text-gray-700">
                    Supplier GSTIN
                  </label>
                  <input
                    type="text"
                    placeholder="Supplier GST"
                    ref={sellerGstRef}
                    value={sellerGst}
                    onKeyDown={(e) => changeRef(e, billingDateRef)}
                    onChange={(e) => setSellerGst(e.target.value)}
                    className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                    required
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-xs mb-1 text-gray-700">
                    Billing Date
                  </label>
                  <input
                    type="date"
                    value={billingDate}
                    ref={billingDateRef}
                    onKeyDown={(e) => changeRef(e, invoiceDateRef)}
                    onChange={(e) => setBillingDate(e.target.value)}
                    className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-xs mb-1 text-gray-700">
                    Invoice Date
                  </label>
                  <input
                    type="date"
                    ref={invoiceDateRef}
                    value={invoiceDate}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") setCurrentStep(3);
                    }}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                  />
                </div>
              </div>
            )}

            {/* Step 3: Add Item */}
            {currentStep === 3 && (
              <div className="flex flex-col min-h-screen">
                {items?.length === 0 && (
                  <p className="text-sm font-bold text-center text-gray-300">
                    No Products Added
                  </p>
                )}
                {/* Items Table */}
                <div className="flex-1 overflow-auto p-4 pb-60">
                  {items.length > 0 && (
                    <>
                      {/* Desktop Table */}
                      <div className="hidden md:block">
                        <table style={{marginBottom: '50%'}} className="min-w-full table-auto bg-white shadow-md rounded-md">
                          <thead>
                            <tr className="bg-red-500 text-white text-xs">
                              <th className="px-2 py-2 text-left">Item ID</th>
                              <th className="px-2 py-2 text-left">Name</th>
                              <th className="px-2 py-2 text-left">Brand</th>
                              <th className="px-2 py-2 text-left">Category</th>
                              <th className="px-2 py-2 text-left">
                                Quantity
                              </th>
                              <th className="px-2 py-2 text-left">Unit</th>
                              <th className="px-2 py-2 text-left">
                                Bill Price (₹)
                              </th>
                              <th className="px-2 py-2 text-left">
                                Cash Price (₹)
                              </th>
                              <th className="px-2 py-2 text-left">
                                GST (%)
                              </th>
                              <th className="px-2 py-2 text-left">
                                Qty (NOS)
                              </th>
                              <th className="px-2 py-2 text-left">
                                Bill ₹/NOS
                              </th>
                              <th className="px-2 py-2 text-left">
                                Cash ₹/NOS
                              </th>
                              <th className="px-2 py-2 text-left">Total (₹)</th>
                              <th className="px-2 py-2 text-center">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="text-gray-600 text-xs">
                            {items.map((item, index) => {
                              // safe addition to avoid floating errors
                              function preciseAdd(...numbers) {
                                return (
                                  numbers.reduce(
                                    (acc, num) => acc + Math.round(num * 100),
                                    0
                                  ) / 100
                                );
                              }

                              const parsedBillPrice =
                                parseFloat(item.billPriceInNumbers) || 0;
                              const parsedCashPrice =
                                parseFloat(item.cashPriceInNumbers) || 0;
                              const quantity =
                                parseFloat(item.quantityInNumbers) || 0;
                              // total unit price (bill + cash)
                              const totalUnitPrice = preciseAdd(
                                parsedBillPrice,
                                parsedCashPrice
                              );
                              const totalamount = parseFloat(
                                (quantity * totalUnitPrice).toFixed(2)
                              );

                              return (
                                <tr
                                  key={index}
                                  className={`border-b hover:bg-gray-100 ${
                                    index % 2 === 0 ? "bg-gray-50" : "bg-white"
                                  }`}
                                >
                                  <td className="px-2 py-2">{item.itemId}</td>
                                  <td className="px-2 py-2">{item.name}</td>
                                  <td className="px-2 py-2">{item.brand}</td>
                                  <td className="px-2 py-2">
                                    {item.category}
                                  </td>
                                  <td className="px-2 py-2">
                                    <input
                                      type="number"
                                      value={item.quantity}
                                      min="1"
                                      step="0.01"
                                      onChange={(e) =>
                                        handleItemFieldChange(
                                          index,
                                          "quantity",
                                          e.target.value
                                        )
                                      }
                                      className="w-16 border border-gray-300 px-1 py-1 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                                    />
                                  </td>
                                  <td className="px-2 py-2">{item.unit}</td>
                                  <td className="px-2 py-2">
                                    <input
                                      type="number"
                                      value={item.billPrice}
                                      min="0"
                                      step="0.01"
                                      onChange={(e) =>
                                        handleItemFieldChange(
                                          index,
                                          "billPrice",
                                          e.target.value
                                        )
                                      }
                                      className="w-16 border border-gray-300 px-1 py-1 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                                    />
                                  </td>
                                  <td className="px-2 py-2">
                                    <input
                                      type="number"
                                      value={item.cashPrice}
                                      min="0"
                                      step="0.01"
                                      onChange={(e) =>
                                        handleItemFieldChange(
                                          index,
                                          "cashPrice",
                                          e.target.value
                                        )
                                      }
                                      className="w-16 border border-gray-300 px-1 py-1 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                                    />
                                  </td>
                                  <td className="px-2 py-2">
                                    <input
                                      type="number"
                                      value={item.gstPercent}
                                      min="0"
                                      step="0.01"
                                      onChange={(e) =>
                                        handleItemFieldChange(
                                          index,
                                          "gstPercent",
                                          e.target.value
                                        )
                                      }
                                      className="w-14 border border-gray-300 px-1 py-1 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                                    />
                                  </td>
                                  <td className="px-2 py-2">
                                    {item.quantityInNumbers.toFixed(2)}
                                  </td>
                                  <td className="px-2 py-2">
                                    {item.billPriceInNumbers.toFixed(2)}
                                  </td>
                                  <td className="px-2 py-2">
                                    {item.cashPriceInNumbers.toFixed(2)}
                                  </td>
                                  <td className="px-2 py-2">
                                    {totalamount.toFixed(2)}
                                  </td>
                                  <td className="px-2 py-2 text-center">
                                    <button
                                      onClick={() => removeItem(index)}
                                      className="text-red-600 hover:text-red-800 text-xs"
                                    >
                                      <i
                                        className="fa fa-trash"
                                        aria-hidden="true"
                                      ></i>
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile Cards */}
                      <div className="block md:hidden">
                        <div className="space-y-4">
                          {items.map((item, index) => (
                            <div
                              key={index}
                              className="bg-white shadow-lg rounded-lg p-4 border"
                            >
                              <div className="flex justify-between items-center mb-2">
                                <p className="text-xs font-bold">
                                  {item.name} - {item.itemId}
                                </p>
                                <button
                                  onClick={() => removeItem(index)}
                                  className="text-red-600 hover:text-red-800 text-xs"
                                >
                                  <i
                                    className="fa fa-trash"
                                    aria-hidden="true"
                                  ></i>
                                </button>
                              </div>
                              <p className="text-xs">Brand: {item.brand}</p>
                              <p className="text-xs">
                                Category: {item.category}
                              </p>
                              <p className="text-xs">
                                Quantity:{" "}
                                <input
                                  type="number"
                                  value={item.quantity}
                                  min="1"
                                  step="0.01"
                                  onChange={(e) =>
                                    handleItemFieldChange(
                                      index,
                                      "quantity",
                                      e.target.value
                                    )
                                  }
                                  className="w-16 border border-gray-300 px-1 py-1 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                                />{" "}
                                {item.unit}
                              </p>
                              <p className="text-xs">
                                Bill Price:{" "}
                                <input
                                  type="number"
                                  value={item.billPrice}
                                  min="0"
                                  step="0.01"
                                  onChange={(e) =>
                                    handleItemFieldChange(
                                      index,
                                      "billPrice",
                                      e.target.value
                                    )
                                  }
                                  className="w-16 border border-gray-300 px-1 py-1 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                                />
                              </p>
                              <p className="text-xs">
                                Cash Price:{" "}
                                <input
                                  type="number"
                                  value={item.cashPrice}
                                  min="0"
                                  step="0.01"
                                  onChange={(e) =>
                                    handleItemFieldChange(
                                      index,
                                      "cashPrice",
                                      e.target.value
                                    )
                                  }
                                  className="w-16 border border-gray-300 px-1 py-1 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                                />
                              </p>
                              <p className="text-xs">
                                GST (%):
                                <input
                                  type="number"
                                  value={item.gstPercent}
                                  min="0"
                                  step="0.01"
                                  onChange={(e) =>
                                    handleItemFieldChange(
                                      index,
                                      "gstPercent",
                                      e.target.value
                                    )
                                  }
                                  className="w-14 ml-1 border border-gray-300 px-1 py-1 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                                />
                              </p>
                              <p className="text-xs">
                                Quantity (NOS):{" "}
                                {item.quantityInNumbers.toFixed(2)}
                              </p>
                              <p className="text-xs">
                                Bill Price per NOS: ₹
                                {item.billPriceInNumbers.toFixed(2)}
                              </p>
                              <p className="text-xs">
                                Cash Price per NOS: ₹
                                {item.cashPriceInNumbers.toFixed(2)}
                              </p>
                              <p className="text-xs">
                                Total: ₹
                                {(
                                  item.quantityInNumbers *
                                  (item.billPriceInNumbers +
                                    item.cashPriceInNumbers)
                                ).toFixed(2)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Input Section */}
                <div
                                style={{
                                  width: '96%'
                                }}
                                  className="p-4 md:fixed bottom-0 left-0 right-0 bg-white shadow-inner">
                  <div className="md:flex justify-between space-x-2">
                    <div className="flex-1">
                      {/* Item Details */}
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                          <div className="flex flex-col">
                            <label className="mb-1 flex items-center text-xs text-gray-700">
                              <span>Item ID</span>
                              <span className="italic ml-auto text-gray-300">
                              {lastItemId || "Not found"}
                              </span>
                            </label>
                            <input
                              type="text"
                              ref={itemIdRef}
                              value={itemId}
                              onChange={(e) => itemIdChange(e)}
                              onKeyDown={(e) => {
                                if (e.key === 'ArrowDown') {
                                  e.preventDefault();
                                  setSelectedSuggestionIndex((prev) =>
                                    prev < suggestions.length - 1 ? prev + 1 : prev
                                  );
                                } else if (e.key === 'ArrowUp') {
                                  e.preventDefault();
                                  setSelectedSuggestionIndex((prev) =>
                                    prev > 0 ? prev - 1 : prev
                                  );
                                } else if (e.key === 'Enter') {
                                  if (
                                    selectedSuggestionIndex >= 0 &&
                                    selectedSuggestionIndex < suggestions.length
                                  ) {
                                    e.preventDefault();
                                    const selected = suggestions[selectedSuggestionIndex];
                                    handleSearchItem(selected);
                                    setSuggestions([]);
                                    setShowSuggestionsSidebar(false);
                                    itemNameRef.current?.focus();
                                  } else {
                                    handleDoubleClick(e);
                                    itemNameRef.current?.focus();
                                  }
                                }
                              }}       
                              className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                              required
                            />
                          </div>

                          <div className="flex flex-col">
                            <label className="text-xs text-gray-700 mb-1">
                              Item Name
                            </label>
                            <input
                              type="text"
                              placeholder="Enter Item Name"
                              ref={itemNameRef}
                              value={itemName}
                              onChange={(e) => setItemName(e.target.value)}
                              onKeyDown={(e) => changeRef(e, hsnCodeRef)}
                              className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                              required
                            />
                          </div>

                          <div className="flex flex-col">
                            <label className="text-xs text-gray-700 mb-1">
                             HsnCode
                            </label>
                            <input
                              type="text"
                              placeholder="Enter Item Hsn"
                              ref={hsnCodeRef}
                              value={hsnCode}
                              onChange={(e) => setHsnCode(e.target.value)}
                              onKeyDown={(e) => changeRef(e, itemBrandRef)}
                              className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                              required
                            />
                          </div>

                          <div className="flex flex-col">
                            <label className="text-xs text-gray-700 mb-1">
                              Item Brand
                            </label>
                            <select
  value={itemBrand}
  ref={itemBrandRef}
  onChange={(e) => {
    const value = e.target.value;
    if (value === '__add_new__') {
      const newBrand = prompt('Enter new brand:');
      if (newBrand && !brands.includes(newBrand)) {
        setBrands(prev => [...prev, newBrand]);
        setItemBrand(newBrand);
      }
    } else {
      setItemBrand(value);
    }
  }}
  onKeyDown={(e) => changeRef(e, itemCategoryRef)}
  className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
  required
>
  <option value="" disabled>Select Brand</option>
  {brands?.map((brand, index) => (
    <option key={index} value={brand}>
      {brand}
    </option>
  ))}
  <option value="__add_new__">+ Add another brand</option>
</select>

                          </div>

                          <div className="flex flex-col">
                            <label className="text-xs text-gray-700 mb-1">
                              Item Category
                            </label>
                            <select
  value={itemCategory}
  ref={itemCategoryRef}
  onChange={(e) => {
    const value = e.target.value;
    if (value === '__add_new__') {
      const newCategory = prompt('Enter new category:');
      if (newCategory && !categories.includes(newCategory)) {
        setCategories(prev => [...prev, newCategory]);
        setItemCategory(newCategory);
      }
    } else {
      setItemCategory(value);
    }
  }}
  onKeyDown={(e) => changeRef(e, itemSunitRef)}
  className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
  required
>
  <option value="" disabled>Select Category</option>
  {categories.map((category, index) => (
    <option key={index} value={category}>
      {category}
    </option>
  ))}
  <option value="__add_new__">+ Add another category</option>
</select>

                          </div>

                          <div className="flex flex-col">
                            <label className="text-xs text-gray-700 mb-1">
                              S Unit
                            </label>
                            <select
                              value={sUnit}
                              onChange={(e) => setSUnit(e.target.value)}
                              ref={itemSunitRef}
                              onKeyDown={(e) => changeRef(e, itemPsRatioRef)}
                              className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                              required
                            >
                              <option value="NOS">NOS</option>
                              <option value="SQFT">SQFT</option>
                              <option value="BOX">BOX</option>
                              <option value="GSQFT">GSQFT</option>
                            </select>
                          </div>
                        </div>

                        {/* Dimensions and Ratios */}
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                          <div className="flex flex-col">
                            <label className="text-xs text-gray-700 mb-1">
                              P/S Ratio
                            </label>
                            <input
                              type="number"
                              placeholder="Enter P/S Ratio"
                              value={psRatio}
                              ref={itemPsRatioRef}
                              onKeyDown={(e) => changeRef(e, itemlengthRef)}
                              onChange={(e) => setPsRatio(e.target.value)}
                              className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                              min="0"
                              step="0.01"
                            />
                          </div>

                          <div className="flex flex-col">
                            <label className="text-xs text-gray-700 mb-1">
                              Length
                            </label>
                            <input
                              type="number"
                              placeholder="Enter Length"
                              value={length}
                              ref={itemlengthRef}
                              onKeyDown={(e) => changeRef(e, itemBreadthRef)}
                              onChange={(e) => setLength(e.target.value)}
                              className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                              min="0"
                              step="0.01"
                            />
                          </div>

                          <div className="flex flex-col">
                            <label className="text-xs text-gray-700 mb-1">
                              Breadth
                            </label>
                            <input
                              type="number"
                              ref={itemBreadthRef}
                              placeholder="Enter Breadth"
                              value={breadth}
                              onKeyDown={(e) => changeRef(e, actLengthRef)}
                              onChange={(e) => setBreadth(e.target.value)}
                              className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                              min="0"
                              step="0.01"
                            />
                          </div>

                          <div className="flex flex-col">
                            <label className="text-xs text-gray-700 mb-1">
                              Act Length
                            </label>
                            <input
                              type="number"
                              ref={actLengthRef}
                              placeholder="Enter Act Length"
                              value={actLength}
                              onKeyDown={(e) => changeRef(e, actBreadthRef)}
                              onChange={(e) => setActLength(e.target.value)}
                              className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                              min="0"
                              step="0.01"
                            />
                          </div>

                          <div className="flex flex-col">
                            <label className="text-xs text-gray-700 mb-1">
                              Act Breadth
                            </label>
                            <input
                              type="number"
                              ref={actBreadthRef}
                              placeholder="Enter Act Breadth"
                              value={actBreadth}
                              onKeyDown={(e) => changeRef(e, itemSizeRef)}
                              onChange={(e) => setActBreadth(e.target.value)}
                              className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                              min="0"
                              step="0.01"
                            />
                          </div>
                        </div>

                        {/* Quantity, Price, GST */}
                        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                          <div className="flex flex-col">
                            <label className="text-xs text-gray-700 mb-1">
                              Size
                            </label>
                            <input
                              type="text"
                              placeholder="Enter Size"
                              value={size}
                              ref={itemSizeRef}
                              onKeyDown={(e) => changeRef(e, itemUnitRef)}
                              onChange={(e) => setSize(e.target.value)}
                              className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                            />
                          </div>

                          <div className="flex flex-col">
                            <label className="text-xs text-gray-700 mb-1">
                              P Unit
                            </label>
                            <select
                              value={itemUnit}
                              onChange={(e) => setItemUnit(e.target.value)}
                              ref={itemUnitRef}
                              onKeyDown={(e) => changeRef(e, itemQuantityRef)}
                              className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                              required
                            >
                              <option value="" disabled>
                                Select Unit
                              </option>
                              <option value="SQFT">SQFT</option>
                              <option value="BOX">BOX</option>
                              <option value="NOS">NOS</option>
                              <option value="GSQFT">GSQFT</option>
                            </select>
                          </div>

                          <div className="flex flex-col">
                            <label className="text-xs text-gray-700 mb-1">
                              Quantity
                            </label>
                            <input
                              type="number"
                              placeholder="Enter Quantity"
                              value={itemQuantity}
                              ref={itemQuantityRef}
                              onChange={(e) => setItemQuantity(e.target.value)}
                              onKeyDown={(e) => changeRef(e, itemBillPriceRef)}
                              className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                              min="1"
                              step="0.01"
                              required
                            />
                          </div>

                          <div className="flex flex-col">
                            <label className="text-xs text-gray-700 mb-1">
                            Bill Price (₹)
                            </label>
                            <input
                              type="number"
                              placeholder="Enter Bill Price"
                              value={itemBillPrice}
                              ref={itemBillPriceRef}
                              onChange={(e) => setItemBillPrice(e.target.value)}
                              onKeyDown={(e) => changeRef(e, itemCashPriceRef)}
                              className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                              min="0"
                              step="0.01"
                              required
                            />
                          </div>

                          <div className="flex flex-col">
                            <label className="text-xs text-gray-700 mb-1">
                              P.Expense Price (₹)
                            </label>
                            <input
                              type="number"
                              placeholder="Enter Purchase Expense  Price"
                              value={itemCashPrice}
                              ref={itemCashPriceRef}
                              onChange={(e) => setItemCashPrice(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  changeRef(e, itemGstRef);
                                }
                              }}
                              className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                              min="0"
                              step="0.01"
                              required
                            />
                          </div>
                          <div className="flex flex-col">
                            <label className="text-xs text-gray-700 mb-1">
                              GST (%)
                            </label>
                            <input
                              type="number"
                              placeholder="Enter GST %"
                              value={itemGst}
                              ref={itemGstRef}
                              onChange={(e) => setItemGst(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  addItem();
                                }
                              }}
                              className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                              min="0"
                              step="0.01"
                              required
                            />
                          </div>
                        </div>

                      </div>
                    </div>

                  

                    {/* Mini summary at bottom-right */}
                    <div>
                      <div className="w-60">
                        <div className="bg-gray-100 w-full p-4 space-y-2 rounded-lg shadow-inner">
                          <div className="flex justify-between">
                            <p className="text-xs font-bold">
                            Bill Price Total:
                            </p>
                            <p className="text-xs">
                              {billPartTotal.toFixed(2)}
                            </p>
                          </div>
                          <div className="flex justify-between mt-2">
    <p className="text-xs font-bold">Insurance :</p>
    <p className="text-xs">{parseFloat(insurance || 0).toFixed(2)}</p>
  </div>
                          <div className="flex justify-between">
                            <p className="text-xs">Amount without GST:</p>
                            <p className="text-xs">
                              {amountWithoutGSTItems.toFixed(2)}
                            </p>
                          </div>
                          <div className="flex justify-between">
                            <p className="text-xs">
                              CGST:
                            </p>
                            <p className="text-xs">
                              {cgstItems.toFixed(2)}
                            </p>
                          </div>
                          <div className="flex justify-between">
                            <p className="text-xs">
                              SGST:
                            </p>
                            <p className="text-xs">
                              {sgstItems.toFixed(2)}
                            </p>
                          </div>
                          <div className="flex justify-between mt-2">
                            <p className="text-xs font-bold">
                            Purchase Expense Total:
                            </p>
                            <p className="text-xs">
                              {cashPartTotal.toFixed(2)}
                            </p>
                          </div>
                          <div className="flex justify-between mt-2">
                            <p className="text-xs font-bold">
                              Purchase Amount:
                            </p>
                            <p className="text-xs font-bold">
                              {totalPurchaseAmount.toFixed(2)}
                            </p>
                          </div>
                          <div className="flex justify-between mt-2">
                            <p className="text-xs font-bold">
                              Total Other Expenses:
                            </p>
                            <p className="text-xs">
                              {totalOtherExpenses.toFixed(2)}
                            </p>
                          </div>
                          <div className="flex justify-between mt-2">
                            <p className="text-sm font-bold">Grand Total:</p>
                            <p className="text-sm font-bold">
                              {grandTotalPurchaseAmount.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Transportation Details */}
            {currentStep === 4 && (
              <div>
                <h2 className="text-sm font-bold text-gray-900">
                  Other Expenses
                </h2>

                <div className="flex justify-between mt-2 space-x-2 mb-5">
                  <div className="w-full">
                    <label className="text-xs text-gray-700 mb-1">
                      Unloading Charge
                    </label>
                    <input
                      type="number"
                      placeholder="Enter Unloading Charge"
                      value={unloadingCharge}
                      ref={unloadingRef}
                      onKeyDown={(e) => changeRef(e, insuranceRef)}
                      onChange={(e) => setUnloadCharge(e.target.value)}
                      className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div className="w-full">
                    <label className="text-xs text-gray-700 mb-1">
                      Insurance
                    </label>
                    <input
                      type="number"
                      placeholder="Enter Insurance Amount"
                      ref={insuranceRef}
                      onKeyDown={(e) => changeRef(e, damagePriceRef)}
                      value={insurance}
                      onChange={(e) => setInsurance(e.target.value)}
                      className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div className="w-full">
                    <label className="text-xs text-gray-700 mb-1">
                      Damage Price
                    </label>
                    <input
                      type="number"
                      ref={damagePriceRef}
                      onKeyDown={(e) => changeRef(e, logisticCompanyRef)}
                      placeholder="Enter Damage Price"
                      value={damagePrice}
                      onChange={(e) => setDamagePrice(e.target.value)}
                      className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  
                </div>

                <div className="mt-4 mb-5">
  <h3 className="text-xs font-bold text-gray-700">Additional Other Expenses</h3>
  {otherExpenses.map((expense, index) => (
    <div key={index} className="flex items-center space-x-2 mt-2">
      <input
        type="number"
        placeholder="Other Expense Amount"
        value={expense.amount}
        onChange={(e) => {
          const newExpenses = [...otherExpenses];
          newExpenses[index].amount = e.target.value;
          setOtherExpenses(newExpenses);
        }}
        className="w-full border border-gray-300 px-3 py-2 rounded-md text-xs"
      />
      <input
        type="text"
        placeholder="Remark"
        value={expense.remark}
        onChange={(e) => {
          const newExpenses = [...otherExpenses];
          newExpenses[index].remark = e.target.value;
          setOtherExpenses(newExpenses);
        }}
        className="w-full border border-gray-300 px-3 py-2 rounded-md text-xs"
      />
      <button
        type="button"
        onClick={() => {
          const newExpenses = otherExpenses.filter((_, i) => i !== index);
          setOtherExpenses(newExpenses);
        }}
        className="text-red-600 text-xs"
      >
        Delete
      </button>
    </div>
  ))}
  <button
    type="button"
    onClick={() =>
      setOtherExpenses([...otherExpenses, { amount: "", remark: "" }])
    }
    className="mt-2 py-1 px-2 bg-red-500 text-white text-xs rounded"
  >
    Add Another Other Expense
  </button>
</div>

                <h2 className="text-sm font-bold text-gray-900">
                  Transportation Details
                </h2>
                <div className="mt-4 space-y-6">
                  {/* Logistic Transportation */}
                  <div>
                    <h3 className="text-xs font-bold text-gray-800 mb-2">
                      Logistic Transportation (National)
                    </h3>
                    <div className="flex flex-col md:flex-row gap-2">
                      <div className="flex flex-col flex-1">
                        <label className="text-xs text-gray-700 mb-1">
                          Company
                        </label>
                        <select
                          value={logisticCompany}
                          ref={logisticCompanyRef}
                          onChange={(e) => {
                            if (e.target.value === "add-custom") {
                              const customCompany = prompt(
                                "Enter custom company name:"
                              );
                              if (customCompany) {
                                setTransportCompanies((prev) => [
                                  ...prev,
                                  customCompany,
                                ]);
                                setLogisticCompany(customCompany);
                              }
                            } else {
                              setLogisticCompany(e.target.value);
                            }
                            handletransportNameChange(e, "logistic");
                          }}
                          onKeyDown={(e) => changeRef(e, logisticAmountRef)}
                          className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                        >
                          <option value="" disabled>
                            Select Company
                          </option>
                          {transportCompanies.map((company, index) => (
                            <option key={index} value={company}>
                              {company}
                            </option>
                          ))}
                          <option value="add-custom" className="text-red-500">
                            Add Custom Company
                          </option>
                        </select>
                      </div>

                      <div className="flex flex-col flex-1">
                        <label className="text-xs text-gray-700 mb-1">
                          Amount (with GST)
                        </label>
                        <input
                          type="number"
                          placeholder="Enter Amount"
                          value={logisticAmount}
                          ref={logisticAmountRef}
                          onChange={(e) => setLogisticAmount(e.target.value)}
                          onKeyDown={(e) => changeRef(e, localCompanyRef)}
                          className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>
                    <div className="flex justify-between mt-2 space-x-2">
                      <div className="w-full">
                        <label className="text-xs text-gray-700 mb-1">
                          GSTIN
                        </label>
                        <input
                          type="text"
                          placeholder="Enter GSTIN"
                          value={logisticCompanyGst}
                          onChange={(e) => setLogisticCompanyGst(e.target.value)}
                          className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                        />
                      </div>

                      <div className="w-full">
                        <label className="text-xs text-gray-700 mb-1">
                          Bill Id
                        </label>
                        <input
                          type="text"
                          placeholder="Enter Bill Id"
                          value={logisticBillId}
                          onChange={(e) => setLogisticBillId(e.target.value)}
                          className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                        />
                      </div>

                      <div className="w-full">
                        <label className="text-xs text-gray-700 mb-1">
                          Remark
                        </label>
                        <input
                          type="text"
                          placeholder="Enter Remark"
                          value={logisticRemark}
                          onChange={(e) => setLogisticRemark(e.target.value)}
                          className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Local Transportation */}
                  <div>
                    <h3 className="text-xs font-bold text-gray-800 mb-2">
                      Local Transportation (In-State)
                    </h3>
                    <div className="flex flex-col md:flex-row gap-2">
                      <div className="flex flex-col flex-1">
                        <label className="text-xs text-gray-700 mb-1">
                          Company
                        </label>
                        <select
                          value={localCompany}
                          ref={localCompanyRef}
                          onChange={(e) => {
                            if (e.target.value === "add-custom") {
                              const customCompany = prompt(
                                "Enter custom company name:"
                              );
                              if (customCompany) {
                                setTransportCompanies((prev) => [
                                  ...prev,
                                  customCompany,
                                ]);
                                setLocalCompany(customCompany);
                              }
                            } else {
                              setLocalCompany(e.target.value);
                            }
                            handletransportNameChange(e, "local");
                          }}
                          onKeyDown={(e) => changeRef(e, localAmountRef)}
                          className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                        >
                          <option value="" disabled>
                            Select Company
                          </option>
                          {transportCompanies.map((company, index) => (
                            <option key={index} value={company}>
                              {company}
                            </option>
                          ))}
                          <option value="add-custom" className="text-red-500">
                            Add Custom Company
                          </option>
                        </select>
                      </div>

                      <div className="flex flex-col flex-1">
                        <label className="text-xs text-gray-700 mb-1">
                          Amount (with GST)
                        </label>
                        <input
                          type="number"
                          placeholder="Enter Amount"
                          value={localAmount}
                          ref={localAmountRef}
                          onChange={(e) => setLocalAmount(e.target.value)}
                          onKeyDown={(e) => {}}
                          className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>
                    <div className="flex justify-between mt-2 space-x-2">
                      <div className="w-full">
                        <label className="text-xs text-gray-700 mb-1">
                          GSTIN
                        </label>
                        <input
                          type="text"
                          placeholder="Enter GSTIN"
                          value={localCompanyGst}
                          onChange={(e) => setLocalCompanyGst(e.target.value)}
                          className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                        />
                      </div>

                      <div className="w-full">
                        <label className="text-xs text-gray-700 mb-1">
                          Bill Id
                        </label>
                        <input
                          type="text"
                          placeholder="Enter Bill Id"
                          value={localBillId}
                          onChange={(e) => setLocalBillId(e.target.value)}
                          className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                        />
                      </div>

                      <div className="w-full">
                        <label className="text-xs text-gray-700 mb-1">
                          Remark
                        </label>
                        <input
                          type="text"
                          placeholder="Enter Remark"
                          value={localRemark}
                          onChange={(e) => setLocalRemark(e.target.value)}
                          className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Overall Details */}
            {currentStep === 4 && (
              <div className="mt-6 bg-gray-100 space-y-2 p-4 rounded-lg shadow-inner">
                <h3 className="text-sm font-bold text-red-700 mb-2">
                  Overall Details
                </h3>
                <div className="flex justify-between">
                  <p className="text-xs font-bold">Bill Price Total:</p>
                  <p className="text-xs">{billPartTotal.toFixed(2)}</p>
                </div>
                <div className="flex justify-between mt-2">
    <p className="text-xs font-bold">Insurance (Included in Bill Part):</p>
    <p className="text-xs">{parseFloat(insurance || 0).toFixed(2)}</p>
  </div>
                <div className="flex justify-between">
                  <p className="text-xs">Subtotal (without GST):</p>
                  <p className="text-xs">
                    {amountWithoutGSTItems.toFixed(2)}
                  </p>
                </div>
                <div className="flex justify-between">
                  <p className="text-xs">CGST (Sum of items' half GST):</p>
                  <p className="text-xs">{cgstItems.toFixed(2)}</p>
                </div>
                <div className="flex justify-between">
                  <p className="text-xs">SGST (Sum of items' half GST):</p>
                  <p className="text-xs">{sgstItems.toFixed(2)}</p>
                </div>
                <div className="flex justify-between mt-2">
                  <p className="text-xs font-bold">Purchase Expense Total:</p>
                  <p className="text-xs">{cashPartTotal.toFixed(2)}</p>
                </div>
                <div className="flex justify-between mt-2">
                  <p className="text-xs font-bold">
                    Transportation Charges:
                  </p>
                  <p className="text-xs">
                    {totalTransportationCharges.toFixed(2)}
                  </p>
                </div>
                <div className="flex justify-between mt-2">
                  <p className="text-xs font-bold">Other Expenses Total:</p>
                  <p className="text-xs">{totalOtherExpenses.toFixed(2)}</p>
                </div>
                <div className="flex justify-between mt-2">
                  <p className="text-xs font-bold">Purchase Amount:</p>
                  <p className="text-xs font-bold">
                    {totalPurchaseAmount.toFixed(2)}
                  </p>
                </div>
                <div className="flex justify-between mt-2">
                  <p className="text-sm font-bold">Grand Total:</p>
                  <p className="text-sm font-bold">
                    {grandTotalPurchaseAmount.toFixed(2)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>



      {showSuggestionsSidebar && suggestions.length > 0 && (
  <ItemSuggestionsSidebar
    open={showSuggestionsSidebar}
    suggestions={suggestions}
    selectedIndex={selectedSuggestionIndex}
    onSelect={(suggestion) => {
      handleSearchItem(suggestion);
      setItemId(suggestion.item_id);
      setItemName(suggestion.name);
      setItemCategory(suggestion.category);
      setItemBrand(suggestion.brand);
      setSuggestions([]);
      setShowSuggestionsSidebar(false);
      itemNameRef.current?.focus();
    }}
    onClose={() => setShowSuggestionsSidebar(false)}
  />
)}

    </div>
  );
}
