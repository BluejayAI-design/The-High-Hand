import test from 'node:test';
import assert from 'node:assert/strict';
import {characters,questions,chooseQuestion} from '../dist/questions.mjs';
import {emptyState,normaliseState,getPool,currentReading,rememberQuestion,saveAnswer,clearAnswers,effectiveQuestions,publicAnswers} from '../dist/model.mjs';
import {drawFromDeck as drawWithBlackCards} from '../dist/table-model.mjs';
const drawFromDeck=(state,character,id,random)=>drawWithBlackCards(state,character,id,random,{blackCards:false});

test('Every Pathos member has a complete personal deck and every question is uniquely addressable',()=>{
 assert.equal(questions.length,360);assert.equal(new Set(questions.map(q=>q.id)).size,360);
 for(const character of characters){const pool=questions.filter(q=>q.character===character.id);assert.equal(pool.length,60);assert.equal(new Set(pool.map(q=>q.theme)).size,5);assert.ok(pool.every(q=>q.text.length<=650&&q.text.includes('?')));}
 assert.equal(questions.filter(q=>q.character==='shared').length,60);
});
test('A full deck draws without repeats and stops at exhaustion',()=>{
 const state=emptyState(),pool=getPool(state),seen=[];
 for(let i=0;i<pool.length;i++){const {question}=chooseQuestion(pool,seen,null,()=>.37);assert.ok(question);assert.ok(!seen.includes(question.id));seen.push(question.id);}
 assert.deepEqual(chooseQuestion(pool,seen),{question:null,exhausted:true});
});
test('Themes and shared questions respect the selected member',()=>{
 const state=emptyState();state.selected='rov';state.theme='Power';
 assert.ok(getPool(state).every(q=>q.character==='rov'&&q.theme==='Power'));
 const personal=getPool(state).length;state.includeShared=true;assert.ok(getPool(state).length>personal);
 assert.ok(getPool(state).every(q=>['rov','shared'].includes(q.character)&&q.theme==='Power'));
});
test('Switching members preserves separate current questions and reading history',()=>{
 const state=emptyState();const first=rememberQuestion(state,getPool(state)[0],'reading-corvidae');
 state.selected='elas';assert.equal(currentReading(state),null);rememberQuestion(state,getPool(state)[0],'reading-elas');
 state.selected='corvidae';assert.deepEqual(currentReading(state),first);assert.equal(state.seen.elas.length,1);assert.equal(state.seen.corvidae.length,1);
});
test('Shared questions can be asked independently of different party members',()=>{
 const state=emptyState();state.includeShared=true;const shared=getPool(state).find(q=>q.character==='shared');
 rememberQuestion(state,shared,'shared-cor');state.selected='rov';assert.ok(!state.seen.rov?.includes(shared.id));rememberQuestion(state,shared,'shared-rov');assert.equal(state.history.rov[0].qid,shared.id);
});
test('Saving and editing an answer preserves its original question and other entries',()=>{
 const state=emptyState(),q=getPool(state)[0],reading=rememberQuestion(state,q,'reading-1','2026-10-17T17:00:00Z');state.drafts[reading.id]={answer:'draft',notes:''};
 saveAnswer(state,reading,'corvidae',' First answer ',' notes ');assert.equal(state.entries.length,1);assert.equal(state.drafts[reading.id],undefined);
 state.overrides[q.id]={...q,text:'A different question?'};saveAnswer(state,reading,'corvidae','Revised answer','');
 assert.equal(state.entries.length,1);assert.equal(state.entries[0].question,q.text);assert.equal(state.entries[0].answer,'Revised answer');assert.equal(effectiveQuestions(state).find(x=>x.id===q.id).text,'A different question?');
});
test('Saved state round-trips readings, drafts, custom questions and answers',()=>{
 const state=emptyState();const reading=rememberQuestion(state,getPool(state)[0],'reading-1');saveAnswer(state,reading,state.selected,'I choose honesty.','Return to this.');
 state.custom.push({id:'custom-test',character:'elas',theme:'Fate',text:'What does tomorrow owe you?'});state.drafts['draft-1']={answer:'unfinished',notes:'note'};
 const restored=normaliseState(JSON.parse(JSON.stringify(state)));assert.equal(restored.entries.length,1);assert.equal(currentReading(restored).id,reading.id);assert.equal(restored.custom.length,1);assert.equal(restored.drafts['draft-1'].answer,'unfinished');
});
test('Emptying answers clears every character and draft after reload while preserving the decks and draw progress',()=>{
 const state=emptyState();
 for(const c of characters){
  const reading=drawFromDeck(state,c.id,`saved-${c.id}`,()=>0);
  saveAnswer(state,reading,c.id,'ANSWER_TO_REMOVE','PRIVATE_NOTE_TO_REMOVE');
  state.drafts[`draft-${c.id}`]={answer:'DRAFT_TO_REMOVE',notes:'DRAFT_NOTE_TO_REMOVE'};
 }
 state.custom.push({id:'custom-kept',character:'elas',theme:'Fate',text:'What is beyond the door?'});
 const base=questions[0];state.overrides[base.id]={...base,text:'Whom do you trust?'};state.blackEnabled=false;
 const before=normaliseState(JSON.parse(JSON.stringify(state)));
 clearAnswers(state);
 const restored=normaliseState(JSON.parse(JSON.stringify(state)));
 assert.deepEqual(restored,{...before,entries:[],drafts:{}});
 assert.deepEqual(publicAnswers(restored),[]);
 assert.ok(!JSON.stringify(restored).includes('_TO_REMOVE'));
 for(const c of characters){const previous=restored.current[c.id],next=drawFromDeck(restored,c.id,`next-${c.id}`,()=>0);assert.notEqual(next.qid,restored.history[c.id].find(h=>h.id===previous).qid);}
});
test('Malformed backups cannot create unrecognised characters or question types',()=>{
 const restored=normaliseState({version:1,selected:'unknown',theme:'broken',custom:[{id:'custom-bad',character:'unknown',theme:'Power',text:'Bad?'},{id:'custom-empty',character:'rov',theme:'Power',text:''}],entries:[{id:'bad',character:'unknown',question:'?',answer:'',notes:''}]});
 assert.equal(restored.selected,'corvidae');assert.equal(restored.theme,'All themes');assert.deepEqual(restored.custom,[]);assert.deepEqual(restored.entries,[]);
});

