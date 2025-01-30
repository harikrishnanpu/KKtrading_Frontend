import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import LoadingBox from 'components/Loader';
import MessageBox from 'components/MessageBox';
import api from '../api';
import useAuth from 'hooks/useAuth';

export default function ProductScreen(props) {
  const navigate = useNavigate();
  const params = useParams();
  const { id: productId } = params;

  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [soldOut, setSoldOut] = useState(null);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false); 
  const [error, setError] = useState(null); 

  const { user: userInfo } = useAuth();

  const deleteHandler = async (product) => {
    if (window.confirm('Are you sure to delete?')) {
      try {
        await api.delete(`/api/products/${product._id}`);
        navigate('/products/all');
      } catch (err) {
        console.error('Error deleting product:', err);
        alert('Error deleting product');
      }
    }
  };

  useEffect(() => {
    // Fetch product's sold out details + product data
    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        // 1) Check sold out status
        const soldOutRes = await api.get(`/api/billing/product/get-sold-out/${productId}`);
        setSoldOut(soldOutRes.data);

        // 2) Fetch product info
        const productRes = await api.get(`/api/products/${productId}`);
        setProduct(productRes.data);
      } catch (err) {
        console.error('Error fetching product data:', err);
        setError('Product Not found');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [productId]);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Container for everything */}
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Product + Image Section */}
        {loading ? (
          <div className="flex justify-center items-center min-h-[200px]">
            <i className="fa fa-spinner fa-spin text-2xl text-gray-500" />
          </div>
        ) : error || !product ? (
          // Display when there's an error or product not found
          <div className="flex flex-col items-center justify-center text-center bg-white border border-gray-200 rounded-lg shadow-sm p-8">
            <p className="text-lg font-bold text-gray-700 mb-4">
              {error || 'Product Not found'}
            </p>
            <p className="text-sm  text-gray-700 mb-4">Product Id: {productId}</p>
            <Link
              to="/products/all"
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
            >
              See All Products
            </Link>
          </div>
        ) : (
          // Display product details when product is successfully fetched
          <div className="bg-white border border-gray-200 rounded-lg shadow-md p-4 md:p-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Image Container */}
              <div className="flex-1 flex justify-center items-center relative">
                {/* Stock Badge */}
                {product && (
                  <span
                    className={`absolute top-2 right-2 z-10 px-3 py-1 text-xs font-semibold text-white rounded-full shadow ${
                      product.countInStock > 10
                        ? 'bg-green-600'
                        : product.countInStock === 0
                        ? 'bg-red-600'
                        : 'bg-yellow-500'
                    }`}
                  >
                    {product.countInStock > 10
                      ? 'In Stock'
                      : product.countInStock === 0
                      ? 'Out Of Stock'
                      : 'Low Stock'}
                  </span>
                )}
                {/* Image */}
                <a
                  href={`${product.image}`}
                  className="block w-full h-64 md:h-72 bg-gray-200 rounded-lg overflow-hidden relative"
                >
                  {!isImageLoaded && !isError && (
                    <div className="absolute inset-0 bg-gray-300 animate-pulse" />
                  )}
                  {isError ? (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <span>No image found</span>
                    </div>
                  ) : (
                    <img
                      src={`${product.image}`}
                      alt={product.name || 'Product Image'}
                      className={`w-full h-full object-cover transition-transform duration-300 ${
                        isImageLoaded ? 'scale-100' : 'scale-105'
                      }`}
                      onLoad={() => setIsImageLoaded(true)}
                      onError={() => {
                        setIsImageLoaded(false);
                        setIsError(true);
                      }}
                    />
                  )}
                </a>
              </div>

              {/* Product Details */}
              <div className="flex-1 space-y-4">
                {/* Product Info */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-1">
                    Product ID:&nbsp;
                    <span className="text-gray-800">{product.item_id}</span>
                  </p>
                  <h2 className="text-lg font-semibold text-gray-800">
                    {product.name}
                  </h2>
                  <div className="flex flex-wrap items-center gap-4 text-sm mt-2">
                    <p className="text-gray-600">
                      <span className="font-medium text-gray-700">Brand:</span>{' '}
                      {product.brand}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium text-gray-700">
                        Category:
                      </span>{' '}
                      {product.category}
                    </p>
                  </div>
                </div>

                {/* Units & Sizes */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-600">
                      <span className="font-medium text-gray-700">P Unit:</span>{' '}
                      {product.pUnit}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium text-gray-700">S Unit:</span>{' '}
                      {product.sUnit}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium text-gray-700">
                        P-S Ratio:
                      </span>{' '}
                      {product.psRatio}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">
                      <span className="font-medium text-gray-700">Size:</span>{' '}
                      {product.size}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium text-gray-700">Unit:</span>{' '}
                      {product.unit}
                    </p>
                  </div>
                </div>

                {/* Dimensions */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-600">
                      <span className="font-medium text-gray-700">
                        Length:
                      </span>{' '}
                      {product.length}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium text-gray-700">
                        Breadth:
                      </span>{' '}
                      {product.breadth}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">
                      <span className="font-medium text-gray-700">
                        Act Length:
                      </span>{' '}
                      {product.actLength}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium text-gray-700">
                        Act Breadth:
                      </span>{' '}
                      {product.actBreadth}
                    </p>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-600">
                      <span className="font-medium text-gray-700">Type:</span>{' '}
                      {product.type}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">
                      <span className="font-medium text-gray-700">
                        GST Percent:
                      </span>{' '}
                      {product.gstPercent}
                    </p>
                  </div>
                </div>

                {/* Description */}
                {product.description && (
                  <div className="border-t pt-4">
                    <p className="text-xs uppercase font-bold text-gray-400 mb-1">
                      Description
                    </p>
                    <p className="text-sm text-gray-700 whitespace-pre-line">
                      {product.description}
                    </p>
                  </div>
                )}

                {/* Stock info */}
                <div className="border-t pt-4 text-sm">
                  <p className="text-xs uppercase font-bold text-gray-400 mb-2">
                    Stock Details
                  </p>
                  <div className="flex justify-between items-center">
                    <div>
                      <p
                        className={`font-bold ${
                          product.countInStock > 10
                            ? 'text-green-600'
                            : product.countInStock === 0
                            ? 'text-red-600'
                            : 'text-yellow-700'
                        }`}
                      >
                        In Stock: {product.countInStock}
                      </p>
                    </div>
                    <p className="text-xs font-semibold text-gray-500">
                      Stock Cleared: {soldOut ? soldOut.totalQuantity : 0}
                    </p>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex flex-wrap items-center gap-3 pt-4">
                  {/* Preview Button */}
                  <button
                    onClick={() => navigate(`/products/${product._id}/preview`)}
                    className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-md shadow hover:bg-red-700 transition focus:outline-none"
                  >
                    Preview
                    <i className="fa fa-eye ml-2" />
                  </button>

                  {/* Edit Button */}
                  <button
                    onClick={() => {
                      if (userInfo.isAdmin) {
                        navigate(`/products/edit/${product._id}`);
                      } else {
                        alert('You need to be admin to edit this product.');
                      }
                    }}
                    className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-md shadow hover:bg-red-700 transition focus:outline-none"
                  >
                    Edit Product
                    <i className="fa fa-arrow-right ml-2" />
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={() => {
                      if (userInfo.isAdmin) {
                        deleteHandler(product);
                      } else {
                        alert('You need to be admin to delete this product.');
                      }
                    }}
                    className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-md shadow hover:bg-red-700 transition focus:outline-none"
                  >
                    <i className="fa fa-trash mr-1" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Link to Search Another Product */}
        <div className="text-center">
          <Link
            to="/products/all"
            className="inline-block text-xs font-bold text-gray-400 hover:text-red-500 transition"
          >
            Search Another Product? <span className="text-red-500">Click Here</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
