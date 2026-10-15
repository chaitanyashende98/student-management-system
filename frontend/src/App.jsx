import { useCallback, useEffect, useMemo, useState } from 'react';
import { GraduationCap, Search, Plus, Users, Pencil, Trash2, X, RefreshCw, Mail, Building2, Hash, CheckCircle2, AlertCircle } from 'lucide-react';

const API = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');
const emptyForm = { studentId: '', name: '', email: '', department: '', semester: '1', contact: '' };

export default function App() {
  const [students, setStudents] = useState([]);
  const [query, setQuery] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [modal, setModal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const [error, setError] = useState('');
  const [apiStatus, setApiStatus] = useState('checking');

  const notify = (type, message) => { setNotice({ type, message }); window.setTimeout(() => setNotice(null), 3500); };
  const loadStudents = useCallback(async (search = query) => {
    setBusy(true); setError('');
    try {
      const response = await fetch(`${API}/api/students${search.trim() ? `?q=${encodeURIComponent(search.trim())}` : ''}`);
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Could not load students');
      setStudents(result.data || []); setApiStatus('online');
    } catch (e) { setError(`${e.message}. Check the backend URL and database connection.`); setApiStatus('offline'); }
    finally { setBusy(false); }
  }, [query]);

  useEffect(() => { loadStudents(''); }, []); // initial load
  useEffect(() => { const timer = window.setTimeout(() => loadStudents(query), 250); return () => window.clearTimeout(timer); }, [query, loadStudents]);

  const stats = useMemo(() => ({
    total: students.length,
    departments: new Set(students.map(s => s.department)).size,
    semesters: new Set(students.map(s => s.semester)).size
  }), [students]);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setModal(true); };
  const openEdit = student => {
    setEditing(student._id);
    setForm({ studentId: student.studentId, name: student.name, email: student.email, department: student.department, semester: String(student.semester), contact: student.contact || '' });
    setModal(true);
  };
  const saveStudent = async e => {
    e.preventDefault();
    setBusy(true);
    try {
      const response = await fetch(`${API}/api/students${editing ? `/${editing}` : ''}`, {
        method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, semester: Number(form.semester) })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Could not save student');
      notify('success', result.message || 'Saved successfully'); setModal(false); setForm(emptyForm); setEditing(null); await loadStudents(query);
    } catch (e) { notify('error', e.message); }
    finally { setBusy(false); }
  };
  const deleteStudent = async student => {
    if (!window.confirm(`Delete ${student.name} (${student.studentId})? This cannot be undone.`)) return;
    setBusy(true);
    try {
      const response = await fetch(`${API}/api/students/${student._id}`, { method: 'DELETE' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Could not delete student');
      notify('success', result.message || 'Student deleted'); await loadStudents(query);
    } catch (e) { notify('error', e.message); }
    finally { setBusy(false); }
  };

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-icon"><GraduationCap size={24}/></div><div><strong>StudentHub</strong><span>MANAGEMENT PORTAL</span></div></div>
      <div className="side-label">WORKSPACE</div>
      <div className="nav-item active"><Users size={18}/> Students <span className="nav-count">{students.length}</span></div>
      <div className="sidebar-bottom"><div className={`status-dot ${apiStatus}`}></div><div><strong>API connection</strong><span>{apiStatus === 'checking' ? 'Checking…' : apiStatus === 'online' ? 'Connected' : 'Unavailable'}</span></div></div>
    </aside>
    <main className="main">
      <header className="topbar"><div className="crumb">Workspace <span>/</span> <strong>Students</strong></div><div className="top-right"><span className="secure"><span/> Three-tier cloud app</span><div className="avatar">SH</div></div></header>
      <section className="content">
        <div className="page-heading"><div><div className="eyebrow">STUDENT DIRECTORY</div><h1>Student management</h1><p>Keep student records organized, searchable, and up to date.</p></div><button className="primary-btn" onClick={openAdd}><Plus size={18}/> Add student</button></div>
        {notice && <div className={`toast ${notice.type}`}><CheckCircle2 size={18}/>{notice.message}<button onClick={() => setNotice(null)}><X size={16}/></button></div>}
        <div className="stats-grid">
          <div className="stat-card"><div className="stat-icon purple"><Users size={20}/></div><div><span>Total students</span><strong>{stats.total}</strong><small>Matching records</small></div></div>
          <div className="stat-card"><div className="stat-icon blue"><Building2 size={20}/></div><div><span>Departments</span><strong>{stats.departments}</strong><small>Represented in results</small></div></div>
          <div className="stat-card"><div className="stat-icon green"><GraduationCap size={20}/></div><div><span>Semesters</span><strong>{stats.semesters}</strong><small>Represented in results</small></div></div>
        </div>
        <section className="panel">
          <div className="panel-header"><div><h2>All students</h2><p>Search, edit, or manage student records.</p></div><button className="icon-btn" title="Refresh" onClick={() => loadStudents(query)} disabled={busy}><RefreshCw size={17} className={busy ? 'spin' : ''}/></button></div>
          <div className="toolbar"><div className="search-box"><Search size={18}/><input aria-label="Search students" placeholder="Search by name, ID, email, department…" value={query} onChange={e => setQuery(e.target.value)}/>{query && <button onClick={() => setQuery('')} aria-label="Clear search"><X size={16}/></button>}</div><span className="result-count">{students.length} {students.length === 1 ? 'record' : 'records'}</span></div>
          {error && <div className="error-banner"><AlertCircle size={18}/><span>{error}</span><button onClick={() => loadStudents(query)}>Retry</button></div>}
          <div className="table-wrap"><table><thead><tr><th>STUDENT</th><th>STUDENT ID</th><th>DEPARTMENT</th><th>SEMESTER</th><th>CONTACT</th><th className="actions-heading">ACTIONS</th></tr></thead>
            <tbody>{students.map(student => <tr key={student._id}><td><div className="student-cell"><div className="student-avatar">{(student.name || '?').split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase()}</div><div><strong>{student.name}</strong><span><Mail size={13}/>{student.email}</span></div></div></td><td><span className="id-pill"><Hash size={12}/>{student.studentId}</span></td><td><span className="department">{student.department}</span></td><td><span className="semester-pill">Semester {student.semester}</span></td><td className="contact">{student.contact || '—'}</td><td><div className="row-actions"><button className="edit-action" title="Edit student" onClick={() => openEdit(student)}><Pencil size={15}/></button><button className="delete-action" title="Delete student" onClick={() => deleteStudent(student)}><Trash2 size={15}/></button></div></td></tr>)}</tbody>
          </table></div>
          {!students.length && !error && <div className="empty-state"><div className="empty-icon"><Users size={26}/></div><h3>{query ? 'No matching students' : 'No students yet'}</h3><p>{query ? 'Try a different name, ID, email, or department.' : 'Add your first student to get started.'}</p>{!query && <button className="primary-btn" onClick={openAdd}><Plus size={17}/> Add first student</button>}</div>}
          <div className="panel-footer"><span>Data is stored in MongoDB Atlas</span><span><span className={`tiny-dot ${apiStatus}`}></span>{apiStatus === 'online' ? 'Live data' : 'Waiting for API'}</span></div>
        </section>
        <footer>StudentHub <span>•</span> Three-tier architecture <span>•</span> Netlify + Render + MongoDB Atlas</footer>
      </section>
    </main>
    {modal && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setModal(false); }}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-heading"><div><span className="eyebrow">{editing ? 'UPDATE RECORD' : 'NEW RECORD'}</span><h2 id="modal-title">{editing ? 'Edit student' : 'Add a student'}</h2><p>Enter the student's information below.</p></div><button className="icon-btn" onClick={() => setModal(false)} aria-label="Close"><X size={19}/></button></div>
      <form onSubmit={saveStudent}><div className="form-grid">
        <label>Student ID *<input required maxLength="30" value={form.studentId} onChange={e => setForm({...form, studentId:e.target.value})} placeholder="e.g. ST101"/></label>
        <label>Full name *<input required maxLength="100" value={form.name} onChange={e => setForm({...form, name:e.target.value})} placeholder="e.g. Rahul Sharma"/></label>
        <label className="full">Email address *<input required type="email" value={form.email} onChange={e => setForm({...form, email:e.target.value})} placeholder="student@example.com"/></label>
        <label>Department *<input required value={form.department} onChange={e => setForm({...form, department:e.target.value})} placeholder="Computer Science"/></label>
        <label>Semester *<select required value={form.semester} onChange={e => setForm({...form, semester:e.target.value})}>{Array.from({length:12},(_,i)=><option key={i+1} value={i+1}>{i+1}</option>)}</select></label>
        <label className="full">Contact number<input maxLength="20" value={form.contact} onChange={e => setForm({...form, contact:e.target.value})} placeholder="Optional"/></label>
      </div><div className="modal-actions"><button type="button" className="secondary-btn" onClick={() => setModal(false)}>Cancel</button><button type="submit" className="primary-btn" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save changes' : <><Plus size={17}/> Add student</>}</button></div></form>
    </section></div>}
  </div>;
}
