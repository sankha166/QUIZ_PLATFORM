import { useEffect, useState } from 'react';
import { getAdminAnalytics } from '../../api/admin.api';
import AdminLayout from '../../components/admin/AdminLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminAnalytics().then((r) => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <AdminLayout><LoadingSpinner size="lg" className="py-20" /></AdminLayout>;

  const { charts } = data || {};
  const noData = <p className="text-gray-400 text-sm text-center py-8">No data yet</p>;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-gray-900">Analytics</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4">Quiz Attempts Over Time</h3>
            {charts?.attemptsOverTime?.length ? (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={charts.attemptsOverTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} dot={false} name="Attempts" />
                </LineChart>
              </ResponsiveContainer>
            ) : noData}
          </div>

          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4">Student Registrations</h3>
            {charts?.studentRegistrations?.length ? (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={charts.studentRegistrations}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} dot={false} name="Registrations" />
                </LineChart>
              </ResponsiveContainer>
            ) : noData}
          </div>

          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4">Pass / Fail Distribution</h3>
            {((charts?.passFail?.[0]?.value ?? 0) + (charts?.passFail?.[1]?.value ?? 0)) > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={charts.passFail} cx="50%" cy="50%" outerRadius={90} dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                    <Cell fill="#10b981" />
                    <Cell fill="#ef4444" />
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : noData}
          </div>

          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4">Popular Categories</h3>
            {charts?.popularCategories?.length ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={charts.popularCategories}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="attempts" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Attempts" />
                </BarChart>
              </ResponsiveContainer>
            ) : noData}
          </div>

          <div className="card lg:col-span-2">
            <h3 className="font-semibold text-gray-800 mb-4">Average Score Per Quiz</h3>
            {charts?.avgScorePerQuiz?.length ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={charts.avgScorePerQuiz} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <YAxis dataKey="title" type="category" tick={{ fontSize: 11 }} width={120} />
                  <Tooltip formatter={(v) => `${v}%`} />
                  <Bar dataKey="avg_score" fill="#6366f1" radius={[0, 4, 4, 0]} name="Avg Score" />
                </BarChart>
              </ResponsiveContainer>
            ) : noData}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
