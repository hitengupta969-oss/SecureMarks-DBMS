import React, { useEffect, useState } from 'react';
import { FileSpreadsheet, Search, Filter, ArrowUpDown, GraduationCap, BookOpen } from 'lucide-react';
import { api } from '../services/api';
import { EffectiveMark } from '../types';
import { HashBadge } from '../components/HashBadge';

export const MarksRegisterPage: React.FC = () => {
  const [marks, setMarks] = useState<EffectiveMark[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'student-grouped' | 'subject-grouped'>('table');
  const [sortBy, setSortBy] = useState<'roll' | 'marks' | 'time'>('roll');
  const [sortAsc, setSortAsc] = useState(true);

  useEffect(() => {
    loadMarks();
  }, []);

  const loadMarks = async () => {
    setIsLoading(true);
    try {
      const data = await api.getEffectiveMarks({ search: search || undefined });
      setMarks(data);
    } catch (err) {
      console.error('Failed to load marks register:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadMarks();
  };

  const sortedMarks = [...marks].sort((a, b) => {
    let cmp = 0;
    if (sortBy === 'roll') {
      cmp = a.roll_number.localeCompare(b.roll_number);
    } else if (sortBy === 'marks') {
      cmp = a.marks - b.marks;
    } else if (sortBy === 'time') {
      cmp = new Date(a.last_updated).getTime() - new Date(b.last_updated).getTime();
    }
    return sortAsc ? cmp : -cmp;
  });

  // Groupings
  const studentGroups: Record<string, EffectiveMark[]> = {};
  const subjectGroups: Record<string, EffectiveMark[]> = {};

  sortedMarks.forEach((m) => {
    const sKey = `${m.roll_number} - ${m.student_name}`;
    if (!studentGroups[sKey]) studentGroups[sKey] = [];
    studentGroups[sKey].push(m);

    const subKey = `${m.subject_code} - ${m.subject_name}`;
    if (!subjectGroups[subKey]) subjectGroups[subKey] = [];
    subjectGroups[subKey].push(m);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-cyan-400" />
            Official Academic Marks Register
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Rendered from PostgreSQL database view <code className="text-cyan-300 font-mono">v_effective_marks</code> (incorporating latest evaluated events)
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs">
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              viewMode === 'table' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Tabular View
          </button>
          <button
            onClick={() => setViewMode('student-grouped')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              viewMode === 'student-grouped' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Student-Wise
          </button>
          <button
            onClick={() => setViewMode('subject-grouped')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              viewMode === 'subject-grouped' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Subject-Wise
          </button>
        </div>
      </div>

      {/* Search & Sort Controls */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[240px] relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student, roll number, or subject..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-slate-200 placeholder-slate-500 focus:border-cyan-500"
          />
        </form>

        <div className="flex items-center gap-2">
          <span className="text-slate-400 flex items-center gap-1 font-semibold">
            <ArrowUpDown className="w-3.5 h-3.5" /> Sort:
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300"
          >
            <option value="roll">Roll Number</option>
            <option value="marks">Marks</option>
            <option value="time">Timestamp</option>
          </select>
          <button
            onClick={() => setSortAsc(!sortAsc)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
          >
            {sortAsc ? 'Asc' : 'Desc'}
          </button>
        </div>
      </div>

      {/* Main View Area */}
      {viewMode === 'table' && (
        <div className="bg-slate-900/80 rounded-2xl border border-slate-800/80 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 text-[11px] font-mono">
                <tr>
                  <th className="py-3 px-4">Roll No</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Examination</th>
                  <th className="py-3 px-4">Marks (100)</th>
                  <th className="py-3 px-4">Ledger Status</th>
                  <th className="py-3 px-4">Current Hash</th>
                  <th className="py-3 px-4">Last Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500">
                      Querying effective marks view from PostgreSQL...
                    </td>
                  </tr>
                ) : sortedMarks.length > 0 ? (
                  sortedMarks.map((m) => (
                    <tr key={`${m.student_id}-${m.subject_id}-${m.exam_id}`} className="hover:bg-slate-850/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-cyan-300">
                        {m.roll_number}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-200">
                        {m.student_name}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">
                        <span className="font-bold text-white">{m.subject_code}</span> &bull; {m.subject_name}
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {m.exam_name}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-extrabold text-emerald-400 text-sm">
                          {Number(m.marks).toFixed(2)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                          m.event_type === 'MARK_CORRECTED'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800/40'
                            : 'bg-slate-800 text-slate-300'
                        }`}>
                          Seq #{m.sequence_no} ({m.event_type})
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono">
                        <HashBadge hash={m.current_hash} truncateLength={5} />
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {new Date(m.last_updated).toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500">
                      No matching records in marks register.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Student-Wise View */}
      {viewMode === 'student-grouped' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(studentGroups).map(([studentTitle, records]) => {
            const avg = (records.reduce((acc, r) => acc + Number(r.marks), 0) / records.length).toFixed(2);
            return (
              <div key={studentTitle} className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-3">
                <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="font-bold text-white text-sm flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-cyan-400" />
                      {studentTitle}
                    </h3>
                    <span className="text-[11px] text-slate-400">
                      {records[0]?.department} &bull; Sem {records[0]?.student_semester}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Average</span>
                    <div className="text-base font-extrabold text-emerald-400">{avg}</div>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  {records.map((r) => (
                    <div key={r.subject_code} className="flex items-center justify-between p-2 rounded-lg bg-slate-950/70 border border-slate-800/60">
                      <div>
                        <span className="font-mono font-bold text-cyan-300">{r.subject_code}</span>
                        <span className="text-slate-300 ml-2">{r.subject_name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-extrabold text-emerald-400">{Number(r.marks).toFixed(2)}</span>
                        <HashBadge hash={r.current_hash} truncateLength={3} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Subject-Wise View */}
      {viewMode === 'subject-grouped' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(subjectGroups).map(([subjectTitle, records]) => {
            const avg = (records.reduce((acc, r) => acc + Number(r.marks), 0) / records.length).toFixed(2);
            return (
              <div key={subjectTitle} className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-3">
                <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="font-bold text-white text-sm flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-blue-400" />
                      {subjectTitle}
                    </h3>
                    <span className="text-[11px] text-slate-400">
                      {records.length} Students Evaluated &bull; {records[0]?.credits} Credits
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Course Avg</span>
                    <div className="text-base font-extrabold text-cyan-400">{avg}</div>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  {records.map((r) => (
                    <div key={r.roll_number} className="flex items-center justify-between p-2 rounded-lg bg-slate-950/70 border border-slate-800/60">
                      <div>
                        <span className="font-mono font-bold text-slate-200">{r.roll_number}</span>
                        <span className="text-slate-400 ml-2">{r.student_name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-extrabold text-emerald-400">{Number(r.marks).toFixed(2)}</span>
                        <HashBadge hash={r.current_hash} truncateLength={3} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
