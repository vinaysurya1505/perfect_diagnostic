"use client";
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', location: '' });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  const fetchDoctors = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('doctors').select('*').order('name');
    if (error) setError(error.message);
    setDoctors(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchDoctors(); }, []);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (!form.name) return setError('Name is required');
    if (editingId) {
      const { error } = await supabase.from('doctors').update(form).eq('id', editingId);
      if (error) return setError(error.message);
    } else {
      const { error } = await supabase.from('doctors').insert([form]);
      if (error) return setError(error.message);
    }
    setForm({ name: '', location: '' });
    setEditingId(null);
    fetchDoctors();
  };

  const handleEdit = doctor => {
    setForm({ name: doctor.name, location: doctor.location || '' });
    setEditingId(doctor.id);
  };

  const handleDelete = async id => {
    if (!window.confirm('Delete this doctor?')) return;
    const { error } = await supabase.from('doctors').delete().eq('id', id);
    if (error) setError(error.message);
    fetchDoctors();
  };

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', padding: 24, background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
      <h2 style={{ color: '#00796b', textAlign: 'center' }}>Doctor Management</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <input name="name" placeholder="Doctor Name" value={form.name} onChange={handleChange} style={{ flex: 2, padding: 8 }} />
        <input name="location" placeholder="Location" value={form.location} onChange={handleChange} style={{ flex: 2, padding: 8 }} />
        <button type="submit" style={{ background: '#00796b', color: '#fff', border: 'none', borderRadius: 6, padding: '0 16px', fontWeight: 600 }}>{editingId ? 'Update' : 'Add'}</button>
      </form>
      {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
      {loading ? <div>Loading...</div> : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#e0f2f1' }}>
              <th style={{ padding: 8 }}>Name</th>
              <th style={{ padding: 8 }}>Location</th>
              <th style={{ padding: 8 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {doctors.map(doctor => (
              <tr key={doctor.id}>
                <td style={{ padding: 8 }}>{doctor.name}</td>
                <td style={{ padding: 8 }}>{doctor.location}</td>
                <td style={{ padding: 8 }}>
                  <button onClick={() => handleEdit(doctor)} style={{ marginRight: 8 }}>Edit</button>
                  <button onClick={() => handleDelete(doctor.id)} style={{ color: 'red' }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

