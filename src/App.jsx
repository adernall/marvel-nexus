import { useEffect, useMemo, useState } from 'react'
import {
  Bookmark,
  CalendarDays,
  ChevronRight,
  Clapperboard,
  Database,
  FileText,
  Flame,
  Link2,
  LockKeyhole,
  MessageCircle,
  Plus,
  RotateCcw,
  Save,
  Search,
  Settings,
  Shield,
  Sparkles,
  Tag,
  Trash2,
  UserRound,
  UsersRound,
} from 'lucide-react'
import './App.css'
import { emptyDrafts, initialData } from './data'

const STORAGE_KEY = 'marvel-nexus-cms-v2'
const publicNav = ['Home', 'Explore', 'Timeline', 'Tags', 'Create']
const adminTabs = [
  ['dashboard', 'Dashboard'],
  ['movies', 'Movies'],
  ['characters', 'Characters'],
  ['actors', 'Actors'],
  ['posts', 'Posts'],
  ['leaks', 'Leaks'],
  ['facts', 'Facts'],
  ['tags', 'Tags'],
  ['users', 'Users'],
  ['reports', 'Reports'],
  ['settings', 'Settings'],
]

function readStoredData() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return initialData
    return { ...initialData, ...JSON.parse(stored) }
  } catch {
    return initialData
  }
}

function makeId(label, fallback = 'item') {
  const base = String(label || fallback)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `${base || fallback}-${Date.now().toString(36)}`
}

function asList(value) {
  if (Array.isArray(value)) return value
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function listText(value) {
  return Array.isArray(value) ? value.join(', ') : value || ''
}

function formatDate(date) {
  if (!date) return 'No date set'
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date))
}

