// src/screens/BillingScreen.jsx
import React, { useState, useEffect, useRef, forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import SuccessModal from 'components/invoice/SccessModal';
import SummaryModal from 'components/invoice/SummaryModal';
import api from '../api';
import OutOfStockModal from 'components/invoice/itemAddingModal';
import BillingSuccess from 'components/invoice/billingsuccess';
import useAuth from 'hooks/useAuth';
import { 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useMediaQuery,
  useTheme,
  Slide,
  FormControlLabel,
  Checkbox,
  Button
} from '@mui/material';
import ItemSuggestionsSidebar from 'components/products/itemSuggestionSidebar';
import { isMobile } from 'react-device-detect';
import BottomLoader from './components/bottomLoader';
import ErrorModal from './components/errorModel';



const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});


export default function BillingScreen() {
  const navigate = useNavigate();

  // Billing Information States
  const [invoiceNo, setInvoiceNo] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().substring(0, 10)
  );
  
  const [salesmanName, setSalesmanName] = useState('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [deliveryStatus, setDeliveryStatus] = useState('Pending');
  const [paymentStatus, setPaymentStatus] = useState('Unpaid');
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [customerContactNumber, setCustomerContactNumber] = useState('');
  const [showroom, setshowRoom] = useState('Moncompu - Main Office');
  const [marketedBy, setMarketedBy] = useState('');
  const [discount, setDiscount] = useState(0);
  const [receivedAmount, setReceivedAmount] = useState(0);
  const [unloading, setUnloading] = useState(0);
  const [transportation, setTransportation] = useState(0);
  const [handlingcharge, setHandlingCharge] = useState(0);
  const [itemRemark, setItemRemark] = useState('');
  const [roundOff, setRoundOff] = useState(0);
  const [remark, setRemark] = useState('');
  const [receivedDate, setReceivedDate] = useState(
    () => {
      // Default to current local datetime in input's value format (YYYY-MM-DDTHH:MM)
      const now = new Date();
      return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
    });
const [showErrorModal, setShowErrorModal] = useState(false);
const [errorMessage, setErrorMessage] = useState('');

  const [paymentMethod, setPaymentMethod] = useState('');
  const [lastBillId, setLastBillId] = useState(null);
  const [itemName, setItemName] = useState('');
  const [itemCategory, setItemCategory] = useState('');
  const [itemBrand, setItemBrand] = useState('');
  // Product Information States
  const [itemId, setItemId] = useState('');
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('SQFT');
  const [sellingPrice, setSellingPrice] = useState('');
  const [filterText, setFilterText] = useState('');
  const [sqPrice, setSqPrice] = useState(0);
  const [customerSq, setCustomerSQ] = useState(0);
  const [fetchQuantity, setFetchQuantity] = useState(0);
  const [showOutOfStockModal, setShowOutOfStockModal] = useState(false);
  const [outofStockProduct, setOutofstockProduct] = useState(null);
  const [salesmanPhoneNumber, setSalesmanPhoneNumber] = useState('');
  const [salesmen, setSalesmen] = useState([]);
  const [imageError, setImageError] = useState(false);
  const [saveModal, setSaveModal] = useState(false);
  const [success, setSuccess] = useState(false);
  const [returnInvoice, setReturnInvoice] = useState('');
  const [customerSuggestions, setCustomerSuggestions] = useState([]);
  const [customerSuggesstionIndex, setCustomerSuggesstionIndex] = useState(-1);
  const [accounts, setAccounts] = useState([]);
  const [fetchItemPrice, setFetchItemPrice] = useState('');
  const [displaysellingPrice, setDisplaysellingPrice] = useState('');
  const [neededToPurchase, setNeededToPurchase] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [fetchInvoiceNo, setFetchInvoiceNo] = useState(false);
  const [roundOffMode, setroundOffMode] = useState('add'); // 'add' | 'sub'
  



  const { user: userInfo } = useAuth(); // Get the logged-in user info

  // We add a new state for GST rate when adding a product:
  const [gstRateInput, setGstRateInput] = useState(18); // Default 18%

  // Stepper Control
  const [step, setStep] = useState(1);

  // Modal Controls
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showSuggestionsSidebar, setShowSuggestionsSidebar] = useState(false);


  // Loading States
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Refs for Input Navigation
  const invoiceNoRef = useRef();
  const customerNameRef = useRef();
  const customerAddressRef = useRef();
  const salesmanNameRef = useRef();
  const invoiceDateRef = useRef();
  const expectedDeliveryDateRef = useRef();
  const deliveryStatusRef = useRef();
  const paymentStatusRef = useRef();
  const itemIdRef = useRef();
  const itemIdMobileRef = useRef();
  const itemQuantityRef = useRef();
  const itemQuantityMobileRef = useRef();
  const outofStockRef = useRef();
  const itemUnitRef = useRef();
  const itemUnitMobileRef = useRef();
  const sellingPriceRef = useRef();
  const sellingPriceMobileRef = useRef();
  const customerContactNumberRef = useRef();
  const marketedByRef = useRef();
  const itemNameRef = useRef();
  const itemBrandRef = useRef();
  const itemCategoryRef = useRef();
  const discountRef = useRef();
  const receivedAmountRef = useRef();
  const unloadingRef = useRef();
  const transportationRef = useRef();
  const handlingChargeRef = useRef();
  const remarkRef = useRef();
  const receivedDateRef = useRef();
  const paymentMethodRef = useRef();
  const showroomRef = useRef();
  const roundOffRef = useRef();
  const gstRateRef = useRef();
  const itemRemarkRef = useRef();
  const mobileitemRemarkRef = useRef();



  // Add these at the top with your other useState hooks:
const [showPrintModal, setShowPrintModal] = useState(false);

