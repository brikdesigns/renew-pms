#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# record-demo.sh — ffmpeg assembly pipeline for Pagecast recordings
#
# Usage:
#   ./scripts/record-demo.sh --config path/to/config.json
#   ./scripts/record-demo.sh --config path/to/config.json --dry-run
#   ./scripts/record-demo.sh --config path/to/config.json --no-narration
#
# What this script does:
#   1. Normalizes each segment (convert .webm → .mp4, trim, speed, pad)
#   2. Assembles segments with xfade transitions
#   3. Optionally mixes ElevenLabs narration audio at correct timestamps
#
# What this script does NOT do:
#   - Record — use Pagecast MCP (mcp__pagecast__record_page) in Claude
#   - Generate narration — call ElevenLabs API separately, save to narration/
#
# Config JSON format (see recordings/narration-template.md for full example):
#   {
#     "output": "recordings/demo-v1.mp4",
#     "narrated_output": "recordings/demo-v1-narrated.mp4",
#     "transition_duration": 0.5,
#     "fps": 24,
#     "crf": 22,
#     "segments": [
#       { "id": "title01", "source": "recordings/recording-ABC.webm", "duration": 8 },
#       { "id": "clip01",  "source": "recordings/recording-DEF.webm",
#         "trim_start": 10, "trim_end": 22, "speed": 2.0 }
#     ],
#     "narration": [
#       { "segment_id": "title01", "file": "recordings/narration/card01.mp3", "delay_offset": 0.5 }
#     ]
#   }
#
# Fields:
#   segments[].duration    — pad/trim to this duration (title cards). Omit for clip segments.
#   segments[].trim_start  — seconds into source to start (clips only)
#   segments[].trim_end    — seconds into source to end   (clips only)
#   segments[].speed       — playback multiplier (2.0 = 2× speed). Default: 1.0
#   narration[].delay_offset — seconds after segment start to begin narration. Default: 0.5
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TRIMMED_DIR="$PROJECT_ROOT/recordings/trimmed"

# ─── Args ────────────────────────────────────────────────────────────────────
CONFIG=""
DRY_RUN=false
NO_NARRATION=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --config)      CONFIG="$2"; shift 2 ;;
    --dry-run)     DRY_RUN=true; shift ;;
    --no-narration) NO_NARRATION=true; shift ;;
    *) echo "Unknown flag: $1"; exit 1 ;;
  esac
done

if [[ -z "$CONFIG" ]]; then
  echo "Usage: ./scripts/record-demo.sh --config path/to/config.json"
  exit 1
fi

if [[ ! -f "$CONFIG" ]]; then
  echo "Error: config file not found: $CONFIG"
  exit 1
fi

mkdir -p "$TRIMMED_DIR"

echo "==> record-demo.sh"
echo "    config: $CONFIG"
echo "    trimmed: $TRIMMED_DIR"
[[ "$DRY_RUN" == true ]] && echo "    [DRY RUN — ffmpeg commands will be printed, not executed]"
echo ""

# ─── Delegate to Python for all heavy lifting ────────────────────────────────
python3 - "$CONFIG" "$PROJECT_ROOT" "$TRIMMED_DIR" "$DRY_RUN" "$NO_NARRATION" << 'PYTHON'
import sys, json, subprocess, os, math

config_path, project_root, trimmed_dir, dry_run_str, no_narration_str = sys.argv[1:]
dry_run = dry_run_str == "true"
no_narration = no_narration_str == "true"

with open(config_path) as f:
    cfg = json.load(f)

segments    = cfg["segments"]
td          = float(cfg.get("transition_duration", 0.5))
fps         = int(cfg.get("fps", 24))
crf         = int(cfg.get("crf", 22))
output      = os.path.join(project_root, cfg["output"])
narr_output = os.path.join(project_root, cfg.get("narrated_output", cfg["output"].replace(".mp4", "-narrated.mp4")))
narration   = [] if no_narration else cfg.get("narration", [])

def run(cmd, label):
    print(f"  [{label}]")
    if dry_run:
        print("  " + " ".join(cmd))
        print()
        return
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"  ERROR: {result.stderr[-300:]}")
        sys.exit(1)

def get_duration(path):
    out = subprocess.check_output([
        "ffprobe", "-v", "quiet",
        "-show_entries", "format=duration",
        "-of", "csv=p=0", path
    ], text=True).strip()
    return float(out)

# ─── Step 1: Normalize each segment ─────────────────────────────────────────
print("── Step 1: Normalize segments")
normalized = []

