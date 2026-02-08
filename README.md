# INFER Seminar Tool (Kathleen's Seminar)

**This is a separate website from Till's experiment.** Do not modify the assignment, alpha, beta, or gamma sites.

Lightweight data-collection tool for Kathleen's seminar: one video task + post-survey, with optional random tutorial.

## User flow (overall similar to main experiment; no dashboard)

1. **Data collection form** – Same as assignment: data protection document (read + checkbox) and consent for scientific use (agree/disagree). Then Continue.

2. **ID** – Anonymous ID (Teilnehmer-Code), same format as Till's experiment:  
   Last 2 letters of mother's maiden name + number of letters in mother's first name + last 2 letters of father's first name + birth day. Example: ER04LF09.

3. **Video dropdown selection** – Participant selects one of the four videos (same names as main experiment). No video screen in between; they already have access to the videos in the seminar. Then Continue.

4. **Tool** – System randomly decides whether to show the 2‑minute tutorial video (same as alpha’s “how to use feedback”). Then: reflection textarea + Generate Feedback (same prompt as alpha/beta). No dashboard; the selected video is fixed from step 3.

5. **Post-survey** – Link to a **separate** Qualtrics survey (not Till’s). Completion code: **628034**.

## Differences from the main experiment

- No assignment/alpha/beta/gamma conditions; no pre-survey; no progress saving.
- If the user closes the browser and returns, they start again from the ID step.
- Post-survey URL: `https://unc.az1.qualtrics.com/jfe/form/SV_9ZiPKf0uGc7ZKOW`
- Completion code after post-survey: **628034**  
  Text: *"Vielen Dank für die Bearbeitung dieser Videoaufgabe! Bitte geben Sie den folgenden Code ein, um fortzufahren. Der Code lautet: 628034"*

## Setup

1. **Assets** – Copy from `infer-study-alpha` (same repo or sibling folder):
   - `University-of-Tubingen-01.png`
   - `UNC_logo.avif`
   - `Jan19Tutorial.mp4` (tutorial video)

2. **Supabase** – Create the `seminar_sessions` table (see `SEMINAR_SUPABASE_TABLE.sql`). Uses the same Supabase project as the main experiment; this table is separate so Till’s data is not affected.

3. **CORS proxy** – Same as main app: production uses `https://tubingen-feedback-cors-proxy.onrender.com` for OpenAI requests.

4. **Deploy** – Put this folder in its own repo and deploy (e.g. Render, Netlify, or static host). Use a different URL from the main experiment sites.

## Data

- **seminar_sessions** – One row per participant (by anonymous ID): `participant_name`, `saw_tutorial`, `video_id` (set when they complete the task), `created_at`, `updated_at`.
- Post-survey data lives in Qualtrics (survey SV_9ZiPKf0uGc7ZKOW), separate from Till’s experiment surveys.

## UI and language

- Same visual style and EN/DE switching as the main experiment (INFER header, cards, feedback layout).
- Default language: German.
