import React from 'react';
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Font
} from '@react-pdf/renderer';

// Example: You can also register a custom font if you want
// Font.register({ family: 'Open Sans', src: '/fonts/OpenSans-Regular.ttf' });

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    fontSize: 10,
    padding: 20
  },
  section: {
    marginBottom: 6
  },
  header: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    marginBottom: 4,
    paddingBottom: 2
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2
  },
  cell: {
    flex: 1
  },
  bold: {
    fontWeight: 'bold'
  },
  hr: {
    borderBottomColor: '#000',
    borderBottomWidth: 1,
    marginVertical: 4
  }
});

const ExportPDFView = ({ billing }) => {
  if (!billing) return null;

  const {
    invoiceNo,
    invoiceDate,
    expectedDeliveryDate,
    showroom,
    salesmanName,
    salesmanPhoneNumber,
    customerName,
    customerAddress,
    customerContactNumber,
    products,
    billingAmount,
    discount,
    grandTotal,
    billingAmountReceived,
    paymentStatus,
    remark,
    deliveries,
    payments,
    isApproved,
    approvedBy,
    neededToPurchase,
    deliveryStatus,
    marketedBy
  } = billing;

  const formattedInvoiceDate = invoiceDate ? new Date(invoiceDate).toLocaleDateString('en-GB') : '';
  const formattedExpectedDeliveryDate = expectedDeliveryDate
    ? new Date(expectedDeliveryDate).toLocaleDateString('en-GB')
    : '';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Title / Header */}
        <View style={[styles.section, { textAlign: 'center' }]}>
          <Text style={styles.header}>INVOICE #{invoiceNo}</Text>
        </View>

        {/* Basic Info */}
        <View style={styles.section}>
          <View style={styles.row}>
            <Text>Invoice Date: {formattedInvoiceDate}</Text>
            <Text>Expected Delivery: {formattedExpectedDeliveryDate}</Text>
          </View>
          <View style={styles.row}>
            <Text>Salesman: {salesmanName} {salesmanPhoneNumber && `(${salesmanPhoneNumber})`}</Text>
            <Text>Showroom: {showroom}</Text>
          </View>
        </View>

        <View style={styles.hr} />

        {/* Customer Info */}
        <View style={styles.section}>
          <Text style={styles.bold}>Billed To:</Text>
          <Text>{customerName}</Text>
          <Text>{customerAddress}</Text>
          {customerContactNumber && <Text>Contact: {customerContactNumber}</Text>}
        </View>

        <View style={styles.hr} />

        {/* Product Table */}
        <View style={styles.section}>
          <Text style={[styles.bold, { marginBottom: 4 }]}>Products</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.cell, { flex: 0.3 }]}>#</Text>
            <Text style={[styles.cell, { flex: 1.8 }]}>Item</Text>
            <Text style={[styles.cell, { flex: 0.7 }]}>Qty</Text>
            <Text style={[styles.cell, { flex: 0.7 }]}>Price</Text>
            <Text style={[styles.cell, { flex: 0.7 }]}>GST</Text>
            <Text style={[styles.cell, { flex: 0.9, textAlign: 'right' }]}>Amount</Text>
          </View>

          {products && products.map((prod, index) => {
            const amount = (prod.sellingPrice || 0) * (prod.quantity || 0);
            return (
              <View style={styles.tableRow} key={prod._id || index}>
                <Text style={[styles.cell, { flex: 0.3 }]}>{index + 1}</Text>
                <Text style={[styles.cell, { flex: 1.8 }]}>{prod.name}</Text>
                <Text style={[styles.cell, { flex: 0.7 }]}>{prod.quantity}</Text>
                <Text style={[styles.cell, { flex: 0.7 }]}>{prod.sellingPrice}</Text>
                <Text style={[styles.cell, { flex: 0.7 }]}>{prod.gstRate}%</Text>
                <Text style={[styles.cell, { flex: 0.9, textAlign: 'right' }]}>{amount.toFixed(2)}</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.hr} />

        {/* Totals */}
        <View style={styles.section}>
          <View style={styles.row}>
            <Text>Billing Amount:</Text>
            <Text>{billingAmount?.toFixed(2)}</Text>
          </View>
          <View style={styles.row}>
            <Text>Discount:</Text>
            <Text>{discount?.toFixed(2)}</Text>
          </View>
          <View style={styles.row}>
            <Text>Grand Total:</Text>
            <Text>{grandTotal?.toFixed(2)}</Text>
          </View>
          <View style={styles.row}>
            <Text>Received:</Text>
            <Text>{billingAmountReceived?.toFixed(2)}</Text>
          </View>
          <View style={styles.row}>
            <Text>Payment Status:</Text>
            <Text>{paymentStatus}</Text>
          </View>
        </View>

        <View style={styles.hr} />

        {/* Deliveries */}
        <View style={styles.section}>
          <Text style={[styles.bold, { marginBottom: 4 }]}>Deliveries (Status: {deliveryStatus})</Text>
          {(!deliveries || deliveries.length === 0) ? (
            <Text>No deliveries</Text>
          ) : (
            deliveries.map((delivery, dIdx) => (
              <View key={delivery.deliveryId || dIdx} style={{ marginBottom: 4 }}>
                <Text style={styles.bold}>
                  {dIdx + 1}. {delivery.driverName || 'Driver N/A'} - {delivery.deliveryStatus || 'Pending'}
                </Text>
                <Text>Vehicle: {delivery.vehicleNumber || 'N/A'} | KM: {delivery.kmTravelled || 0}</Text>
                <Text>Fuel Charge: {delivery.fuelCharge || 0} | Method: {delivery.method || 'N/A'}</Text>
                {delivery.productsDelivered && delivery.productsDelivered.length > 0 && (
                  <Text style={{ marginTop: 2 }}>Delivered Products:</Text>
                )}
                {delivery.productsDelivered && delivery.productsDelivered.map((dp, dpIdx) => (
                  <Text key={dpIdx}>- {dp.item_id}: {dp.deliveredQuantity} (PS Ratio: {dp.psRatio || 'N/A'})</Text>
                ))}
                {delivery.otherExpenses && delivery.otherExpenses.length > 0 && (
                  <>
                    <Text style={{ marginTop: 2 }}>Other Expenses:</Text>
                    {delivery.otherExpenses.map((exp, eIdx) => (
                      <Text key={exp._id || eIdx}>
                        - Amount: {exp.amount || 0}, Remark: {exp.remark || 'N/A'}
                      </Text>
                    ))}
                  </>
                )}
              </View>
            ))
          )}
        </View>

        <View style={styles.hr} />

        {/* Payments */}
        <View style={styles.section}>
          <Text style={[styles.bold, { marginBottom: 4 }]}>Payments</Text>
          {(!payments || payments.length === 0) ? (
            <Text>No payments</Text>
          ) : (
            payments.map((pmt, idx) => {
              const paymentDate = pmt.date ? new Date(pmt.date).toLocaleDateString('en-GB') : '';
              return (
                <View key={idx} style={{ marginBottom: 2 }}>
                  <Text>- {paymentDate} | Amount: {pmt.amount} | Method: {pmt.method}</Text>
                  <Text>  Reference: {pmt.referenceId} | Remark: {pmt.remark || 'N/A'}</Text>
                </View>
              );
            })
          )}
        </View>

        <View style={styles.hr} />

        {/* Additional Info */}
        <View style={styles.section}>
          <Text style={styles.bold}>Additional Info</Text>
          <Text>Is Approved: {isApproved ? 'Yes' : 'No'}, Approved By: {approvedBy || 'N/A'}</Text>
          <Text>Needed To Purchase: {neededToPurchase ? 'Yes' : 'No'}</Text>
          <Text>Marketed By: {marketedBy || 'N/A'}</Text>
        </View>

        <View style={styles.hr} />

        {/* Remarks */}
        <View style={styles.section}>
          <Text style={styles.bold}>Remarks:</Text>
          <Text>{remark || 'No remarks.'}</Text>
        </View>

      </Page>
    </Document>
  );
};

export default ExportPDFView;
