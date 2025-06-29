/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import api from '../api';                    // ← adjust if your api helper lives elsewhere
import ApexPieChart from './components/apexChart';   // ← adjust the relative path if needed
import ApexPolarChart from 'sections/charts/apexchart/ApexPolarChart'

/* Hero-icons v2 (tailwindcss-style) */
import {
  HiClipboard,
  HiTruck,
  HiArrowTrendingUp,
  HiBanknotes,
  HiReceiptRefund,
  HiExclamationTriangle,
  HiMiniDocumentCurrencyYen
} from 'react-icons/hi2';
import { Grid } from '@mui/material';
import MainCard from 'components/MainCard';

/* ────────────────────────────────────────────────────────── */
/*  icon + colour mapping per stat label                      */
const meta = {
  'Total Bills'      : { icon: HiClipboard,            colour: 'red'    },
  Purchases          : { icon: HiArrowTrendingUp,      colour: 'green'  },
  Returns            : { icon: HiReceiptRefund,        colour: 'yellow' },
  Damages            : { icon: HiExclamationTriangle,  colour: 'gray'   },
  Deliveries         : { icon: HiTruck,                colour: 'blue'   },
  'Accounts Balance' : { icon: HiBanknotes,            colour: 'purple' },
  'Payments In'      : { icon: HiMiniDocumentCurrencyYen, colour: 'green'  },
  'Payments Out'     : { icon: HiMiniDocumentCurrencyYen, colour: 'red'    },
  'Payments Transfer': { icon: HiMiniDocumentCurrencyYen, colour: 'blue'   }
};

/* ────────────────────────────────────────────────────────── */
/*  small stat card                                           */
const StatCard = ({ label, value }) => {
  const { icon: Icon, colour } = meta[label];
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-3">
      <div
        className={`shrink-0 h-10 w-10 flex items-center justify-center rounded-lg bg-${colour}-100 text-${colour}-600`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <p className="text-[10px] uppercase tracking-wide text-gray-500">
          {label}
        </p>
        <p className="text-lg font-semibold text-gray-800">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
      </div>
    </div>
  );
};

/* ────────────────────────────────────────────────────────── */
/*  main page component                                       */
export default function DailyReport() {
  const todayISO = new Date().toISOString().slice(0, 10);

  const [from, setFrom]     = useState(todayISO);  // range start
  const [to,   setTo]       = useState(todayISO);  // range end
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(false);

  /* fetch report for a given range */
  const fetchReport = async (fromDate = from, toDate = to) => {
    setLoading(true);
    try {
      const res = await api.get(
        `/api/daily/daily/report?from=${fromDate}&to=${toDate}`
      );
      setData(res.data);
    } catch (err) {
      /* eslint-disable no-console */
      console.error(err);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  /* run every time the date range changes */
  useEffect(() => {
    fetchReport();
  }, [from, to]);

  /* derive chart data (simple pie) */
  const chartLabels = [
    'Sales',
    'Purchases',
    'Returns',
    'Damages',
    'Payments Out'
  ];
  const chartSeries = data
    ? [
        data.totalBills,
        data.totalPurchases,
        data.totalReturns,
        data.totalDamages,
        data.paymentsOut
      ]
    : [];

  /* ──────────────────────────────────────────────────────── */
  /*  render                                                  */
  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* header & range picker */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-red-600">Daily Report</h1>

        <div className="flex items-center gap-3 text-xs">
          <label className="flex items-center gap-2">
            <span className="text-gray-500 hidden sm:inline">From:</span>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="appearance-none border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-red-400"
            />
          </label>

          <label className="flex items-center gap-2">
            <span className="text-gray-500 hidden sm:inline">To:</span>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="appearance-none border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-red-400"
            />
          </label>
        </div>
      </div>

      {/* loader */}
      {loading && (
        <p className="text-xs text-center text-gray-500 py-8">Loading…</p>
      )}

      {/* stats + chart content */}
      {data && (
        <>
          {/* stat cards grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-8">
            <StatCard label="Total Bills"       value={`₹ ${data.totalBills}`}       />
            <StatCard label="Purchases"         value={`₹ ${data.totalPurchases}`}  />
            <StatCard label="Returns"           value={`₹ ${data.totalReturns}`}    />
            <StatCard label="Damages"           value={`₹ ${data.totalDamages}`}    />
            <StatCard label="Deliveries"        value={data.deliveryCount}          />
            <StatCard label="Accounts Balance"  value={`₹ ${data.accountsBalance}`} />
            <StatCard label="Payments In"       value={`₹ ${data.paymentsIn}`}      />
            <StatCard label="Payments Out"      value={`₹ ${data.paymentsOut}`}     />
            <StatCard label="Payments Transfer" value={`₹ ${data.paymentsTransfer}`}/>
          </div>

          {/* pie chart */}
          <div>
        <MainCard title="Report">
          <ApexPieChart labels={chartLabels} series={chartSeries} />
        </MainCard>
          </div>


          {/* leave list */}
          <section className="bg-white rounded-xl shadow-sm p-5 mb-8">
            <h2 className="text-sm font-bold text-red-600 mb-3">
              Today’s Leave Applications
            </h2>
            {data.todaysLeaves.length === 0 ? (
              <p className="text-xs text-gray-500">None</p>
            ) : (
              <ul className="space-y-2">
                {data.todaysLeaves.map((l) => (
                  <li
                    key={l._id ?? l.userId}
                    className="text-xs text-gray-700 flex justify-between"
                  >
                    <span className="font-medium">{l.userName}</span>
                    <span className="italic text-gray-500">{l.reason}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* footer timestamp */}
          <p className="text-[10px] text-gray-400 text-center">
            Last updated {format(new Date(), 'dd MMM yyyy, HH:mm')}
          </p>
        </>
      )}
    </div>
  );
}
