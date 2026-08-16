import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { getQuizById, createQuiz, updateQuiz, getCategories } from "../../api/quiz.api";
import { getDomains } from "../../api/domain.api";
import AdminLayout from "../../components/admin/AdminLayout";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { getErrorMessage } from "../../utils/helpers";

const DEFAULT_SCORING = { live_score_025: 2, live_score_050: 1.5, live_score_075: 1.25, live_score_100: 1, live_score_wrong: -0.5 };

// PostgreSQL stores live_start_at as an IST wall-clock timestamp. Keep the
// datetime-local input in the same wall-clock representation; do not call
// new Date(...).toISOString(), which would introduce a timezone shift.
const toDatetimeLocal = (value) => {
  if (!value) return "";
  const text = String(value);
  if (!/[zZ]|[+-]\d{2}:\d{2}$/.test(text)) return text.replace(" ", "T").slice(0, 16);
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(date).reduce((acc, part) => { acc[part.type] = part.value; return acc; }, {});
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
};

export default function QuizForm() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const createLive = new URLSearchParams(location.search).get("live") === "1";
  const [categories, setCategories] = useState([]);
  const [domains, setDomains] = useState([]);
  const [domainId, setDomainId] = useState("");
  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState("");

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      difficulty: "medium", max_attempts: 1, passing_score: 60, duration: 10,
      is_live_quiz: createLive, live_all_domains: false, live_same_question_time: true,
      live_question_time_seconds: 30, ...DEFAULT_SCORING,
    },
  });
  const categoryId = watch("category_id");
  const isLive = watch("is_live_quiz");
  const allDomains = watch("live_all_domains");
  const sameQuestionTime = watch("live_same_question_time");

  useEffect(() => {
    Promise.all([getDomains(), getCategories(), isEdit ? getQuizById(id) : Promise.resolve(null)])
      .then(([domainResponse, categoryResponse, quizResponse]) => {
        const ds = domainResponse.data.domains || [];
        const cs = categoryResponse.data.categories || [];
        setDomains(ds);
        setCategories(cs);
        if (quizResponse?.data?.quiz) {
          const q = quizResponse.data.quiz;
          const cat = cs.find((c) => String(c.id) === String(q.category_id));
          setDomainId(q.live_all_domains ? "all" : String(q.domain_id ?? cat?.domain_id ?? ""));
          reset({
            ...q,
            category_id: q.category_id ? String(q.category_id) : "",
            is_live_quiz: Boolean(q.is_live_quiz),
            live_all_domains: Boolean(q.live_all_domains),
            live_same_question_time: q.live_same_question_time !== false,
            live_question_time_seconds: Number(q.live_question_time_seconds ?? 30),
            live_start_at: toDatetimeLocal(q.live_start_at),
            live_score_025: Number(q.live_score_025 ?? 2),
            live_score_050: Number(q.live_score_050 ?? 1.5),
            live_score_075: Number(q.live_score_075 ?? 1.25),
            live_score_100: Number(q.live_score_100 ?? 1),
            live_score_wrong: Number(q.live_score_wrong ?? -0.5),
          });
        } else if (createLive) {
          setDomainId("all");
          setValue("live_all_domains", true);
        } else if (ds[0]) {
          setDomainId(String(ds[0].id));
        }
      })
      .catch((e) => setError(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [id, isEdit, reset, setValue, createLive]);

  const domainCategories = allDomains ? categories : categories.filter((c) => String(c.domain_id) === String(domainId));

  useEffect(() => {
    if (categoryId && domainId !== "all" && !domainCategories.some((c) => String(c.id) === String(categoryId))) {
      setValue("category_id", "");
    }
  }, [domainId, categoryId, setValue, allDomains, domainCategories]);

  const onSubmit = async (form) => {
    setError("");
    try {
      if (isLive && !form.live_start_at) return setError("Live quiz needs a start time in IST.");
      if (isLive && !allDomains && !form.category_id) return setError("Select a category or choose All Domains.");
      if (isLive && (!form.live_question_time_seconds || Number(form.live_question_time_seconds) < 5 || Number(form.live_question_time_seconds) > 600)) {
        return setError("Live question time must be between 5 and 600 seconds.");
      }
      const selected = domainCategories.find((c) => String(c.id) === String(form.category_id));
      const data = {
        ...form,
        domain_id: allDomains ? "all" : domainId,
        category_id: allDomains ? null : (form.category_id || null),
        domain_name: allDomains ? "All Domains" : domains.find((d) => String(d.id) === String(domainId))?.name || null,
        category_name: selected?.name || "All Categories",
        is_live_quiz: Boolean(isLive),
        live_all_domains: Boolean(allDomains),
        live_end_at: null,
        live_same_question_time: Boolean(form.live_same_question_time),
        live_question_time_seconds: Math.min(600, Math.max(5, Number(form.live_question_time_seconds) || 30)),
      };
      if (isEdit) await updateQuiz(id, data);
      else await createQuiz(data);
      navigate(isLive ? "/admin/live-quizzes" : "/admin/quizzes");
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  if (loading) return <AdminLayout><LoadingSpinner size="lg" className="py-20" /></AdminLayout>;

  return (
    <AdminLayout>
      <div className="mx-auto min-w-0 max-w-4xl space-y-6">
        <div>
          <Link to={isLive ? "/admin/live-quizzes" : "/admin/quizzes"} className="text-sm text-slate-500">← Back</Link>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-bold sm:text-3xl">{isLive ? (isEdit ? "Edit Live Quiz" : "Create Live Quiz") : isEdit ? "Edit Quiz" : "Create Quiz"}</h2>
            {isLive && <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-700">🔴 LIVE QUIZ ONLY</span>}
          </div>
        </div>

        {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

        <div className="card">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div><label className="label">Title *</label><input className="input" {...register("title", { required: "Title is required" })} />{errors.title && <p className="mt-1 text-xs text-rose-500">{errors.title.message}</p>}</div>
            <div><label className="label">Description</label><textarea className="input" rows={4} {...register("description")} /></div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="label">Domain *</label>
                <select className="input" value={domainId} onChange={(e) => { const v = e.target.value; setDomainId(v); setValue("category_id", ""); setValue("live_all_domains", v === "all"); }}>
                  <option value="">Select domain</option>
                  {isLive && <option value="all">🌐 All Domains</option>}
                  {domains.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
                <p className="mt-1 text-xs text-slate-500">{domainId === "all" ? "Visible to every student only in Live Quizzes." : "Students in the selected domain can see this event."}</p>
              </div>
              <div>
                <label className="label">Category {allDomains ? "(not required)" : "*"}</label>
                <select className="input" {...register("category_id", { required: isLive && !allDomains })} disabled={!domainId || (!allDomains && !domainCategories.length)}>
                  <option value="">{allDomains ? "All Categories" : !domainId ? "Select domain first" : !domainCategories.length ? "No categories in this domain" : "Select category"}</option>
                  {domainCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>

            {isLive && <label className="flex items-center gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4">
              <input type="checkbox" className="h-5 w-5" checked={Boolean(allDomains)} onChange={(e) => { const on = e.target.checked; setValue("live_all_domains", on); setDomainId(on ? "all" : domains[0]?.id ? String(domains[0].id) : ""); setValue("category_id", ""); }} />
              <span><b className="text-indigo-900">🌐 All Domains</b><span className="mt-1 block text-xs text-slate-500">No category is required. This event is shown to every student only in Live Quizzes.</span></span>
            </label>}

            <div><label className="label">Difficulty *</label><select className="input" {...register("difficulty", { required: true })}><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></div>

            {!isLive && <div className="grid gap-4 md:grid-cols-2">
              <div><label className="label">Overall Duration (min) *</label><input type="number" min="1" className="input" {...register("duration", { required: true, valueAsNumber: true })} /></div>
              <div><label className="label">Passing Score (%) *</label><input type="number" min="1" max="100" className="input" {...register("passing_score", { required: true, valueAsNumber: true })} /></div>
              <div><label className="label">Max Attempts</label><input type="number" min="1" className="input" {...register("max_attempts", { valueAsNumber: true })} /></div>
            </div>}

            {isLive && <>
              <div className="rounded-3xl border border-rose-200 bg-gradient-to-br from-rose-50 to-orange-50 p-5">
                <h3 className="text-lg font-bold">🔴 Live Scoring Rules</h3>
                <p className="mt-1 text-xs text-slate-600">These values are stored with the event and used server-side when each answer is scored.</p>
                <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
                  {[["live_score_025", "≤ 0.25× time", "2.0×"], ["live_score_050", "≤ 0.50× time", "1.5×"], ["live_score_075", "≤ 0.75× time", "1.25×"], ["live_score_100", "≤ 1.00× time", "1.0×"], ["live_score_wrong", "Wrong answer", "-0.5×"]].map(([name, label, placeholder]) => <div key={name}><label className="text-xs font-semibold text-slate-700">{label}</label><input type="number" step="0.05" className="input mt-1" placeholder={placeholder} {...register(name, { required: true, valueAsNumber: true })} /></div>)}
                </div>
                <p className="mt-3 text-xs text-slate-500">Unanswered = 0×. Final rating = question marks × multiplier.</p>
              </div>

              <div className="rounded-3xl border border-indigo-200 bg-indigo-50/60 p-5">
                <h3 className="text-lg font-bold">⏱ Question Timing</h3>
                <p className="mt-1 text-xs text-slate-600">Set one default timer once. When enabled, it is automatically copied to every existing and future live question.</p>
                <label className="mt-4 flex items-start gap-3">
                  <input type="checkbox" className="mt-1 h-5 w-5" {...register("live_same_question_time")} />
                  <span><b>Use the same time for every live question</b><span className="mt-1 block text-xs text-slate-500">Recommended for live events. Disable only if individual question timers are genuinely needed.</span></span>
                </label>
                <div className="mt-4 max-w-sm"><label className="label">Time per question (seconds) *</label><input type="number" min="5" max="600" className="input" {...register("live_question_time_seconds", { required: true, valueAsNumber: true, min: 5, max: 600 })} /><p className="mt-1 text-xs text-slate-500">5–600 seconds. {sameQuestionTime ? "This value will be applied to all live questions automatically." : "Individual timers can be adjusted in Manage Questions."}</p></div>
              </div>

              <div>
                <label className="label">Live Start Time (IST) *</label>
                <input type="datetime-local" className="input" {...register("live_start_at", { required: true })} />
                <p className="mt-1 text-xs text-slate-500">Choose the Indian local time shown by this field. No +5:30 conversion is added by the UI. The event ends automatically after the last question timer.</p>
              </div>
            </>}

            <div><label className="label">Thumbnail URL</label><input className="input" type="url" {...register("thumbnail_url")} /></div>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end"><Link to={isLive ? "/admin/live-quizzes" : "/admin/quizzes"} className="btn-secondary text-center">Cancel</Link><button type="submit" disabled={isSubmitting || !domainId || (isLive && !allDomains && !categoryId)} className="btn-primary">{isSubmitting ? "Saving…" : isLive ? (isEdit ? "Update Live Quiz" : "Create Live Quiz") : (isEdit ? "Update Quiz" : "Create Quiz")}</button></div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
