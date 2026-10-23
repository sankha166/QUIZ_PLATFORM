import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { importQuestions } from "../../api/domain.api";
import { addQuestion, getQuizById } from "../../api/quiz.api";
import AdminLayout from "../../components/admin/AdminLayout";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { getErrorMessage } from "../../utils/helpers";
export default function AIQuestionImport() {
  const { id } = useParams();
  const nav = useNavigate();
  const [file, setFile] = useState(null),
    [text, setText] = useState(""),
    [questions, setQuestions] = useState([]),
    [quiz, setQuiz] = useState(null),
    [busy, setBusy] = useState(false),
    [saving, setSaving] = useState(false),
    [error, setError] = useState("");
  const setQuestionImage = (index, file, field) => {
    if (!file?.type?.startsWith("image/")) return setError("Please choose an image file.");
    if (file.size > 4 * 1024 * 1024) return setError("Images must be smaller than 4 MB.");
    const reader = new FileReader();
    reader.onload = () => setQuestions((current) => current.map((q, i) => i === index ? { ...q, [field]: String(reader.result) } : q));
    reader.readAsDataURL(file);
  };
  const pasteQuestionImage = (event, index, field) => {
    const item = [...(event.clipboardData?.items || [])].find((entry) => entry.type.startsWith("image/"));
    if (item) { event.preventDefault(); setQuestionImage(index, item.getAsFile(), field); }
  };
  const run = async () => {
    setError("");
    setBusy(true);
    try {
      const f = new FormData();
      if (file) f.append("file", file);
      if (text.trim()) f.append("text", text);
      const r = await importQuestions(f);
      setQuestions(r.data.questions || []);
      if (!quiz) {
        try {
          setQuiz((await getQuizById(id)).data.quiz);
        } catch {}
      }
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const invalid = questions.findIndex(
        (q) =>
          !q.explanation?.trim() ||
          q.options?.filter((option) => option.is_correct).length !== 1,
      );
      if (invalid >= 0) {
        throw new Error(
          `Question ${invalid + 1} needs exactly one verified correct answer and a non-empty explanation before it can be saved.`,
        );
      }
      for (const q of questions)
        await addQuestion(id, {
          question_text: q.question_text,
          marks: q.marks || 1,
          difficulty: q.difficulty || null,
          explanation: q.explanation || "",
          question_image_url: q.question_image_url || "",
          explanation_image_url: q.explanation_image_url || "",
          options: q.options,
        });
      nav(`/admin/quizzes/${id}`);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };
  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-6 min-w-0">
        <div>
          <Link to={`/admin/quizzes/${id}`} className="text-sm text-slate-500">
            ← Back
          </Link>
          <h2 className="text-2xl font-bold mt-2">AI Question Import</h2>
          <p className="text-sm text-slate-500 mt-1">
            Paste a PYQ or upload PDF/DOCX/TXT. Review extracted questions
            before saving.
          </p>
        </div>
        <div className="card space-y-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="input w-full"
            rows={10}
            placeholder="Paste the complete question paper here..."
          />
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <input
              type="file"
              accept=".pdf,.docx,.txt,.md"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full text-sm"
            />
            <button
              disabled={busy || (!file && !text.trim())}
              onClick={run}
              className="btn-primary shrink-0"
            >
              {busy ? "Extracting…" : "Extract Questions"}
            </button>
          </div>
          {error && (
            <div className="rounded-xl bg-red-50 text-red-700 p-3 text-sm">
              {error}
            </div>
          )}
        </div>
        {busy && <LoadingSpinner size="lg" className="py-10" />}
        {questions.length > 0 && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="font-semibold">
                  {questions.length} questions detected
                </h3>
                <p className="text-sm text-slate-500">
                  Review the extracted question, options, answer and
                  explanation.
                </p>
              </div>
              <button disabled={saving} onClick={save} className="btn-primary">
                {saving ? "Saving…" : `Save all ${questions.length}`}
              </button>
            </div>
            {questions.map((q, i) => (
              <div key={i} className="card" onPaste={(event) => pasteQuestionImage(event, i, "question_image_url")}>
                <div className="font-medium">
                  {i + 1}. {q.question_text}
                </div>
                {q.question_image_url && <img src={q.question_image_url} alt="Question diagram" className="mt-3 max-h-56 rounded-xl border object-contain" />}
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span>Paste an image here, or add a diagram:</span>
                  <input type="file" accept="image/*" onChange={(event) => setQuestionImage(i, event.target.files?.[0], "question_image_url")} />
                  {q.question_image_url && <button type="button" className="text-rose-600" onClick={() => setQuestions((current) => current.map((item, index) => index === i ? { ...item, question_image_url: "" } : item))}>Remove question image</button>}
                </div>
                <div className="mt-3 grid gap-2">
                  {q.options.map((o, j) => (
                    <div
                      key={j}
                      className={`rounded-xl border p-3 text-sm ${o.is_correct ? "border-green-300 bg-green-50" : ""}`}
                    >
                      <span className="font-semibold mr-2">
                        {String.fromCharCode(65 + j)}.
                      </span>
                      {o.option_text}
                      {o.is_correct && (
                        <span className="ml-2 text-green-700 font-semibold">
                          Correct
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                {q.explanation && (
                  <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm">
                    <b>Explanation:</b> {q.explanation}
                    {q.explanation_image_url && <img src={q.explanation_image_url} alt="Explanation diagram" className="mt-2 max-h-48 rounded-lg border object-contain" />}
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500" onPaste={(event) => pasteQuestionImage(event, i, "explanation_image_url")}>
                      <span>Add explanation diagram:</span>
                      <input type="file" accept="image/*" onChange={(event) => setQuestionImage(i, event.target.files?.[0], "explanation_image_url")} />
                      {q.explanation_image_url && <button type="button" className="text-rose-600" onClick={() => setQuestions((current) => current.map((item, index) => index === i ? { ...item, explanation_image_url: "" } : item))}>Remove image</button>}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
