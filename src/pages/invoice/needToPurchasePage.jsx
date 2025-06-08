import React, { useState, useEffect, useMemo, forwardRef } from 'react';
import api from '../api';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { isAfter, isBefore } from 'date-fns';
import useAuth from 'hooks/useAuth';
import {
  Box, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle,
  Drawer, FormControlLabel, IconButton, Paper, Pagination, Slide,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TableSortLabel, TextField, useMediaQuery, useTheme, Grid, Typography
} from '@mui/material';
import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined';
import CloseIcon from '@mui/icons-material/Close';

const UpTransition = forwardRef((props, ref) => <Slide direction="up" ref={ref} {...props}/>);

export default function NeedToPurchaseList() {
  const { user: userInfo } = useAuth();
  const theme    = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  /* Data & state */
  const [items, setItems]           = useState([]);
  const [totalsByItem, setTotals]   = useState([]);
  const [products, setProducts]     = useState([]);
  const [busy, setBusy]             = useState(true);
  const [error, setError]           = useState('');

  /* Pagination */
  const [page, setPage]             = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(4);
  const [totalPages, setTotalPages] = useState(1);
  const handleChangePage = (_e, v)  => setPage(v);

  /* Filters */
  const [sidebarOpen, setSidebarOpen]     = useState(false);
  const [search, setSearch]               = useState('');
  const [onlyPurchased, setOnlyPurchased] = useState(false);
  const [onlyVerified, setOnlyVerified]   = useState(false);
  const [dateFrom, setDateFrom]           = useState('');
  const [dateTo, setDateTo]               = useState('');
  const [filterSalesman, setFilterSalesman] = useState('');
  const [filterRemark, setFilterRemark]     = useState('');

  /* Sorting */
  const [sortField, setSortField]         = useState('createdAt');
  const [sortDir, setSortDir]             = useState('desc');
  const handleSort = field => {
    if (sortField === field) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  /* Edit dialog */
  const [editing, setEditing] = useState(null);
  const [form, setForm]       = useState({});
  const drawerOpen            = Boolean(editing);

  /* Fetch paginated & totals on every filter/page change */
  useEffect(() => {
    let active = true;
    (async () => {
      setBusy(true);
      try {
        const params = {
          page,
          limit: rowsPerPage,
          search,
          onlyPurchased,
          onlyVerified,
          dateFrom,
          dateTo,
          salesmanName: filterSalesman,
          remark:       filterRemark
        };
        const [resPage, prodRes] = await Promise.all([
          api.get('/api/needtopurchase/paginated', { params }),
          api.get('/api/products/product/all')
        ]);
        if (!active) return;
        setItems(resPage.data.items);
        setTotals(resPage.data.totalsByItem);
        setTotalPages(resPage.data.totalPages);
        setProducts(prodRes.data);
      } catch (err) {
        console.error(err);
        if (!active) return;
        setError(err.response?.data?.message || err.message);
      } finally {
        if (active) setBusy(false);
      }
    })();
    return () => { active = false; };
  }, [
    page, rowsPerPage,
    search, onlyPurchased, onlyVerified,
    dateFrom, dateTo,
    filterSalesman, filterRemark
  ]);

  /* Map products for images, etc */
  const productMap = useMemo(() => {
    const m = {};
    products.forEach(p => { m[p.item_id] = p; });
    return m;
  }, [products]);

  /* Sort current page locally */
  const sorted = useMemo(() => {
    return [...items].sort((a, b) => {
      const A = a[sortField] ?? '';
      const B = b[sortField] ?? '';
      if (A < B) return sortDir === 'asc' ? -1 : 1;
      if (A > B) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [items, sortField, sortDir]);

  /* Helpers */
  const patchRow = (id, patch) =>
    setItems(it => it.map(x => x._id === id ? { ...x, ...patch } : x));

  const apiToggle = async (id, field) => {
    try {
      await api.put(`/api/needtopurchase/${id}`, { [field]: true });
      patchRow(id, { [field]: true });
    } catch (e) {
      alert(e.response?.data?.message || e.message);
    }
  };
  const apiDelete = async id => {
    if (!window.confirm('Remove this entry?')) return;
    try {
      await api.delete(`/api/needtopurchase/${id}`);
      setItems(it => it.filter(x => x._id !== id));
    } catch (e) {
      alert(e.response?.data?.message || e.message);
    }
  };

  const openEdit = row => {
    setEditing(row);
    setForm({
      invoiceNo: row.invoiceNo || '',
      quantityOrdered: row.quantityOrdered ?? 0,
      quantityNeeded: row.quantityNeeded ?? 0,
      purchased: row.purchased,
      verified:  row.verified,
      purchaseId: row.purchaseId || '',
      remark:    row.remark || ''
    });
  };
  const closeEdit = () => setEditing(null) || setForm({});
  const saveEdit = async () => {
    const payload = {
      invoiceNo:        form.invoiceNo,
      quantityOrdered:  Number(form.quantityOrdered),
      quantityNeeded:   Number(form.quantityNeeded),
      purchased:        form.purchased,
      verified:         form.verified,
      purchaseId:       form.purchaseId,
      remark:           form.remark
    };
    try {
      await api.put(`/api/needtopurchase/${editing._id}`, payload);
      patchRow(editing._id, payload);
      closeEdit();
    } catch (e) {
      alert(e.response?.data?.message || e.message);
    }
  };

  if (busy) return <Box p={4}><Skeleton count={5} /></Box>;
  if (error) return <Box p={4} color="error.main">{error}</Box>;
  if (!items.length) return (
    <Box p={4} textAlign="center">
      <Typography variant="h6">No products require ordering right now.</Typography>
    </Box>
  );

  return (
    <Box p={2}>
      {/* Totals by Item */}
      <Paper sx={{ p:2, mb:3 }}>
        <Typography variant="h6" gutterBottom>Total Needed by Item</Typography>
        <Grid container spacing={2}>
          {totalsByItem.map(t => (
            <Grid item xs={6} sm={4} md={3} key={t._id}>
              <Paper variant="outlined" sx={{ p:1, textAlign:'center' }}>
                <Typography variant="subtitle2" noWrap>{t.name}</Typography>
                <Typography variant="h5">{t.totalNeeded}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Top Bar */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Products Needed to Purchase</Typography>
        <Button
          startIcon={<FilterAltOutlinedIcon />}
          variant="outlined"
          onClick={() => setSidebarOpen(true)}
          size={isMobile ? 'medium' : 'small'}
          sx={isMobile ? { position:'fixed', bottom:24, right:24, zIndex:1200 } : {}}
        >
          {isMobile ? null : 'Filters'}
        </Button>
      </Box>

      {/* Filters */}
      <Drawer
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        PaperProps={{ sx:{ width:280 } }}
      >
        <Box px={2} py={1} display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Filters</Typography>
          <IconButton onClick={() => setSidebarOpen(false)}><CloseIcon/></IconButton>
        </Box>
        <Box p={2} display="flex" flexDirection="column" gap={2}>
          <TextField label="Search" size="small" value={search} onChange={e => setSearch(e.target.value)} />
          <TextField label="Salesman" size="small" value={filterSalesman} onChange={e => setFilterSalesman(e.target.value)} />
          <TextField label="Remark"   size="small" value={filterRemark}   onChange={e => setFilterRemark(e.target.value)} />
          <FormControlLabel control={<Checkbox checked={onlyPurchased} onChange={e => setOnlyPurchased(e.target.checked)} />} label="Only Purchased" />
          <FormControlLabel control={<Checkbox checked={onlyVerified}  onChange={e => setOnlyVerified(e.target.checked)} />}  label="Only Verified" />
          <TextField label="Date From" type="date" size="small" InputLabelProps={{ shrink:true }} value={dateFrom} onChange={e=>setDateFrom(e.target.value)} />
          <TextField label="Date To"   type="date" size="small" InputLabelProps={{ shrink:true }} value={dateTo}   onChange={e=>setDateTo(e.target.value)} />
          <Button variant="outlined" color="error" fullWidth onClick={() => {
            setSearch(''); setFilterSalesman(''); setFilterRemark('');
            setOnlyPurchased(false); setOnlyVerified(false);
            setDateFrom(''); setDateTo('');
          }}>
            Reset Filters
          </Button>
        </Box>
      </Drawer>

      {/* Desktop Table */}
      <TableContainer component={Paper} sx={{ display:{ xs:'none', md:'block' } }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {[
                {id:'invoiceNo',label:'Invoice'},
                {id:'item_id',  label:'Item ID'},
                {id:'name',     label:'Product'},
                {id:'salesmanName',label:'Salesman'},
                {id:'quantityOrdered',label:'Ordered'},
                {id:'quantityNeeded',label:'Needed'},
                {id:'purchased',label:'Purchased'},
                {id:'verified', label:'Verified'},
                {id:'remark',   label:'Remark'}
              ].map(col => (
                <TableCell key={col.id} sortDirection={sortField===col.id?sortDir:false}>
                  <TableSortLabel
                    active={sortField===col.id}
                    direction={sortField===col.id?sortDir:'asc'}
                    onClick={()=>handleSort(col.id)}
                  >
                    {col.label}
                  </TableSortLabel>
                </TableCell>
              ))}
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sorted.map(it => (
              <TableRow key={it._id} hover>
                <TableCell>{it.invoiceNo}</TableCell>
                <TableCell>{it.item_id}</TableCell>
                <TableCell>{it.name}</TableCell>
                <TableCell>{it.salesmanName}</TableCell>
                <TableCell align="center">{it.quantityOrdered}</TableCell>
                <TableCell align="center">{it.quantityNeeded}</TableCell>
                <TableCell align="center">
                  {it.purchased
                    ? '✅'
                    : <Button size="small" onClick={()=>apiToggle(it._id,'purchased')}>Mark</Button>}
                </TableCell>
                <TableCell align="center">
                  {it.verified
                    ? '✅'
                    : userInfo.isSuper
                      ? <Button size="small" onClick={()=>apiToggle(it._id,'verified')}>Verify</Button>
                      : '-'}
                </TableCell>
                <TableCell>{it.remark}</TableCell>
                <TableCell>
                  {userInfo.isAdmin && <Button size="small" onClick={()=>openEdit(it)}>Edit</Button>}
                  {userInfo.isSuper && <Button size="small" color="error" onClick={()=>apiDelete(it._id)}>Delete</Button>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Box display="flex" justifyContent="center" my={2}>
          <Pagination count={totalPages} page={page} onChange={handleChangePage} color="primary"/>
        </Box>
      </TableContainer>

      {/* Mobile Cards */}
      <Box display={{ xs:'block', md:'none' }} mb={2}>
        {sorted.map(it => (
          <Paper key={it._id} variant="outlined" sx={{ p:2, mb:2 }}>
            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography fontWeight="bold" color="error.main">{it.invoiceNo}</Typography>
              <Box>
                {userInfo.isAdmin && <Button size="small" onClick={()=>openEdit(it)}>Edit</Button>}
                {userInfo.isSuper && <Button size="small" color="error" onClick={()=>apiDelete(it._id)}>Delete</Button>}
              </Box>
            </Box>
            <Box display="flex" mb={1}>
              {productMap[it.item_id]?.image
                ? <Box component="img" src={productMap[it.item_id].image} alt="" sx={{ width:48, height:48, mr:1, borderRadius:1 }}/>
                : <Box sx={{ width:48, height:48, bgcolor:'grey.300', mr:1 }}/>
              }
              <Box flex={1}>
                <Typography noWrap>{it.name}</Typography>
                <Typography variant="caption" color="text.secondary">{it.item_id}</Typography>
                <Typography variant="caption" color="text.secondary">Salesman: {it.salesmanName}</Typography>
              </Box>
            </Box>
            <Typography variant="caption" mb={1}>Remark: {it.remark}</Typography>
            <Box display="flex" justifyContent="space-between">
              <Box>
                <Typography variant="caption">Ordered: {it.quantityOrdered}</Typography>
                <Typography variant="caption">Needed: {it.quantityNeeded}</Typography>
              </Box>
              <Box>
                {it.purchased
                  ? <Typography variant="caption" color="success.main">Purchased</Typography>
                  : <Button size="small" onClick={()=>apiToggle(it._id,'purchased')}>Purchased</Button>}
                {it.verified
                  ? <Typography variant="caption" color="success.main">Verified</Typography>
                  : userInfo.isSuper
                    ? <Button size="small" onClick={()=>apiToggle(it._id,'verified')}>Verify</Button>
                    : null}
              </Box>
            </Box>
          </Paper>
        ))}
        <Box display="flex" justifyContent="center">
          <Pagination count={totalPages} page={page} onChange={handleChangePage} size="small"/>
        </Box>
      </Box>

      {/* Edit Dialog */}
      <Dialog open={drawerOpen} onClose={closeEdit} TransitionComponent={UpTransition} fullWidth maxWidth="md">
        <DialogTitle>Edit Need-to-Purchase</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                label="Invoice No"
                fullWidth size="small"
                value={form.invoiceNo}
                onChange={e => setForm({ ...form, invoiceNo: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6} md={4}>
              <TextField
                label="Ordered Qty"
                type="number"
                fullWidth size="small"
                value={form.quantityOrdered}
                onChange={e => setForm({ ...form, quantityOrdered: e.target.value })}
                InputProps={{ inputProps: { min: 0 } }}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6} md={4}>
              <TextField
                label="Needed Qty"
                type="number"
                fullWidth size="small"
                value={form.quantityNeeded}
                onChange={e => setForm({ ...form, quantityNeeded: e.target.value })}
                InputProps={{ inputProps: { min: 0 } }}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Purchase ID"
                fullWidth size="small"
                value={form.purchaseId}
                onChange={e => setForm({ ...form, purchaseId: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={8}>
              <TextField
                label="Remark"
                fullWidth size="small"
                value={form.remark}
                onChange={e => setForm({ ...form, remark: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6} md={4}>
              <FormControlLabel
                control={<Checkbox checked={form.purchased} onChange={e => setForm({ ...form, purchased: e.target.checked })}/>}
                label="Purchased"
              />
            </Grid>
            <Grid item xs={6} md={4}>
              <FormControlLabel
                control={<Checkbox checked={form.verified} onChange={e => setForm({ ...form, verified: e.target.checked })} disabled={!userInfo.isSuper}/>}
                label="Verified"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEdit}>Cancel</Button>
          <Button onClick={saveEdit}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
