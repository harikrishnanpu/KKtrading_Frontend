import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import BillingSuccess from 'components/invoice/billingsuccess';
import useAuth from 'hooks/useAuth';

export default function ReturnBillingScreen() {
  const navigate = useNavigate();
  const { user: userInfo } = useAuth();

  // -- RETURN TYPE SELECTION (Removed the modal; now a simple section) --
  const [returnType, setReturnType] = useState(''); // 'bill' or 'purchase'

  // -- COMMON STATE --
  const [returnNo, setReturnNo] = useState('');
  const [returnDate, setReturnDate] = useState(
    new Date().toISOString().substring(0, 10)
  );
  const [products, setProducts] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [error, setError] = useState('');
  const [step, setStep] = useState(0);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

  const [discount, setDiscount] = useState(0);
  const [perItemDiscount, setPerItemDiscount] = useState(0);

  // Updated totals
  const [returnAmount, setReturnAmount] = useState(0); // Subtotal
  const [cgst, setCgst] = useState(0);
  const [sgst, setSgst] = useState(0);
  const [totalTax, setTotalTax] = useState(0);
  const [netReturnAmount, setNetReturnAmount] = useState(0);

  const [isGstEnabled, setIsGstEnabled] = useState(true);
  const [success, setSuccess] = useState(false);
  const [returnInvoice, setReturnInvoice] = useState('');
  const [lastBillId, setLastBillId] = useState(null);

  // For Bill Return
  const [selectedBillingNo, setSelectedBillingNo] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');

  // For Purchase Return
  const [selectedPurchaseNo, setSelectedPurchaseNo] = useState('');
  const [sellerName, setSellerName] = useState('');
  const [sellerAddress, setSellerAddress] = useState('');

  // -- OTHER EXPENSES --
  const [otherExpenses, setOtherExpenses] = useState([{ amount: '', remark: '' }]);

  // Refs for Input Navigation
  const billingNoRef = useRef();
  const returnNoRef = useRef();
  const returnDateRef = useRef();
  const customerNameRef = useRef();
  const customerAddressRef = useRef();

  const purchaseNoRef = useRef();
  const sellerNameRef = useRef();
  const sellerAddressRef = useRef();

  // -- Fetch last Return ID on Mount --
  useEffect(() => {
    async function fetchLastReturn() {
      try {
        const { data } = await api.get('/api/returns/lastreturn/id');
        // e.g. data = 'CN0001', increment the numerical part
        const numericalPart = parseInt(data.slice(2), 10) + 1;
        const nextReturnNo = `CN${numericalPart
          .toString()
          .padStart(data.length - 2, '0')}`;
        setReturnNo(nextReturnNo);
        setLastBillId(data);
      } catch (error) {
        console.error('Error fetching last return ID:', error);
        setError('Failed to fetch the last return ID.');
      }
    }
    fetchLastReturn();
  }, []);

  // Depending on returnType, watch for either Billing No or Purchase No changes
  useEffect(() => {
    if (returnType === 'bill') {
      if (selectedBillingNo) {
        fetchSuggestions(selectedBillingNo);
      } else {
        setSuggestions([]);
      }
    } else if (returnType === 'purchase') {
      if (selectedPurchaseNo) {
        fetchSuggestions(selectedPurchaseNo);
      } else {
        setSuggestions([]);
      }
    }
  }, [selectedBillingNo, selectedPurchaseNo, returnType]);

  // Step-based focusing
  useEffect(() => {
    if (returnType === 'bill') {
      if (step === 0) {
        billingNoRef.current?.focus();
      } else if (step === 1) {
        returnNoRef.current?.focus();
      } else if (step === 2) {
        customerNameRef.current?.focus();
      } else if (step === 3) {
        customerAddressRef.current?.focus();
      }
    } else if (returnType === 'purchase') {
      if (step === 0) {
        purchaseNoRef.current?.focus();
      } else if (step === 1) {
        returnNoRef.current?.focus();
      } else if (step === 2) {
        sellerNameRef.current?.focus();
      } else if (step === 3) {
        sellerAddressRef.current?.focus();
      }
    }
  }, [step, returnType]);

  // Recalculate Return Amount and Taxes whenever products, GST Toggle, or otherExpenses change
  useEffect(() => {
    let subtotal = 0;
    let totalTaxCalc = 0;

    // 1) Sum up products
    products.forEach((prod) => {
      const qty = parseFloat(prod.quantity) || 0;
      const lineBase = parseFloat(prod.returnPrice || 0) * qty;
      subtotal += lineBase;

      let gstRate = 0;
      if (returnType === 'bill' && prod.gstRate !== undefined) {
        gstRate = parseFloat(prod.gstRate) || 0;
      } else if (returnType === 'purchase' && prod.gstPercent !== undefined) {
        gstRate = parseFloat(prod.gstPercent) || 0;
      }

      // If "isGstEnabled" is false, effectively set gstRate to 0
      if (!isGstEnabled) {
        gstRate = 0;
      }

      const lineTax = lineBase * (gstRate / 100);
      totalTaxCalc += lineTax;
    });

    // 2) Sum up Other Expenses
    const sumOtherExpenses = otherExpenses.reduce(
      (acc, exp) => acc + (parseFloat(exp.amount) || 0),
      0
    );

    // For simplicity, split half-and-half into CGST / SGST
    const halfTax = totalTaxCalc / 2;

    setReturnAmount(subtotal);
    setTotalTax(totalTaxCalc);
    setCgst(halfTax);
    setSgst(halfTax);

    // netReturnAmount => base + totalTax + otherExpenses
    setNetReturnAmount(subtotal + totalTaxCalc + sumOtherExpenses);
  }, [products, isGstEnabled, returnType, otherExpenses]);

  // -- Helper: Next / Previous Step --
  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => prev - 1);

  // -- Helper: For focusing next field on "Enter" Key --
  const changeRef = (e, nextRef) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      nextRef?.current?.focus();
    }
  };

  // -- Fetch Suggestions depending on returnType --
  const fetchSuggestions = async (query) => {
    try {
      if (returnType === 'bill') {
        // For Billing
        const { data } = await api.get(
          `/api/billing/billing/suggestions?search=${query}`
        );
        setSuggestions(data);
      } else if (returnType === 'purchase') {
        // For Purchase
        const { data } = await api.get(
          `/api/purchases/purchase/suggestions?search=${query}`
        );
        setSuggestions(data);
      }
    } catch (err) {
      console.error('Error fetching suggestions:', err);
      setError('Error fetching suggestions.');
    }
  };

  // -- On suggestion keyboard input (for searching Billing/Purchase No) --
  const handleSuggestionKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestionIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestionIndex(
        (prev) => (prev - 1 + suggestions.length) % suggestions.length
      );
    } else if (e.key === 'Enter' && selectedSuggestionIndex >= 0) {
      e.preventDefault();
      const selected = suggestions[selectedSuggestionIndex];
      if (returnType === 'bill') {
        setSelectedBillingNo(selected.invoiceNo);
        fetchDetails(selected._id);
      } else {
        setSelectedPurchaseNo(selected.purchaseId);
        fetchDetails(selected._id);
      }
      setSuggestions([]);
      setSelectedSuggestionIndex(-1);
    }
  };

  // -- Fetch either Billing or Purchase Details depending on returnType --
  const fetchDetails = async (id) => {
    try {
      if (returnType === 'bill') {
        const { data } = await api.get(`/api/billing/${id}`);
        // For Bill:
        setCustomerName(data.customerName || '');
        setCustomerAddress(data.customerAddress || '');
        const billDiscount = parseFloat(data.discount) || 0;
        setDiscount(billDiscount);



    let sumOfBase = 0;
    data.products.forEach((p) => {
      sumOfBase += (parseFloat(p.quantity) || 0) * (parseFloat(p.sellingPriceinQty) || 0);
    });
 
 // Parse the discount value and compute the discount ratio.
 const parsedDiscount = parseFloat(discount) || 0;
 const discountRatio = sumOfBase > 0 ? parsedDiscount / sumOfBase : 0;

        // Prepare each product for the return
        const productsWithReturnPrice = data.products.map((product) => {

          const gstRate = parseFloat(product.gstRate) || 0;
          const spQty = parseFloat(product.selledPrice) || 0; // safer fallback

          const quantity = parseFloat(product.quantity) || 0;
          const sellingPriceInQty = parseFloat(product.sellingPriceinQty) || 0;
          const itemBase = quantity * sellingPriceInQty;
          const itemDiscount = itemBase * discountRatio;
      
          const rateWithoutGST = itemBase / (1 + product.gstRate / 100) - itemDiscount;
      
      // After discount
      const netBase = itemBase - itemDiscount;
      
      // GST on discounted base
      const gstAmount = rateWithoutGST * (1 + product.gstRate / 100) - rateWithoutGST;
      
      // Final net per item
      const netTotal = rateWithoutGST + gstAmount;

          // Base (excluding GST)
          const baseExclGst = spQty / (1 + gstRate / 100);

          // Discount for that product
          const discountForThisProduct = itemBase * discountRatio;

          // Final "returnPrice" is baseExclGst minus the share of discount
          const returnPriceVal = parseFloat(
            (baseExclGst - discountForThisProduct)
          );
          return {
            ...product,
            gstRate,
            initialQuantity: parseFloat(product.quantity) || 0,
            returnPrice: returnPriceVal >= 0 ? returnPriceVal : 0,
            quantity: 0, // user inputs the quantity to return
          };
        });

        setProducts(productsWithReturnPrice);
        setStep(1); // Move to next step
      } else {
        // For Purchase
        const { data } = await api.get(`/api/purchases/get/${id}`);
        setSellerName(data.sellerName || '');
        setSellerAddress(data.sellerAddress || '');
        const purchaseDiscount = 0; // or data.discount if your API returns it
        setDiscount(parseFloat(purchaseDiscount) || 0);

        // Distribute discount
        const totalQtyItems = data.items.reduce(
          (acc, item) => acc + (parseFloat(item.quantityInNumbers) || 0),
          0
        );
        const calculatedPerItemDiscount =
          totalQtyItems > 0 ? purchaseDiscount / totalQtyItems : 0;
        setPerItemDiscount(parseFloat(calculatedPerItemDiscount.toFixed(2)));

        const productsWithReturnPrice = data.items.map((item) => {
          const cashPrice = parseFloat(item.cashPartPriceInNumbers) || 0;
          const billPrice = parseFloat(item.billPartPriceInNumbers) || 0;
          const basePrice = cashPrice + billPrice;

          // Subtract item’s share of discount
          const finalReturnPrice = parseFloat(
            (basePrice - calculatedPerItemDiscount).toFixed(2)
          );

          return {
            item_id: item.itemId,
            name: item.name,
            gstPercent: item.gstPercent,
            initialQuantity: parseFloat(item.quantityInNumbers) || 0,
            returnPrice: finalReturnPrice >= 0 ? finalReturnPrice : 0,
            quantity: 0,
            cashPartPriceInNumbers: cashPrice,
            billPartPriceInNumbers: billPrice,
          };
        });
        setProducts(productsWithReturnPrice);
        setStep(1);
      }
    } catch (err) {
      console.error('Error fetching details:', err);
      setError('Error fetching details.');
    }
  };

  // -- Handle Return Submission (Create Return) --
  const handleReturnSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!returnNo || !returnDate || products.length === 0) {
      alert('Please fill all required fields and add at least one product.');
      return;
    }
    // Bill Return validations
    if (
      returnType === 'bill' &&
      (!selectedBillingNo || !customerName || !customerAddress)
    ) {
      alert('Please fill all required fields for a Bill Return.');
      return;
    }
    // Purchase Return validations
    if (
      returnType === 'purchase' &&
      (!selectedPurchaseNo || !sellerName || !sellerAddress)
    ) {
      alert('Please fill all required fields for a Purchase Return.');
      return;
    }

    const requestBody = {
      returnNo,
      returnType,
      returnDate,
      discount,
      cgst,
      sgst,
      totalTax,
      returnAmount,
      netReturnAmount,
      otherExpenses,
      products: products.map((p) => ({
        item_id: p.item_id || p.itemId || '',
        name: p.name,
        returnPrice: p.returnPrice,
        quantity: p.quantity,
        ...(returnType === 'purchase' && {
          cashPartPriceInNumbers: p.cashPartPriceInNumbers,
          billPartPriceInNumbers: p.billPartPriceInNumbers,
        }),
      })),
    };

    if (returnType === 'bill') {
      requestBody.billingNo = selectedBillingNo;
      requestBody.customerName = customerName;
      requestBody.customerAddress = customerAddress;
    } else {
      requestBody.purchaseNo = selectedPurchaseNo;
      requestBody.sellerName = sellerName;
      requestBody.sellerAddress = sellerAddress;
    }

    try {
      const { data } = await api.post('/api/returns/create', requestBody);
      setReturnInvoice(data?.returnNo || data);

      // Reset Form
      setReturnNo('');
      setReturnDate(new Date().toISOString().substring(0, 10));
      setProducts([]);
      setDiscount(0);
      setPerItemDiscount(0);
      setIsGstEnabled(true);
      setStep(0);
      setOtherExpenses([{ amount: '', remark: '' }]);

      if (returnType === 'bill') {
        setSelectedBillingNo('');
        setCustomerName('');
        setCustomerAddress('');
      } else {
        setSelectedPurchaseNo('');
        setSellerName('');
        setSellerAddress('');
      }

      alert('Return data submitted successfully!');
      setSuccess(true);
    } catch (error) {
      console.error('Error submitting return data:', error);
      alert('There was an error submitting the return data. Please try again.');
    }
  };

  // -- Handle Generate & Print (optional) --
  const handleGenerateAndPrint = async () => {
    // Basic validation
    if (!returnNo || !returnDate || products.length === 0) {
      alert('Please fill all required fields and add at least one product.');
      return;
    }
    if (
      returnType === 'bill' &&
      (!selectedBillingNo || !customerName || !customerAddress)
    ) {
      alert('Please fill all required fields for a Bill Return.');
      return;
    }
    if (
      returnType === 'purchase' &&
      (!selectedPurchaseNo || !sellerName || !sellerAddress)
    ) {
      alert('Please fill all required fields for a Purchase Return.');
      return;
    }

    const requestBody = {
      returnNo,
      returnType,
      returnDate,
      discount,
      cgst,
      sgst,
      totalTax,
      returnAmount,
      netReturnAmount,
      otherExpenses,
      products: products.map((p) => ({
        item_id: p.item_id || p.itemId || '',
        name: p.name,
        returnPrice: p.returnPrice,
        quantity: p.quantity,
        ...(returnType === 'purchase' && {
          cashPartPriceInNumbers: p.cashPartPriceInNumbers,
          billPartPriceInNumbers: p.billPartPriceInNumbers,
        }),
      })),
    };

    if (returnType === 'bill') {
      requestBody.billingNo = selectedBillingNo;
      requestBody.customerName = customerName;
      requestBody.customerAddress = customerAddress;
    } else {
      requestBody.purchaseNo = selectedPurchaseNo;
      requestBody.sellerName = sellerName;
      requestBody.sellerAddress = sellerAddress;
    }

    try {
      // Generate Return Invoice HTML
      const response = await api.post(
        '/api/print/generate-return-invoice-html',
        requestBody,
        {
          responseType: 'blob',
        }
      );

      // Create a Blob from the response
      const blob = new Blob([response.data], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      alert('Return data submitted and invoice generated successfully!');
    } catch (error) {
      console.error('Error generating/printing return invoice:', error);
      alert(
        'There was an error submitting the return data or generating the invoice.'
      );
    }
  };

  // -- Update otherExpenses fields --
  const handleExpenseChange = (index, field, value) => {
    const newExpenses = [...otherExpenses];
    newExpenses[index][field] = value;
    setOtherExpenses(newExpenses);
  };

  // -- Add new row for other expenses --
  const addExpenseRow = () => {
    setOtherExpenses([...otherExpenses, { amount: '', remark: '' }]);
  };

  // -- Render --
  return (
    <div className="container mx-auto py-4">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-8">

        {/* 1) Top section: Choose Return Type (replaces the old modal) */}
        <div className="mb-6">
          <p className="text-sm font-semibold mb-2">Select Return Type:</p>
          <div className="space-x-2">
            <button
              onClick={() => {
                setReturnType('bill');
                setStep(0); // reset steps if switching type
              }}
              className={`px-4 py-2 rounded-md ${
                returnType === 'bill'
                  ? 'bg-red-600 text-white'
                  : 'border border-red-400 text-red-600'
              }`}
            >
              Return Against Bill
            </button>
            <button
              onClick={() => {
                setReturnType('purchase');
                setStep(0); // reset steps if switching type
              }}
              className={`px-4 py-2 rounded-md ${
                returnType === 'purchase'
                  ? 'bg-red-600 text-white'
                  : 'border border-red-400 text-red-600'
              }`}
            >
              Return Against Purchase
            </button>
          </div>
        </div>

        {/* If no returnType chosen, show a small message. Otherwise show form steps. */}
        {returnType === '' ? (
          <p className="text-sm text-gray-500">
            Please select a return type above to proceed.
          </p>
        ) : (
          <>
            {/* Submit / Print Buttons */}
            <div className="flex justify-end mb-4">
              <div className="text-right space-x-2">
                <button
                  onClick={handleGenerateAndPrint}
                  className="bg-red-600 font-bold text-xs text-white py-2 px-3 rounded-md"
                >
                  <i className="fa fa-print" />
                </button>
                <button
                  onClick={handleReturnSubmit}
                  className="bg-red-600 font-bold text-xs text-white py-2 px-3 rounded-md"
                >
                  Submit Return
                </button>
                <p className="italic text-xs text-gray-400 mt-1">
                  Please fill all required fields before submission
                </p>
              </div>
            </div>

            {/* Error Message */}
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

            {success && (
              <BillingSuccess
                isAdmin={userInfo?.isAdmin}
                estimationNo={returnInvoice}
              />
            )}

            {/* Steps */}
            {/* Step 0 => Enter Bill No or Purchase No */}
            {step === 0 && (
              <div className="space-y-1 mb-4">
                {returnType === 'bill' ? (
                  <>
                    <label className="text-sm font-semibold text-gray-800">
                      Select Billing No
                    </label>
                    <input
                      type="text"
                      ref={billingNoRef}
                      value={selectedBillingNo}
                      onChange={(e) => setSelectedBillingNo(e.target.value)}
                      onKeyDown={handleSuggestionKeyDown}
                      className="w-full px-4 py-2 border rounded-md focus:outline-none focus:border-red-200 focus:ring-red-500 text-xs"
                      placeholder="Enter or select Billing Invoice No"
                      autoComplete="off"
                    />
                  </>
                ) : (
                  <>
                    <label className="text-sm font-semibold text-gray-800">
                      Select Purchase No
                    </label>
                    <input
                      type="text"
                      ref={purchaseNoRef}
                      value={selectedPurchaseNo}
                      onChange={(e) => setSelectedPurchaseNo(e.target.value)}
                      onKeyDown={handleSuggestionKeyDown}
                      className="w-full px-4 py-2 border rounded-md focus:outline-none focus:border-red-200 focus:ring-red-500 text-xs"
                      placeholder="Enter or select Purchase Invoice No"
                      autoComplete="off"
                    />
                  </>
                )}

                {/* Suggestions */}
                {suggestions.length > 0 && (
                  <div className="mt-2 bg-white divide-y shadow-md rounded-md max-h-60 overflow-y-auto">
                    {suggestions.map((item, index) => {
                      const displayText =
                        returnType === 'bill' ? item.invoiceNo : item.purchaseId;
                      return (
                        <div
                          key={displayText}
                          onClick={() => {
                            if (returnType === 'bill') {
                              setSelectedBillingNo(displayText);
                            } else {
                              setSelectedPurchaseNo(displayText);
                            }
                            fetchDetails(item._id);
                            setSuggestions([]);
                            setSelectedSuggestionIndex(-1);
                          }}
                          className={`cursor-pointer flex justify-between p-4 hover:bg-gray-100 ${
                            index === selectedSuggestionIndex ? 'bg-gray-200' : ''
                          }`}
                        >
                          <span className="text-xs font-bold text-gray-500">
                            {displayText}
                          </span>
                          <i className="fa text-gray-300 px-2 fa-arrow-right" />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Step 1 => Return Info */}
            {step === 1 && (
              <div className="space-y-4 mb-4">
                <div className="flex justify-between">
                  <h3 className="text-sm font-bold text-gray-500">
                    Return Information
                  </h3>
                  <p className="italic text-xs text-gray-500">
                    Last Return No: {lastBillId ? lastBillId : 'No Returns'}
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 text-xs">
                      Return No
                    </label>
                    <input
                      type="text"
                      ref={returnNoRef}
                      value={returnNo}
                      onChange={(e) => setReturnNo(e.target.value)}
                      onKeyDown={(e) => changeRef(e, returnDateRef)}
                      className="w-full px-4 py-2 border rounded-md focus:outline-none focus:border-red-200 focus:ring-red-500 text-xs"
                      placeholder="Enter Return No"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-xs">
                      Return Date
                    </label>
                    <input
                      type="date"
                      ref={returnDateRef}
                      value={returnDate}
                      onChange={(e) => setReturnDate(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          nextStep();
                        }
                      }}
                      className="w-full px-4 py-2 border rounded-md focus:outline-none focus:border-red-200 focus:ring-red-500 text-xs"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2 => Customer Info or Seller Info */}
            {step === 2 && (
              <div className="space-y-4 mb-4">
                {returnType === 'bill' ? (
                  <>
                    <h3 className="text-sm font-semibold text-gray-800">
                      Customer Information
                    </h3>
                    <div>
                      <label className="block text-gray-700 text-xs">
                        Customer Name
                      </label>
                      <input
                        type="text"
                        ref={customerNameRef}
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        onKeyDown={(e) => changeRef(e, customerAddressRef)}
                        className="w-full px-4 py-2 border rounded-md focus:outline-none focus:border-red-200 focus:ring-red-500 text-xs"
                        placeholder="Enter Customer Name"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 text-xs">
                        Customer Address
                      </label>
                      <textarea
                        ref={customerAddressRef}
                        value={customerAddress}
                        onChange={(e) => setCustomerAddress(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            nextStep();
                          }
                        }}
                        className="w-full px-4 py-2 border rounded-md focus:outline-none focus:border-red-200 focus:ring-red-500 text-xs"
                        placeholder="Enter Customer Address"
                        required
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="text-sm font-semibold text-gray-800">
                      Seller Information
                    </h3>
                    <div>
                      <label className="block text-gray-700 text-xs">
                        Seller Name
                      </label>
                      <input
                        type="text"
                        ref={sellerNameRef}
                        value={sellerName}
                        onChange={(e) => setSellerName(e.target.value)}
                        onKeyDown={(e) => changeRef(e, sellerAddressRef)}
                        className="w-full px-4 py-2 border rounded-md focus:outline-none focus:border-red-200 focus:ring-red-500 text-xs"
                        placeholder="Enter Seller Name"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 text-xs">
                        Seller Address
                      </label>
                      <textarea
                        ref={sellerAddressRef}
                        value={sellerAddress}
                        onChange={(e) => setSellerAddress(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            nextStep();
                          }
                        }}
                        className="w-full px-4 py-2 border rounded-md focus:outline-none focus:border-red-200 focus:ring-red-500 text-xs"
                        placeholder="Enter Seller Address"
                        required
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Step 3 => Update Products */}
            {step === 3 && (
              <div className="space-y-4 mb-4">
                <h3 className="text-sm font-semibold text-gray-800">
                  Update Products
                </h3>

                {/* GST Toggle */}
                <div className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    id="gstToggle"
                    checked={isGstEnabled}
                    onChange={(e) => setIsGstEnabled(e.target.checked)}
                    className="h-4 w-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                  />
                  <label
                    htmlFor="gstToggle"
                    className="ml-2 block text-xs text-gray-700"
                  >
                    Apply GST from each product
                  </label>
                </div>

                {/* Products Table */}
                {products.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full table-auto bg-white shadow-md rounded-md">
                      <thead>
                        <tr className="bg-gray-100 text-gray-600 text-sm leading-normal">
                          <th className="py-3 px-2 text-left">Item ID</th>
                          <th className="py-3 px-2 text-left">Name</th>
                          {returnType === 'purchase' && (
                            <>
                              <th className="py-3 px-2 text-left">
                                Cash Part Price
                              </th>
                              <th className="py-3 px-2 text-left">
                                Bill Part Price
                              </th>
                            </>
                          )}
                          <th className="py-3 px-2 text-left">Return Price</th>
                          <th className="py-3 px-2 text-left">Quantity</th>
                          <th className="py-3 px-2 text-left">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="text-gray-600 text-sm font-light">
                        {products.map((product, index) => (
                          <tr
                            key={index}
                            className="border-b border-gray-200 hover:bg-gray-100"
                          >
                            <td className="py-3 text-xs px-2">
                              {product.item_id || product.itemId}
                            </td>
                            <td className="py-3 text-xs px-2">{product.name}</td>
                            {returnType === 'purchase' && (
                              <>
                                <td className="py-3 text-xs px-2">
                                  ₹
                                  {product.cashPartPriceInNumbers?.toFixed(2) ||
                                    '0.00'}
                                </td>
                                <td className="py-3 text-xs px-2">
                                  ₹
                                  {product.billPartPriceInNumbers?.toFixed(2) ||
                                    '0.00'}
                                </td>
                              </>
                            )}
                            <td className="py-3 text-xs px-2">
                              ₹{product.returnPrice?.toFixed(2)}
                            </td>
                            <td className="py-3 text-xs px-2">
                              <input
                                type="number"
                                max={product.initialQuantity}
                                value={product.quantity}
                                onChange={(e) => {
                                  const val =
                                    e.target.value === ''
                                      ? ''
                                      : Number(e.target.value);
                                  const safeQty = Math.min(
                                    val,
                                    product.initialQuantity
                                  );
                                  const newProducts = [...products];
                                  newProducts[index].quantity = safeQty;
                                  setProducts(newProducts);
                                }}
                                className="w-20 px-2 py-1 border rounded-md focus:outline-none focus:border-red-200 focus:ring-red-500 text-xs"
                                min="0"
                                required
                              />
                            </td>
                            <td className="py-3 text-xs px-2">
                              <button
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      `Are you sure you want to remove "${product.name}" from the return?`
                                    )
                                  ) {
                                    setProducts(
                                      products.filter((_, i) => i !== index)
                                    );
                                  }
                                }}
                                className="text-red-500 hover:text-red-700"
                              >
                                <i className="fa fa-trash" aria-hidden="true"></i>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500">No products available for return.</p>
                )}

                {/* Other Expenses Section */}
                <div className="mt-8 p-4 bg-gray-50 rounded-md">
                  <h4 className="text-xs font-semibold text-gray-700 mb-2">
                    Other Expenses
                  </h4>
                  {otherExpenses.map((exp, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col sm:flex-row items-center gap-2 mb-2"
                    >
                      <input
                        type="number"
                        className="w-full sm:w-32 px-2 py-1 border rounded-md focus:outline-none focus:border-red-200 focus:ring-red-500 text-xs"
                        placeholder="Amount"
                        value={exp.amount}
                        onChange={(e) =>
                          handleExpenseChange(idx, 'amount', e.target.value)
                        }
                      />
                      <input
                        type="text"
                        className="w-full px-2 py-1 border rounded-md focus:outline-none focus:border-red-200 focus:ring-red-500 text-xs"
                        placeholder="Remark"
                        value={exp.remark}
                        onChange={(e) =>
                          handleExpenseChange(idx, 'remark', e.target.value)
                        }
                      />
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addExpenseRow}
                    className="bg-gray-300 text-xs font-bold py-1 px-2 rounded-md text-gray-700 hover:bg-gray-400"
                  >
                    + Add Expense
                  </button>
                </div>

                {/* Return Summary */}
                {products.length > 0 && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-md">
                    <h4 className="text-xs font-semibold text-gray-700">
                      Return Summary
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                      <div className="flex text-xs justify-between">
                        <span>Subtotal (no tax):</span>
                        <span>₹{returnAmount.toFixed(2)}</span>
                      </div>
                      {isGstEnabled && (
                        <>
                          <div className="flex text-xs justify-between">
                            <span>Total GST:</span>
                            <span>₹{totalTax.toFixed(2)}</span>
                          </div>
                          <div className="flex text-xs justify-between ml-2">
                            <span className="italic">CGST (half):</span>
                            <span>₹{cgst.toFixed(2)}</span>
                          </div>
                          <div className="flex text-xs justify-between ml-2">
                            <span className="italic">SGST (half):</span>
                            <span>₹{sgst.toFixed(2)}</span>
                          </div>
                        </>
                      )}
                      <div className="flex text-sm justify-between font-bold sm:col-span-2">
                        <span>
                          Net Return Amount (incl. tax + other expenses):
                        </span>
                        <span>₹{netReturnAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step Navigation */}
            <div className="flex justify-between mb-8 mt-10">
              <button
                disabled={step === 0}
                onClick={prevStep}
                className={`${
                  step === 0
                    ? 'bg-gray-300 text-gray-500 text-xs font-bold py-2 px-4 rounded-lg cursor-not-allowed'
                    : 'bg-red-500 text-xs text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600'
                }`}
              >
                Previous
              </button>
              <p className="font-bold text-center text-xs mt-2">
                Step {step + 1} of 4
              </p>
              <button
                disabled={
                  // Step 0 => must have chosen Bill or Purchase No
                  (step === 0 &&
                    returnType === 'bill' &&
                    !selectedBillingNo) ||
                  (step === 0 &&
                    returnType === 'purchase' &&
                    !selectedPurchaseNo) ||
                  // Step 1 => must have returnNo, returnDate
                  (step === 1 && (!returnNo || !returnDate)) ||
                  // Step 2 => must have (customerName & address) or (sellerName & address)
                  (step === 2 &&
                    returnType === 'bill' &&
                    (!customerName || !customerAddress)) ||
                  (step === 2 &&
                    returnType === 'purchase' &&
                    (!sellerName || !sellerAddress)) ||
                  // Step 3 => must have at least one product with quantity > 0
                  (step === 3 && products.every((p) => (p.quantity || 0) <= 0)) ||
                  step === 4
                }
                onClick={nextStep}
                className={`${
                  (step === 0 &&
                    ((returnType === 'bill' && !selectedBillingNo) ||
                      (returnType === 'purchase' && !selectedPurchaseNo))) ||
                  (step === 1 && (!returnNo || !returnDate)) ||
                  (step === 2 &&
                    returnType === 'bill' &&
                    (!customerName || !customerAddress)) ||
                  (step === 2 &&
                    returnType === 'purchase' &&
                    (!sellerName || !sellerAddress)) ||
                  (step === 3 &&
                    products.every((p) => (p.quantity || 0) <= 0)) ||
                  step === 4
                    ? 'bg-gray-300 text-xs text-gray-500 font-bold py-2 px-4 rounded-lg cursor-not-allowed'
                    : 'bg-red-500 text-xs text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600'
                }`}
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
