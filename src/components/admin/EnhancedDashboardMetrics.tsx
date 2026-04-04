import React from 'react';
import { TrendingUp, Zap, Clock, CheckCircle, Users, Activity, BarChart3, ArrowUp, ArrowDown } from 'lucide-react';

interface EfficiencyMetric {
  label: string;
  value: string | number;
  comparison: string;
  trend: 'up' | 'down';
  icon: React.ReactNode;
}

interface DoctorEfficiency {
  doctorName: string;
  specialty: string;
  patientsHandled: number;
  avgConsultationTime: string;
  completionRate: number;
  efficiency: number;
  trend: 'up' | 'down' | 'stable';
}

export const EnhancedDashboardMetrics = ({
  tokensProcessed,
  avgWaitTime,
  patientSatisfaction,
  doctorEfficiency,
  doctorStats,
  traditionalComparison,
}: {
  tokensProcessed: number;
  avgWaitTime: number;
  patientSatisfaction: number;
  doctorEfficiency: DoctorEfficiency[];
  doctorStats?: any[];
  traditionalComparison?: any;
}) => {
  // Calculate efficiency gains vs traditional method
  const efficiencyGain = ((traditionalComparison?.traditionalWaitTime || 120) - avgWaitTime) / (traditionalComparison?.traditionalWaitTime || 120) * 100;
  const satisfactionGain = patientSatisfaction - (traditionalComparison?.traditionalSatisfaction || 65);
  const throughputGain = ((tokensProcessed - (traditionalComparison?.traditionalDaily || 80)) / (traditionalComparison?.traditionalDaily || 80)) * 100;

  const metrics: EfficiencyMetric[] = [
    {
      label: 'Avg Wait Time',
      value: `${avgWaitTime} min`,
      comparison: `vs ${traditionalComparison?.traditionalWaitTime || 120} min (traditional)`,
      trend: 'down',
      icon: <Clock className="h-5 w-5" />,
    },
    {
      label: 'Patient Satisfaction',
      value: `${patientSatisfaction}%`,
      comparison: `vs ${traditionalComparison?.traditionalSatisfaction || 65}% (traditional)`,
      trend: 'up',
      icon: <Activity className="h-5 w-5" />,
    },
    {
      label: 'Daily Throughput',
      value: tokensProcessed,
      comparison: `vs ${traditionalComparison?.traditionalDaily || 80} patients (traditional)`,
      trend: 'up',
      icon: <Users className="h-5 w-5" />,
    },
    {
      label: 'Efficiency Gain',
      value: `${Math.round(efficiencyGain)}%`,
      comparison: 'improvement over traditional',
      trend: 'up',
      icon: <TrendingUp className="h-5 w-5" />,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Main KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, idx) => (
          <div key={idx} className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{metric.label}</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{metric.value}</p>
              </div>
              <div className={`p-2 rounded-lg ${
                metric.trend === 'up' 
                  ? 'bg-green-100 dark:bg-green-900' 
                  : 'bg-blue-100 dark:bg-blue-900'
              }`}>
                {metric.trend === 'up' ? (
                  <TrendingUp className={`h-5 w-5 ${
                    metric.trend === 'up' ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'
                  }`} />
                ) : (
                  <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                )}
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">{metric.comparison}</p>
            {metric.trend === 'up' && (
              <div className="mt-2 flex items-center gap-1">
                <ArrowUp className="h-3 w-3 text-green-600" />
                <span className="text-xs font-semibold text-green-600">
                  {metric.label.includes('Efficiency') ? `${Math.round(efficiencyGain)}%` : 
                   metric.label.includes('Satisfaction') ? `+${Math.round(satisfactionGain)}%` :
                   metric.label.includes('Throughput') ? `+${Math.round(throughputGain)}%` : 'Improved'}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Doctor Efficiency Comparison Section */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Doctor Efficiency Rankings</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Performance metrics for today</p>
          </div>
          <BarChart3 className="h-5 w-5 text-slate-400" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Doctor Name</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Specialty</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Patients</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Avg Time</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Completion Rate</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Efficiency Score</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Trend</th>
              </tr>
            </thead>
            <tbody>
              {doctorEfficiency.map((doc, idx) => {
                const isTop3 = idx < 3;
                const efficiencyColor = doc.efficiency >= 90 ? 'text-green-600 dark:text-green-400' :
                                       doc.efficiency >= 75 ? 'text-blue-600 dark:text-blue-400' :
                                       'text-yellow-600 dark:text-yellow-400';
                
                return (
                  <tr key={idx} className={`border-b border-slate-100 dark:border-slate-700 ${
                    isTop3 ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  } transition-colors`}>
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">{doc.doctorName}</p>
                        {isTop3 && <span className="text-xs bg-blue-200 dark:bg-blue-700 text-blue-800 dark:text-blue-100 px-2 py-1 rounded mt-1 inline-block">Top Performer</span>}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-slate-600 dark:text-slate-400">{doc.specialty}</td>
                    <td className="py-4 px-4 text-center font-semibold text-slate-900 dark:text-white">{doc.patientsHandled}</td>
                    <td className="py-4 px-4 text-center text-slate-600 dark:text-slate-400">{doc.avgConsultationTime}</td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full"
                            style={{ width: `${doc.completionRate}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{doc.completionRate}%</span>
                      </div>
                    </td>
                    <td className={`py-4 px-4 text-center font-bold ${efficiencyColor}`}>
                      {doc.efficiency}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {doc.trend === 'up' ? (
                        <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 font-semibold">
                          <ArrowUp className="h-4 w-4" /> +3%
                        </span>
                      ) : doc.trend === 'down' ? (
                        <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 font-semibold">
                          <ArrowDown className="h-4 w-4" /> -2%
                        </span>
                      ) : (
                        <span className="text-slate-600 dark:text-slate-400 font-semibold">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comparison with Traditional Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-lg border border-emerald-200 dark:border-emerald-700 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">AI-Powered System</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-700 dark:text-slate-300">Average Wait Time</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{avgWaitTime} min</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-700 dark:text-slate-300">Patient Satisfaction</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{patientSatisfaction}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-700 dark:text-slate-300">Daily Throughput</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{tokensProcessed} patients</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-700 dark:text-slate-300">Doctor Efficiency</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">85%+</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/40 dark:to-slate-800/40 rounded-lg border border-slate-300 dark:border-slate-600 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <Activity className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Traditional Method</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-700 dark:text-slate-300">Average Wait Time</span>
              <span className="font-bold text-slate-600 dark:text-slate-400">{traditionalComparison?.traditionalWaitTime || 120} min</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-700 dark:text-slate-300">Patient Satisfaction</span>
              <span className="font-bold text-slate-600 dark:text-slate-400">{traditionalComparison?.traditionalSatisfaction || 65}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-700 dark:text-slate-300">Daily Throughput</span>
              <span className="font-bold text-slate-600 dark:text-slate-400">{traditionalComparison?.traditionalDaily || 80} patients</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-700 dark:text-slate-300">Doctor Efficiency</span>
              <span className="font-bold text-slate-600 dark:text-slate-400">60-70%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Key Improvements */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-700 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">System Impact & Improvements</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{Math.round(efficiencyGain)}%</p>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Wait Time Reduction</p>
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">From {traditionalComparison?.traditionalWaitTime || 120} to {avgWaitTime} minutes</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">+{Math.round(satisfactionGain)}%</p>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Patient Satisfaction Increase</p>
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">From {traditionalComparison?.traditionalSatisfaction || 65}% to {patientSatisfaction}%</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4">
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">+{Math.round(throughputGain)}%</p>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Daily Patient Capacity</p>
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">From {traditionalComparison?.traditionalDaily || 80} to {tokensProcessed} patients/day</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedDashboardMetrics;
