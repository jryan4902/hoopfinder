/**
 * Shown instead of the app when Supabase credentials are missing. This exists
 * so a fresh clone explains itself rather than rendering a white screen.
 */
export function SetupNotice() {
  return (
    <div className="page">
      <header className="page__header">
        <h1 className="wordmark">
          Hoop<span>Finder</span>
        </h1>
        <p className="page__sub">Not connected to Supabase yet.</p>
      </header>

      <section className="section">
        <h2 className="section__title">Finish setup</h2>
        <ol className="setup">
          <li className="setup__step">
            Copy <code>.env.example</code> to <code>.env.local</code>
            <pre className="setup__code">cp .env.example .env.local</pre>
          </li>
          <li className="setup__step">
            Fill in <code>VITE_SUPABASE_URL</code> and{' '}
            <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> from your Supabase
            project, under Project Settings → API Keys.
          </li>
          <li className="setup__step">
            Restart the dev server. Vite only reads env files at startup.
          </li>
        </ol>
      </section>

      <p className="page__foot">
        Database not created yet? Run the migration and seed in{' '}
        <code>supabase/</code> — see the README.
      </p>
    </div>
  )
}
