import test from 'node:test';
import assert from 'node:assert/strict';
import {blackQuestions,isBlackReading,BLACK_COOLDOWN} from '../dist/black-cards.mjs';
import {drawFromDeck} from '../dist/table-model.mjs';
import {emptyState,getPool,normaliseState,saveAnswer,publicAnswers} from '../dist/model.mjs';

test('Black cards can emerge from any character deck, with two normal draws between them',()=>{
 const state=emptyState(),cast=['corvidae','elas','frostheart','rov','firebrand','corvidae'];
 const readings=cast.map((character,i)=>drawFromDeck(state,character,`draw-${i}`,()=>0));
 assert.deepEqual(readings.map(isBlackReading),[false,false,true,false,false,true]);
 assert.equal(readings[2].character,'frostheart');assert.equal(readings[5].character,'corvidae');assert.equal(state.normalSinceBlack,0);
});
test('A black draw does not consume an unread normal question',()=>{
 const state=emptyState();state.normalSinceBlack=BLACK_COOLDOWN;
 const before=getPool(state).map(q=>q.id),reading=drawFromDeck(state,'corvidae','black',()=>0);
 assert.equal(reading.kind,'black');assert.equal(getPool(state).filter(q=>state.seen.corvidae.includes(q.id)).length,0);
 assert.deepEqual(getPool(state).map(q=>q.id),before);
});
test('Black cards avoid repeats globally across the whole party until their pool is exhausted',()=>{
 const state=emptyState(),seen=[];
 for(let i=0;i<blackQuestions.length;i++){
  state.normalSinceBlack=BLACK_COOLDOWN;const r=drawFromDeck(state,i%2?'elas':'rov',`black-${i}`,()=>0);
  assert.ok(!seen.includes(r.qid));seen.push(r.qid);
 }
 assert.equal(new Set(seen).size,32);state.normalSinceBlack=BLACK_COOLDOWN;
 assert.ok(isBlackReading(drawFromDeck(state,'firebrand','next-cycle',()=>0)));
});
test('Disabling black cards keeps ordinary draws ordinary',()=>{
 const state=emptyState();state.blackEnabled=false;state.normalSinceBlack=100;
 for(let i=0;i<20;i++)assert.equal(drawFromDeck(state,'elas',`ordinary-${i}`,()=>0).kind,'standard');
});
test('A black card remains black through saving, backups and the public archive, without leaking its trap notes',()=>{
 const state=emptyState();state.normalSinceBlack=2;const reading=drawFromDeck(state,'rov','sealed-black',()=>0);
 saveAnswer(state,reading,'rov','I decline the invitation.','Private GM note.');
 const restored=normaliseState(JSON.parse(JSON.stringify(state))),entry=restored.entries[0],publicEntry=publicAnswers(restored)[0];
 assert.equal(entry.kind,'black');assert.equal(publicEntry.kind,'black');assert.equal(publicEntry.notes,undefined);assert.equal(publicEntry.intent,undefined);assert.equal(publicEntry.escape,undefined);
 assert.equal(restored.blackSeen.length,1);assert.equal(restored.normalSinceBlack,0);
 assert.ok(!Object.hasOwn(reading,'intent'));assert.ok(!Object.hasOwn(reading,'escape'));
});
test('The rare-card roll can decline an eligible draw and preserves existing save defaults',()=>{
 const state=normaliseState({version:1,selected:'corvidae'});state.normalSinceBlack=2;
 assert.equal(drawFromDeck(state,'corvidae','normal',()=>.99).kind,'standard');assert.equal(state.blackEnabled,true);
 assert.equal(new Set(blackQuestions.map(q=>q.id)).size,32);assert.ok(blackQuestions.every(q=>q.text.length<=650&&q.intent&&q.escape));
});
