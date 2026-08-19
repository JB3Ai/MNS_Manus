"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const express_1 = __importDefault(require("express"));
const node_path_1 = __importDefault(require("node:path"));
const node_url_1 = require("node:url");
const fs_1 = __importDefault(require("fs"));
const dotenv_1 = __importDefault(require("dotenv"));
const genai_1 = require("@google/genai");
dotenv_1.default.config();
const port = process.env.PORT || 3000;
const apiKey = process.env.GEMINI_API_KEY;
const isPassenger = typeof PhusionPassenger !== 'undefined' || Boolean(process.env.IN_PASSENGER);
if (typeof PhusionPassenger !== 'undefined') {
    PhusionPassenger.configure({ autoInstall: false });
}
const ai = apiKey ? new genai_1.GoogleGenAI({ apiKey }) : null;
const app = (0, express_1.default)();
function loadEnvironmentFile(filePath) {
    if (!fs_1.default.existsSync(filePath))
        return;
    for (const rawLine of fs_1.default.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line || line.startsWith('#'))
            continue;
        const separator = line.indexOf('=');
        if (separator < 1)
            continue;
        const key = line.slice(0, separator).trim();
        let value = line.slice(separator + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }
        process.env[key] = value;
    }
}
const nmsAppRoot = process.env.NMS_APP_ROOT || '/home/appjbaic/repositories/nms';
let nmsAppPromise;
function loadNmsApp() {
    if (!nmsAppPromise) {
        loadEnvironmentFile(node_path_1.default.join(nmsAppRoot, '.env'));
        process.env.NMS_EMBEDDED = '1';
        const nmsEntrypoint = (0, node_url_1.pathToFileURL)(node_path_1.default.join(nmsAppRoot, 'index.js')).href;
        nmsAppPromise = import(nmsEntrypoint).then((module) => {
            if (!module.app)
                throw new Error('NMS entrypoint does not export an Express app.');
            return module.app;
        });
    }
    return nmsAppPromise;
}
app.use('/nms', (req, res, next) => {
    loadNmsApp()
        .then((nmsApp) => nmsApp(req, res, next))
        .catch(next);
});
const PHASES_DATA = [
    {
        code: 1,
        name: 'PEAK-BASS',
        vibe: 'Warehouse Techno & Rave Heavyweights',
        description: 'Maximum velocity. Tailored for late-night concrete spaces with heavy bass reinforcement.',
        bpm_range: [140, 165],
    },
    {
        code: 2,
        name: 'MAIN-FLOOR',
        vibe: 'Groove, Flow & Sub-Genre Lineage',
        description: 'The absolute sweet spot. High syncopation, crisp 2-step patterns, and driving warehouse energy.',
        bpm_range: [124, 135],
    },
    {
        code: 3,
        name: 'SUNRISE',
        vibe: 'Melodic Electronic Transitions',
        description: 'Lush, warm chords and broken beats catching the morning light as the room breathes.',
        bpm_range: [110, 123],
    },
    {
        code: 4,
        name: 'ZONED-OUT',
        vibe: 'Ambient Soundscapes & Afterhours Chill',
        description: 'Deep spatial exploration. Heavy tape echo, vinyl crackle, and beautiful downtempo sound fields.',
        bpm_range: [70, 105],
    },
];
const GENRES_MATRIX = [
    { code: 'w-techno', name: 'Warehouse Techno', phase: 1, bpm: [145, 160], desc: 'Heavy industrial four-on-the-floor pulse straight from East London squats.' },
    { code: 'neurofunk', name: 'Neurofunk', phase: 1, bpm: [170, 180], desc: 'Aggressive, tech-driven drum and bass featuring complex sound-designed basslines.' },
    { code: 'acid-core', name: 'Acid Core', phase: 1, bpm: [145, 165], desc: 'Searing 303 squelches riding a high-velocity kicks platform.' },
    { code: 'hardcore-break', name: 'Hardcore Breakbeat', phase: 1, bpm: [150, 170], desc: 'Vintage 1992 rave energy with sped-up breakbeats and euphoric stabs.' },
    { code: 'techstep', name: 'Techstep', phase: 1, bpm: [168, 176], desc: 'Dark, cold, and algorithmic drum and bass with an industrial footprint.' },
    { code: 'industrial-bass', name: 'Industrial Bass', phase: 1, bpm: [140, 155], desc: 'Low-end distortions mixed with heavy cinematic metal impacts.' },
    { code: 'schranz', name: 'Hard Schranz', phase: 1, bpm: [150, 165], desc: 'Mechanized, loop-driven techno firing at relentless tempos.' },
    { code: 'cyber-punk-club', name: 'Cyber Club', phase: 1, bpm: [135, 150], desc: 'Gritty synthesizer-driven club music for subterranean bunkers.' },
    { code: 'darkcore', name: 'Darkcore', phase: 1, bpm: [160, 175], desc: 'Heavy breakbeats layered with dark horror movie samples and deep sub-bass.' },
    { code: 'breakcore', name: 'Breakcore', phase: 1, bpm: [170, 190], desc: 'Chaotic, chopped-up amen breaks operating at frantic tempos.' },
    { code: 'hardstyle-uk', name: 'UK Hardstyle', phase: 1, bpm: [150, 160], desc: 'Reverberating reverse-bass kicks with clean rave leads.' },
    { code: 'footwork-uk', name: 'London Footwork', phase: 1, bpm: [155, 165], desc: 'Hypnotic 160bpm syncopations blended with UK sound system elements.' },
    { code: 'jumpup', name: 'Jump-Up DNB', phase: 1, bpm: [172, 178], desc: 'Energetic, clean bass hooks paired with direct rolling drums.' },
    { code: 'uk-garage', name: 'UK Garage (2-Step)', phase: 2, bpm: [130, 140], desc: 'Classic syncopated 90s swinging rhythms with lush soulful vocal chops.' },
    { code: 'tech-house', name: 'Tech House', phase: 2, bpm: [124, 130], desc: 'Steady house groove meets the hypnotic structural elements of techno.' },
    { code: 'deep-house-london', name: 'London Deep House', phase: 2, bpm: [120, 125], desc: 'Atmospheric, jazz-infused chords driving a clean, late-night pulse.' },
    { code: 'minimal-audio', name: 'Minimal Audio', phase: 2, bpm: [124, 132], desc: 'Stripped-back microhouse tracks focused on micro-percussions and modular ticks.' },
    { code: 'grime-inst', name: 'Grime Instrumental', phase: 2, bpm: [138, 142], desc: 'Raw, jagged 140bpm square waves originating from Bow, East London.' },
    { code: 'dubstep-classic', name: 'Classic Dubstep', phase: 2, bpm: [138, 142], desc: 'Pure 140bpm spatial meditation with deep sub-bass weight, Croydon lineage.' },
    { code: 'funky-uk', name: 'UK Funky', phase: 2, bpm: [124, 132], desc: 'Tribal Afro-house percussive rhythms layered with British club melodies.' },
    { code: 'bassline', name: 'Bassline / Niche', phase: 2, bpm: [130, 140], desc: 'Fast, warping bassline tracking alongside crisp 4x4 garage drums.' },
    { code: 'progressive-uk', name: 'UK Progressive', phase: 2, bpm: [126, 132], desc: 'Evolving melodic soundscapes moving across steady progressive structures.' },
    { code: 'electro-clash', name: 'Electro Clash', phase: 2, bpm: [122, 130], desc: 'Gritty, punk-influenced sawtooth bass loops and analog drum machines.' },
    { code: 'tribal-groove', name: 'Tribal Groove', phase: 2, bpm: [124, 132], desc: 'Hypnotic drum ensembles layered over tight modern club basslines.' },
    { code: 'bumpy-house', name: 'Bumpy House', phase: 2, bpm: [124, 130], desc: 'Heavy organ basslines backed by swinging US-style garage loops.' },
    { code: 'speed-garage', name: 'Speed Garage', phase: 2, bpm: [130, 138], desc: 'Accelerated house grooves complete with warped ragga bass dropboards.' },
    { code: 'liquid-dnb', name: 'Liquid Drum & Bass', phase: 3, bpm: [170, 178], desc: 'Melodic, ambient soundscapes backed by smooth rolling drum patterns.' },
    { code: 'breakbeat-prog', name: 'Progressive Breaks', phase: 3, bpm: [120, 132], desc: 'Lush atmospheric pads resting over broken syncopated grooves.' },
    { code: 'organic-house', name: 'Organic House', phase: 3, bpm: [118, 124], desc: 'Warm acoustic instrumentation weaving through natural house elements.' },
    { code: 'balearic-beat', name: 'Balearic Beat', phase: 3, bpm: [100, 118], desc: 'Sun-soaked open-air club music blending chillout textures with gentle grooves.' },
    { code: 'ambient-house', name: 'Ambient House', phase: 3, bpm: [110, 122], desc: 'Dreamy synth washes tracking alongside relaxed house foundations.' },
    { code: 'dream-synth', name: 'Dream Synth', phase: 3, bpm: [95, 115], desc: 'Bright nostalgic chords moving through cinematic sound environments.' },
    { code: 'afro-house-uk', name: 'UK Afro-House', phase: 3, bpm: [118, 126], desc: 'Warm hypnotic polyrhythms combined with modern British engineering.' },
    { code: 'chillstep', name: 'Chillstep', phase: 3, bpm: [130, 140], desc: 'Slow, half-time rhythms carrying vast delay structures and gentle basslines.' },
    { code: 'cosmic-disco', name: 'Cosmic Disco', phase: 3, bpm: [110, 122], desc: 'Space-age arpeggios processing through tape delays and warm bass pads.' },
    { code: 'italo-groove', name: 'Italo Groove', phase: 3, bpm: [118, 125], desc: 'Bright analog synthesizers performing uplifting retro-future progressions.' },
    { code: 'nu-soul-club', name: 'Nu-Soul Club', phase: 3, bpm: [95, 115], desc: 'Silky chord structures layered over broken soul beat patterns.' },
    { code: 'synthwave-london', name: 'London Synthwave', phase: 3, bpm: [90, 112], desc: 'Cinematic night-driving music capturing retro 80s aesthetics.' },
    { code: 'jazzy-broken', name: 'Jazzy Broken Beat', phase: 3, bpm: [110, 125], desc: 'Complex syncopated drum patterns supporting live Fender Rhodes structures.' },
    { code: 'ambient-drone', name: 'Ambient Drone', phase: 4, bpm: [60, 80], desc: 'Continuous texture fields removing rhythm entirely for pure sound submersion.' },
    { code: 'trip-hop', name: 'Bristol Trip-Hop', phase: 4, bpm: [70, 100], desc: 'Slow smoky jazz breaks layered with heavy vinyl crackle and dub bass loops.' },
    { code: 'lofi-beats', name: 'Lo-Fi Study Beats', phase: 4, bpm: [70, 90], desc: 'Nostalgic, dusty tape-saturated chords drifting over relaxed rhythms.' },
    { code: 'downtempo-chilled', name: 'Downtempo Chill', phase: 4, bpm: [80, 105], desc: 'Beautiful acoustic elements drifting over relaxed, organic arrangements.' },
    { code: 'dub-ambient', name: 'Ambient Dub', phase: 4, bpm: [60, 90], desc: 'Massive cavernous tape echoes filtering through structural sub-bass fields.' },
    { code: 'vaporwave', name: 'Vaporwave', phase: 4, bpm: [60, 100], desc: 'Slowed down consumer aesthetics paired with nostalgic shopping mall acoustics.' },
    { code: 'cinematic-chill', name: 'Cinematic Chill', phase: 4, bpm: [70, 95], desc: 'Vast orchestral elements blending into quiet synthetic sound environments.' },
    { code: 'illbient', name: 'Illbient', phase: 4, bpm: [60, 90], desc: 'Gritty, dark ambient textures tracking alongside distorted street grooves.' },
    { code: 'glitch-hop', name: 'Glitch Hop', phase: 4, bpm: [90, 110], desc: 'Slipped micro-timing cuts mapping over heavy experimental structures.' },
    { code: 'space-music', name: 'Deep Space Drone', phase: 4, bpm: [60, 80], desc: 'Subterranean synth frequencies charting vast cosmic expansion echoes.' },
    { code: 'minimal-ambient', name: 'Minimal Ambient', phase: 4, bpm: [60, 85], desc: 'Isolated piano single-notes decaying into quiet electronic noise floors.' },
    { code: 'psydub', name: 'Psydub World', phase: 4, bpm: [80, 110], desc: 'Evolving algorithmic filters sweeping across foundational global roots.' },
];
const history = [];
const vibeLinks = new Map();
function createTrackId() {
    return `dbx-${Math.random().toString(36).slice(2, 9)}`;
}
function generateWaveform(size = 64) {
    return Array.from({ length: size }, () => Math.random() * 0.8 + 0.2);
}
function selectGenre(phase, genreCode) {
    return (GENRES_MATRIX.find((genre) => genre.code === genreCode) ||
        GENRES_MATRIX.find((genre) => genre.phase === phase) ||
        GENRES_MATRIX[0]);
}
function selectPhase(phase) {
    return PHASES_DATA.find((item) => item.code === phase) || PHASES_DATA[0];
}
function createTrackMetadata(phaseCode, atmosphere, genre, phase) {
    const bpm = Math.floor((phase.bpm_range[0] + phase.bpm_range[1]) / 2);
    return {
        name: `${genre.name} - ${atmosphere.toUpperCase()} CUT`,
        track_id: createTrackId(),
        phase: phase.code,
        atmosphere,
        bpm,
        processing_tier: 'lyria-pro-hq',
        cost_per_hour: '0.045',
        duration_s: 45,
        created_at: new Date().toISOString(),
        waveform: generateWaveform(),
        seed: {
            phase: phaseCode,
            atmosphere,
            bpm,
            genre_code: genre.code,
            random_state: Math.floor(Math.random() * 999999),
        },
        genre: {
            name: genre.name,
            code: genre.code,
            phase: genre.phase,
            bpm: genre.bpm,
        },
    };
}
app.use(express_1.default.json({ limit: '1mb' }));
const clientBuildDir = node_path_1.default.join(__dirname, 'client', 'build');
const publicDir = node_path_1.default.join(__dirname, 'public');
app.use(express_1.default.static(fs_1.default.existsSync(clientBuildDir) ? clientBuildDir : publicDir));
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', project: 'The DukeBox of London' });
});
app.get('/api/phases', (_req, res) => {
    res.json(PHASES_DATA);
});
app.get('/api/genres', (req, res) => {
    const phase = req.query.phase ? Number(req.query.phase) : null;
    res.json(phase ? GENRES_MATRIX.filter((genre) => genre.phase === phase) : GENRES_MATRIX);
});
app.get('/api/genres/:code', (req, res) => {
    const genre = GENRES_MATRIX.find((item) => item.code.toLowerCase() === req.params.code.toLowerCase());
    if (!genre) {
        res.status(404).json({ error: 'Genre not found' });
        return;
    }
    res.json(genre);
});
app.get('/api/stats', (_req, res) => {
    const loved = history.filter((track) => track.loved).length;
    const pinned = history.filter((track) => track.pinned).length;
    res.json({
        total_tracks: history.length,
        loved,
        pinned,
        phase_counts: {
            1: history.filter((track) => track.phase === 1).length,
            2: history.filter((track) => track.phase === 2).length,
            3: history.filter((track) => track.phase === 3).length,
            4: history.filter((track) => track.phase === 4).length,
        },
        session_cost: Number((history.length * 0.045).toFixed(4)),
    });
});
app.get('/api/history', (req, res) => {
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    res.json(history.slice(-limit).reverse());
});
app.post('/api/history/action', (req, res) => {
    const { track_id, action } = req.body ?? {};
    const track = history.find((item) => item.track_id === track_id);
    if (track) {
        if (action === 'love')
            track.loved = true;
        if (action === 'pin')
            track.pinned = true;
        if (action === 'dislike')
            track.disliked = true;
    }
    res.json({ status: 'ok', action, track_id });
});
app.post('/api/vibe-link', (req, res) => {
    const code = Math.random().toString(36).slice(2, 8).toUpperCase();
    vibeLinks.set(code, { ...req.body, code, created_at: new Date().toISOString(), opens: 0 });
    res.json({ code, url: `/?vibe=${code}` });
});
app.get('/api/vibe-link/:code', (req, res) => {
    const code = req.params.code.toUpperCase();
    const link = vibeLinks.get(code);
    if (!link) {
        res.status(404).json({ error: 'Vibe link not found' });
        return;
    }
    link.opens = Number(link.opens || 0) + 1;
    res.json(link);
});
app.post('/api/conduct', async (req, res) => {
    const { phase, atmosphere, genre_code } = req.body ?? {};
    const phaseCode = Number(phase) || 1;
    const targetPhase = selectPhase(phaseCode);
    const targetGenre = selectGenre(targetPhase.code, genre_code);
    const targetAtmosphere = atmosphere || 'balanced';
    const trackMetadata = createTrackMetadata(targetPhase.code, targetAtmosphere, targetGenre, targetPhase);
    if (!ai) {
        res.status(503).json({
            error: 'GEMINI_API_KEY is not configured.',
            message: 'Set GEMINI_API_KEY in cPanel Node.js environment variables.',
            previewTrack: trackMetadata,
        });
        return;
    }
    try {
        const architecturalBrief = [
            'You are a legendary London audio producer running an underground pirate radio station from an abandoned warehouse.',
            'Generate a fully rendered, production-grade electronic music track matching this specification:',
            `Music genre architecture: ${targetGenre.name}. Identity: ${targetGenre.desc}`,
            `Energy profile: Phase ${targetPhase.code} (${targetPhase.name}). Characteristics: ${targetPhase.vibe}. ${targetPhase.description}`,
            `Atmospheric texture field: ${targetAtmosphere}.`,
            'Engineering rules: heavy sound system weight, professional sub-bass balance, crisp transient definition, authentic British club culture mixing lineage, perfect loops, non-clipping transitions, and wide high-end stereo fields.',
            'Output requirement: return a rich audio rendering context matching this aesthetic profile.',
        ].join('\n');
        const result = await ai.models.generateContent({
            model: 'lyria-3-pro-preview',
            contents: [{ role: 'user', parts: [{ text: architecturalBrief }] }],
            config: {
                responseModalities: ['AUDIO', 'TEXT'],
            },
        });
        const candidate = result.candidates?.[0];
        const parts = candidate?.content?.parts ?? [];
        const audioPart = parts.find((part) => part.inlineData?.data);
        const textPart = parts.find((part) => typeof part.text === 'string');
        if (!audioPart?.inlineData?.data) {
            res.status(502).json({
                error: 'No audio payload returned by model.',
            });
            return;
        }
        const track = {
            ...trackMetadata,
            audioData: audioPart.inlineData,
            lyrics: textPart?.text ?? 'Instrumental stream generated.',
        };
        history.push(track);
        res.json(track);
    }
    catch (error) {
        console.error('Conduct endpoint failed:', error);
        res.status(500).json({
            error: 'Neural Buffer Error: Transition Failed.',
        });
    }
});
app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'API route not found' });
});
app.get(/.*/, (_req, res) => {
    res.sendFile(node_path_1.default.join(fs_1.default.existsSync(clientBuildDir) ? clientBuildDir : publicDir, 'index.html'));
});
if (isPassenger || require.main === module) {
    const listenTarget = isPassenger ? 'passenger' : port;
    app.listen(listenTarget, () => {
        console.log(`DukeBox Node.js server live on ${isPassenger ? 'Passenger socket' : `port ${port}`}`);
    });
}
module.exports = app;