test('A single click draws from the chosen member immediately and keeps other decks separate',()=>{
 const state=emptyState();const reading=drawFromDeck(state,'firebrand','table-firebrand',()=>0);
 assert.equal(state.selected,'firebrand');assert.equal(reading.character,'firebrand');assert.ok(reading.qid.startsWith('firebrand-'));
 assert.equal(state.history.firebrand.length,1);assert.equal(state.history.corvidae,undefined);
 drawFromDeck(state,'elas','table-elas',()=>0);assert.equal(state.history.elas.length,1);assert.equal(state.history.firebrand.length,1);
});
test('Drawing through exhaustion renews only that deck and preserves all saved answers',()=>{
 const state=emptyState();const first=drawFromDeck(state,'corvidae','table-0',()=>0);saveAnswer(state,first,'corvidae','Keep this answer.','Private note.');
 for(let i=1;i<60;i++)drawFromDeck(state,'corvidae',`table-${i}`,()=>0);
 assert.equal(new Set(state.history.corvidae.map(h=>h.qid)).size,60);
 const last=currentReading(state).qid,next=drawFromDeck(state,'corvidae','new-cycle',()=>0);
 assert.notEqual(next.qid,last);assert.equal(state.entries.length,1);assert.equal(state.entries[0].notes,'Private note.');assert.equal(state.history.corvidae.length,61);
});
test('An empty theme or invalid deck does not silently consume a question',()=>{
 const state=emptyState();assert.equal(drawFromDeck(state,'missing','bad'),null);assert.deepEqual(state.history,{});
 state.theme='Nonexistent';assert.equal(drawFromDeck(state,'rov','empty'),null);assert.equal(state.history.rov,undefined);
});

test('The expanded decks retain legacy question IDs and have no duplicate wording',()=>{
 assert.equal(new Set(questions.map(q=>q.text)).size,questions.length);
 for(const character of [...characters,{id:'shared'}])for(let i=1;i<=60;i++)assert.ok(questions.some(q=>q.id===`${character.id}-${i}`));
 assert.equal(questions.find(q=>q.id==='corvidae-1').text,'What makes someone a thief: what they take, who they take it from or why they take it?');
});
test('Sealed-answer views and exports exclude private preparation notes and undrawn questions',()=>{
 const state=emptyState(),q=getPool(state)[0],reading=rememberQuestion(state,q,'sealed-test');
 saveAnswer(state,reading,'corvidae','My answer.','GM SECRET: never display this at the table.');
 const view=publicAnswers(state);assert.equal(view.length,1);assert.equal(view[0].answer,'My answer.');
 assert.equal(view[0].notes,undefined);assert.equal(view[0].theme,undefined);assert.ok(!JSON.stringify(view).includes('GM SECRET'));
 assert.equal(state.entries[0].notes,'GM SECRET: never display this at the table.');
 const restored=normaliseState(JSON.parse(JSON.stringify(state)));assert.deepEqual(publicAnswers(restored),view);
});
