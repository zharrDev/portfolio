-- ============================================================================
-- Dzhar.dev — bilingual content (Indonesian + English)
--
-- Every user-facing prose field gets an optional `<column>_en` sibling. The
-- base column stays Indonesian (the site's default locale); the API only
-- swaps in the English value when the request asks for `?locale=en` AND the
-- English cell is non-empty. Leaving a cell NULL means "no translation yet",
-- which falls back to Indonesian rather than showing a blank.
--
-- All statements are idempotent so the file can be re-run safely.
-- ============================================================================

-- --- profiles ---------------------------------------------------------------
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS headline_en        TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subheadline_en     TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio_en             TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS about_en           TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS availability_en    TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_focus_en   TEXT;

-- --- educations -------------------------------------------------------------
ALTER TABLE educations ADD COLUMN IF NOT EXISTS degree_en       TEXT;
ALTER TABLE educations ADD COLUMN IF NOT EXISTS major_en        TEXT;
ALTER TABLE educations ADD COLUMN IF NOT EXISTS description_en  TEXT;

-- --- skills -----------------------------------------------------------------
ALTER TABLE skills ADD COLUMN IF NOT EXISTS name_en  TEXT;
ALTER TABLE skills ADD COLUMN IF NOT EXISTS note_en  TEXT;

-- --- projects ---------------------------------------------------------------
ALTER TABLE projects ADD COLUMN IF NOT EXISTS title_en             TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS short_description_en TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS description_en       TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS problem_en           TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS goals_en             TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS main_features_en     TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS challenges_en        TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS learnings_en         TEXT;

-- --- experiences ------------------------------------------------------------
ALTER TABLE experiences ADD COLUMN IF NOT EXISTS role_en        TEXT;
ALTER TABLE experiences ADD COLUMN IF NOT EXISTS description_en TEXT;

-- --- certificates -----------------------------------------------------------
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS name_en TEXT;

-- ---------------------------------------------------------------------------
-- English content for the seeded rows. Written as an UPSERT on the seed's own
-- natural keys so it stays safe on a re-run and does not touch records the
-- owner has since edited away from the seeded text.
-- ---------------------------------------------------------------------------

UPDATE profiles SET
  headline_en     = 'Backend & Web Developer · Accounting Student',
  subheadline_en  = 'Accounting student by education. Developer by passion.',
  about_en        = 'I am an Accounting student who developed an interest in software development, especially backend and web development.'
                    || E'\n' || 'An Accounting background gives me an understanding of data flow, business processes and financial reporting rules — all of which prove very useful when designing software.'
                    || E'\n' || 'I learn by building real projects: writing code, reading the official documentation, testing the result, then fixing what does not work. I am currently focusing on Go, TypeScript, PostgreSQL and financial technology.',
  current_focus_en = 'Backend Development, Web Development, Database Engineering, Financial Technology',
  availability_en  = 'Studying & building projects'
WHERE id = (SELECT MIN(id) FROM profiles)
  AND headline_en IS NULL;

UPDATE educations SET
  degree_en      = 'Bachelor',
  major_en       = 'Accounting',
  description_en = 'Pursuing a Bachelor of Accounting degree while developing software development skills independently.'
WHERE institution = 'Universitas Nasional Pasim' AND description_en IS NULL;

UPDATE educations SET
  degree_en      = 'Vocational High School',
  major_en       = 'Accounting',
  description_en = 'Completed secondary vocational education in the Accounting major.'
WHERE institution = 'SMKS Swadaya' AND description_en IS NULL;

-- Skill names are proper nouns in most cases, but a few carry Indonesian
-- context that would read oddly in English.
UPDATE skills SET note_en = 'Sandbox payment gateway' WHERE name = 'Midtrans (Sandbox)' AND note_en IS NULL;

UPDATE projects SET
  title_en             = 'LedgerFlow',
  short_description_en = 'A web accounting application for structured journal entries, ledgers and financial statements.',
  description_en       = 'LedgerFlow is a web-based accounting and bookkeeping application designed to help businesses manage their finances digitally: journal entries, ledgers, financial statements (Income Statement, Balance Sheet, Cash Flow), a chart of accounts, period management and multiple companies.',
  problem_en           = 'Manual bookkeeping makes it hard for business owners to track their financial position quickly and consistently, especially as transaction volume grows.',
  goals_en             = E'Provide journal entries that follow double-entry accounting principles.\nPresent financial statements that can be traced back to their source transactions.\nSupport more than one company from a single account.',
  main_features_en     = E'User authentication with role-based access control.\nChart of accounts and general journal with debit–credit balance validation.\nIncome Statement, Balance Sheet and Cash Flow.\nPeriod management and multi-company support.',
  challenges_en        = 'Keeping the accounting rules consistent in the API layer while making sure statements stay accurate as the data grows.',
  learnings_en         = 'The best practice in translating business accounting rules into technical validation and a consistent data structure.'
WHERE slug = 'ledgerflow' AND title_en IS NULL;

UPDATE projects SET
  title_en             = 'PrintKu',
  short_description_en = 'An e-commerce platform for a stationery shop and online print/photocopy services, built with Go and SvelteKit.',
  description_en       = 'PrintKu combines two needs: an online stationery store and print, photocopy, binding, laminating and document scanning services. Customers upload a file, choose the specifications, and the system calculates the price from the page count parsed on the server.',
  problem_en           = 'Print orders are usually still placed manually, so price estimates and order status are hard for customers to track.',
  goals_en             = E'Digitise print ordering with automatic price calculation.\nProvide clear order status tracking.\nCombine stationery sales and print services in a single platform.',
  main_features_en     = E'File upload with server-side page-count parsing.\nPrice calculation based on print specifications.\nOrder status tracking.\nJWT-based authentication and an admin dashboard.\nPayments through Midtrans in sandbox mode.',
  challenges_en        = 'Handling uploads and document parsing safely, while keeping order status consistent between backend and frontend.',
  learnings_en         = 'The experience of building a REST API with Go, managing application state, and integrating a third-party payment service.'
WHERE slug = 'printku' AND title_en IS NULL;
