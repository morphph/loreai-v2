---
title: "Video Pipeline Guide"
status: active
category: guide
last-updated: 2026-03-30
depends-on: []
---

# Video Pipeline Guide

## Overview

The video pipeline converts blog posts into video content via the external **blog2video** project, then imports the resulting artifacts back as blog posts. This creates a content loop: written blog → video script → spoken video → written blog (from video).

## Scripts

### `scripts/pick-video-candidates.ts`

Scans blog posts with `video_ready=true` and `video_status=none`, scores each candidate by:

| Factor   | Weight |
|----------|--------|
| Recency  | 40 pts |
| Word count | 30 pts |
| Diversity | 30 pts |

Outputs ranked candidates to `data/video-queue/candidates.json`.

```bash
npx tsx scripts/pick-video-candidates.ts --top=5
```

### `scripts/import-video-blog.ts`

Imports blog2video output directories as ZH+EN blog posts. Reads `meta.json` / `video_plan.json` + script files, generates a written blog from spoken scripts, and persists to `content/` and the database.

**Modes:**

- `--dir=/path/to/output/slug` — Import a single output directory
- `--batch` — Import all pending outputs
- `--auto` — Cron/automated mode

Supports `--dry-run` to preview without writing.

```bash
npx tsx scripts/import-video-blog.ts --dir=/path/to/output/slug
npx tsx scripts/import-video-blog.ts --batch
npx tsx scripts/import-video-blog.ts --auto --dry-run
```

### `scripts/update-video-status.ts`

Updates `video_status` and `video_url` in blog frontmatter for both EN and ZH versions.

Valid statuses: `none` → `scripted` → `recorded` → `published`

```bash
npx tsx scripts/update-video-status.ts --slug=my-post --status=published --video-url=https://youtube.com/watch?v=xyz
```

## Workflow

```
pick-video-candidates
        │
        ▼
  candidates.json
        │
        ▼
  (external: blog2video project)
        │
        ▼
  import-video-blog
        │
        ▼
  update-video-status
```

1. **Pick candidates** — Run `pick-video-candidates.ts` to select blog posts suitable for video.
2. **Create video** — Feed candidates to the blog2video project (external, separate repo).
3. **Import back** — Run `import-video-blog.ts` to convert video scripts back into blog posts.
4. **Update status** — Run `update-video-status.ts` to mark posts with their video status and URL.

## Related Skill

`skills/video-to-blog-zh/SKILL.md` — Phase 2 skill for converting video scripts to ZH blog posts.

## Blog Frontmatter Fields

| Field          | Description                                      |
|----------------|--------------------------------------------------|
| `video_ready`  | Boolean; marks a post as eligible for video       |
| `video_hook`   | Short hook text for the video                     |
| `video_status` | Pipeline state: none / scripted / recorded / published |
| `video_url`    | URL of the published video                        |
| `source_type`  | Content origin type (e.g., video)                 |
| `flow_source`  | Tracks the content flow that produced this post   |