// We store which columns to show. By default, all columns are `true`:
const [printOptions, setPrintOptions] = useState({
  showItemId: true,
  showItemName: true,
  showItemRemark: true,
  showQuantity: true,
  showUnit: true,
  showPrice: true,
  showRate: true,
  showGst: true,
  showCgst: true,
  showSgst: true,
  showDiscount: true,
  showNetAmount: true,
  showPaymentDetails: true
});


  useEffect(() => {
    if (error) {
      setTimeout(() => {
        setError(null);
      }, 3000);
    }
  }, [error]);

  useEffect(() => {
    discountRef.current?.focus();
  }, [showSummaryModal]);

  useEffect(() => {
    const fetchSalesmen = async () => {
      try {
        const { data } = await api.get('/api/users/salesmen/all'); // Adjust the API endpoint as needed
        setSalesmen(data);
      } catch (err) {
  console.error(err);
  setErrorMessage(err.response?.data?.message || err.message || 'Unexpected error');
  setShowErrorModal(false);        // reset so modal can reopen on same error
  setShowErrorModal(true);
      }
    };

    const fetchAccounts = async () => {
      setIsLoading(false);
      setIsLoading(true); // Set loading state
      try {
        const response = await api.get('/api/accounts/allaccounts');
        const getPaymentMethod = response.data.map((acc) => acc.accountId);

        // Check if there are any accounts and set the first account as the default
        if (getPaymentMethod.length > 0) {
          const firstAccountId = getPaymentMethod[0];
          setPaymentMethod(firstAccountId); // Set the first account as default
        } else {
          setPaymentMethod(null); // Handle case where there are no accounts
        }

        setAccounts(response.data); // Set the accounts in state
      } catch (err) {
  console.error(err);
  setErrorMessage(err.response?.data?.message || err.message || 'Unexpected error');
  setShowErrorModal(false);        // reset so modal can reopen on same error
  setShowErrorModal(true);

      } finally {
        setIsLoading(false); // Stop loading
      }
    };

    fetchAccounts();
    fetchSalesmen();
  }, []);

  // Handle Salesman Selection
  const handleSalesmanChange = (e) => {
    const selectedName = e.target.value;
    setSalesmanName(selectedName);

    // Find the contact number for the selected salesman
    const selectedSalesman = salesmen.find(
      (salesman) => salesman.name === selectedName
    );
    if (selectedSalesman) {
      if (selectedSalesman.contactNumber) {
        setSalesmanPhoneNumber(selectedSalesman.contactNumber);
      } else {
        setSalesmanPhoneNumber('');
      }
    }
  };

  const handleLocalClear = () => {
    // Remove saved data from local storage
    localStorage.removeItem('savedBill');
    localStorage.removeItem('savedProducts');

    // Clear all relevant state variables
    setInvoiceNo('');
    setInvoiceDate('');
    setSalesmanName('');
    setExpectedDeliveryDate('');
    setDeliveryStatus('');
    setPaymentStatus('');
    setReceivedAmount(0);
    setPaymentMethod('');
    setReceivedDate('');
    setCustomerName('');
    setCustomerAddress('');
    setCustomerContactNumber('');
    setMarketedBy('');
    setDiscount(0);
    setProducts([]);

    // Provide feedback to the user
    setError('');
    alert('Billing data and products cleared successfully.');
    setSaveModal(false);
  };

  const handleLocalSave = () => {
    const billingData = {
      invoiceNo,
      invoiceDate,
      salesmanName,
      expectedDeliveryDate,
      deliveryStatus,
      paymentStatus,
      billingAmount: totalAmount,
      paymentAmount: receivedAmount,
      paymentMethod,
      paymentReceivedDate: receivedDate,
      customerName,
      showroom,
      customerAddress,
      customerContactNumber,
      marketedBy,
      discount,
      unloading,
      transportation,
      salesmanPhoneNumber,
      handlingcharge,
    };

    // Save the data to local storage as a JSON string
    localStorage.setItem('savedBill', JSON.stringify(billingData));
    localStorage.setItem('savedProducts', JSON.stringify(products));
    alert('Billing data saved');
    setSaveModal(false);
    setShowSummaryModal(false);
  };

  useEffect(() => {
    const fetchLocalSavedBill = async () => {
      // Retrieve saved data from local storage
      const savedData = localStorage.getItem('savedBill');
      if (savedData) {
        // Parse the JSON string back into an object
        const parsedData = JSON.parse(savedData);

        // Set your state with the fetched data
        setInvoiceNo(parsedData.invoiceNo);
        setInvoiceDate(parsedData.invoiceDate);
        setSalesmanName(parsedData.salesmanName);
        setExpectedDeliveryDate(parsedData.expectedDeliveryDate);
        setDeliveryStatus(parsedData.deliveryStatus);
        setPaymentStatus(parsedData.paymentStatus);
        setReceivedAmount(parsedData.paymentAmount);
        setPaymentMethod(parsedData.paymentMethod);
        setReceivedDate(parsedData.paymentReceivedDate);
        setCustomerName(parsedData.customerName);
        setCustomerAddress(parsedData.customerAddress);
        setCustomerContactNumber(parsedData.customerContactNumber);
        setMarketedBy(parsedData.marketedBy);
        setDiscount(parsedData.discount);
        setTransportation(parsedData.transportation);
        setHandlingCharge(parsedData.handlingcharge);
        setSalesmanPhoneNumber(parsedData.salesmanPhoneNumber);
        setUnloading(parsedData.unloading);
        setshowRoom(parsedData.showroom);
      }
    };

    fetchLocalSavedBill();
  }, []);

  useEffect(() => {
    const loadSavedProducts = () => {
      const savedProducts = localStorage.getItem('savedProducts');
      if (savedProducts) {
        setProducts(JSON.parse(savedProducts));
      }
    };

    loadSavedProducts();
  }, []);

  // Fetch Last Bill ID on Mount
  useEffect(() => {
    const fetchLastBill = async () => {
      setIsLoading(false);
      setIsLoading(true);
      try {
        const { data } = await api.get('/api/billing/lastOrder/id');

        // Generate the next invoice number
        const lastInvoiceNumber = parseInt(data.lastInvoice.slice(2), 10) || 0; // Extract the number part after "KK"
        const nextInvoiceNo =
          'KK' + (lastInvoiceNumber + 1).toString().padStart(2, '0'); // Ensures at least two digits

        // Generate the next customer ID
       const  lastCustomerNumber =
          parseInt(data.lastCustomerId.slice(3), 10) || 0; // Extract the number part after "CUS"
        const nextCustomer =
          'CUS' + (lastCustomerNumber + 1).toString().padStart(3, '0') + Date.now().toString().slice(5,10); // Ensures at least three digits

        setLastBillId(data.lastInvoice);
        setCustomerId(nextCustomer);
        setInvoiceNo(nextInvoiceNo);
      } catch (err) {
  console.error(err);
  setErrorMessage(err.response?.data?.message || err.message || 'Unexpected error');
  setShowErrorModal(false);        // reset so modal can reopen on same error
  setShowErrorModal(true);

      } finally {
        setIsLoading(false);
      }
    };
    fetchLastBill();
  }, []);

  const generatecustomerid = async () => {
    const { data } = await api.get('/api/billing/lastOrder/id');
    const  lastCustomerNumber =
    parseInt(data.lastCustomerId.slice(3), 10) || 0;
   let Id = 'CUS' + (lastCustomerNumber + 1).toString().padStart(3, '0') + Date.now().toString().slice(5,10);
   setCustomerId(Id);
  };

  useEffect(() => {
    if (selectedProduct) {
      if (unit === 'SQFT') {
        const quantity = selectedProduct.countInStock;
        const adjustedquantity = (
          parseFloat(quantity) *
          parseFloat(selectedProduct.length * selectedProduct.breadth)
        ).toFixed(2);
        setFetchQuantity(adjustedquantity);
        setQuantity(0);
      } else if (unit === 'BOX') {
        const quantity = selectedProduct.countInStock;
        const adjustedquantity = (
          parseFloat(quantity) / parseFloat(selectedProduct.psRatio)
        ).toFixed(2);
        setFetchQuantity(adjustedquantity);
        setQuantity(0);
      } else {
        const quantity = selectedProduct.countInStock;
        setFetchQuantity(quantity);
        setQuantity(0);
      }
    }
  }, [unit, selectedProduct]);

  useEffect(() => {
    if (selectedProduct) {
      const parsedActLenght = parseFloat(selectedProduct.actLength);
      const parsedActBreadth = parseFloat(selectedProduct.actBreadth);

      const parsedArea = parsedActLenght * parsedActBreadth;
      if (selectedProduct.category === 'TILES') {
        if (unit === 'SQFT') {
          setDisplaysellingPrice(
            (
              parseFloat(selectedProduct.price / 0.78) / parsedArea
            ).toFixed(2)
          );
        } else if (unit === 'BOX') {
          setDisplaysellingPrice(
            (parseFloat(selectedProduct.price / 0.78) * selectedProduct.psRatio
            ).toFixed(2)
          );
        } else {
          setDisplaysellingPrice(
            parseFloat((selectedProduct.price / 0.78).toFixed(2))
          );
        }
      } else if (selectedProduct.category === 'GRANITE') {
        setDisplaysellingPrice(
          (parseFloat(selectedProduct.price) / 0.75).toFixed(2)
        );
      } else {
        setDisplaysellingPrice(
          (parseFloat(selectedProduct.price) / 0.60).toFixed(2)
        );
      }
    }
  }, [unit, selectedProduct]);

  // Fetch Suggestions for Item ID
  const itemIdChange = async (e) => {
    const newValue = e.target.value;
    setItemId(newValue);
  
    if (!newValue.trim()) {
      setSuggestions([]);
      setError('');
      setItemName('');
      setItemCategory('');
      setItemBrand('');
      setItemRemark('');
      setQuantity('');
      setDisplaysellingPrice(0.00);
      setSellingPrice('');
      setGstRateInput('');
      setShowSuggestionsSidebar(false);
      return;
    }
  
    try {
      const { data } = await api.get(`/api/products/searchform/search?q=${newValue}&limit=50`);
      setSuggestions(data);
      setError('');
      if (data && data.length > 0) {
        setShowSuggestionsSidebar(true);
      } else {
        setShowSuggestionsSidebar(false);
      }
    } catch (err) {
  console.error(err);

      setSuggestions([]);
      setError('Error fetching product suggestions.');
      setShowSuggestionsSidebar(false);
    }
  };
  

// ─────────────────────────────────────────────────────────
//  Put this in BillingScreen.jsx
// ─────────────────────────────────────────────────────────
const handleproductUpdate = async (
  qty,                    
  product,                 
  needToPurchaseFlag,             
) => {
  try {
    setIsLoading(true);

    /* 1️⃣  hit the unified update route */
    const res = await api.put(`/api/products/update-stock/${product._id}`, {
      newQty: qty,
      userName:     userInfo.name,
      needToPurchase: needToPurchaseFlag,
      billingId: invoiceNo,                      
    });
    const { data: updatedProduct } = await api.get(`/api/products/itemId/${product.item_id}`);
    await addProductByItemId(updatedProduct)


    alert(
      needToPurchaseFlag
        ? "Recorded as need-to-purchase ✅"
        : "Stock updated successfully ✅"
    );
  } catch (err) {
    console.error(err);
    setErrorMessage(
      err.response?.data?.message || err.message || "Unexpected error"
    );
    setShowErrorModal(true);
  } finally {
    setIsLoading(false);
  }
};


  // Add Product by Selecting from Suggestions
  const addProductByItemId = async (product) => {
    setIsLoading(false);
    setIsLoading(true);
    setError('');
    try {
      const { data } = await api.get(`/api/products/itemId/${product.item_id}`);

      setSelectedProduct(data);
      setItemName(data.name);
      setItemBrand(data.brand);
      setItemCategory(data.category);
      setQuantity(1);
      setItemId(data.item_id);
      setGstRateInput(parseFloat(data.gstPercent) || 18);
      setFetchItemPrice(data.price);
      setUnit(data.sUnit);
      const parsedActLenght = parseFloat(data.actLength);
      const parsedActBreadth = parseFloat(data.actBreadth);
      const parsedArea = parsedActLenght * parsedActBreadth;
      if (data.category === 'TILES') {
        if (unit === 'SQFT') {
          setSellingPrice((parseFloat(data.price / 0.78) / parsedArea).toFixed(2));
          setDisplaysellingPrice(
            (parseFloat(data.price / 0.78) / parsedArea).toFixed(2)
          );
        } else if (unit === 'BOX') {
          setSellingPrice(
            (parseFloat(data.price / 0.78) * data.psRatio).toFixed(2)
          );
          setDisplaysellingPrice(
            (parseFloat(data.price / 0.78) * data.psRatio).toFixed(2)
          );
        } else {
          setSellingPrice(parseFloat((data.price / 0.78).toFixed(2)));
          setDisplaysellingPrice(parseFloat((data.price / 0.78).toFixed(2)));
        }
      } else if (data.category === 'GRANITE') {
        setSellingPrice((parseFloat(data.price) / 0.75).toFixed(2));
        setDisplaysellingPrice((parseFloat(data.price) / 0.75).toFixed(2));
      } else {
        setSellingPrice((parseFloat(data.price) / 0.60).toFixed(2));
        setDisplaysellingPrice((parseFloat(data.price) / 0.60).toFixed(2));
      }
      const quantity = data.countInStock;
      const adjustedquantity = (
        parseFloat(quantity) * parseFloat(data.length * data.breadth)
      ).toFixed(2);
      setFetchQuantity(adjustedquantity);
      setSuggestions([]);
      itemNameRef.current?.focus();
    } catch (err) {
  console.error(err);
  setErrorMessage(err.response?.data?.message || err.message || 'Unexpected error');
  setShowErrorModal(false);        // reset so modal can reopen on same error
  setShowErrorModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Adding Product with Quantity and Selling Price
  const handleAddProductWithQuantity = () => {
    // Check if a product is selected
    if (!selectedProduct) {
      setError('No product selected.');
      return;
    }

    // Validate quantity
    const parsedQuantity = parseFloat(quantity);
    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      setError('Please enter a valid quantity.');
      return;
    }

    // Validate selling price
    const parsedSellingPrice = parseFloat(sellingPrice);
    if (isNaN(parsedSellingPrice) || parsedSellingPrice <= 0) {
      setError('Please enter a valid selling price.');
      return;
    }

    // Validate GST% (from our new gstRateInput)
    const parsedGstRate = parseFloat(gstRateInput);
    if (isNaN(parsedGstRate) || parsedGstRate < 0) {
      setError('Please enter a valid GST%');
      return;
    }

    // Extract product details for calculations
    const productLength = parseFloat(selectedProduct.length || 0);
    const productBreadth = parseFloat(selectedProduct.breadth || 0);
    const productSize = parseFloat(selectedProduct.size || 0);
    const productPsRatio = parseFloat(selectedProduct.psRatio || 0);

    let adjustedQuantity = parsedQuantity;
    let adjustedSellingPrice = parsedSellingPrice;

    // Calculate Adjusted Quantity and Selling Price based on the Unit
    if (unit === 'SQFT' && productLength && productBreadth) {
      const area = productLength * productBreadth;
      if (area > 0) {
        adjustedQuantity = parsedQuantity / area;
        adjustedSellingPrice = parsedSellingPrice * area;
      }
    } else if (
      unit === 'BOX' &&
      productSize &&
      productPsRatio &&
      productLength &&
      productBreadth
    ) {
      const areaPerBox = productLength * productBreadth;
      adjustedQuantity = parsedQuantity * productPsRatio;
      adjustedSellingPrice = parsedSellingPrice * areaPerBox;
    } else if (unit === 'TNOS' && productLength && productBreadth) {
      const areaPerTnos = productLength * productBreadth;
      adjustedSellingPrice = parsedSellingPrice * areaPerTnos;
    }

    // Check if the product is already added to avoid duplicates
    if (products.some((p) => p._id === selectedProduct._id)) {
      setError('This product is already added. Adjust the quantity instead.');
      return;
    }

    // Add product to the list with adjusted details
    const productWithDetails = {
      ...selectedProduct,
      quantity: adjustedQuantity,
      enteredQty: parsedQuantity,
      unit,
      sellingPrice: parsedSellingPrice,
      sellingPriceinQty: adjustedSellingPrice,
      // NEW: store the product-level GST rate
      gstRate: parsedGstRate,
      itemRemark: itemRemark
    };

    const updatedProducts = [productWithDetails, ...products];
    setProducts(updatedProducts);

    // Save updated products to local storage

    // Show success modal and focus on the next item
    setShowSuccessModal(true);
    itemIdRef.current?.focus();

    setTimeout(() => {
      setShowSuccessModal(false);
    }, 2000);

    // Reset Fields
    setSelectedProduct(null);
    setQuantity(1);
    setUnit('SQFT');
    setItemName('');
    setItemCategory('');
    setItemId('');
    setItemBrand('');
    setSellingPrice('');
    setDisplaysellingPrice('');
    setGstRateInput(0); // reset to default 18%
    setError('');
  };

  // Delete a Product from the List
  const deleteProduct = (indexToDelete) => {
    setProducts(p => p.filter((_, i) => i !== indexToDelete));
  };

  // Edit Product Details (including new GST%)
  const handleEditProduct = (index, field, value) => {
    const updatedProducts = [...products];
    const product = updatedProducts[index];
    const parsedValue = parseFloat(value) || 0;

    // Helper function to safely parse and multiply values
    const safeMultiply = (a, b) =>
      a && b ? parseFloat(a) * parseFloat(b) : 0;

    // Calculate area if length and breadth are present
    const area = safeMultiply(product.length, product.breadth);

    if (field === 'enteredQty') {
      if (product.unit === 'SQFT' && area > 0) {
        // Calculate quantity based on area for 'SQFT'
        product.quantity = parsedValue / area;
      } else if (product.unit === 'BOX' && product.psRatio) {
        // Calculate quantity for 'BOX'
        product.quantity = parsedValue * parseFloat(product.psRatio);
      } else if (product.unit === 'TNOS') {
        // For 'TNOS', quantity is directly the enteredQty value
        product.quantity = parsedValue;
      } else {
        product.quantity = parsedValue;
      }
        product[field] = parsedValue;
    } else if (field === 'sellingPrice') {
      // Handle changes to sellingPrice
      product[field] = parsedValue;
      if (product.unit === 'BOX' && area > 0) {
        product.sellingPriceinQty = parsedValue * area;
      } else if (product.unit === 'TNOS' && area > 0) {
        product.sellingPriceinQty = parsedValue * area;
      } else if (product.unit === 'SQFT' && area > 0) {
        product.sellingPriceinQty = parsedValue * area;
      } else {
        product.sellingPriceinQty = parsedValue;
      }
    } else if (field === 'gstRate') {
      // NEW: handle changes to GST rate
      product.gstRate = parsedValue;
    }else if(field === 'itemRemark'){
      product.itemRemark = value.toString();
    } else {
      // Handle changes to other fields
      product[field] = parsedValue;
    }

    // Update the products state
    setProducts(updatedProducts);
  };

  // Calculate Totals (with per-product GST)
  const [totalAmount, setTotalAmount] = useState(0); 
  const [amountWithoutGST, setAmountWithoutGST] = useState(0);
  const [gstAmount, setGSTAmount] = useState(0);
  const [cgst, setCGST] = useState(0); // We'll just set them to 0 now
  const [sgst, setSGST] = useState(0); // We'll just set them to 0 now
  const [perItemDiscount, setPerItemDiscount] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);


