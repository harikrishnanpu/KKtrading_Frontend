// src/pages/NeedToPurchaseList.js
import React, { useState, useEffect, useMemo, forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { format, isAfter, isBefore } from 'date-fns';
import useAuth from 'hooks/useAuth';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Slide,
  TextField, Button, FormControlLabel, Checkbox, Drawer,
  IconButton, useMediaQuery, useTheme
} from '@mui/material';
import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined';
import CloseIcon from '@mui/icons-material/Close';

/* ────────────────────────────────────────────────────────── */
const UpTransition = forwardRef(function UpTransition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});
const cx = (...cls) => cls.filter(Boolean).join(' ');

/* ────────────────────────────────────────────────────────── */
export default function NeedToPurchaseList() {
  const navigate            = useNavigate();
  const { user: userInfo }  = useAuth();
  const theme               = useTheme();
  const isMobile            = useMediaQuery(theme.breakpoints.down('sm'));

  /* ---------- remote data ---------- */
  const [items, setItems]    = useState([]);
  const [products, setProducts] = useState([]);
  const [busy, setBusy]      = useState(true);
  const [error, setError]    = useState('');

  /* ---------- filters ---------- */
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search,  setSearch]     = useState('');
  const [onlyPurchased, setOnlyPurchased] = useState(false);
  const [onlyVerified,  setOnlyVerified]  = useState(false);
  const [dateFrom, setDateFrom]   = useState('');
  const [dateTo,   setDateTo]     = useState('');

  /* ---------- edit drawer ---------- */
  const [editing, setEditing] = useState(null);
  const [form, setForm]       = useState({});
  const drawerOpen            = Boolean(editing);

  /* ---------- fetch ---------- */