for seg in segments:
    seg_id     = seg["id"]
    source     = os.path.join(project_root, seg["source"])
    out_path   = os.path.join(trimmed_dir, f"{seg_id}.mp4")
    speed      = float(seg.get("speed", 1.0))
    duration   = seg.get("duration")       # title cards: fixed duration
    trim_start = seg.get("trim_start")     # clips: trim window
    trim_end   = seg.get("trim_end")

    if not os.path.exists(source):
        print(f"  ERROR: source not found: {source}")
        sys.exit(1)

    # Build video filter
    filters = []

    if trim_start is not None and trim_end is not None:
        # Clip: trim window, apply speed
        speed_factor = round(1.0 / speed, 6)
        filters.append(f"trim=start={trim_start}:end={trim_end},setpts=PTS-STARTPTS")
        if speed != 1.0:
            filters.append(f"setpts={speed_factor}*PTS")
    elif duration is not None:
        # Title card: pad to fixed duration
        filters.append(f"tpad=stop_duration={duration}:stop_mode=clone,trim=start=0:end={duration},setpts=PTS-STARTPTS")

    filters += [f"fps={fps}", "scale=1280:720"]
    vf = ",".join(filters)

    cmd = [
        "ffmpeg", "-i", source,
        "-vf", vf,
        "-c:v", "libx264", "-preset", "fast", "-crf", str(crf),
        "-pix_fmt", "yuv420p", "-an", "-y", out_path
    ]
    run(cmd, f"normalize {seg_id}")

    if not dry_run:
        dur = get_duration(out_path)
        print(f"    → {seg_id}.mp4  {dur:.2f}s")
        normalized.append((seg_id, out_path, dur))
    else:
        normalized.append((seg_id, out_path, duration or 10.0))  # estimate for dry run

print()

# ─── Step 2: Calculate xfade offsets ────────────────────────────────────────
print("── Step 2: Xfade offsets")
offsets = []
cumulative = 0.0
for i, (seg_id, path, dur) in enumerate(normalized[:-1]):
    cumulative += dur - td
    offsets.append(round(cumulative, 6))
    print(f"    transition {i}: {cumulative:.4f}s  ({seg_id} → {normalized[i+1][0]})")
print()

# ─── Step 3: Assemble with xfade ────────────────────────────────────────────
print("── Step 3: Assemble")
inputs = []
for _, path, _ in normalized:
    inputs += ["-i", path]

# Build filter_complex
chains = []
prev = "0:v"
for i, offset in enumerate(offsets):
    out_label = f"vout" if i == len(offsets) - 1 else f"v{i:02d}"
    chains.append(f"[{prev}][{i+1}:v]xfade=transition=fade:duration={td}:offset={offset}[{out_label}]")
    prev = out_label

filter_complex = "; ".join(chains)

os.makedirs(os.path.dirname(output) if os.path.dirname(output) else ".", exist_ok=True)
cmd = ["ffmpeg"] + inputs + [
    "-filter_complex", filter_complex,
    "-map", "[vout]",
    "-c:v", "libx264", "-preset", "fast", "-crf", str(crf),
    "-pix_fmt", "yuv420p", "-an", "-y", output
]
run(cmd, f"assemble → {os.path.basename(output)}")

if not dry_run:
    dur = get_duration(output)
    size = os.path.getsize(output) / 1_048_576
    print(f"    → {output}")
    print(f"       duration: {dur:.1f}s  size: {size:.1f}MB")
print()

# ─── Step 4: Mix narration (optional) ───────────────────────────────────────
if narration:
    print("── Step 4: Mix narration")

    # Build narration start times: offset of each title card in output timeline
    # Segment start times (accounting for xfade overlaps)
    seg_starts = [0.0]
    for i, (_, _, dur) in enumerate(normalized[:-1]):
        seg_starts.append(seg_starts[-1] + dur - td)

    seg_id_to_start = {seg_id: start for (seg_id, _, _), start in zip(normalized, seg_starts)}

    narr_inputs = []
    delays = []
    for narr in narration:
        seg_id = narr["segment_id"]
        narr_file = os.path.join(project_root, narr["file"])
        delay_offset = float(narr.get("delay_offset", 0.5))

        if not os.path.exists(narr_file):
            print(f"  WARNING: narration file not found, skipping: {narr_file}")
            continue

        start_sec = seg_id_to_start.get(seg_id, 0.0) + delay_offset
        delay_ms = int(start_sec * 1000)
        narr_inputs += ["-i", narr_file]
        delays.append(delay_ms)
        print(f"    {seg_id}: {narr_file}  delay={delay_ms}ms")

    if narr_inputs:
        n = len(delays)
        audio_filters = []
        for i, delay_ms in enumerate(delays):
            idx = i + 1  # input 0 is the video
            audio_filters.append(f"[{idx}:a]adelay={delay_ms}|{delay_ms}[a{i}]")
        mix_inputs = "".join(f"[a{i}]" for i in range(n))
        audio_filters.append(f"{mix_inputs}amix=inputs={n}:normalize=0[aout]")
        filter_str = "; ".join(audio_filters)

        cmd = [
            "ffmpeg", "-i", output
        ] + narr_inputs + [
            "-filter_complex", filter_str,
            "-map", "0:v", "-map", "[aout]",
            "-c:v", "copy", "-c:a", "aac", "-b:a", "128k",
            "-shortest", "-y", narr_output
        ]
        run(cmd, f"mix narration → {os.path.basename(narr_output)}")

        if not dry_run:
            dur = get_duration(narr_output)
            size = os.path.getsize(narr_output) / 1_048_576
            print(f"    → {narr_output}")
            print(f"       duration: {dur:.1f}s  size: {size:.1f}MB")
    print()

print("✓ Done")
PYTHON
