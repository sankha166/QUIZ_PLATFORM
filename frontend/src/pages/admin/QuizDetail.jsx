import { useEffect, useRef, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  getQuizById,
  getQuestions,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  updateQuizStatus,
  deleteQuiz,
} from "../../api/quiz.api";
import { importQuestions as importQuestionsApi } from "../../api/domain.api";
import AdminLayout from "../../components/admin/AdminLayout";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ConfirmModal from "../../components/common/ConfirmModal";
import Badge from "../../components/common/Badge";
import { statusColor, getErrorMessage } from "../../utils/helpers";
import { getQuestionReports, updateQuestionReport } from "../../api/admin.api";

function QuestionFormModal({ question, quizId, isLive, onSave, onClose }) {
  const [text, setText] = useState(question?.question_text || "");
  const [marks, setMarks] = useState(question?.marks || 1);
  const [explanation, setExplanation] = useState(question?.explanation || "");
  const [questionImage, setQuestionImage] = useState(question?.question_image_url || "");
  const [explanationImage, setExplanationImage] = useState(question?.explanation_image_url || "");
  const [time, setTime] = useState(question?.time_limit_seconds || 30);
  const [options, setOptions] = useState(
    question?.options?.length
      ? question.options.map((o) => ({
          text: o.option_text,
          correct: o.is_correct,
          image: o.image_url || "",
        }))
      : Array.from({ length: 4 }, () => ({ text: "", correct: false, image: "" })),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const readImage = (file, setter) => {
    if (!file?.type?.startsWith("image/")) return setError("Please choose an image file.");
    if (file.size > 4 * 1024 * 1024) return setError("Images must be smaller than 4 MB.");
    const reader = new FileReader();
    reader.onload = () => setter(String(reader.result));
    reader.readAsDataURL(file);
  };
  const pasteImage = (event, setter) => {
    const item = [...(event.clipboardData?.items || [])].find((entry) => entry.type.startsWith("image/"));
    if (item) { event.preventDefault(); readImage(item.getAsFile(), setter); }
  };

  const submit = async (e) => {
    e.preventDefault();
    const valid = options.filter((o) => o.text.trim());
    if (!text.trim()) return setError("Question text is required");
    if (valid.length < 2) return setError("At least 2 options required");
    if (!valid.some((o) => o.correct))
      return setError("Mark one option as correct");
    if (isLive && (Number(time) < 5 || Number(time) > 600))
      return setError("Live question time must be 5–600 seconds");
    setSaving(true);
    setError("");
    try {
      const payload = {
        question_text: text.trim(),
        marks: Number(marks) || 1,
        explanation: explanation.trim(),
        question_image_url: questionImage,
        explanation_image_url: explanationImage,
        time_limit_seconds: isLive ? Number(time) : null,
        options: valid.map((o) => ({
          option_text: o.text.trim(),
          is_correct: o.correct,
          image_url: o.image,
        })),
      };
      if (question) await updateQuestion(question.id, payload);
      else await addQuestion(quizId, payload);
      onSave();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-5 shadow-2xl sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold">
              {question ? "Edit Question" : "Add Question"}
            </h3>
            <p className="text-sm text-slate-500">
              {isLive
                ? "The shared live timer is applied automatically when enabled. Individual timing is available only when shared timing is disabled."
                : "Build a normal quiz question."}
            </p>
          </div>
          <button onClick={onClose} className="text-xl text-slate-500">
            ✕
          </button>
        </div>
        {error && (
          <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {error}
          </div>
        )}
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Question text *</label>
            <textarea
              className="input w-full"
              rows={4}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Marks</label>
              <input
                type="number"
                min="1"
                className="input w-full"
                value={marks}
                onChange={(e) => setMarks(e.target.value)}
              />
            </div>
            {isLive && (
              <div>
                <label className="label">Question time (seconds)</label>
                <input
                  type="number"
                  min="5"
                  max="600"
                  className="input w-full"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
                <p className="mt-1 text-xs text-slate-500">
                  If shared timing is enabled on the event, the backend uses the
                  event default instead.
                </p>
              </div>
            )}
          </div>
          <div>
            <label className="label">Explanation</label>
            <textarea
              className="input w-full"
              rows={2}
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div onPaste={(event) => pasteImage(event, setQuestionImage)}>
              <label className="label">Question diagram or image</label>
              <input type="url" className="input mb-2" placeholder="Paste image URL or paste an image" value={questionImage.startsWith("data:") ? "" : questionImage} onChange={(e) => setQuestionImage(e.target.value)} />
              <input type="file" accept="image/*" onChange={(e) => readImage(e.target.files?.[0], setQuestionImage)} className="w-full text-sm" />
              {questionImage && <img src={questionImage} alt="Question preview" className="mt-2 max-h-28 rounded-lg border object-contain" />}
            </div>
            <div onPaste={(event) => pasteImage(event, setExplanationImage)}>
              <label className="label">Explanation diagram or image</label>
              <input type="url" className="input mb-2" placeholder="Paste image URL or paste an image" value={explanationImage.startsWith("data:") ? "" : explanationImage} onChange={(e) => setExplanationImage(e.target.value)} />
              <input type="file" accept="image/*" onChange={(e) => readImage(e.target.files?.[0], setExplanationImage)} className="w-full text-sm" />
              {explanationImage && <img src={explanationImage} alt="Explanation preview" className="mt-2 max-h-28 rounded-lg border object-contain" />}
            </div>
          </div>
          <div>
            <label className="label">Options</label>
            <div className="space-y-2">
              {options.map((o, i) => (
                <div key={i} className="rounded-xl border border-slate-200 p-2">
                  <div className="flex gap-2">
                  <input
                    type="radio"
                    checked={o.correct}
                    onChange={() =>
                      setOptions((x) =>
                        x.map((v, j) => ({ ...v, correct: j === i })),
                      )
                    }
                  />
                  </div>
                  <div className="mt-2" onPaste={(event) => pasteImage(event, (image) => setOptions((x) => x.map((v, j) => j === i ? { ...v, image } : v)))}>
                    <input type="url" className="input w-full text-xs" placeholder="Option image URL or paste an image" value={o.image?.startsWith("data:") ? "" : o.image || ""} onChange={(e) => setOptions((x) => x.map((v, j) => j === i ? { ...v, image: e.target.value } : v))} />
                    <input type="file" accept="image/*" className="mt-1 w-full text-xs" onChange={(e) => readImage(e.target.files?.[0], (image) => setOptions((x) => x.map((v, j) => j === i ? { ...v, image } : v)))} />
                    {o.image && <img src={o.image} alt={`Option ${i + 1} preview`} className="mt-2 max-h-20 rounded border object-contain" />}
                  </div>
                  <input
                    className="input min-w-0 flex-1"
                    placeholder={`Option ${i + 1}`}
                    value={o.text}
                    onChange={(e) =>
                      setOptions((x) =>
                        x.map((v, j) =>
                          j === i ? { ...v, text: e.target.value } : v,
                        ),
                      )
                    }
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() =>
                        setOptions((x) => x.filter((_, j) => j !== i))
                      }
                      className="text-lg text-rose-500"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() =>
                setOptions((x) => [...x, { text: "", correct: false, image: "" }])
              }
              className="mt-2 text-sm text-indigo-600"
            >
              + Add option
            </button>
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button disabled={saving} className="btn-primary">
              {saving ? "Saving…" : "Save question"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AiImportModal({ quizId, isLive, onImported, onClose }) {
  const fileRef = useRef(null);
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null);

  const importQuestions = async () => {
    if (!text.trim() && !file)
      return setError("Paste content or choose a document first.");
    setLoading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("quiz_id", String(quizId));
      if (text.trim()) fd.append("text", text.trim());
      if (file) fd.append("file", file);
      // Use the shared Axios client so the configured VITE_API_BASE and JWT
      // are used. This avoids Vercel POST/405 errors caused by calling a
      // relative frontend URL when the API is deployed separately.
      const response = await importQuestionsApi(fd);
      const qs = response.data.questions || response.data.data?.questions || [];
      if (!qs.length) throw new Error("No questions returned.");
      setPreview(qs);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const saveImported = async () => {
    if (!preview?.length) return;
    setLoading(true);
    setError("");
    let saved = 0;
    try {
      for (const item of preview) {
        const options = (item.options || [])
          .map((o) => ({
            option_text: String(o.option_text ?? o.text ?? "").trim(),
            is_correct: Boolean(o.is_correct ?? o.correct),
          }))
          .filter((o) => o.option_text);
        if (
          !item.question_text?.trim() ||
          options.length < 2 ||
          !options.some((o) => o.is_correct)
        )
          continue;
        await addQuestion(quizId, {
          question_text: item.question_text.trim(),
          marks: Number(item.marks) || 1,
          explanation: item.explanation || "",
          difficulty: item.difficulty || null,
          time_limit_seconds: isLive ? item.time_limit_seconds : null,
          question_image_url: item.question_image_url || "",
          explanation_image_url: item.explanation_image_url || "",
          options,
        });
        saved++;
      }
      if (!saved) throw new Error("No valid questions could be saved.");
      onImported();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4">
      <div className="w-full max-w-4xl rounded-3xl bg-white p-5 shadow-2xl sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold sm:text-2xl">
              AI Question Import
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Import PDF/DOCX/TXT questions for this {isLive ? "live " : ""}
              quiz, review them, then save. Live shared timing is applied
              automatically by the backend.
            </p>
          </div>
          <button onClick={onClose} className="text-xl text-slate-500">
            ✕
          </button>
        </div>
        {error && (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {error}
          </div>
        )}
        {!preview ? (
          <div className="mt-5 space-y-4">
            <textarea
              className="input w-full"
              rows={10}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste questions here..."
            />
            <div className="rounded-2xl border-2 border-dashed border-slate-200 p-5 text-center">
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt,.md"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="btn-secondary"
              >
                {file ? "Change document" : "Choose PDF / Document"}
              </button>
              {file && (
                <p className="mt-2 break-all text-sm text-slate-600">
                  {file.name}
                </p>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={onClose} className="btn-secondary">
                Cancel
              </button>
              <button
                onClick={importQuestions}
                disabled={loading}
                className="btn-primary"
              >
                {loading ? "Extracting…" : "Extract with AI"}
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            <div className="max-h-[55vh] space-y-3 overflow-y-auto">
              {preview.map((q, i) => (
                <div key={i} className="rounded-2xl border p-4">
                  <p className="font-semibold">
                    Q{i + 1}. {q.question_text}
                  </p>
                  {q.question_image_url && (
                    <img
                      src={q.question_image_url}
                      alt={`Question ${i + 1} diagram`}
                      className="mt-3 max-h-56 w-full rounded-xl border object-contain"
                    />
                  )}
                  {q.options?.length > 0 && (
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {q.options.map((o, j) => (
                        <div
                          key={j}
                          className={`rounded-xl border p-3 text-sm ${o.is_correct ? "border-emerald-300 bg-emerald-50" : ""}`}
                        >
                          <b>{String.fromCharCode(65 + j)}.</b>{" "}
                          {o.option_text || o.text}
                          {o.is_correct && (
                            <span className="ml-2 font-semibold text-emerald-700">
                              Correct
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {q.explanation && (
                    <p className="mt-2 text-sm text-slate-500">
                      {q.explanation}
                    </p>
                  )}
                  {q.explanation_image_url && (
                    <img
                      src={q.explanation_image_url}
                      alt={`Question ${i + 1} explanation diagram`}
                      className="mt-3 max-h-48 w-full rounded-xl border object-contain"
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setPreview(null)}
                className="btn-secondary"
              >
                Back
              </button>
              <button
                onClick={saveImported}
                disabled={loading}
                className="btn-primary"
              >
                {loading ? "Saving…" : `Save ${preview.length} Questions`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function QuizDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [questionModal, setQuestionModal] = useState(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteQuizOpen, setDeleteQuizOpen] = useState(false);
  const [reports, setReports] = useState([]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [q, qs] = await Promise.all([getQuizById(id), getQuestions(id)]);
      setQuiz(q.data.quiz);
      setQuestions(qs.data.questions || []);
      try {
        const reportResponse = await getQuestionReports({ quizId: id });
        setReports(reportResponse.data.reports || []);
      } catch (reportError) {
        console.error("Unable to load question reports", reportError);
        setReports([]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchAll();
  }, [id]);

  const toggleStatus = async () => {
    try {
      await updateQuizStatus(
        id,
        quiz.status === "published" ? "unpublished" : "published",
      );
      fetchAll();
    } catch (e) {
      alert(getErrorMessage(e));
    }
  };
  const removeQuestion = async () => {
    try {
      await deleteQuestion(deleteTarget.id);
      setDeleteTarget(null);
      fetchAll();
    } catch (e) {
      alert(getErrorMessage(e));
    }
  };
  const removeQuiz = async () => {
    try {
      await deleteQuiz(id);
      navigate(quiz?.is_live_quiz ? "/admin/live-quizzes" : "/admin/quizzes");
    } catch (e) {
      alert(getErrorMessage(e));
    }
  };

  if (loading)
    return (
      <AdminLayout>
        <LoadingSpinner size="lg" className="py-20" />
      </AdminLayout>
    );
  const isLive = Boolean(quiz?.is_live_quiz);
  return (
    <AdminLayout>
      <div className="min-w-0 space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <Link
              to={isLive ? "/admin/live-quizzes" : "/admin/quizzes"}
              className="text-sm text-slate-500"
            >
              ← Back
            </Link>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <h2 className="break-words text-2xl font-bold sm:text-3xl">
                {quiz?.title}
              </h2>
              {isLive && (
                <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-700">
                  🔴 LIVE QUIZ
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {isLive
                ? "Live event control. Every question uses the configured timer and speed-based rating."
                : "Manage questions and quiz details."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setQuestionModal({})}
              className="btn-secondary"
            >
              + Add Question
            </button>
            <button onClick={() => setAiOpen(true)} className="btn-primary">
              AI Import
            </button>
            <button onClick={toggleStatus} className="btn-secondary">
              {quiz?.status === "published" ? "Unpublish" : "Publish"}
            </button>
            <button
              onClick={() => setDeleteQuizOpen(true)}
              className="btn-secondary text-rose-600"
            >
              Delete
            </button>
          </div>
        </div>
        <div className="card">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-xs text-slate-500">Category</p>
              <p className="mt-1 font-semibold">
                {quiz?.category_name || "All Categories"}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Domain</p>
              <p className="mt-1 font-semibold">
                {quiz?.live_all_domains
                  ? "All Domains"
                  : quiz?.domain_name || "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Questions</p>
              <p className="mt-1 font-semibold">{questions.length}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Status</p>
              <Badge className={statusColor(quiz?.status)}>
                {quiz?.status}
              </Badge>
            </div>
          </div>
        </div>
        <div className="card overflow-hidden p-0">
          <div className="border-b p-4">
            <h3 className="font-semibold">
              {isLive ? "Live Questions" : "Questions"} ({questions.length})
            </h3>
          </div>
          {reports.length > 0 && (
            <div className="card space-y-4">
              <div>
                <h3 className="font-semibold">Question reports ({reports.length})</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Review student feedback and track corrections for this quiz.
                </p>
              </div>
              <div className="space-y-3">
                {reports.map((report) => (
                  <div key={report.id} className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{report.question_text}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          Reported by {report.student_name || report.student_email} · {report.reason.replaceAll("_", " ")}
                        </p>
                      </div>
                      <select
                        className="input w-auto py-1 text-xs"
                        value={report.status}
                        onChange={async (event) => {
                          try {
                            const response = await updateQuestionReport(report.id, { status: event.target.value, admin_note: report.admin_note });
                            setReports((items) => items.map((item) => item.id === report.id ? { ...item, ...response.data.report } : item));
                          } catch (error) {
                            alert(getErrorMessage(error));
                          }
                        }}
                      >
                        <option value="open">Open</option>
                        <option value="reviewing">Reviewing</option>
                        <option value="resolved">Resolved</option>
                        <option value="dismissed">Dismissed</option>
                      </select>
                    </div>
                    <p className="mt-3 text-sm text-slate-700">{report.details}</p>
                    {report.screenshot_url && <img src={report.screenshot_url} alt="Student report screenshot" className="mt-3 max-h-56 rounded-xl border object-contain" />}
                    {report.admin_note && <p className="mt-2 text-xs text-slate-500">Admin note: {report.admin_note}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
          {questions.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              No questions yet.
            </div>
          ) : (
            <div className="divide-y">
              {questions.map((q, i) => (
                <div key={q.id} className="p-4">
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <span className="font-semibold text-indigo-600">
                      Q{i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap gap-2">
                        <p className="font-medium">{q.question_text}</p>
                        {isLive && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                            ⏱ {q.time_limit_seconds || 30}s
                          </span>
                        )}
                      </div>
                      {q.question_image_url && (
                        <div className="mt-3 rounded-xl border border-indigo-100 bg-slate-50 p-2">
                          <p className="mb-2 text-xs font-semibold text-slate-500">
                            Question image
                          </p>
                          <img
                            src={q.question_image_url}
                            alt={`Question ${i + 1} diagram`}
                            className="max-h-56 w-full rounded-lg object-contain"
                          />
                        </div>
                      )}
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {q.options?.map((o) => (
                          <div
                            key={o.id}
                            className={`rounded-xl border p-2 text-sm ${o.is_correct ? "border-emerald-200 bg-emerald-50 text-emerald-700" : ""}`}
                          >
                            <div>{o.is_correct ? "✓ " : ""}{o.option_text}</div>
                            {o.image_url && <img src={o.image_url} alt="" className="mt-2 max-h-24 rounded-lg object-contain" />}
                          </div>
                        ))}
                      </div>
                      {q.explanation && (
                        <p className="mt-3 text-sm text-slate-500">
                          <b>Explanation:</b> {q.explanation}
                        </p>
                      )}
                      {q.explanation_image_url && (
                        <div className="mt-3 rounded-xl border border-indigo-100 bg-indigo-50/50 p-2">
                          <p className="mb-2 text-xs font-semibold text-indigo-700">
                            Explanation image
                          </p>
                          <img
                            src={q.explanation_image_url}
                            alt={`Question ${i + 1} explanation diagram`}
                            className="max-h-56 w-full rounded-lg object-contain"
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-3 sm:self-start">
                      <button
                        onClick={() => setQuestionModal(q)}
                        className="text-sm text-indigo-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteTarget(q)}
                        className="text-sm text-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {questionModal && (
        <QuestionFormModal
          question={questionModal.id ? questionModal : null}
          quizId={id}
          isLive={isLive}
          onSave={() => {
            setQuestionModal(null);
            fetchAll();
          }}
          onClose={() => setQuestionModal(null)}
        />
      )}{" "}
      {aiOpen && (
        <AiImportModal
          quizId={id}
          isLive={isLive}
          onImported={() => {
            setAiOpen(false);
            fetchAll();
          }}
          onClose={() => setAiOpen(false)}
        />
      )}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Question"
        message="Delete this question?"
        onConfirm={removeQuestion}
        onCancel={() => setDeleteTarget(null)}
        confirmText="Delete"
      />
      <ConfirmModal
        isOpen={deleteQuizOpen}
        title="Delete Quiz"
        message="This permanently deletes the quiz and its questions. Continue?"
        onConfirm={removeQuiz}
        onCancel={() => setDeleteQuizOpen(false)}
        confirmText="Delete"
      />
    </AdminLayout>
  );
}
