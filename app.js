// INFER Seminar Tool – Kathleen's seminar data collection
// Separate from Till's experiment (assignment / alpha / beta / gamma). Do not modify those.
// Flow: (1) Data collection form (same as assignment) → (2) ID → (3) Video dropdown (no video screen) → (4) Tool: random tutorial then reflection+feedback → (5) Post-survey. No dashboard.

const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
const CORS_PROXY_URL = isProduction
    ? 'https://tubingen-feedback-cors-proxy.onrender.com'
    : 'http://localhost:3000';
const OPENAI_API_URL = `${CORS_PROXY_URL}/api/openai/v1/chat/completions`;
const model = 'gpt-4o';

// Pilot study Supabase (not Till's main experiment DB). Same project as infer-task-survey-version / app-base.js.
const SUPABASE_URL = 'https://immrkllzjvhdnzesmaat.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltbXJrbGx6anZoZG56ZXNtYWF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxNzk2MzgsImV4cCI6MjA2Mjc1NTYzOH0.glhn-u4mNpKHsH6qiwdecXyYOWhdxDrTVDIvNivKVf8';

const VIDEOS = [
    { id: 'video1', name: 'Video 1: 01 Palästina', link: 'https://unitc-my.sharepoint.com/:v:/g/personal/sebft01_cloud_uni-tuebingen_de/IQAlV5knBnzmSqXI1k6JcBQ4ASfhxX7-jlefJy63sKUHOpk?e=OClxDB', password: '01pana' },
    { id: 'video2', name: 'Video 2: 02 Spinne fängt Fliege', link: 'https://unitc-my.sharepoint.com/:v:/g/personal/sebft01_cloud_uni-tuebingen_de/IQBEKSXETHcOR5ArCxT4XuieAUt5frf9SMVOAPLbcfeq5B4?e=QXxVt2', password: '02spge' },
    { id: 'video3', name: 'Video 3: 03 Höhendifferenz', link: 'https://unitc-my.sharepoint.com/:v:/g/personal/sebft01_cloud_uni-tuebingen_de/IQCWmAF5DMTVRqGfS2jO8z9XAdtkCcrnZlCYzS1eOJsNbyY?e=csJxJJ', password: '03honz' },
    { id: 'video4', name: 'Video 4: 04 Binomische Formeln', link: 'https://unitc-my.sharepoint.com/:v:/g/personal/sebft01_cloud_uni-tuebingen_de/IQBIo8KImiVlQrNspfjpwuVlARSmJ3DOJhQ8uqroL0GKSkc?e=iexZCN', password: '04biln' }
];

const POST_SURVEY_URL = 'https://unc.az1.qualtrics.com/jfe/form/SV_9ZiPKf0uGc7ZKOW';
const COMPLETION_CODE = '628034';

let currentLanguage = 'de';
let supabase = null;
let sessionId = null;
let participantId = null;
let selectedVideoId = null;
let selectedVideoName = null;
let sawTutorial = false;
let taskState = {
    feedbackGenerated: false,
    currentReflectionId: null,
    currentFeedbackStartTime: null,
    currentFeedbackType: null
};

