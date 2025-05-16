/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import api from '../api';
import { format } from 'date-fns';
import {
  HiClipboard,
  HiTruck,
  HiArrowTrendingUp,
  HiBanknotes,
  HiReceiptRefund,
  HiExclamationTriangle,
  HiMiniDocumentCurrencyYen
} from 'react-icons/hi2';

/* ────────────────────────────────────────────────────────── */
/*  tiny util: pick icon + colour per label                  */
const meta = {
  'Total Bills'      : { icon: HiClipboard, colour: 'red'    },
  Purchases          : { icon: HiArrowTrendingUp, colour: 'green' },
  Returns            : { icon: HiReceiptRefund,  colour: 'yellow' },
  Damages            : { icon: HiExclamationTriangle, colour: 'gray' },
  Deliveries         : { icon: HiTruck,           colour: 'blue'  },
  'Accounts Balance' : { icon: HiBanknotes,       colour: 'purple'},
  'Payments In'      : { icon: HiMiniDocumentCurrencyYen,            colour: 'green' },
  'Payments Out'     : { icon: HiMiniDocumentCurrencyYen,            colour: 'red'   }
};

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
export default function DailyReport() {
  const [date, setDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [data, setData]   = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = async (d = date) => {
    setLoading(true);
    try {
      const res = await api.get(`/api/daily/daily/report?date=${d}`);
      setData(res.data);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [date]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-red-600">Daily Report</h1>

        <label className="flex items-center gap-2 text-xs">
          <span className="text-gray-500 hidden sm:inline">Date:</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="appearance-none border border-gray-300 rounded-md px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent"
          />
        </label>
      </div>

      {loading && (
        <p className="text-xs text-center text-gray-500 py-8">
          Loading…
        </p>
      )}

      {data && (
        <>
          {/* stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-8">
            <StatCard label="Total Bills"      value={`₹ ${data.totalBills}`}        />
            <StatCard label="Purchases"        value={`₹ ${data.totalPurchases}`}   />
            <StatCard label="Returns"          value={`₹ ${data.totalReturns}`}     />
            <StatCard label="Damages"          value={`₹ ${data.totalDamages}`}     />
            <StatCard label="Deliveries"       value={data.deliveryCount}           />
            <StatCard label="Accounts Balance" value={`₹ ${data.accountsBalance}`}  />
            <StatCard label="Payments In"      value={`₹ ${data.paymentsIn}`}       />
            <StatCard label="Payments Out"     value={`₹ ${data.paymentsOut}`}      />
          </div>

          {/* leaves */}
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
                    key={l._id || l.userId}
                    className="text-xs text-gray-700 flex justify-between"
                  >
                    <span className="font-medium">{l.userName}</span>
                    <span className="italic text-gray-500">{l.reason}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <p className="text-[10px] text-gray-400 text-center">
            Last updated {format(new Date(), 'dd MMM yyyy, HH:mm')}
          </p>
        </>
      )}
    </div>
  );
}
