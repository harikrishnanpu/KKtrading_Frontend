// src/screens/EditBillScreen.jsx
import React, { useState, useEffect, useRef, forwardRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SummaryModal from 'components/invoice/SummaryModal';
import OutOfStockModal from 'components/invoice/itemAddingModal';
import api from '../api';
import useAuth from 'hooks/useAuth';
import { useGetMenuMaster } from 'api/menu';
import { openSnackbar } from 'api/snackbar';
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
import BottomLoader from './components/bottomLoader';
import { isMobile } from 'react-device-detect';
import ErrorModal from './components/errorModel';



const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});


export default function EditBillScreen() {
  const navigate = useNavigate();
  const { id } = useParams();

  const { user: userInfo } = useAuth();
  const {menuMaster} = useGetMenuMaster();
  

  // Billing Information States
  const [invoiceNo, setInvoiceNo] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [salesmanName, setSalesmanName] = useState('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [deliveryStatus, setDeliveryStatus] = useState('Pending');
  const [paymentStatus, setPaymentStatus] = useState('Unpaid');
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
    const [roundOff, setRoundOff] = useState(0);
  const [customerId, setCustomerId] = useState('');
  const [showroom, setshowRoom] = useState('');
  const [customerContactNumber, setCustomerContactNumber] = useState('');
  const [marketedBy, setMarketedBy] = useState('');
  const [discount, setDiscount] = useState(0);
  const [receivedAmount, setReceivedAmount] = useState(0);
  const [receivedDate, setReceivedDate] = useState(() => {
    // Default to current local datetime in input's value format (YYYY-MM-DDTHH:MM)
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  });


  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [unloading, setUnloading] = useState(0);
  const [transportation, setTransportation] = useState(0);
  const [handlingCharge, setHandlingCharge] = useState(0);
  const [remark, setRemark] = useState('');
  const [grandTotal, setGrandTotal] = useState(0);

  // Product Information States
  const [itemId, setItemId] = useState('');
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('NOS');
  const [sellingPrice, setSellingPrice] = useState('');
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [filterText, setFilterText] = useState('');
  const [fetchQuantity, setFetchQuantity] = useState(0);
  const [showOutOfStockModal, setShowOutOfStockModal] = useState(false);
  const [ amountReceived , setAmountReceived ] = useState(0);
   const [salesmanPhoneNumber, setSalesmanPhoneNumber] = useState('');
  const [salesmen, setSalesmen] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [itemName, setItemName] = useState('');
  const [itemCategory, setItemCategory] = useState('');
  const [itemBrand, setItemBrand] = useState('');
  const [outofStockProduct, setOutofstockProduct] = useState(null);
  const [displaysellingPrice, setDisplaysellingPrice] = useState('');
  const [fetchItemPrice, setFetchItemPrice] = useState('');
  const [itemRemark, setItemRemark] = useState('');
  const [showSuggestionsSidebar, setShowSuggestionsSidebar] = useState(false);
  const [neededToPurchase, setNeededToPurchase] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [roundOffMode, setRoundOffMode] = useState('add'); // 'add' | 'sub'
  
    
  

  // NEW: GST Rate for adding a product
  const [gstRateInput, setGstRateInput] = useState(18); // default 18

  // Stepper Control
  const [step, setStep] = useState(1);

  // Modal Controls
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Loading States
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);


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
  const outOfStockRef = useRef();
  const unloadingRef = useRef();
  const transportationRef = useRef();
  const handlingChargeRef = useRef();
  const discountRef = useRef();
  const receivedAmountRef = useRef();
  const receivedDateRef = useRef();
  const paymentMethodRef = useRef();
  const itemNameRef = useRef();
  const itemBrandRef = useRef();
  const itemCategoryRef = useRef();
  const remarkRef = useRef();
  const showroomRef = useRef();
  const roundOffRef = useRef();
    const gstRateRef = useRef();
    const itemRemarkRef = useRef();
    const mobileitemRemarkRef = useRef();

  const [billingsuggestions, setBillingSuggestions] = useState([]);
  const [selectedBillingSuggestions, setSelectedBillingSuggestions] = useState();

  /** BILLING SUGGESTIONS (for searching invoiceNo if no ID param is provided) */
  useEffect(() => {
    if (!id) {
      const fetchSuggestions = async () => {
        if (invoiceNo) {
          try {
            const response = await api.get(
            `/api/billing/billing/suggestions?search=${invoiceNo}`
            );
            setBillingSuggestions(response.data);
          } catch (err) {
             console.error(err);
  setErrorMessage(err.response?.data?.message || err.message || 'Unexpected error');
  setShowErrorModal(false);        // reset so modal can reopen on same error
  setShowErrorModal(true);
          }
        } else {
          setBillingSuggestions([]);
        }
      };
      fetchSuggestions();
    }
  }, [invoiceNo, id]);

    const generatecustomerid = async () => {
      const { data } = await api.get('/api/billing/lastOrder/id');
      const  lastCustomerNumber =
      parseInt(data.lastCustomerId.slice(3), 10) || 0;
     let Id = 'CUS' + (lastCustomerNumber + 1).toString().padStart(3, '0') + Date.now().toString().slice(5,10);
     setCustomerId(Id);
    };

  const handleSuggestionClick = (suggestion) => {
    navigate(`/invoice/edit/${suggestion._id}`);
    navigate(0);
    setBillingSuggestions([]);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      setSelectedBillingSuggestions((prevIndex) =>
        prevIndex < billingsuggestions.length - 1 ? prevIndex + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      setSelectedBillingSuggestions((prevIndex) =>
        prevIndex > 0 ? prevIndex - 1 : billingsuggestions.length - 1
      );
    } else if (e.key === 'Enter' && selectedBillingSuggestions >= 0) {
      setSelectedBillingSuggestions(billingsuggestions[selectedBillingSuggestions]);
      handleSuggestionClick(billingsuggestions[selectedBillingSuggestions]);
      setBillingSuggestions([]);
    } else if (e.key === 'Enter' && id) {
      changeRef(e, customerNameRef);
    }
  };

  // Effect to Clear Error Messages After 3 Seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Fetch Salesmen and Accounts on Mount
  useEffect(() => {
    const fetchSalesmen = async () => {
      try {
        const { data } = await api.get('/api/users/salesmen/all');
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
      setIsLoading(true);
      try {
        const response = await api.get('/api/accounts/allaccounts');
        setAccounts(response.data);
        if (response.data.length > 0) {
          setPaymentMethod(response.data[0].accountId);
        } else {
          setPaymentMethod('');
        }
      } catch (err) {
       console.error(err);
  setErrorMessage(err.response?.data?.message || err.message || 'Unexpected error');
  setShowErrorModal(false);        // reset so modal can reopen on same error
  setShowErrorModal(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSalesmen();
    fetchAccounts();
  }, []);



  // We need to handle the case when the user changes the unit
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



  // Fetch Billing Details by ID
  useEffect(() => {
    const fetchBillingDetails = async () => {
      setIsLoading(false);
      setIsLoading(true);
      try {
        const { data } = await api.get(`/api/billing/${id}`);
        setInvoiceNo(data.invoiceNo);
        setInvoiceDate(new Date(data.invoiceDate).toISOString().split('T')[0]);
        setAmountReceived(parseFloat(data.billingAmountReceived));

        const formattedExpectedDeliveryDate = new Date(data.expectedDeliveryDate)
          .toISOString()
          .slice(0, 16);
        setExpectedDeliveryDate(formattedExpectedDeliveryDate);

        setReceivedDate(
          new Date(data.paymentReceivedDate || new Date()).toISOString().split('T')[0]
        );
        setDeliveryStatus(data.deliveryStatus);
        setPaymentStatus(data.paymentStatus);
        setCustomerName(data.customerName);
        setCustomerAddress(data.customerAddress);
        setCustomerContactNumber(data.customerContactNumber);
        setCustomerId(data.customerId);
        setMarketedBy(data.marketedBy);
        setDiscount(parseFloat(data.discount) || 0);
        setReceivedAmount(parseFloat(data.paymentAmount) || 0);
        setUnloading(parseFloat(data.unloading) || 0);
        setTransportation(parseFloat(data.transportation) || 0);
        setHandlingCharge(parseFloat(data.handlingCharge) || 0);
        setshowRoom(data.showroom);
        setRoundOff(data.roundOff);
        setRemark(data.remark);
        setIsApproved(data.isApproved);
        setNeededToPurchase(data.isneededToPurchase);
        setRoundOffMode(data.roundoffMode)

        console.log(data.products);
        // Convert product numeric fields
        const fetchedProducts = data.products.map((p) => ({
          ...p,
          quantity: parseFloat(p.quantity) || 0,
          sellingPriceinQty: parseFloat(p.sellingPriceinQty) || 0,
          // If there's a product-level GST in the DB, we keep it; otherwise default 18:
          gstRate: p.gstRate !== undefined ? parseFloat(p.gstRate) : 18,
        }));
        setProducts(fetchedProducts);

        setSalesmanName(data.salesmanName);

        // If there's a matching salesman, set phone
        const selectedSalesman = salesmen.find(
          (s) => s.name === data.salesmanName
        );
        if (selectedSalesman && selectedSalesman.contactNumber) {
          setSalesmanPhoneNumber(selectedSalesman.contactNumber);
        } else {
          setSalesmanPhoneNumber('');
        }
      } catch (err) {
  console.error(err);
  setErrorMessage(err.response?.data?.message || err.message || 'Unexpected error');
  setShowErrorModal(false);        // reset so modal can reopen on same error
  setShowErrorModal(true);
      } finally {
        setIsLoading(false);
      }
    };

    if (id && salesmen.length > 0) {
      fetchBillingDetails();
    }
  }, [id, salesmen]);

  // Fetch Suggestions for Item ID
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
      // setError('Error fetching product suggestions.');
      setShowSuggestionsSidebar(false);
    }
  };

  // Handle Salesman Selection
  const handleSalesmanChange = (e) => {
    const selectedName = e.target.value;
    setSalesmanName(selectedName);

    const selectedSalesman = salesmen.find((s) => s.name === selectedName);
    if (selectedSalesman) {
      setSalesmanPhoneNumber(selectedSalesman.contactNumber || '');
    } else {
      setSalesmanPhoneNumber('');
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
      setItemCategory(data.category)
      setQuantity(0);
      setGstRateInput(data.gstPercent);
      setFetchItemPrice(data.price);

      // Pre-calc the suggested selling price
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
          setSellingPrice(parseFloat(data.price / 0.78).toFixed(2));
          setDisplaysellingPrice(parseFloat(data.price / 0.78).toFixed(2));
        }
      } else if (data.category === 'GRANITE') {
        setSellingPrice((parseFloat(data.price) / 0.75).toFixed(2));
        setDisplaysellingPrice((parseFloat(data.price) / 0.75).toFixed(2));
      } else {
        setSellingPrice((parseFloat(data.price) / 0.60).toFixed(2));
        setDisplaysellingPrice((parseFloat(data.price) / 0.60).toFixed(2));
      }

      const quantityInStock = data.countInStock;
      let adjustedQuantity = quantityInStock;

      if (data.category === 'TILES') {
        if (unit === 'SQFT') {
          const area = data.length * data.breadth;
          adjustedQuantity = (quantityInStock * area).toFixed(2);
        } else if (unit === 'BOX') {
          adjustedQuantity = (quantityInStock / data.psRatio).toFixed(2);
        }
      } else if (data.category === 'GRANITE') {
        const area = data.length * data.breadth;
        adjustedQuantity = (quantityInStock * area).toFixed(2);
      }
      
      setFetchQuantity(adjustedQuantity);

      itemNameRef.current?.focus();
      setItemId(data.item_id);
      setSuggestions([]);
    } catch (err) {
   console.error(err);
  setErrorMessage(err.response?.data?.message || err.message || 'Unexpected error');
  setShowErrorModal(false);        // reset so modal can reopen on same error
  setShowErrorModal(true);
    } finally {
      setIsLoading(false);
    }
  };



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
        invoiceNo: invoiceNo,                      
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

  // Handle Adding Product with Quantity and Selling Price
  const handleAddProductWithQuantity = () => {
    if (!selectedProduct) {
      setError('No product selected.');
      return;
    }

    const parsedQuantity = parseFloat(quantity);
    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      setError('Please enter a valid quantity.');
      return;
    }

    const parsedSellingPrice = parseFloat(sellingPrice);
    if (isNaN(parsedSellingPrice) || parsedSellingPrice <= 0) {
      setError('Please enter a valid selling price.');
      return;
    }

    // Validate the GST% input:
    const parsedGstRate = parseFloat(gstRateInput);
    if (isNaN(parsedGstRate) || parsedGstRate < 0) {
      setError('Please enter a valid GST%');
      return;
    }

    // Adjust quantities
    const productLength = parseFloat(selectedProduct.length || 0);
    const productBreadth = parseFloat(selectedProduct.breadth || 0);
    const productSize = parseFloat(selectedProduct.size || 0);
    const productPsRatio = parseFloat(selectedProduct.psRatio || 0);

    let adjustedQuantity = parsedQuantity;
    let adjustedSellingPrice = parsedSellingPrice;

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
    } else if (unit === 'TNOS') {
      const areaPerTnos = productLength * productBreadth;
      adjustedSellingPrice = parsedSellingPrice * areaPerTnos;
    }

    if (products.some((p) => p.item_id === selectedProduct.item_id)) {
      setError('This product is already added. Adjust the quantity instead.');
      return;
    }

    // Add product with its own gstRate
    const productWithDetails = {
      ...selectedProduct,
      quantity: adjustedQuantity,
      enteredQty: parsedQuantity,
      unit,
      sellingPrice: parsedSellingPrice,
      sellingPriceinQty: adjustedSellingPrice,
      gstRate: parsedGstRate,
      itemRemark: itemRemark
    };

    const updatedProducts = [productWithDetails, ...products];
    setProducts(updatedProducts);

    setShowSuccessModal(true);
    itemIdRef.current?.focus();

    setTimeout(() => {
      setShowSuccessModal(false);
    }, 2000);

    // Reset input fields
    setSelectedProduct(null);
    setQuantity(1);
    setUnit('NOS');
    setSellingPrice('');
    setDisplaysellingPrice('');
    setItemId('');
    setItemName('');
    setItemBrand('');
    setItemCategory('');
    setGstRateInput(0); // reset back to 18 by default
    setError('');
  };

  // Delete a Product from the List
  const deleteProduct = (indexToDelete) => {
    setProducts(products.filter((_, i) => i !== indexToDelete));
  };

  // Edit Product Details (including GST%)
  const handleEditProduct = (index, field, value) => {
    const updatedProducts = [...products];
    const product = updatedProducts[index];
    const parsedValue = parseFloat(value) || 0;

    // Safely parse & multiply
    const safeMultiply = (a, b) =>
      a && b ? parseFloat(a) * parseFloat(b) : 0;
    const area = safeMultiply(product.length, product.breadth);

    if (field === 'enteredQty') {
      if (product.unit === 'SQFT' && area > 0) {
        product.quantity = parsedValue / area;
      } else if (product.unit === 'BOX' && product.psRatio) {
        product.quantity = parsedValue * parseFloat(product.psRatio);
      } else if (product.unit === 'TNOS') {
        product.quantity = parsedValue;
      } else {
        product.quantity = parsedValue;
      }
      product[field] = parsedValue;
    } else if (field === 'sellingPrice') {
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
      product.gstRate = parsedValue;
    }else if(field === 'itemRemark'){
      product.itemRemark = value.toString();
    }  else {
      product[field] = parsedValue;
    }

    setProducts(updatedProducts);
  };

 // Totals
