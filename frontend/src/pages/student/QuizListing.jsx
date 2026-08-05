import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getQuizzes, getCategories } from '../../api/quiz.api';
import StudentLayout from '../../components/student/StudentLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import { useDebounce } from '../../hooks/useDebounce';
import { difficultyColor } from '../../utils/helpers';

function QuizCard({ quiz }) {
  return (
    <Link to={`/student/quizzes/${quiz.id}`} className="card hover:shadow-md transition-shadow cursor-pointer block">
      {quiz.thumbnail_url && (
        <img src={quiz.thumbnail_url} alt="" className="w-full h-36 object-cover rounded-lg mb-4" />
      )}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-gray-900 text-sm leading-tight">{quiz.title}</h3>
        <Badge className={difficultyColor(quiz.difficulty)}>{quiz.difficulty}</Badge>
      </div>
      {quiz.category_name && (
        <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{quiz.category_name}</span>
      )}
      <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
        <span>⏱ {quiz.duration} min</span>
        <span>❓ {quiz.question_count} questions</span>
        <span>🎯 Pass: {quiz.passing_score}%</span>
      </div>
      {quiz.description && <p className="text-xs text-gray-400 mt-2 line-clamp-2">{quiz.description}</p>}
    </Link>
  );
}

export default function QuizListing() {
  const [quizzes, setQuizzes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [sort, setSort] = useState('');
  const debouncedSearch = useDebounce(search);

  useEffect(() => { getCategories().then((r) => setCategories(r.data.categories)); }, []);

  useEffect(() => {
    setLoading(true);
    getQuizzes({ search: debouncedSearch, category, difficulty, sort })
      .then((r) => setQuizzes(r.data.quizzes))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [debouncedSearch, category, difficulty, sort]);

  return (
    <StudentLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Browse Quizzes</h1>
          <p className="text-gray-500 mt-1">Discover and take quizzes to test your knowledge.</p>
        </div>

        {/* Filters */}
        <div className="card flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-48">
            <label className="label text-xs">Search</label>
            <input className="input" placeholder="Search by title or category…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div>
            <label className="label text-xs">Category</label>
            <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">All categories</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label text-xs">Difficulty</label>
            <select className="input" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
              <option value="">Any</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          <div>
            <label className="label text-xs">Sort by</label>
            <select className="input" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="">Newest</option>
              <option value="popular">Most popular</option>
              <option value="oldest">Oldest</option>
            </select>
          </div>
          <button onClick={() => { setSearch(''); setCategory(''); setDifficulty(''); setSort(''); }} className="btn-secondary text-sm">Clear</button>
        </div>

        {/* Grid */}
        {loading ? (
          <LoadingSpinner size="lg" className="py-16" />
        ) : quizzes.length === 0 ? (
          <EmptyState icon="🔍" title="No quizzes found" message="Try adjusting your filters." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {quizzes.map((q) => <QuizCard key={q.id} quiz={q} />)}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
