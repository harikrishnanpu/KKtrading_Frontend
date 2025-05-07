// src/screens/SearchScreen.js

import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import LoadingBox from 'components/Loader';
import MessageBox from 'components/MessageBox';
import Product from 'components/products/product';
import SearchBox from 'components/products/searchBox';
import SkeletonProduct from 'components/products/skeleton';
import api from '../api';
import useAuth from 'hooks/useAuth';
import { Sort } from 'iconsax-react';

export default function SearchScreen() {
  const navigate = useNavigate();
  const {
    name = 'all',
    category = 'all',
    brand = 'all',
    size = 'all',
    min = 0,
    max = 0,
    rating = 0,
    order = 'newest',
    inStock = 'all',
    countInStockMin = 0,
    pageNumber = 1,
  } = useParams();

  const [jumpPage, setJumpPage] = useState(pageNumber);
  const [priceMin, setPriceMin] = useState(min);
  const [priceMax, setPriceMax] = useState(max);
  const [stockMin, setStockMin] = useState(countInStockMin);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [loadingSizes, setLoadingSizes] = useState(false);
  const [error, setError] = useState('');
  const [errorCategories, setErrorCategories] = useState('');
  const [errorBrands, setErrorBrands] = useState('');
  const [errorSizes, setErrorSizes] = useState('');
  const [page, setPage] = useState(pageNumber);
  const [pages, setPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  const { user: userInfo } = useAuth();

  // Fetch filter data (categories, brands, sizes)
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        setLoadingCategories(true);
        setLoadingBrands(true);
        setLoadingSizes(true);

        const [categoriesRes, brandsRes, sizesRes] = await Promise.all([
          api.get('/api/products/categories'),
          api.get('/api/products/brands'),
          api.get('/api/products/sizes'),
        ]);

        setCategories(categoriesRes.data);
        setBrands(brandsRes.data);
        setSizes(sizesRes.data);

        setLoadingCategories(false);
        setLoadingBrands(false);
        setLoadingSizes(false);
      } catch (err) {
        setErrorCategories(err.message);
        setErrorBrands(err.message);
        setErrorSizes(err.message);
        setLoadingCategories(false);
        setLoadingBrands(false);
        setLoadingSizes(false);
      }
    };

    fetchFilters();
  }, []);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(
          `/api/products?pageNumber=${pageNumber}&name=${name}&category=${category}&brand=${brand}&size=${size}&min=${min || 0}&max=${max || 0}&rating=${rating}&order=${order}&inStock=${inStock}&countInStockMin=${countInStockMin}`
        );

        setProducts(data.products);
        setPage(data.page);
        setPages(data.pages);
        setTotalProducts(data.totalProducts);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchProducts();
  }, [
    name,
    category,
    brand,
    size,
    min,
    max,
    rating,
    order,
    inStock,
    countInStockMin,
    pageNumber,
  ]);

  // Generate filter URL
  const getFilterUrl = (filter) => {
    const filterPage = filter.page || 1;
    const filterCategory = filter.category || category;
    const filterBrand = filter.brand || brand;
    const filterSize = filter.size || size;
    const filterName = filter.name || name;
    const filterRating = filter.rating || rating;
    const sortOrder = filter.order || order;
    const filterMin = filter.min ?? min;
    const filterMax = filter.max ?? max;
    const filterInStock =
      filter.inStock !== undefined ? filter.inStock : inStock;
    const filterCountInStockMin =
      filter.countInStockMin ?? countInStockMin;

    return `/search/category/${filterCategory}/brand/${filterBrand}/size/${filterSize}/name/${filterName}/min/${filterMin}/max/${filterMax}/rating/${filterRating}/order/${sortOrder}/inStock/${filterInStock}/countInStockMin/${filterCountInStockMin}/pageNumber/${filterPage}`;
  };

  // Handlers for filter changes
  const handleCategoryChange = (e) => {
    navigate(getFilterUrl({ category: e.target.value, page: 1 }));
  };

  const handleBrandChange = (e) => {
    navigate(getFilterUrl({ brand: e.target.value, page: 1 }));
  };

  const handleSizeChange = (e) => {
    navigate(getFilterUrl({ size: e.target.value, page: 1 }));
  };

  const handleSortChange = (e) => {
    navigate(getFilterUrl({ order: e.target.value, page: 1 }));
  };

  const handlePageInputChange = (e) => {
    setJumpPage(e.target.value);
  };

  const handleJumpToPage = () => {
    const pageNum = parseInt(jumpPage, 10);
    if (pageNum > 0 && pageNum <= pages) {
      navigate(getFilterUrl({ page: pageNum }));
    }
  };

  const handleMinPriceChange = (e) => {
    setPriceMin(e.target.value);
  };

  const handleMaxPriceChange = (e) => {
    setPriceMax(e.target.value);
  };

  const handlePriceFilter = () => {
    navigate(getFilterUrl({ min: priceMin, max: priceMax, page: 1 }));
  };

  const handleInStockChange = (e) => {
    navigate(
      getFilterUrl({
        inStock: e.target.checked ? 'true' : 'all',
        page: 1,
      })
    );
  };

  const handleStockMinChange = (e) => {
    setStockMin(e.target.value);
  };

  const handleStockFilter = () => {
    navigate(
      getFilterUrl({
        countInStockMin: stockMin,
        page: 1,
      })
    );
  };

  const handleRatingChange = (e) => {
    navigate(getFilterUrl({ rating: e.target.value, page: 1 }));
  };

  // Add Product handler
  const handleAddProduct = async () => {
    try {
      // Create product
      const { data } = await api.post('/api/products/');
      // Navigate to edit product page with the new product _id
      navigate(`/products/edit/${data._id}`);
    } catch (err) {
      console.error('Error creating product', err);
      alert('Error creating product');
    }
  };

  return (
    <div className="container mx-auto p-2">
      {/* Top bar (both desktop & mobile) */}
      <div className="p-4 flex items-center justify-between">
        {/* Page Title */}
        <div className="text-lg font-bold">Products</div>
        <div className="flex items-center space-x-2">
          {/* Show filter toggle in mobile only */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 lg:hidden"
          >
            <Sort />
          </button>
          {/* Add Product Button */}
         {userInfo.isAdmin && <button
            onClick={()=> navigate('/products/add')}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Add Product
          </button> }
        </div>
      </div>

      <div className="flex flex-col lg:flex-row">
        {/* Sidebar Overlay (on small screens) */}
        <div
          className={`fixed inset-0 z-40 transition-transform transform ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:relative lg:translate-x-0`}
          style={{ backgroundColor: sidebarOpen ? 'rgba(0,0,0,0.3)' : 'transparent' }}
          onClick={() => setSidebarOpen(false)}
        >
          {/* Actual Sidebar */}
          <div
            className="w-64 bg-white h-full shadow-lg lg:shadow-none lg:bg-transparent lg:h-auto overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button on Mobile */}
            <div className="flex justify-end p-4 lg:hidden">
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                <i className="fa fa-times text-xl" />
              </button>
            </div>

            {/* Filters Section */}
            <div className="p-4 pt-6 lg:pt-0 bg-white lg:bg-transparent">
              <h2 className="text-lg font-bold mb-4">Filters</h2>

              {/* Search Box */}
              <div className="mb-4">
                <SearchBox />
              </div>

              {/* Category Filter */}
              <div className="mb-4">
                <h3 className="font-bold mb-2">Category</h3>
                {loadingCategories ? (
                  <LoadingBox />
                ) : errorCategories ? (
                  <MessageBox variant="danger">{errorCategories}</MessageBox>
                ) : (
                  <select
                    value={category}
                    onChange={handleCategoryChange}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="all">All</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Brand Filter */}
              <div className="mb-4">
                <h3 className="font-bold mb-2">Brand</h3>
                {loadingBrands ? (
                  <LoadingBox />
                ) : errorBrands ? (
                  <MessageBox variant="danger">{errorBrands}</MessageBox>
                ) : (
                  <select
                    value={brand}
                    onChange={handleBrandChange}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="all">All</option>
                    {brands.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Size Filter */}
              <div className="mb-4">
                <h3 className="font-bold mb-2">Size</h3>
                {loadingSizes ? (
                  <LoadingBox />
                ) : errorSizes ? (
                  <MessageBox variant="danger">{errorSizes}</MessageBox>
                ) : (
                  <select
                    value={size}
                    onChange={handleSizeChange}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="all">All</option>
                    {sizes.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Price Filter */}
              <div className="mb-4">
                <h3 className="font-bold mb-2">Price</h3>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    min="0"
                    value={priceMin}
                    onChange={handleMinPriceChange}
                    placeholder="Min"
                    className="w-1/2 border border-gray-300 rounded-lg p-2 focus:outline-none"
                  />
                  <input
                    type="number"
                    min="0"
                    value={priceMax}
                    onChange={handleMaxPriceChange}
                    placeholder="Max"
                    className="w-1/2 border border-gray-300 rounded-lg p-2 focus:outline-none"
                  />
                </div>
                <button
                  onClick={handlePriceFilter}
                  className="mt-2 w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  Apply
                </button>
              </div>

              {/* Count In Stock Filter */}
              <div className="mb-4">
                <h3 className="font-bold mb-2">Stock Availability</h3>
                <input
                  type="number"
                  min="0"
                  value={stockMin}
                  onChange={handleStockMinChange}
                  placeholder="Min Quantity"
                  className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none"
                />
                <button
                  onClick={handleStockFilter}
                  className="mt-2 w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  Apply
                </button>
              </div>

              {/* In-Stock Only Filter */}
              <div className="mb-4">
                <h3 className="font-bold mb-2">Availability</h3>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={inStock === 'true'}
                    onChange={handleInStockChange}
                    className="mr-2"
                  />
                  <label>In Stock Only</label>
                </div>
              </div>

              {/* Rating Filter */}
              <div className="mb-4">
                <h3 className="font-bold mb-2">Rating</h3>
                <select
                  value={rating}
                  onChange={handleRatingChange}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="0">All Ratings</option>
                  <option value="1">1 star & up</option>
                  <option value="2">2 stars & up</option>
                  <option value="3">3 stars & up</option>
                  <option value="4">4 stars & up</option>
                  <option value="5">5 stars</option>
                </select>
              </div>

              {/* Sort Options */}
              <div className="mb-4">
                <h3 className="font-bold mb-2">Sort By</h3>
                <select
                  value={order}
                  onChange={handleSortChange}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="newest">Newest Arrivals</option>
                  <option value="lowest">Price: Low to High</option>
                  <option value="highest">Price: High to Low</option>
                  <option value="toprated">Avg. Customer Reviews</option>
                  <option value="countinstock">Stock Quantity</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 lg:ml-4 p-4">
          {/* Products Count or Error */}
          <div className="mb-4">
            {loading ? (
              <LoadingBox />
            ) : error ? (
              <MessageBox variant="danger">{error}</MessageBox>
            ) : (
              <p className="text-gray-400 text-sm">
                Showing: {totalProducts} results
              </p>
            )}
          </div>

          {/* Product Grid or Skeleton */}
          {loading && (
            <>
              {Array.from({ length: 10 }).map((_, index) => (
                <SkeletonProduct key={index} />
              ))}
            </>
          )}

          <div className="w-full">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {!loading && error && (
                <MessageBox variant="danger">{error}</MessageBox>
              )}
              {!loading && !error && products.length === 0 && (
                <MessageBox>No Products Found</MessageBox>
              )}
              {!loading &&
                !error &&
                products.length > 0 &&
                products.map((product) => (
                  <div
                    key={product._id}
                    className="space-x-2 rounded-lg hover:shadow-lg transition-shadow"
                  >
                    <Product product={product} />
                  </div>
                ))}
            </div>

            {/* Pagination with Go to Page */}
            {pages > 1 && (
              <div className="flex flex-wrap justify-between items-center mt-4 space-y-2 sm:space-y-0 sm:space-x-4">
                <div>
                  {page > 1 && (
                    <button
                      onClick={() => navigate(getFilterUrl({ page: page - 1 }))}
                      className="px-3 text-xs font-bold py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 mr-2"
                    >
                      Previous
                    </button>
                  )}
                </div>
                <div className="flex text-xs items-center space-x-2">
                  <span>
                    Page {page} of {pages}
                  </span>
                  <input
                    type="number"
                    min="1"
                    max={pages}
                    value={jumpPage}
                    onChange={handlePageInputChange}
                    className="border border-gray-300 rounded-lg p-2 h-8 w-16 focus:outline-none"
                  />
                  <button
                    onClick={handleJumpToPage}
                    className="px-4 font-bold py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    Go
                  </button>
                </div>
                <div>
                  {page < pages && (
                    <button
                      onClick={() => navigate(getFilterUrl({ page: page + 1 }))}
                      className="px-4 text-xs font-bold py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                    >
                      Next
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