const [totalAmount, setTotalAmount] = useState(0); // Net total (Subtotal + GST - Discount)
const [amountWithoutGST, setAmountWithoutGST] = useState(0); // Total amount without GST
const [gstAmount, setGSTAmount] = useState(0); // Total GST
const [cgst, setCGST] = useState(0); // Optional, if CGST needs to be tracked separately
const [sgst, setSGST] = useState(0); // Optional, if SGST needs to be tracked separately
const [perItemDiscount, setPerItemDiscount] = useState(0); // Discount per item
// const [grandTotal, setGrandTotal] = useState(0); // Final Grand Total

/* ------------------------------------------------------------------
   Totals & Grand-total
   – keeps your original math, just eliminates reference / NaN issues
-------------------------------------------------------------------*/
useEffect(() => {
  /* ---------- parse once ---------- */
  const disc          = +discount        || 0;
  const trans         = +transportation  || 0;
  const unload        = +unloading       || 0;
  const handling      = +handlingCharge  || 0;
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
  handlingCharge,
  roundOff,
  roundOffMode,
  products             // always keep this **last** to avoid extra renders
]);



  // Submit Billing Data
  const submitBillingData = async () => {
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
  handlingCharge, // shorthand for handlingCharge: handlingCharge
  isApproved,     // shorthand for isApproved: isApproved
 isneededToPurchase: neededToPurchase,
  remark,
  discount,
  products: products.map((p) => {
    const quantity = parseFloat(p.quantity) || 0;
    const sellingPriceInQty = parseFloat(p.sellingPriceinQty) || 0;
    const itemBase = quantity * sellingPriceInQty;
    const itemDiscount = itemBase * discountRatio;

    const rateWithoutGST = itemBase / (1 + p.gstRate / 100) - itemDiscount;

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
     const response = await api.post(`/api/billing/edit/${id}`, billingData);
      setShowSummaryModal(false);
      setShowSuccessModal(true);
      console.log(response.data.existingBilling);

      setTimeout(() => {
          setShowSuccessModal(false);
          navigate('/invoice/list/');
      }, 2000);
    } catch (err) {
  console.error(err);
  setErrorMessage(err.response?.data?.message || err.message || 'Unexpected error');
  setShowErrorModal(false);        // reset so modal can reopen on same error
  setShowErrorModal(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openSummaryModal = () => {
    // Validate required fields
    if (
      !customerName ||
      !customerAddress ||
      !invoiceNo ||
      !expectedDeliveryDate ||
      !salesmanName ||
      products.length === 0
    ) {
      setError('Please fill all required fields and add at least one product.');
      return;
    }
    setShowSummaryModal(true);
  };

  // Generate PDF Invoice
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
      cgst,
      sgst,
      paymentAmount: receivedAmount,
      paymentMethod,
      paymentReceivedDate: receivedDate,
      customerName,
      customerAddress,
      customerContactNumber,
      marketedBy,
      unloading,
      transportation,
      handlingcharge: handlingCharge,
      remark,
      discount,
      subTotal: amountWithoutGST,
      grandTotal,
      products: products.map((p) => ({
        item_id: p.item_id,
        name: p.name,
        category: p.category,
        brand: p.brand,
        quantity: p.quantity,
        sellingPrice: p.sellingPrice,
        enteredQty: p.enteredQty,
        sellingPriceinQty: p.sellingPriceinQty,
        unit: p.unit,
        size: p.size,
        gstRate: p.gstRate,
      })),
    };

    try {
      const response = await api.post('/api/print/generate-pdf', formData, {
        responseType: 'blob',
      });

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

  // Print Invoice
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
      roundOff,
      subTotal: amountWithoutGST,
      grandTotal,
      transportation,
      unloading,
      handling: handlingCharge,
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
    } else {
      setStep(step + 1);
    }
  };

  const prevStep = () => setStep(step - 1);

  // Keyboard Nav
  function changeRef(e, nextRef) {
    if (e.key === 'Enter') {
      e.preventDefault();
      nextRef?.current?.focus();
    }
  }

  useEffect(() => {
    if (step === 2) {
      salesmanNameRef.current?.focus();
    } else if (step === 3) {
      invoiceDateRef.current?.focus();
    } else if (step === 4) {
      itemIdRef.current?.focus();
    }
  }, [step]);

  useEffect(() => {
    if (selectedProduct) {
      itemQuantityRef.current.focus();
    }
  }, [selectedProduct]);

  const [customerSuggestions, setCustomerSuggestions] = useState([]);
  const [customerSuggestionIndex, setCustomerSuggestionIndex] = useState(-1);

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

  const handleCustomerContactNumberChange = async (e) => {
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

  const [lastKeyWasEnter, setLastKeyWasEnter] = useState(false);

  const handleDoubleClick = (event) => {
    if (event.key === 'Enter') {
      if (lastKeyWasEnter) {
        setShowSummaryModal(true);
        setLastKeyWasEnter(false);
      } else {
        setLastKeyWasEnter(true);
        setTimeout(() => setLastKeyWasEnter(false), 1000);
      }
    }
  };

  useEffect(() => {
    discountRef.current?.focus();
  }, [showSummaryModal]);

  return (
    <div className="container mx-auto p-2">

      {/* Main Form */}
      <div
        className={`mx-auto ${
          step == 4 ? 'w-full' : 'max-w-2xl'
        } mt-5 mb-3 bg-white shadow-lg rounded-lg p-4`}
      >
        {/* Header with Actions */}
        <div className="flex justify-between">
          <div className="text-left">
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
            <button
              onClick={generatePDF}
              className={`mb-2 bg-red-500 text-xs text-white font-bold py-2 px-4 rounded-lg mr-2 ${
                products.length === 0 ? 'opacity-70 cursor-not-allowed' : 'hover:bg-red-600'
              }`}
              disabled={products.length === 0 || !userInfo.isAdmin}
            >
              <i className="fa fa-download" />
            </button>

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
              onClick={() => setShowSummaryModal(true)}
              className={`mb-2 bg-red-500 text-xs text-white font-bold py-2 px-4 rounded-lg ${
                products.length === 0 ? 'opacity-70 cursor-not-allowed' : 'hover:bg-red-600'
              }`}
              disabled={products.length === 0}
            >
              Submit
            </button>
            <p className="text-xs text-gray-400">
              Fill all fields before submission
            </p>
          </div>
        </div>

        {/* STEP 1: Customer Info */}
        {step === 1 && (
          <div className="mb-6">
            <h2 className="text-md text-gray-500 font-bold mb-4">
              Customer Information
            </h2>
            <div className="mb-4">
              <label className="block text-xs text-gray-700">Invoice No</label>
              <input
                type="text"
                ref={invoiceNoRef}
                value={invoiceNo}
                onChange={(e) => setInvoiceNo(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e)}
                className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                placeholder="Enter Invoice No"
              />

              {billingsuggestions.length > 0 && (
                <ul className="bg-white divide-y shadow-lg rounded-md overflow-hidden mb-4 border border-gray-300 max-h-48 overflow-y-auto">
                  {billingsuggestions.map((suggestion, index) => (
                    <li
                      key={suggestion._id}
                      className={`p-4 cursor-pointer hover:bg-gray-100 flex justify-between ${
                        index === selectedBillingSuggestions ? 'bg-gray-200' : ''
                      }`}
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      <span className="font-bold text-xs text-gray-500">
                        {suggestion.invoiceNo}
                      </span>
                      <i className="fa fa-arrow-right text-gray-300" />
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="mb-4 relative">
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
                    setCustomerSuggestionIndex((prev) =>
                      prev < customerSuggestions.length - 1 ? prev + 1 : prev
                    );
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setCustomerSuggestionIndex((prev) =>
                      prev > 0 ? prev - 1 : prev
                    );
                  } else if (e.key === 'Enter') {
                    if (
                      customerSuggestionIndex >= 0 &&
                      customerSuggestionIndex < customerSuggestions.length
                    ) {
                      e.preventDefault();
                      const selectedCustomer =
                        customerSuggestions[customerSuggestionIndex];
                      setCustomerName(selectedCustomer.customerName);
                      setCustomerContactNumber(
                        selectedCustomer.customerContactNumber
                      );
                      setCustomerAddress(selectedCustomer.customerAddress);
                      setCustomerId(selectedCustomer.customerId);
                      customerAddressRef.current?.focus();
                      setCustomerSuggestionIndex(-1);
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
                <div className="absolute z-10 mt-1 w-full bg-white border rounded-md max-h-60 overflow-y-auto">
                  {customerSuggestions.map((customer, index) => (
                    <div
                      key={index}
                      onClick={() => {
                        setCustomerName(customer.customerName);
                        setCustomerContactNumber(customer.customerContactNumber);
                        setCustomerAddress(customer.customerAddress);
                        setCustomerId(customer.customerId);
                        customerAddressRef.current?.focus();
                        setCustomerSuggestionIndex(-1);
                        setCustomerSuggestions([]);
                      }}
                      className={`p-2 text-xs cursor-pointer hover:bg-gray-100 ${
                        index === customerSuggestionIndex ? 'bg-gray-200' : ''
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
                onChange={handleCustomerContactNumberChange}
                onKeyDown={(e) => changeRef(e, customerAddressRef)}
                className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
              />
            </div>
            <div className="mb-4">
              <label className="block text-xs text-gray-700">
                Customer Address
              </label>
              <textarea
                value={customerAddress}
                ref={customerAddressRef}
                onChange={(e) => setCustomerAddress(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') nextStep();
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

        {/* STEP 2: Salesman Info */}
        {step === 2 && (
          <div className="mb-6">
            <h2 className="text-md text-gray-500 font-bold mb-4">
              Salesman Information
            </h2>
            <div className="mb-4">
              <label className="block text-xs text-gray-700">Salesman Name</label>
              <select
                value={salesmanName}
                ref={salesmanNameRef}
                onChange={handleSalesmanChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') nextStep();
                }}
                className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
              >
                <option value="">Select Salesman</option>
                {salesmen.map((salesman) => (
                  <option key={salesman._id} value={salesman.name}>
                    {salesman.name}
                  </option>
                ))}
              </select>
            </div>
            {salesmanName && (
              <div className="mb-4">
                <label className="block text-xs text-gray-700">
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

        {/* STEP 3: Payment & Delivery */}
        {step === 3 && (
          <div className="mb-6">
            <h2 className="text-md text-gray-500 font-bold mb-4">
              Payment and Delivery Information
            </h2>
            <div className="mb-4">
              <label className="block text-xs text-gray-700">Invoice Date</label>
              <input
                type="date"
                ref={invoiceDateRef}
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                onKeyDown={(e) => changeRef(e, expectedDeliveryDateRef)}
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
                onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                onKeyDown={(e) => changeRef(e, marketedByRef)}
                className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
              />
            </div>
            <div className="mb-4">
              <label className="block text-xs text-gray-700">Marketed By</label>
              <input
                type="text"
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
                onChange={(e) => setDeliveryStatus(e.target.value)}
                onKeyDown={(e) => nextStep()}
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

        {/* STEP 4: Add Products */}
        {step === 4 && (
          <div>
          <div>
            <div className="flex flex-col">
              {/* Desktop Layout */}
              <div className="hidden md:flex flex-col flex-1">
                <div className="flex flex-col flex-1 overflow-y-auto p-6">
                  {products.length > 0 && (
                    <div className="mt-6">
                      <h2 className="text-sm font-semibold mb-2">
                        Added Products: {products.length}
                      </h2>

                      <div className="mb-4 flex items-center">
                        <input
                          type="text"
                          placeholder="Search added products..."
                          value={filterText}
                          onChange={(e) => setFilterText(e.target.value)}
                          className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                        />
                        <i className="fa fa-search bg-red-500 p-2 text-white rounded-lg ml-2 items-center" />
                      </div>

                      <div className="overflow-x-auto rounded-md ">
                        <table className="table-auto w-full border-collapse rounded-xl shadow-md">
                          <thead>
                            <tr className="bg-red-500 text-white text-xs">
                              <th className="px-2 py-2 text-left">
                                <i className="fa fa-cube" aria-hidden="true"></i>{' '}
                                Name
                              </th>
                              <th className='px-2 py-2 text-center'>Remark</th>
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

const rateWithoutGST = itemBase / (1 + gstRate / 100) - itemDiscount;

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

                {/* Bottom fixed row for adding items */}
                <div
                                style={{
                                  width: '96%'
                                }}
  className="fixed bottom-0 left-0 bg-white px-4 pt-4 pb-4 border-t shadow-inner"
>                    <div className="flex justify-between">
                      <div className="w-4/5">
                        <div className="grid grid-cols-4 gap-2">
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
                              <p className="text-red-500 truncate text-xs">
                                {error}
                              </p>
                            )}
                          </div>

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

                          <div className="flex flex-col">
                            <label className="block text-gray-700 text-xs mb-1">
                              Category
                            </label>
                            <input
                              type="text"
                              ref={itemCategoryRef}
                              value={itemCategory}
                              onChange={(e) =>
                                setItemCategory(e.target.value)
                              }
                              onKeyDown={(e) => changeRef(e, itemBrandRef)}
                              className="w-full border border-gray-300 px-2 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                              placeholder="Item Category"
                              disabled={!selectedProduct}
                            />
                          </div>

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

                        <div className="grid grid-cols-8 gap-2 mt-2">
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
                          <div className="flex flex-col">
                            <label className="block text-gray-700 text-xs mb-1">
                              Quantity
                            </label>
                            <input
                              type="number"
                              ref={itemQuantityRef}
                              max={fetchQuantity}
                              value={quantity}
                              onChange={(e) =>
                                setQuantity(parseFloat(e.target.value))
                                }
                              onKeyDown={(e) => changeRef(e, sellingPriceRef)}
                              className="w-full border border-gray-300 px-2 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                            />
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

                          {/* NEW: GST% input */}
                          <div className="flex flex-col">
                            <label className="block text-gray-700 text-xs mb-1">
                              GST (%)
                            </label>
                            <input
                              type="number"
                              ref={gstRateRef}
                              min={0}
                              value={gstRateInput}
                              onChange={(e) => setGstRateInput(e.target.value)}
                              onKeyDown={(e) => changeRef(e, itemRemarkRef)}
                              className="w-full border border-gray-300 px-2 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                              placeholder="e.g. 18"
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

                          <div className="flex flex-col items-center justify-center bg-gray-50 p-2 rounded-md">
                            <p className="text-xs font-bold text-gray-500">
                              Net Amount:
                            </p>
                            <p className="text-xs font-bold">
                              ₹
                              {quantity > 0 && sellingPrice > 0
                                ? (quantity * sellingPrice).toFixed(2)
                                : '0.00'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="text-center md:hidden lg:block bg-gray-100 ml-2 items-center text-center rounded-lg p-4 h-full shadow-inner">
                        <div className="mb-2 mt-2">
                          <p className="text-xs font-bold">Added Products</p>
                          <p className="text-xs font-bold">
                            {products?.length}
                          </p>
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
  <div className="mt-2 font-bold text-xs text-gray-700">
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
              <div className="md:hidden flex flex-col flex-1 p-6">
                <div>
                  <div className="mb-4 relative">
                    <label className="block text-xs text-gray-700">Item ID</label>
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
                            addProductByItemId(
                              suggestions[selectedSuggestionIndex]
                            );
                          }
                        }
                      }}
                      className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                      placeholder="Enter Item ID or Name"
                    />
                    {error && (
                      <p className="text-red-500 mt-1 text-xs">{error}</p>
                    )}

                    {suggestions.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full bg-white border rounded-md max-h-60 divide-y overflow-y-auto">
                        {suggestions.map((suggestion, index) => (
                          <div
                            key={index}
                            onClick={() => {
                              addProductByItemId(suggestion);
                              setItemName(suggestion.name);
                              setItemCategory(suggestion.category);
                              setItemBrand(suggestion.brand);
                            }}
                            className={`p-4 text-xs cursor-pointer hover:bg-gray-100 ${
                              index === selectedSuggestionIndex
                                ? 'bg-gray-200'
                                : ''
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
                      <div className="flex justify-between items-center">
                        <p className="text-xs font-bold truncate">
                          {selectedProduct.name.slice(0, 25)}... ID:{' '}
                          {selectedProduct.item_id}
                        </p>
                        <p
                          className={`text-xs font-bold px-2 py-1 rounded ${
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
                      </div>
                      <p className="text-xs font-bold truncate mb-2">
                        Size: {selectedProduct.size}
                      </p>
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

                      <div className="mb-4">
                        <label className="block text-xs mb-1 text-gray-700">
                          Quantity
                        </label>
                        <div className="flex">
                          <input
                            type="number"
                            ref={itemQuantityMobileRef}
                            max={fetchQuantity}
                            value={quantity}
                            onChange={(e) =>
                              setQuantity(
                                  parseFloat(e.target.value)
                              )
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                sellingPriceRef.current.focus();
                              }
                            }}
                            className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                          />
                          <select
                            value={unit}
                            onChange={(e) => setUnit(e.target.value)}
                            className="w-full ml-4 border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
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

                      <div className="mb-4">
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
                          className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                          placeholder="Enter Selling Price"
                        />
                      </div>

                      {/* Mobile GST% */}
                      <div className="mb-4">
                        <label className="block text-xs mb-1 text-gray-700">
                          GST (%)
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={gstRateInput}
                          onChange={(e) => setGstRateInput(e.target.value)}
                          className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                          placeholder="e.g. 18"
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
                        className="text-xs cursor-pointer text-gray-500 text-center font-bold my-5"
                      >
                      Stock / Need Purchase
                      </p>
                    </div>
                  )}

                  {/* Added Products List */}
                  {products.length > 0 && (
                    <div className="mt-6">
                      <h2 className="text-sm font-semibold mb-4">
                        Added Products: {products.length}
                      </h2>
                      <div className="mb-4 flex items-center">
                        <input
                          type="text"
                          placeholder="Filter by product name or ID"
                          value={filterText}
                          onChange={(e) => setFilterText(e.target.value)}
                          className="w-full border border-gray-300 px-3 py-2 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs"
                        />
                        <i className="fa fa-search bg-red-500 p-3 text-white rounded-lg ml-2 items-center" />
                      </div>
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
                          const baseTotal =
                            product.quantity * product.sellingPriceinQty -
                            product.quantity * perItemDiscount;
                          const gstAmt = baseTotal * (product.gstRate / 100);
                          const netTotal = baseTotal + gstAmt;

                          return (
                            <div
                              key={index}
                              className="mb-4 bg-white border border-gray-200 rounded-lg shadow-md flex flex-col space-y-2"
                            >
                              <div className="flex justify-between rounded-t-lg bg-red-500 p-2 items-center">
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
                              <div className="flex flex-col px-4 py-3 space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-xs font-semibold">
                                    Quantity:
                                  </span>
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
                                    className="w-20 border border-gray-300 px-2 py-1 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs text-center"
                                  />
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-xs font-semibold">
                                    Unit:
                                  </span>
                                  <p className="text-xs font-bold">
                                    {product.unit}
                                  </p>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-xs font-semibold">
                                    Selling Price:
                                  </span>
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
                                    className="w-20 border border-gray-300 px-2 py-1 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs text-center"
                                    placeholder="Price"
                                  />
                                </div>
                                {/* Mobile GST% & amt */}
                                <div className="flex justify-between items-center">
                                  <span className="text-xs font-semibold">
                                    GST (%) :
                                  </span>
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
                                    className="w-20 border border-gray-300 px-2 py-1 rounded-md focus:border-red-200 focus:ring-red-500 focus:outline-none text-xs text-center"
                                    placeholder="18"
                                  />
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-xs font-semibold">
                                    GST Amt:
                                  </span>
                                  <input
                                    type="text"
                                    readOnly
                                    value={gstAmt.toFixed(2)}
                                    className="w-20 border border-gray-300 px-2 py-1 rounded-md text-xs text-center bg-gray-100"
                                  />
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
                                <div className="flex justify-between items-center">
                                  <span className="text-xs font-semibold">
                                    Base Total:
                                  </span>
                                  <span className="text-xs font-bold">
                                    ₹{baseTotal.toFixed(2)}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-xs font-semibold">
                                    Net Total:
                                  </span>
                                  <span className="text-xs font-bold">
                                    ₹{netTotal.toFixed(2)}
                                  </span>
                                </div>
                              </div>
                              <div className="flex justify-center py-2">
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
                                  <i className="fa fa-trash" aria-hidden="true"></i>{' '}
                                  Delete
                                </button>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
            <div className='mb-60'></div>
          </div>
        )}

        {/* Step Navigation */}
        <div className="flex justify-between mb-8">
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
          <p className="font-bold text-center text-xs mt-2">
            Step {step} of 4
          </p>
          <button
            disabled={step === 4}
            onClick={nextStep}
            className={`${
              step === 4
                ? 'bg-gray-300 text-xs text-gray-500 font-bold py-2 px-4 rounded-lg cursor-not-allowed'
                : 'bg-red-500 text-xs text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600'
            }`}
          >
            Next
          </button>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && ( openSnackbar({
          open: true,
          message: 'Successfully Updated',
          variant: 'alert',
          anchorOrigin: { vertical: 'bottom', horizontal: 'left' },
      
                              alert: {
                                color: 'success'
                              },
      
                              actionButton: true,
                              close: true
        }) 
        )}

      {/* Summary Modal */}
      {showSummaryModal && (
        <SummaryModal
          amountReceived={amountReceived}
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
          handling={handlingCharge}
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
          onSubmit={submitBillingData}
          isSubmitting={isSubmitting}
          totalProducts={products.length}
          roundOffMode={roundOffMode}
          setRoundOffMode={setRoundOffMode}
        />
      )}

      {/* Out of Stock Modal */}
{showOutOfStockModal && outofStockProduct && (
  <OutOfStockModal
    product={outofStockProduct}
    onUpdate={handleproductUpdate}
    onClose={() => {
      setOutofstockProduct(null);
      setShowOutOfStockModal(false);
    }}
    stockRef={outOfStockRef}
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


      {/* Error Message */}
      {error && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg">
          <p className="text-xs animate-pulse font-bold">{error}</p>
        </div>
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