// Language translations (aligned with assignment and alpha)
const translations = {
    en: {
        title: 'INFER',
        subtitle: 'An intelligent feedback system for observing classroom videos',
        browser_recommendation: 'For the best experience, we recommend using <strong>Google Chrome</strong>.',
        welcome_seminar: 'Welcome',
        welcome_message_seminar: 'Thank you for participating. This task involves watching one teaching video (you have access in the seminar), writing a reflection, and receiving AI feedback.',
        data_protection_header: 'Data Protection Information',
        data_protection_intro: 'Please read the data protection information document below.',
        open_data_protection_doc: 'Open Data Protection Document',
        data_protection_checkbox: 'I have read and understood the data protection information document.',
        data_consent_header: 'Consent for Scientific Use',
        data_consent_intro: 'Please read the consent form below and indicate whether you consent to the use of your anonymized data for scientific purposes.',
        open_consent_form: 'Open Consent Form',
        data_consent_agree: 'I agree to the use of my anonymized data for scientific purposes.',
        data_consent_disagree: 'I do not agree to the use of my anonymized data for scientific purposes.',
        continue_to_id: 'Continue',
        enter_id_title: 'Enter Your Participant Code',
        participant_code_label: 'Anonymous ID (Participant Code):',
        code_placeholder: 'e.g., ER04LF09',
        anonymous_id_help: '<strong>How to create your personal anonymous ID?</strong><br><br>To properly assign your data without violating confidentiality, we need an anonymous ID. The ID is constructed so that no one can trace your ID back to you, not even us. However, you can always reconstruct your ID if asked and you have forgotten it.<br><br>These are the components of your ID:<br>1. The last two letters of your mother\'s maiden name<br>2. The number of letters in your mother\'s (first) first name<br>3. The last two letters of your father\'s (first) first name<br>4. Your own birthday (only the day, not month and/or year)<br><br><em>Note:</em><br>- Please write all numbers with two digits, i.e. with a leading zero if necessary.<br>- For multiple or hyphenated first names, please only use the first one.<br>- If you don\'t know the respective name, write XX instead of letters or 00 for the number.<br><br><strong>Example (fictional):</strong><br>1. Mother\'s name: <strong>Elke</strong>-Hannelore Müller née Mayerhof<strong>er</strong> → <strong>ER</strong><br>2. Mother\'s first name: <strong>Elke</strong> (4 letters) → <strong>04</strong><br>3. Father\'s first name: Wo<strong>lf</strong>-Rüdiger → <strong>LF</strong><br>4. Your birthday: <strong>09</strong>.11.1987 → <strong>09</strong><br><br>This results in the ID: <strong>ER04LF09</strong>',
        continue_button: 'Continue',
        select_video_step: 'Select the video for your reflection',
        video_select_hint: 'You already have access to the videos in the seminar. Choose which video you are reflecting on.',
        select_video: 'Select one video:',
        tutorial_video_title: 'Tutorial: How to Use INFER',
        tutorial_description: 'Please watch this short tutorial before the task. It explains how to use the feedback system.',
        tutorial_watched_checkbox: 'I have watched the tutorial',
        task_subtitle: 'Video reflection and feedback',
        video_label: 'Video',
        reflection_for: 'Reflection for:',
        reflection_input: 'Your reflection',
        paste_reflection_placeholder: 'Paste or write your reflection here... (at least 400 words)',
        generate_feedback: 'Generate Feedback',
        generated_feedback: 'Generated Feedback',
        extended: 'Extended',
        short: 'Short',
        go_to_post_survey: 'Continue to Post-Survey',
        post_survey_title: 'Post-Survey',
        post_survey_intro: 'Please complete the following survey. At the end, enter the confirmation code below to finish.',
        open_post_survey: 'Open Post-Survey',
        completion_code_title: 'Confirmation code',
        completion_code_instruction: 'After completing the survey, enter this code:',
        completion_code_note: 'Thank you for completing this video task! Please enter the following code to continue. The code is: 628034',
        loading_messages: ['Analyzing your reflection...', 'Generating feedback...', 'Almost there...']
    },
    de: {
        title: 'INFER',
        subtitle: 'Ein intelligentes Feedback-System zur Beobachtung von Unterricht',
        browser_recommendation: 'Für die beste Erfahrung empfehlen wir die Verwendung von <strong>Google Chrome</strong>.',
        welcome_seminar: 'Willkommen',
        welcome_message_seminar: 'Vielen Dank für Ihre Teilnahme. Bei dieser Aufgabe schauen Sie sich ein Unterrichtsvideo an (Zugang haben Sie im Seminar), schreiben eine Reflexion und erhalten KI-Feedback.',
        data_protection_header: 'Datenschutzhinweise',
        data_protection_intro: 'Bitte lesen Sie das unten stehende Datenschutzdokument.',
        open_data_protection_doc: 'Datenschutzdokument öffnen',
        data_protection_checkbox: 'Ich habe die Datenschutzhinweise gelesen und verstanden.',
        data_consent_header: 'Einverständniserklärung für wissenschaftliche Nutzung',
        data_consent_intro: 'Bitte lesen Sie das unten stehende Einverständnisformular und geben Sie an, ob Sie der Verwendung Ihrer anonymisierten Daten für wissenschaftliche Zwecke zustimmen.',
        open_consent_form: 'Einverständnisformular öffnen',
        data_consent_agree: 'Ich stimme der Verwendung meiner anonymisierten Daten für wissenschaftliche Zwecke zu.',
        data_consent_disagree: 'Ich stimme der Verwendung meiner anonymisierten Daten für wissenschaftliche Zwecke nicht zu.',
        continue_to_id: 'Weiter',
        enter_id_title: 'Geben Sie Ihren Teilnehmer-Code ein',
        participant_code_label: 'Anonyme ID (Teilnehmer-Code):',
        code_placeholder: 'z.B. ER04LF09',
        anonymous_id_help: '<strong>Wie erstellen Sie Ihre persönliche anonyme ID?</strong><br><br>Um Ihre Daten richtig zuordnen zu können, ohne die Geheimhaltung zu verletzen, benötigen wir eine anonyme ID. Die ID ist so aufgebaut, dass niemand von Ihrer ID auf Ihre Person rückschließen kann, auch wir nicht. Sie selbst können Ihre ID aber jederzeit rekonstruieren, wenn Sie danach gefragt werden und sie vergessen haben sollten.<br><br>Dies sind die Bestandteile Ihrer ID:<br>1. Die beiden letzten Buchstaben des Geburtsnamens Ihrer Mutter<br>2. Die Anzahl der Buchstaben des (ersten) Vornamens Ihrer Mutter<br>3. Die beiden letzten Buchstaben des (ersten) Vornamens Ihres Vaters<br>4. Ihr eigener Geburtstag (nur der Tag, nicht Monat und/oder Jahr)<br><br><em>Hinweis:</em><br>- Bitte schreiben Sie alle Zahlen zweistellig, d.h. wenn nötig mit führender Null.<br>- Bei mehreren oder zusammengesetzten Vornamen berücksichtigen Sie bitte nur den ersten.<br>- Wenn Sie den jeweiligen Namen nicht kennen, schreiben Sie statt der Buchstaben XX bzw. für die Zahl 00.<br><br><strong>Beispiel (fiktiv):</strong><br>1. Name der Mutter: <strong>Elke</strong>-Hannelore Müller geb. Mayerhof<strong>er</strong> → <strong>ER</strong><br>2. Vorname der Mutter: <strong>Elke</strong> (4 Buchstaben) → <strong>04</strong><br>3. Vorname des Vaters: Wo<strong>lf</strong>-Rüdiger → <strong>LF</strong><br>4. Ihr Geburtstag: <strong>09</strong>.11.1987 → <strong>09</strong><br><br>Daraus ergibt sich als ID: <strong>ER04LF09</strong>',
        continue_button: 'Weiter',
        select_video_step: 'Wählen Sie das Video für Ihre Reflexion',
        video_select_hint: 'Die Videos haben Sie bereits im Seminar. Wählen Sie, zu welchem Video Sie reflektieren.',
        select_video: 'Wählen Sie ein Video:',
        tutorial_video_title: 'Tutorial: So nutzen Sie INFER',
        tutorial_description: 'Bitte sehen Sie sich dieses kurze Tutorial vor der Aufgabe an. Es erklärt die Nutzung des Feedback-Systems.',
        tutorial_watched_checkbox: 'Ich habe das Tutorial angesehen',
        task_subtitle: 'Video-Reflexion und Feedback',
        video_label: 'Video',
        reflection_for: 'Reflexion zu:',
        reflection_input: 'Ihre Reflexion',
        paste_reflection_placeholder: 'Fügen Sie hier Ihre Reflexion ein oder schreiben Sie sie... (mindestens 400 Wörter)',
        generate_feedback: 'Feedback generieren',
        generated_feedback: 'Generiertes Feedback',
        extended: 'Erweitert',
        short: 'Kurz',
        go_to_post_survey: 'Weiter zur Nachbefragung',
        post_survey_title: 'Nachbefragung',
        post_survey_intro: 'Bitte füllen Sie die folgende Umfrage aus. Am Ende geben Sie den Bestätigungscode ein.',
        open_post_survey: 'Nachbefragung öffnen',
        completion_code_title: 'Bestätigungscode',
        completion_code_instruction: 'Nach Abschluss der Umfrage geben Sie diesen Code ein:',
        completion_code_note: 'Vielen Dank für die Bearbeitung dieser Videoaufgabe! Bitte geben Sie den folgenden Code ein, um fortzufahren. Der Code lautet: 628034',
        loading_messages: ['Reflexion wird analysiert...', 'Feedback wird erstellt...', 'Fast fertig...']
    }
};

function showPage(id) {
    document.querySelectorAll('.page-container').forEach(el => el.classList.add('d-none'));
    const page = document.getElementById(id);
    if (page) page.classList.remove('d-none');
}