function App() {
  const [data, setData] = useState(readStoredData)
  const [route, setRoute] = useState(() => window.location.hash.replace('#/', '') || 'home')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [tagFilter, setTagFilter] = useState('all')
  const [selected, setSelected] = useState({ movie: '', character: '', actor: '' })
  const [saved, setSaved] = useState(() => new Set(JSON.parse(localStorage.getItem('marvel-nexus-saved') || '[]')))

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    document.title = data.settings.seoTitle || data.settings.siteName || 'Nexus'
    document.querySelector('meta[name="description"]')?.setAttribute('content', data.settings.seoDescription || data.settings.tagline || '')
  }, [data])

  useEffect(() => {
    localStorage.setItem('marvel-nexus-saved', JSON.stringify([...saved]))
  }, [saved])

  useEffect(() => {
    const onHash = () => setRoute(window.location.hash.replace('#/', '') || 'home')
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const isAdmin = route === 'admin'
  const activeView = isAdmin ? 'admin' : route

  const api = useMemo(() => makeDataApi(data, setData), [data])

  const searchResults = useMemo(() => {
    const value = query.trim().toLowerCase()
    if (!value) return null
    const includes = (text) => String(text || '').toLowerCase().includes(value)
    return {
      Movies: data.movies.filter((item) => includes(item.title) || includes(item.description)),
      Characters: data.characters.filter((item) => includes(item.name) || includes(item.description)),
      Actors: data.actors.filter((item) => includes(item.name) || includes(item.bio)),
      Discussions: data.posts.filter((item) => includes(item.title) || includes(item.body)),
      Leaks: data.leaks.filter((item) => includes(item.title) || includes(item.description)),
    }
  }, [data, query])

  function navigate(nextRoute) {
    window.location.hash = `/${nextRoute}`
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' }))
  }

  function openEntity(type, id) {
    setSelected((current) => ({ ...current, [type]: id }))
    navigate(type)
  }

  function toggleSaved(id) {
    setSaved((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <main className={isAdmin ? 'app-shell admin-shell' : 'app-shell'}>
      <header className="topbar">
        <button className="brand" type="button" onClick={() => navigate('home')} aria-label="Open home">
          <span className="brand-mark">{(data.settings.siteName || 'N').slice(0, 1)}</span>
          <span>{data.settings.siteName || 'Nexus'}</span>
        </button>

        {!isAdmin && (
          <label className="search-box">
            <Search size={18} aria-hidden="true" />
            <input
              type="search"
              placeholder="Search movies, characters, actors, discussions"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
        )}

        <nav className="nav-list" aria-label="Primary navigation">
          {!isAdmin &&
            publicNav.map((item) => (
              <button className={activeView === item.toLowerCase() ? 'nav-item active' : 'nav-item'} type="button" key={item} onClick={() => navigate(item.toLowerCase())}>
                {item}
              </button>
            ))}
          <button className={isAdmin ? 'nav-item active' : 'nav-item admin-link'} type="button" onClick={() => navigate('admin')}>
            <LockKeyhole size={14} /> Admin
          </button>
          {isAdmin && (
            <button className="nav-item" type="button" onClick={() => navigate('home')}>
              Public Site
            </button>
          )}
        </nav>
      </header>

      {isAdmin ? (
        <AdminPanel data={data} api={api} navigate={navigate} />
      ) : searchResults ? (
        <SearchResults results={searchResults} openEntity={openEntity} data={data} />
      ) : (
        <>
          {activeView === 'home' && <Home data={data} openEntity={openEntity} toggleSaved={toggleSaved} saved={saved} navigate={navigate} />}
          {activeView === 'explore' && (
            <Explore
              data={data}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              tagFilter={tagFilter}
              setTagFilter={setTagFilter}
              openEntity={openEntity}
            />
          )}
          {activeView === 'movie' && <MoviePage data={data} movieId={selected.movie} openEntity={openEntity} toggleSaved={toggleSaved} saved={saved} />}
          {activeView === 'character' && <CharacterPage data={data} characterId={selected.character} openEntity={openEntity} />}
          {activeView === 'actor' && <ActorPage data={data} actorId={selected.actor} openEntity={openEntity} />}
          {activeView === 'timeline' && <Timeline data={data} openEntity={openEntity} />}
          {activeView === 'tags' && <TagsPage data={data} openEntity={openEntity} />}
          {activeView === 'create' && <CreatePost data={data} api={api} />}
        </>
      )}
    </main>
  )
}

function makeDataApi(data, setData) {
  return {
    save(collection, draft) {
      setData((current) => {
        const id = draft.id || makeId(draft.title || draft.name || draft.label || draft.username, collection.slice(0, -1))
        const normalized = normalizeRecord(collection, { ...draft, id })
        const exists = current[collection].some((item) => item.id === id)
        return {
          ...current,
          [collection]: exists ? current[collection].map((item) => (item.id === id ? normalized : item)) : [normalized, ...current[collection]],
        }
      })
    },
    remove(collection, id) {
      setData((current) => ({ ...current, [collection]: current[collection].filter((item) => item.id !== id) }))
    },
    updateSettings(settings) {
      setData((current) => ({ ...current, settings: { ...current.settings, ...settings } }))
    },
    resetEmpty() {
      setData(initialData)
    },
    data,
  }
}

function normalizeRecord(collection, record) {
  const listFields = {
    movies: ['tags', 'characters', 'actors', 'related'],
    characters: ['traits', 'tags', 'actorIds', 'movieIds'],
    actors: ['trivia', 'roles', 'movieIds'],
    posts: ['tags'],
    leaks: ['tags'],
  }
  const numberFields = ['timeline', 'upvotes', 'comments', 'priority']
  const booleanFields = ['featured', 'pinned', 'approved']
  const next = { ...record }
  ;(listFields[collection] || []).forEach((key) => {
    next[key] = asList(next[key])
  })
  numberFields.forEach((key) => {
    if (key in next) next[key] = Number(next[key] || 0)
  })
  booleanFields.forEach((key) => {
    if (key in next) next[key] = Boolean(next[key])
  })
  return next
}

function SectionHeader({ icon: Icon, title, action }) {
  return (
    <div className="section-header">
      <div className="section-title">
        <Icon size={18} aria-hidden="true" />
        <h2>{title}</h2>
      </div>
      {action}
    </div>
  )
}

function TagList({ tagIds = [], tags = [] }) {
  if (!tagIds.length) return null
  return (
    <div className="tag-list">
      {tagIds.map((tagId) => {
        const tagItem = tags.find((item) => item.id === tagId) || tags.find((item) => item.label === tagId)
        return (
          <span className={`tag tag-${tagItem?.tone || 'steel'}`} key={tagId}>
            {tagItem?.label || tagId}
          </span>
        )
      })}
    </div>
  )
}

function EmptyState({ title, text, action }) {
  return (
    <section className="empty-state reveal">
      <Database size={34} />
      <h2>{title}</h2>
      <p>{text}</p>
      {action}
    </section>
  )
}

function Home({ data, openEntity, toggleSaved, saved, navigate }) {
  const featured = data.movies.filter((movie) => movie.featured)
  const latestPosts = data.posts.slice(0, 4)
  const latestLeaks = data.leaks.slice(0, 3)

  if (!data.movies.length && !data.characters.length && !data.actors.length) {
    return (
      <EmptyState
        title="Your public site is empty."
        text="Open the admin panel, add movies, characters, actors, tags, facts, posts, and leaks. The public website will update from that data."
        action={<button className="primary-action" type="button" onClick={() => navigate('admin')}><Plus size={16} /> Open Admin</button>}
      />
    )
  }

  return (
    <div className="page-stack">
      <section className="hero-panel reveal">
        <div>
          <p className="small-label">Managed from admin</p>
          <h1>{data.settings.tagline || 'Build your MCU content hub from the admin panel.'}</h1>
          <p className="hero-copy">Every movie, character, actor, tag, discussion, leak, fact, and featured item on this site comes from your saved admin data.</p>
        </div>
        <div className="signal-grid">
          <Metric label="Movies" value={data.movies.length} />
          <Metric label="Characters" value={data.characters.length} />
          <Metric label="Actors" value={data.actors.length} />
          <Metric label="Posts" value={data.posts.length} />
        </div>
      </section>

      <section className="content-band reveal">
        <SectionHeader icon={Flame} title="Featured Movies" />
        {featured.length ? (
          <div className="movie-rail">
            {featured.map((movie) => (
              <article className="movie-card" key={movie.id}>
                <button className="save-button" type="button" onClick={() => toggleSaved(movie.id)} aria-label="Save movie">
                  <Bookmark size={16} fill={saved.has(movie.id) ? 'currentColor' : 'none'} />
                </button>
                <button className="card-link" type="button" onClick={() => openEntity('movie', movie.id)}>
                  <span className="phase">{movie.phase || movie.status}</span>
                  <h3>{movie.title}</h3>
                  <p>{movie.description || 'No overview added yet.'}</p>
                  <TagList tagIds={movie.tags} tags={data.tags} />
                </button>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty-note">No movies are featured yet. Toggle Featured inside Admin / Movies.</p>
        )}
      </section>

      <div className="split-grid">
        <section className="content-band reveal">
          <SectionHeader icon={MessageCircle} title="Trending Discussions" />
          <ThreadList threads={latestPosts} data={data} />
        </section>
        <section className="content-band reveal">
          <SectionHeader icon={Sparkles} title="Latest Leaks" />
          <LeakList leaks={latestLeaks} data={data} />
        </section>
      </div>
    </div>
  )
}

function Metric({ label, value }) {
  return (
    <div className="metric">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  )
}

function Explore({ data, statusFilter, setStatusFilter, tagFilter, setTagFilter, openEntity }) {
  const filteredMovies = data.movies.filter((movie) => {
    const statusMatch = statusFilter === 'all' || movie.status === statusFilter
    const tagMatch = tagFilter === 'all' || movie.tags?.includes(tagFilter)
    return statusMatch && tagMatch
  })

  return (
    <div className="page-stack">
      <section className="content-band reveal">
        <SectionHeader icon={Clapperboard} title="Movies" />
        <div className="filter-row">
          {['all', 'released', 'upcoming', 'rumored'].map((status) => (
            <button className={statusFilter === status ? 'filter active' : 'filter'} type="button" key={status} onClick={() => setStatusFilter(status)}>
              {status}
            </button>
          ))}
          <select value={tagFilter} onChange={(event) => setTagFilter(event.target.value)} aria-label="Filter by tag">
            <option value="all">All tags</option>
            {data.tags.map((tagItem) => <option value={tagItem.id} key={tagItem.id}>{tagItem.label}</option>)}
          </select>
        </div>
        <EntityGrid items={filteredMovies} empty="No movies match your filters." render={(movie) => (
          <EntityCard title={movie.title} subtitle={`${movie.phase || 'No phase'} / ${movie.status}`} text={movie.description} tagIds={movie.tags} tags={data.tags} onClick={() => openEntity('movie', movie.id)} />
        )} />
      </section>

      <div className="split-grid">
        <section className="content-band reveal">
          <SectionHeader icon={Shield} title="Characters" />
          <CompactList items={data.characters} label={(item) => item.name} text={(item) => item.description} onOpen={(item) => openEntity('character', item.id)} />
        </section>
        <section className="content-band reveal">
          <SectionHeader icon={UserRound} title="Actors" />
          <CompactList items={data.actors} label={(item) => item.name} text={(item) => item.bio} onOpen={(item) => openEntity('actor', item.id)} />
        </section>
      </div>
    </div>
  )
}

function EntityGrid({ items, render, empty }) {
  if (!items.length) return <p className="empty-note">{empty}</p>
  return <div className="entity-grid">{items.map((item) => <div key={item.id}>{render(item)}</div>)}</div>
}

function EntityCard({ title, subtitle, text, tagIds, tags, onClick }) {
  return (
    <button className="entity-card" type="button" onClick={onClick}>
      <span>{subtitle}</span>
      <h3>{title || 'Untitled'}</h3>
      <p>{text || 'No details added yet.'}</p>
      <TagList tagIds={tagIds} tags={tags} />
    </button>
  )
}

function CompactList({ items, label, text, onOpen }) {
  if (!items.length) return <p className="empty-note">Nothing added yet.</p>
  return (
    <div className="compact-list">
      {items.map((item) => (
        <button className="compact-row" type="button" key={item.id} onClick={() => onOpen(item)}>
          <span>{label(item)}</span>
          <small>{text(item) || 'No details added yet.'}</small>
        </button>
      ))}
    </div>
  )
}

function MoviePage({ data, movieId, openEntity, toggleSaved, saved }) {
  const movie = data.movies.find((item) => item.id === movieId) || data.movies[0]
  if (!movie) return <EmptyState title="No movie selected." text="Add a movie in admin or open one from Explore." />
  const movieCharacters = data.characters.filter((character) => movie.characters?.includes(character.id) || character.movieIds?.includes(movie.id))
  const movieActors = data.actors.filter((actor) => movie.actors?.includes(actor.id) || actor.movieIds?.includes(movie.id))
  const relatedMovies = data.movies.filter((item) => movie.related?.includes(item.id))
  const relatedPosts = data.posts.filter((post) => post.movieId === movie.id)
  const relatedLeaks = data.leaks.filter((leak) => leak.movieId === movie.id)
  const movieFacts = data.facts.filter((fact) => fact.entityType === 'movie' && fact.entityId === movie.id)

  return (
    <div className="page-stack">
      <section className="detail-hero reveal">
        <div>
          <div className="detail-meta">
            <span>{movie.phase || 'No phase'}</span>
            <span>{movie.status}</span>
            <span>{formatDate(movie.releaseDate)}</span>
          </div>
          <h1>{movie.title}</h1>
          <p>{movie.description || 'No overview added yet.'}</p>
          <TagList tagIds={movie.tags} tags={data.tags} />
        </div>
        <button className="primary-action" type="button" onClick={() => toggleSaved(movie.id)}>
          <Bookmark size={16} fill={saved.has(movie.id) ? 'currentColor' : 'none'} />
          {saved.has(movie.id) ? 'Saved' : 'Save'}
        </button>
      </section>
      <div className="three-grid">
        <InfoBlock title="Cast" icon={UsersRound}><LinkedRows items={movieActors} label={(item) => item.name} onOpen={(item) => openEntity('actor', item.id)} /></InfoBlock>
        <InfoBlock title="Characters" icon={Shield}><LinkedRows items={movieCharacters} label={(item) => item.name} onOpen={(item) => openEntity('character', item.id)} /></InfoBlock>
        <InfoBlock title="Connections" icon={Link2}><LinkedRows items={relatedMovies} label={(item) => item.title} onOpen={(item) => openEntity('movie', item.id)} /></InfoBlock>
      </div>
      <div className="split-grid">
        <section className="content-band reveal"><SectionHeader icon={MessageCircle} title="Discussions & Theories" /><ThreadList threads={relatedPosts} data={data} /></section>
        <section className="content-band reveal"><SectionHeader icon={Sparkles} title="Leaks & Facts" /><LeakList leaks={relatedLeaks} data={data} /><FactList facts={movieFacts} /></section>
      </div>
    </div>
  )
}

function CharacterPage({ data, characterId, openEntity }) {
  const character = data.characters.find((item) => item.id === characterId) || data.characters[0]
  if (!character) return <EmptyState title="No character selected." text="Add a character in admin or open one from Explore." />
  const appearances = data.movies.filter((movie) => movie.characters?.includes(character.id) || character.movieIds?.includes(movie.id))
  const linkedActors = data.actors.filter((actor) => character.actorIds?.includes(actor.id) || actor.roles?.includes(character.id))
  const characterFacts = data.facts.filter((fact) => fact.entityType === 'character' && fact.entityId === character.id)
  const relatedPosts = data.posts.filter((post) => post.characterId === character.id)

  return (
    <EntityDetail
      icon={Shield}
      title={character.name}
      subtitle={character.realName || 'Character'}
      description={character.description}
      tagIds={character.tags}
      data={data}
      facts={characterFacts}
      posts={relatedPosts}
      chips={character.traits}
      leftTitle="Appearances"
      leftItems={appearances}
      leftLabel={(movie) => movie.title}
      leftOpen={(movie) => openEntity('movie', movie.id)}
      rightTitle="Actors"
      rightItems={linkedActors}
      rightLabel={(actor) => actor.name}
      rightOpen={(actor) => openEntity('actor', actor.id)}
    />
  )
}

function ActorPage({ data, actorId, openEntity }) {
  const actor = data.actors.find((item) => item.id === actorId) || data.actors[0]
  if (!actor) return <EmptyState title="No actor selected." text="Add an actor in admin or open one from Explore." />
  const roleCharacters = data.characters.filter((character) => actor.roles?.includes(character.id) || character.actorIds?.includes(actor.id))
  const actorMovies = data.movies.filter((movie) => movie.actors?.includes(actor.id) || actor.movieIds?.includes(movie.id))
  const actorFacts = data.facts.filter((fact) => fact.entityType === 'actor' && fact.entityId === actor.id)
  const relatedPosts = data.posts.filter((post) => post.actorId === actor.id)

  return (
    <EntityDetail
      icon={UserRound}
      title={actor.name}
      subtitle="Actor"
      description={actor.bio}
      data={data}
      facts={[...actorFacts, ...(actor.trivia || []).map((text, index) => ({ id: `${actor.id}-trivia-${index}`, text }))]}
      posts={relatedPosts}
      chips={actor.trivia}
      leftTitle="Roles"
      leftItems={roleCharacters}
      leftLabel={(character) => character.name}
      leftOpen={(character) => openEntity('character', character.id)}
      rightTitle="Movies"
      rightItems={actorMovies}
      rightLabel={(movie) => movie.title}
      rightOpen={(movie) => openEntity('movie', movie.id)}
    />
  )
}

function EntityDetail({ icon: Icon, title, subtitle, description, tagIds, data, facts, posts, chips = [], leftTitle, leftItems, leftLabel, leftOpen, rightTitle, rightItems, rightLabel, rightOpen }) {
  return (
    <div className="page-stack">
      <section className="detail-hero reveal">
        <div>
          <div className="detail-meta"><Icon size={16} /><span>{subtitle}</span></div>
          <h1>{title}</h1>
          <p>{description || 'No details added yet.'}</p>
          <TagList tagIds={tagIds} tags={data.tags} />
        </div>
      </section>
      {!!chips?.length && <div className="trait-row">{chips.map((chip) => <span key={chip}>{chip}</span>)}</div>}
      <div className="split-grid">
        <InfoBlock title={leftTitle} icon={Clapperboard}><LinkedRows items={leftItems} label={leftLabel} onOpen={leftOpen} /></InfoBlock>
        <InfoBlock title={rightTitle} icon={UsersRound}><LinkedRows items={rightItems} label={rightLabel} onOpen={rightOpen} /></InfoBlock>
      </div>
      <div className="split-grid">
        <section className="content-band reveal"><SectionHeader icon={Sparkles} title="Facts" /><FactList facts={facts} /></section>
        <section className="content-band reveal"><SectionHeader icon={MessageCircle} title="Related Threads" /><ThreadList threads={posts} data={data} /></section>
      </div>
    </div>
  )
}

function InfoBlock({ title, icon: Icon, children }) {
  return (
    <section className="content-band reveal">
      <SectionHeader icon={Icon} title={title} />
      <div className="link-stack">{children}</div>
    </section>
  )
}

function LinkedRows({ items, label, onOpen }) {
  if (!items.length) return <p className="empty-note">No links added yet.</p>
  return items.map((item) => <button className="link-row" type="button" key={item.id} onClick={() => onOpen(item)}>{label(item)}</button>)
}

function Timeline({ data, openEntity }) {
  const ordered = [...data.movies].sort((a, b) => Number(a.timeline || 0) - Number(b.timeline || 0))
  return (
    <div className="page-stack">
      <section className="content-band reveal">
        <SectionHeader icon={CalendarDays} title="Timeline" />
        {ordered.length ? (
          <div className="timeline-list">
            {ordered.map((movie, index) => (
              <button className="timeline-row" type="button" key={movie.id} onClick={() => openEntity('movie', movie.id)}>
                <span>{movie.timeline || index + 1}</span>
                <div><h3>{movie.title}</h3><p>{movie.phase || 'No phase'} / {movie.status}</p></div>
                <ChevronRight size={18} />
              </button>
            ))}
          </div>
        ) : <p className="empty-note">Add movies with timeline positions in admin.</p>}
      </section>
    </div>
  )
}

function TagsPage({ data, openEntity }) {
  return (
    <div className="page-stack">
      <section className="content-band reveal">
        <SectionHeader icon={Tag} title="Tags & Topics" />
        <div className="topic-grid">
          {data.tags.map((tagItem) => {
            const relatedMovies = data.movies.filter((movie) => movie.tags?.includes(tagItem.id))
            const relatedPosts = data.posts.filter((post) => post.tags?.includes(tagItem.id))
            return (
              <article className="topic-card" key={tagItem.id}>
                <span className={`tag tag-${tagItem.tone}`}>{tagItem.label}</span>
                <h3>{relatedMovies.length} movies / {relatedPosts.length} threads</h3>
                <p>{tagItem.description}</p>
                <LinkedRows items={relatedMovies.slice(0, 4)} label={(movie) => movie.title} onOpen={(movie) => openEntity('movie', movie.id)} />
              </article>
            )
          })}
        </div>
        {!data.tags.length && <p className="empty-note">No tags added yet.</p>}
      </section>
    </div>
  )
}

function CreatePost({ data, api }) {
  const [draft, setDraft] = useState(emptyDrafts.posts)
  if (!data.settings.postingEnabled) return <EmptyState title="Posting is disabled." text="Enable posting from Admin / Settings." />

  function submit() {
    if (!draft.title.trim() || !draft.movieId) return
    api.save('posts', { ...draft, activeAt: 'Just now' })
    setDraft(emptyDrafts.posts)
  }

  return (
    <div className="page-stack">
      <section className="content-band form-panel reveal">
        <SectionHeader icon={MessageCircle} title="Create Post" />
        <PublicPostForm data={data} draft={draft} setDraft={setDraft} />
        <button className="primary-action" type="button" onClick={submit}><Plus size={16} /> Publish</button>
      </section>
    </div>
  )
}

function PublicPostForm({ data, draft, setDraft }) {
  return (
    <div className="post-form">
      <label>Type<select value={draft.type} onChange={(event) => setDraft({ ...draft, type: event.target.value })}><option value="discussion">Discussion</option><option value="theory">Theory</option><option value="leak">Leak</option></select></label>
      <label>Title<input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="Specific post title" /></label>
      <label>Description<textarea value={draft.body} onChange={(event) => setDraft({ ...draft, body: event.target.value })} rows="5" placeholder="Write the post" /></label>
      <label>Movie<select value={draft.movieId} onChange={(event) => setDraft({ ...draft, movieId: event.target.value })}><option value="">Select movie</option>{data.movies.map((movie) => <option value={movie.id} key={movie.id}>{movie.title}</option>)}</select></label>
      <label>Tags<input value={listText(draft.tags)} onChange={(event) => setDraft({ ...draft, tags: event.target.value })} placeholder="tag ids separated by commas" /></label>
      <label>Spoiler level<select value={draft.spoiler} onChange={(event) => setDraft({ ...draft, spoiler: event.target.value })}><option>none</option><option>low</option><option>medium</option><option>high</option></select></label>
    </div>
  )
}

function ThreadList({ threads, data }) {
  if (!threads.length) return <p className="empty-note">No discussions added yet.</p>
  return (
    <div className="thread-list">
      {threads.map((thread) => (
        <article className="thread-row" key={thread.id}>
          <div>
            <div className="thread-meta"><span>{thread.type}</span><span>{thread.spoiler} spoilers</span><span>{thread.activeAt || 'manual'}</span></div>
            <h3>{thread.title}</h3>
            <p>{thread.body}</p>
            <TagList tagIds={thread.tags} tags={data.tags} />
          </div>
          <div className="thread-stats"><span>{thread.upvotes || 0}</span><small>{thread.comments || 0} comments</small></div>
        </article>
      ))}
    </div>
  )
}

function LeakList({ leaks, data }) {
  if (!leaks.length) return <p className="empty-note">No leaks added yet.</p>
  return (
    <div className="thread-list">
      {leaks.map((leak) => (
        <article className="leak-row" key={leak.id}>
          <div>
            <div className="thread-meta"><span>{leak.status}</span><span>{leak.credibility} credibility</span><span>{leak.spoiler} spoilers</span></div>
            <h3>{leak.title}</h3>
            <p>{leak.description}</p>
            <TagList tagIds={leak.tags} tags={data.tags} />
          </div>
        </article>
      ))}
    </div>
  )
}

function FactList({ facts }) {
  if (!facts.length) return <p className="empty-note">No facts added yet.</p>
  return <ul className="fact-list">{facts.sort((a, b) => Number(a.priority || 0) - Number(b.priority || 0)).map((fact) => <li key={fact.id}>{fact.text}</li>)}</ul>
}

function SearchResults({ results, openEntity }) {
  const map = { Movies: 'movie', Characters: 'character', Actors: 'actor' }
  return (
    <div className="page-stack">
      <section className="content-band reveal">
        <SectionHeader icon={Search} title="Search Results" />
        <div className="search-groups">
          {Object.entries(results).map(([group, items]) => (
            <div className="search-group" key={group}>
              <h3>{group}</h3>
              {items.length === 0 ? <p className="empty-note">No matches</p> : items.map((item) => (
                <button className="compact-row" type="button" key={item.id} onClick={() => map[group] && openEntity(map[group], item.id)}>
                  <span>{item.title || item.name}</span>
                  <small>{item.description || item.bio || item.body}</small>
                </button>
              ))}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function AdminPanel({ data, api, navigate }) {
  const [tab, setTab] = useState('dashboard')

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div>
          <p className="small-label">Admin page</p>
          <h2>Control data</h2>
        </div>
        {adminTabs.map(([id, label]) => (
          <button className={tab === id ? 'admin-tab active' : 'admin-tab'} type="button" key={id} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </aside>
      <section className="admin-main">
        {tab === 'dashboard' && <AdminDashboard data={data} api={api} navigate={navigate} />}
        {tab === 'movies' && <CollectionManager collection="movies" title="Movies" data={data} api={api} />}
        {tab === 'characters' && <CollectionManager collection="characters" title="Characters" data={data} api={api} />}
        {tab === 'actors' && <CollectionManager collection="actors" title="Actors" data={data} api={api} />}
        {tab === 'posts' && <CollectionManager collection="posts" title="Posts" data={data} api={api} />}
        {tab === 'leaks' && <CollectionManager collection="leaks" title="Leaks" data={data} api={api} />}
        {tab === 'facts' && <CollectionManager collection="facts" title="Facts" data={data} api={api} />}
        {tab === 'tags' && <CollectionManager collection="tags" title="Tags" data={data} api={api} />}
        {tab === 'users' && <CollectionManager collection="users" title="Users" data={data} api={api} />}
        {tab === 'reports' && <CollectionManager collection="reports" title="Reports" data={data} api={api} />}
        {tab === 'settings' && <SettingsEditor data={data} api={api} />}
      </section>
    </div>
  )
}

function AdminDashboard({ data, api, navigate }) {
  return (
    <div className="page-stack admin-page">
      <section className="hero-panel reveal">
        <div>
          <p className="small-label">Productive admin</p>
          <h1>Fill the website from here.</h1>
          <p className="hero-copy">Use the editors to add detailed data. The public app uses this saved data immediately, including relationships, feeds, tags, facts, and page metadata.</p>
        </div>
        <div className="signal-grid">
          <Metric label="Movies" value={data.movies.length} />
          <Metric label="Characters" value={data.characters.length} />
          <Metric label="Actors" value={data.actors.length} />
          <Metric label="Reports" value={data.reports.filter((item) => item.status === 'open').length} />
        </div>
      </section>
      <section className="content-band">
        <SectionHeader icon={Settings} title="Quick Actions" />
        <div className="action-row">
          <button className="primary-action" type="button" onClick={() => navigate('home')}><ChevronRight size={16} /> View Public Site</button>
          <button className="quiet-action danger" type="button" onClick={api.resetEmpty}><RotateCcw size={16} /> Reset to Empty</button>
        </div>
      </section>
    </div>
  )
}

function CollectionManager({ collection, title, data, api }) {
  const [editing, setEditing] = useState(null)
  const items = data[collection]
  const draft = editing || emptyDrafts[collection]

  function update(key, value) {
    setEditing({ ...draft, [key]: value })
  }

  function save() {
    api.save(collection, draft)
    setEditing(null)
  }

  function startNew() {
    setEditing({ ...emptyDrafts[collection] })
  }

  return (
    <div className="admin-page">
      <SectionHeader
        icon={FileText}
        title={title}
        action={<button className="primary-action compact-action" type="button" onClick={startNew}><Plus size={16} /> Add</button>}
      />
      <div className="admin-editor-grid">
        <div className="admin-list">
          {items.length ? items.map((item) => (
            <article className="admin-list-row" key={item.id}>
              <button type="button" onClick={() => setEditing(item)}>
                <strong>{item.title || item.name || item.label || item.username || item.target || item.text || 'Untitled'}</strong>
                <span>{item.status || item.type || item.entityType || 'record'} / ID: {item.id}</span>
              </button>
              <button className="icon-danger" type="button" onClick={() => api.remove(collection, item.id)} aria-label="Delete">
                <Trash2 size={16} />
              </button>
            </article>
          )) : <p className="empty-note">No {title.toLowerCase()} yet. Click Add to create one.</p>}
        </div>
        <RecordForm collection={collection} draft={draft} data={data} update={update} save={save} disabled={!editing} />
      </div>
    </div>
  )
}

function RecordForm({ collection, draft, data, update, save, disabled }) {
  if (disabled) {
    return (
      <section className="content-band admin-form-placeholder">
        <FileText size={28} />
        <h3>Select an item or click Add.</h3>
        <p>The editor will appear here.</p>
      </section>
    )
  }

  const fields = getFields(collection, data)

  return (
    <section className="content-band admin-form">
      <div className="post-form">
        {fields.map((field) => (
          <Field key={field.key} field={field} value={draft[field.key]} update={(value) => update(field.key, value)} />
        ))}
        <button className="primary-action" type="button" onClick={save}><Save size={16} /> Save</button>
      </div>
    </section>
  )
}

function Field({ field, value, update }) {
  if (field.type === 'textarea') return <label>{field.label}<textarea rows="5" value={value || ''} onChange={(event) => update(event.target.value)} /></label>
  if (field.type === 'select') return <label>{field.label}<select value={value || ''} onChange={(event) => update(event.target.value)}>{field.options.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label>
  if (field.type === 'checkbox') return <label className="checkbox-label"><input type="checkbox" checked={Boolean(value)} onChange={(event) => update(event.target.checked)} />{field.label}</label>
  if (field.type === 'number') return <label>{field.label}<input type="number" value={value ?? ''} onChange={(event) => update(event.target.value)} /></label>
  if (field.type === 'date') return <label>{field.label}<input type="date" value={value || ''} onChange={(event) => update(event.target.value)} /></label>
  return <label>{field.label}<input value={listText(value)} onChange={(event) => update(field.list ? asList(event.target.value) : event.target.value)} placeholder={field.placeholder} /></label>
}

function options(items, labelKey = 'title') {
  return [{ value: '', label: 'None' }, ...items.map((item) => ({ value: item.id, label: item[labelKey] || item.name || item.label || item.id }))]
}

function getFields(collection, data) {
  const tagHint = 'comma separated tag IDs'
  const movieHint = 'comma separated movie IDs'
  const characterHint = 'comma separated character IDs'
  const actorHint = 'comma separated actor IDs'
  const map = {
    movies: [
      { key: 'title', label: 'Title' },
      { key: 'releaseDate', label: 'Release Date', type: 'date' },
      { key: 'phase', label: 'Phase' },
      { key: 'status', label: 'Status', type: 'select', options: [{ value: 'released', label: 'released' }, { value: 'upcoming', label: 'upcoming' }, { value: 'rumored', label: 'rumored' }] },
      { key: 'description', label: 'Overview', type: 'textarea' },
      { key: 'timeline', label: 'Timeline Position', type: 'number' },
      { key: 'featured', label: 'Feature on home', type: 'checkbox' },
      { key: 'tags', label: 'Tags', list: true, placeholder: tagHint },
      { key: 'characters', label: 'Character IDs', list: true, placeholder: characterHint },
      { key: 'actors', label: 'Actor IDs', list: true, placeholder: actorHint },
      { key: 'related', label: 'Related Movie IDs', list: true, placeholder: movieHint },
      { key: 'seoTitle', label: 'SEO Title' },
      { key: 'seoDescription', label: 'SEO Description', type: 'textarea' },
    ],
    characters: [
      { key: 'name', label: 'Character Name' },
      { key: 'realName', label: 'Real Name' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'traits', label: 'Traits', list: true, placeholder: 'comma separated traits' },
      { key: 'tags', label: 'Tags', list: true, placeholder: tagHint },
      { key: 'actorIds', label: 'Actor IDs', list: true, placeholder: actorHint },
      { key: 'movieIds', label: 'Movie IDs', list: true, placeholder: movieHint },
    ],
    actors: [
      { key: 'name', label: 'Actor Name' },
      { key: 'bio', label: 'Bio', type: 'textarea' },
      { key: 'trivia', label: 'Trivia', list: true, placeholder: 'comma separated facts' },
      { key: 'roles', label: 'Character IDs', list: true, placeholder: characterHint },
      { key: 'movieIds', label: 'Movie IDs', list: true, placeholder: movieHint },
    ],
    posts: [
      { key: 'type', label: 'Type', type: 'select', options: [{ value: 'discussion', label: 'discussion' }, { value: 'theory', label: 'theory' }, { value: 'leak', label: 'leak' }] },
      { key: 'title', label: 'Title' },
      { key: 'body', label: 'Content', type: 'textarea' },
      { key: 'movieId', label: 'Movie', type: 'select', options: options(data.movies) },
      { key: 'characterId', label: 'Character', type: 'select', options: options(data.characters, 'name') },
      { key: 'actorId', label: 'Actor', type: 'select', options: options(data.actors, 'name') },
      { key: 'tags', label: 'Tags', list: true, placeholder: tagHint },
      { key: 'spoiler', label: 'Spoiler', type: 'select', options: ['none', 'low', 'medium', 'high'].map((value) => ({ value, label: value })) },
      { key: 'upvotes', label: 'Upvotes', type: 'number' },
      { key: 'comments', label: 'Comments', type: 'number' },
      { key: 'featured', label: 'Feature thread', type: 'checkbox' },
      { key: 'pinned', label: 'Pin thread', type: 'checkbox' },
      { key: 'author', label: 'Author' },
    ],
    leaks: [
      { key: 'title', label: 'Title' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'movieId', label: 'Movie', type: 'select', options: options(data.movies) },
      { key: 'tags', label: 'Tags', list: true, placeholder: tagHint },
      { key: 'credibility', label: 'Credibility', type: 'select', options: ['Low', 'Medium', 'High'].map((value) => ({ value, label: value })) },
      { key: 'spoiler', label: 'Spoiler', type: 'select', options: ['none', 'low', 'medium', 'high'].map((value) => ({ value, label: value })) },
      { key: 'status', label: 'Status', type: 'select', options: ['unverified', 'speculative', 'approved', 'rejected'].map((value) => ({ value, label: value })) },
      { key: 'approved', label: 'Approved', type: 'checkbox' },
    ],
    facts: [
      { key: 'text', label: 'Fact Text', type: 'textarea' },
      { key: 'entityType', label: 'Entity Type', type: 'select', options: ['movie', 'character', 'actor'].map((value) => ({ value, label: value })) },
      { key: 'entityId', label: 'Entity ID' },
      { key: 'priority', label: 'Priority', type: 'number' },
    ],
    tags: [
      { key: 'label', label: 'Label' },
      { key: 'tone', label: 'Tone', type: 'select', options: ['red', 'gold', 'blue', 'steel'].map((value) => ({ value, label: value })) },
      { key: 'description', label: 'Description', type: 'textarea' },
    ],
    users: [
      { key: 'username', label: 'Username' },
      { key: 'status', label: 'Status', type: 'select', options: ['active', 'restricted', 'banned'].map((value) => ({ value, label: value })) },
      { key: 'notes', label: 'Notes', type: 'textarea' },
    ],
    reports: [
      { key: 'target', label: 'Reported Content' },
      { key: 'reason', label: 'Reason', type: 'textarea' },
      { key: 'status', label: 'Status', type: 'select', options: ['open', 'ignored', 'removed', 'actioned'].map((value) => ({ value, label: value })) },
    ],
  }
  return map[collection] || []
}

function SettingsEditor({ data, api }) {
  const [draft, setDraft] = useState(data.settings)
  return (
    <div className="admin-page">
      <SectionHeader icon={Settings} title="Global Settings & SEO" />
      <section className="content-band admin-form">
        <div className="post-form">
          <label>Site Name<input value={draft.siteName} onChange={(event) => setDraft({ ...draft, siteName: event.target.value })} /></label>
          <label>Public Tagline<textarea rows="4" value={draft.tagline} onChange={(event) => setDraft({ ...draft, tagline: event.target.value })} /></label>
          <label className="checkbox-label"><input type="checkbox" checked={draft.postingEnabled} onChange={(event) => setDraft({ ...draft, postingEnabled: event.target.checked })} />Posting enabled</label>
          <label>Spoiler Rules<textarea rows="4" value={draft.spoilerRules} onChange={(event) => setDraft({ ...draft, spoilerRules: event.target.value })} /></label>
          <label>Default SEO Title<input value={draft.seoTitle} onChange={(event) => setDraft({ ...draft, seoTitle: event.target.value })} /></label>
          <label>Default SEO Description<textarea rows="4" value={draft.seoDescription} onChange={(event) => setDraft({ ...draft, seoDescription: event.target.value })} /></label>
          <button className="primary-action" type="button" onClick={() => api.updateSettings(draft)}><Save size={16} /> Save Settings</button>
        </div>
      </section>
    </div>
  )
}

export default App
