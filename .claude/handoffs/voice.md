# Handoff: voice

Branch: `claude/magical-goodall-v0t9ci`

## Finished
- Kiko speaks out loud (Web Speech API, device voice, pitch 1.9, rate 1.12).
- 240 lines in `www/voice.js`: banter, sarcastic, cheer, motivational (20 each x en / tl / tg).
- Wrong answer -> banter or sarcastic (more sarcastic after 3+ misses); correct -> cheer or motivational.
- Results popup (`celebrate()` in app.js) reads score, percent, title and text.
- Settings > Buddy has a "Buddy voice" on/off checkbox (own key `cscoach.voice`, profile data unchanged).
- Gemini TTS key works (saved as a network secret, header x-goog-api-key). Made 6 samples (voice Leda, cute anime style prompt) in `.claude/samples/`; user is still reviewing them.

## Files changed
www/voice.js (new), www/pet.js, www/app.js, www/i18n.js, www/index.html, www/sw.js (cache v44, voice.js added), .claude/samples/*.mp3

## Decisions
- Pre-recorded clips chosen over device voices so every device sounds the same. Device voice stays as fallback.
- User wants to avoid spending Claude credits: generate the 240 clips with their own Gemini key via a script they run (or AI Studio at aistudio.google.com/generate-speech).

## Unfinished / next step
1. User picks voice and style after hearing the samples.
2. Write `tools/make-voice-clips.py`: read lines from voice.js, call Gemini TTS (gemini-2.5-flash-preview-tts, slow batch, free tier gives 429s), save mp3 to `www/audio/<lang>/<kind>_<n>.mp3`.
3. Make voice.js play the clip for each line, fall back to speechSynthesis if missing; add clips to sw.js cache list and bump the cache version.
4. Delete `.claude/samples/` before the PR.

## Not verified
Real-device voice quality (only tested with a fake speech engine). Samples not heard by me.