function showAlert(message, type) {
    const container = document.getElementById('alert-container');
    if (!container) return;
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.innerHTML = `${message}<button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
    container.appendChild(alert);
    setTimeout(() => alert.remove(), 5000);
}

function applyTranslations() {
    const t = translations[currentLanguage] || translations.en;
    if (!t) return;
    document.querySelectorAll('[data-lang-key-placeholder]').forEach(el => {
        const key = el.getAttribute('data-lang-key-placeholder');
        if (t[key]) el.placeholder = t[key];
    });
    document.querySelectorAll('[data-lang-key]').forEach(el => {
        const key = el.getAttribute('data-lang-key');
        if (!t[key]) return;
        if (el.tagName === 'BUTTON' && el.querySelector('span[data-lang-key]')) {
            const span = el.querySelector('span[data-lang-key]');
            if (span) {
                if (t[key].includes('<') && t[key].includes('>')) span.innerHTML = t[key];
                else span.textContent = t[key];
            }
        } else if (el.tagName === 'A' && el.querySelector('span[data-lang-key]')) {
            const span = el.querySelector('span[data-lang-key]');
            if (span) {
                if (t[key].includes('<') && t[key].includes('>')) span.innerHTML = t[key];
                else span.textContent = t[key];
            }
        } else if (el.tagName === 'SPAN' || el.tagName === 'SMALL') {
            if (t[key].includes('<') && t[key].includes('>')) el.innerHTML = t[key];
            else el.textContent = t[key];
        } else if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            if (key.includes('placeholder') || key.includes('reflection') || key.includes('paste')) el.placeholder = t[key];
            else el.value = t[key];
        } else {
            if (t[key].includes('<') && t[key].includes('>')) el.innerHTML = t[key];
            else el.textContent = t[key];
        }
    });
}

function renderLanguageSwitcher() {
    const containers = document.querySelectorAll('.language-switcher-container');
    const btnEn = (currentLanguage === 'en' ? 'btn-primary' : 'btn-outline-primary');
    const btnDe = (currentLanguage === 'de' ? 'btn-primary' : 'btn-outline-primary');
    const html = '<div class="btn-group"><button type="button" class="btn ' + btnEn + '" data-lang="en">English</button><button type="button" class="btn ' + btnDe + '" data-lang="de">Deutsch</button></div>';
    containers.forEach(c => { c.innerHTML = html; });
}

function initSupabase() {
    if (!SUPABASE_URL || !SUPABASE_KEY) return null;
    try {
        if (typeof window.supabase === 'undefined') return null;
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        return supabase;
    } catch (e) {
        console.warn('Supabase init failed', e);
        return null;
    }
}

async function logSeminarSession(participant_name, saw_tutorial, video_id, survey_verification_code) {
    if (!supabase) return;
    try {
        const row = {
            participant_name: participant_name.trim().toUpperCase(),
            saw_tutorial: !!saw_tutorial,
            video_id: video_id || null,
            updated_at: new Date().toISOString()
        };
        if (survey_verification_code != null) row.survey_verification_code = survey_verification_code;
        const { error } = await supabase.from('seminar_sessions').upsert(row, { onConflict: 'participant_name' });
        if (error) console.warn('seminar_sessions upsert error', error);
    } catch (e) {
        console.warn('logSeminarSession', e);
    }
}

function getSessionId() {
    if (!sessionId) sessionId = (participantId || 'anon') + '-' + Date.now();
    return sessionId;
}

async function logEvent(eventType, eventData) {
    if (!supabase) return;
    try {
        const payload = {
            session_id: getSessionId(),
            reflection_id: taskState.currentReflectionId || null,
            participant_name: participantId ? participantId.trim().toUpperCase() : null,
            event_type: eventType,
            event_data: eventData || {},
            timestamp_utc: new Date().toISOString()
        };
        const { error } = await supabase.from('seminar_user_events').insert([payload]);
        if (error) console.warn('logEvent error', eventType, error);
    } catch (e) {
        console.warn('logEvent', e);
    }
}

function startFeedbackViewing(style) {
    taskState.currentFeedbackStartTime = Date.now();
    taskState.currentFeedbackType = style;
    logEvent('view_feedback_start', {
        video_id: selectedVideoId,
        style: style,
        language: currentLanguage
    });
}

function endFeedbackViewing(style) {
    if (!taskState.currentFeedbackStartTime) return;
    const duration_seconds = (Date.now() - taskState.currentFeedbackStartTime) / 1000;
    logEvent('view_feedback_end', {
        video_id: selectedVideoId,
        style: style || taskState.currentFeedbackType,
        language: currentLanguage,
        duration_seconds: duration_seconds
    });
    taskState.currentFeedbackStartTime = null;
    taskState.currentFeedbackType = null;
}

async function saveReflectionToDatabase(data) {
    if (!supabase) return null;
    try {
        const row = {
            session_id: getSessionId(),
            participant_name: participantId.trim().toUpperCase(),
            video_id: data.video_id,
            language: currentLanguage,
            reflection_text: data.reflection_text,
            analysis_percentages: data.analysisResult ? { raw: data.analysisResult.percentages_raw, priority: data.analysisResult.percentages_priority } : null,
            weakest_component: data.analysisResult?.weakest_component || null,
            feedback_extended: data.extendedFeedback || null,
            feedback_short: data.shortFeedback || null,
            revision_number: 1
        };
        const { data: result, error } = await supabase.from('seminar_reflections').insert([row]).select().single();
        if (error) { console.warn('saveReflectionToDatabase error', error); return null; }
        taskState.currentReflectionId = result.id;
        return result.id;
    } catch (e) {
        console.warn('saveReflectionToDatabase', e);
        return null;
    }
}

async function markReflectionSubmitted(reflectionId, finalReflectionText) {
    if (!supabase || !reflectionId) return;
    try {
        const update = { submitted_at: new Date().toISOString() };
        if (finalReflectionText != null) update.reflection_text = finalReflectionText;
        await supabase.from('seminar_reflections').update(update).eq('id', reflectionId);
    } catch (e) {
        console.warn('markReflectionSubmitted', e);
    }
}

// ----- Page 1: Data collection form (same as assignment) -----
function setupDataCollectionPage() {
    const dataProtectionRead = document.getElementById('data-protection-read');
    const consentAgree = document.getElementById('data-consent-agree');
    const consentDisagree = document.getElementById('data-consent-disagree');
    const continueBtn = document.getElementById('continue-to-id');
    if (!continueBtn) return;

    function updateContinueBtn() {
        const read = dataProtectionRead && dataProtectionRead.checked;
        const consent = (consentAgree && consentAgree.checked) || (consentDisagree && consentDisagree.checked);
        continueBtn.disabled = !(read && consent);
    }
    if (dataProtectionRead) dataProtectionRead.addEventListener('change', updateContinueBtn);
    if (consentAgree) consentAgree.addEventListener('change', updateContinueBtn);
    if (consentDisagree) consentDisagree.addEventListener('change', updateContinueBtn);

    continueBtn.addEventListener('click', () => {
        logEvent('datacollection_continue', {});
        showPage('page-id');
    });
}

// ----- Page 2: ID (same as assignment) -----
function setupIdPage() {
    const input = document.getElementById('anonymous-id-input');
    const btn = document.getElementById('submit-id');
    if (!input || !btn) return;

    function updateBtn() {
        btn.disabled = !input.value.trim();
    }
    input.addEventListener('input', updateBtn);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') btn.click(); });

    btn.addEventListener('click', () => {
        const id = input.value.trim().toUpperCase();
        if (!id) return;
        participantId = id;
        sessionId = null;
        logEvent('id_entered', { participant_name: participantId });
        showPage('page-video-select');
    });
}

// ----- Page 3: Video dropdown selection (no video screen) -----
function setupVideoSelectPage() {
    const select = document.getElementById('video-select-step');
    const btn = document.getElementById('submit-video-select');
    if (!select || !btn) return;

    function updateBtn() {
        btn.disabled = !select.value;
    }
    select.addEventListener('change', updateBtn);

    btn.addEventListener('click', async () => {
        const videoId = select.value;
        if (!videoId) return;
        const v = VIDEOS.find(x => x.id === videoId);
        selectedVideoId = videoId;
        selectedVideoName = v ? v.name : videoId;
        sawTutorial = Math.random() < 0.5;

        logEvent('video_selected', { video_id: videoId });
        await logSeminarSession(participantId, sawTutorial, null);

        if (sawTutorial) {
            logEvent('tutorial_page_shown', {});
            showPage('page-tutorial');
            setupTutorialPage();
        } else {
            logEvent('task_page_shown', { video_id: videoId });
            showTaskPageWithVideo();
        }
    });
}

// ----- Tutorial page -----
function setupTutorialPage() {
    const video = document.getElementById('tutorial-video-player');
    const check = document.getElementById('tutorial-watched-check');
    const continueBtn = document.getElementById('continue-after-tutorial');

    if (!video || !continueBtn) return;

    let progress = 0;
    video.addEventListener('timeupdate', () => {
        if (video.duration && video.duration > 0) {
            const p = video.currentTime / video.duration;
            if (p > progress) progress = p;
            if (progress >= 0.9) {
                check.disabled = false;
                check.checked = true;
                continueBtn.disabled = false;
            }
        }
    });
    video.addEventListener('ended', () => {
        check.disabled = false;
        check.checked = true;
        continueBtn.disabled = false;
    });

    continueBtn.addEventListener('click', () => {
        logEvent('tutorial_completed', {});
        showTaskPageWithVideo();
    });
}

function showTaskPageWithVideo() {
    const nameEl = document.getElementById('task-selected-video-name');
    if (nameEl && selectedVideoName) nameEl.textContent = selectedVideoName;
    logEvent('task_page_shown', { video_id: selectedVideoId });
    showPage('page-task');
    setupTaskPage();
}

// ----- Task page (no dashboard; video already chosen on video-select step) -----
function setupTaskPage() {
    const textarea = document.getElementById('task-reflection-text');
    const wordCountEl = document.getElementById('task-word-count');
    const generateBtn = document.getElementById('task-generate-btn');
    const loadingSpinner = document.getElementById('task-loading-spinner');
    const loadingText = document.getElementById('task-loading-text');
    const feedbackSection = document.getElementById('task-feedback-section');
    const goToSurveyBtn = document.getElementById('task-go-to-survey');

    function updateWordCount() {
        const n = (textarea.value.trim().split(/\s+/).filter(w => w.length).length);
        if (wordCountEl) wordCountEl.textContent = n + (currentLanguage === 'de' ? ' Wörter' : ' words');
        if (generateBtn) generateBtn.disabled = n < 50;
    }
    if (textarea) textarea.addEventListener('input', updateWordCount);
    updateWordCount();

    if (!generateBtn) return;
    generateBtn.addEventListener('click', async () => {
        const videoId = selectedVideoId;
        const reflection = textarea.value.trim();
        if (!videoId || !reflection) return;

        const wordCount = reflection.split(/\s+/).filter(w => w.length).length;
        if (wordCount < 200) {
            showAlert(currentLanguage === 'de' ? 'Bitte mindestens 400 Wörter schreiben.' : 'Please write at least 400 words.', 'warning');
            return;
        }

        generateBtn.disabled = true;
        loadingSpinner.classList.remove('d-none');
        loadingSpinner.classList.add('d-flex');
        const t = translations[currentLanguage] || translations.en;
        let msgIndex = 0;
        const loadingInterval = setInterval(() => {
            msgIndex = (msgIndex + 1) % (t.loading_messages?.length || 1);
            if (loadingText) loadingText.textContent = t.loading_messages?.[msgIndex] || '...';
        }, 4000);

        try {
            const analysisResult = await analyzeReflectionDistribution(reflection, currentLanguage);
            const isNonRelevant = (analysisResult.percentages_priority?.professional_vision ?? 0) < 10;
            const isVeryShort = wordCount < 200;

            if (isVeryShort || isNonRelevant) {
                const msg = currentLanguage === 'de'
                    ? 'Ihr Text ist zu kurz oder bezieht sich nicht auf das Unterrichtsvideo. Bitte mindestens 400 Wörter über das Video schreiben.'
                    : 'Your text is too short or does not relate to the teaching video. Please write at least 400 words about the video.';
                document.getElementById('task-feedback-extended-content').innerHTML = '<div class="alert alert-warning">' + msg + '</div>';
                document.getElementById('task-feedback-short-content').innerHTML = '<div class="alert alert-warning">' + msg + '</div>';
                feedbackSection.classList.remove('d-none');
            } else {
                displayAnalysisDistribution(analysisResult);
                const [extendedFeedback, shortFeedback] = await Promise.all([
                    generateWeightedFeedback(reflection, currentLanguage, 'academic', analysisResult),
                    generateWeightedFeedback(reflection, currentLanguage, 'user-friendly', analysisResult)
                ]);
                await saveReflectionToDatabase({
                    video_id: videoId,
                    reflection_text: reflection,
                    analysisResult,
                    extendedFeedback,
                    shortFeedback
                });
                document.getElementById('task-feedback-extended-content').innerHTML = formatStructuredFeedback(extendedFeedback, analysisResult);
                document.getElementById('task-feedback-short-content').innerHTML = formatStructuredFeedback(shortFeedback, analysisResult);
                feedbackSection.classList.remove('d-none');
                taskState.feedbackGenerated = true;
                await logSeminarSession(participantId, sawTutorial, videoId);
                logEvent('feedback_generated_successfully', {
                    video_id: videoId,
                    reflection_length: reflection.length,
                    word_count: wordCount,
                    language: currentLanguage
                });
                startFeedbackViewing('extended');
                setupFeedbackTabTracking();
                setupConceptClickTracking();
            }
        } catch (err) {
            console.error(err);
            showAlert(err.message || 'Feedback generation failed.', 'danger');
        } finally {
            clearInterval(loadingInterval);
            generateBtn.disabled = false;
            loadingSpinner.classList.add('d-none');
        }
    });

    goToSurveyBtn.addEventListener('click', async () => {
        endFeedbackViewing(taskState.currentFeedbackType);
        const finalText = document.getElementById('task-reflection-text')?.value?.trim() || null;
        logEvent('final_submission', { video_id: selectedVideoId, reflection_length: finalText ? finalText.length : 0 });
        if (taskState.currentReflectionId) await markReflectionSubmitted(taskState.currentReflectionId, finalText);
        await logSeminarSession(participantId, sawTutorial, selectedVideoId, COMPLETION_CODE);
        logEvent('post_survey_link_clicked', { survey_verification_code: COMPLETION_CODE });
        showPage('page-postsurvey');
    });
}

function setupFeedbackTabTracking() {
    const extendedTab = document.querySelector('#task-feedback-tabs [data-bs-target="#task-feedback-extended"]');
    const shortTab = document.querySelector('#task-feedback-tabs [data-bs-target="#task-feedback-short"]');
    if (extendedTab) {
        extendedTab.addEventListener('click', () => {
            endFeedbackViewing(taskState.currentFeedbackType);
            startFeedbackViewing('extended');
        });
    }
    if (shortTab) {
        shortTab.addEventListener('click', () => {
            endFeedbackViewing(taskState.currentFeedbackType);
            startFeedbackViewing('short');
        });
    }
}

function setupConceptClickTracking() {
    const container = document.getElementById('task-feedback-section');
    if (!container) return;
    container.querySelectorAll('.feedback-heading').forEach((el, i) => {
        const sectionClass = el.closest('.feedback-section')?.className || '';
        let concept = 'other';
        if (sectionClass.includes('description')) concept = 'description';
        else if (sectionClass.includes('explanation')) concept = 'explanation';
        else if (sectionClass.includes('prediction')) concept = 'prediction';
        const conceptName = el.textContent.trim() || concept;
        el.style.cursor = 'pointer';
        el.addEventListener('click', () => {
            logEvent('concept_explanation_clicked', {
                video_id: selectedVideoId,
                concept_name: conceptName,
                concept_type: concept
            });
        });
    });
}

window.addEventListener('beforeunload', () => {
    if (taskState.currentFeedbackType && taskState.currentFeedbackStartTime) endFeedbackViewing(taskState.currentFeedbackType);
});

// ----- Analysis & feedback (same logic as alpha/beta) -----
function createSentenceWindows(text) {
    const sentences = text.match(/[^\.!?]+[\.!?]+/g) || [text];
    const clean = sentences.map(s => s.trim()).filter(s => s.length > 0);
    const windows = [];
    let id = 1;
    for (let i = 0; i < clean.length; i += 3) {
        const count = Math.min(3, clean.length - i);
        const windowText = clean.slice(i, i + count).join(' ');
        if (windowText.length >= 20) {
            windows.push({ id: 'chunk_' + String(id++).padStart(3, '0'), text: windowText, sentence_count: count, start_position: i });
        }
    }
    return windows.length ? windows : [{ id: 'chunk_001', text: text, sentence_count: 1, start_position: 0 }];
}

async function callBinaryClassifier(prompt) {
    const requestData = {
        model,
        messages: [
            { role: 'system', content: 'You are an expert teaching reflection analyst. Be conservative in your classifications - only respond \'1\' if you are clearly certain the criteria are met. Respond with ONLY \'1\' or \'0\'.' },
            { role: 'user', content: prompt }
        ],
        temperature: 0,
        max_tokens: 10
    };
    for (let attempt = 0; attempt < 3; attempt++) {
        try {
            const res = await fetch(OPENAI_API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestData) });
            if (!res.ok) continue;
            const data = await res.json();
            const out = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content || '').trim();
            if (out === '1' || out === '0') return parseInt(out);
            if (out.includes('1')) return 1;
            if (out.includes('0')) return 0;
        } catch (e) {}
    }
    return 0;
}

async function classifyDescription(windowText) {
    const prompt = `Task: Identify whether the following text belongs to the category "Description of Relevant Classroom Events."

Core Principle: Descriptions identify and differentiate observable classroom events based on educational knowledge, WITHOUT making evaluations, interpretations, or speculations.

Key Question: Has the person described relevant classroom events that provide insights into learning processes, learning activities, and/or teaching processes?

Definition: Descriptions identify and differentiate classroom events based on educational knowledge. Relevant events include both events initiated by teachers that affect student learning, and events initiated by students that are central to teacher action.

Code as "1" (Description) when the text contains:
* Identification and differentiation of observable classroom events
* Events relate to learning processes, learning activities, or teaching processes
* Uses neutral, observational language
* Events are observable (perceivable through senses, especially sight and hearing)

Code as "0" (Non-Description) when the text contains:
* Evaluations (indicators: "In my opinion...", "I think that...", "The teacher did well...")
* Interpretations (indicators: "This probably activates prior knowledge")
* Overgeneralizations (hasty conclusions based on few previous experiences)
* Speculations (indicators: "probably", "likely", use of subjunctive)
* Hypothetical or future actions (e.g., "I would have...", "If the teacher had done X/Y")
* Non-observable events (not perceivable through senses)
* Not about relevant classroom events

Coding Rules:
1. Be INCLUSIVE regarding relevant classroom events. If there are no concrete indicators that no relevant classroom event is described, assume a relevant event is present.
2. Consider only the individual segments - do not rely on prior knowledge from videos when coding.
3. A "1" is justified if parts of the text can be identified as "Description," even if other parts do not correspond to this category.

Positive Examples (Code as "1"):
1. "The teacher refers to the lesson topic: Binomial formulas"
2. "Students work on worksheets while the teacher walks through the rows"
3. "A student raises their hand"
4. "The teacher writes something on the board"
5. "The teacher goes through the rows"

Negative Examples (Code as "0"):
1. "The teacher probably wanted to activate prior knowledge" (speculation)
2. "I think the teacher did a good job explaining" (evaluation)
3. "The teacher should have given more time" (hypothetical action)
4. "The teacher probably wanted to..." (speculation)
5. "The students seem tired" (interpretation, not observable)

Output only "1" or "0" without any additional text or quotation marks.

Text to be evaluated: ${windowText}`;
    return await callBinaryClassifier(prompt);
}

async function classifyExplanation(windowText) {
    const prompt = `Task: Identify whether the following text belongs to the category "Explanation of Relevant Classroom Events."

Core Principle: Explanations connect observable classroom events with theories of effective teaching, focusing on WHY events occur.

Key Question: Has the person explained relevant classroom events that provide insights into learning processes, learning activities, and/or teaching processes? Note: Explanations focus on the CAUSE perspective.

Definition: Explanations connect observable classroom events (what is being explained) with theories of effective teaching. The focus is on WHY an event occurs. The event being explained must be observable (perceivable through senses, especially sight and hearing).

Code as "1" (Explanation) when the text contains:
* An observable classroom event connected with concrete educational science knowledge to explain it
* Educational science knowledge includes: principles of cognitive activation, clarity of learning goals, use of advance organizers, learning psychology theories (self-determination theory, Bloom's taxonomy, constructivism, social-cognitive learning theory)
* The explanation relates to relevant classroom events (learning processes, learning activities, or teaching processes)
* The event being explained must be observable (not hypothetical or future actions)

Code as "0" (Non-Explanation) when the text contains:
* What is being explained is not observable (hypothetical or future actions, e.g., "I would have...", "If the teacher had done X/Y")
* Explanation without reference to a relevant classroom event
* Explanation without reference to educational science knowledge
* Pure description without theoretical connection

Coding Rules:
1. Causal connectors like "because" or "since" are neither necessary nor sufficient for an explanation.
2. Interpret the term "educational science knowledge" BROADLY. Be very INCLUSIVE here. Even if uncertainty exists about whether educational science knowledge is present, code inclusively.
3. The event being explained must be observable but need not be explicitly named (e.g., "learning goals" instead of "setting learning goals").
4. If uncertainty exists about whether a segment should be coded as Explanation or Prediction, assign it to the "Prediction" category (as the higher category).
5. A "1" is justified if parts of the text can be identified as "Explanation," even if other parts do not correspond to this category.

Positive Examples (Code as "1"):
1. "The teacher's open question should cognitively activate students"
2. "This connection links today's learning goal with prior knowledge"
3. "Because open questions give students room for their own thoughts"
4. "Through repetition, students can better remember the conjugations" (relates to learning theory)
5. "The unclear instructions confused the students" (connects event to learning effect)

Negative Examples (Code as "0"):
1. "Because the teacher communicated expectations" (no educational theory)
2. "The teacher should use different methods" (hypothetical event)
3. "The teacher writes the topic on the board" (pure description, no explanation)
4. "Students work on the worksheet" (pure description, no explanation)
5. "I would have explained it differently" (hypothetical/future action)

Output only "1" or "0" without any additional text or quotation marks.

Text to be evaluated: ${windowText}`;
    return await callBinaryClassifier(prompt);
}

async function classifyPrediction(windowText) {
    const prompt = `Task: Identify whether the following text belongs to the category "Prediction."

Core Principle: Predictions estimate potential consequences of classroom events for students based on learning theories.

Key Question: Has the person predicted potential effects of relevant classroom events on the learning process of students? Note: Predictions focus on the CONSEQUENCE perspective.

Definition: Predictions estimate (possible, observable or non-observable) consequences of different classroom events for students based on learning theories.

Code as "1" (Prediction) when the text contains:
* Potential effects of relevant classroom events on student learning are predicted with reference to educational science knowledge about learning
* Predictions relate to relevant classroom events (learning processes, learning activities, or teaching processes)
* Effects on student learning, motivation, understanding, engagement, cognitive processes, emotional responses, academic performance, participation, retention
* Based on learning theories (interpreted broadly and inclusively)

Code as "0" (Non-Prediction) when the text contains:
* No effects on future student learning mentioned
* Prediction without reference to a classroom event
* Prediction without reference to educational science knowledge about learning
* Too vague or not connected to learning theory

Coding Rules:
1. Because it's about potential effects, statements about non-observable and future actions regarding consequences for student learning are allowed.
2. Use of subjunctive (e.g., "could") is neither necessary nor sufficient for a prediction.
3. If optional classroom events (e.g., other teacher actions) and their consequences for student learning are mentioned, these also count as predictions.
4. Interpret the term "learning theories" BROADLY. Be very INCLUSIVE here. Even statements like "This could increase motivation" are acceptable, even if not explicitly referring to a specific theory or model.
5. If uncertainty exists about whether a segment should be coded as Explanation or Prediction, assign it to the "Prediction" category (as the higher category).
6. A "1" is justified if parts of the text can be identified as "Prediction," even if other parts do not correspond to this category.

Positive Examples (Code as "1"):
1. "Teacher feedback could increase student learning motivation"
2. "This questioning strategy may help students identify knowledge gaps"
3. "Through this feedback, the students' learning motivation could grow"
4. "Following self-determination theory, stronger autonomy experience with tasks likely leads to stronger intrinsic motivation"
5. "This feedback could discourage future participation" (negative effect, but still a prediction about learning)

Negative Examples (Code as "0"):
1. "This creates a good working climate" (too vague, no learning theory)
2. "The teacher will continue the lesson" (no student learning effect)
3. "The students were engaged because..." (this is explanation, not prediction)
4. "The teacher writes on the board" (description, no prediction)
5. "This could be better" (too vague, no learning theory connection)

Output only "1" or "0" without any additional text or quotation marks.

Text to be evaluated: ${windowText}`;
    return await callBinaryClassifier(prompt);
}

function calculatePercentages(classificationResults) {
    const n = classificationResults.length;
    if (n === 0) {
        return { percentages_raw: { description: 0, explanation: 0, prediction: 0, professional_vision: 0 }, percentages_priority: { description: 0, explanation: 0, prediction: 0, other: 100, professional_vision: 0 }, weakest_component: 'Prediction' };
    }
    let rd = 0, re = 0, rp = 0;
    classificationResults.forEach(r => { if (r.description === 1) rd++; if (r.explanation === 1) re++; if (r.prediction === 1) rp++; });
    const raw = { description: Math.round((rd / n) * 1000) / 10, explanation: Math.round((re / n) * 1000) / 10, prediction: Math.round((rp / n) * 1000) / 10, professional_vision: Math.round(((rd + re + rp) / n) * 1000) / 10 };
    let pd = 0, pe = 0, pp = 0, po = 0;
    classificationResults.forEach(r => {
        if (r.description === 1) pd++; else if (r.explanation === 1) pe++; else if (r.prediction === 1) pp++; else po++;
    });
    const priority = { description: Math.round((pd / n) * 1000) / 10, explanation: Math.round((pe / n) * 1000) / 10, prediction: Math.round((pp / n) * 1000) / 10, other: Math.round((po / n) * 1000) / 10, professional_vision: Math.round(((pd + pe + pp) / n) * 1000) / 10 };
    const comp = { Description: priority.description, Explanation: priority.explanation, Prediction: priority.prediction };
    const weakest = Object.keys(comp).reduce((a, b) => comp[a] <= comp[b] ? a : b);
    return { percentages_raw: raw, percentages_priority: priority, weakest_component: weakest };
}

async function analyzeReflectionDistribution(reflection, language) {
    try {
        const windows = createSentenceWindows(reflection);
        const classificationResults = [];
        for (const w of windows) {
            const [description, explanation, prediction] = await Promise.all([
                classifyDescription(w.text),
                classifyExplanation(w.text),
                classifyPrediction(w.text)
            ]);
            classificationResults.push({ window_id: w.id, window_text: w.text, description, explanation, prediction });
        }
        const analysis = calculatePercentages(classificationResults);
        analysis.classificationResults = classificationResults;
        analysis.windows = windows;
        return analysis;
    } catch (e) {
        console.error(e);
        return { percentages_raw: { description: 30, explanation: 35, prediction: 25, professional_vision: 90 }, percentages_priority: { description: 30, explanation: 35, prediction: 25, other: 10, professional_vision: 90 }, weakest_component: 'Prediction', classificationResults: [], windows: [] };
    }
}

function getFeedbackPrompt(promptType, analysisResult) {
    const weakestComponent = analysisResult?.weakest_component || 'Prediction';
    const prompts = {
        'academic English': `You are a supportive yet rigorous teaching mentor providing feedback in a scholarly tone. Your feedback MUST be detailed, academic, and comprehensive, deeply integrating theory.

**Knowledge Base Integration:**
You MUST base your feedback on the theoretical framework of empirical teaching quality research. Specifically, use the process-oriented teaching-learning model (Seidel & Shavelson, 2007) or the three basic dimensions of teaching quality (Klieme, 2006) for feedback on description and explanation. For prediction, use self-determination theory (Deci & Ryan, 1993) or theories of cognitive and constructive learning (Atkinson & Shiffrin, 1968; Craik & Lockhart, 1972).

**CRITICAL: You MUST explicitly cite these theories using the (Author, Year) format. Do NOT cite any other theories.**

**MANDATORY WEIGHTED FEEDBACK STRUCTURE:**
1. **Weakest Area Focus**: Write 6-8 detailed, academic sentences ONLY for the weakest component (${weakestComponent}), integrating multiple specific suggestions and deeply connecting them to theory.
2. **Stronger Areas**: For the two stronger components, write EXACTLY 3-4 detailed sentences each (1 Strength, 1 Suggestion, 1 'Why' that explicitly connects to theory).
3. **Conclusion**: Write 2-3 sentences summarizing the key area for development.

**CRITICAL FOCUS REQUIREMENTS:**
- Focus ONLY on analysis skills, not teaching performance.
- Emphasize objective, non-evaluative observation for the Description section.

**FORMATTING:**
- Sections: "#### Description", "#### Explanation", "#### Prediction", "#### Conclusion"
- Sub-headings: "Strength:", "Suggestions:", "Why:"`,
        'user-friendly English': `You are a friendly teaching mentor providing feedback for a busy teacher who wants quick, practical tips.

**Style Guide - MUST BE FOLLOWED:**
- **Language**: Use simple, direct language. Avoid academic jargon completely.
- **Citations**: Do NOT include any in-text citations like (Author, Year).
- **Focus**: Give actionable advice. Do NOT explain the theory behind the advice.

**MANDATORY CONCISE FEEDBACK STRUCTURE:**
1. **Weakest Area Focus**: For the weakest component (${weakestComponent}), provide a "Good:" section with 1-2 sentences, and a "Tip:" section with a bulleted list of 2-3 clear, practical tips.
2. **Stronger Areas**: For the two stronger components, write a "Good:" section with one sentence and a "Tip:" section with one practical tip.
3. **No Conclusion**: Do not include a "Conclusion" section.

**FORMATTING:**
- Sections: "#### Description", "#### Explanation", "#### Prediction"
- Sub-headings: "Good:", "Tip:"`,
        'academic German': `Sie sind ein unterstützender, aber rigoroser Mentor, der Feedback in einem wissenschaftlichen Ton gibt. Ihr Feedback MUSS detailliert, akademisch und umfassend sein und die Theorie tief integrieren.

**Wissensbasierte Integration:**
Basieren Sie Ihr Feedback auf dem theoretischen Rahmen der empirischen Unterrichtsqualitätsforschung. Verwenden Sie das prozessorientierte Lehr-Lern-Modell (Seidel & Shavelson, 2007) oder die drei Grunddimensionen der Unterrichtsqualität (Klieme, 2006) für Feedback zu Beschreibung und Erklärung. Für die Vorhersage verwenden Sie die Selbstbestimmungstheorie der Motivation (Deci & Ryan, 1993) oder Theorien des kognitiven und konstruktiven Lernens (Atkinson & Shiffrin, 1968; Craik & Lockhart, 1972).

**KRITISCH: Sie MÜSSEN diese Theorien explizit im Format (Autor, Jahr) zitieren. Zitieren Sie KEINE anderen Theorien.**

**OBLIGATORISCHE GEWICHTETE FEEDBACK-STRUKTUR:**
1. **Fokus auf den schwächsten Bereich**: Schreiben Sie 6-8 detaillierte, akademische Sätze NUR für die schwächste Komponente (${weakestComponent}), mit mehreren spezifischen Vorschlägen und tiefen theoretischen Verbindungen.
2. **Stärkere Bereiche**: Für die beiden stärkeren Komponenten schreiben Sie GENAU 3-4 detaillierte Sätze (1 Stärke, 1 Vorschlag, 1 'Warum' mit explizitem Theoriebezug).
3. **Fazit**: Schreiben Sie 2-3 Sätze, die den wichtigsten Entwicklungsbereich zusammenfassen.

**KRITISCHE FOKUS-ANFORDERUNGEN:**
- Konzentrieren Sie sich NUR auf Analysefähigkeiten, nicht auf die Lehrleistung.
- Betonen Sie bei der Beschreibung eine objektive, nicht bewertende Beobachtung.

**FORMATIERUNG:**
- Abschnitte: "#### Beschreibung", "#### Erklärung", "#### Vorhersage", "#### Fazit"
- Unterüberschriften: "Stärke:", "Vorschläge:", "Warum:"`,
        'user-friendly German': `Sie sind ein freundlicher Mentor, der Feedback für einen vielbeschäftigten Lehrer gibt, der schnelle, praktische Tipps wünscht.

**Stilrichtlinie - MUSS BEFOLGT WERDEN:**
- **Sprache**: Verwenden Sie einfache, direkte Sprache. Vermeiden Sie akademischen Jargon vollständig.
- **Zitate**: Fügen Sie KEINE Zitate wie (Autor, Jahr) ein.
- **Fokus**: Geben Sie handlungsorientierte Ratschläge. Erklären Sie NICHT die Theorie hinter den Ratschlägen.

**OBLIGATORISCHE PRÄGNANTE FEEDBACK-STRUKTUR:**
1. **Fokus auf den schwächsten Bereich**: Geben Sie für die schwächste Komponente (${weakestComponent}) einen "Gut:"-Abschnitt mit 1-2 Sätzen und einen "Tipp:"-Abschnitt mit einer Stichpunktliste von 2-3 klaren, praktischen Tipps.
2. **Stärkere Bereiche**: Schreiben Sie für die beiden stärkeren Komponenten einen "Gut:"-Abschnitt mit einem Satz und einen "Tipp:"-Abschnitt mit einem praktischen Tipp.
3. **Kein Fazit**: Fügen Sie keinen "Fazit"-Abschnitt hinzu.

**FORMATIERUNG:**
- Abschnitte: "#### Beschreibung", "#### Erklärung", "#### Vorhersage"
- Unterüberschriften: "Gut:", "Tipp:"`
    };
    return prompts[promptType] || prompts['academic English'];
}

async function generateWeightedFeedback(reflection, language, style, analysisResult) {
    const promptType = `${style} ${language === 'en' ? 'English' : 'German'}`;
    const systemPrompt = getFeedbackPrompt(promptType, analysisResult);
    const pct = analysisResult.percentages_priority || {};
    const langInstr = language === 'en'
        ? 'IMPORTANT: You MUST respond in English. The entire feedback MUST be in English only.'
        : 'WICHTIG: Sie MÜSSEN auf Deutsch antworten. Das gesamte Feedback MUSS ausschließlich auf Deutsch sein.';
    const requestData = {
        model,
        messages: [
            { role: 'system', content: langInstr + '\n\n' + systemPrompt },
            { role: 'user', content: `Based on the analysis showing ${pct.description || 0}% description, ${pct.explanation || 0}% explanation, ${pct.prediction || 0}% prediction (Professional Vision: ${pct.professional_vision || 0}%) + Other: ${pct.other || 0}% = 100%, provide feedback for this reflection:\n\n${reflection}` }
        ],
        temperature: 0.3,
        max_tokens: 2000
    };
    const res = await fetch(OPENAI_API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestData) });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    let feedback = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '';
    if (style === 'user-friendly') feedback = feedback.replace(/\s*\([^)]+\d{4}\)/g, '');
    return feedback;
}

function formatStructuredFeedback(text, analysisResult) {
    if (!text) return '';
    let s = text.trim().replace(/\r\n/g, '\n').replace(/\*\*(.*?)\*\*/g, '$1');
    const sections = s.split(/####\s*/).filter(x => x.trim());
    const sectionMap = { 'Description': 'description', 'Beschreibung': 'description', 'Explanation': 'explanation', 'Erklärung': 'explanation', 'Prediction': 'prediction', 'Vorhersage': 'prediction', 'Conclusion': 'overall', 'Fazit': 'overall' };
    const keywords = ['Strength:', 'Stärke:', 'Suggestions:', 'Vorschläge:', 'Why:', 'Warum:', 'Good:', 'Gut:', 'Tip:', 'Tipp:'];
    return sections.map(sec => {
        const lines = sec.trim().split('\n');
        const heading = lines.shift().trim();
        let body = lines.join('\n').trim();
        let sectionClass = 'other';
        for (const k in sectionMap) { if (heading.toLowerCase().startsWith(k.toLowerCase())) { sectionClass = sectionMap[k]; break; } }
        keywords.forEach(kw => { body = body.replace(new RegExp('^(' + kw.replace(':', '\\:') + ')', 'gm'), '<span class="feedback-keyword">' + kw + '</span>'); });
        body = body.replace(/\n/g, '<br>');
        return '<div class="feedback-section feedback-section-' + sectionClass + '"><h4 class="feedback-heading">' + heading + '</h4><div class="section-content">' + body + '</div></div>';
    }).join('');
}

function displayAnalysisDistribution(analysisResult) {
    const raw = analysisResult.percentages_raw || analysisResult.percentages || {};
    const isDe = currentLanguage === 'de';
    let container = document.getElementById('analysis-distribution-task');
    if (!container) {
        container = document.createElement('div');
        container.id = 'analysis-distribution-task';
        container.className = 'analysis-distribution-professional mb-3';
        const tabs = document.getElementById('task-feedback-tabs');
        if (tabs && tabs.parentNode) tabs.parentNode.insertBefore(container, tabs);
    }
    if ((raw.professional_vision || 0) <= 5) {
        container.innerHTML = '<div class="professional-analysis-summary"><h6>' + (isDe ? 'Analyse Ihrer Reflexion' : 'Analysis of Your Reflection') + '</h6><p class="analysis-text text-warning">' + (isDe ? 'Ihr Text bezieht sich nicht auf Professional Vision.' : 'Your text does not relate to professional vision.') + '</p></div>';
        return;
    }
    container.innerHTML = '<div class="professional-analysis-summary"><h6>' + (isDe ? 'Analyse Ihrer Reflexion' : 'Analysis of Your Reflection') + '</h6><p class="analysis-text">' + (isDe ? 'Ihre Reflexion enthält ' + (raw.description || 0) + '% Beschreibung, ' + (raw.explanation || 0) + '% Erklärung und ' + (raw.prediction || 0) + '% Vorhersage.' : 'Your reflection contains ' + (raw.description || 0) + '% description, ' + (raw.explanation || 0) + '% explanation, and ' + (raw.prediction || 0) + '% prediction.') + '</p></div>';
}

// ----- Init -----
document.addEventListener('DOMContentLoaded', () => {
    initSupabase();
    // Single delegated listener for language buttons (each page has its own switcher)
    document.addEventListener('click', (e) => {
        const btn = e.target.closest && e.target.closest('[data-lang]');
        if (btn && (btn.getAttribute('data-lang') === 'en' || btn.getAttribute('data-lang') === 'de')) {
            currentLanguage = btn.getAttribute('data-lang');
            renderLanguageSwitcher();
            applyTranslations();
        }
    });
    renderLanguageSwitcher();
    applyTranslations();
    setupDataCollectionPage();
    setupIdPage();
    setupVideoSelectPage();
    showPage('page-datacollection');
});
