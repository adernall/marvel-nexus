import { useMemo, useState } from 'react'
import {
  Bookmark,
  CalendarDays,
  ChevronRight,
  CircleGauge,
  Clapperboard,
  Flame,
  Link2,
  MessageCircle,
  PanelTop,
  Search,
  Shield,
  Sparkles,
  Tag,
  UserRound,
  UsersRound,
} from 'lucide-react'
import './App.css'
import { actors, characters, facts, leaks, movies, posts, reports, tags, users } from './data'

const navItems = ['Home', 'Explore', 'Timeline', 'Tags', 'Create', 'Profile', 'Admin']

function getTag(tagId) {
  return tags.find((tagItem) => tagItem.id === tagId)
}

function formatDate(date) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date))
}

function App() {
  const [activeView, setActiveView] = useState('Home')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [tagFilter, setTagFilter] = useState('all')
  const [selectedMovieId, setSelectedMovieId] = useState('avengers-endgame')
  const [selectedCharacterId, setSelectedCharacterId] = useState('iron-man')
  const [selectedActorId, setSelectedActorId] = useState('robert-downey-jr')
  const [saved, setSaved] = useState(new Set(['avengers-endgame', 'p2', 'l1']))
  const [postType, setPostType] = useState('Discussion')

  const selectedMovie = movies.find((movie) => movie.id === selectedMovieId) ?? movies[0]
  const selectedCharacter = characters.find((character) => character.id === selectedCharacterId) ?? characters[0]
  const selectedActor = actors.find((actor) => actor.id === selectedActorId) ?? actors[0]

  const searchResults = useMemo(() => {
    const value = query.trim().toLowerCase()
    if (!value) return null

    const byText = (text) => text.toLowerCase().includes(value)
    return {
      Movies: movies.filter((movie) => byText(movie.title) || byText(movie.description)),
      Characters: characters.filter((character) => byText(character.name) || byText(character.description)),
      Actors: actors.filter((actor) => byText(actor.name) || byText(actor.bio)),
      Discussions: posts.filter((post) => byText(post.title) || byText(post.body)),
    }
  }, [query])

  function navigate(view) {
    setActiveView(view)
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' }))
  }

  function openMovie(movieId) {
    setSelectedMovieId(movieId)
    navigate('Movie')
  }

  function openCharacter(characterId) {
    setSelectedCharacterId(characterId)
    navigate('Character')
  }

  function openActor(actorId) {
    setSelectedActorId(actorId)
    navigate('Actor')
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
    <main className="app-shell">
      <header className="topbar">
        <button className="brand" type="button" onClick={() => navigate('Home')} aria-label="Open home">
          <span className="brand-mark">N</span>
          <span>Nexus</span>
        </button>

        <label className="search-box">
          <Search size={18} aria-hidden="true" />
          <input
            type="search"
            placeholder="Search movies, characters, actors, discussions"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>

        <nav className="nav-list" aria-label="Primary navigation">
          {navItems.map((item) => (
            <button
              className={activeView === item ? 'nav-item active' : 'nav-item'}
              type="button"
              key={item}
              onClick={() => navigate(item)}
            >
              {item}
            </button>
          ))}
        </nav>
      </header>

      {searchResults ? (
        <SearchResults results={searchResults} openMovie={openMovie} openCharacter={openCharacter} openActor={openActor} />
      ) : (
        <>
          {activeView === 'Home' && <Home openMovie={openMovie} toggleSaved={toggleSaved} saved={saved} />}
          {activeView === 'Explore' && (
            <Explore
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              tagFilter={tagFilter}
              setTagFilter={setTagFilter}
              openMovie={openMovie}
              openCharacter={openCharacter}
              openActor={openActor}
            />
          )}
          {activeView === 'Movie' && (
            <MoviePage movie={selectedMovie} openMovie={openMovie} openCharacter={openCharacter} openActor={openActor} toggleSaved={toggleSaved} saved={saved} />
          )}
          {activeView === 'Character' && <CharacterPage character={selectedCharacter} openMovie={openMovie} openActor={openActor} />}
          {activeView === 'Actor' && <ActorPage actor={selectedActor} openMovie={openMovie} openCharacter={openCharacter} />}
          {activeView === 'Timeline' && <Timeline openMovie={openMovie} openCharacter={openCharacter} openActor={openActor} />}
          {activeView === 'Tags' && <TagsPage openMovie={openMovie} />}
          {activeView === 'Create' && <CreatePost postType={postType} setPostType={setPostType} />}
          {activeView === 'Profile' && <Profile saved={saved} toggleSaved={toggleSaved} openMovie={openMovie} />}
          {activeView === 'Admin' && <AdminPanel />}
        </>
      )}
    </main>
  )
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

function TagList({ tagIds }) {
  return (
    <div className="tag-list">
      {tagIds.map((tagId) => {
        const tagItem = getTag(tagId)
        return (
          <span className={`tag tag-${tagItem?.tone ?? 'steel'}`} key={tagId}>
            {tagItem?.label ?? tagId}
          </span>
        )
      })}
    </div>
  )
}

function Home({ openMovie, toggleSaved, saved }) {
  const featured = movies.filter((movie) => movie.featured)
  const trending = posts.filter((post) => post.featured)

  return (
    <div className="page-stack">
      <section className="hero-panel reveal">
        <div>
          <p className="small-label">MCU relationship platform</p>
          <h1>Movies, characters, actors, theories, and leaks in one clean map.</h1>
          <p className="hero-copy">Start with curated seed content, then let community threads connect every page without turning the platform into a noisy wiki.</p>
        </div>
        <div className="signal-grid" aria-label="Platform overview">
          <Metric label="Seed movies" value="10" />
          <Metric label="Linked characters" value="14" />
          <Metric label="Open reports" value="2" />
          <Metric label="Saved items" value="3" />
        </div>
      </section>

      <section className="content-band reveal">
        <SectionHeader icon={Flame} title="Featured Movies" />
        <div className="movie-rail">
          {featured.map((movie) => (
            <article className="movie-card" key={movie.id}>
              <button className="save-button" type="button" onClick={() => toggleSaved(movie.id)} aria-label="Save movie">
                <Bookmark size={16} fill={saved.has(movie.id) ? 'currentColor' : 'none'} />
              </button>
              <button className="card-link" type="button" onClick={() => openMovie(movie.id)}>
                <span className="phase">{movie.phase}</span>
                <h3>{movie.title}</h3>
                <p>{movie.description}</p>
                <TagList tagIds={movie.tags.slice(0, 2)} />
              </button>
            </article>
          ))}
        </div>
      </section>

      <div className="split-grid">
        <section className="content-band reveal">
          <SectionHeader icon={MessageCircle} title="Trending Discussions" />
          <ThreadList threads={trending} />
        </section>
        <section className="content-band reveal">
          <SectionHeader icon={Sparkles} title="Latest Leaks" />
          <LeakList />
        </section>
      </div>

      <section className="content-band reveal">
        <SectionHeader icon={PanelTop} title="Mixed Feed" />
        <div className="feed-list">
          {[...posts, ...leaks].map((item) => (
            <article className="feed-row" key={item.id}>
              <span className="feed-type">{item.type ?? 'leak'}</span>
              <div>
                <h3>{item.title}</h3>
                <p>{item.body ?? item.description}</p>
              </div>
              <ChevronRight size={18} aria-hidden="true" />
            </article>
          ))}
        </div>
      </section>
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

function Explore({ statusFilter, setStatusFilter, tagFilter, setTagFilter, openMovie, openCharacter, openActor }) {
  const filteredMovies = movies.filter((movie) => {
    const statusMatch = statusFilter === 'all' || movie.status === statusFilter
    const tagMatch = tagFilter === 'all' || movie.tags.includes(tagFilter)
    return statusMatch && tagMatch
  })

  return (
    <div className="page-stack">
      <section className="content-band reveal">
        <SectionHeader icon={CircleGauge} title="Explore" />
        <div className="filter-row">
          {['all', 'released', 'upcoming', 'rumored'].map((status) => (
            <button className={statusFilter === status ? 'filter active' : 'filter'} type="button" key={status} onClick={() => setStatusFilter(status)}>
              {status}
            </button>
          ))}
          <select value={tagFilter} onChange={(event) => setTagFilter(event.target.value)} aria-label="Filter by tag">
            <option value="all">All tags</option>
            {tags.map((tagItem) => (
              <option value={tagItem.id} key={tagItem.id}>{tagItem.label}</option>
            ))}
          </select>
        </div>
        <div className="entity-grid">
          {filteredMovies.map((movie) => (
            <EntityCard key={movie.id} title={movie.title} subtitle={`${movie.phase} / ${movie.status}`} text={movie.description} tagIds={movie.tags} onClick={() => openMovie(movie.id)} />
          ))}
        </div>
      </section>

      <div className="split-grid">
        <EntityCollection title="Characters" icon={UsersRound} items={characters} getTitle={(item) => item.name} getText={(item) => item.description} onOpen={(item) => openCharacter(item.id)} />
        <EntityCollection title="Actors" icon={UserRound} items={actors} getTitle={(item) => item.name} getText={(item) => item.bio} onOpen={(item) => openActor(item.id)} />
      </div>
    </div>
  )
}

function EntityCollection({ title, icon, items, getTitle, getText, onOpen }) {
  return (
    <section className="content-band reveal">
      <SectionHeader icon={icon} title={title} />
      <div className="compact-list">
        {items.slice(0, 8).map((item) => (
          <button className="compact-row" type="button" key={item.id} onClick={() => onOpen(item)}>
            <span>{getTitle(item)}</span>
            <small>{getText(item)}</small>
          </button>
        ))}
      </div>
    </section>
  )
}

function EntityCard({ title, subtitle, text, tagIds, onClick }) {
  return (
    <button className="entity-card" type="button" onClick={onClick}>
      <span>{subtitle}</span>
      <h3>{title}</h3>
      <p>{text}</p>
      {tagIds && <TagList tagIds={tagIds.slice(0, 3)} />}
    </button>
  )
}

function MoviePage({ movie, openMovie, openCharacter, openActor, toggleSaved, saved }) {
  const movieCharacters = characters.filter((character) => movie.characters.includes(character.id))
  const movieActors = actors.filter((actor) => movie.actors.includes(actor.id))
  const relatedPosts = posts.filter((post) => post.movieId === movie.id)
  const relatedLeaks = leaks.filter((leak) => leak.movieId === movie.id)
  const movieFacts = facts.filter((fact) => fact.entityType === 'movie' && fact.entityId === movie.id)

  return (
    <div className="page-stack">
      <section className="detail-hero reveal">
        <div>
          <div className="detail-meta">
            <span>{movie.phase}</span>
            <span>{movie.status}</span>
            <span>{formatDate(movie.releaseDate)}</span>
          </div>
          <h1>{movie.title}</h1>
          <p>{movie.description}</p>
          <TagList tagIds={movie.tags} />
        </div>
        <button className="primary-action" type="button" onClick={() => toggleSaved(movie.id)}>
          <Bookmark size={16} fill={saved.has(movie.id) ? 'currentColor' : 'none'} />
          {saved.has(movie.id) ? 'Saved' : 'Save'}
        </button>
      </section>

      <div className="three-grid">
        <InfoBlock title="Cast" icon={UsersRound}>
          {movieActors.map((actor) => (
            <button className="link-row" type="button" key={actor.id} onClick={() => openActor(actor.id)}>{actor.name}</button>
          ))}
        </InfoBlock>
        <InfoBlock title="Characters" icon={Shield}>
          {movieCharacters.map((character) => (
            <button className="link-row" type="button" key={character.id} onClick={() => openCharacter(character.id)}>{character.name}</button>
          ))}
        </InfoBlock>
        <InfoBlock title="Connections" icon={Link2}>
          {movie.related.map((movieId) => {
            const relatedMovie = movies.find((item) => item.id === movieId)
            return relatedMovie ? <button className="link-row" type="button" key={movieId} onClick={() => openMovie(movieId)}>{relatedMovie.title}</button> : null
          })}
        </InfoBlock>
      </div>

      <div className="split-grid">
        <section className="content-band reveal">
          <SectionHeader icon={MessageCircle} title="Discussions & Theories" />
          <ThreadList threads={relatedPosts.length ? relatedPosts : posts.slice(0, 2)} />
        </section>
        <section className="content-band reveal">
          <SectionHeader icon={Sparkles} title="Leaks & Facts" />
          <LeakList leakItems={relatedLeaks} />
          <ul className="fact-list">
            {movieFacts.map((fact) => <li key={fact.id}>{fact.text}</li>)}
          </ul>
        </section>
      </div>
    </div>
  )
}

function CharacterPage({ character, openMovie, openActor }) {
  const appearances = movies.filter((movie) => movie.characters.includes(character.id))
  const linkedActors = actors.filter((actor) => character.actorIds.includes(actor.id))
  const characterFacts = facts.filter((fact) => fact.entityType === 'character' && fact.entityId === character.id)
  const relatedPosts = posts.filter((post) => post.characterId === character.id)

  return (
    <EntityDetail
      icon={Shield}
      title={character.name}
      subtitle={character.realName}
      description={character.description}
      tags={character.tags}
      facts={characterFacts}
      posts={relatedPosts}
      leftTitle="Appearances"
      leftItems={appearances}
      leftLabel={(movie) => movie.title}
      leftOpen={(movie) => openMovie(movie.id)}
      rightTitle="Actors"
      rightItems={linkedActors}
      rightLabel={(actor) => actor.name}
      rightOpen={(actor) => openActor(actor.id)}
      traits={character.traits}
    />
  )
}

function ActorPage({ actor, openMovie, openCharacter }) {
  const roleCharacters = characters.filter((character) => actor.roles.includes(character.id))
  const actorMovies = movies.filter((movie) => movie.actors.includes(actor.id))
  const actorFacts = facts.filter((fact) => fact.entityType === 'actor' && fact.entityId === actor.id)
  const relatedPosts = posts.filter((post) => post.actorId === actor.id)

  return (
    <EntityDetail
      icon={UserRound}
      title={actor.name}
      subtitle="MCU cast profile"
      description={actor.bio}
      tags={roleCharacters.flatMap((character) => character.tags).slice(0, 3)}
      facts={[...actorFacts, ...actor.trivia.map((text, index) => ({ id: `${actor.id}-${index}`, text }))]}
      posts={relatedPosts}
      leftTitle="Roles"
      leftItems={roleCharacters}
      leftLabel={(character) => character.name}
      leftOpen={(character) => openCharacter(character.id)}
      rightTitle="Movies"
      rightItems={actorMovies}
      rightLabel={(movie) => movie.title}
      rightOpen={(movie) => openMovie(movie.id)}
    />
  )
}

function EntityDetail({ icon: Icon, title, subtitle, description, tags: tagIds, facts: factItems, posts: postItems, leftTitle, leftItems, leftLabel, leftOpen, rightTitle, rightItems, rightLabel, rightOpen, traits = [] }) {
  return (
    <div className="page-stack">
      <section className="detail-hero reveal">
        <div>
          <div className="detail-meta"><Icon size={16} /> <span>{subtitle}</span></div>
          <h1>{title}</h1>
          <p>{description}</p>
          <TagList tagIds={[...new Set(tagIds)]} />
        </div>
      </section>
      {traits.length > 0 && <div className="trait-row">{traits.map((trait) => <span key={trait}>{trait}</span>)}</div>}
      <div className="split-grid">
        <InfoBlock title={leftTitle} icon={Clapperboard}>{leftItems.map((item) => <button className="link-row" type="button" key={item.id} onClick={() => leftOpen(item)}>{leftLabel(item)}</button>)}</InfoBlock>
        <InfoBlock title={rightTitle} icon={UsersRound}>{rightItems.map((item) => <button className="link-row" type="button" key={item.id} onClick={() => rightOpen(item)}>{rightLabel(item)}</button>)}</InfoBlock>
      </div>
      <div className="split-grid">
        <section className="content-band reveal">
          <SectionHeader icon={Sparkles} title="Facts" />
          <ul className="fact-list">{factItems.map((fact) => <li key={fact.id}>{fact.text}</li>)}</ul>
        </section>
        <section className="content-band reveal">
          <SectionHeader icon={MessageCircle} title="Related Threads" />
          <ThreadList threads={postItems.length ? postItems : posts.slice(0, 2)} />
        </section>
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

function Timeline({ openMovie, openCharacter, openActor }) {
  return (
    <div className="page-stack">
      <section className="content-band reveal">
        <SectionHeader icon={CalendarDays} title="Chronological Timeline" />
        <div className="timeline-list">
          {[...movies].sort((a, b) => a.timeline - b.timeline).map((movie) => (
            <button className="timeline-row" type="button" key={movie.id} onClick={() => openMovie(movie.id)}>
              <span>{movie.timeline}</span>
              <div>
                <h3>{movie.title}</h3>
                <p>{movie.phase} / {movie.status}</p>
              </div>
              <ChevronRight size={18} />
            </button>
          ))}
        </div>
      </section>
      <section className="content-band reveal">
        <SectionHeader icon={Link2} title="Relationship Index" />
        <div className="connection-grid">
          {characters.slice(0, 8).map((character) => {
            const actor = actors.find((item) => item.id === character.actorIds[0])
            const movie = movies.find((item) => item.characters.includes(character.id))
            return (
              <div className="connection-card" key={character.id}>
                <button type="button" onClick={() => openActor(actor.id)}>{actor.name}</button>
                <span>plays</span>
                <button type="button" onClick={() => openCharacter(character.id)}>{character.name}</button>
                <span>in</span>
                <button type="button" onClick={() => openMovie(movie.id)}>{movie.title}</button>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}

function TagsPage({ openMovie }) {
  return (
    <div className="page-stack">
      <section className="content-band reveal">
        <SectionHeader icon={Tag} title="Tags & Topics" />
        <div className="topic-grid">
          {tags.map((tagItem) => {
            const relatedMovies = movies.filter((movie) => movie.tags.includes(tagItem.id))
            const relatedPosts = posts.filter((post) => post.tags.includes(tagItem.id))
            return (
              <article className="topic-card" key={tagItem.id}>
                <span className={`tag tag-${tagItem.tone}`}>{tagItem.label}</span>
                <h3>{relatedMovies.length} movies / {relatedPosts.length} threads</h3>
                <div className="link-stack">
                  {relatedMovies.slice(0, 3).map((movie) => (
                    <button className="link-row" type="button" key={movie.id} onClick={() => openMovie(movie.id)}>{movie.title}</button>
                  ))}
                </div>
              </article>
            )
          })}
        </div>
      </section>
    </div>
  )
}

function CreatePost({ postType, setPostType }) {
  return (
    <div className="page-stack">
      <section className="content-band form-panel reveal">
        <SectionHeader icon={MessageCircle} title="Create Post" />
        <div className="filter-row">
          {['Discussion', 'Theory', 'Leak'].map((type) => (
            <button className={postType === type ? 'filter active' : 'filter'} type="button" key={type} onClick={() => setPostType(type)}>{type}</button>
          ))}
        </div>
        <form className="post-form">
          <label>Title<input placeholder="Make it clear and specific" /></label>
          <label>Description<textarea placeholder="Write the post without heavy formatting" rows="5" /></label>
          <label>Movie<select><option>Avengers: Endgame</option><option>Spider-Man: No Way Home</option><option>Avengers: Doomsday</option></select></label>
          <label>Optional character or actor<input placeholder="Iron Man, Tom Holland..." /></label>
          <label>Tags<input placeholder="timeline, avengers, rumor-watch" /></label>
          <label>Spoiler level<select><option>None</option><option>Low</option><option>Medium</option><option>High</option></select></label>
          <button className="primary-action" type="button">Preview {postType}</button>
        </form>
      </section>
    </div>
  )
}

function Profile({ saved, toggleSaved, openMovie }) {
  const savedMovies = movies.filter((movie) => saved.has(movie.id))
  const savedThreads = posts.filter((post) => saved.has(post.id))
  const savedLeaks = leaks.filter((leak) => saved.has(leak.id))

  return (
    <div className="page-stack">
      <section className="detail-hero reveal">
        <div>
          <div className="detail-meta"><UserRound size={16} /><span>Basic profile</span></div>
          <h1>arc-reactor</h1>
          <p>Saved movies, posts, and recent activity without followers, messages, or gamification.</p>
        </div>
      </section>
      <section className="content-band reveal">
        <SectionHeader icon={Bookmark} title="Saved Items" />
        <div className="entity-grid">
          {savedMovies.map((movie) => <EntityCard key={movie.id} title={movie.title} subtitle="Movie" text={movie.description} tagIds={movie.tags} onClick={() => openMovie(movie.id)} />)}
          {savedThreads.map((post) => <EntityCard key={post.id} title={post.title} subtitle="Discussion" text={post.body} tagIds={post.tags} onClick={() => toggleSaved(post.id)} />)}
          {savedLeaks.map((leak) => <EntityCard key={leak.id} title={leak.title} subtitle="Leak" text={leak.description} tagIds={leak.tags} onClick={() => toggleSaved(leak.id)} />)}
        </div>
      </section>
    </div>
  )
}

function AdminPanel() {
  return (
    <div className="page-stack">
      <section className="hero-panel admin-hero reveal">
        <div>
          <p className="small-label">Control room</p>
          <h1>Fast curation, clean taxonomy, simple moderation.</h1>
          <p className="hero-copy">The admin layer focuses on content quality: movies, characters, actors, posts, leaks, facts, tags, reports, users, global settings, and SEO basics.</p>
        </div>
        <div className="signal-grid">
          <Metric label="Users" value={users.length} />
          <Metric label="Posts" value={posts.length} />
          <Metric label="Leaks" value={leaks.length} />
          <Metric label="Reports" value={reports.length} />
        </div>
      </section>
      <div className="admin-grid">
        {[
          ['Movies Management', 'Add, edit, delete, assign cast, tags, timeline order.'],
          ['Characters Management', 'Link characters to movies and actors with concise traits.'],
          ['Actors Management', 'Keep MCU-scoped bios, roles, movies, and facts.'],
          ['Timeline Editor', 'Set order, prequels, sequels, and cross-connections manually.'],
          ['Posts Management', 'Feature, pin, edit, delete, and filter by movie or tags.'],
          ['Leaks Management', 'Approve, reject, mark credibility, and remove fake leaks.'],
          ['Facts Management', 'Attach short facts to movies, characters, or actors.'],
          ['Tags Management', 'Create, merge, and clean duplicate taxonomy.'],
          ['Featured Content', 'Curate featured movies, discussions, and important leaks.'],
          ['Users Management', 'View activity, restrict, ban, or remove users.'],
          ['Reports Queue', 'Remove, ignore, or act on reported content.'],
          ['Global Settings & SEO', 'Posting toggle, spoiler rules, titles, and descriptions.'],
        ].map(([title, text]) => (
          <article className="admin-card reveal" key={title}>
            <h3>{title}</h3>
            <p>{text}</p>
            <button className="quiet-action" type="button">Open</button>
          </article>
        ))}
      </div>
    </div>
  )
}

function ThreadList({ threads }) {
  return (
    <div className="thread-list">
      {threads.map((thread) => (
        <article className="thread-row" key={thread.id}>
          <div>
            <div className="thread-meta">
              <span>{thread.type}</span>
              <span>{thread.spoiler} spoilers</span>
              <span>{thread.activeAt}</span>
            </div>
            <h3>{thread.title}</h3>
            <p>{thread.body}</p>
            <TagList tagIds={thread.tags} />
          </div>
          <div className="thread-stats">
            <span>{thread.upvotes}</span>
            <small>{thread.comments} comments</small>
          </div>
        </article>
      ))}
    </div>
  )
}

function LeakList({ leakItems = leaks }) {
  if (leakItems.length === 0) {
    return <p className="empty-note">No active leaks attached yet.</p>
  }

  return (
    <div className="thread-list">
      {leakItems.map((leak) => (
        <article className="leak-row" key={leak.id}>
          <div>
            <div className="thread-meta">
              <span>{leak.status}</span>
              <span>{leak.credibility} credibility</span>
              <span>{leak.spoiler} spoilers</span>
            </div>
            <h3>{leak.title}</h3>
            <p>{leak.description}</p>
            <TagList tagIds={leak.tags} />
          </div>
        </article>
      ))}
    </div>
  )
}

function SearchResults({ results, openMovie, openCharacter, openActor }) {
  const handlers = {
    Movies: (item) => openMovie(item.id),
    Characters: (item) => openCharacter(item.id),
    Actors: (item) => openActor(item.id),
    Discussions: () => {},
  }

  return (
    <div className="page-stack">
      <section className="content-band reveal">
        <SectionHeader icon={Search} title="Search Results" />
        <div className="search-groups">
          {Object.entries(results).map(([group, items]) => (
            <div className="search-group" key={group}>
              <h3>{group}</h3>
              {items.length === 0 ? <p className="empty-note">No matches</p> : items.map((item) => (
                <button className="compact-row" type="button" key={item.id} onClick={() => handlers[group](item)}>
                  <span>{item.title ?? item.name}</span>
                  <small>{item.description ?? item.bio ?? item.body}</small>
                </button>
              ))}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default App
