import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { X, Filter, ChevronDown, ChevronUp, MapPin, Package, Truck, Calendar, DollarSign } from "lucide-react";
import api from "../api";
import DriverTracking from "components/driver/deliveryTracking";

const DriverTrackingPage = () => {
  const navigate = useNavigate();

  // Pagination & Data States
  const [bills, setBills] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1); 
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState("");
  const [deliveryStatusFilter, setDeliveryStatusFilter] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState("invoiceDate");
  const [sortOrder, setSortOrder] = useState("desc");
  
  // UI States
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedBill, setSelectedBill] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [locationData, setLocationData] = useState([]);
  const [filteredDeliveryId, setFilteredDeliveryId] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showFilterSidebar, setShowFilterSidebar] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    billing: true,
    products: true,
    deliveries: true,
    tracking: true
  });

  // Handle window resize for responsive design
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch bills with pagination, search, filter, sort
  const fetchBills = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = {
        page: currentPage,
        limit: itemsPerPage,
        search: searchQuery,
        deliveryStatus: deliveryStatusFilter,
        paymentStatus: paymentStatusFilter,
        dateFrom,
        dateTo,
        sortBy,
        sortOrder,
      };

      const response = await api.get("/api/driver-tracking/bills-with-deliveries", { params });
      
      setBills(response.data.bills || []);
      setTotalPages(response.data.totalPages || 1);
      setTotalItems(response.data.totalItems || 0);
    } catch (err) {
      console.error("Error fetching bills:", err);
      setError("Failed to fetch bills. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, itemsPerPage, searchQuery, deliveryStatusFilter, paymentStatusFilter, dateFrom, dateTo, sortBy, sortOrder]);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  // Fetch location data for selected bill
  const fetchLocationData = async (invoiceNo) => {
    try {
      const response = await api.get(`/api/users/locations/invoice/${invoiceNo}`);
      setLocationData(response.data || []);
    } catch (err) {
      console.error("Error fetching location data:", err);
      setLocationData([]);
    }
  };

  // Handle bill selection
  const handleViewDetails = async (bill) => {
    setSelectedBill(bill);
    setShowDetailModal(true);
    document.body.style.overflow = 'hidden';
    await fetchLocationData(bill.invoiceNo);
  };

  // Close modal
  const handleCloseModal = () => {
    setShowDetailModal(false);
    setSelectedBill(null);
    setLocationData([]);
    setFilteredDeliveryId(null);
    document.body.style.overflow = 'unset';
  };

  // Reset filters
  const handleResetFilters = () => {
    setSearchQuery("");
    setDeliveryStatusFilter("");
    setPaymentStatusFilter("");
    setDateFrom("");
    setDateTo("");
    setSortBy("invoiceDate");
    setSortOrder("desc");
    setCurrentPage(1);
  };

  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Prepare markers and polylines for map
  const markers = [];
  const polylines = [];

  if (locationData && locationData.length > 0) {
    locationData.forEach((location) => {
      const { startLocations, endLocations, deliveryId } = location;
      const numDeliveries = Math.max(
        startLocations?.length || 0,
        endLocations?.length || 0
      );

      for (let i = 0; i < numDeliveries; i++) {
        const startLocation = startLocations?.[i];
        const endLocation = endLocations?.[i];

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
              strokeColor: "#EF4444",
              strokeOpacity: 0.8,
              strokeWeight: 2,
            },
            deliveryId,
          });
        }
      }
    });
  }

  // Render filter content
  const renderFilterContent = () => (
    <div className="space-y-4">
      {/* Search */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Search Invoice/Customer
        </label>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          placeholder="Invoice or Customer..."
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-400"
        />
      </div>

      {/* Delivery Status */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Delivery Status
        </label>
        <select
          value={deliveryStatusFilter}
          onChange={(e) => {
            setDeliveryStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-400"
        >
          <option value="">All</option>
          <option value="Pending">Pending</option>
          <option value="Partially Delivered">Partially Delivered</option>
          <option value="Delivered">Delivered</option>
        </select>
      </div>

      {/* Payment Status */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Payment Status
        </label>
        <select
          value={paymentStatusFilter}
          onChange={(e) => {
            setPaymentStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-400"
        >
          <option value="">All</option>
          <option value="Unpaid">Unpaid</option>
          <option value="Partial">Partial</option>
          <option value="Paid">Paid</option>
        </select>
      </div>

      {/* Date From */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Date From
        </label>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => {
            setDateFrom(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-400"
        />
      </div>

      {/* Date To */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Date To
        </label>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => {
            setDateTo(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-400"
        />
      </div>

      {/* Sort By */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Sort By
        </label>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-400"
        >
          <option value="invoiceDate">Invoice Date</option>
          <option value="expectedDeliveryDate">Expected Delivery</option>
          <option value="customerName">Customer Name</option>
          <option value="billingAmount">Billing Amount</option>
          <option value="deliveryStatus">Delivery Status</option>
          <option value="paymentStatus">Payment Status</option>
        </select>
      </div>

      {/* Sort Order */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Sort Order
        </label>
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-400"
        >
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
      </div>

      {/* Items Per Page */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Items Per Page
        </label>
        <select
          value={itemsPerPage}
          onChange={(e) => {
            setItemsPerPage(Number(e.target.value));
            setCurrentPage(1);
          }}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-400"
        >
          <option value="10">10</option>
          <option value="25">25</option>
          <option value="50">50</option>
          <option value="100">100</option>
        </select>
      </div>

      <div className="flex flex-col gap-2 pt-2">
        <button
          onClick={() => {
            fetchBills();
            if (isMobile) setShowFilterSidebar(false);
          }}
          className="w-full px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-md hover:bg-red-600 transition-colors"
        >
          Apply Filters
        </button>
        <button
          onClick={() => {
            handleResetFilters();
            if (isMobile) setShowFilterSidebar(false);
          }}
          className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
        >
          Reset Filters
        </button>
      </div>
    </div>
  );

  // Render filters for desktop
  const renderDesktopFilters = () => (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Search Invoice/Customer
          </label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Invoice or Customer..."
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-400"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Delivery Status
          </label>
          <select
            value={deliveryStatusFilter}
            onChange={(e) => {
              setDeliveryStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-400"
          >
            <option value="">All</option>
            <option value="Pending">Pending</option>
            <option value="Partially Delivered">Partially Delivered</option>
            <option value="Delivered">Delivered</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Payment Status
          </label>
          <select
            value={paymentStatusFilter}
            onChange={(e) => {
              setPaymentStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-400"
          >
            <option value="">All</option>
            <option value="Unpaid">Unpaid</option>
            <option value="Partial">Partial</option>
            <option value="Paid">Paid</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Date From
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-400"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Date To
          </label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-400"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Sort By
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-400"
          >
            <option value="invoiceDate">Invoice Date</option>
            <option value="expectedDeliveryDate">Expected Delivery</option>
            <option value="customerName">Customer Name</option>
            <option value="billingAmount">Billing Amount</option>
            <option value="deliveryStatus">Delivery Status</option>
            <option value="paymentStatus">Payment Status</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Sort Order
          </label>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-400"
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Items Per Page
          </label>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-400"
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={handleResetFilters}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
        >
          Reset Filters
        </button>
        <button
          onClick={fetchBills}
          className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-md hover:bg-red-600 transition-colors"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );

  // Render mobile filter sidebar
  const renderMobileFilterSidebar = () => (
    <>
      {/* Overlay */}
      {showFilterSidebar && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setShowFilterSidebar(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-80 bg-white shadow-xl z-50 transform transition-transform duration-300 ${
          showFilterSidebar ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
            <button
              onClick={() => setShowFilterSidebar(false)}
              className="p-1 text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Filter Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {renderFilterContent()}
          </div>
        </div>
      </div>
    </>
  );

  // Render table view (desktop)
  const renderTableView = () => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Invoice No
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Delivery IDs
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Delivery Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Payment Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {bills.map((bill) => (
              <tr key={bill._id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                  {bill.invoiceNo}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                  {bill.customerName}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                  {new Date(bill.invoiceDate).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  <div className="flex flex-wrap gap-1">
                    {bill.deliveries && bill.deliveries.length > 0 ? (
                      bill.deliveries.map((delivery, idx) => (
                        <span
                          key={idx}
                          className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded"
                        >
                          {delivery.deliveryId}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-400 italic">No deliveries</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                  ₹{(bill.billingAmount - (bill.discount || 0)).toFixed(2)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      bill.deliveryStatus === "Delivered"
                        ? "bg-green-100 text-green-800"
                        : bill.deliveryStatus === "Partially Delivered"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {bill.deliveryStatus}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      bill.paymentStatus === "Paid"
                        ? "bg-green-100 text-green-800"
                        : bill.paymentStatus === "Partial"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {bill.paymentStatus}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm">
                  <button
                    onClick={() => handleViewDetails(bill)}
                    className="text-red-600 hover:text-red-800 font-medium"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Render card view (mobile)
  const renderCardView = () => (
    <div className="space-y-4">
      {bills.map((bill) => (
        <div key={bill._id} className="bg-white rounded-lg shadow-md p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="text-sm font-bold text-gray-900">{bill.invoiceNo}</h3>
              <p className="text-xs text-gray-600 mt-1">{bill.customerName}</p>
            </div>
            <div className="flex gap-2">
              <span
                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  bill.deliveryStatus === "Delivered"
                    ? "bg-green-100 text-green-800"
                    : bill.deliveryStatus === "Partially Delivered"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {bill.deliveryStatus}
              </span>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Date:</span>
              <span className="font-medium text-gray-900">
                {new Date(bill.invoiceDate).toLocaleDateString()}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">Amount:</span>
              <span className="font-medium text-gray-900">
                ₹{(bill.billingAmount - (bill.discount || 0)).toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-600">Payment:</span>
              <span
                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  bill.paymentStatus === "Paid"
                    ? "bg-green-100 text-green-800"
                    : bill.paymentStatus === "Partial"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {bill.paymentStatus}
              </span>
            </div>

            <div>
              <span className="text-gray-600 block mb-1">Delivery IDs:</span>
              <div className="flex flex-wrap gap-1">
                {bill.deliveries && bill.deliveries.length > 0 ? (
                  bill.deliveries.map((delivery, idx) => (
                    <span
                      key={idx}
                      className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded"
                    >
                      {delivery.deliveryId}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-gray-400 italic">No deliveries</span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={() => handleViewDetails(bill)}
            className="mt-3 w-full px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-md hover:bg-red-600 transition-colors"
          >
            View Details
          </button>
        </div>
      ))}
    </div>
  );

  // Render pagination
  const renderPagination = () => (
    <div className="bg-white rounded-lg shadow-md p-4 mt-4">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="text-sm text-gray-700">
          Showing {bills.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to{" "}
          {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} results
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <div className="flex gap-1">
            {[...Array(Math.min(5, totalPages))].map((_, idx) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = idx + 1;
              } else if (currentPage <= 3) {
                pageNum = idx + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + idx;
              } else {
                pageNum = currentPage - 2 + idx;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    currentPage === pageNum
                      ? "bg-red-500 text-white"
                      : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );

  // Render detail modal
  const renderDetailModal = () => {
    if (!showDetailModal || !selectedBill) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-0 md:pt-12">
        <div className="bg-white w-full h-full md:h-[95vh] md:rounded-lg shadow-xl flex flex-col md:max-w-[95vw]">
          {/* Header - Fixed */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-4 md:px-6 py-4 flex justify-between items-center z-10">
            <div className="flex items-center gap-3">
              <div className="hidden md:block w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Package className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-bold text-gray-900">
                  Invoice: {selectedBill.invoiceNo}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {selectedBill.customerName}
                </p>
              </div>
            </div>
            <button
              onClick={handleCloseModal}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 md:py-6">
            <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
              {/* Billing Information */}
              <div className="bg-white border border-gray-200 rounded-lg">
                <button
                  onClick={() => toggleSection('billing')}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-blue-600" />
                    </div>
                    <h3 className="text-base md:text-lg font-semibold text-gray-800">
                      Billing Information
                    </h3>
                  </div>
                  {expandedSections.billing ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </button>

                {expandedSections.billing && (
                  <div className="px-4 pb-4 border-t border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                      <div className="flex items-start gap-3">
                        <Calendar className="w-4 h-4 text-gray-400 mt-1" />
                        <div>
                          <p className="text-xs text-gray-500">Invoice Date</p>
                          <p className="text-sm font-medium text-gray-900 mt-0.5">
                            {new Date(selectedBill.invoiceDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Calendar className="w-4 h-4 text-gray-400 mt-1" />
                        <div>
                          <p className="text-xs text-gray-500">Expected Delivery</p>
                          <p className="text-sm font-medium text-gray-900 mt-0.5">
                            {new Date(selectedBill.expectedDeliveryDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <DollarSign className="w-4 h-4 text-gray-400 mt-1" />
                        <div>
                          <p className="text-xs text-gray-500">Total Amount</p>
                          <p className="text-sm font-semibold text-gray-900 mt-0.5">
                            ₹{(selectedBill.billingAmount - (selectedBill.discount || 0)).toFixed(2)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-4 h-4 text-gray-400 mt-1">📱</div>
                        <div>
                          <p className="text-xs text-gray-500">Contact Number</p>
                          <p className="text-sm font-medium text-gray-900 mt-0.5">
                            {selectedBill.customerContactNumber || "N/A"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 md:col-span-2">
                        <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                        <div>
                          <p className="text-xs text-gray-500">Delivery Address</p>
                          <p className="text-sm font-medium text-gray-900 mt-0.5">
                            {selectedBill.customerAddress}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-4 h-4 text-gray-400 mt-1">📦</div>
                        <div>
                          <p className="text-xs text-gray-500">Delivery Status</p>
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${
                              selectedBill.deliveryStatus === "Delivered"
                                ? "bg-green-100 text-green-800"
                                : selectedBill.deliveryStatus === "Partially Delivered"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {selectedBill.deliveryStatus}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-4 h-4 text-gray-400 mt-1">💳</div>
                        <div>
                          <p className="text-xs text-gray-500">Payment Status</p>
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${
                              selectedBill.paymentStatus === "Paid"
                                ? "bg-green-100 text-green-800"
                                : selectedBill.paymentStatus === "Partial"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {selectedBill.paymentStatus}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Products */}
              {selectedBill.products && selectedBill.products.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg">
                  <button
                    onClick={() => toggleSection('products')}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Package className="w-4 h-4 text-purple-600" />
                      </div>
                      <h3 className="text-base md:text-lg font-semibold text-gray-800">
                        Products ({selectedBill.products.length})
                      </h3>
                    </div>
                    {expandedSections.products ? (
                      <ChevronUp className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    )}
                  </button>

                  {expandedSections.products && (
                    <div className="px-4 pb-4 border-t border-gray-100">
                      <div className="mt-4 overflow-x-auto">
                        <table className="min-w-full text-sm border border-gray-200 rounded-lg">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-b">
                                Product Name
                              </th>
                              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 border-b">
                                Ordered
                              </th>
                              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 border-b">
                                Delivered
                              </th>
                              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 border-b">
                                Status
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {selectedBill.products.map((product, idx) => (
                              <tr key={idx} className="hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium text-gray-900">
                                  {product.name}
                                </td>
                                <td className="px-4 py-3 text-center text-gray-700">
                                  {product.quantity}
                                </td>
                                <td className="px-4 py-3 text-center text-gray-700">
                                  {product.deliveredQuantity}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span
                                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                      product.deliveryStatus === "Delivered"
                                        ? "bg-green-100 text-green-800"
                                        : "bg-yellow-100 text-yellow-800"
                                    }`}
                                  >
                                    {product.deliveryStatus}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Deliveries */}
              {selectedBill.deliveries && selectedBill.deliveries.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg">
                  <button
                    onClick={() => toggleSection('deliveries')}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                        <Truck className="w-4 h-4 text-orange-600" />
                      </div>
                      <h3 className="text-base md:text-lg font-semibold text-gray-800">
                        Delivery Details ({selectedBill.deliveries.length})
                      </h3>
                    </div>
                    {expandedSections.deliveries ? (
                      <ChevronUp className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    )}
                  </button>

                  {expandedSections.deliveries && (
                    <div className="px-4 pb-4 border-t border-gray-100">
                      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {selectedBill.deliveries.map((delivery, idx) => (
                          <div
                            key={idx}
                            className="border border-gray-200 rounded-lg p-4 bg-gradient-to-br from-gray-50 to-white hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                  <span className="text-xs font-bold text-blue-600">
                                    {idx + 1}
                                  </span>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Delivery ID</p>
                                  <p className="text-sm font-semibold text-blue-600">
                                    {delivery.deliveryId}
                                  </p>
                                </div>
                              </div>
                              <span
                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  delivery.deliveryStatus === "Delivered"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {delivery.deliveryStatus || "Pending"}
                              </span>
                            </div>

                            <div className="space-y-2">
                              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                <span className="text-xs text-gray-600">Driver</span>
                                <span className="text-sm font-medium text-gray-900">
                                  {delivery.driverName || "Not Assigned"}
                                </span>
                              </div>

                              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                <span className="text-xs text-gray-600">Vehicle</span>
                                <span className="text-sm font-medium text-gray-900">
                                  {delivery.vehicleNumber || "N/A"}
                                </span>
                              </div>

                              {delivery.kmTravelled && (
                                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                  <span className="text-xs text-gray-600">Distance</span>
                                  <span className="text-sm font-medium text-gray-900">
                                    {delivery.kmTravelled} km
                                  </span>
                                </div>
                              )}

                              {delivery.fuelCharge && (
                                <div className="flex justify-between items-center py-2">
                                  <span className="text-xs text-gray-600">Fuel Charge</span>
                                  <span className="text-sm font-semibold text-green-600">
                                    ₹{delivery.fuelCharge}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Location Tracking */}
              {locationData && locationData.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg">
                  <button
                    onClick={() => toggleSection('tracking')}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <MapPin className="w-4 h-4 text-green-600" />
                      </div>
                      <h3 className="text-base md:text-lg font-semibold text-gray-800">
                        Live Location Tracking
                      </h3>
                    </div>
                    {expandedSections.tracking ? (
                      <ChevronUp className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    )}
                  </button>

                  {expandedSections.tracking && (
                    <div className="px-4 pb-4 border-t border-gray-100">
                      <div className="mt-4">
                        <DriverTracking
                          locationData={locationData}
                          billingDetails={selectedBill}
                          markers={markers}
                          polylines={polylines}
                          handleFilter={setFilteredDeliveryId}
                          handleResetFilter={() => setFilteredDeliveryId(null)}
                          filteredDeliveryId={filteredDeliveryId}
                          mapContainerStyle={{ 
                            width: "100%", 
                            height: isMobile ? "350px" : "500px",
                            borderRadius: "8px"
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Footer - Fixed (Optional) */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 md:px-6 py-3 flex justify-start gap-3">
            <button
              onClick={handleCloseModal}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4 px-4 sm:px-6 lg:px-8">
      {/* Mobile Filter Sidebar */}
      {isMobile && renderMobileFilterSidebar()}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Driver Tracking Dashboard
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              View and track all bills with delivery information
            </p>
          </div>

          {/* Mobile Filter Button */}
          {isMobile && (
            <button
              onClick={() => setShowFilterSidebar(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-md hover:bg-red-600 transition-colors"
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
          )}
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Desktop Filters */}
        {!isMobile && renderDesktopFilters()}

        {/* Loading State */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
          </div>
        ) : bills.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-sm">
              No bills found matching your criteria
            </p>
          </div>
        ) : (
          <>
            {/* Table/Card View */}
            {isMobile ? renderCardView() : renderTableView()}

            {/* Pagination */}
            {renderPagination()}
          </>
        )}

        {/* Detail Modal */}
        {renderDetailModal()}
      </div>
    </div>
  );
};

export default DriverTrackingPage;