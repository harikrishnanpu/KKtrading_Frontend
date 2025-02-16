import { Button } from '@mui/material';
import React, { useState } from 'react';
import { useNavigate } from 'react-router';

export default function Product({ product }) {
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);

  return (
    <div onClick={()=> navigate(`/products/${product._id}`)} className="bg-white cursor-pointer shadow-md rounded-lg p-3 flex flex-col items-center space-y-2 transition-transform hover:scale-105 w-full">
      {/* Product Image */}
      <p  className="w-full">
        <img
          onError={() => setImageError(true)}
          className={`object-cover rounded-md w-full h-32 ${imageError ? 'hidden' : ''}`}
          src={`${product.image}`}
          alt={product.image}
        />
        {imageError && (
          <div className="flex justify-center items-center w-full h-32 bg-gray-200 rounded-md">
            <p className="text-gray-500 text-sm">No image</p>
          </div>
        )}
      </p>

      {/* Product Details */}
      <div className="w-full text-center p-2">
        <a>
          <h2 className="text-xs font-bold text-red-500 truncate">{product.name}</h2>
        </a>

        <div className="text-xs text-gray-500 mt-1 truncate">{product.brand}</div>
        <div className="text-xs text-gray-500 mt-1 truncate">{product.category}</div>
        <div className="text-xs text-gray-500 mt-1 truncate">{product.countInStock} Nos</div>
      </div>
    </div>
  );
}
