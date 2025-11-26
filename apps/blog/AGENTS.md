# AGENTS.md  
Context & Strategic Guidelines for First 2 Apply  
_Last updated: 2025-01_

## Purpose of This Document
This file exists to retain the strategic context developed during planning sessions with ChatGPT regarding:

- The **SEO direction**
- The **content strategy**
- The **brand positioning**
- The **intended blog identity**
- The **target audience**
- The **role of automation & technical insight**
- The **type of writing and topics future agents should produce**

Any future automated agents, content generators, or collaborators should load this file before producing new content for the project.

---

# 1. Project Overview

**First 2 Apply** is a job-search automation product focused on:

- surfacing job listings early (within minutes/hours)
- allowing users to apply early when visibility is highest
- removing repetitive job-search tasks
- giving job seekers an “unfair advantage” through timing and automation
- using technical methods (distributed scraping, browser automation, edge functions)

This gives users significantly higher callback and interview rates.

---

# 2. Blog Identity: “Job Search Hacks”

The official branding for the blog is:

### **Job Search Hacks (by First 2 Apply)**  
*Smarter, faster, technical job-search hacks — powered by automation, data, and developer thinking.*

The blog is **not** a generic job-search advice blog.  
It is a **technical + tactical publication** aimed at job seekers who want to search smarter, not harder.

This branding is now core to the project.

---

# 3. Target Audience

### Primary Audience
- Developers and tech workers searching for jobs  
- Power users who enjoy automation, scripts, and clever workflows  
- People frustrated with traditional job-board inefficiencies  
- Users who value early-apply strategies  
- Users who want to optimize their job search using tools, data, and technical knowledge

### Secondary Audience
- General job seekers who are open to unconventional, high-leverage tactics  
- People curious about job-board mechanics or ATS behavior

---

# 4. Strategic Positioning

Future agents **must maintain** the following positioning:

### We do **NOT** compete in:
- generic motivational job advice  
- resume templates  
- broad career-coaching content  
- HR-style content (TealHQ, Huntr, Indeed, Muse)

### We **DO** compete in:
- job-search automation  
- early-apply optimization  
- technical job-search tactics  
- scraping, distributed scraping, browser automation  
- boolean search mastery  
- ATS mechanics + reverse-engineering  
- developer-style, high-leverage hacks  
- workflows that give users speed and efficiency advantages  

This niche is largely uncontested and is the foundation of our SEO moat.

---

# 5. Content Strategy Summary

Future content must fit into one or more of the following clusters.

## **Cluster A — Early Application Advantage**
Explain why applying in the first 24–48 hours massively improves results.
Tie naturally into First 2 Apply’s value prop.

## **Cluster B — Technical Job Search Hacks (Core Cluster)**
The most important cluster.
Includes automation scripts, job scraping tutorials, boolean search, distributed workflows, and power-user methods.

## **Cluster C — ATS & Recruiter Mechanics**
Reveal behind-the-scenes job market mechanics.  
Explain how filtering, ranking, and resume parsing works.

## **Cluster D — AI & Tooling Hacks**
Use AI, Chrome extensions, and custom workflows to improve job hunting.

## **Cluster E — Product-Adjacent Content**
Lightly promotional but primarily educational content explaining how First 2 Apply works or why certain technical solutions matter.

---

# 6. Writing Guidelines (For Agents)

1. **Tone:** tactical, technical, pragmatic — not fluffy.  
2. **Audience:** smart users, often developers, who want clever solutions.  
3. **Style:** step-by-step, practical, with code snippets when relevant.  
4. **Avoid:** motivational filler, generic career advice, HR language.  
5. **Use:** data, technical explanations, automation logic, scripts, boolean examples, practical hacks.  
6. **Goal:** demonstrate technical understanding and provide value that competitors cannot copy.  
7. **Voice:** confident, knowledgeable, slightly insider, direct.

---

# 7. SEO Guidelines (For Agents)

- Prioritize **long-tail, low-competition** keywords.  
- Blend job-search queries with **developer terminology**.  
- Aim to rank for terms like:  
  - `job search hacks`  
  - `apply early job posting`  
  - `advanced linkedin boolean search`  
  - `scrape job boards without proxies`  
  - `automate job applications`  
  - `nodejs job alert script`  
  - `ats hacks for engineers`  
- Always link related posts inside the blog.  
- Maintain cluster coherence with internal linking.  
- Produce content that large competitors cannot replicate easily.

---

# 8. Competitive Context

Current competitors (resume.io, tealhq.com, huntr.co):

- rely heavily on paid ads  
- publish little or **zero** SEO content  
- cannot publish technical or automation-heavy material  
- avoid topics like scraping, early-apply timing, or “hacks”

This means **SEO content is a wide-open opportunity** for First 2 Apply.

Future agents should continue exploiting this advantage by publishing technical job-search content routinely.

---

# 9. Long-Term Vision

The blog should evolve into:

- the #1 online resource for **job-search hacks**
- a hub of actionable technical strategies
- a trusted source among developers and power users
- a content moat that competitors cannot enter without rebranding themselves
- a top-of-funnel driver for the First 2 Apply product

---

# 10. Responsibilities for Future Agents

Agents creating new content must:

- Follow this strategic positioning  
- Match the tone and clusters listed above  
- Prioritize topics that reinforce the “Job Search Hacks” identity  
- Ensure all content ties back—directly or indirectly—to timing, automation, efficiency, or developer-style job searching  
- Avoid generic or HR-filtered job-search content  
- Build SEO momentum by expanding the five clusters  

This document should be loaded or referenced before generating new articles, ideas, or SEO plans.

---

---

# 11. Creating New Blog Posts (Technical Guide)

## Blog Post Creation Process

### File Location
Create new blog posts in: `/apps/blog/data/blog/`

### File Naming Convention
- Use kebab-case with `.mdx` extension
- Include date prefix for better organization: `2025-01-15-your-post-title.mdx`
- Examples: 
  - `2025-01-15-automate-job-search-nodejs.mdx`
  - `advanced-boolean-search-techniques.mdx`

### Required Frontmatter
Every blog post **must** include this frontmatter at the top:

```yaml
---
title: 'Your Post Title Here'
date: '2025-01-15'
tags: ['job-search', 'automation', 'technical'] 
summary: 'Brief description that appears in listings and meta tags'
draft: false
---
