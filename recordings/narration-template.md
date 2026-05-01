# Voiceover Script Template

Use this template for every demo recording session that includes narration.
Fill it out before recording — the `narrative` field doubles as the ElevenLabs TTS input.

---

## Session Info

- **Product:** Renew PMS
- **Date:** YYYY-MM-DD
- **Voice:** Daniel (ElevenLabs `onwK4e9ZLuTAKqWW03F9`) — Steady Broadcaster
- **Model:** `eleven_turbo_v2_5`
- **Output file:** `recordings/renew-pms-[feature]-v1.mp4`

---

## Cards

### Card 01
- **Step:** Step 01 of 06
- **Title:** [Feature Title]
- **Narrative:** [25–35 words. One situation, one outcome. Present tense. No jargon.]
  > _Example: "When equipment breaks or an issue arises, any staff member can submit a maintenance request directly from their device — in under a minute. No emails, no phone calls. The request lands in the admin queue instantly."_

### Card 02
- **Step:** Step 02 of 06
- **Title:** [Feature Title]
- **Narrative:** [25–35 words.]

### Card 03
...

---

## Narration Writing Rules

1. **25–35 words per card.** Reads in ~12–16s at a natural pace — enough to bridge the title card and the first few seconds of the clip.
2. **One situation → one outcome.** Set the scene, then name the result. No multi-part explanations.
3. **Present tense.** "The admin assigns…" not "The admin will assign…"
4. **Avoid filler words.** No "simply", "easily", "just", "basically".
5. **The em dash is your friend.** Use `—` to create a natural pause mid-sentence.
6. **End on a fact, not a promise.** "The request lands in the queue instantly." not "making workflows seamless."

---

## ElevenLabs Generation

```bash
curl -s \
  -H "xi-api-key: $ELEVENLABS_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"text\": \"NARRATIVE_TEXT\", \"model_id\": \"eleven_turbo_v2_5\", \"voice_settings\": {\"stability\": 0.5, \"similarity_boost\": 0.75}}" \
  "https://api.elevenlabs.io/v1/text-to-speech/onwK4e9ZLuTAKqWW03F9" \
  -o recordings/narration/cardNN.mp3
```

## Mixing Into Final Video

Narration start times per card (0.5s after title card fades in):

```bash
# adelay values in milliseconds — update these from your assembly xfade offsets
[1:a]adelay=500|500[a1];       # card01 — always 500ms (starts at 0)
[2:a]adelay=NNNN|NNNN[a2];    # card02 — (title02_start_sec * 1000) + 500
...
```

Mix command:
```bash
ffmpeg \
  -i assembled.mp4 \
  -i narration/card01.mp3 ... \
  -filter_complex "[1:a]adelay=...[a1]; ... [a1]...[aN]amix=inputs=N:normalize=0[aout]" \
  -map "0:v" -map "[aout]" \
  -c:v copy -c:a aac -b:a 128k -shortest -y output-narrated.mp4
```
