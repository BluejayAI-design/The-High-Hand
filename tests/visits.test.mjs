import test from 'node:test';
import assert from 'node:assert/strict';
import {characters} from '../dist/questions.mjs';
import {emptyState,normaliseState,saveAnswer} from '../dist/model.mjs';
import {drawFromDeck} from '../dist/table-model.mjs';
import {beginVisit,canDrawVisit,claimVisitCard,deckUsed,visitComplete,visitRemaining,lastVisitReading,closeVisit} from '../dist/visits.mjs';
import {createTableAudio} from '../dist/audio.mjs';

test('A visit gives each of the five characters exactly one slot, including black cards',()=>{
 const state=emptyState();assert.equal(canDrawVisit(state,'corvidae'),false);beginVisit(state);
 for(const c of characters){
  assert.equal(canDrawVisit(state,c.id),true);
  const reading=drawFromDeck(state,c.id,`visit-${c.id}`,()=>0);
  assert.equal(claimVisitCard(state,c.id,reading.id),true);
  assert.equal(deckUsed(state,c.id),true);assert.equal(canDrawVisit(state,c.id),false);
  assert.equal(claimVisitCard(state,c.id,'replacement'),false);
 }
 assert.equal(visitComplete(state),true);assert.equal(visitRemaining(state),0);
 assert.ok(Object.values(state.history).flat().some(r=>r.kind==='black'));
 assert.equal(lastVisitReading(state).character,characters.at(-1).id);
});

test('Reloading a visit preserves used decks and the last question; only a closed visit can reset',()=>{
 const state=emptyState();beginVisit(state);const reading=drawFromDeck(state,'rov','rov-visit',()=>.5);claimVisitCard(state,'rov',reading.id);
 saveAnswer(state,reading,'rov','An answer to keep.','Private note.');
 const restored=normaliseState(JSON.parse(JSON.stringify(state)));beginVisit(restored);
 assert.equal(canDrawVisit(restored,'rov'),false);assert.equal(lastVisitReading(restored).id,reading.id);
 const history=structuredClone(restored.history),seen=structuredClone(restored.seen),entries=structuredClone(restored.entries);
 closeVisit(restored);assert.equal(canDrawVisit(restored,'elas'),false);beginVisit(restored);
 assert.equal(visitRemaining(restored),5);assert.equal(lastVisitReading(restored),null);
 assert.deepEqual(restored.history,history);assert.deepEqual(restored.seen,seen);assert.deepEqual(restored.entries,entries);
});

test('Invalid visit claims are rejected without inventing a locked deck',()=>{
 const state=emptyState();beginVisit(state);assert.equal(claimVisitCard(state,'unknown','id'),false);assert.equal(claimVisitCard(state,'rov',null),false);
 const restored=normaliseState({...state,visit:{active:true,readings:{rov:'missing',unknown:'fake'},last:'unknown'}});
 assert.equal(visitRemaining(restored),5);assert.equal(lastVisitReading(restored),null);
});

test('Welcome and alternating farewells stop earlier cues and entry audio can replay on a new visit',async()=>{
 const heard=[],paused=[];let saved;
 const makeAudio=src=>({src,paused:true,load(){},pause(){this.paused=true;paused.push(src);},play(){this.paused=false;heard.push(src);return Promise.resolve();}});
 const sound=createTableAudio({makeAudio,makeContext:()=>null,onSettings:s=>saved=s});
 await sound.start();sound.playEffect('welcome');sound.playEffect('deck-corvidae');
 assert.ok(paused.some(s=>s.endsWith('welcome.mp3')));
 assert.equal(sound.playFarewell(),7100);assert.ok(heard.at(-1).endsWith('leaving-1.mp3'));
 sound.stop();const count=heard.length;assert.equal(sound.playEffect('pull'),false);assert.equal(heard.length,count);
 await sound.start();assert.equal(heard.filter(s=>s.endsWith('high-hand-entry.mp3')).length,2);
 sound.playFarewell();assert.ok(heard.at(-1).endsWith('leaving-2.mp3'));assert.equal(saved.leavingCueIndex,0);
 sound.setSettings({muted:true});assert.equal(sound.playFarewell(),2400);assert.ok(heard.at(-1).endsWith('leaving-2.mp3'));
 sound.stop();
});
