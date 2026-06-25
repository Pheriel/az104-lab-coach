DROP TABLE IF EXISTS quiz_attempts;
DROP TABLE IF EXISTS notes;
DROP TABLE IF EXISTS resources;
DROP TABLE IF EXISTS user_lab_progress;
DROP TABLE IF EXISTS lab_steps;
DROP TABLE IF EXISTS quiz_questions;
DROP TABLE IF EXISTS labs;
DROP TABLE IF EXISTS modules;

CREATE TABLE modules (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  exam_weight VARCHAR(40) NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE labs (
  id SERIAL PRIMARY KEY,
  module_id INTEGER NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  title VARCHAR(160) NOT NULL,
  slug VARCHAR(180) NOT NULL UNIQUE,
  objective TEXT NOT NULL,
  prerequisites TEXT NOT NULL DEFAULT '',
  difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('debutant', 'intermediaire', 'avance')),
  estimated_minutes INTEGER NOT NULL CHECK (estimated_minutes > 0),
  azure_services TEXT[] NOT NULL DEFAULT '{}',
  useful_commands JSONB NOT NULL DEFAULT '[]'::jsonb,
  common_pitfalls TEXT[] NOT NULL DEFAULT '{}',
  understanding_goals TEXT[] NOT NULL DEFAULT '{}',
  verification_steps TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE lab_steps (
  id SERIAL PRIMARY KEY,
  lab_id INTEGER NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL CHECK (step_order > 0),
  title VARCHAR(160) NOT NULL,
  instruction TEXT NOT NULL,
  command_hint TEXT,
  UNIQUE (lab_id, step_order)
);

CREATE TABLE user_lab_progress (
  id SERIAL PRIMARY KEY,
  lab_id INTEGER NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  completed_step_ids INTEGER[] NOT NULL DEFAULT '{}',
  personal_notes TEXT NOT NULL DEFAULT '',
  last_opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (lab_id)
);

CREATE TABLE quiz_questions (
  id SERIAL PRIMARY KEY,
  module_id INTEGER NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  choices JSONB NOT NULL,
  correct_answer INTEGER NOT NULL CHECK (correct_answer >= 0),
  explanation TEXT NOT NULL,
  difficulty VARCHAR(20) NOT NULL DEFAULT 'intermediaire' CHECK (difficulty IN ('debutant', 'intermediaire', 'avance')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE quiz_attempts (
  id SERIAL PRIMARY KEY,
  module_id INTEGER REFERENCES modules(id) ON DELETE SET NULL,
  score INTEGER NOT NULL CHECK (score >= 0),
  total INTEGER NOT NULL CHECK (total > 0),
  answers JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE notes (
  id SERIAL PRIMARY KEY,
  module_id INTEGER REFERENCES modules(id) ON DELETE SET NULL,
  title VARCHAR(160) NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE resources (
  id SERIAL PRIMARY KEY,
  module_id INTEGER REFERENCES modules(id) ON DELETE SET NULL,
  title VARCHAR(160) NOT NULL,
  url TEXT,
  resource_type VARCHAR(40) NOT NULL CHECK (resource_type IN ('doc', 'commande', 'video', 'reference', 'outil')),
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_labs_module_id ON labs(module_id);
CREATE INDEX idx_steps_lab_id ON lab_steps(lab_id);
CREATE INDEX idx_questions_module_id ON quiz_questions(module_id);
CREATE INDEX idx_notes_module_id ON notes(module_id);
CREATE INDEX idx_resources_module_id ON resources(module_id);
