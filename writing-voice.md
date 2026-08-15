# Writing voice — Let's Talk Science Now

**For anyone who writes for this site — you, a contributor (with or without the help of an AI assistant).**
If you're drafting or editing the words in a story or geo-feature article, this is
the standard. Read it first; it takes two minutes.

LetsTalkScienceNow aims to explain, increase awareness, and instil further curiosity
for science by using as easy and as relatable language as possible — even for an
audience without a science background. Every written explanation — story bodies and
geo-feature articles — should *teach*, in simple, plain language, in the same voice
as the reels. It is fine to open with a short, plain description to ground the
reader. The failure mode we are fixing is prose that *only* describes and never
explains how or why. You do not have to open with a hook or a question; a
straightforward description first is good, as long as the teaching follows.

## The one test

Read a paragraph and ask: does it explain **how or why** something is the way it is,
or does it only say **what it is**? If it only labels and describes, it isn't
teaching yet.

**Only describing (stops too soon):**
> The Gulf of Mannar is a warm, shallow sea studded with a chain of low coral
> islands and fringing reefs. Its clear, sediment-poor water and gentle shelf let
> corals, seagrass meadows and pearl-oyster beds flourish.

**Describing, then teaching (what we want):**
> The Gulf of Mannar is a warm, shallow sea studded with low coral islands and
> fringing reefs. Corals are picky about where they live: the tiny animals that
> build a reef rely on algae that need sunlight, so the water has to stay clear and
> shallow. No big river pours mud into this gulf, so the light reaches the seabed,
> and the reefs, seagrass and pearl-oyster beds thrive.

## The 5 moves

1. **Explain the *why*.** Give cause and mechanism, not just the label. (Corals need
   clear, shallow water → so a reef forms *here*.)
2. **Plain words.** If a technical term is unavoidable, unpack it in the same breath
   — "the Dharwar craton, an ancient rock-solid block of crust".
3. **Connect to something the reader already knows or can picture** — a walkable
   sandbank to Sri Lanka, a timescale before dinosaurs, a temple built from the rock.
4. **Keep it short.** Same length, more understanding. One idea per paragraph.
5. **Use analogies for bigger concepts** — but don't overdo it. One good comparison
   clarifies; a pile of them confuses.

## Voice

- Warm, curious, direct. Second person ("you") and rhetorical questions are welcome.
- Prefer concrete phrasing over an abstract one.
- Try to channel your own curiosity in the tone of your writing.

## Hard rules

- **Accuracy first.** Teaching means explaining mechanism — never invent mechanism
  the source doesn't support. Many geo-features are thinly sourced;
  where the "why" is genuinely unknown or uncertain, say so plainly rather than
  faking confidence. 
- If a specific phenomena is not a general scientific consensus, make that 
  clear and also add sources for further reading on alternative credible sources.
- Be very careful not to include unsubstantiated claims or pseudoscience-based
  claims. The internet is unfortunately filled with these, and often they are
  presented absolutely indistinguishable from credible sources. If you are unsure
  about a claim, flag it for review rather than including it.
- **Reel captions stay word-for-word.** This voice is for the written explanation
  body only — never rewrite the original Instagram caption or pinned comment (stored
  as `caption:` / `pinned_comment:` in `_data/reels.yml`).
- **Keep the facts intact** — the location, the age, the feature type, the sources.

## Sources & citations

Teaching means explaining mechanism, and every mechanism or fact you state has to
trace to a source someone else can check. **No citable source, no claim** — if the
"why" isn't in a reliable source, say it's unknown or leave it out. A shorter, honest
note beats a padded one propped up by a weak source.

**Cite freely (reliable):**
- Peer-reviewed journal articles (Springer, Elsevier, Wiley, Taylor & Francis, GeoScienceWorld, and the like).
- The Geological Survey of India — official publications and National Geological Monument records.
- Official scientific / heritage bodies: NASA, Ramsar, UNESCO, IUCN, national geological surveys.
- Established reference works (e.g. Encyclopædia Britannica).

**Limited use — logistics only, never for how/why:**
- Museum, university, and government or tourism pages. Fine for a plain fact ("the park
  holds about two dozen logs", "the site is open to visitors"); never for the geological
  mechanism.

**Never cite:**
- Blogs and geotourism sites, Medium or other personal posts, tourism portals, SEO /
  content-farm articles.
- Predatory or low-tier open-access journals. Tells: a publisher that emails soliciting
  papers, promises near-instant review, has an editorial board you can't verify, or takes
  a fee to publish with little scrutiny (e.g. SciRP).
- **Wikipedia as a citation.** Don't put it in `sources:` to back a claim. Use it to
  *find* the real paper — follow its reference list, then cite that paper. (Wikipedia is
  fine as a *"further reading"* pointer for curious readers; that is a reader signpost,
  not a citation, and the two are kept in different fields.)
- Anything AI-generated, including this assistant's own summaries.

**Verify before you cite — this is the rule that matters most.** Open every source and
confirm it (a) actually exists and (b) actually supports the specific claim you attach it
to. Never cite something you have not read. Plausible-looking citations — especially ones
an AI hands you — are worthless until checked; treat a fabricated or unread citation as a
worse failure than having no citation at all.

**How to cite in this repo** — list each source in the page's front matter:

```yaml
sources:
  - text: "Author(s) (year), Title, Journal volume(issue)"
    url: "https://…"      # preferred; must be the real, working link
```

Give author, year and journal where you can, so the citation still stands if a link rots.

## Checklist before publishing a rewrite

- [ ] Answers at least one "how / why"
- [ ] No unexplained jargon
- [ ] The reader can picture it
- [ ] Every claim traces to the source; uncertainty is flagged, not hidden
- [ ] Every source is on the "cite freely" list (or "limited use" for a logistics-only fact), and I opened each one and it really says what I claim
