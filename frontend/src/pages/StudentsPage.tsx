import React, { useEffect, useState } from 'react';
import { Users, Plus, Search, Filter, Trash2, Edit2, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { api } from '../services/api';
import { Student } from '../types';
import { useAuth } from '../hooks/useAuth';

export const StudentsPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [semester, setSemester] = useState<number | ''>('');

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newRoll, setNewRoll] = useState('');
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newDept, setNewDept] = useState('Computer Science & Engineering');
  const [newSem, setNewSem] = useState(6);
  const [formMsg, setFormMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadStudents();
  }, [department, semester]);

  const loadStudents = async () => {
    setIsLoading(true);
    try {
      const data = await api.getStudents({
        department: department || undefined,
        semester: semester !== '' ? Number(semester) : undefined,
        search: search || undefined
      });
      setStudents(data);
    } catch (err: any) {
      console.error('Failed to load students:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadStudents();
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMsg(null);
    try {
      await api.createStudent({
        roll_number: newRoll.trim().toUpperCase(),
        name: newName.trim(),
        email: newEmail.trim().toLowerCase(),
        department: newDept,
        semester: Number(newSem)
      });
      setFormMsg({ type: 'success', text: 'Student profile created successfully.' });
      setNewRoll('');
      setNewName('');
      setNewEmail('');
      loadStudents();
      setTimeout(() => {
        setIsAddOpen(false);
        setFormMsg(null);
      }, 1500);
    } catch (err: any) {
      setFormMsg({ type: 'error', text: err.message || 'Failed to create student' });
    }
  };

  const handleDelete = async (id: number, roll: string) => {
    if (!window.confirm(`Are you sure you want to delete student ${roll}? This will fail if historical marks exist in the cryptographic ledger.`)) {
      return;
    }
    try {
      await api.deleteStudent(id);
      loadStudents();
    } catch (err: any) {
      alert(`Deletion Prohibited: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            Student Management Directory
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage student academic profiles bound to immutable cryptographic marks entries
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setIsAddOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-md shadow-blue-950 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Register Student
          </button>
        )}
      </div>

      {/* Filter / Search Bar */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[200px] relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by roll number, student name, or email..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-500"
          />
        </form>

        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:border-cyan-500"
        >
          <option value="">All Departments</option>
          <option value="Computer Science & Engineering">Computer Science & Engineering</option>
          <option value="Information Technology">Information Technology</option>
        </select>

        <select
          value={semester}
          onChange={(e) => setSemester(e.target.value ? Number(e.target.value) : '')}
          className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:border-cyan-500"
        >
          <option value="">All Semesters</option>
          <option value="4">Semester 4</option>
          <option value="6">Semester 6</option>
        </select>

        <button
          onClick={loadStudents}
          className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
        >
          Apply Filters
        </button>
      </div>

      {/* Student Table */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 text-[11px] font-mono">
              <tr>
                <th className="py-3 px-4">Roll Number</th>
                <th className="py-3 px-4">Full Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Semester</th>
                <th className="py-3 px-4">Registration Date</th>
                {isAdmin && <th className="py-3 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Loading student records from PostgreSQL...
                  </td>
                </tr>
              ) : students.length > 0 ? (
                students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-850/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-cyan-300">
                      {student.roll_number}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-200">
                      {student.name}
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono">
                      {student.email}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {student.department}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px]">
                        Sem {student.semester}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {new Date(student.created_at).toLocaleDateString()}
                    </td>
                    {isAdmin && (
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDelete(student.id, student.roll_number)}
                          title="Delete profile (blocked if marks exist in ledger)"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No students match the criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Student Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm">Register New Student</h3>
              <button
                onClick={() => { setIsAddOpen(false); setFormMsg(null); }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formMsg && (
              <div className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                formMsg.type === 'success'
                  ? 'bg-emerald-950 border border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950 border border-rose-500/40 text-rose-300'
              }`}>
                {formMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span>{formMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleCreateStudent} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Roll Number (Unique ID)</label>
                <input
                  type="text"
                  required
                  value={newRoll}
                  onChange={(e) => setNewRoll(e.target.value)}
                  placeholder="CS2023015"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 uppercase font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Full Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Karan Sharma"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Student Email</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="karan.s@student.securemarks.edu"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Department</label>
                  <select
                    value={newDept}
                    onChange={(e) => setNewDept(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                  >
                    <option value="Computer Science & Engineering">CSE</option>
                    <option value="Information Technology">IT</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Semester</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    required
                    value={newSem}
                    onChange={(e) => setNewSem(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
