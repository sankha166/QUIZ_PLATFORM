import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import {
  getQuizById,
  createQuiz,
  updateQuiz,
  getCategories,
} from "../../api/quiz.api";
import { getDomains } from "../../api/domain.api";
import AdminLayout from "../../components/admin/AdminLayout";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { getErrorMessage } from "../../utils/helpers";

export default function QuizForm() {
  const { id } = useParams();
  const location = useLocation();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const createLive = new URLSearchParams(location.search).get("live") === "1";

  const [categories, setCategories] = useState([]);
  const [domains, setDomains] = useState([]);
  const [domainId, setDomainId] = useState("");
  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      difficulty: "medium",
      max_attempts: 1,
      passing_score: 60,
      duration: 10,
      is_live_quiz: createLive,
      live_all_domains: false,
    },
  });

  const categoryId = watch("category_id");
  const isLive = watch("is_live_quiz");
  const allDomains = watch("live_all_domains");

  useEffect(() => {
    Promise.all([
      getDomains(),
      getCategories(),
      isEdit ? getQuizById(id) : Promise.resolve(null),
    ])
      .then(([dr, cr, qr]) => {
        const ds = dr.data.domains || [];
        const cs = cr.data.categories || [];
        setDomains(ds);
        setCategories(cs);

        if (qr?.data?.quiz) {
          const q = qr.data.quiz;
          const category = cs.find(
            (c) => String(c.id) === String(q.category_id),
          );
          setDomainId(
            q.live_all_domains
              ? "all"
              : String(q.domain_id ?? category?.domain_id ?? ""),
          );
          reset({
            ...q,
            category_id: q.category_id ? String(q.category_id) : "",
            is_live_quiz: Boolean(q.is_live_quiz),
            live_all_domains: Boolean(q.live_all_domains),
          });
        } else if (ds[0]) {
          setDomainId(String(ds[0].id));
        }
      })
      .catch((e) => setError(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [id, isEdit, reset]);

  const domainCategories = allDomains
    ? categories
    : categories.filter((c) => String(c.domain_id) === String(domainId));

  useEffect(() => {
    if (
      categoryId &&
      domainId !== "all" &&
      !domainCategories.some((c) => String(c.id) === String(categoryId))
    ) {
      setValue("category_id", "");
    }
  }, [domainId, categoryId, setValue, allDomains, domainCategories]);

  const onSubmit = async (form) => {
    setError("");

    try {
      if (isLive && !form.live_start_at) {
        return setError("Live quiz needs a start time in IST.");
      }

      if (isLive && !allDomains && !form.category_id) {
        return setError("Select a category or choose All Domains.");
      }

      const selectedCategory = domainCategories.find(
        (c) => String(c.id) === String(form.category_id),
      );

      const data = {
        ...form,
        domain_id: allDomains ? "all" : domainId,
        category_id: form.category_id || null,
        domain_name: allDomains
          ? "All Domains"
          : domains.find((d) => String(d.id) === String(domainId))?.name ||
            null,
        category_name: selectedCategory?.name || "Default / All Categories",
        is_live_quiz: Boolean(isLive),
        live_all_domains: Boolean(allDomains),
        live_end_at: null,
      };

      if (isEdit) {
        await updateQuiz(id, data);
      } else {
        await createQuiz(data);
      }

      navigate(isLive ? "/admin/live-quizzes" : "/admin/quizzes");
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <LoadingSpinner size="lg" className="py-20" />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto space-y-6 min-w-0">
        <div>
          <Link
            to={isLive ? "/admin/live-quizzes" : "/admin/quizzes"}
            className="text-sm text-slate-500"
          >
            ← Back
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h2 className="text-2xl sm:text-3xl font-bold">
              {isLive ? "Create Live Quiz" : isEdit ? "Edit Quiz" : "Create Quiz"}
            </h2>
            {isLive && (
              <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-700">
                🔴 LIVE QUIZ ONLY
              </span>
            )}
          </div>
        </div>

        {error && (
          <div className="rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <div className="card">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="label">Title *</label>
              <input
                className="input"
                {...register("title", { required: "Title is required" })}
              />
              {errors.title && (
                <p className="text-rose-500 text-xs mt-1">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div>
              <label className="label">Description</label>
              <textarea
                className="input"
                rows={4}
                {...register("description")}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="label">Domain *</label>
                <select
                  className="input"
                  value={domainId}
                  onChange={(e) => {
                    const value = e.target.value;
                    setDomainId(value);
                    setValue("category_id", "");
                    setValue("live_all_domains", value === "all");
                  }}
                >
                  <option value="">Select domain</option>
                  {isLive && <option value="all">🌐 All Domains</option>}
                  {domains.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-slate-500">
                  {domainId === "all"
                    ? "Visible to every student only in Live Quizzes."
                    : isLive
                      ? "Visible to this domain only in Live Quizzes."
                      : "Choose the quiz domain."}
                </p>
              </div>

              <div>
                <label className="label">
                  Category {allDomains ? "(not required)" : "*"}
                </label>
                <select
                  className="input"
                  {...register("category_id", {
                    required: !allDomains && isLive,
                  })}
                  disabled={!domainId || (!allDomains && !domainCategories.length)}
                >
                  <option value="">
                    {allDomains
                      ? "Default / All Categories"
                      : !domainId
                        ? "Select domain first"
                        : !domainCategories.length
                          ? "No categories in this domain"
                          : "Select category"}
                  </option>
                  {domainCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {isLive && (
              <label className="flex items-center gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4">
                <input
                  type="checkbox"
                  className="h-5 w-5"
                  checked={Boolean(allDomains)}
                  onChange={(e) => {
                    setValue("live_all_domains", e.target.checked);
                    setDomainId(
                      e.target.checked
                        ? "all"
                        : domains[0]?.id
                          ? String(domains[0].id)
                          : "",
                    );
                    setValue("category_id", "");
                  }}
                />
                <span>
                  <b className="text-indigo-900">🌐 All Domains</b>
                  <span className="block text-xs text-slate-500 mt-1">
                    No category is required. Every student sees this event only
                    in Live Quizzes.
                  </span>
                </span>
              </label>
            )}

            <div>
              <label className="label">Difficulty *</label>
              <select
                className="input"
                {...register("difficulty", { required: true })}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            {!isLive && (
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="label">Overall Duration (min) *</label>
                  <input
                    type="number"
                    min="1"
                    className="input"
                    {...register("duration", {
                      required: "Duration is required",
                      valueAsNumber: true,
                    })}
                  />
                </div>
                <div>
                  <label className="label">Passing Score (%) *</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    className="input"
                    {...register("passing_score", {
                      required: true,
                      valueAsNumber: true,
                    })}
                  />
                </div>
              </div>
            )}

            {!isLive && (
              <div>
                <label className="label">Max Attempts</label>
                <input
                  type="number"
                  min="1"
                  className="input"
                  {...register("max_attempts", { valueAsNumber: true })}
                />
              </div>
            )}

            {isLive && (
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="label">Live Start Time (IST) *</label>
                  <input
                    type="datetime-local"
                    className="input"
                    {...register("live_start_at", {
                      required: "Live start time is required",
                    })}
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    India Standard Time. The event starts automatically.
                  </p>
                </div>
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-bold text-amber-800">
                    ⏱ Per-question timing
                  </p>
                  <p className="mt-1 text-xs text-amber-700">
                    There is no overall quiz timer. Set the timer individually
                    for every live question.
                  </p>
                </div>
              </div>
            )}

            <div>
              <label className="label">Thumbnail URL</label>
              <input
                className="input"
                type="url"
                {...register("thumbnail_url")}
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Link
                to={isLive ? "/admin/live-quizzes" : "/admin/quizzes"}
                className="btn-secondary text-center"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={
                  isSubmitting ||
                  !domainId ||
                  (isLive && !allDomains && !categoryId)
                }
                className="btn-primary"
              >
                {isSubmitting
                  ? "Saving…"
                  : isLive
                    ? "Create Live Quiz"
                    : isEdit
                      ? "Update Quiz"
                      : "Create Quiz"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
