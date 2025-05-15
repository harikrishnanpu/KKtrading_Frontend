// src/pages/StockUpdatePage.jsx
import React, { useState, useEffect, useMemo, forwardRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slide,
  Button,
  Drawer,
  IconButton,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import api from '../api';
import useAuth from 'hooks/useAuth';
import { Trash } from 'iconsax-react';

const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const StockUpdatePage = () => {
  const { user: userInfo } = useAuth();

  /* ─────────────────────────── state ─────────────────────────── */
  const [searchQuery, setSearchQuery] = useState('');
  const [productSuggestions, setProductSuggestions] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [quantityChange, setQuantityChange] = useState('');
  const [remark, setRemark] = useState('');
  const [updateError, setUpdateError] = useState('');

  const [logs, setLogs] = useState([]);

  /* filters */
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [filterName, setFilterName] = useState('');
  const [filterBrand, setFilterBrand] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [logError, setLogError] = useState('');
  const [deleteMessage, setDeleteMessage] = useState('');

  /* ─────────────────────────── fetch logs ─────────────────────────── */
  const fetchLogs = async () => {
    setLoading(true);
    setLogError('');
    try {
      const params = {
        ...(fromDate && { fromDate }),
        ...(toDate && { toDate }),
        ...(filterName && { name: filterName }),
        ...(filterBrand && { brand: filterBrand }),
        ...(filterCategory && { category: filterCategory }),
        sortField,
        sortDirection,
      };
      const { data } = await api.get('/api/stock-update/logs', { params });
      setLogs(data);
    } catch {
      setLogError('Failed to fetch logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromDate, toDate, filterName, filterBrand, filterCategory, sortField, sortDirection]);

  /* ─────────────────────────── suggestions ─────────────────────────── */
  const handleSearchChange = async e => {
    const q = e.target.value;
    setSearchQuery(q);
    if (!q.trim()) return setProductSuggestions([]);
    try {
      const { data } = await api.get('/api/stock-update/search-products', { params: { q } });
      setProductSuggestions(data);
    } catch (err) {
      console.error(err);
    }
  };

  const selectProduct = p => {
    setSelectedProduct(p);
    setSearchQuery(p.name);
    setProductSuggestions([]);
  };

  /* ─────────────────────────── stock update ─────────────────────────── */
  const handleStockUpdate = async () => {
    if (!selectedProduct) return setUpdateError('Select a product first.');
    if (!quantityChange || isNaN(+quantityChange) || +quantityChange === 0)
      return setUpdateError('Quantity must be a non-zero number.');

    try {
      await api.post('/api/stock-update/create', {
        item_id: selectedProduct.item_id,
        quantityChange,
        submittedBy: userInfo?.name || 'Unknown',
        remark,
      });
      /* reset & refetch */
      setSelectedProduct(null);
      setSearchQuery('');
      setQuantityChange('');
      setRemark('');
      setUpdateError('');
      fetchLogs();
      setDialogOpen(false);
    } catch (err) {
      setUpdateError(err.response?.data?.message || 'Update failed.');
    }
  };

  /* ─────────────────────────── delete log ─────────────────────────── */
  const handleDeleteLog = async id => {
    if (!window.confirm('Delete this update log?')) return;
    try {
      const { data } = await api.delete(`/api/stock-update/${id}`);
      setDeleteMessage(data.message);
      fetchLogs();
      setTimeout(() => setDeleteMessage(''), 2500);
    } catch {
      setDeleteMessage('Delete failed.');
    }
  };

  /* ─────────────────────────── PDF ─────────────────────────── */
  const generatePDF = () => {
    const doc = new jsPDF();
    doc.text('Stock Update Logs', 14, 15).setFontSize(9);
    doc.text(
      `Filters → From: ${fromDate || 'All'} | To: ${toDate || 'All'} | Name: ${
        filterName || 'All'
      } | Brand: ${filterBrand || 'All'} | Cat: ${filterCategory || 'All'}`,
      14,
      22
    );

    const rows = logs.map(l => [
      new Date(l.date).toLocaleString(),
      l.item_id,
      l.name,
      l.brand,
      l.category,
      l.quantity > 0 ? `+${l.quantity}` : l.quantity,
      l.submittedBy,
      l.remark || '',
    ]);
    doc.autoTable({
      head: [['Date', 'ID', 'Name', 'Brand', 'Category', 'Qty', 'User', 'Remark']],
      body: rows,
      startY: 28,
      styles: { fontSize: 8 },
    });
    doc.save('stock_updates.pdf');
  };

  /* ─────────────────────────── pagination helpers ─────────────────────────── */
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return logs.slice(start, start + itemsPerPage);
  }, [logs, currentPage]);

  /* ─────────────────────────── render ─────────────────────────── */
  return (
    <div className="p-4 max-w-7xl mx-auto">
      {/* top bar */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-sm font-semibold text-gray-700">Stock Updates</h2>

        <div className="space-x-2 flex">
          <Button
            variant="outlined"
            startIcon={<FilterAltOutlinedIcon />}
            onClick={() => setDrawerOpen(true)}
          >
            Filters / PDF
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<AddCircleOutlineIcon />}
            onClick={() => setDialogOpen(true)}
          >
            Update Stock
          </Button>
        </div>
      </div>

      {/* messages */}
      {logError && <p className="text-red-600 text-sm mb-2">{logError}</p>}
      {deleteMessage && <p className="text-green-600 text-sm mb-2">{deleteMessage}</p>}

      {/* table (≥ md) */}
      <div className="hidden md:block">
        <table className="w-full text-sm text-gray-700 bg-white shadow rounded-lg overflow-hidden">
          <thead className="bg-red-600 text-white">
            <tr>
              {['Date', 'ID', 'Name', 'Qty', 'User', 'Remark', ''].map(h => (
                <th key={h} className="px-3 py-2 text-left whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-6">
                  Loading…
                </td>
              </tr>
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-6">
                  No logs
                </td>
              </tr>
            ) : (
              paginated.map(log => (
                <tr
                  key={log._id}
                  className="odd:bg-gray-50 even:bg-white hover:bg-gray-100 transition"
                >
                  <td className="px-3 py-2">{new Date(log.date).toLocaleString()}</td>
                  <td className="px-3 py-2">{log.item_id}</td>
                  <td className="px-3 py-2">{log.name}</td>
                  <td
                    className={`px-3 py-2 font-bold ${
                      log.quantity > 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {log.quantity > 0 ? `+${log.quantity}` : log.quantity}
                  </td>
                  <td className="px-3 py-2">{log.submittedBy}</td>
                  <td className="px-3 py-2">{log.remark}</td>
                  <td className="px-3 py-2">
                    <IconButton onClick={() => handleDeleteLog(log._id)} size="small" color="error">
                      <Trash fontSize="inherit" />
                    </IconButton>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* card view (< md) */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <p className="text-center text-gray-500">Loading…</p>
        ) : paginated.length === 0 ? (
          <p className="text-center text-gray-500">No logs</p>
        ) : (
          paginated.map(log => (
            <div key={log._id} className="bg-white shadow rounded-lg p-3">
              <div className="flex justify-between text-sm font-semibold">
                <span>{log.name}</span>
                <span className="text-gray-500">{new Date(log.date).toLocaleString()}</span>
              </div>
              <p className="text-xs text-gray-600">ID: {log.item_id}</p>
              <p
                className={`text-sm font-bold ${
                  log.quantity > 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                Qty: {log.quantity > 0 ? `+${log.quantity}` : log.quantity}
              </p>
              <p className="text-xs">User: {log.submittedBy}</p>
              <p className="text-xs mb-2">Remark: {log.remark}</p>
              <Button
                variant="text"
                color="error"
                size="small"
                onClick={() => handleDeleteLog(log._id)}
              >
                Delete
              </Button>
            </div>
          ))
        )}
      </div>

      {/* pagination */}
      {logs.length > 0 && (
        <div className="flex justify-between items-center mt-4 text-sm">
          <Button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => p - 1)}
          >
            Previous
          </Button>
          <span>
            Page {currentPage} of {Math.ceil(logs.length / itemsPerPage)}
          </span>
          <Button
            disabled={currentPage * itemsPerPage >= logs.length}
            onClick={() => setCurrentPage(p => p + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {/* ───────────── Update-stock Dialog ───────────── */}
      <Dialog
   open={dialogOpen}
      TransitionComponent={Transition}
      fullWidth
      maxWidth="xs"
      PaperProps={{
        sx: {
          bottom: -40,
          left: 0,
          right: 0,
          borderRadius: "16px 16px 0 0", // Rounded top corners
          // maxHeight: "30vh", // Keep it compact
          width: "90%", // Responsive width
          textAlign: "center", // Center text inside Paper
          display: "flex",
          justifyContent: "center",
          padding: 2,
        },
      }}
      sx={{
        "& .MuiDialog-container": {
          display: "flex",
          alignItems: "flex-end",   // Stick to bottom
        },
      }}
        onClose={() => setDialogOpen(false)}
      >
        <DialogTitle>
          Update Stock
          <IconButton
            edge="end"
            onClick={() => setDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers className="space-y-4">
          <TextField
            label="Search product"
            size="small"
            fullWidth
            value={searchQuery}
            onChange={handleSearchChange}
          />
          {/* suggestion list */}
          {productSuggestions.length > 0 && (
            <ul className="border rounded text-left max-h-40 overflow-y-auto text-sm">
              {productSuggestions.map(p => (
                <li
                  key={p._id}
                  className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                  onClick={() => selectProduct(p)}
                >
                  {p.item_id} — {p.name}
                </li>
              ))}
            </ul>
          )}

          {selectedProduct && (
            <div className="bg-gray-50 p-3 rounded text-sm">
              <p className="font-semibold">
                {selectedProduct.name} ({selectedProduct.item_id})
              </p>
              <p>Brand: {selectedProduct.brand}</p>
              <p>Category: {selectedProduct.category}</p>
              <p>In Stock: {selectedProduct.countInStock}</p>
            </div>
          )}

          <TextField
            label="Quantity change (+ / -)"
            size="small"
            fullWidth
            value={quantityChange}
            onChange={e => setQuantityChange(e.target.value)}
          />
          <TextField
            label="Remark"
            size="small"
            fullWidth
            value={remark}
            onChange={e => setRemark(e.target.value)}
          />
          {updateError && <p className="text-red-600 text-sm">{updateError}</p>}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="outlined" onClick={handleStockUpdate}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* ───────────── Filter Drawer ───────────── */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ className: 'w-full max-w-sm' }}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="text-lg font-medium">Filters & PDF</h3>
          <IconButton onClick={() => setDrawerOpen(false)}>
            <CloseIcon />
          </IconButton>
        </div>

        <div className="p-4 space-y-4 text-sm">
          <TextField
            label="From date"
            type="date"
            size="small"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={fromDate}
            onChange={e => setFromDate(e.target.value)}
          />
          <TextField
            label="To date"
            type="date"
            size="small"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={toDate}
            onChange={e => setToDate(e.target.value)}
          />
          <TextField
            label="Name"
            size="small"
            fullWidth
            value={filterName}
            onChange={e => setFilterName(e.target.value)}
          />
          <TextField
            label="Brand"
            size="small"
            fullWidth
            value={filterBrand}
            onChange={e => setFilterBrand(e.target.value)}
          />
          <TextField
            label="Category"
            size="small"
            fullWidth
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
          />

          <FormControl size="small" fullWidth>
            <InputLabel>Sort field</InputLabel>
            <Select
              label="Sort field"
              value={sortField}
              onChange={e => setSortField(e.target.value)}
            >
              {['date', 'name', 'brand', 'category', 'quantity'].map(f => (
                <MenuItem key={f} value={f}>
                  {f}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" fullWidth>
            <InputLabel>Direction</InputLabel>
            <Select
              label="Direction"
              value={sortDirection}
              onChange={e => setSortDirection(e.target.value)}
            >
              <MenuItem value="asc">Ascending</MenuItem>
              <MenuItem value="desc">Descending</MenuItem>
            </Select>
          </FormControl>

          <Button
            fullWidth
            variant="outlined"
            color="primary"
            onClick={generatePDF}
            className="!mt-2"
          >
            Download PDF
          </Button>
        </div>
      </Drawer>
    </div>
  );
};

export default StockUpdatePage;