useEffect(() => {
  (async () => {
    setBusy(true);
    try {
      const [needRes, prodRes] = await Promise.all([
        api.get('/api/needtopurchase'),
        api.get('/api/products/product/all'),
      ]);
      setItems(Array.isArray(needRes.data) ? needRes.data : []);
      setProducts(Array.isArray(prodRes.data) ? prodRes.data : []);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch data');
    } finally {
      setBusy(false);
    }
  })();
}, []);


  /* ---------- product map ---------- */
  const productMap = useMemo(() => {
    const m = {};
    products.forEach((p) => (m[p.item_id] = p));
    return m;
  }, [products]);

  /* ---------- filter logic ---------- */
  const filtered = useMemo(() => {
    return items.filter((it) => {
      const textMatch = `${it.item_id} ${it.name} ${it.invoiceNo}`
        .toLowerCase()
        .includes(search.toLowerCase());

      const purchasedMatch = onlyPurchased ? it.purchased : true;
      const verifiedMatch  = onlyVerified  ? it.verified  : true;

      const dateMatch = (() => {
        if (!dateFrom && !dateTo) return true;
        const created = new Date(it.createdAt);
        if (dateFrom && isBefore(created, new Date(dateFrom))) return false;
        if (dateTo   && isAfter (created, new Date(dateTo)))   return false;
        return true;
      })();

      return textMatch && purchasedMatch && verifiedMatch && dateMatch;
    });
  }, [items, search, onlyPurchased, onlyVerified, dateFrom, dateTo]);

  /* ---------- helpers ---------- */
  const patchRow = (id, patch) =>
    setItems((prev) => prev.map((it) => (it._id === id ? { ...it, ...patch } : it)));

  const apiToggle = async (id, field) => {
    try {
      await api.put(`/api/needtopurchase/${id}`, { [field]: true });
      patchRow(id, { [field]: true });
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const apiDelete = async (id) => {
    if (!window.confirm('Remove this entry?')) return;
    try {
      await api.delete(`/api/needtopurchase/${id}`);
      setItems((prev) => prev.filter((it) => it._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  /* ---------- edit ---------- */
  const openEdit = (row) => {
    setEditing(row);
    setForm({
      invoiceNo:        row.invoiceNo || '',
      quantityOrdered:  row.quantityOrdered ?? row.quantity ?? 0,
      quantityNeeded:   row.quantityNeeded  ?? row.quantity ?? 0,
      purchased:        row.purchased,
      verified:         row.verified,
    });
  };
  const closeEdit = () => { setEditing(null); setForm({}); };
  const saveEdit = async () => {
    try {
      const payload = {
        invoiceNo:       form.invoiceNo,
        quantityOrdered: Number(form.quantityOrdered),
        quantityNeeded:  Number(form.quantityNeeded),
        purchased:       form.purchased,
        verified:        form.verified,
      };
      await api.put(`/api/needtopurchase/${editing._id}`, payload);
      patchRow(editing._id, payload);
      closeEdit();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  /* ---------- loaders / errors ---------- */
  if (busy)
    return (
      <div className="p-6">
        <Skeleton height={40} count={5} />
      </div>
    );
  if (error) return <div className="p-6 text-red-500">{error}</div>;
  if (items.length === 0)
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold mb-2">Products Needed to Purchase</h1>
        <p>No products require ordering at this time.</p>
      </div>
    );

  /* ---------- render ---------- */
  return (
    <div className="p-4 bg-gray-50 min-h-screen relative">

      {/* TOP BAR --------------------------------------------------------- */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Products Needed to Purchase</h1>

        <Button
          startIcon={<FilterAltOutlinedIcon />}
          variant="outlined"
          color="primary"
          onClick={() => setSidebarOpen(true)}
          size={isMobile ? 'medium' : 'small'}
          sx={isMobile ? { position: 'fixed', bottom: 24, right: 24, zIndex: 1200 } : {}}
        >
          {isMobile ? null : 'Filters'}
        </Button>
      </div>

      {/* SIDEBAR (Drawer) ------------------------------------------------ */}
      <Drawer
        anchor="left"
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        PaperProps={{ sx: { width: 280 } }}
      >
        <div className="flex justify-between items-center p-3 border-b">
          <h3 className="text-lg font-semibold">Filters</h3>
          <IconButton onClick={() => setSidebarOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </div>
        <div className="p-4 space-y-4 text-sm">
          <TextField
            label="Search"
            variant="outlined"
            size="small"
            fullWidth
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="flex flex-col gap-2">
            <FormControlLabel
              control={
                <Checkbox
                  checked={onlyPurchased}
                  onChange={(e) => setOnlyPurchased(e.target.checked)}
                />
              }
              label="Only Purchased"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={onlyVerified}
                  onChange={(e) => setOnlyVerified(e.target.checked)}
                />
              }
              label="Only Verified"
            />
          </div>

          <TextField
            label="Date From"
            type="date"
            size="small"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
          <TextField
            label="Date To"
            type="date"
            size="small"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />

          <Button
            variant="outlined"
            color="error"
            fullWidth
            onClick={() => {
              setSearch('');
              setOnlyPurchased(false);
              setOnlyVerified(false);
              setDateFrom('');
              setDateTo('');
            }}
          >
            Reset
          </Button>
        </div>
      </Drawer>

      {/* DESKTOP TABLE --------------------------------------------------- */}
      <div className="hidden md:block">
        <table className="min-w-full bg-white shadow rounded-lg overflow-hidden text-sm">
          <thead className="bg-red-600 text-white">
            <tr>
              <th className="px-3 py-2">Invoice</th>
              <th className="px-3 py-2">Item&nbsp;ID</th>
              <th className="px-3 py-2">Image</th>
              <th className="px-3 py-2 text-left">Product</th>
              <th className="px-3 py-2">Ordered</th>
              <th className="px-3 py-2">Needed</th>
              <th className="px-3 py-2">Purchased</th>
              <th className="px-3 py-2">Verified</th>
              <th className="px-3 py-2 w-28"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((it) => {
              const prod = productMap[it.item_id] || {};
              return (
                <tr key={it._id} className="border-b hover:bg-gray-100">
                  <td
                    className="px-3 py-2 text-red-600 cursor-pointer"
                    onClick={() =>
                      userInfo.isAdmin && navigate(`/invoice/details/${it.billingId}`)
                    }
                  >
                    {it.invoiceNo}
                  </td>
                  <td className="px-3 py-2">{it.item_id}</td>
                  <td className="px-3 py-2">
                    {prod.image ? (
                      <img src={prod.image} alt={prod.name} className="h-10 w-10 object-cover rounded" />
                    ) : (
                      <div className="h-10 w-10 bg-gray-300 rounded flex items-center justify-center text-xs">
                        N/A
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2">{it.name}</td>
                  <td className="px-3 py-2 text-center">{it.quantityOrdered ?? it.quantity}</td>
                  <td className="px-3 py-2 text-center">{it.quantityNeeded  ?? it.quantity}</td>
                  <td className="px-3 py-2 text-center">
                    {it.purchased ? '✅' : (
                      <Button
                        onClick={() => apiToggle(it._id, 'purchased')}
                        size="small"
                        variant="outlined"
                      >
                        mark
                      </Button>
                    )}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {it.verified ? '✅'
                      : userInfo.isSuper
                        ? (<Button
                            onClick={() => apiToggle(it._id, 'verified')}
                            size="small"
                            variant="outlined"
                          >
                            verify
                          </Button>)
                        : '-'}
                  </td>
                  <td className="px-3 py-2 flex gap-2 justify-center">
                    <Button size="small" onClick={() => openEdit(it)}>
                      edit
                    </Button>
                    {userInfo.isSuper && (
                      <Button size="small" color="error" onClick={() => apiDelete(it._id)}>
                        delete
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* MOBILE CARDS ---------------------------------------------------- */}
      <div className="space-y-4 md:hidden">
        {filtered.map((it) => {
          const prod = productMap[it.item_id] || {};
          return (
            <div key={it._id} className="bg-white p-4 rounded-lg shadow text-sm flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span
                  className="text-red-600 font-semibold cursor-pointer"
                  onClick={() =>
                    userInfo.isAdmin && navigate(`/invoice/details/${it.billingId}`)
                  }
                >
                  {it.invoiceNo}
                </span>
                <div className="flex gap-2">
                  <Button size="small" onClick={() => openEdit(it)}>
                    edit
                  </Button>
                  {userInfo.isSuper && (
                    <Button size="small" color="error" onClick={() => apiDelete(it._id)}>
                      delete
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex items-center mb-2">
                {prod.image ? (
                  <img src={prod.image} alt={prod.name} className="h-12 w-12 object-cover rounded mr-3" />
                ) : (
                  <div className="h-12 w-12 bg-gray-300 rounded mr-3 flex items-center justify-center text-xs">
                    N/A
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-medium truncate">{it.name}</p>
                  <p className="text-gray-500 text-xs">
                    {it.item_id} • {it.customer}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center mb-2">
                <div>
                  <p className="text-xs text-gray-500">Ordered</p>
                  <p className="font-semibold">{it.quantityOrdered ?? it.quantity}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Needed</p>
                  <p className="font-semibold">{it.quantityNeeded ?? it.quantity}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Date</p>
                  <p className="font-semibold">
                    {format(new Date(it.createdAt), 'dd/MM')}
                  </p>
                </div>
              </div>

              <div className="flex justify-between mt-auto">
                {it.purchased ? (
                  <span className="text-green-600 text-xs">Purchased</span>
                ) : (
                  <Button
                    onClick={() => apiToggle(it._id, 'purchased')}
                    size="small"
                  >
                    purchased
                  </Button>
                )}

                {it.verified ? (
                  <span className="text-green-600 text-xs">Verified</span>
                ) : userInfo.isSuper ? (
                  <Button
                    onClick={() => apiToggle(it._id, 'verified')}
                    size="small"
                  >
                    verify
                  </Button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {/* EDIT DIALOG ----------------------------------------------------- */}
      <Dialog
        open={drawerOpen}
        onClose={closeEdit}
        TransitionComponent={UpTransition}
        keepMounted
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            height: '75vh',
            m: 0,
            bottom: 0,
            position: 'fixed',
            borderTopLeftRadius: 8,
            borderTopRightRadius: 8,
          },
        }}
      >
        <DialogTitle>Edit Need-to-Purchase</DialogTitle>

        <DialogContent dividers>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <TextField
              label="Invoice No"
              fullWidth
              size="small"
              variant="outlined"
              className="col-span-2 md:col-span-3"
              value={form.invoiceNo}
              onChange={(e) => setForm({ ...form, invoiceNo: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Ordered Qty"
              type="number"
              size="small"
              fullWidth
              inputProps={{ min: 0 }}
              value={form.quantityOrdered}
              onChange={(e) => setForm({ ...form, quantityOrdered: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Needed Qty"
              type="number"
              size="small"
              fullWidth
              inputProps={{ min: 0 }}
              value={form.quantityNeeded}
              onChange={(e) => setForm({ ...form, quantityNeeded: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={Boolean(form.purchased)}
                  onChange={(e) => setForm({ ...form, purchased: e.target.checked })}
                />
              }
              label="Purchased"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={Boolean(form.verified)}
                  disabled={!userInfo.isSuper}
                  onChange={(e) => setForm({ ...form, verified: e.target.checked })}
                />
              }
              label="Verified"
              sx={!userInfo.isSuper ? { opacity: 0.4 } : {}}
            />
          </div>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={closeEdit}>Cancel</Button>
          <Button variant="outlined" color="error" onClick={saveEdit}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
