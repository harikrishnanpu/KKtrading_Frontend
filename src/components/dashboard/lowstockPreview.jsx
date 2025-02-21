import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from 'pages/api';

const LowStockPreview = ({ driverPage, adminPage }) => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [billings, setBillings] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {

    const fetchExpectedDeliveryBillings = async () => {
      try {
        const lowstock = await api.get('/api/products/items/need-to-purchase');
        const exdelivery = await api.get('/api/billing/deliveries/expected-delivery');

        setProducts(lowstock.data);
        setBillings(exdelivery.data);

        setLoading(false);
      } catch (err) {
        setError('Error fetching data. Please try again.');
        setLoading(false);
      }
    };

    fetchExpectedDeliveryBillings();
  }, []);

  const isToday = (dateString) => {
    const today = new Date();
    const targetDate = new Date(dateString);
    return (
      today.getFullYear() === targetDate.getFullYear() &&
      today.getMonth() === targetDate.getMonth() &&
      today.getDate() === targetDate.getDate()
    );
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (error) return <div className="text-center text-red-500">{error}</div>;

  if (loading && !products.length && !billings.length) {
    return (
      <div className="p-6 shadow-sm border border-gray-300 rounded-lg bg-white mb-10 mx-auto">
        {!driverPage && (
          <p className="text-sm font-bold mb-4 text-gray-600 text-center animate-pulse">
            Loading Updates...
          </p>
        )}
        <div className={`grid ${driverPage || adminPage ? 'md:grid-cols-1' : 'md:grid-cols-2'} gap-6`}>
          {!driverPage && (
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold mb-4 text-gray-700 flex items-center">
                <i className="fa fa-cube mr-2 text-blue-800"></i> Need To Purchase Products
              </h3>
              {[1, 2, 3].map((item) => (
                <div key={item} className="flex items-center animate-pulse p-3 border-b border-gray-200">
                  <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                  <div className="ml-4 flex-1 space-y-2">
                    <div className="h-3 bg-gray-300 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
              <div className="mt-4 text-center">
                <div className="h-4 w-20 bg-gray-300 rounded mx-auto"></div>
              </div>
            </div>
          )}

          {!adminPage && (
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold mb-4 text-gray-700 flex items-center">
                <i className="fa fa-truck mr-2 text-green-500"></i> Upcoming Deliveries
              </h3>
              {[1, 2, 3].map((item) => (
                <div key={item} className="flex items-center animate-pulse p-3 border-b border-gray-200">
                  <div className="w-10 h-10 bg-gray-300 rounded"></div>
                  <div className="ml-4 flex-1 space-y-2">
                    <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-300 rounded w-1/3"></div>
                  </div>
                </div>
              ))}
              <div className="mt-4 text-center">
                <div className="h-4 w-40 bg-gray-300 rounded mx-auto"></div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 shadow-sm border border-gray-300 rounded-lg bg-white mb-10 mx-auto">
      {!driverPage && <p className="text-sm font-bold mb-4 text-gray-600 text-center">Need To Purchase & Deliveries</p>}

      <div className={`grid ${driverPage || adminPage ? 'md:grid-cols-1' : 'md:grid-cols-2'} gap-6`}>
        {!driverPage && (
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold mb-4 text-gray-700 flex items-center">
              <i className="fa fa-cube mr-2 text-blue-800"></i> Need To Purchase Products
            </h3>
            {filteredProducts.length === 0 ? (
              <p className="text-sm text-gray-400 text-center">No Products Found</p>
            ) : (
              filteredProducts.map((product) => (
                <div
                  onClick={() => navigate(`/invoice/need-to-purchase`)}
                  key={product.item_id}
                  className="flex cursor-pointer hover:bg-gray-100 rounded-md justify-between items-center p-3 border-b border-gray-200"
                >
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-gray-600">{product.name.slice(0, 20)}...</p>
                    <p className="text-xs text-red-500">Needed: {product.quantityNeeded} Nos</p>
                    <p className="text-xs text-gray-500">Item ID: {product.item_id}</p>
                  </div>
                  {product.countInStock < 5 && (
                    <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded-lg animate-pulse">
                      Low Stock
                    </span>
                  )}
                </div>
              ))
            )}
            <Link to="/invoice/need-to-purchase" className="block text-xs mt-4 text-center text-blue-500 font-bold hover:underline">
              View More
            </Link>
          </div>
        )}

        {!adminPage && (
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold mb-4 text-gray-700 flex items-center">
              <i className="fa fa-truck mr-2 text-green-500"></i> Upcoming Deliveries
            </h3>
            {billings.length === 0 ? (
              <p className="text-sm text-gray-400 text-center">No Upcoming Deliveries</p>
            ) : (
              billings.map((bill) => (
                <div
                  onClick={() => navigate(`/invoice/details/${bill._id}`)}
                  key={bill.invoiceNo}
                  className="flex cursor-pointer hover:bg-gray-100 rounded-md justify-between items-center p-3 border-b border-gray-200"
                >
                  <div>
                    <p className="text-xs font-bold text-gray-600">Invoice No. {bill.invoiceNo}</p>
                    <p className={`text-xs ${isToday(bill.expectedDeliveryDate) ? 'text-red-600' : 'text-yellow-600'}`}>
                      {isToday(bill.expectedDeliveryDate)
                        ? 'Expected Delivery Date: Today'
                        : `Expected Delivery Date: ${new Date(bill.expectedDeliveryDate).toLocaleDateString()}`}
                    </p>
                    <p className="text-xs font-medium text-gray-500">Location: {bill.customerAddress}</p>
                  </div>
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded-lg ${
                      isToday(bill.expectedDeliveryDate)
                        ? 'text-red-600 bg-red-100 animate-pulse'
                        : 'text-yellow-600 bg-yellow-100'
                    }`}
                  >
                    {isToday(bill.expectedDeliveryDate)
                      ? 'Today'
                      : new Date(bill.expectedDeliveryDate).toLocaleDateString()}
                  </span>
                </div>
              ))
            )}
            <Link to="/products/upcomming/lowstock" className="block mt-4 text-xs text-center text-blue-500 font-bold hover:underline">
              View Upcoming Deliveries
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default LowStockPreview;
