import React, { useState, useEffect, forwardRef } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Slide,
  Button, Drawer, IconButton, TextField, Select, MenuItem,
  InputLabel, FormControl
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

const itemsPerPage = 15;

export default function StockUpdatePage() {
  const { user: userInfo } = useAuth();

  /* ───── state ─────────────────────────────────────────────── */
  const [searchQuery, setSearchQuery]       = useState('');
  const [productSuggestions, setProductSuggestions] = useState([]);
  const [selectedProduct, setSelectedProduct]       = useState(null);
  const [quantityChange, setQuantityChange] = useState('');
  const [remark, setRemark]                 = useState('');
  const [updateError, setUpdateError]       = useState('');

  const [logs, setLogs]           = useState([]);
  const [loading, setLoading]     = useState(false);
  const [logError, setLogError]   = useState('');
  const [deleteMsg, setDeleteMsg] = useState('');

  /* filters */
  const [fromDate, setFromDate]       = useState('');
  const [toDate, setToDate]           = useState('');
  const [filterName, setFilterName]   = useState('');
  const [filterBrand, setFilterBrand] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [sortField, setSortField]     = useState('date');
  const [sortDir, setSortDir]         = useState('desc');
  const [ filterItemId, setFilterItemId] = useState('');
  const [ filterRemark, setFilterRemark] = useState('');


  /* UI */
  const [drawerOpen, setDrawerOpen]   = useState(false);
  const [dialogOpen, setDialogOpen]   = useState(false);

  /* pagination */
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages]   = useState(1);

  /* ───── fetch logs ─────────────────────────────────────────── */
  const fetchLogs = async (page = 1) => {
    setLoading(true);
    setLogError('');
    try {
      const { data } = await api.get('/api/stock-update/logs', {


        params: {
          page,
          limit: itemsPerPage,
          fromDate,
          toDate,
          name: filterName,
          brand: filterBrand,
          category: filterCategory,
          itemId: filterItemId,
          sortField,
          sortDirection: sortDir,
          remark: filterRemark
        }
      });


      setLogs(data.logs);
      setTotalPages(Math.ceil(data.total / itemsPerPage));
      setCurrentPage(page);
      
    } catch {
      setLogError('Failed to fetch logs.');
    } finally {
      setLoading(false);
    }
  };

  /* initial + filter/sort change */
  useEffect(() => {
    fetchLogs(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    fromDate,
    toDate,
    filterName,
    filterBrand,
    filterCategory,
    filterItemId,
    sortField,
    sortDir,
    filterRemark
  ]);

  /* ───── product suggestions ───────────────────────────────── */
  const handleSearchChange = async e => {
    const q = e.target.value;
    setSearchQuery(q);
    if (!q.trim()) return setProductSuggestions([]);
    try {
      const { data } = await api.get('/api/stock-update/search-products', {
        params: { q }
      });
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

  /* ───── stock update submit ───────────────────────────────── */
  const handleStockUpdate = async () => {
    if (!selectedProduct)
      return setUpdateError('Select a product first.');
    if (!quantityChange || isNaN(+quantityChange) || +quantityChange === 0)
      return setUpdateError('Quantity must be a non-zero number.');

    try {
      await api.post('/api/stock-update/create', {
        item_id: selectedProduct.item_id,
        quantityChange,
        submittedBy: userInfo?.name || 'Unknown',
        remark
      });
      /* reset */
      setSelectedProduct(null);
      setSearchQuery('');
      setQuantityChange('');
      setRemark('');
      setUpdateError('');
      fetchLogs(1);
      setDialogOpen(false);
    } catch (err) {
      setUpdateError(err.response?.data?.message || 'Update failed.');
    }
  };

  /* ───── delete log ────────────────────────────────────────── */
  const handleDelete = async id => {
    if (!window.confirm('Delete this update log?')) return;
    try {
      const { data } = await api.delete(`/api/stock-update/${id}`);
      setDeleteMsg(data.message);
      fetchLogs(currentPage);
      setTimeout(() => setDeleteMsg(''), 2500);
    } catch {
      setDeleteMsg('Delete failed.');
    }
  };

  /* ───── PDF ───────────────────────────────────────────────── */
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

    doc.autoTable({
      head: [['Date', 'ID', 'Name', 'Brand', 'Category', 'Qty', 'User', 'Remark']],
      body: logs.map(l => [
        new Date(l.date).toLocaleString(),
        l.item_id,
        l.name,
        l.brand,
        l.category,
        l.quantity > 0 ? `+${l.quantity}` : l.quantity,
        l.submittedBy,
        l.remark || ''
      ]),
      startY: 28,
      styles: { fontSize: 8 }
    });
    doc.save('stock_updates.pdf');
  };

  /* ───── render ────────────────────────────────────────────── */
  return (
    <div className="p-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xs font-semibold text-gray-700">
          Stock Updates
        </h2>
        <div className="flex space-x-2">
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

      {/* Messages */}
      {logError && <p className="text-red-600 text-xs mb-2">{logError}</p>}
      {deleteMsg && (
        <p className="text-green-600 text-xs mb-2">{deleteMsg}</p>
      )}

      {/* Table (desktop) */}
      <div className="hidden md:block">
        <table className="w-full text-xs text-gray-700 bg-white shadow rounded-lg overflow-hidden">
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
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-6">
                  No logs
                </td>
              </tr>
            ) : (
              logs.map(log => (
                <tr
                  key={log._id}
                  className="odd:bg-gray-50 divide-x divide-y even:bg-white hover:bg-gray-100"
                >
                  <td className="px-3 py-2">
                    {new Date(log.date).toLocaleString()}
                  </td>
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
                {userInfo.isSuper &&  <td className="px-3 py-2">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(log._id)}
                    >
                      <Trash fontSize="inherit" />
                    </IconButton> 
                  </td> }
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Cards (mobile) */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <p className="text-center text-gray-500">Loading…</p>
        ) : logs.length === 0 ? (
          <p className="text-center text-gray-500">No logs</p>
        ) : (
          logs.map(log => (
            <div key={log._id} className="bg-white shadow rounded-lg p-3">
              <div className="flex justify-between text-xs font-semibold">
                <span>{log.name}</span>
                <span className="text-gray-500">
                  {new Date(log.date).toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-gray-600">ID: {log.item_id}</p>
              <p
                className={`text-xs font-bold ${
                  log.quantity > 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                Qty:{' '}
                {log.quantity > 0 ? `+${log.quantity}` : log.quantity}
              </p>
              <p className="text-xs">User: {log.submittedBy}</p>
              <p className="text-xs mb-2">Remark: {log.remark}</p>
               {userInfo.isSuper &&   <Button
                variant="text"
                color="error"
                size="small"
                onClick={() => handleDelete(log._id)}
              >
                Delete
              </Button> }
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {logs.length > 0 && (
        <div className="flex justify-between items-center mt-4 text-xs">
          <Button
            disabled={currentPage === 1}
            onClick={() => fetchLogs(currentPage - 1)}
          >
            Previous
          </Button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <Button
            disabled={currentPage === totalPages}
            onClick={() => fetchLogs(currentPage + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {/* Update Stock Dialog */}
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
            borderRadius: '16px 16px 0 0',
            width: '90%',
            display: 'flex',
            justifyContent: 'center',
            p: 2
          }
        }}
        sx={{
          '& .MuiDialog-container': { alignItems: 'flex-end' }
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

          {/* suggestions */}
          {productSuggestions.length > 0 && (
            <ul className="border rounded text-left max-h-40 overflow-y-auto text-xs">
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
            <div className="bg-gray-50 p-3 rounded text-xs">
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
          {updateError && (
            <p className="text-red-600 text-xs">{updateError}</p>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="outlined" onClick={handleStockUpdate}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Filters / PDF Drawer */}
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

        <div className="p-4 space-y-4 text-xs">
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
            label="itemId"
            size="small"
            fullWidth
            value={filterItemId}
            onChange={e => setFilterItemId(e.target.value)}
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

                    <TextField
            label="Remark"
            size="small"
            fullWidth
            value={filterRemark}
            onChange={e => setFilterRemark(e.target.value)}
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
              value={sortDir}
              onChange={e => setSortDir(e.target.value)}
            >
              <MenuItem value="asc">Ascending</MenuItem>
              <MenuItem value="desc">Descending</MenuItem>
            </Select>
          </FormControl>

          <Button
            fullWidth
            variant="outlined"
            onClick={generatePDF}
            className="!mt-2"
          >
            Download PDF
          </Button>
        </div>
      </Drawer>
    </div>
  );
}
