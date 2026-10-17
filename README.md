# The High Hand · Madam Nef

A separate, buildless browser app for D&D session warm-ups. The desktop chamber fits a 16:9 stage and uses the supplied Madam Nef artwork. It has five personal question decks, a shared deck, theme filtering, reading history, a local answer journal, an editable question bank, Markdown export and JSON backup/merge restore.

## Content

360 authored questions: 60 each for Corvidae, Elas, Frostheart, Rov and Firebrand, plus 60 shared prompts. These invite in-character answers without asserting events from a character's past or determining their future. Nef's concealed identity is not encoded in the app. There is no automated fortune or psychological scoring.

Nef's voice and the party themes were checked against the live Candle world records on 17 October 2026. Her calm, measured manner, interest in fate and consequence, fragmented possible futures and residence in Stygia inform the presentation. No live connection to Bluejay Studio is needed or included.

The principal background is the user's supplied Celestial Tarot Reading in Candlelight(2).png, converted to WebP without creative alterations.

## Use

Each visit allows one card per character. Click an unused illustrated deck to draw a question for that member of Pathos. The card travels from the deck to the space beside Nef, then flips to reveal its question. Questions do not repeat for that member within a cycle. Exhaustion is labelled explicitly; beginning a new cycle retains journal entries. The initial shared table reveals no saved question on page load. Preparation contains theme filters, editing and answer tools. Record answer accepts the player's words and optional notes for a later reading.

One 16:9 table is used for everyone. There is no separate player screen. Only the selected question, five decks and a quiet Preparation link are exposed during play. Preparation first opens a neutral menu; unrevealed questions and saved answers require deliberately opening their respective tools. The table is covered while preparation tools are open. Reduced-motion preferences skip travel and flip animation.

Journal entries, drafts, deck edits and history use this app's own localStorage key. They do not sync across devices. Export the journal as Markdown or use Backup & restore for a JSON copy. Restore merges items by their IDs and keeps the current browser's version of conflicting entries.

## Development

Files in `dist/` are served directly. No API keys, external fonts, remote scripts or dependencies are required. Run `node --test tests/*.test.mjs` for checks of deck selection, no-repeat behaviour, per-character state, answer edits and backup validation.

No browser automation skill was available in this environment; layout, audio playback and the full entrance/farewell animation need manual browser verification.

## Card backs

Five original raster assets were generated with the built-in image generator and integrated in `dist/assets/cards/`. Their prompts and production paths are documented in `CARD_BACKS.md`. No secret lore or text is encoded in these backs.


## The High Hand entrance and sealed answers

The app opens to generated gold title lettering on black. Click or press Enter on the intro to reveal Nef’s chamber through rising mist; the five decks assemble in staggered layers at the bottom. Table controls remain inert until entry completes. A restrained grain and scanline texture sits over Nef’s artwork. Reduced-motion preferences disable continuous effects and skip entry, travel and archive motion.

Each revealed card has an Answer button. The public answer form shows only the selected question and an answer field. It keeps preparation notes concealed. Saving writes the entry before the animation begins; the card turns, shrinks and spirals into the generated black vortex on Nef’s right. The card then clears and a card can be drawn from another unused character deck. Animations have a final-state fallback so interrupted motion does not lose the saved entry or lock the decks.

Click the vortex to open the Sealed Hand. Entries are collapsed initially; opening one reveals its question and answer. The public archive and its Markdown export use an explicit projection that excludes private notes, unrevealed questions and question-bank contents. The full journal, private notes, backups and editable decks remain in Preparation. Existing localStorage keys and original question IDs are retained.

Additional generated-art prompts and final project paths are in `HIGH_HAND_ART.md`.


## Nef’s reaction artwork

The generated question-card front is deliberately quiet, with the readable question and buttons rendered as live text over its blank centre. Seven additional reference-based scene images keep Nef’s appearance, room and framing consistent: one unformed-shadow introduction and six reactions split between drawing, listening and sealing cards. Reaction poses replace one another directly over the original room. There are no temporal crossfades or transition mist between poses. These gestures follow interaction stages; they do not analyse the player’s answer or reveal secret campaign information.

The High Hand title sits over the shadow-form art. Entry lifts a veil of mist to reveal the original Nef as the decks assemble. Drawing alternates between curious and knowing expressions. The public answer form is positioned beside Nef so her attentive and reflective reactions remain visible. Sealing uses a beckoning gesture followed by a quiet acknowledgement at the vortex. Slow listeners alternate only while the public answer form remains open; reduced-motion settings stop those changes.

