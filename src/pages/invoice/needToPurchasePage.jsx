// src/pages/NeedToPurchaseList.js
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { format } from 'date-fns';
import useAuth from 'hooks/useAuth';

const NeedToPurchaseList = () => {
  const navigate = useNavigate();
  const { user: userInfo } = useAuth();
  const [billings, setBillings] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch billings and products concurrently
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [billingRes, productRes] = await Promise.all([
          api.get('/api/billing'),
          api.get('/api/products/product/all'),
        ]);
        setBillings(billingRes.data);
        setProducts(productRes.data);
      } catch (err) {
        setError('Failed to fetch data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Build a mapping for product details by item_id (for image, etc.)
  const productMap = useMemo(() => {
    const map = {};
    products.forEach((prod) => {
      map[prod.item_id] = prod;
    });
    return map;
  }, [products]);

  // Flatten the needed-to-purchase items from all billings.
  // We only want items where purchased or verified is false.
  const neededItems = useMemo(() => {
    return billings.flatMap((billing) => {
      if (!billing.neededToPurchase || billing.neededToPurchase.length === 0) {
        return [];
      }
      // Filter items that are NOT both purchased AND verified.
      const filteredItems = billing.neededToPurchase.filter(
        (item) => !item.purchased || !item.verified
      );
      // For each such item, add invoice info so we can show the invoice number and link to details.
      return filteredItems?.map((item) => ({
        ...item,
        invoiceNo: billing.invoiceNo,
        invoiceDate: billing.invoiceDate,
        billingId: billing._id,
        customer: billing.customerName
      }));
    });
  }, [billings]);

  if (loading) {
    return (
      <div className="p-6">
        <Skeleton height={40} count={5} />
      </div>
    );
  }

  if (error) {
    return <div className="p-6 text-red-500">{error}</div>;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Products Needed to Purchase</h1>
      {neededItems.length === 0 ? (
        <p>No products require ordering at this time.</p>
      ) : (
        <table className="min-w-full bg-white shadow rounded-lg overflow-hidden">
          <thead className="bg-red-600 text-white">
            <tr>
              <th className="px-4 py-2">Invoice No</th>
              <th className="px-4 py-2">Customer</th>
              <th className="px-4 py-2">ItemId</th>
              <th className="px-4 py-2">Product Image</th>
              <th className="px-4 py-2">Product Name</th>
              <th className="px-4 py-2">Ordered Qty</th>
              <th className="px-4 py-2">Needed Qty</th>
              <th className="px-4 py-2">Purchased</th>
              <th className="px-4 py-2">Verified</th>
            </tr>
          </thead>
          <tbody>
            {neededItems.map((item, index) => {
              const product = productMap[item.item_id] || {};
              return (
                <tr key={index} className="border-b hover:bg-gray-100">
                  <td
                    className="px-4 py-2 cursor-pointer text-blue-600 hover:underline"
                    onClick={() => navigate(`/invoice/details/${item.billingId}`)}
                  >
                    {item.invoiceNo}
                  </td>
                  <td className="px-4 py-2">{item.customer}</td>
                  <td className="px-4 py-2">{item.item_id}</td>

                  <td className="px-4 py-2">
  {product?.image?.length > 10 ? (
    <img
      src={product.image}
      alt={product.name}
      className="h-12 w-12 object-cover rounded"
    />
  ) : (
    <div className="h-12 w-50 bg-gray-300 flex items-center justify-center rounded">
      No Image
    </div>
  )}
</td>

                  <td className="px-4 py-2">{item.name}</td>
                  <td className="px-4 py-2">{item.quantityOrdered}</td>
                  <td className="px-4 py-2">{item.quantityNeeded}</td>
                  <td className="px-4 py-2">{item.purchased ? 'Yes' : 'No'}</td>
                  <td className="px-4 py-2">{item.verified ? 'Yes' : 'No'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default NeedToPurchaseList;
