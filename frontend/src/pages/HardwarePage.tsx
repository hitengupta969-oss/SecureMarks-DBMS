import React, { useEffect, useState } from 'react';
import { Cpu, Wifi, Activity, Volume2, ShieldAlert, CheckCircle2, Terminal, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { DeviceStatus, DeviceLog } from '../types';

export const HardwarePage: React.FC = () => {
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus | null>(null);
  const [logs, setLogs] = useState<DeviceLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Virtual ESP32 State Machine
  const [oledLine1, setOledLine1] = useState('SECUREMARKS - IoT');
  const [oledLine2, setOledLine2] = useState('READY - SELECT MODE');
  const [oledLine3, setOledLine3] = useState('A: Enter Marks  *: Verify');
  const [oledLine4, setOledLine4] = useState('WiFi: Connected (Port 8000)');

  const [greenLed, setGreenLed] = useState(false);
  const [redLed, setRedLed] = useState(false);
  const [buzzerActive, setBuzzerActive] = useState(false);

  // Form Inputs for Keypad entry
  const [simRoll, setSimRoll] = useState('CS2023001');
  const [simSubject, setSimSubject] = useState('CS601');
  const [simMarks, setSimMarks] = useState('88.50');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadDeviceData();
    const interval = setInterval(loadDeviceData, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadDeviceData = async () => {
    try {
      const [st, lg] = await Promise.all([
        api.getDeviceStatus('ESP32_TERM_01'),
        api.getDeviceLogs(15),
      ]);
      setDeviceStatus(st);
      setLogs(lg);
    } catch (err) {
      console.error('Failed to load device logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Sound Synthesizer via Web Audio API
  const playTone = (freq: number, type: OscillatorType, durationMs: number) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + durationMs / 1000);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + durationMs / 1000);
    } catch {}
  };

  const triggerBeep = () => {
    playTone(1200, 'sine', 150);
    setBuzzerActive(true);
    setTimeout(() => setBuzzerActive(false), 200);
  };

  const triggerAlarm = () => {
    setBuzzerActive(true);
    setRedLed(true);
    let count = 0;
    const interval = setInterval(() => {
      playTone(600, 'sawtooth', 120);
      count++;
      if (count >= 5) {
        clearInterval(interval);
        setBuzzerActive(false);
        setRedLed(false);
      }
    }, 200);
  };

  // Execute Marks Entry via Hardware API
  const handleSimulateKeypadSubmit = async () => {
    setIsProcessing(true);
    triggerBeep();
    setOledLine1('COMMUNICATING...');
    setOledLine2('Sending to PostgreSQL');
    setOledLine3(`Roll: ${simRoll} | ${simMarks}`);
    setOledLine4('Triggering pgcrypto...');

    try {
      const res = await api.submitDeviceMarks({
        device_id: 'ESP32_TERM_01',
        student_roll: simRoll,
        subject_code: simSubject,
        marks: parseFloat(simMarks),
      });

      // Success Display
      setGreenLed(true);
      triggerBeep();
      setOledLine1('>> RECORD SAVED <<');
      setOledLine2(`Seq #${res.sequence_no} | Marks: ${simMarks}`);
      setOledLine3(`Hash: ${res.current_hash.substring(0, 16)}...`);
      setOledLine4('[GREEN LED: ON] [BEEP]');

      setTimeout(() => {
        setGreenLed(false);
        setOledLine1('SECUREMARKS - IoT');
        setOledLine2('READY - SELECT MODE');
        setOledLine3('A: Enter Marks  *: Verify');
        setOledLine4('WiFi: Connected (Port 8000)');
      }, 4000);

      loadDeviceData();
    } catch (err: any) {
      triggerAlarm();
      setOledLine1('>> ERROR SAVING <<');
      setOledLine2(err.message.substring(0, 24));
      setOledLine3('DATABASE REJECTED');
      setOledLine4('[RED LED ALARM]');
      setTimeout(() => {
        setOledLine1('SECUREMARKS - IoT');
        setOledLine2('READY - SELECT MODE');
      }, 4000);
    } finally {
      setIsProcessing(false);
    }
  };

  // Execute Verification via Hardware API
  const handleSimulateKeypadVerify = async () => {
    setIsProcessing(true);
    triggerBeep();
    setOledLine1('VERIFYING LEDGER...');
    setOledLine2('Independent SHA-256...');
    setOledLine3('Validating Chains...');
    setOledLine4('Please wait...');

    try {
      const res = await api.verifyDeviceLedger('ESP32_TERM_01');

      if (res.status === 'LEDGER_VALID') {
        setGreenLed(true);
        triggerBeep();
        setOledLine1('*** LEDGER VALID ***');
        setOledLine2(`Checked: ${res.records_checked} Records`);
        setOledLine3('Chain: 100% SHA-256 OK');
        setOledLine4('[GREEN LED: ON]');
        setTimeout(() => setGreenLed(false), 4000);
      } else {
        triggerAlarm();
        setOledLine1('! TAMPERING DETECTED !');
        setOledLine2(`Invalid: ${res.invalid_records} Records`);
        setOledLine3('INTEGRITY COMPROMISED');
        setOledLine4('[RED LED: FLASH] [ALARM]');
      }
      loadDeviceData();
    } catch (err: any) {
      triggerAlarm();
      setOledLine1('VERIFY FAILED');
      setOledLine2(err.message.substring(0, 24));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            ESP32 Smart Verification Terminal (Physical & Virtual IoT Model)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Hardware interface running on ESP32 DevKit with 0.96" SSD1306 OLED, 4x4 keypad, and audio-visual actuators
          </p>
        </div>

        <button
          onClick={loadDeviceData}
          className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs flex items-center gap-1.5 hover:text-white"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Telemetry
        </button>
      </div>

      {/* Main Grid: Virtual Terminal Simulator + Real Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Virtual Hardware Terminal Console (7 columns) */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm">Interactive Virtual ESP32 Terminal</span>
              <span className="px-2 py-0.5 bg-cyan-950 border border-cyan-800/40 text-cyan-300 font-mono text-[10px] rounded">
                GPIO Pin Mapping Active
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
              <Wifi className="w-3.5 h-3.5" />
              <span>HTTP REST (Live)</span>
            </div>
          </div>

          {/* Realistic SSD1306 OLED Screen (128x64 display emulation) */}
          <div className="mx-auto w-full max-w-md bg-black border-4 border-slate-800 rounded-xl p-4 shadow-inner mb-6 relative overflow-hidden">
            {/* OLED Pixel Glow Effect */}
            <div className="font-mono text-cyan-300 text-xs space-y-1.5 tracking-wider select-none leading-relaxed">
              <div className="border-b border-cyan-900/60 pb-1 text-[11px] font-bold text-cyan-400 flex justify-between">
                <span>{oledLine1}</span>
                <span className="text-[9px] text-cyan-500">I2C 0x3C</span>
              </div>
              <div className="text-white text-xs">{oledLine2}</div>
              <div className="text-cyan-200 text-xs">{oledLine3}</div>
              <div className="text-cyan-500 text-[10px]">{oledLine4}</div>
            </div>
          </div>

          {/* Actuator Status Indicators (Green LED, Red LED, Buzzer) */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {/* Green LED */}
            <div className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
              greenLed
                ? 'bg-emerald-950 border-emerald-400 text-emerald-300 shadow-lg shadow-emerald-500/50'
                : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}>
              <span className="text-xs font-semibold">Green LED (GPIO 2)</span>
              <div className={`w-3.5 h-3.5 rounded-full ${
                greenLed ? 'bg-emerald-400 shadow-lg shadow-emerald-400 animate-ping' : 'bg-slate-800'
              }`} />
            </div>

            {/* Red LED */}
            <div className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
              redLed
                ? 'bg-rose-950 border-rose-400 text-rose-300 shadow-lg shadow-rose-500/50 animate-pulse'
                : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}>
              <span className="text-xs font-semibold">Red LED (GPIO 4)</span>
              <div className={`w-3.5 h-3.5 rounded-full ${
                redLed ? 'bg-rose-500 shadow-lg shadow-rose-500 animate-bounce' : 'bg-slate-800'
              }`} />
            </div>

            {/* Buzzer */}
            <div className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
              buzzerActive
                ? 'bg-amber-950 border-amber-400 text-amber-300 shadow-lg shadow-amber-500/50'
                : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}>
              <span className="text-xs font-semibold">Buzzer (GPIO 5)</span>
              <Volume2 className={`w-4 h-4 ${buzzerActive ? 'text-amber-400 animate-spin' : 'text-slate-600'}`} />
            </div>
          </div>

          {/* Virtual Terminal Input & Keypad Action Controls */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-3">
            <div className="text-xs font-semibold text-slate-300">
              Terminal Simulation Controls (Actual Backend API Calls)
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Student Roll</label>
                <input
                  type="text"
                  value={simRoll}
                  onChange={(e) => setSimRoll(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Subject Code</label>
                <input
                  type="text"
                  value={simSubject}
                  onChange={(e) => setSimSubject(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Marks (0-100)</label>
                <input
                  type="number"
                  step="0.5"
                  value={simMarks}
                  onChange={(e) => setSimMarks(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-slate-200 font-mono"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={handleSimulateKeypadSubmit}
                disabled={isProcessing}
                className="flex-1 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                [Keypad 'A'] Submit Marks & Chain Hash
              </button>
              <button
                onClick={handleSimulateKeypadVerify}
                disabled={isProcessing}
                className="py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                [Keypad '*'] Run Verification
              </button>
            </div>
          </div>
        </div>

        {/* Real Hardware Logs & Telemetry (5 columns) */}
        <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                Live Device Telemetry & Audit Logs
              </h3>
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                ONLINE
              </span>
            </div>

            {/* Device Info Summary */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono space-y-1 mb-4">
              <div className="flex justify-between">
                <span className="text-slate-500">Device ID:</span>
                <span className="text-slate-300 font-bold">{deviceStatus?.device_id || 'ESP32_TERM_01'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Last Action:</span>
                <span className="text-cyan-400">{deviceStatus?.last_action || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Last Status:</span>
                <span className={deviceStatus?.last_status === 'VALID' || deviceStatus?.last_status === 'SUCCESS' ? 'text-emerald-400' : 'text-amber-400'}>
                  {deviceStatus?.last_status || 'IDLE'}
                </span>
              </div>
            </div>

            {/* Activity Logs Stream */}
            <div className="text-xs font-semibold text-slate-300 mb-2">
              Recent Device Transactions (<code className="text-cyan-400 font-mono">device_logs</code> table)
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {logs.length > 0 ? (
                logs.map((log) => (
                  <div key={log.id} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 text-xs font-mono space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-cyan-300 font-bold">{log.action}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-sans font-bold ${
                        log.status === 'SUCCESS' || log.status === 'VALID' || log.status === 'LEDGER_VALID'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/40'
                          : log.status === 'TAMPERING_DETECTED' || log.status === 'ERROR'
                          ? 'bg-rose-950 text-rose-300 border border-rose-700/40'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {log.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-sans">{log.message}</p>
                    <div className="text-[10px] text-slate-600">
                      {new Date(log.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-slate-500 text-xs">
                  No device logs recorded yet.
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80 text-[11px] text-slate-500 font-sans">
            Device authenticates with backend using <code className="text-slate-400 font-mono">X-Device-Key</code> header over local subnet or WiFi.
          </div>
        </div>
      </div>
    </div>
  );
};
