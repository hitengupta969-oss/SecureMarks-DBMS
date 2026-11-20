import React, { useState, useEffect } from 'react';
import { FileEdit, ShieldCheck, CheckCircle2, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
import { api } from '../services/api';
import { Student, Subject, Exam } from '../types';
import { HashBadge } from '../components/HashBadge';

interface Props {
  onMarksSaved?: () => void;
}

export const MarksEntryPage: React.FC<Props> = ({ onMarksSaved }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [selectedStudent, setSelectedStudent] = useState<number | ''>('');
  const [selectedSubject, setSelectedSubject] = useState<number | ''>('');
  const [selectedExam, setSelectedExam] = useState<number | ''>('');
  const [marksValue, setMarksValue] = useState<string>('');
  const [isCorrectionMode, setIsCorrectionMode] = useState(false);
  const [correctionReason, setCorrectionReason] = useState('Re-evaluation following student RTI request');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultMsg, setResultMsg] = useState<{
    type: 'success' | 'error';
    text: string;
    details?: {
      sequence_no: number;
      current_hash: string;
      previous_hash: string;
      event_type: string;
    };
  } | null>(null);

  useEffect(() => {
    loadPrerequisites();
  }, []);

  const loadPrerequisites = async () => {
    setIsLoading(true);
    try {
      const [stu, sub, exm] = await Promise.all([
        api.getStudents(),
        api.getSubjects(),
        api.getExams(),
      ]);
      setStudents(stu);
      setSubjects(sub);
      setExams(exm);
      if (stu.length > 0) setSelectedStudent(stu[0].id);
      if (sub.length > 0) setSelectedSubject(sub[0].id);
      if (exm.length > 0) setSelectedExam(exm[0].id);
    } catch (err) {
      console.error('Failed to load prerequisites:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !selectedSubject || !selectedExam || marksValue === '') {
      setResultMsg({ type: 'error', text: 'Please fill in all mandatory fields.' });
      return;
    }

    const marksNum = parseFloat(marksValue);
    if (isNaN(marksNum) || marksNum < 0 || marksNum > 100) {
      setResultMsg({ type: 'error', text: 'Marks must be a valid number between 0 and 100.' });
      return;
    }

    setIsSubmitting(true);
    setResultMsg(null);

    try {
      if (isCorrectionMode) {
        const res = await api.correctMarks({
          student_id: Number(selectedStudent),
          subject_id: Number(selectedSubject),
          exam_id: Number(selectedExam),
          corrected_marks: marksNum,
          reason: correctionReason,
        });
        setResultMsg({
          type: 'success',
          text: 'Authorized mark correction appended to ledger.',
          details: {
            sequence_no: res.sequence_no,
            current_hash: res.current_hash,
            previous_hash: res.previous_hash,
            event_type: 'MARK_CORRECTED',
          },
        });
      } else {
        const res = await api.enterMarks({
          student_id: Number(selectedStudent),
          subject_id: Number(selectedSubject),
          exam_id: Number(selectedExam),
          marks: marksNum,
        });
        setResultMsg({
          type: 'success',
          text: 'Marks recorded successfully and sealed by PostgreSQL trigger.',
          details: {
            sequence_no: res.sequence_no,
            current_hash: res.current_hash,
            previous_hash: res.previous_hash,
            event_type: 'MARK_ENTERED',
          },
        });
      }
      setMarksValue('');
      onMarksSaved?.();
    } catch (err: any) {
      setResultMsg({ type: 'error', text: err.message || 'Failed to record marks in ledger' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FileEdit className="w-5 h-5 text-cyan-400" />
          Cryptographic Marks Entry & Evaluation Terminal
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Submit marks into PostgreSQL. Trigger locks state, chains previous hash, and computes SHA-256 seal.
        </p>
      </div>

      {/* Mode Selector Toggle */}
      <div className="flex items-center gap-3 p-1.5 rounded-xl bg-slate-900 border border-slate-800 w-fit">
        <button
          onClick={() => { setIsCorrectionMode(false); setResultMsg(null); }}
          className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            !isCorrectionMode
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Initial Evaluation (MARK_ENTERED)
        </button>
        <button
          onClick={() => { setIsCorrectionMode(true); setResultMsg(null); }}
          className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            isCorrectionMode
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Authorized Re-evaluation (MARK_CORRECTED)
        </button>
      </div>

      {/* Feedback Banner */}
      {resultMsg && (
        <div className={`p-4 rounded-xl border flex flex-col gap-2 ${
          resultMsg.type === 'success'
            ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
            : 'bg-rose-950/60 border-rose-500/40 text-rose-200'
        }`}>
          <div className="flex items-center gap-2 text-xs font-bold">
            {resultMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400" />
            )}
            <span>{resultMsg.text}</span>
          </div>

          {resultMsg.details && (
            <div className="mt-2 p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-xs font-mono space-y-1.5">
              <div className="flex justify-between items-center text-slate-300">
                <span>Assigned Sequence:</span>
                <span className="font-bold text-cyan-400">Seq #{resultMsg.details.sequence_no}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Event Type:</span>
                <span className="text-amber-400 font-semibold">{resultMsg.details.event_type}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Previous Hash Chained:</span>
                <HashBadge hash={resultMsg.details.previous_hash} truncateLength={6} />
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-emerald-400 font-sans font-semibold">Calculated Current Hash:</span>
                <HashBadge hash={resultMsg.details.current_hash} truncateLength={6} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Entry Form */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800/80 shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Student Dropdown */}
            <div>
              <label className="block text-slate-300 mb-1.5 font-semibold">Select Student</label>
              <select
                required
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.roll_number} - {s.name} ({s.department})
                  </option>
                ))}
              </select>
            </div>

            {/* Subject Dropdown */}
            <div>
              <label className="block text-slate-300 mb-1.5 font-semibold">Select Subject</label>
              <select
                required
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              >
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.subject_code} - {sub.subject_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Examination Dropdown */}
            <div>
              <label className="block text-slate-300 mb-1.5 font-semibold">Examination</label>
              <select
                required
                value={selectedExam}
                onChange={(e) => setSelectedExam(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              >
                {exams.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.exam_name} ({ex.academic_year})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Marks Input */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-slate-300 mb-1.5 font-semibold">
                {isCorrectionMode ? 'Corrected Marks (0.00 - 100.00)' : 'Academic Marks (0.00 - 100.00)'}
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                required
                value={marksValue}
                onChange={(e) => setMarksValue(e.target.value)}
                placeholder="E.g. 88.50"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-mono text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Stored with exact 2 decimal precision in pgcrypto canonical hash payload.
              </span>
            </div>

            {isCorrectionMode && (
              <div>
                <label className="block text-amber-300 mb-1.5 font-semibold">
                  Authorized Correction Rationale
                </label>
                <input
                  type="text"
                  required
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  placeholder="Official re-checking note or dean approval reference..."
                  className="w-full bg-slate-950 border border-amber-800/60 rounded-xl p-2.5 text-slate-200 focus:border-amber-500"
                />
              </div>
            )}
          </div>

          {/* Security Notice */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <span>
              <strong>Cryptographic Guarantee:</strong> Upon submission, the database trigger will lock the singleton ledger state row (`SELECT FOR UPDATE`), link to the previous record's current_hash, compute SHA-256 via pgcrypto, and append an immutable block.
            </span>
          </div>

          {/* Submit Button */}
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-6 py-2.5 rounded-xl font-semibold text-xs flex items-center gap-2 text-white shadow-lg transition-all cursor-pointer ${
                isCorrectionMode
                  ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-950/60'
                  : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 shadow-cyan-950/60'
              } disabled:opacity-50`}
            >
              {isSubmitting ? 'Computing Cryptographic Seal...' : isCorrectionMode ? 'Append Correction Event' : 'Commit Marks to Ledger'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
