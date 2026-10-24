import { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { getQuestionReports, updateQuestionReport } from "../../api/admin.api";

export default function QuestionReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    getQuestionReports().then((response) => setReports(response.data.reports || [])).finally(() => setLoading(false));
  }, []);
  if (loading) return <AdminLayout><LoadingSpinner size="lg" className="py-20" /></AdminLayout>;
  return <AdminLayout>
    <div className="mx-auto max-w-5xl space-y-6">
      <div><h2 className="text-2xl font-bold">Question reports</h2><p className="mt-1 text-sm text-slate-500">Review issues reported by students and track corrections.</p></div>
      {!reports.length ? <div className="card text-center text-slate-500">No question reports yet.</div> : reports.map((report) => (
        <div key={report.id} className="card border-amber-200 bg-amber-50/40">
          <div className="flex flex-wrap justify-between gap-3">
            <div><p className="font-semibold">{report.quiz_title}</p><p className="mt-1 text-sm text-slate-700">{report.question_text}</p><p className="mt-1 text-xs text-slate-500">{report.student_name || report.student_email} · {report.reason.replaceAll("_", " ")}</p></div>
            <select className="input w-auto py-1 text-xs" value={report.status} onChange={async (event) => { const response = await updateQuestionReport(report.id, { status: event.target.value, admin_note: report.admin_note }); setReports((items) => items.map((item) => item.id === report.id ? { ...item, ...response.data.report } : item)); }}>
              <option value="open">Open</option><option value="reviewing">Reviewing</option><option value="resolved">Resolved</option><option value="dismissed">Dismissed</option>
            </select>
          </div>
          <p className="mt-3 text-sm">{report.details}</p>
          {report.screenshot_url && <img src={report.screenshot_url} alt="Student report screenshot" className="mt-3 max-h-72 rounded-xl border object-contain" />}
        </div>
      ))}
    </div>
  </AdminLayout>;
}
