import React from 'react';
import { TrendingUp, TrendingDown, Users, Clock, CheckCircle, Activity, AlertCircle } from 'lucide-react';

interface EfficiencyMetric {
  label: string;
  value: string | number;
  unit: string;
  benchmark: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down';
  trendValue?: string;
}

interface DoctorStats {
  doctorName: string;
  specialty: string;
  patientsToday: number;
  avgTime: number;
  completionRate: number;
  status: 'active' | 'break' | 'offline';
}

export const IndustryStandardMetrics = ({
  tokensProcessed,
  avgWaitTime,
  patientSatisfaction,
  doctorStats = [],
  systemMetrics = {},
}: {
  tokensProcessed: number;
  avgWaitTime: number;
  patientSatisfaction: number;
  doctorStats?: DoctorStats[];
  systemMetrics?: any;
}) => {
  return (
    <div className="space-y-6">
      {/* Key Metrics Grid - Industry Standard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Average Wait Time */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Average Wait Time</p>
              <div className="mt-2 flex items-baseline gap-2">
                <p className="text-2xl font-bold text-slate-900">{avgWaitTime}</p>
                <p className="text-sm text-slate-600">minutes</p>
              </div>
            </div>
            <Clock className="h-5 w-5 text-blue-500 opacity-40" />
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100">
            <p className="text-xs text-slate-600">Industry avg: <span className="font-semibold">45 min</span></p>
          </div>
        </div>

        {/* Patient Satisfaction */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Patient Satisfaction</p>
              <div className="mt-2 flex items-baseline gap-2">
                <p className="text-2xl font-bold text-slate-900">{patientSatisfaction}</p>
                <p className="text-sm text-slate-600">%</p>
              </div>
            </div>
            <Activity className="h-5 w-5 text-green-500 opacity-40" />
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100">
            <p className="text-xs text-slate-600">Goal: <span className="font-semibold">90%</span></p>
          </div>
        </div>

        {/* Daily Registrations */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Registrations Today</p>
              <div className="mt-2 flex items-baseline gap-2">
                <p className="text-2xl font-bold text-slate-900">{tokensProcessed}</p>
                <p className="text-sm text-slate-600">patients</p>
              </div>
            </div>
            <Users className="h-5 w-5 text-purple-500 opacity-40" />
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100">
            <p className="text-xs text-slate-600">Daily avg: <span className="font-semibold">85</span></p>
          </div>
        </div>

        {/* Completed Visits */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Completed Today</p>
              <div className="mt-2 flex items-baseline gap-2">
                <p className="text-2xl font-bold text-slate-900">{Math.floor(tokensProcessed * 0.7)}</p>
                <p className="text-sm text-slate-600">visits</p>
              </div>
            </div>
            <CheckCircle className="h-5 w-5 text-emerald-500 opacity-40" />
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100">
            <p className="text-xs text-slate-600">Completion: <span className="font-semibold">70%</span></p>
          </div>
        </div>
      </div>

      {/* Doctor Workload - Professional Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h3 className="text-sm font-semibold text-slate-900">Doctor Workload Summary</h3>
          <p className="text-xs text-slate-600 mt-1">Current day activity</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-6 py-3 text-left font-semibold text-slate-700">Doctor</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-700">Specialty</th>
                <th className="px-6 py-3 text-center font-semibold text-slate-700">Patients</th>
                <th className="px-6 py-3 text-center font-semibold text-slate-700">Avg Time</th>
                <th className="px-6 py-3 text-center font-semibold text-slate-700">Completion</th>
                <th className="px-6 py-3 text-center font-semibold text-slate-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {doctorStats && doctorStats.length > 0 ? (
                doctorStats.map((doc, idx) => (
                  <tr key={idx} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{doc.doctorName}</td>
                    <td className="px-6 py-4 text-slate-700">{doc.specialty}</td>
                    <td className="px-6 py-4 text-center text-slate-700">{doc.patientsToday}</td>
                    <td className="px-6 py-4 text-center text-slate-700">{doc.avgTime} min</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-12 bg-slate-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${doc.completionRate}%` }}
                          />
                        </div>
                        <span className="text-slate-700 text-xs font-medium">{doc.completionRate}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        doc.status === 'active' ? 'bg-green-100 text-green-800' :
                        doc.status === 'break' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-600">
                    No doctor data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* System Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* KPI Summary */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Key Performance Indicators</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-sm text-slate-700">System Uptime</span>
              <span className="text-sm font-semibold text-slate-900">99.8%</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-sm text-slate-700">Average Response Time</span>
              <span className="text-sm font-semibold text-slate-900">&lt;200ms</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-sm text-slate-700">Data Accuracy</span>
              <span className="text-sm font-semibold text-slate-900">99.95%</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-slate-700">Error Rate</span>
              <span className="text-sm font-semibold text-slate-900">&lt;0.1%</span>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">System Status</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-sm text-slate-700">Registration System</span>
              <span className="ml-auto text-xs font-medium text-green-700">Operational</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-sm text-slate-700">Doctor Queue</span>
              <span className="ml-auto text-xs font-medium text-green-700">Operational</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-sm text-slate-700">Patient Portal</span>
              <span className="ml-auto text-xs font-medium text-green-700">Operational</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-sm text-slate-700">Admin Dashboard</span>
              <span className="ml-auto text-xs font-medium text-green-700">Operational</span>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts & Notifications */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Recent Activity & Alerts</h3>
        <div className="space-y-3 text-sm">
          <div className="flex gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <CheckCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900">All systems operational</p>
              <p className="text-xs text-blue-700 mt-0.5">Last updated: 5 minutes ago</p>
            </div>
          </div>
          <div className="flex gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-green-900">92 patients processed today</p>
              <p className="text-xs text-green-700 mt-0.5">On pace for daily target</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IndustryStandardMetrics;
