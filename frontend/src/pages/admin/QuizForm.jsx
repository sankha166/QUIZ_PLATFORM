import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { getQuizById, createQuiz, updateQuiz, getCategories } from "../../api/quiz.api";
import { getDomains } from "../../api/domain.api";
import AdminLayout from "../../components/admin/AdminLayout";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { getErrorMessage } from "../../utils/helpers";

const DEFAULT_SCORING = { live_score_025: 2, live_score_050: 1.5, live_score_075: 1.25, live_score_100: 1, live_score_wrong: -0.5 };

const parseIstSchedule = (value) => {
  if (!value) return { date: "", hour: "12", minute: "00", period: "AM" };
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return { date: "", hour: "12", minute: "00", period: "AM" };
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: true }).formatToParts(d).reduce((a, p) => ({ ...a, [p.type]: p.value }), {});
  return { date: `${parts.year}-${parts.month}-${parts.day}`, hour: parts.hour, minute: parts.minute, period: parts.dayPeriod?.toUpperCase() || "AM" };
};
const toIstIso = ({ date, hour, minute, period }) => {
  if (!date || !hour || !minute || !period) return "";
  let h = Number(hour) % 12;
  if (period === "PM") h += 12;
  return `${date}T${String(h).padStart(2, "0")}:${minute}:00+05:30`;
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
  const [schedule, setSchedule] = useState({ date: "", hour: "12", minute: "00", period: "AM" });

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm({ defaultValues: { difficulty: "medium", max_attempts: 1, passing_score: 60, duration: 10, is_live_quiz: createLive, live_all_domains: false, live_same_question_time: true, live_question_time_seconds: 30, ...DEFAULT_SCORING } });
  const categoryId = watch("category_id");
  const isLive = watch("is_live_quiz");
  const allDomains = watch("live_all_domains");
  const sameQuestionTime = watch("live_same_question_time");

  useEffect(() => {
    Promise.all([getDomains(), getCategories(), isEdit ? getQuizById(id) : Promise.resolve(null)]).then(([domainResponse, categoryResponse, quizResponse]) => {
      const ds = domainResponse.data.domains || [];
      const cs = categoryResponse.data.categories || [];
      setDomains(ds); setCategories(cs);
      if (quizResponse?.data?.quiz) {
        const q = quizResponse.data.quiz;
        const cat = cs.find((c) => String(c.id) === String(q.category_id));
        setDomainId(q.live_all_domains ? "all" : String(q.domain_id ?? cat?.domain_id ?? ""));
        setSchedule(parseIstSchedule(q.live_start_at));
        reset({ ...q, category_id: q.category_id ? String(q.category_id) : "", is_live_quiz: Boolean(q.is_live_quiz), live_all_domains: Boolean(q.live_all_domains), live_same_question_time: q.live_same_question_time !== false, live_question_time_seconds: Number(q.live_question_time_seconds ?? 30), live_score_025: Number(q.live_score_025 ?? 2), live_score_050: Number(q.live_score_050 ?? 1.5), live_score_075: Number(q.live_score_075 ?? 1.25), live_score_100: Number(q.live_score_100 ?? 1), live_score_wrong: Number(q.live_score_wrong ?? -0.5) });
      } else if (createLive) { setDomainId("all"); setValue("live_all_domains", true); }
      else if (ds[0]) setDomainId(String(ds[0].id));
    }).catch((e) => setError(getErrorMessage(e))).finally(() => setLoading(false));
  }, [id, isEdit, reset, setValue, createLive]);

  useEffect(() => { setValue("live_start_at", toIstIso(schedule)); }, [schedule, setValue]);
  const domainCategories = allDomains ? categories : categories.filter((c) => String(c.domain_id) === String(domainId));
  useEffect(() => { if (categoryId && domainId !== "all" && !domainCategories.some((c) => String(c.id) === String(categoryId))) setValue("category_id", ""); }, [domainId, categoryId, setValue, allDomains, domainCategories]);

  const onSubmit = async (form) => {
    setError("");
    try {
      const liveStart = toIstIso(schedule);
      if (isLive && !liveStart) return setError("Select a valid start date, time and AM/PM in IST.");
      if (isLive && !allDomains && !form.category_id) return setError("Select a category or choose All Domains.");
      if (isLive && (!form.live_question_time_seconds || Number(form.live_question_time_seconds) < 5 || Number(form.live_question_time_seconds) > 600)) return setError("Live question time must be between 5 and 600 seconds.");
      const selected = domainCategories.find((c) => String(c.id) === String(form.category_id));
      const data = { ...form, domain_id: allDomains ? "all" : domainId, category_id: allDomains ? null : (form.category_id || null), domain_name: allDomains ? "All Domains" : domains.find((d) => String(d.id) === String(domainId))?.name || null, category_name: selected?.name || "All Categories", is_live_quiz: Boolean(isLive), live_all_domains: Boolean(allDomains), live_start_at: liveStart, live_end_at: null, live_same_question_time: Boolean(form.live_same_question_time), live_question_time_seconds: Math.min(600, Math.max(5, Number(form.live_question_time_seconds) || 30)) };
      if (isEdit) await updateQuiz(id, data); else await createQuiz(data);
      navigate(isLive ? "/admin/live-quizzes" : "/admin/quizzes");
    } catch (e) { setError(getErrorMessage(e)); }
  };

  if (loading) return <AdminLayout><LoadingSpinner size="lg" className="py-20" /></AdminLayout>;
  return <AdminLayout><div className="mx-auto min-w-0 max-w-4xl space-y-6">
    <div><Link to={isLive ? "/admin/live-quizzes" : "/admin/quizzes"} className="text-sm text-slate-500">← Back</Link><div className="mt-2 flex flex-wrap items-center gap-2"><h2 className="text-2xl font-bold sm:text-3xl">{isLive ? (isEdit ? "Edit Live Quiz" : "Create Live Quiz") : isEdit ? "Edit Quiz" : "Create Quiz"}</h2>{isLive && <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-700">LIVE QUIZ ONLY</span>}</div></div>
    {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
    <div className="card"><form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div><label className="label">Title *</label><input className="input" {...register("title", { required: "Title is required" })} />{errors.title && <p className="mt-1 text-xs text-rose-500">{errors.title.message}</p>}</div>
      <div><label className="label">Description</label><textarea className="input" rows={4} {...register("description")} /></div>
      <div className="grid gap-4 md:grid-cols-2"><div><label className="label">Domain *</label><select className="input" value={domainId} onChange={(e) => { const v=e.target.value; setDomainId(v); setValue("category_id", ""); setValue("live_all_domains", v === "all"); }}><option value="">Select domain</option>{isLive && <option value="all">All Domains</option>}{domains.map((d)=><option key={d.id} value={d.id}>{d.name}</option>)}</select><p className="mt-1 text-xs text-slate-500">{domainId === "all" ? "Visible to every student only in Live Quizzes." : "Students in the selected domain can see this event."}</p></div><div><label className="label">Category {allDomains ? "(not required)" : "*"}</label><select className="input" {...register("category_id", { required: isLive && !allDomains })} disabled={!domainId || (!allDomains && !domainCategories.length)}><option value="">{allDomains ? "All Categories" : !domainId ? "Select domain first" : !domainCategories.length ? "No categories in this domain" : "Select category"}</option>{domainCategories.map((c)=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div></div>
      {isLive && <label className="flex items-center gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4"><input type="checkbox" className="h-5 w-5" checked={Boolean(allDomains)} onChange={(e)=>{const on=e.target.checked;setValue("live_all_domains",on);setDomainId(on?"all":domains[0]?.id?String(domains[0].id):"");setValue("category_id","");}}/><span><b className="text-indigo-900">All Domains</b><span className="mt-1 block text-xs text-slate-500">No category is required. The event appears only in Live Quizzes.</span></span></label>}
      <div><label className="label">Difficulty *</label><select className="input" {...register("difficulty", { required: true })}><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></div>
      {!isLive && <div className="grid gap-4 md:grid-cols-2"><div><label className="label">Overall Duration (min) *</label><input type="number" min="1" className="input" {...register("duration", { required:true, valueAsNumber:true })}/></div><div><label className="label">Passing Score (%) *</label><input type="number" min="1" max="100" className="input" {...register("passing_score", { required:true, valueAsNumber:true })}/></div><div><label className="label">Max Attempts</label><input type="number" min="1" className="input" {...register("max_attempts", { valueAsNumber:true })}/></div></div>}
      {isLive && <>
        <div className="rounded-3xl border border-rose-200 bg-gradient-to-br from-rose-50 to-orange-50 p-5"><h3 className="text-lg font-bold">Live Scoring Rules</h3><p className="mt-1 text-xs text-slate-600">Configure the rating multiplier used for each correct answer.</p><div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">{[["live_score_025","≤ 0.25× time","2.0×"],["live_score_050","≤ 0.50× time","1.5×"],["live_score_075","≤ 0.75× time","1.25×"],["live_score_100","≤ 1.00× time","1.0×"],["live_score_wrong","Wrong answer","-0.5×"]].map(([name,label,placeholder])=><div key={name}><label className="text-xs font-semibold text-slate-700">{label}</label><input type="number" step="0.05" className="input mt-1" placeholder={placeholder} {...register(name,{required:true,valueAsNumber:true})}/></div>)}</div><p className="mt-3 text-xs text-slate-500">Unanswered = 0×.</p></div>
        <div className="rounded-3xl border border-indigo-200 bg-indigo-50/60 p-5"><h3 className="text-lg font-bold">Question Timing</h3><p className="mt-1 text-xs text-slate-600">Set one timer once and automatically apply it to every live question.</p><label className="mt-4 flex items-start gap-3"><input type="checkbox" className="mt-1 h-5 w-5" {...register("live_same_question_time")}/><span><b>Same time for every question</b><span className="mt-1 block text-xs text-slate-500">Recommended. Updating this value also updates all existing live questions.</span></span></label><div className="mt-4 max-w-sm"><label className="label">Time per question (seconds) *</label><input type="number" min="5" max="600" className="input" {...register("live_question_time_seconds",{required:true,valueAsNumber:true,min:5,max:600})}/><p className="mt-1 text-xs text-slate-500">{sameQuestionTime ? "Applied automatically to all questions." : "Individual timers can be adjusted in Manage Questions."}</p></div></div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-2"><div><h3 className="text-lg font-bold">Live Start Time</h3><p className="mt-1 text-xs text-slate-500">Indian Standard Time (IST, UTC+05:30). This is the single event time used by admin and students.</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">IST</span></div><div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3"><div><label className="label">Date *</label><input type="date" className="input" value={schedule.date} onChange={(e)=>setSchedule(s=>({...s,date:e.target.value}))}/></div><div><label className="label">Time *</label><div className="flex gap-2"><select className="input" value={schedule.hour} onChange={(e)=>setSchedule(s=>({...s,hour:e.target.value}))}>{Array.from({length:12},(_,i)=>String(i+1).padStart(2,"0")).map(h=><option key={h}>{h}</option>)}</select><select className="input" value={schedule.minute} onChange={(e)=>setSchedule(s=>({...s,minute:e.target.value}))}>{Array.from({length:60},(_,i)=>String(i).padStart(2,"0")).map(m=><option key={m}>{m}</option>)}</select><select className="input" value={schedule.period} onChange={(e)=>setSchedule(s=>({...s,period:e.target.value}))}><option>AM</option><option>PM</option></select></div></div><div className="rounded-2xl bg-slate-50 p-3"><p className="text-xs text-slate-400">Scheduled time</p><p className="mt-1 font-semibold text-slate-800">{schedule.date ? `${schedule.date} · ${schedule.hour}:${schedule.minute} ${schedule.period}` : "Choose date and time"}</p><p className="mt-1 text-[11px] text-slate-500">No automatic extra 5h 30m is added.</p></div></div><input type="hidden" {...register("live_start_at")}/></div>
      </>}
      <div><label className="label">Thumbnail URL</label><input className="input" type="url" {...register("thumbnail_url")}/></div>
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end"><Link to={isLive?"/admin/live-quizzes":"/admin/quizzes"} className="btn-secondary text-center">Cancel</Link><button type="submit" disabled={isSubmitting||!domainId||(isLive&&!allDomains&&!categoryId)} className="btn-primary">{isSubmitting?"Saving…":isLive?(isEdit?"Update Live Quiz":"Create Live Quiz"):(isEdit?"Update Quiz":"Create Quiz")}</button></div>
    </form></div>
  </div></AdminLayout>;
}
