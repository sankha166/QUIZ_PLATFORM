import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { getQuizById, createQuiz, updateQuiz, getCategories } from '../../api/quiz.api';
import AdminLayout from '../../components/admin/AdminLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { getErrorMessage } from '../../utils/helpers';

export default function QuizForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState('');

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { difficulty: 'medium', max_attempts: 1, passing_score: 60 }
  });

  useEffect(() => {
    getCategories().then((r) => setCategories(r.data.categories || [])).catch(console.error);
    if (isEdit) {
      getQuizById(id)
        .then((r) => {
          const quiz = r.data.quiz;
          reset({ ...quiz, category_id: quiz.category_id ? String(quiz.category_id) : '' });
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [id, isEdit, reset]);

  const onSubmit = async (data) => {
    setError('');
    try {
      if (isEdit) await updateQuiz(id, data);
      else await createQuiz(data);
      navigate('/admin/quizzes');
    } catch (err) { setError(getErrorMessage(err)); }
  };

  if (loading) return <AdminLayout><LoadingSpinner size="lg" className="py-20" /></AdminLayout>;

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link to="/admin/quizzes" className="text-sm text-slate-500 hover:text-slate-700">← Back</Link>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">{isEdit ? 'Edit Quiz' : 'Create Quiz'}</h2>
            <p className="text-sm text-slate-500 mt-1">Set up quiz details, difficulty, and scoring rules.</p>
          </div>
          <span className="rounded-3xl bg-slate-50 px-4 py-3 text-sm text-slate-700">{isEdit ? 'Editing quiz' : 'New quiz'}</span>
        </div>

        {error && <div className="rounded-3xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">{error}</div>}

        <div className="card p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="label">Title *</label>
              <input className="input" placeholder="JavaScript Fundamentals" {...register('title', { required: 'Title is required' })} />
              {errors.title && <p className="text-rose-500 text-xs mt-1">{errors.title.message}</p>}
            </div>

            <div>
              <label className="label">Description</label>
              <textarea className="input" rows={4} placeholder="Short quiz description…" {...register('description')} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="label">Category</label>
                <select className="input" {...register('category_id')}>
                  <option value="">Select category</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Difficulty *</label>
                <select className="input" {...register('difficulty', { required: true })}>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="label">Duration (min) *</label>
                <input type="number" min={1} className="input" {...register('duration', { required: 'Duration is required', min: { value: 1, message: 'Min 1 minute' }, valueAsNumber: true })} />
                {errors.duration && <p className="text-rose-500 text-xs mt-1">{errors.duration.message}</p>}
              </div>
              <div>
                <label className="label">Passing Score (%) *</label>
                <input type="number" min={1} max={100} className="input" {...register('passing_score', { required: 'Passing score is required', min: { value: 1, message: 'Min 1%' }, max: { value: 100, message: 'Max 100%' }, valueAsNumber: true })} />
                {errors.passing_score && <p className="text-rose-500 text-xs mt-1">{errors.passing_score.message}</p>}
              </div>
              <div>
                <label className="label">Max Attempts</label>
                <input type="number" min={1} className="input" {...register('max_attempts', { min: { value: 1, message: 'Min 1 attempt' }, valueAsNumber: true })} />
                {errors.max_attempts && <p className="text-rose-500 text-xs mt-1">{errors.max_attempts.message}</p>}
              </div>
            </div>

            <div>
              <label className="label">Thumbnail URL</label>
              <input className="input" type="url" placeholder="https://example.com/image.jpg" {...register('thumbnail_url')} />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Link to="/admin/quizzes" className="btn-secondary w-full sm:w-auto">Cancel</Link>
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