Reaction image requests use a latest-request guard: a delayed drawing or listening asset cannot replace a more recent sealing reaction. Failed loads fall back to the original image, without blocking the question or answer flow. Generated prompts and project asset paths are recorded in `NEF_REACTION_ART.md`.


## Rare black cards

There are 32 authored black-card prompts in addition to the 360 ordinary questions. Every character deck can produce a black card. After at least two ordinary draws, each eligible draw has a 16% chance; resetting the cooldown after each black card makes the long-run frequency roughly one in eight draws. The first two draws stay ordinary and black cards cannot appear consecutively. Black prompts do not repeat across the party until their full shared pool has been used. This does not consume an unread ordinary question. Preparation can turn rare cards off.

Black cards have their own generated back and ominous blank front, and their type survives saves, archive entries and JSON backups. The GM-only black-card collection in Preparation explains each trap’s intended premise and a possible escape. Intent and escape notes are never copied into a displayed card, saved player answer or public archive. These are fictional narrative hooks, not automatic spell, damage or curse adjudication. The first prompt uses the requested incomplete phrase “Klatu… Barata…”.

## Direct poses and lossless art

Five further images add two idle poses, an inviting card gesture, an amused response and a black-card scrutiny pose. Idle images change at intervals when no dialog or draw is active. All pose changes are direct cuts after the new image is ready, with no fading, blur transition or transition mist. Card drawing, flipping and vortex travel retain their existing animations.

New generated PNG art is encoded to lossless WebP at the original dimensions. Existing deployed artwork is tested against a lossless alternative and retained when already smaller. The optimisation report lists byte counts and a SHA-256 digest of every decoded RGBA pixel buffer. Unused old avatar thumbnails are removed from the deployed bundle. No image is resized or recompressed lossily in this pass. Source prompts and paths are in `BLACK_HAND_ART.md`.

## Table audio

The supplied Parlor of Secrets MP3 loops from the intro click at 25% volume. The original WAV effects accompany card pull, reveal flip and discard into the vortex at 60%. Sound opens separate music and card volume controls plus a master mute. Preferences stay in this browser separately from answers and backups. Audio files are copied unchanged; music and card actions can continue independently if playback is unavailable.

## Entrance sequence

Clicking The High Hand starts music and a 1.15-second title collapse with an expanding gold ring. Nef remains in mist form for another 1.8 seconds, then appears as a violet mist veil lifts over 0.95 seconds. The five decks build visibly during the mist hold and reveal, bringing the full entrance to about 3.9 seconds. Input remains locked until entry completes and repeated entry clicks are ignored. Reduced motion uses a brief still mist hold with no title, veil or deck animation. Later pose changes remain direct.

The supplied 211688 transition swipe accompanies Nef’s appearance; its loudest moment aligns with her reveal. The shorter 211685 swipe is delayed 0.9 seconds into the card flight to align with the vortex arrival. Both sit below the card effects in the mix and follow the Cards & rituals volume and master mute. Their original MP3 files are retained unchanged.

The supplied Universfield appearance sound starts directly on The High Hand click at a quiet level, alongside the music. It is preloaded separately from the timed effects so initial playback retains the browser click gesture. It follows Cards & rituals volume and master mute. The entrance uses a rising cloud veil with no signal tearing or image crossfade.

## Character deck cues and eye light

Each character deck click plays its matching supplied clip alongside the card pull. A new deck click stops the previous character cue, while normal card and vortex effects remain independent. The five original uploads are retained unchanged and follow the effects volume and master mute. Nef’s eyes occasionally glow for 2.6 seconds, using measured pupil positions for eight suitable poses. The effect is suppressed in her mist form, downward or sideward glances, Preparation and reduced-motion mode. Pose changes immediately clear and reposition the glow.

## Black-card cycle and deck assembly sound

Black-card reveals cycle through the three supplied clips in order: 1, 2, 3, then 1 again. The next position is saved with browser audio preferences and advances once per reveal, including muted reveals. Black-card cues take over from the character deck cue when the card face appears. The supplied 2.1-second riffle shuffle accompanies the deck-building entrance. All four original files are retained unchanged and follow the existing effects volume and mute.

## Visits and farewell

A visit allows one draw per character. Each used deck is locked and capped with the black card back, including draws made from Preparation. Active visits and the most recent question survive a reload. After the fifth card, sealing its answer automatically begins the farewell; Finish this visit without recording is also available so the final question is not cut off before it can be read. The welcome voice plays when Nef appears. The two leaving voices alternate between visits, with a new generated farewell pose, a violet departure cloud and the decks leaving the table. The app returns to the title and stops its audio. The next title click opens a fresh visit, while saved answers, question edits and question history remain. See FAREWELL_ART.md for asset provenance and the image prompt.
