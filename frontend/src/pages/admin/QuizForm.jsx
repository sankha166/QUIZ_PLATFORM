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
    getCategories().then((r) => setCategories(r.data.categories));
    if (isEdit) {
      getQuizById(id)
        .then((r) => {
          const quiz = r.data.quiz;
          // Convert category_id to string for select element compatibility
          reset({ ...quiz, category_id: quiz.category_id ? String(quiz.category_id) : '' });
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [id]);

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
      <div className="max-w-2xl">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/admin/quizzes" className="text-gray-500 hover:text-gray-700 text-sm">← Back</Link>
          <h2 className="text-xl font-bold text-gray-900">{isEdit ? 'Edit Quiz' : 'Create Quiz'}</h2>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-4">{error}</div>}

        <div className="card">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">Title *</label>
              <input className="input" placeholder="e.g. JavaScript Fundamentals" {...register('title', { required: 'Title is required' })} />
              {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
            </div>

            <div>
              <label className="label">Description</label>
              <textarea className="input" rows={3} placeholder="Brief quiz description…" {...register('description')} />
            </div>

            <div className="grid grid-cols-2 gap-4">
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

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">Duration (min) *</label>
                <input type="number" min={1} className="input" {...register('duration', { required: 'Required', min: { value: 1, message: 'Min 1' }, valueAsNumber: true })} />
                {errors.duration && <p className="text-red-500 text-xs mt-1">{errors.duration.message}</p>}
              </div>
              <div>
                <label className="label">Passing Score (%) *</label>
                <input type="number" min={1} max={100} className="input" {...register('passing_score', { required: true, min: 1, max: 100, valueAsNumber: true })} />
              </div>
              <div>
                <label className="label">Max Attempts</label>
                <input type="number" min={1} className="input" {...register('max_attempts', { min: 1, valueAsNumber: true })} />
              </div>
            </div>

            <div>
              <label className="label">Thumbnail URL (optional)</label>
              <input className="input" type="url" placeholder="https://…" {...register('thumbnail_url')} />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={isSubmitting} className="btn-primary px-8">
                {isSubmitting ? 'Saving…' : isEdit ? 'Update Quiz' : 'Create Quiz'}
              </button>
              <Link to="/admin/quizzes" className="btn-secondary px-8">Cancel</Link>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
