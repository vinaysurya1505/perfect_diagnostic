"use client";
import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

function generateBillNo(lastNo) {
  if (!lastNo) return 'B115710000';
  const num = parseInt(lastNo.replace('B', '')) + 1;
  return 'B' + num;
}

export default function BillingPage() {
  const [bills, setBills] = useState([]);
  const [tests, setTests] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [form, setForm] = useState({
    patient_name: '',
    patient_age: '',
    patient_gender: '',
    referred_doctor: '',
    self: false,
    gst: '',
    discount: '',
    selectedTests: [],
  });
  const [billNo, setBillNo] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [selectedBillTests, setSelectedBillTests] = useState([]);
  const printRef = useRef();

  const fetchData = async () => {
    setLoading(true);
    const [{ data: billsData }, { data: testsData }, { data: doctorsData }] = await Promise.all([
      supabase.from('bills').select('*').order('date', { ascending: false }),
      supabase.from('tests').select('*').order('name'),
      supabase.from('doctors').select('*').order('name'),
    ]);
    setBills(billsData || []);
    setTests(testsData || []);
    setDoctors(doctorsData || []);
    if (billsData && billsData.length > 0) setBillNo(generateBillNo(billsData[0].bill_no));
    else setBillNo('B115710000');
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleChange = e => {
    const { name, value } = e.target;
    if (name === 'referred_doctor') {
      if (value === 'self') {
        setForm(f => ({ ...f, referred_doctor: '', self: true }));
      } else {
        setForm(f => ({ ...f, referred_doctor: value, self: false }));
      }
    } else {
      setForm(f => ({ ...f, [name]: value }));
    }
  };

  const handleTestCheckbox = e => {
    const { value, checked } = e.target;
    setForm(f => ({
      ...f,
      selectedTests: checked
        ? [...f.selectedTests, value]
        : f.selectedTests.filter(id => id !== value)
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (!form.patient_name || !form.patient_age || !form.patient_gender || (!form.referred_doctor && !form.self) || form.selectedTests.length === 0) {
      setError('Please fill all required fields and select at least one test.');
      return;
    }
    const { data: bill, error: billError } = await supabase.from('bills').insert([{
      bill_no: billNo,
      date: new Date().toISOString(),
      patient_name: form.patient_name,
      patient_age: parseInt(form.patient_age),
      patient_gender: form.patient_gender,
      referred_doctor: form.self ? null : form.referred_doctor,
      self: form.self,
      gst: form.gst ? parseFloat(form.gst) : null,
      discount: form.discount ? parseFloat(form.discount) : null,
    }]).select().single();
    if (billError) return setError(billError.message);
    // Insert into bill_tests
    for (const testId of form.selectedTests) {
      await supabase.from('bill_tests').insert([{ bill_id: bill.id, test_id: testId }]);
    }
    setForm({ patient_name: '', patient_age: '', patient_gender: '', referred_doctor: '', self: false, gst: '', discount: '', selectedTests: [] });
    fetchData();
  };

  // Print/Download logic
  const handleShowBill = async (bill) => {
    setSelectedBill(bill);
    // Fetch tests for this bill
    const { data: billTests } = await supabase.from('bill_tests').select('test_id').eq('bill_id', bill.id);
    setSelectedBillTests(billTests ? billTests.map(bt => bt.test_id) : []);
    setShowModal(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (typeof window !== 'undefined') {
      const html2pdfScript = document.createElement('script');
      html2pdfScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      html2pdfScript.onload = () => {
        window.html2pdf(printRef.current, { margin: 0, filename: 'bill.pdf', jsPDF: { format: 'a4' } });
      };
      document.body.appendChild(html2pdfScript);
    }
  };

  return (
    <div style={{ maxWidth: 700, margin: '40px auto', padding: 24, background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
      <h2 style={{ color: '#00796b', textAlign: 'center' }}>Billing</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <input name="patient_name" placeholder="Patient Name" value={form.patient_name} onChange={handleChange} style={{ flex: 2, padding: 8 }} required />
        <input name="patient_age" placeholder="Age" type="number" value={form.patient_age} onChange={handleChange} style={{ flex: 1, padding: 8 }} required />
        <select name="patient_gender" value={form.patient_gender} onChange={handleChange} style={{ flex: 1, padding: 8 }} required>
          <option value="">Gender</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>
        <select name="referred_doctor" value={form.self ? 'self' : form.referred_doctor} onChange={handleChange} style={{ flex: 2, padding: 8 }} required>
          <option value="">Referred Doctor</option>
          <option value="self">Self</option>
          {doctors.map(d => <option key={d.id} value={d.id}>{d.name} ({d.location})</option>)}
        </select>
        <div style={{ width: '100%', margin: '8px 0' }}>
          <label style={{ fontWeight: 600, color: '#00796b' }}>Select Tests:</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
            {tests.map(t => (
              <label key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  value={t.id}
                  checked={form.selectedTests.includes(t.id)}
                  onChange={handleTestCheckbox}
                />
                {t.name} (₹{t.price})
              </label>
            ))}
          </div>
        </div>
        <input name="gst" placeholder="GST (optional)" type="number" value={form.gst} onChange={handleChange} style={{ flex: 1, padding: 8 }} />
        <input name="discount" placeholder="Discount (optional)" type="number" value={form.discount} onChange={handleChange} style={{ flex: 1, padding: 8 }} />
        <input value={billNo} readOnly style={{ flex: 2, padding: 8, background: '#e0e0e0' }} title="Bill No" />
        <button type="submit" style={{ background: '#00796b', color: '#fff', border: 'none', borderRadius: 6, padding: '0 16px', fontWeight: 600 }}>Create Bill</button>
      </form>
      {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
      {loading ? <div>Loading...</div> : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 24 }}>
          <thead>
            <tr style={{ background: '#e0f2f1' }}>
              <th style={{ padding: 8 }}>Bill No</th>
              <th style={{ padding: 8 }}>Date</th>
              <th style={{ padding: 8 }}>Patient</th>
              <th style={{ padding: 8 }}>Age</th>
              <th style={{ padding: 8 }}>Gender</th>
              <th style={{ padding: 8 }}>Doctor</th>
              <th style={{ padding: 8 }}>Tests</th>
              <th style={{ padding: 8 }}>GST</th>
              <th style={{ padding: 8 }}>Discount</th>
              <th style={{ padding: 8 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bills.map(bill => (
              <tr key={bill.id}>
                <td style={{ padding: 8 }}>{bill.bill_no}</td>
                <td style={{ padding: 8 }}>{new Date(bill.date).toLocaleString()}</td>
                <td style={{ padding: 8 }}>{bill.patient_name}</td>
                <td style={{ padding: 8 }}>{bill.patient_age}</td>
                <td style={{ padding: 8 }}>{bill.patient_gender}</td>
                <td style={{ padding: 8 }}>{bill.self ? 'Self' : (doctors.find(d => d.id === bill.referred_doctor)?.name || '')}</td>
                <td style={{ padding: 8 }}>
                  <BillTests billId={bill.id} tests={tests} />
                </td>
                <td style={{ padding: 8 }}>{bill.gst || '-'}</td>
                <td style={{ padding: 8 }}>{bill.discount || '-'}</td>
                <td style={{ padding: 8 }}>
                  <button onClick={() => handleShowBill(bill)} style={{ background: '#00796b', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', fontWeight: 600 }}>Print/Download</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {showModal && selectedBill && (
        <BillPrintModal
          bill={selectedBill}
          tests={tests}
          doctors={doctors}
          billTestIds={selectedBillTests}
          onClose={() => setShowModal(false)}
          printRef={printRef}
          onPrint={handlePrint}
          onDownload={handleDownloadPDF}
        />
      )}
    </div>
  );
}

function BillTests({ billId, tests }) {
  const [billTests, setBillTests] = useState([]);
  useEffect(() => {
    supabase.from('bill_tests').select('test_id').eq('bill_id', billId).then(({ data }) => {
      setBillTests(data ? data.map(bt => bt.test_id) : []);
    });
  }, [billId]);
  return (
    <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
      {billTests.map(tid => <li key={tid}>{tests.find(t => t.id === tid)?.name || ''}</li>)}
    </ul>
  );
}

function BillPrintModal({ bill, tests, doctors, billTestIds, onClose, printRef, onPrint, onDownload }) {
  // Calculate subtotal, GST, discount, total from bill record
  const testList = tests.filter(t => billTestIds.includes(t.id));
  const subtotal = testList.reduce((sum, t) => sum + Number(t.price), 0);
  const gst = bill.gst !== null && bill.gst !== undefined ? Number(bill.gst) : 0;
  const discount = bill.discount !== null && bill.discount !== undefined ? Number(bill.discount) : 0;
  const total = subtotal + gst - discount;
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflow: 'auto'
    }}>
      <div style={{ background: '#fff', padding: 32, borderRadius: 12, width: '800px', marginTop: 24, boxShadow: '0 4px 24px rgba(0,0,0,0.15)' }}>
        <div ref={printRef} style={{ fontFamily: 'Arial, sans-serif', color: '#222', background: '#fff', width: '100%' }}>
          <h2 style={{ textAlign: 'center', margin: 0 }}>Perfect Diagnostic and Ultrasound Centre</h2>
          <div style={{ textAlign: 'center', fontSize: 15, marginBottom: 8 }}>
            Near Government Hospital, Front of Old Gate, Partawal Bazar, Maharajganj, Uttar Pradesh<br />
            Phone: +91 9838104111 , +91 9616434212 | Email: perfectdiagnostic@gmail.com
          </div>
          <hr />
          <div style={{ display: 'flex', justifyContent: 'space-between', margin: '16px 0' }}>
            <div>
              <b>Patient Information</b><br />
              Name: {bill.patient_name}<br />
              Age/Gender: {bill.patient_age} Years / {bill.patient_gender}<br />
              {/* Mobile and Unique Code can be added here if available */}
            </div>
            <div>
              <b>Bill Details</b><br />
              Bill No: {bill.bill_no}<br />
              Date: {new Date(bill.date).toLocaleDateString()}<br />
              Doctor Referred: {bill.self ? 'Self' : (doctors.find(d => d.id === bill.referred_doctor)?.name || '')}
            </div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 16, fontSize: 15 }} border={1}>
            <thead style={{ background: '#eaf4fa' }}>
              <tr>
                <th style={{ padding: 8 }}>S.No</th>
                <th style={{ padding: 8 }}>Test Name</th>
                <th style={{ padding: 8 }}>Price (INR)</th>
              </tr>
            </thead>
            <tbody>
              {testList.map((t, i) => (
                <tr key={t.id}>
                  <td style={{ padding: 8, textAlign: 'center' }}>{i + 1}</td>
                  <td style={{ padding: 8 }}>{t.name}</td>
                  <td style={{ padding: 8, textAlign: 'right' }}>{Number(t.price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
              <tr>
                <td colSpan={2} style={{ textAlign: 'right', fontWeight: 600, padding: 8 }}>Subtotal:</td>
                <td style={{ textAlign: 'right', fontWeight: 600, padding: 8 }}>{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr>
                <td colSpan={2} style={{ textAlign: 'right', fontWeight: 600, padding: 8 }}>GST:</td>
                <td style={{ textAlign: 'right', fontWeight: 600, padding: 8 }}>{gst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr>
                <td colSpan={2} style={{ textAlign: 'right', fontWeight: 600, padding: 8 }}>Discount:</td>
                <td style={{ textAlign: 'right', fontWeight: 600, padding: 8 }}>{discount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr>
                <td colSpan={2} style={{ textAlign: 'right', fontWeight: 700, padding: 8, fontSize: 16 }}>Total:</td>
                <td style={{ textAlign: 'right', fontWeight: 700, padding: 8, fontSize: 16 }}>{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
          <button onClick={onPrint} style={{ background: '#00796b', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 24px', fontWeight: 600 }}>Print</button>
          <button onClick={onDownload} style={{ background: '#00796b', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 24px', fontWeight: 600 }}>Download PDF</button>
          <button onClick={onClose} style={{ background: '#eee', color: '#333', border: 'none', borderRadius: 6, padding: '8px 24px', fontWeight: 600 }}>Close</button>
        </div>
      </div>
    </div>
  );
}