/* ------------------------------------------------------------------
   Totals & Grand-total
   – keeps your original math, just eliminates reference / NaN issues
-------------------------------------------------------------------*/
useEffect(() => {
  /* ---------- parse once ---------- */
  const disc          = +discount        || 0;
  const trans         = +transportation  || 0;
  const unload        = +unloading       || 0;
  const handling      = +handlingcharge  || 0;
  const rOff          = +roundOff        || 0;

  /* ---------- quick exit ---------- */
  if (products.length === 0) {
    setAmountWithoutGST(0);
    setGSTAmount(0);
    setTotalAmount(0);
    setGrandTotal(0);
    // setPerItemDiscount(0);               // ← un-comment if you still use it
    return;
  }

  /* ---------- helpers ---------- */
  let baseSumWithoutGST = 0;   // sum of item bases, NET of GST & discount
  let totalGST           = 0;
  let subTotal           = 0;  // base + GST (still before extra charges)

  /* pre-compute overall “base” used for proportional discount -------------- */
  const grossBase = products.reduce(
    (sum, p) => sum + (+p.quantity || 0) * (+p.sellingPriceinQty || 0),
    0
  );
  const discountRatio = grossBase ? disc / grossBase : 0;

  /* main per-product loop --------------------------------------------------- */
  products.forEach(p => {
    const qty          = +p.quantity           || 0;
    const priceInQty   = +p.sellingPriceinQty  || 0;
    const gstRate      = +p.gstRate            || 0;  // e.g. 18

    const itemBase     = qty * priceInQty;
    const itemDiscount = itemBase * discountRatio;

    const baseExclGST  = itemBase / (1 + gstRate / 100) - itemDiscount; // net base
    const gstAmt       = baseExclGST * gstRate / 100;                   // its GST

    baseSumWithoutGST += baseExclGST;
    totalGST          += gstAmt;
    subTotal          += baseExclGST + gstAmt;                          // running total
  });

  /* ---------- grand total ---------- */
  const grandTotal =
    subTotal +
    trans +
    unload +
    handling +
    (roundOffMode === 'add' ?  rOff : -rOff);

  /* ---------- state updates ---------- */
  setAmountWithoutGST(baseSumWithoutGST.toFixed(2));
  setGSTAmount(totalGST.toFixed(2));
  setTotalAmount(subTotal.toFixed(2));
  setGrandTotal(grandTotal.toFixed(2));

  // setPerItemDiscount(disc / products.length);   // ← keep if still required
}, [
  discount,
  transportation,
  unloading,
  handlingcharge,
  roundOff,
  roundOffMode,
  products             // always keep this **last** to avoid extra renders
]);





  // Handle Billing Submission
  const handleBillingSubmit = async () => {
    // Validate Required Fields
    if (
      !customerName ||
      !customerAddress ||
      !invoiceNo ||
      !expectedDeliveryDate ||
      !salesmanPhoneNumber ||
      !salesmanName ||
      !customerId ||
      !showroom ||
      products.length === 0
    ) {
      setErrorMessage('Please fill all required fields and add at least one product.');
      setShowErrorModal(false);
      setShowErrorModal(true);
      return;
    }

    setIsSubmitting(true);
    setError('');

    const parsedDate = new Date(receivedDate);
   // This row's discount portion: "itemBase / sumOfBase * discount"
   let sumOfBase = 0;
   products.forEach((p) => {
     sumOfBase += (parseFloat(p.quantity) || 0) * (parseFloat(p.sellingPriceinQty) || 0);
   });

// Parse the discount value and compute the discount ratio.
const parsedDiscount = parseFloat(discount) || 0;
const discountRatio = sumOfBase > 0 ? parsedDiscount / sumOfBase : 0;
    
    const billingData = {
      invoiceNo,
      invoiceDate,
      salesmanName,
      expectedDeliveryDate,
      deliveryStatus,
      paymentStatus,
      userId: userInfo._id,
      billingAmount: totalAmount,
      grandTotal: grandTotal,
      cgst,
      sgst,
      paymentAmount: receivedAmount,
      paymentMethod,
      paymentReceivedDate: parsedDate,
      customerName,
      customerAddress,
      customerContactNumber,
      customerId,
      roundOff,
      roundOffMode,
      salesmanPhoneNumber,
      marketedBy,
      unloading,
      showroom,
      transportation,
      handlingCharge: handlingcharge, // shorthand for handlingCharge: handlingCharge
      isApproved,     // shorthand for isApproved: isApproved
      isneededToPurchase : neededToPurchase,
      remark,
      discount,
      products: products.map((p) => {
        const quantity = parseFloat(p.quantity) || 0;
        const sellingPriceInQty = parseFloat(p.sellingPriceinQty) || 0;
        const itemBase = quantity * sellingPriceInQty;
        const itemDiscount = itemBase * discountRatio;
    
    const rateWithoutGST = (itemBase - itemDiscount) / (1 + p.gstRate / 100);    
    // After discount
    const netBase = itemBase - itemDiscount;
    
    // GST on discounted base
    const gstAmount = rateWithoutGST * (1 + p.gstRate / 100) - rateWithoutGST;
    
    // Final net per item
    const netTotal = rateWithoutGST + gstAmount;
        
        return {
          item_id: p.item_id,
          name: p.name,
          category: p.category,
          brand: p.brand,
          quantity: quantity.toFixed(2),
          sellingPrice: p.sellingPrice,
          enteredQty: p.enteredQty,
          sellingPriceinQty: p.sellingPriceinQty,
          unit: p.unit,
          length: p.length || 0,
          breadth: p.breadth || 0,
          size: p.size || 0,
          psRatio: p.psRatio || 0,
          selledPrice: netTotal / parseFloat(quantity.toFixed(2)),
          // product-level GST
          gstRate: parseFloat(p.gstRate) || 0,
          itemRemark: p.itemRemark,
        };
      }),
    };

    try {
      const response = await api.post('/api/billing/create', billingData);
      setReturnInvoice(response.data.billingData.invoiceNo);

          // If the user checked the needed-to-purchase option, navigate to that page:
          
          // Reset Form Fields
          setInvoiceNo('');
          setInvoiceDate('');
          setSalesmanName('');
          setSalesmanPhoneNumber('');
          setExpectedDeliveryDate('');
          setDeliveryStatus('Pending');
          setPaymentStatus('Unpaid');
          setCustomerName('');
          setCustomerAddress('');
          setCustomerContactNumber('');
          setMarketedBy('');
          setProducts([]);
          setDiscount(0);
          setReceivedAmount(0);
          setReceivedDate('');
          setPaymentMethod();
          setShowSummaryModal(false);
          handleLocalClear();
          setIsApproved(false);
          setNeededToPurchase(false);
          setroundOffMode('add');
          setSuccess(true);
          // navigate('/'); // Example navigation
    } catch (err) {
  console.error(err);
  setErrorMessage(err.response?.data?.message || err.message || 'Unexpected error');
  setShowErrorModal(false);        // reset so modal can reopen on same error
  setShowErrorModal(true);

    } finally {
      setIsSubmitting(false);
    }
  };

  const generatePDF = async () => {
    setIsLoading(false);
    setIsLoading(true);

    const formData = {
      invoiceNo,
      invoiceDate,
      salesmanName,
      expectedDeliveryDate,
      deliveryStatus,
      salesmanPhoneNumber,
      paymentStatus,
      billingAmount: totalAmount,
      paymentAmount: receivedAmount,
      paymentMethod,
      paymentReceivedDate: receivedDate,
      customerName,
      customerAddress,
      customerContactNumber,
      marketedBy,
      subTotal: amountWithoutGST,
      transportation,
      unloading,
      grandTotal: grandTotal,
      cgst,
      sgst,
      discount,
      products: products.map((product) => ({
        item_id: product.item_id,
        name: product.name,
        category: product.category,
        brand: product.brand,
        quantity: product.quantity,
        sellingPrice: product.sellingPrice,
        enteredQty: product.enteredQty,
        sellingPriceinQty: product.sellingPriceinQty,
        unit: product.unit,
        size: product.size,
        gstRate: product.gstRate,
      })),
    };

    try {
      const response = await api.post(
        '/generate-pdf',
        formData,
        {
          responseType: 'blob',
        }
      );

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Invoice_${formData.invoiceNo}.pdf`;
      link.click();
    } catch (err) {
  console.error(err);
  setErrorMessage(err.response?.data?.message || err.message || 'Unexpected error');
  setShowErrorModal(false);        // reset so modal can reopen on same error
  setShowErrorModal(true);

    } finally {
      setIsLoading(false);
    }
  };

  function printInvoice(options) {
    const formData = {
      invoiceNo,
      invoiceDate,
      salesmanName,
      expectedDeliveryDate,
      deliveryStatus,
      salesmanPhoneNumber,
      paymentStatus,
      billingAmount: totalAmount,
      paymentAmount: receivedAmount,
      paymentMethod,
      paymentReceivedDate: receivedDate,
      customerName,
      customerAddress,
      customerContactNumber,
      marketedBy,
      perItemDiscount,
      subTotal: amountWithoutGST,
      roundOff,
      grandTotal,
      transportation,
      unloading,
      handling: handlingcharge,
      remark,
      cgst,
      sgst,
      discount,
      // Existing product mapping
      products: products.map((product) => ({
        item_id: product.item_id,
        name: product.name,
        category: product.category,
        brand: product.brand,
        quantity: product.quantity,
        sellingPrice: product.sellingPrice,
        enteredQty: product.enteredQty,
        sellingPriceinQty: product.sellingPriceinQty,
        unit: product.unit,
        size: product.size,
        gstRate: product.gstRate,
        itemRemark: product.itemRemark
      })),
      // NEW: pass the user-selected print options
      printOptions: options
    };
  
    api
      .post('/api/print/generate-invoice-html', formData)
      .then((response) => {
        const htmlContent = response.data; 
        const printWindow = window.open('', '', 'height=800,width=600');
        printWindow.document.write(htmlContent);
        printWindow.document.close();
      })
      .catch((err) => {
  console.error(err);
  setErrorMessage(err.response?.data?.message || err.message || 'Unexpected error');
  setShowErrorModal(false);        // reset so modal can reopen on same error
  setShowErrorModal(true);

      });
  }
  

  // Handle Step Navigation
  const nextStep = () => {
    if (step === 4) {
      setShowSummaryModal(true);
      discountRef.current?.focus();
    } else {
      setStep(step + 1);
    }
  };
  const prevStep = () => setStep(step - 1);

  // Handle Keyboard Navigation Between Fields
  function changeRef(e, nextRef) {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (nextRef === paymentStatusRef) {
        paymentStatusRef.current?.focus();
      } else if (nextRef === itemIdRef) {
        itemIdRef.current?.focus();
        setStep((prevStep) => prevStep + 1);
      } else if (nextRef === itemQuantityRef) {
        itemQuantityRef.current?.focus();
      } else if (nextRef === salesmanNameRef || nextRef === invoiceDateRef) {
        setStep((prevStep) => prevStep + 1);
      } else {
        nextRef?.current?.focus();
      }
    }
  }

  const [lastKeyWasEnter, setLastKeyWasEnter] = useState(false);

  const handleDoubleClick = (event) => {
    if (event.key === 'Enter') {
      if (lastKeyWasEnter) {
        setShowSummaryModal(true);
        discountRef.current?.focus();
        setLastKeyWasEnter(false); // Reset after handling
      } else {
        setLastKeyWasEnter(true);
        // Optional: Reset after a delay to avoid indefinite waiting
        setTimeout(() => setLastKeyWasEnter(false), 1000); // 1-second timeout
      }
    }
  };

  useEffect(() => {
    if (step === 1) {
      invoiceNoRef.current?.focus();
    } else if (step === 2) {
      salesmanNameRef.current?.focus();
    } else if (step === 3) {
      invoiceDateRef.current?.focus();
    } else if (step === 4) {
      itemIdRef.current?.focus();
    }
  }, [step]);

  // Auto-focus the quantity input when a product is selected
  useEffect(() => {
    if (selectedProduct) {
      itemQuantityRef.current.focus();
    }
  }, [selectedProduct]);

  // Reset suggestion index when suggestions change
  useEffect(() => {
    setSelectedSuggestionIndex(-1);
  }, [suggestions]);

  useEffect(() => {
    setCustomerSuggesstionIndex(-1);
  }, [customerSuggestions]);

  const handleCustomerNameChange = async (e) => {
    const value = e.target.value;
    setCustomerName(value);

    if (value.trim() === '') {
      setCustomerSuggestions([]);
      setCustomerAddress('');
      setCustomerContactNumber('');
      setCustomerId('');
      return;
    }

    try {
      // Make sure the endpoint path matches the updated router
      const { data } = await api.get(
        `/api/billing/customer/suggestions?suggestions=true&search=${encodeURIComponent(
          value
        )}`
      );
      setCustomerSuggestions(data.suggestions);
    } catch (err) {
  console.error(err);
  setErrorMessage(err.response?.data?.message || err.message || 'Unexpected error');
  setShowErrorModal(false);        // reset so modal can reopen on same error
  setShowErrorModal(true);

    }
  };

  const handlecustomerContactNumberChange = async (e) => {
    const value = e.target.value;
    setCustomerContactNumber(value);

    if (value.trim() === '') {
      setCustomerSuggestions([]);
      return;
    }

    try {
      const { data } = await api.get(
        `/api/billing/customer/suggestions?suggestions=true&search=${encodeURIComponent(
          value
        )}`
      );
      setCustomerSuggestions(data.suggestions);
    } catch (err) {
  console.error(err);
  setErrorMessage(err.response?.data?.message || err.message || 'Unexpected error');
  setShowErrorModal(false);        // reset so modal can reopen on same error
  setShowErrorModal(true);

    }
  };

  return (
    <div className="w-full">
      {success && (
        <BillingSuccess isAdmin={userInfo.isAdmin} estimationNo={returnInvoice} />
      )}

      {/* Top Banner */}

      {saveModal && (
        <div className="fixed transform font-bold fixed inset-0 flex items-center justify-center z-50 bg-gray-800 bg-opacity-20">
          <div className="bg-white p-8 text-center rounded-md space-y-6">
            <div className="flex justify-between">
              <p className="text-md">Save Bill</p>
              <p onClick={() => setSaveModal(false)} className="text-md ml-10 cursor-pointer">
                X
              </p>
            </div>
            <p
              className="text-sm text-red-600 border-b pb-5 cursor-pointer font-bold "
              onClick={() => handleLocalSave()}
            >
              Save
            </p>
            <p
              className="text-sm text-red-600 cursor-pointer font-bold "
              onClick={() => handleLocalClear()}
            >
              Clear
            </p>
          </div>
        </div>
      )}

      {/* Loading Indicator */}
      

      <div
        className={`mx-auto ${step == 4 ? 'w-full' : 'max-w-2xl'} mt-5 mb-3 bg-white shadow-lg rounded-lg p-4`}
      >
        {/* Header with Actions */}
        <div className="flex justify-between">
          <div className="text-left">
            {/* Step Navigation */}
            {step === 4 && (
              <div className="flex justify-between mb-8">
                <div className="space-x-4 mx-2 flex">
                  <p className="text-sm font-bold text-gray-500 mt-2">
                    <i className="fa fa-list" />
                  </p>
                  <button
                    disabled={step === 1}
                    onClick={prevStep}
                    className={`${
                      step === 1
                        ? 'bg-gray-300 text-gray-500 text-xs font-bold py-2 px-4 rounded-lg cursor-not-allowed'
                        : 'bg-red-500 text-xs text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600'
                    }`}
                  >
                    Previous
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="text-right">
            {isMobile ? <button
              onClick={()=>{
                setSaveModal(true);
              }}
              className={`mb-2 bg-red-500 text-xs text-white font-bold py-2 px-4 rounded-lg mr-2
                hover:bg-red-600'
              `}
            >
<i class="fa fa-save"></i>            </button> : <button
              // onClick={()=>{
              //   generatePDF();
              // }}
              className={`mb-2 bg-red-500 text-xs text-white font-bold py-2 px-4 rounded-lg mr-2
                hover:bg-red-600'
              `}
            >
<i class="fa fa-download"></i>            </button>}

            <button
  onClick={() => setShowPrintModal(true)}
  className={`mb-2 bg-red-500 text-xs text-white font-bold py-2 px-4 rounded-lg mr-2 ${
    products.length === 0 ? 'opacity-70 cursor-not-allowed' : 'hover:bg-red-600'
  }`}
  disabled={products.length === 0 || !userInfo.isAdmin}
>
  <i className="fa fa-print" aria-hidden="true" />
</button>



            <button
              onClick={() => {
                setShowSummaryModal(true);
              }}
              className={`mb-2 bg-red-500 text-xs text-white font-bold py-2 px-4 rounded-lg ${
                products.length === 0 ? 'opacity-70 cursor-not-allowed' : 'hover:bg-red-600'
              }`}
              disabled={products.length === 0}
            >
              Review & Submit
            </button>
            <p className="text-xs text-gray-400">
              Fill all fields before submission
            </p>
          </div>
        </div>

        {/* Step 1: Customer Information */}
        {step === 1 && (
          <div className="mb-6 mt-5">
            <div className="flex justify-between">
              <h2 className="text-sm text-gray-500 font-bold mb-4">
                Customer Information
              </h2>
              <p className="italic text-xs text-gray-500">
                Last Billed: {lastBillId ? lastBillId : 'No Billings'}
              </p>
            </div>
            <div className="mb-4">
              <label className="block text-xs text-gray-700">Invoice No</label>
              <input
                type="text"
                ref={invoiceNoRef}
                value={invoiceNo}
                onChange={(e) => setInvoiceNo(e.target.value)}
                onKeyDown={(e) => changeRef(e, customerNameRef)}
                className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                placeholder="Enter Invoice No"
                readOnly={!userInfo.isSuper}
              />
            </div>
            <div className="mb-4">
              <label className="block text-xs text-gray-700">Customer Name</label>
              <div className='flex gap-2'>
              <input
                type="text"
                ref={customerNameRef}
                value={customerName}
                autoComplete="off"
                onChange={handleCustomerNameChange}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setCustomerSuggesstionIndex((prevIndex) =>
                      prevIndex < customerSuggestions.length - 1
                        ? prevIndex + 1
                        : prevIndex
                    );
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setCustomerSuggesstionIndex((prevIndex) =>
                      prevIndex > 0 ? prevIndex - 1 : prevIndex
                    );
                  } else if (e.key === 'Enter') {
                    if (
                      customerSuggesstionIndex >= 0 &&
                      customerSuggesstionIndex < customerSuggestions.length
                    ) {
                      e.preventDefault();
                      const selectedCustomer =
                        customerSuggestions[customerSuggesstionIndex];
                      setCustomerName(selectedCustomer.customerName);
                      setCustomerContactNumber(selectedCustomer.customerContactNumber);
                      setCustomerAddress(selectedCustomer.customerAddress);
                      setCustomerId(selectedCustomer.customerId);
                      customerAddressRef.current?.focus();
                      setCustomerSuggesstionIndex(-1);
                      setCustomerSuggestions([]);
                    } else {
                      if (!customerId) {
                        generatecustomerid();
                      }
                      customerContactNumberRef.current?.focus();
                    }
                  }
                }}
                className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                placeholder="Enter Customer Name"
              />
              </div>
              {customerSuggestions.length > 0 && (
                <div className="mt-2 bg-white border rounded-md max-h-60 divide-y overflow-y-auto">
                  {customerSuggestions.map((customer, index) => (
                    <div
                      key={index}
                      onClick={() => {
                        setCustomerName(customer.customerName);
                        setCustomerContactNumber(customer.customerContactNumber);
                        setCustomerAddress(customer.customerAddress);
                        setCustomerId(customer.customerId);
                        customerAddressRef.current?.focus();
                        setCustomerSuggesstionIndex(-1);
                        setCustomerSuggestions([]);
                      }}
                      className={`p-4 text-xs cursor-pointer hover:bg-gray-100 ${
                        index === customerSuggesstionIndex ? 'bg-gray-200' : ''
                      }`}
                    >
                      {customer.customerName}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="mb-4">
              <label className="block text-xs text-gray-700">
                Customer Contact Number
              </label>
              <input
                type="number"
                placeholder="Enter Customer Number"
                ref={customerContactNumberRef}
                value={customerContactNumber}
                onKeyDown={(e) => changeRef(e, customerAddressRef)}
                autoComplete="off"
                onChange={(e) => setCustomerContactNumber(e.target.value)}
                className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
              />
            </div>
            <div className="mb-4">
              <label className="block text-xs text-gray-700">Customer Address</label>
              <textarea
                value={customerAddress}
                ref={customerAddressRef}
                onChange={(e) => setCustomerAddress(e.target.value)}
                onKeyDown={(e) => {
                  changeRef(e, salesmanNameRef);
                }}
                className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                placeholder="Enter Customer Address"
              />
            </div>
            <div className="mb-4">
              <label className="block text-xs text-gray-700">Customer ID</label>
              <input
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                onKeyDown={(e) => {
                  changeRef(e, salesmanNameRef);
                }}
                className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                placeholder="Enter Customer ID"
              />
            </div>
          </div>
        )}

        {/* Step 2: Salesman Information */}
        {step === 2 && (
          <div className="mb-4 mt-5">
            <label className="block text-gray-700 text-xs">Salesman Name</label>
            <select
              value={salesmanName}
              ref={salesmanNameRef}
              onChange={handleSalesmanChange}
              onKeyDown={(e) => changeRef(e, invoiceDateRef)}
              className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
            >
              <option value="">Select Salesman</option>
              {salesmen.map((salesman) => (
                <option key={salesman._id} value={salesman.name}>
                  {salesman.name}
                </option>
              ))}
            </select>

            {salesmanName && (
              <div className="mt-4">
                <label className="block text-gray-700 text-xs">
                  Salesman Phone Number
                </label>
                <input
                  type="text"
                  value={salesmanPhoneNumber}
                  onChange={(e) => setSalesmanPhoneNumber(e.target.value)}
                  className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                  placeholder="Salesman Phone Number"
                />
              </div>
            )}
          </div>
        )}

        {/* Step 3: Payment and Delivery Information */}
        {step === 3 && (
          <div className="mb-6 mt-5">
            <h2 className="text-md text-gray-500 font-bold mb-4">
              Delivery Information
            </h2>

            <div className="mb-4">
              <label className="block text-xs text-gray-700">Invoice Date</label>
              <input
                type="date"
                ref={invoiceDateRef}
                value={invoiceDate}
                onKeyDown={(e) => changeRef(e, expectedDeliveryDateRef)}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
              />
            </div>

            <div className="mb-4">
              <label className="block text-xs text-gray-700">
                Expected Delivery Date
              </label>
              <input
                type="datetime-local"
                ref={expectedDeliveryDateRef}
                value={expectedDeliveryDate}
                onKeyDown={(e) => changeRef(e, marketedByRef)}
                onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
              />
            </div>

            <div className="mb-4">
              <label className="block text-xs text-gray-700">Marketed By:</label>
              <input
                ref={marketedByRef}
                value={marketedBy}
                onChange={(e) => setMarketedBy(e.target.value)}
                onKeyDown={(e) => changeRef(e, deliveryStatusRef)}
                className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                placeholder="Marketed by"
              />
            </div>

            <div className="mb-4">
              <label className="block text-xs text-gray-700">Delivery Status</label>
              <select
                value={deliveryStatus}
                ref={deliveryStatusRef}
                onKeyDown={(e) => changeRef(e, showroomRef)}
                onChange={(e) => setDeliveryStatus(e.target.value)}
                className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
              >
                <option value="Pending">Pending</option>
                <option value="Delivered">Delivered</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-xs text-gray-700">Showroom</label>
              <select
                value={showroom}
                ref={showroomRef}
                onKeyDown={(e) => changeRef(e, itemIdRef)}
                onChange={(e) => setshowRoom(e.target.value)}
                className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
              >
                <option value="moncompu">Moncompu - Main Office</option>
                <option value="chenganasherry">Chenganasherry - Branch</option>
              </select>
            </div>
          </div>
        )}

        {/* Step 4: Add Products */}
        {step === 4 && (
          <div>
          <div>
            <div className="flex flex-col">
              {/* Desktop Layout */}
              <div className="hidden md:flex flex-col flex-1">
                {/* Top Section: Total and Added Products */}
                <div className="flex flex-col flex-1 overflow-y-auto p-4">
                  {products.length > 0 && ''}

                  {/* Added Products Table */}
                  {products.length > 0 && (
                    <div className="mt-4">
                      <h2 className="text-xs font-semibold mb-2">
                        Added Products: {products.length}
                      </h2>

                      {/* Filter Input */}
                      <div className="mb-2 flex items-center">
                        <input
                          type="text"
                          placeholder="Search added products..."
                          value={filterText}
                          onChange={(e) => setFilterText(e.target.value)}
                          className="w-full border border-gray-300 px-2 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                        />
                        <i className="fa fa-search bg-red-500 p-2 text-white rounded-lg ml-2 items-center" />
                      </div>

                      <div className="overflow-x-auto rounded-md">
                      <table className="table-auto w-full border-collapse rounded-xl shadow-md">
                          <thead>
                            <tr className="bg-red-500 text-white text-xs">
                              <th className="px-2 py-2 text-left">
                                <i className="fa fa-cube" aria-hidden="true"></i>{' '}
                                Name
                              </th>
                              <th className="px-2 py-2 text-center">Remark</th>
                              <th className="px-2 py-2 text-center">Quantity</th>
                              <th className="px-2 py-2 text-left">Unit</th>
                              <th className="px-2 py-2 text-center">
                                Selling Price
                              </th>
                              <th className="px-2 py-2 text-center">
                                Qty (per Nos)
                              </th>
                              <th className="px-2 py-2 text-center">
                                Rate
                              </th>
                              {/* NEW columns: GST% and GST Amt */}
                              <th className="px-2 py-2 text-center">GST %</th>
                              <th className="px-2 py-2 text-center">GST Amt</th>
                              <th className="px-2 py-2 text-center">Discount</th>
                              <th className="px-2 py-2 text-left">Net Total</th>
                              <th className="px-2 py-2 text-center">
                                <i className="fa fa-trash" aria-hidden="true"></i>
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-x">
                            {products
                              .filter(
                                (p) =>
                                  p.name
                                    .toLowerCase()
                                    .includes(filterText.toLowerCase()) ||
                                  p.item_id
                                    .toLowerCase()
                                    .includes(filterText.toLowerCase())
                              )
                              .map((product, index) => {
          // UPDATED item row calculation:
const qty = parseFloat(product.quantity) || 0;
const priceInQty = parseFloat(product.sellingPriceinQty) || 0;
const gstRate = parseFloat(product.gstRate) || 0;

// Base
const itemBase = qty * priceInQty;

// This row's discount portion: "itemBase / sumOfBase * discount"
let sumOfBase = 0;
products.forEach((p) => {
  sumOfBase += (parseFloat(p.quantity) || 0) * (parseFloat(p.sellingPriceinQty) || 0);
});
const discountRatio = sumOfBase > 0 ? (parseFloat(discount) || 0) / sumOfBase : 0;
const itemDiscount = itemBase * discountRatio;

const rateWithoutGST = (itemBase - itemDiscount) / (1 + gstRate / 100);
// After discount
const netBase = itemBase - itemDiscount;

// GST on discounted base
const gstAmount = rateWithoutGST * (1 + gstRate / 100) - rateWithoutGST;

// Final net per item
const netTotal = rateWithoutGST + gstAmount;


                                return (
                                  <tr
                                    key={index}
                                    className={`divide-x ${
                                      index % 2 === 0 ? 'bg-gray-100' : 'bg-white'
                                    } border-b hover:bg-red-50 transition duration-150`}
                                  >
                                    <td className="px-4 py-4 text-xs font-medium">
                                      {product.name} - {product.item_id}
                                    </td>
                                    
                                    <td className="px-2 py-2 text-center text-xs">
                                      <input
                                        type="text"
                                        value={product.itemRemark}
                                        onChange={(e) =>
                                          handleEditProduct(
                                            index,
                                            'itemRemark',
                                            e.target.value
                                          )
                                        }
                                        className="w-16 text-center px-2 py-1 border rounded-md"
                                      />
                                    </td>

                                    <td className="px-2 py-2 text-center text-xs">
                                      <input
                                        type="number"
                                        min={1}
                                        value={product.enteredQty}
                                        onChange={(e) =>
                                          handleEditProduct(
                                            index,
                                            'enteredQty',
                                            e.target.value
                                          )
                                        }
                                        className="w-16 text-center px-2 py-1 border rounded-md"
                                      />
                                    </td>
                                    <td className="px-2 py-2 text-xs">
                                      {product.unit}
                                    </td>
                                    <td className="px-2 py-2 text-xs text-center">
                                      <input
                                        type="number"
                                        min={0}
                                        value={product.sellingPrice}
                                        onChange={(e) =>
                                          handleEditProduct(
                                            index,
                                            'sellingPrice',
                                            e.target.value
                                          )
                                        }
                                        className="w-16 text-center px-2 py-1 border rounded-md"
                                      />
                                      <p className="text-center mt-2">
                                        {product.unit === 'NOS'
                                          ? '(NOS)'
                                          : '(SQFT)'}
                                      </p>
                                    </td>
                                    <td className="px-2 py-2 text-center text-xs">
                                      {product.quantity.toFixed(2)}
                                    </td>
                                    <td className="px-2 py-2 text-xs">
                                      ₹{parseFloat(rateWithoutGST).toFixed(2)}
                                    </td>
                                    {/* GST% */}
                                    <td className="px-2 py-2 text-xs text-center">
                                      <input
                                        type="number"
                                        min={0}
                                        value={product.gstRate}
                                        onChange={(e) =>
                                          handleEditProduct(
                                            index,
                                            'gstRate',
                                            e.target.value
                                          )
                                        }
                                        className="w-16 text-center px-2 py-1 border rounded-md"
                                      />
                                    </td>
                                    {/* GST Amt */}

                                    {/* Base Total */}
                                    {/* <td className="px-2 py-2 text-xs">
                                      ₹{baseTotal.toFixed(2)}
                                    </td> */}
<td> ₹{gstAmount.toFixed(2)}</td>
              <td> ₹{itemDiscount.toFixed(2)}</td>
<td>₹{netTotal.toFixed(2)}</td>
                                    <td className="px-3 py-2 text-xs text-center">
                                      <button
                                        onClick={() => {
                                          if (
                                            window.confirm(
                                              `Are you sure you want to delete ${product.name} from the bill?`
                                            )
                                          )
                                            deleteProduct(index);
                                        }}
                                        className="text-red-500 font-bold hover:text-red-700"
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
                    </div>
                  )}
                </div>

                {/* Bottom Fixed Section: Item Inputs */}
                <div
                style={{
                  width: '96%'
                }}
  className="fixed bottom-0 left-0 bg-white px-4 pt-4 pb-4 border-t shadow-inner"
>              <div className="flex justify-between">
                    <div className="w-4/5">
                      <div className="grid grid-cols-4 gap-2">
                        {/* Item ID Input */}
                        <div className="flex flex-col">
                          <label className="block text-gray-700 text-xs mb-1">
                            Item ID
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
                                  addProductByItemId(selected);
                                  setItemId(selected.item_id);
                                  setItemName(selected.name);
                                  setItemCategory(selected.category);
                                  setItemBrand(selected.brand);
                                  setSuggestions([]);
                                  setShowSuggestionsSidebar(false);
                                  itemNameRef.current?.focus();
                                } else {
                                  handleDoubleClick(e);
                                  itemNameRef.current?.focus();
                                }
                              }
                            }}                            
                            className="w-full border border-gray-300 px-2 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                            placeholder="Enter Item ID or Name"
                          />
                          {error && (
                            <p className="text-red-500 truncate text-xs">{error}</p>
                          )}
                        </div>

                        {/* Item Name Input */}
                        <div className="flex flex-col">
                          <label className="block text-gray-700 text-xs mb-1">
                            Item Name
                          </label>
                          <input
                            type="text"
                            value={itemName}
                            ref={itemNameRef}
                            onChange={(e) => setItemName(e.target.value)}
                            onKeyDown={(e) => changeRef(e, itemCategoryRef)}
                            className="w-full border border-gray-300 px-2 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                            placeholder="Item Name"
                            disabled={!selectedProduct}
                          />
                        </div>

                        {/* Item Category Input */}
                        <div className="flex flex-col">
                          <label className="block text-gray-700 text-xs mb-1">
                            Category
                          </label>
                          <input
                            type="text"
                            ref={itemCategoryRef}
                            value={itemCategory}
                            onChange={(e) => setItemCategory(e.target.value)}
                            onKeyDown={(e) => changeRef(e, itemBrandRef)}
                            className="w-full border border-gray-300 px-2 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                            placeholder="Item Category"
                            disabled={!selectedProduct}
                          />
                        </div>

                        {/* Item Brand Input */}
                        <div className="flex flex-col">
                          <label className="block text-gray-700 text-xs mb-1">
                            Brand
                          </label>
                          <input
                            type="text"
                            value={itemBrand}
                            ref={itemBrandRef}
                            onChange={(e) => setItemBrand(e.target.value)}
                            onKeyDown={(e) => changeRef(e, itemUnitRef)}
                            className="w-full border border-gray-300 px-2 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                            placeholder="Item Brand"
                            disabled={!selectedProduct}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-7 gap-2 mt-2">
                        {/* Unit */}
                        <div className="flex flex-col">
                          <label className="block text-gray-700 text-xs mb-1">
                            Unit
                          </label>
                          <select
                            ref={itemUnitRef}
                            value={unit}
                            onChange={(e) => setUnit(e.target.value)}
                            onKeyDown={(e) => changeRef(e, itemQuantityRef)}
                            className="w-full border border-gray-300 px-2 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                          >
                            <option value="SQFT">SQFT</option>
                            <option value="GSQFT">Granite SQFT</option>
                            <option value="BOX">BOX</option>
                            <option value="NOS">NOS</option>
                            <option value="TNOS">Tiles NOS</option>
                          </select>
                        </div>

                        {/* Quantity */}
                        <div className="flex flex-col">
                          <label className="block text-gray-700 text-xs mb-1">
                            Quantity
                          </label>
                          <input
                            type="number"
                            ref={itemQuantityRef}
                            value={quantity}
                            onChange={(e) =>
                              setQuantity(
                                parseFloat(e.target.value)
                              )
                            }
                            onKeyDown={(e) => changeRef(e, sellingPriceRef)}
                            className="w-full border border-gray-300 px-2 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                          />
                        </div>

                        {/* Default display price */}
                        <div className="mb-2">
                          <label className="block text-xs mb-1 text-gray-700">
                            Selling Price
                          </label>
                          <input
                            type="number"
                            value={displaysellingPrice}
                            className="w-full border border-gray-300 px-2 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                            placeholder="No Selling Price"
                            readOnly
                          />
                        </div>

                        {/* Selling Price */}
                        <div className="flex flex-col">
                          <label className="block text-gray-700 text-xs mb-1">
                            Cus. S Price
                          </label>
                          <input
                            type="number"
                            ref={sellingPriceRef}
                            value={sellingPrice}
                            onChange={(e) => setSellingPrice(e.target.value)}
                            onKeyDown={(e) => changeRef(e, gstRateRef)}
                            className="w-full border border-gray-300 px-2 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                            placeholder="Enter Selling Price"
                          />
                        </div>

                        {/* GST% input (new) */}
                        <div className="flex flex-col">
                          <label className="block text-gray-700 text-xs mb-1">
                            GST (%)
                          </label>
                          <input
                            type="number"
                            min={0}
                            ref={gstRateRef}
                            value={gstRateInput}
                            onChange={(e) => setGstRateInput(e.target.value)}
                            onKeyDown={(e) => changeRef(e, itemRemarkRef)}
                            className="w-full border border-gray-300 px-2 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                            placeholder="e.g., 18"
                          />
                        </div>

                        <div className="flex flex-col">
                          <label className="block text-gray-700 text-xs mb-1">
                            Item Remark
                          </label>
                          <input
                            type="text"
                            ref={itemRemarkRef}
                            value={itemRemark}
                            onChange={(e) => setItemRemark(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleAddProductWithQuantity();
                              }
                            }}
                            className="w-full border border-gray-300 px-2 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                            placeholder="remark"
                          />
                        </div>

                        {/* Stock Status */}
                        <div
                          className={`flex flex-col items-center justify-center bg-gray-50 p-2 rounded-md ${
                            selectedProduct && fetchQuantity > 10
                              ? 'text-green-600'
                              : selectedProduct && fetchQuantity > 0
                              ? 'text-yellow-600'
                              : 'text-red-600'
                          }`}
                        >
                          <p className="text-xs font-bold">Stock:</p>
                          <p className="text-xs font-bold">
                            {selectedProduct ? fetchQuantity : '0'} {unit}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="text-center md:hidden lg:block bg-gray-100 ml-2 items-center text-center rounded-lg p-4 h-full shadow-inner">
                      <div className="mb-2 mt-2">
                        <p className="text-xs font-bold">Added Products</p>
                        <p className="text-xs font-bold">{products?.length}</p>
                      </div>

                      <div>
                        <button
                          className="bg-red-500 text-xs text-white font-bold py-1 px-3 rounded focus:outline-none hover:bg-red-600"
                          onClick={handleAddProductWithQuantity}
                        >
                          Add Item
                        </button>
                        <button
                          onClick={() => {
                            setOutofstockProduct(selectedProduct);
                            setQuantity(0);
                            setItemId('');
                            setItemName('');
                            setItemCategory('');
                            setItemBrand('');
                            setSuggestions([]);
                            setShowOutOfStockModal(true);
                            outofStockRef.current?.focus();
                          }}
                          className="text-xs text-gray-500 font-bold hover:text-gray-700"
                        >
                          Stock / Need Purchase
                        </button>
                      </div>
                    </div>

                    {/* Total Amount Display */}
                    <div className="bg-gray-100 ml-2 w-60 items-center text-center rounded-lg shadow-inner p-4">
  <div className="mt-2 text-xs font-bold text-gray-700">
    <p>Sub Total: {parseFloat(amountWithoutGST).toFixed(2)}</p>
  </div>
  <div className="mt-2 text-xs font-bold text-gray-700">
    <p>GST: {parseFloat(gstAmount).toFixed(2)}</p>
  </div>
  <div className="mt-2 text-xs font-bold text-gray-700">
    <p>Discount: {parseFloat(discount || 0).toFixed(2)}</p>
  </div>
  <div className="mt-2  text-lg font-bold text-gray-700">
    <p>Bill Amount: {parseFloat(grandTotal).toFixed(2)}</p>
  </div>
</div>

                  </div>
                </div>
              </div>

              {/* Mobile Layout */}
              <div className="md:hidden flex flex-col flex-1 p-4">
                {products.length > 0 && (
                  <div className="mb-4 bg-gray-100 flex justify-between items-center text-center rounded-lg p-4 shadow-sm">
                    <div className="text-gray-600">
                      <p className="text-xs font-bold">Total Bill Amount:</p>
                      <p className="text-xs font-bold">
                        INR {parseFloat(grandTotal).toFixed(2)}
                      </p>
                    </div>
                    <div className="text-gray-600">
                      <p className="text-xs font-bold">Discount:</p>
                      <p className="text-xs font-bold">
                        INR {parseFloat(discount || 0)?.toFixed(2)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Item ID Input */}
                <div className="mb-4 border-t pt-4">
                  <label className="block text-gray-700 text-xs mb-1">Item ID</label>
                  <input
                    type="text"
                    ref={itemIdMobileRef}
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
                          addProductByItemId(suggestions[selectedSuggestionIndex]);
                          setItemName(suggestions[selectedSuggestionIndex].name);
                          setItemCategory(suggestions[selectedSuggestionIndex].category);
                          setItemBrand(suggestions[selectedSuggestionIndex].brand);
                        }
                      }
                    }}
                    className="w-full border border-gray-300 px-2 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                    placeholder="Enter Item ID or Name"
                  />
                  {error && <p className="text-red-500 mt-1 text-xs">{error}</p>}
                  {suggestions.length > 0 && (
                    <div className="mt-2 bg-white border rounded-md max-h-60 divide-y overflow-y-auto">
                      {suggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          onClick={() => {
                            addProductByItemId(suggestion);
                          }}
                          className={`p-4 text-xs font-bold text-gray-600 cursor-pointer hover:bg-gray-100 ${
                            index === selectedSuggestionIndex ? 'bg-gray-200' : ''
                          }`}
                        >
                          {suggestion.name} - {suggestion.item_id}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {selectedProduct && (
                  <div className="p-4 border border-gray-200 rounded-lg shadow-md bg-white mb-4">
                        <div className='ml-3 flex  mb-2 justify-between align-center'>
                        <p
                        className={`text-xs font-bold align-center flex justify-center px-2 py-1 rounded ${
                          fetchQuantity > 10
                            ? 'bg-green-300 text-green-700'
                            : fetchQuantity > 0
                            ? 'bg-yellow-300 text-yellow-700'
                            : 'bg-red-300 text-red-700'
                        }`}
                      >
                        {fetchQuantity > 10
                          ? 'In Stock'
                          : fetchQuantity > 0
                          ? 'Low Stock'
                          : 'Out of Stock'}
                      </p>
                      <button className="bg-red-500 rounded-md p-1 px-2 text-white font-bold" onClick={()=>{
                        setItemId('');
                        setSelectedProduct(null);
                      }}>   
                                                     <i className="fa fa-trash" aria-hidden="true"></i>
                      </button>
                      </div>
                    <div className="flex mt-2 justify-between items-center">
                        <p className="text-xs font-bold truncate">
                        {selectedProduct.name.slice(0, 25)}... ID: {selectedProduct.item_id}
                      </p>
    
                    </div>

                    <p
                      className={`text-xs font-bold text-gray-500 mb-2 ${
                        fetchQuantity > 10
                          ? 'text-green-700'
                          : fetchQuantity > 0
                          ? 'text-yellow-700'
                          : 'text-red-700'
                      }`}
                    >
                      In stock: {fetchQuantity || 'error'} {unit}
                    </p>
                    <div className="mb-2">
                      <label className="block text-xs mb-1 text-gray-700">Quantity</label>
                      <div className="flex">
                        <input
                          type="number"
                          ref={itemQuantityMobileRef}
                          value={quantity}
                          onChange={(e) =>
                            setQuantity(
                              parseFloat(e.target.value)
                            )
                          }
                          onKeyDown={(e) => changeRef(e, sellingPriceMobileRef)}
                          className="w-full border border-gray-300 px-2 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                        />
                        <select
                          value={unit}
                          onChange={(e) => setUnit(e.target.value)}
                          className="w-full ml-2 border border-gray-300 px-2 py-1 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                        >
                          <option value="SQFT">SQFT</option>
                          <option value="GSQFT">Granite SQFT</option>
                          <option value="BOX">BOX</option>
                          <option value="NOS">NOS</option>
                          <option value="TNOS">Tiles NOS</option>
                        </select>
                      </div>
                    </div>
                    <div className="mb-2">
                      <label className="block text-xs mb-1 text-gray-700">
                        Selling Price
                      </label>
                      <input
                        type="number"
                        value={displaysellingPrice}
                        className="w-full border border-gray-300 px-2 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                        placeholder="No Selling Price"
                        readOnly
                      />
                    </div>
                    <div className="mb-2">
                      <label className="block text-xs mb-1 text-gray-700">
                        Cus. Selling Price
                      </label>
                      <input
                        type="number"
                        ref={sellingPriceMobileRef}
                        value={sellingPrice}
                        onChange={(e) => setSellingPrice(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleAddProductWithQuantity();
                          }
                        }}
                        className="w-full border border-gray-300 px-2 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                        placeholder="Enter Selling Price"
                      />
                    </div>
                    {/* GST% Input (Mobile) */}
                    <div className="mb-2">
                      <label className="block text-xs mb-1 text-gray-700">
                        GST (%)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={gstRateInput}
                        onChange={(e) => setGstRateInput(e.target.value)}
                        className="w-full border border-gray-300 px-2 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                      />
                    </div>

                    <div className="mt-2 mb-2 text-xs font-bold text-gray-700">
                          <label className="block">
                            Item Remark
                          </label>
                          <input
                            type="text"
                            ref={mobileitemRemarkRef}
                            value={itemRemark}
                            onChange={(e) => setItemRemark(e.target.value)}
                            className="w-full border border-gray-300 px-2 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                            placeholder="remark"
                          />
                        </div>

                    <button
                      className="bg-red-500 text-xs w-full text-white font-bold py-2 px-4 rounded focus:outline-none hover:bg-red-600"
                      onClick={handleAddProductWithQuantity}
                    >
                      Add Item
                    </button>
                    <p
                      onClick={() => {
                        if (selectedProduct) {
                          setOutofstockProduct(selectedProduct);
                          setQuantity(0);
                          setItemId('');
                          setItemName('');
                          setItemCategory('');
                          setItemBrand('');
                          setSuggestions([]);
                          setShowOutOfStockModal(true);
                          outofStockRef.current?.focus();
                        } else {
                          setError('No product selected');
                        }
                      }}
                      className="text-xs cursor-pointer text-gray-500 text-center font-bold my-2"
                    >
                      Stock / Need Purchase
                    </p>
                  </div>
                )}

                {/* Added Products List */}
                {products.length > 0 && (
                  <div className="mt-4">
                    <h2 className="text-xs border-t text-gray-600 pt-4 font-bold mb-2">
                      Added Products: {products.length}
                    </h2>
                    <div className="mb-2 flex items-center">
                      <input
                        type="text"
                        placeholder="Filter by product name or ID"
                        value={filterText}
                        onChange={(e) => setFilterText(e.target.value)}
                        className="w-full border border-gray-300 px-2 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                      />
                      <i className="fa fa-search bg-red-500 p-2 text-white rounded-lg ml-2 items-center" />
                    </div>
                    {products
                      .filter(
                        (product) =>
                          product.name.toLowerCase().includes(filterText.toLowerCase()) ||
                          product.item_id.toLowerCase().includes(filterText.toLowerCase())
                      )
                      .map((product, index) => {
                        // Compute base total / GST for mobile
                        const qty = parseFloat(product.quantity) || 0;
                        const priceInQty = parseFloat(product.sellingPriceinQty) || 0;
                        const gstRate = parseFloat(product.gstRate) || 0;
                        
                        // Base
                        const itemBase = qty * priceInQty;
                        
                        // This row's discount portion: "itemBase / sumOfBase * discount"
                        let sumOfBase = 0;
                        products.forEach((p) => {
                          sumOfBase += (parseFloat(p.quantity) || 0) * (parseFloat(p.sellingPriceinQty) || 0);
                        });
                        const discountRatio = sumOfBase > 0 ? (parseFloat(discount) || 0) / sumOfBase : 0;
                        const itemDiscount = itemBase * discountRatio;
                        
const rateWithoutGST = (itemBase - itemDiscount) / (1 + gstRate / 100);                        
                        // After discount
                        const baseTotal = rateWithoutGST;
                        
                        // GST on discounted base
                        const gstAmount = rateWithoutGST * (1 + gstRate / 100) - rateWithoutGST;
                        
                        // Final net per item
                        const netTotal = rateWithoutGST + gstAmount;

                        return (
                          <div
                            key={index}
                            className="mb-2 bg-white border border-gray-200 rounded-lg shadow-sm"
                          >
                            <div className="flex justify-between bg-red-500 p-2 items-center rounded-t-md">
                              <p className="text-xs text-white font-bold truncate">
                                {product.name.slice(0, 20)}... - {product.item_id}
                              </p>
                              <button
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      `Are you sure you want to delete ${product.name} from the bill?`
                                    )
                                  )
                                    deleteProduct(index);
                                }}
                                className="text-white text-xs font-bold hover:text-white"
                              >
                                <i className="fa fa-trash" aria-hidden="true"></i>
                              </button>
                            </div>
                            <div className="p-2">
                              <div className="grid grid-cols-2 gap-2 text-xs font-bold text-gray-700">
                                <div>
                                  <label className="block mb-1">
                                    Quantity ({product.unit})
                                  </label>
                                  <input
                                    type="number"
                                    value={product.enteredQty}
                                    onChange={(e) =>
                                      handleEditProduct(
                                        index,
                                        'enteredQty',
                                        e.target.value
                                      )
                                    }
                                    className="w-full border border-gray-300 px-2 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="block mb-1">
                                    Rate{' '}
                                    {product.unit === 'NOS' ? '(NOS)' : '(SQFT)'}
                                  </label>
                                  <input
                                    type="number"
                                    value={product.sellingPrice}
                                    onChange={(e) =>
                                      handleEditProduct(
                                        index,
                                        'sellingPrice',
                                        e.target.value
                                      )
                                    }
                                    className="w-full border border-gray-300 px-2 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                                  />
                                </div>
                              </div>

                                  <div className="flex mb-2 mt-2 justify-between items-center">
                                  <span className="text-xs font-semibold">
                                    Quantity in ( Nos ):
                                  </span>
<p className={`text-xs font-bold ${Number.isInteger(product.quantity) ? 'text-green-500' : 'text-red-500'}`}>
                                    {product.quantity} NOS
                                  </p>
                                </div>

                              <div className="mt-2 grid grid-cols-2 gap-2 text-xs font-bold text-gray-700">
                                {/* GST% and GST Amt for Mobile */}
                                <div>
                                  <label className="block mb-1">GST %</label>
                                  <input
                                    type="number"
                                    min={0}
                                    value={product.gstRate}
                                    onChange={(e) =>
                                      handleEditProduct(
                                        index,
                                        'gstRate',
                                        e.target.value
                                      )
                                    }
                                    className="w-full border border-gray-300 px-2 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="block mb-1">GST Amt</label>
                                  <input
                                    type="text"
                                    readOnly
                                    value={gstAmount.toFixed(2)}
                                    className="w-full border border-gray-300 px-2 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs bg-gray-50"
                                  />
                                </div>
                              </div>

                              <div className="mt-2 mb-2 text-xs font-bold text-gray-700">
                          <label className="block">
                            Item Remark
                          </label>
                          <input
                            type="text"
                            ref={mobileitemRemarkRef}
                            value={product.itemRemark}
                            onChange={(e) =>
                              handleEditProduct(
                                index,
                                'itemRemark',
                                e.target.value
                              )
                            }                            className="w-full border border-gray-300 px-2 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                            placeholder="remark"
                          />
                        </div>

                              <div
                                onClick={() =>
                                  navigate(
                                    `${
                                      product.image.length > 8
                                        ? `/${product.image}`
                                        : '#'
                                    }`
                                  )
                                }
                                className="items-center cursor-pointer flex justify-between px-4 py-3"
                              >
                                <div>
                                  <img
                                    className={`object-cover flex justify-center items-center w-40 h-20 bg-gray-200 rounded-md ${
                                      imageError ? 'hidden' : ''
                                    }`}
                                    src={product.image}
                                    onError={() => setImageError(true)}
                                  />
                                  {imageError && (
                                    <div className="flex justify-center items-center w-40 h-20 bg-gray-200 rounded-md">
                                      <p className="text-gray-500 text-sm">
                                        No image
                                      </p>
                                    </div>
                                  )}
                                </div>
                                <div className="text-xs space-y-2 px-5 truncate">
                                  <p>{product.item_id}</p>
                                  <p>{product.name}</p>
                                  <p className={`font-bold ${product.countInStock > 0 ? 'text-green-500' : 'text-red-500' }`}>
                                    In Stock: {product.countInStock} NOS
                                  </p>
                                </div>
                              </div>

                              {/* Summaries per product (base total & net total) */}
                              <div className="px-4 py-2 text-xs text-gray-700">
                                <p>Base Total: ₹{baseTotal.toFixed(2)}</p>
                                <p>Net Total (with GST): ₹{netTotal.toFixed(2)}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>
          </div>
                <div className='mb-60'></div>
          </div>
        )}

        {/* Step Navigation */}
        {step !== 4 && (
          <div className="flex justify-right mb-8">
            <div className="space-x-4 text-right">
              <button
                disabled={step === 1}
                onClick={prevStep}
                className={`${
                  step === 1
                    ? 'bg-gray-300 text-gray-500 text-xs font-bold py-2 px-4 rounded-lg cursor-not-allowed'
                    : 'bg-red-500 text-xs text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600'
                }`}
              >
                Previous
              </button>
              <button
                disabled={step === 4 && products.length === 0}
                onClick={nextStep}
                className={`${
                  step === 4 && products.length === 0
                    ? 'bg-gray-300 text-xs text-gray-500 font-bold py-2 px-4 rounded-lg cursor-not-allowed'
                    : 'bg-red-500 text-xs text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Success Modal */}
      {showSuccessModal && <SuccessModal message="Item added successfully!" />}

      {/* Summary Modal */}
      {showSummaryModal && (
        <SummaryModal
          accounts={accounts}
          customerName={customerName}
          invoiceNo={invoiceNo}
          totalAmount={totalAmount}
          amountWithoutGST={amountWithoutGST}
          salesmanName={salesmanName}
          cgst={cgst}
          sgst={sgst}
          discount={discount}
          setDiscount={setDiscount}
          receivedAmount={receivedAmount}
          setReceivedAmount={setReceivedAmount}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          unloading={unloading}
          setUnloading={setUnloading}
          transportation={transportation}
          setTransportation={setTransportation}
          handling={handlingcharge}
          setHandling={setHandlingCharge}
          remark={remark}
          setRemark={setRemark}
          receivedDate={receivedDate}
          setReceivedDate={setReceivedDate}
          grandTotal={grandTotal}
          discountRef={discountRef}
          paymentMethodRef={paymentMethodRef}
          receivedDateRef={receivedDateRef}
          remarkRef={remarkRef}
          unloadingRef={unloadingRef}
          receivedAmountRef={receivedAmountRef}
          transportationRef={transportationRef}
          handlingRef={handlingChargeRef}
          roundOff={roundOff}
          setRoundOff={setRoundOff}
          roundOffRef={roundOffRef}
          neededToPurchase={neededToPurchase}
          setNeededToPurchase={setNeededToPurchase}
          isApproved={isApproved}
          setIsApproved={setIsApproved}
          changeRef={changeRef}
          onClose={() => setShowSummaryModal(false)}
          onSubmit={handleBillingSubmit}
          isSubmitting={isSubmitting}
          totalProducts={products.length}
          handleLocalSave={handleLocalSave}
          roundOffMode={roundOffMode}
          setroundOffMode={setroundOffMode}
        />
      )}



<Dialog
  open={showPrintModal}
  onClose={() => setShowPrintModal(false)}
  TransitionComponent={Transition}
  // For full screen on small devices, partial width on larger:
  fullScreen={useMediaQuery(useTheme().breakpoints.down('sm'))}
  maxWidth="sm"
  fullWidth
>
  <DialogTitle>Select Print Options</DialogTitle>

  <DialogContent dividers>
    <div className="grid grid-cols-2 gap-2 text-sm text-gray-700 mb-4">


      <FormControlLabel
        control={
          <Checkbox
            checked={printOptions.showItemId}
            onChange={() =>
              setPrintOptions((prev) => ({
                ...prev,
                showItemId: !prev.showItemId
              }))
            }
          />
        }
        label="Item ID"
      />

      <FormControlLabel
        control={
          <Checkbox
            checked={printOptions.showItemName}
            onChange={() =>
              setPrintOptions((prev) => ({
                ...prev,
                showItemName: !prev.showItemName
              }))
            }
          />
        }
        label="Item Name"
      />

      <FormControlLabel
        control={
          <Checkbox
            checked={printOptions.showItemRemark}
            onChange={() =>
              setPrintOptions((prev) => ({
                ...prev,
                showItemRemark: !prev.showItemRemark
              }))
            }
          />
        }
        label="Item Remark"
      />

      <FormControlLabel
        control={
          <Checkbox
            checked={printOptions.showQuantity}
            onChange={() =>
              setPrintOptions((prev) => ({
                ...prev,
                showQuantity: !prev.showQuantity
              }))
            }
          />
        }
        label="Quantity"
      />

      <FormControlLabel
        control={
          <Checkbox
            checked={printOptions.showUnit}
            onChange={() =>
              setPrintOptions((prev) => ({
                ...prev,
                showUnit: !prev.showUnit
              }))
            }
          />
        }
        label="Unit"
      />

      <FormControlLabel
        control={
          <Checkbox
            checked={printOptions.showPrice}
            onChange={() =>
              setPrintOptions((prev) => ({
                ...prev,
                showPrice: !prev.showPrice
              }))
            }
          />
        }
        label="Price"
      />

      <FormControlLabel
        control={
          <Checkbox
            checked={printOptions.showRate}
            onChange={() =>
              setPrintOptions((prev) => ({
                ...prev,
                showRate: !prev.showRate
              }))
            }
          />
        }
        label="Rate"
      />

      <FormControlLabel
        control={
          <Checkbox
            checked={printOptions.showGst}
            onChange={() =>
              setPrintOptions((prev) => ({
                ...prev,
                showGst: !prev.showGst
              }))
            }
          />
        }
        label="GST %"
      />

      <FormControlLabel
        control={
          <Checkbox
            checked={printOptions.showCgst}
            onChange={() =>
              setPrintOptions((prev) => ({
                ...prev,
                showCgst: !prev.showCgst
              }))
            }
          />
        }
        label="CGST"
      />

      <FormControlLabel
        control={
          <Checkbox
            checked={printOptions.showSgst}
            onChange={() =>
              setPrintOptions((prev) => ({
                ...prev,
                showSgst: !prev.showSgst
              }))
            }
          />
        }
        label="SGST"
      />

      <FormControlLabel
        control={
          <Checkbox
            checked={printOptions.showDiscount}
            onChange={() =>
              setPrintOptions((prev) => ({
                ...prev,
                showDiscount: !prev.showDiscount
              }))
            }
          />
        }
        label="Discount"
      />

      <FormControlLabel
        control={
          <Checkbox
            checked={printOptions.showNetAmount}
            onChange={() =>
              setPrintOptions((prev) => ({
                ...prev,
                showNetAmount: !prev.showNetAmount
              }))
            }
          />
        }
        label="Net Amount"
      />

<FormControlLabel
        control={
          <Checkbox
            checked={printOptions.showPaymentDetails}
            onChange={() =>
              setPrintOptions((prev) => ({
                ...prev,
                showPaymentDetails: !prev.showPaymentDetails
              }))
            }
          />
        }
        label="Payment Details"
      />

    </div>
  </DialogContent>

  <DialogActions>
    <Button onClick={() => setShowPrintModal(false)} color="error">
      Close
    </Button>
    <Button
      variant="outlined"
      color="primary"
      onClick={() => {
        setShowPrintModal(false);
        printInvoice(printOptions);
      }}
    >
      Print Invoice
    </Button>
  </DialogActions>
</Dialog>


{showSuggestionsSidebar && suggestions.length > 0 && !isMobile && (
  <ItemSuggestionsSidebar
    open={showSuggestionsSidebar}
    suggestions={suggestions}
    selectedIndex={selectedSuggestionIndex}
    onSelect={(suggestion) => {
      addProductByItemId(suggestion);
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




      {showOutOfStockModal && outofStockProduct && (
        <OutOfStockModal
          product={outofStockProduct}
          onUpdate={handleproductUpdate}
          onClose={() => {
            setOutofstockProduct(null);
            setShowOutOfStockModal(false);
          }}
          stockRef={outofStockRef}
        />
      )}



      <ErrorModal
  open={showErrorModal}
  message={errorMessage}
  onClose={() => setShowErrorModal(false)}
/>



<BottomLoader
      open={isLoading || isSubmitting}
      text={isSubmitting ? 'Saving bill…' : 'Loading…'}
      width="50%"
    />
    </div>
  );
}
