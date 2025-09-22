"use client";
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function TestsPage() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', price: '', description: '' });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  const fetchTests = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('tests').select('*').order('name');
    if (error) setError(error.message);
    setTests(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchTests(); }, []);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.price) return setError('Name and price are required');
    if (editingId) {
      const { error } = await supabase.from('tests').update({ ...form, price: parseFloat(form.price) }).eq('id', editingId);
      if (error) return setError(error.message);
    } else {
      const { error } = await supabase.from('tests').insert([{ ...form, price: parseFloat(form.price) }]);
      if (error) return setError(error.message);
    }
    setForm({ name: '', price: '', description: '' });
    setEditingId(null);
    fetchTests();
  };

  const handleEdit = test => {
    setForm({ name: test.name, price: test.price, description: test.description || '' });
    setEditingId(test.id);
  };

  const handleDelete = async id => {
    if (!window.confirm('Delete this test?')) return;
    const { error } = await supabase.from('tests').delete().eq('id', id);
    if (error) setError(error.message);
    fetchTests();
  };

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', padding: 24, background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
      <h2 style={{ color: '#00796b', textAlign: 'center' }}>Test Management</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <input name="name" placeholder="Test Name" value={form.name} onChange={handleChange} style={{ flex: 2, padding: 8 }} />
        <input name="price" placeholder="Price" type="number" value={form.price} onChange={handleChange} style={{ flex: 1, padding: 8 }} />
        <input name="description" placeholder="Description" value={form.description} onChange={handleChange} style={{ flex: 2, padding: 8 }} />
        <button type="submit" style={{ background: '#00796b', color: '#fff', border: 'none', borderRadius: 6, padding: '0 16px', fontWeight: 600 }}>{editingId ? 'Update' : 'Add'}</button>
      </form>
      {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
      {loading ? <div>Loading...</div> : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#e0f2f1' }}>
              <th style={{ padding: 8 }}>Name</th>
              <th style={{ padding: 8 }}>Price</th>
              <th style={{ padding: 8 }}>Description</th>
              <th style={{ padding: 8 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tests.map(test => (
              <tr key={test.id}>
                <td style={{ padding: 8 }}>{test.name}</td>
                <td style={{ padding: 8 }}>{test.price}</td>
                <td style={{ padding: 8 }}>{test.description}</td>
                <td style={{ padding: 8 }}>
                  <button onClick={() => handleEdit(test)} style={{ marginRight: 8 }}>Edit</button>
                  <button onClick={() => handleDelete(test.id)} style={{ color: 'red' }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

