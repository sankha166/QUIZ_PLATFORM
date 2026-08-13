import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getQuizzes, getCategories } from '../../api/quiz.api';
import { getFavorites, addFavorite, removeFavorite } from '../../api/favorites.api';
import StudentLayout from '../../components/student/StudentLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import { useDebounce } from '../../hooks/useDebounce';
import { difficultyColor } from '../../utils/helpers';
import { useAuth } from '../../hooks/useAuth';

function getShareUrl(quiz) { return `${window.location.origin}/student/quizzes/${quiz.id}`; }
function getShareText(quiz) {
  const description = quiz.description?.trim();
  return `🧠 Quizora Quiz\n\n📚 ${quiz.title}\n${description ? `\n${description.slice(0, 220)}${description.length > 220 ? '…' : ''}\n` : '\n'}\n⏱ ${quiz.duration || 0} min  •  ❓ ${quiz.question_count || 0} questions\n👥 ${quiz.attempt_count || 0} students attempted\n\nThink you can beat the score? Try it here:`;
}
async function shareQuiz(quiz) {
  const url = getShareUrl(quiz);
  const text = getShareText(quiz);
  try {
    if (navigator.share) {
      await navigator.share({ title: `🧠 ${quiz.title} | Quizora`, text, url });
      return;
    }
    await navigator.clipboard?.writeText(`${text}\n${url}`);
    window.dispatchEvent(new CustomEvent('quiz-share-copied'));
  } catch (error) {
    if (error?.name !== 'AbortError') console.error('Quiz sharing failed:', error);
  }
}
function QuizCard({ quiz, favorite, onFavorite }) { return <div className="card relative hover:-translate-y-1 hover:shadow-lg transition-all duration-200"><div className="absolute right-4 top-4 z-10 flex gap-2"><button type="button" onClick={()=>onFavorite(quiz.id)} className={`h-9 w-9 rounded-full border shadow-sm backdrop-blur ${favorite?'bg-rose-50 text-rose-500 border-rose-200':'bg-white/95 text-slate-400 border-slate-200 hover:text-rose-500'}`} title={favorite?'Remove favorite':'Add favorite'}>{favorite?'♥':'♡'}</button><button type="button" onClick={()=>shareQuiz(quiz)} className="h-9 w-9 rounded-full border border-slate-200 bg-white/95 text-slate-500 shadow-sm hover:text-indigo-600" title="Share quiz">↗</button></div>{quiz.thumbnail_url&&<Link to={`/student/quizzes/${quiz.id}`}><img src={quiz.thumbnail_url} alt={quiz.title} className="w-full h-36 object-cover rounded-lg mb-4" /></Link>}<Link to={`/student/quizzes/${quiz.id}`}><div className="flex items-start justify-between gap-2 mb-2 pr-20"><h3 className="font-semibold text-gray-900 text-sm leading-tight">{quiz.title}</h3><Badge className={difficultyColor(quiz.difficulty)}>{quiz.difficulty}</Badge></div>{quiz.category_name&&<span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{quiz.category_name}</span>}<div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-gray-500"><span>⏱ {quiz.duration} min</span><span>❓ {quiz.question_count} questions</span><span>🎯 Pass: {quiz.passing_score}%</span></div><div className="mt-3 inline-flex items-center rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">👥 {quiz.attempt_count||0} students attempted</div>{quiz.description&&<p className="text-xs text-gray-400 mt-2 line-clamp-2">{quiz.description}</p>}</Link></div> }
export default function QuizListing(){const{user}=useAuth();const[quizzes,setQuizzes]=useState([]),[categories,setCategories]=useState([]),[favorites,setFavorites]=useState([]),[loading,setLoading]=useState(true),[search,setSearch]=useState(''),[category,setCategory]=useState(''),[difficulty,setDifficulty]=useState(''),[sort,setSort]=useState('');const debouncedSearch=useDebounce(search);const preferredDomainId=user?.preferred_domain_id?String(user.preferred_domain_id):'';
const loadFavorites=()=>getFavorites().then(r=>setFavorites((r.data.quizzes||[]).map(q=>String(q.id))));
useEffect(()=>{loadFavorites().catch(console.error);const onFavoriteChanged=()=>loadFavorites().catch(()=>{});window.addEventListener('favorites-changed',onFavoriteChanged);return()=>window.removeEventListener('favorites-changed',onFavoriteChanged)},[]);
useEffect(()=>{const loadCategories=()=>getCategories(preferredDomainId?{domain_id:preferredDomainId}:{}).then(r=>setCategories(r.data.categories||[])).catch(console.error);loadCategories();const onDomainChanged=()=>{setCategory('');loadCategories()};window.addEventListener('student-domain-changed',onDomainChanged);return()=>window.removeEventListener('student-domain-changed',onDomainChanged)},[preferredDomainId]);
useEffect(()=>{setLoading(true);getQuizzes({search:debouncedSearch,category,difficulty,sort,...(preferredDomainId?{domain_id:preferredDomainId}:{})}).then(r=>setQuizzes(r.data.quizzes||[])).catch(console.error).finally(()=>setLoading(false))},[debouncedSearch,category,difficulty,sort,preferredDomainId]);
const toggleFavorite=async id=>{const s=String(id);try{if(favorites.includes(s)){await removeFavorite(id);setFavorites(f=>f.filter(x=>x!==s))}else{await addFavorite(id);setFavorites(f=>f.includes(s)?f:[...f,s])}window.dispatchEvent(new CustomEvent('favorites-changed',{detail:{quizId:s}}));}catch(e){console.error(e);await loadFavorites().catch(()=>{})}};
return <StudentLayout><div className="space-y-6"><div><h1 className="text-2xl font-bold text-gray-900">Browse Quizzes</h1><p className="text-gray-500 mt-1">{preferredDomainId?'Showing quizzes and categories from your selected learning domain.':'Discover and take quizzes to test your knowledge.'}</p></div><div className="card flex flex-wrap gap-3 items-end"><div className="flex-1 min-w-48"><label className="label text-xs">Search</label><input className="input" placeholder="Search by title or category…" value={search} onChange={e=>setSearch(e.target.value)}/></div><div><label className="label text-xs">Category</label><select className="input" value={category} onChange={e=>setCategory(e.target.value)}><option value="">All categories</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div><div><label className="label text-xs">Difficulty</label><select className="input" value={difficulty} onChange={e=>setDifficulty(e.target.value)}><option value="">Any</option><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></div><div><label className="label text-xs">Sort by</label><select className="input" value={sort} onChange={e=>setSort(e.target.value)}><option value="">Newest</option><option value="popular">Most popular</option><option value="oldest">Oldest</option></select></div><button onClick={()=>{setSearch('');setCategory('');setDifficulty('');setSort('')}} className="btn-secondary text-sm">Clear</button></div>{loading?<LoadingSpinner size="lg" className="py-16"/>:quizzes.length===0?<EmptyState icon="🔍" title="No quizzes found" message={preferredDomainId?'There are no quizzes available in your selected domain yet.':'Try adjusting your filters.'}/>:<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{quizzes.map(q=><QuizCard key={q.id} quiz={q} favorite={favorites.includes(String(q.id))} onFavorite={toggleFavorite}/>)}</div>}</div></StudentLayout>}
