import {characters,themes} from './questions.mjs';
import {sceneAssets,pickReaction,createSceneDirector} from './nef-scenes.mjs';
import {eyePoints} from './nef-eyes.mjs';
import {beginVisit,deckUsed,canDrawVisit,claimVisitCard,visitComplete,visitRemaining,lastVisitReading,closeVisit} from './visits.mjs';
import {drawFromDeck} from './table-model.mjs';
import {blackQuestions,isBlackReading} from './black-cards.mjs';
import {AUDIO_STORAGE_KEY,createTableAudio} from './audio.mjs';
import {STORAGE_KEY,emptyState,normaliseState,effectiveQuestions,rememberQuestion,saveAnswer,clearAnswers,publicAnswers} from './model.mjs';
const $=id=>document.getElementById(id);
let audioSettings;
try{audioSettings=JSON.parse(localStorage.getItem(AUDIO_STORAGE_KEY));}catch{}
const sound=createTableAudio({settings:audioSettings,onSettings:settings=>{try{localStorage.setItem(AUDIO_STORAGE_KEY,JSON.stringify(settings));}catch{}renderAudioControls();},onMusicBlocked:()=>toast('Music is paused. Adjust the music volume in Sound to try again.')});
function renderAudioControls(){
 const settings=sound.settings;
 for(const [id,key] of [['music','music'],['effects','effects']]){const value=Math.round(settings[key]*100);$(`${id}-volume`).value=value;$(`${id}-volume-value`).textContent=`${value}%`;}
 $('audio-muted').checked=settings.muted;$('sound-open').textContent=settings.muted?'Sound · muted':'Sound';
}
let storageAvailable=true, state;
try{state=normaliseState(JSON.parse(localStorage.getItem(STORAGE_KEY)));}catch{state=emptyState();storageAvailable=false;}
let toastTimer,editingQuestion=null,answerContext=null;
let displayedReading=null,drawing=false,entered=false,entering=false,submitting=false,exiting=false;
const reduceMotion=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let listeningTimer,settledTimer,idleTimer,eyeTimer,eyeEndTimer;
function stopEyeGlow(){clearTimeout(eyeEndTimer);$('nef-eyes').classList.remove('is-glowing');}
function positionNefEyes(key){
 stopEyeGlow();const points=eyePoints[key],eyes=$('nef-eyes');eyes.hidden=!points;
 if(points)for(const [index,side] of ['left','right'].entries()){eyes.style.setProperty(`--${side}-eye-x`,`${points[index][0]}%`);eyes.style.setProperty(`--${side}-eye-y`,`${points[index][1]}%`);}
}
function scheduleEyeGlow(first=false){
 clearTimeout(eyeTimer);if(!entered||reduceMotion())return;
 eyeTimer=setTimeout(()=>{
  if(!document.hidden&&!drawing&&!submitting&&!$('prepare-dialog').open&&eyePoints[nefDirector.current]){
   $('nef-eyes').classList.add('is-glowing');eyeEndTimer=setTimeout(stopEyeGlow,2600);
  }
  scheduleEyeGlow();
 },first?8000+Math.random()*6000:20000+Math.random()*18000);
}
const artLoads=new Map();
function loadNefArt(src){
 if(artLoads.has(src))return artLoads.get(src);
 const promise=new Promise((resolve,reject)=>{const img=new Image();const timeout=setTimeout(()=>reject(Error('Art load timed out')),12000);img.onload=()=>{clearTimeout(timeout);resolve();};img.onerror=()=>{clearTimeout(timeout);reject(Error('Art unavailable'));};img.src=src;});
 artLoads.set(src,promise);promise.catch(()=>artLoads.delete(src));return promise;
}
const nefDirector=createSceneDirector({load:loadNefArt,apply:(src,key)=>{
 const layer=$('nef-layer-a');
 if(src){layer.src=src;layer.classList.add('is-visible');}else layer.classList.remove('is-visible');
 $('nef-layer-b').classList.remove('is-visible');$('chamber').dataset.nefScene=key;
 positionNefEyes(key);
}});
function scheduleIdle(){clearTimeout(idleTimer);if(!entered)return;idleTimer=setTimeout(()=>{if(!drawing&&!submitting&&!document.querySelector('dialog[open]'))void nefDirector.show(pickReaction('idle',nefDirector.current));scheduleIdle();},11000+Math.random()*6000);}
function reactNef(phase){clearTimeout(settledTimer);scheduleIdle();return nefDirector.show(pickReaction(phase,nefDirector.current));}
function stopListening(){clearTimeout(listeningTimer);}
function listenAgain(){stopListening();if(reduceMotion())return;listeningTimer=setTimeout(()=>{if($('answer-dialog').open&&answerContext?.publicAnswer&&!submitting){void reactNef('listening');listenAgain();}},8000);}
function positionPublicAnswer(){
 const dialog=$('answer-dialog');if(!dialog.open||!dialog.classList.contains('public-answer'))return;
 const rect=$('card-slot').getBoundingClientRect(),width=window.innerWidth<800?Math.min(420,window.innerWidth-32):Math.max(300,rect.width);
 const left=Math.min(Math.max(16,rect.left),window.innerWidth-width-16),top=Math.max(16,Math.min(rect.top,window.innerHeight-250));
 Object.assign(dialog.style,{left:`${left}px`,top:`${top}px`,width:`${width}px`,maxHeight:`${window.innerHeight-top-18}px`});
}
const uid=()=>crypto.randomUUID?.()||`reading-${Date.now()}-${Math.random().toString(36).slice(2)}`;
function toast(text){$('toast').textContent=text;$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),3800);}
function persist(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));storageAvailable=true;}catch{storageAvailable=false;toast('This browser could not save. Export the journal before closing.');}updateStorageLabel();return storageAvailable;}
function updateStorageLabel(){$('save-status').textContent=storageAvailable?'Answers stay in this browser · Export from the journal':'Saving unavailable · Export before leaving';}
function charById(id){return characters.find(c=>c.id===id)||characters[0];}
function element(tag,className,text){const el=document.createElement(tag);if(className)el.className=className;if(text!==undefined)el.textContent=text;return el;}
function button(text,handler,className='text-button'){const el=element('button',className,text);el.type='button';el.addEventListener('click',handler);return el;}
function render(){
 $('characters').replaceChildren(...characters.map(c=>{
  const used=deckUsed(state,c.id),el=button('',()=>drawDeck(c.id),'deck');el.dataset.character=c.id;el.disabled=drawing||!entered||used||exiting;el.classList.toggle('deck-used',used);el.style.setProperty('--deck-order',String(characters.indexOf(c)));
  el.setAttribute('aria-label',used?`${c.name} · card already drawn this visit`:`Draw a question for ${c.name}`);el.setAttribute('aria-pressed',String(displayedReading?.character===c.id));
  const stack=element('span','deck-stack');const img=element('img','deck-art');img.src=`assets/cards/${c.id}-back.webp`;img.alt='';img.width=256;img.height=384;
  for(let layer=0;layer<3;layer++){const paper=element('span','assembly-card');paper.style.setProperty('--layer',String(layer));paper.style.backgroundImage=`url(assets/cards/${c.id}-back.webp)`;stack.append(paper);}
  stack.append(img);if(used){const seal=element('img','deck-seal');seal.src='assets/cards/black-back.webp';seal.alt='';stack.append(seal);}el.append(stack,element('span','deck-name',c.name));return el;
 }));
 $('answer-open').disabled=!displayedReading;
 $('empty-answers-open').disabled=!state.entries.length&&!Object.keys(state.drafts).length;
 $('answer-open').textContent=displayedReading&&state.entries.some(e=>e.id===displayedReading.id)?'Edit this answer':'Record this answer';
 $('theme').value=state.theme;$('shared').checked=state.includeShared;$('black-enabled').checked=state.blackEnabled!==false;$('journal-count').textContent=state.entries.length;
 $('answer-card').disabled=drawing||!displayedReading;
 $('answer-card').textContent=displayedReading&&state.entries.some(e=>e.id===displayedReading.id)?'Answer sealed':'Answer this card ↗';
 $('answer-archive').disabled=drawing||!entered;
 $('archive-count').textContent=state.entries.length?`${state.entries.length} ${state.entries.length===1?'answer':'answers'} sealed`:'No answers sealed';
 $('prepare-open').disabled=drawing||!entered;
 $('finish-visit').hidden=!entered||!visitComplete(state)||exiting;$('finish-visit').disabled=drawing||submitting;
 updateStorageLabel();
}
function returnToTable(){
 document.querySelectorAll('dialog[open]').forEach(dialog=>dialog.close());
 $('bank-list').replaceChildren();$('journal-list').replaceChildren();$('chamber').classList.remove('preparing');
 $('characters').querySelector(`[data-character="${state.selected}"]`)?.focus({preventScroll:true});
}
function setDisplayedText(reading){
 $('question-character').textContent=charById(reading.character).name.toUpperCase();
 $('question-text').textContent=reading.text;
 $('question-card').classList.toggle('black-card',isBlackReading(reading));
 $('question-card').classList.toggle('long-question',reading.text.length>230);
 $('question-card').classList.toggle('very-long-question',reading.text.length>410);
}
async function drawDeck(character,forcedQuestion=null){
 if(drawing||!entered)return;
 if(!canDrawVisit(state,character)){toast('One card for each guest. This deck is closed until your next visit.');return;}
 const source=document.querySelector(`[data-character="${character}"] .deck-art`),sourceRect=source?.getBoundingClientRect();
 let reading;
 if(forcedQuestion){state.selected=character;reading={...rememberQuestion(state,forcedQuestion,uid()),character};}
 else reading=drawFromDeck(state,character,uid());
 if(!reading){toast('No questions in this theme. Choose another theme in Preparation.');return;}
 claimVisitCard(state,character,reading.id);
 void sound.unlock();sound.playEffect('pull');
 if(!forcedQuestion)sound.playEffect(`deck-${character}`);
 drawing=true;displayedReading=null;stopListening();void reactNef(isBlackReading(reading)?'black':'drawing');persist();render();
 $('reading-announcement').textContent='';$('welcome').hidden=true;
 const card=$('question-card');card.classList.add('resetting');card.classList.remove('revealed');card.style.visibility='hidden';
 let revealSoundPlayed=false;
 const playRevealSound=()=>{if(revealSoundPlayed)return;revealSoundPlayed=true;sound.playEffect('flip');if(isBlackReading(reading))sound.playBlackReveal(reduceMotion()?0:.36);};
 // Erase the previous face before a new back travels or flips into view.
 $('question-text').textContent='';$('question-character').textContent='';
 $('drawn-back').src=isBlackReading(reading)?'assets/cards/black-back.webp':`assets/cards/${character}-back.webp`;
 $('card-slot').hidden=false;$('card-slot').setAttribute('aria-busy','true');$('table-prompt').textContent='A thread is drawn…';
 void card.offsetWidth;card.classList.remove('resetting');
 try{
  const image=$('drawn-back');if(image.decode)await image.decode().catch(()=>{});
  card.style.visibility='';
  if(!reduceMotion()&&card.animate&&sourceRect){
   const target=$('card-slot').getBoundingClientRect();
   const travel=card.animate([
    {transform:`translate(${sourceRect.left+sourceRect.width/2-target.left-target.width/2}px, ${sourceRect.top+sourceRect.height/2-target.top-target.height/2}px) scale(${sourceRect.width/target.width}) rotate(-9deg)`,opacity:.95},
    {transform:'translate(0,0) scale(1) rotate(0deg)',opacity:1}
   ],{duration:620,easing:'cubic-bezier(.16,.85,.25,1)',fill:'none'});
   await travel.finished.catch(()=>{});
  }
  setDisplayedText(reading);card.classList.add('revealed');playRevealSound();
  if(!reduceMotion())await new Promise(resolve=>setTimeout(resolve,720));
 }catch{
  // Unsupported or cancelled motion should still yield the selected question.
 }finally{
  // Always finish in a consistent visible state, including interrupted animations.
  card.style.visibility='';setDisplayedText(reading);card.classList.add('revealed');playRevealSound();displayedReading=reading;drawing=false;
  $('card-slot').setAttribute('aria-busy','false');$('table-prompt').textContent=visitComplete(state)?'The final thread. Seal your answer, then farewell.':`Choose another deck · ${visitRemaining(state)} remaining`;
  $('reading-announcement').textContent=`${charById(character).name}. Madam Nef asks: ${reading.text}`;void reactNef(isBlackReading(reading)?'black':'reading');render();
 }
}
function openAnswer(entryId,publicAnswer=false){
 if(entryId){const e=state.entries.find(x=>x.id===entryId);if(!e)return;answerContext={reading:{id:e.id,qid:e.qid,text:e.question,theme:e.theme,kind:e.kind,at:e.at},character:e.character};}
 else {const reading=displayedReading;if(!reading)return;answerContext={reading,character:reading.character};}
 answerContext.publicAnswer=publicAnswer;
 $('answer-private-notes').hidden=publicAnswer;
 $('answer-submit').disabled=false;
 $('answer-submit').firstChild.textContent=publicAnswer?'Seal this answer ':'Save answer ';
 const {reading,character}=answerContext,entry=state.entries.find(e=>e.id===reading.id),draft=state.drafts[reading.id];
 $('answer-title').textContent=`${charById(character).name}’s answer`;$('answer-question').textContent=reading.text;
 $('answer-text').value=draft?.answer??entry?.answer??'';$('answer-notes').value=draft?.notes??entry?.notes??'';
 $('answer-text').rows=publicAnswer?5:6;
 $('answer-dialog').classList.toggle('public-answer',publicAnswer);
 for(const property of ['left','top','width','maxHeight'])$('answer-dialog').style[property]='';
 $('answer-dialog').showModal();
 if(publicAnswer){$('chamber').classList.add('answering');positionPublicAnswer();void reactNef('listening');listenAgain();}
 $('answer-text').focus();
}
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function enterChamber(){
 if(entered||entering)return;entering=true;drawing=true;$('enter-chamber').disabled=true;
 beginVisit(state);persist();render();
 void sound.start();
 const motion=!reduceMotion();
 $('intro').classList.add('leaving');$('chamber').setAttribute('aria-busy','true');
 try{
  // Keep the mist visible while the clicked title breaks apart.
  const shadowReady=nefDirector.show('shadow');
  for(const src of Object.values(sceneAssets))void loadNefArt(src).catch(()=>{});
  await Promise.all([shadowReady,motion?pause(1150):Promise.resolve()]);
  $('chamber').classList.remove('awaiting-entry');$('chamber').classList.add('entered','summoning','assembling');$('intro').hidden=true;
  sound.playEffect('shuffle');
  await pause(motion?1800:900);
  // Lift the shadow veil to reveal Nef beneath it. Later pose swaps stay direct.
  sound.playEffect('appear');
  if(motion){$('chamber').classList.add('materialising');await pause(950);}
  await nefDirector.show('idle');
  sound.playEffect('welcome');
  $('chamber').classList.remove('summoning','materialising');
 }finally{
  $('intro').hidden=true;$('intro').classList.remove('leaving');$('chamber').classList.remove('awaiting-entry','assembling','summoning','materialising');$('chamber').classList.add('entered');$('chamber').setAttribute('aria-busy','false');
  void nefDirector.show('idle');
  entered=true;entering=false;drawing=false;$('table-world').inert=false;render();scheduleIdle();scheduleEyeGlow(true);
  const previous=lastVisitReading(state);
  if(previous){displayedReading=previous;setDisplayedText(previous);$('question-card').classList.add('revealed');$('drawn-back').src=isBlackReading(previous)?'assets/cards/black-back.webp':`assets/cards/${previous.character}-back.webp`;$('card-slot').hidden=false;$('welcome').hidden=true;render();}
  $('table-prompt').textContent=visitComplete(state)?'The final thread. Seal your answer, then farewell.':`One card each · ${visitRemaining(state)} decks open`;
  ($('characters').querySelector('button:not(:disabled)')||$('answer-card')).focus({preventScroll:true});
 }
}
async function absorbReading(reading){
 sound.playEffect('discard');
 drawing=true;stopListening();void reactNef('sealing');render();$('answer-archive').classList.add('absorbing');$('table-prompt').textContent='Your answer joins the dark…';
 const card=$('question-card');let flight;
 sound.playEffect('vortex',(!reduceMotion()&&card.animate) ? .9 : 0);
 try{
  if(!reduceMotion()&&card.animate){
   const source=$('card-slot').getBoundingClientRect(),target=$('answer-archive').querySelector('.vortex-art').getBoundingClientRect();
   const dx=target.left+target.width/2-source.left-source.width/2,dy=target.top+target.height/2-source.top-source.height/2;
   card.classList.remove('revealed');
   flight=card.animate([
    {transform:'translate(0,0) scale(1) rotate(0deg)',opacity:1,filter:'blur(0px)'},
    {transform:`translate(${dx*.3}px,${dy-45}px) scale(.8) rotate(30deg)`,opacity:1,filter:'blur(0px)',offset:.4},
    {transform:`translate(${dx}px,${dy}px) scale(.025) rotate(430deg)`,opacity:0,filter:'blur(5px)'}
   ],{duration:1250,easing:'cubic-bezier(.55,.03,.7,.9)',fill:'forwards'});
   await flight.finished.catch(()=>{});
  }
 }catch{
  // The saved entry is authoritative even if motion is interrupted.
 }finally{
  $('card-slot').hidden=true;flight?.cancel();card.classList.remove('revealed');
  $('question-text').textContent='';$('question-character').textContent='';displayedReading=null;drawing=false;
  $('answer-archive').classList.remove('absorbing');void reactNef('settled');settledTimer=setTimeout(()=>{if(!drawing&&!displayedReading&&!$('answer-dialog').open)void nefDirector.show('idle');},5500);$('welcome').hidden=false;
  $('welcome').querySelector('h1').textContent='Your answer is kept.';
  $('welcome').querySelector('p:last-child').textContent='Another card, when you are ready.';
  $('table-prompt').textContent=`A thread is kept · ${visitRemaining(state)} decks open`;
  $('reading-announcement').textContent=`${charById(reading.character).name}’s answer has been added to the sealed archive.`;render();
  if(visitComplete(state))await leaveChamber();else $('characters').querySelector('button:not(:disabled)')?.focus({preventScroll:true});
 }
}
async function leaveChamber(){
 if(exiting||!entered||!visitComplete(state))return;
 exiting=true;drawing=true;closeVisit(state);persist();
 clearTimeout(idleTimer);clearTimeout(eyeTimer);clearTimeout(settledTimer);stopListening();stopEyeGlow();returnToTable();
 $('card-slot').hidden=true;$('welcome').hidden=false;$('welcome').querySelector('h1').textContent='Our audience is ended.';$('welcome').querySelector('p:last-child').textContent='Keep what you have given me. Until we meet again.';
 $('table-prompt').textContent='Five threads. The Hand is closed.';$('chamber').classList.add('departing');$('table-world').inert=true;render();
 const duration=sound.playFarewell();
 try{
  await nefDirector.show('farewell');
  await pause(Math.max(900,duration-(reduceMotion()?300:1800)));
  $('chamber').classList.add('vanishing');
  if(!reduceMotion())await pause(700);
  await nefDirector.show('shadow');
  await pause(reduceMotion()?300:1100);
 }finally{
  sound.stop();nefDirector.cancel();stopEyeGlow();
  entered=false;entering=false;exiting=false;drawing=false;displayedReading=null;answerContext=null;
  $('chamber').classList.remove('entered','departing','vanishing','assembling','summoning','materialising');$('chamber').classList.add('awaiting-entry');$('chamber').setAttribute('aria-busy','false');
  $('intro').hidden=false;$('enter-chamber').disabled=false;$('table-world').inert=true;$('question-card').classList.remove('revealed');$('question-text').textContent='';$('question-character').textContent='';
  $('welcome').querySelector('h1').textContent='Choose your deck.';$('welcome').querySelector('p:last-child').textContent='Draw a card. Let me hear your answer.';
  render();void nefDirector.show('shadow');$('enter-chamber').focus({preventScroll:true});
 }
}
function renderPublicArchive(){
 const filter=$('archive-filter').value,entries=publicAnswers(state).filter(e=>filter==='all'||e.character===filter).slice().reverse();
 $('archive-list').replaceChildren(...entries.map(e=>{
  const detail=element('details',e.kind==='black'?'entry sealed-entry black-entry':'entry sealed-entry'),summary=element('summary','',`${charById(e.character).name} · ${dateLabel(e.at)}`);
  detail.append(summary,element('h3','',e.question),element('p','entry-answer',e.answer||'No spoken answer was recorded.'));return detail;
 }));
 if(!entries.length)$('archive-list').append(emptyView('The dark is listening.','Answer a card to place it in the Sealed Hand.'));
}
function exportPublicAnswers(){
 const lines=['# The High Hand — Sealed answers',''];
 for(const e of publicAnswers(state))lines.push(`## ${charById(e.character).name} · ${dateLabel(e.at)}`,'',e.question,'',e.answer||'(No answer recorded.)','');
 download(`The-High-Hand-Answers-${new Date().toISOString().slice(0,10)}.md`,lines.join('\n'),'text/markdown;charset=utf-8');
}
function saveDraft(){if(!answerContext)return;state.drafts[answerContext.reading.id]={answer:$('answer-text').value,notes:$('answer-notes').value};persist();}
function dateLabel(at){const d=new Date(at);return Number.isNaN(d.valueOf())?'Reading':new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric'}).format(d);}
function emptyView(title,text){const el=element('div','empty');el.append(element('span','','✧'),element('h3','',title),element('p','',text));return el;}
function renderJournal(){
 const filter=$('journal-filter').value,entries=state.entries.filter(e=>filter==='all'||e.character===filter).slice().reverse();
 $('journal-list').replaceChildren(...entries.map(e=>{
  const article=element('article','entry'),head=element('div','entry-head');head.append(element('span','',`${charById(e.character).name.toUpperCase()} · ${e.theme.toUpperCase()}`),element('span','',dateLabel(e.at)));
  article.append(head,element('h3','',e.question),element('p','entry-answer',e.answer||'No answer recorded.'));
  if(e.notes)article.append(element('p','entry-notes',`Notes for the next reading\n${e.notes}`));
  const actions=element('div','entry-actions');actions.append(button('Edit entry',()=>openAnswer(e.id)));article.append(actions);return article;
 }));
 if(!entries.length)$('journal-list').append(emptyView('No words recorded yet.','Draw a question, let the character answer and keep what matters here.'));
}
function renderBank(){
 const deck=$('bank-filter').value,search=$('bank-search').value.trim().toLocaleLowerCase();
 const pool=(deck==='black'?blackQuestions:effectiveQuestions(state).filter(q=>q.character===deck)).filter(q=>!search||`${q.text} ${q.theme}`.toLocaleLowerCase().includes(search));
 $('bank-summary').textContent=`${pool.length} questions · ${deck==='black'?'Private trap notes. No mechanical consequences are applied automatically':deck==='shared'?'Shared questions for any member of Pathos':charById(deck).themes}. Read aloud, adapt or add your own.`;
 $('bank-list').replaceChildren(...pool.map(q=>{
  const item=element('article','bank-item'),head=element('div','entry-head');head.append(element('span','',q.theme.toUpperCase()),element('span','',state.custom.some(c=>c.id===q.id)?'YOUR QUESTION':q.kind==='black'?'BLACK CARD':state.overrides[q.id]?'EDITED':'MADAM NEF'));
  const actions=element('div','bank-actions');actions.append(button('Ask this question ↗',()=>{
   const character=['shared','black'].includes(q.character)?state.selected:q.character;
   returnToTable();drawDeck(character,q);
  }));if(q.kind!=='black')actions.append(button('Edit',()=>openEditor(q)));
  item.append(head,element('h3','',q.text));if(q.kind==='black'){item.append(element('p','dialog-hint',`Hidden intent: ${q.intent}`),element('p','dialog-hint',`Possible escape: ${q.escape}`));}item.append(actions);return item;
 }));
 if(!pool.length)$('bank-list').append(emptyView('No matching questions.','Try another search or add a question of your own.'));
}
function openEditor(q=null){
 editingQuestion=q?.id||null;$('edit-title').textContent=q?'Edit this question':'Add a question';
 $('edit-character').value=q?.character||($('bank-filter').value==='black'?state.selected:$('bank-filter').value)||state.selected;$('edit-theme').value=q?.theme||'Identity';$('edit-text').value=q?.text||'';
 $('edit-dialog').showModal();$('edit-text').focus();
}
function download(filename,text,type){const blob=new Blob([text],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function exportJournal(){
 const lines=['# Madam Nef — The Pathos Readings','',`Exported ${new Date().toLocaleString('en-GB')}`,'','## Reading journal',''];
 if(!state.entries.length)lines.push('No answers recorded yet.','');
 for(const e of state.entries){lines.push(`### ${charById(e.character).name} · ${dateLabel(e.at)}`,`Theme: ${e.theme}`,'',e.question,'',e.answer||'(No answer recorded.)','');if(e.notes)lines.push('Notes for the next reading:',e.notes,'');}
 lines.push('## Question decks','');
 for(const char of [...characters,{id:'shared',name:'Shared Pathos questions'}]){lines.push(`### ${char.name}`,'');for(const q of effectiveQuestions(state).filter(q=>q.character===char.id))lines.push(`- **${q.theme}:** ${q.text}`);lines.push('');}
 download(`Madam-Nef-Journal-${new Date().toISOString().slice(0,10)}.md`,lines.join('\n'),'text/markdown;charset=utf-8');toast('Journal and question decks exported.');
}
// All content, including user-authored answers, is inserted as text, never HTML.
$('enter-chamber').addEventListener('click',enterChamber);
$('finish-visit').addEventListener('click',()=>{if(!drawing&&!submitting)void leaveChamber();});
$('sound-open').addEventListener('click',()=>{$('sound-dialog').showModal();});
$('music-volume').addEventListener('input',()=>sound.setSettings({music:Number($('music-volume').value)/100}));
$('effects-volume').addEventListener('input',()=>sound.setSettings({effects:Number($('effects-volume').value)/100}));
$('audio-muted').addEventListener('change',()=>sound.setSettings({muted:$('audio-muted').checked}));
$('answer-card').addEventListener('click',()=>{if(!drawing&&displayedReading)openAnswer(null,true);});
$('answer-archive').addEventListener('click',()=>{if(drawing||!entered)return;renderPublicArchive();$('archive-dialog').showModal();});
$('archive-filter').addEventListener('change',renderPublicArchive);
$('archive-export').addEventListener('click',exportPublicAnswers);
$('prepare-open').addEventListener('click',()=>{if(drawing)return;render();$('chamber').classList.add('preparing');$('prepare-dialog').showModal();});
$('return-table').addEventListener('click',returnToTable);
$('prepare-dialog').addEventListener('close',()=>{document.querySelectorAll('dialog[open]').forEach(dialog=>dialog.close());$('bank-list').replaceChildren();$('journal-list').replaceChildren();$('chamber').classList.remove('preparing');});
$('answer-open').addEventListener('click',()=>openAnswer());
$('theme').addEventListener('change',()=>{state.theme=$('theme').value;persist();render();});
$('black-enabled').addEventListener('change',()=>{state.blackEnabled=$('black-enabled').checked;persist();render();});
$('shared').addEventListener('change',()=>{state.includeShared=$('shared').checked;persist();render();});
$('empty-answers-open').addEventListener('click',()=>{$('empty-answers-dialog').showModal();});
$('empty-answers-confirm').addEventListener('click',()=>{
 clearAnswers(state);answerContext=null;$('answer-form').reset();
 const saved=persist();render();renderJournal();renderPublicArchive();
 $('empty-answers-dialog').close();
 if(!displayedReading){$('welcome').querySelector('h1').textContent='Choose your deck.';$('welcome').querySelector('p:last-child').textContent='Draw a card. Let me hear your answer.';}
 toast(saved?'All answers have been emptied.':'Answers cleared for this session. Browser saving is unavailable.');
});
$('answer-dialog').addEventListener('close',()=>{stopListening();$('chamber').classList.remove('answering');if(!drawing&&!submitting&&entered)void reactNef(displayedReading?'reading':'settled');});
window.addEventListener('resize',positionPublicAnswer);
$('answer-text').addEventListener('input',saveDraft);$('answer-notes').addEventListener('input',saveDraft);
$('answer-form').addEventListener('submit',async e=>{
 e.preventDefault();if(!answerContext||submitting)return;
 const context=answerContext,answer=$('answer-text').value,notes=$('answer-notes').value;
 if(!answer.trim()&&(!notes.trim()||context.publicAnswer)){toast('Give this card an answer before sealing it.');return;}
 submitting=true;$('answer-submit').disabled=true;
 try{
  const isDisplayed=displayedReading?.id===context.reading.id;
  saveAnswer(state,context.reading,context.character,answer,notes);const saved=persist();render();
  if($('journal-dialog').open)renderJournal();
  $('answer-dialog').close();
  if(isDisplayed){returnToTable();await absorbReading(context.reading);}
  if(entered)toast(saved?'Your answer has been sealed.':'Kept for this session only. Export a backup before leaving.');
 }finally{submitting=false;$('answer-submit').disabled=false;}
});
$('journal-open').addEventListener('click',()=>{renderJournal();$('journal-dialog').showModal();});
$('journal-filter').addEventListener('change',renderJournal);$('export-journal').addEventListener('click',exportJournal);
$('bank-open').addEventListener('click',()=>{$('bank-filter').value=state.selected;renderBank();$('bank-dialog').showModal();});
$('bank-filter').addEventListener('change',renderBank);$('bank-search').addEventListener('input',renderBank);$('add-question').addEventListener('click',()=>openEditor());
$('edit-form').addEventListener('submit',e=>{e.preventDefault();const text=$('edit-text').value.trim();if(!text){$('edit-text').focus();return;}const q={id:editingQuestion||`custom-${uid()}`,character:$('edit-character').value,theme:$('edit-theme').value,text};const customIndex=state.custom.findIndex(c=>c.id===q.id);if(!editingQuestion)state.custom.push(q);else if(customIndex>=0)state.custom[customIndex]=q;else state.overrides[q.id]=q;persist();render();renderBank();$('edit-dialog').close();toast('Question kept in Madam Nef’s deck.');});
document.querySelectorAll('[data-close]').forEach(el=>el.addEventListener('click',()=>$(el.dataset.close).close()));
for(const selectId of ['journal-filter','bank-filter','edit-character','archive-filter'])for(const c of characters){const opt=element('option','',c.name);opt.value=c.id;$(selectId).append(opt);}
{const opt=element('option','','Black cards · GM trap notes');opt.value='black';$('bank-filter').append(opt);}
for(const selectId of ['bank-filter','edit-character']){const opt=element('option','','Shared · all of Pathos');opt.value='shared';$(selectId).append(opt);}
const backup=element('details','backup-controls');backup.append(element('summary','','Backup & restore'));
const backupHint=element('p','dialog-hint','A backup includes answers, drafts, edited questions and reading history. Restoring merges it with this browser’s journal.');
const backupActions=element('div','entry-actions');
backupActions.append(button('Download backup',()=>download(`Madam-Nef-Backup-${new Date().toISOString().slice(0,10)}.json`,JSON.stringify(state,null,2),'application/json')));
const restoreInput=element('input');restoreInput.type='file';restoreInput.accept='.json,application/json';restoreInput.hidden=true;
backupActions.append(button('Restore backup',()=>restoreInput.click()));backup.append(backupHint,backupActions,restoreInput);$('journal-dialog').append(backup);
restoreInput.addEventListener('change',async()=>{try{
 const file=restoreInput.files[0];if(!file)return;if(file.size>12000000)throw Error('This backup is too large.');
 const raw=JSON.parse(await file.text());if(raw.version!==1||!Array.isArray(raw.entries)||!Array.isArray(raw.custom))throw Error('Choose a Madam Nef backup file.');
 const imported=normaliseState(raw);
 for(const key of ['entries','custom'])state[key]=[...new Map([...imported[key],...state[key]].map(e=>[e.id,e])).values()];
 state.blackSeen=[...new Set([...(imported.blackSeen||[]),...(state.blackSeen||[])])];state.normalSinceBlack=Math.min(imported.normalSinceBlack,state.normalSinceBlack);
 state.overrides={...imported.overrides,...state.overrides};state.drafts={...imported.drafts,...state.drafts};
 for(const c of characters){state.seen[c.id]=[...new Set([...(state.seen[c.id]||[]),...(imported.seen[c.id]||[])])];state.history[c.id]=[...new Map([...(imported.history[c.id]||[]),...(state.history[c.id]||[])].map(h=>[h.id,h])).values()].sort((a,b)=>String(a.at).localeCompare(String(b.at))).slice(-1000);}
 state=normaliseState(state);persist();render();renderJournal();toast('Backup merged. Existing answers and edits were kept.');
 }catch(e){toast(e instanceof SyntaxError?'This file is not a valid backup.':e.message||'Could not restore this backup.');}finally{restoreInput.value='';}});
render();
renderAudioControls();
void nefDirector.show('shadow');
