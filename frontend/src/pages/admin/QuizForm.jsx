import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { getQuizById, createQuiz, updateQuiz, getCategories } from '../../api/quiz.api';
import AdminLayout from '../../components/admin/AdminLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { getErrorMessage } from '../../utils/helpers';

const DOMAIN_STORAGE_KEY = 'quiz_platform_admin_domains_v1';
const CATEGORY_DOMAIN_KEY = 'quiz_platform_category_domains_v1';

const ENGINEERING = { id: 'engineering', name: 'Engineering' };

function getDomains() {
  try {
    const saved = JSON.parse(localStorage.getItem(DOMAIN_STORAGE_KEY) || '[]');
    if (!Array.isArray(saved)) return [ENGINEERING];
    return saved.some((d) => d.id === 'engineering') ? saved : [ENGINEERING, ...saved];
  } catch {
    return [ENGINEERING];
  }
}

function getCategoryMap() {
  try {
    return JSON.parse(localStorage.getItem(CATEGORY_DOMAIN_KEY) || '{}');
  } catch {
    return {};
  }
}

export default function QuizForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [domains, setDomains] = useState(getDomains);
  const [domainId, setDomainId] = useState('engineering');
  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      difficulty: 'medium',
      max_attempts: 1,
      passing_score: 60,
    },
  });

  const categoryId = watch('category_id');

  useEffect(() => {
    Promise.all([getCategories(), isEdit ? getQuizById(id) : Promise.resolve(null)])
      .then(([categoryResponse, quizResponse]) => {
        const categoryMap = getCategoryMap();
        const incoming = categoryResponse.data.categories || [];

        const normalized = incoming.map((c) => ({
          ...c,
          domain_id: c.domain_id || categoryMap[String(c.id)] || 'engineering',
          domain_name:
            c.domain_name ||
            getDomains().find(
              (d) => d.id === (c.domain_id || categoryMap[String(c.id)] || 'engineering')
            )?.name ||
            'Engineering',
        }));

        setCategories(normalized);
        setDomains(getDomains());

        if (quizResponse?.data?.quiz) {
          const quiz = quizResponse.data.quiz;
          const selectedCategory = normalized.find(
            (c) => String(c.id) === String(quiz.category_id)
          );

          setDomainId(
            quiz.domain_id ||
            selectedCategory?.domain_id ||
            'engineering'
          );

          reset({
            ...quiz,
            category_id: quiz.category_id ? String(quiz.category_id) : '',
          });
        }
      })
      .catch((err) => {
        console.error(err);
        setError(getErrorMessage(err));
      })
      .finally(() => setLoading(false));
  }, [id, isEdit, reset]);

  const domainCategories = categories.filter(
    (c) => String(c.domain_id) === String(domainId)
  );

  useEffect(() => {
    if (!categoryId) return;
    const category = categories.find((c) => String(c.id) === String(categoryId));
    if (category && String(category.domain_id) !== String(domainId)) {
      setDomainId(category.domain_id);
    }
  }, [categoryId, categories, domainId]);

  const onDomainChange = (value) => {
    setDomainId(value);
    setValue('category_id', '');
  };

  const onSubmit = async (formData) => {
    setError('');

    try {
      const selectedCategory = categories.find(
        (c) => String(c.id) === String(formData.category_id)
      );

      const data = {
        ...formData,
        domain_id: domainId,
        domain_name:
          domains.find((d) => String(d.id) === String(domainId))?.name || 'Engineering',
        category_id: formData.category_id || null,
      };

      if (selectedCategory) {
        data.category_name = selectedCategory.name;
      }

      if (isEdit) await updateQuiz(id, data);
      else await createQuiz(data);

      navigate('/admin/quizzes');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  if (loading) return <AdminLayout><LoadingSpinner size="lg" className="py-20" /></AdminLayout>;

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto space-y-6 min-w-0">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <Link to="/admin/quizzes" className="text-sm text-slate-500 hover:text-slate-700">← Back</Link>
            <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">
              {isEdit ? 'Edit Quiz' : 'Create Quiz'}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Select the domain first, then choose a category inside that domain.
            </p>
          </div>
          <span className="self-start rounded-3xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
            {isEdit ? 'Editing quiz' : 'New quiz'}
          </span>
        </div>

        {error && (
          <div className="rounded-3xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <div className="card p-4 sm:p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="label">Title *</label>
              <input
                className="input w-full"
                placeholder="JavaScript Fundamentals"
                {...register('title', { required: 'Title is required' })}
              />
              {errors.title && <p className="text-rose-500 text-xs mt-1">{errors.title.message}</p>}
            </div>

            <div>
              <label className="label">Description</label>
              <textarea
                className="input w-full"
                rows={4}
                placeholder="Short quiz description…"
                {...register('description')}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="label">Domain *</label>
                <select
                  className="input w-full"
                  value={domainId}
                  onChange={(e) => onDomainChange(e.target.value)}
                >
                  {domains.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Category *</label>
                <select
                  className="input w-full"
                  {...register('category_id', { required: 'Category is required' })}
                >
                  <option value="">Select category</option>
                  {domainCategories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {errors.category_id && (
                  <p className="text-rose-500 text-xs mt-1">{errors.category_id.message}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="label">Difficulty *</label>
                <select className="input w-full" {...register('difficulty', { required: true })}>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <div>
                <label className="label">Duration (min) *</label>
                <input
                  type="number"
                  min={1}
                  className="input w-full"
                  {...register('duration', {
                    required: 'Duration is required',
                    min: { value: 1, message: 'Min 1 minute' },
                    valueAsNumber: true,
                  })}
                />
                {errors.duration && <p className="text-rose-500 text-xs mt-1">{errors.duration.message}</p>}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="label">Passing Score (%) *</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  className="input w-full"
                  {...register('passing_score', {
                    required: 'Passing score is required',
                    min: { value: 1, message: 'Min 1%' },
                    max: { value: 100, message: 'Max 100%' },
                    valueAsNumber: true,
                  })}
                />
                {errors.passing_score && <p className="text-rose-500 text-xs mt-1">{errors.passing_score.message}</p>}
              </div>

              <div>
                <label className="label">Max Attempts</label>
                <input
                  type="number"
                  min={1}
                  className="input w-full"
                  {...register('max_attempts', {
                    min: { value: 1, message: 'Min 1 attempt' },
                    valueAsNumber: true,
                  })}
                />
                {errors.max_attempts && <p className="text-rose-500 text-xs mt-1">{errors.max_attempts.message}</p>}
              </div>
            </div>

            <div>
              <label className="label">Thumbnail URL</label>
              <input
                className="input w-full"
                type="url"
                placeholder="https://example.com/image.jpg"
                {...register('thumbnail_url')}
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Link to="/admin/quizzes" className="btn-secondary w-full sm:w-auto text-center">
                Cancel
              </Link>
              <button type="submit" disabled={isSubmitting} className="btn-primary w-full sm:w-auto px-8">
                {isSubmitting ? 'Saving…' : isEdit ? 'Update Quiz' : 'Create Quiz'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}