import {characters,questions,themes} from './questions.mjs';
import {blackQuestions,isBlackReading} from './black-cards.mjs';
import {emptyVisit,normaliseVisit} from './visits.mjs';
export const STORAGE_KEY='madam-nef-pathos-v1';
export const characterIds=characters.map(c=>c.id);
export const validDeck=id=>id==='shared'||characterIds.includes(id);
export function emptyState(){return {version:1,selected:'corvidae',theme:'All themes',includeShared:false,blackEnabled:true,normalSinceBlack:0,blackSeen:[],seen:{},history:{},current:{},entries:[],custom:[],overrides:{},drafts:{},visit:emptyVisit()};}
export function cleanQuestion(q){return q&&typeof q.id==='string'&&q.id.length<100&&validDeck(q.character)&&themes.slice(1).includes(q.theme)&&typeof q.text==='string'&&q.text.trim().length>0&&q.text.length<=650?{id:q.id,character:q.character,theme:q.theme,text:q.text.trim()}:null;}
export function normaliseState(value){
 const out=emptyState(); if(!value||value.version!==1)return out;
 if(characterIds.includes(value.selected))out.selected=value.selected;
 if(themes.includes(value.theme))out.theme=value.theme;
 out.includeShared=value.includeShared===true;
 out.blackEnabled=value.blackEnabled!==false;
 out.normalSinceBlack=Number.isInteger(value.normalSinceBlack)?Math.max(0,Math.min(1000,value.normalSinceBlack)):0;
 out.blackSeen=Array.isArray(value.blackSeen)?[...new Set(value.blackSeen.filter(id=>blackQuestions.some(q=>q.id===id)))]:[];
 out.custom=Array.isArray(value.custom)?value.custom.slice(0,2000).map(cleanQuestion).filter(q=>q&&q.id.startsWith('custom-')):[];
 if(value.overrides&&typeof value.overrides==='object')for(const base of questions){const q=cleanQuestion(value.overrides[base.id]);if(q&&q.id===base.id)out.overrides[q.id]=q;}
 for(const id of characterIds){
  out.seen[id]=Array.isArray(value.seen?.[id])?[...new Set(value.seen[id].filter(v=>typeof v==='string'&&v.length<100))].slice(-5000):[];
  out.history[id]=Array.isArray(value.history?.[id])?value.history[id].filter(h=>h&&typeof h.id==='string'&&h.id.length<100&&typeof h.qid==='string'&&typeof h.text==='string'&&h.text.length<=650&&themes.slice(1).includes(h.theme)).slice(-1000).map(h=>({id:h.id,qid:h.qid,text:h.text,theme:h.theme,kind:isBlackReading(h)?'black':'standard',at:typeof h.at==='string'?h.at:''})):[];
  if(out.history[id].some(h=>h.id===value.current?.[id]))out.current[id]=value.current[id];
 }
 out.entries=Array.isArray(value.entries)?value.entries.filter(e=>e&&typeof e.id==='string'&&characterIds.includes(e.character)&&typeof e.question==='string'&&e.question.length<=650&&typeof e.answer==='string'&&e.answer.length<=15000&&typeof e.notes==='string'&&e.notes.length<=5000).slice(-5000).map(e=>({id:e.id,character:e.character,qid:String(e.qid||''),question:e.question,theme:themes.includes(e.theme)?e.theme:'Identity',kind:isBlackReading(e)?'black':'standard',answer:e.answer,notes:e.notes,at:typeof e.at==='string'?e.at:new Date().toISOString()})):[];
 if(value.drafts&&typeof value.drafts==='object')for(const [id,d] of Object.entries(value.drafts).slice(-5000)){if(id.length<100&&d&&typeof d.answer==='string'&&typeof d.notes==='string')out.drafts[id]={answer:d.answer.slice(0,15000),notes:d.notes.slice(0,5000)};}
 out.visit=normaliseVisit(value.visit,out.history);
 return out;
}
export function effectiveQuestions(state){return [...questions.map(q=>state.overrides[q.id]||q),...state.custom];}
export function getPool(state){return effectiveQuestions(state).filter(q=>(q.character===state.selected||(state.includeShared&&q.character==='shared'))&&(state.theme==='All themes'||q.theme===state.theme));}
export function currentReading(state){return (state.history[state.selected]||[]).find(h=>h.id===state.current[state.selected])||null;}
export function rememberQuestion(state,q,id,at=new Date().toISOString()){
 const char=state.selected; const item={id,qid:q.id,text:q.text,theme:q.theme,kind:q.kind==='black'?'black':'standard',at};
 state.history[char]=[...(state.history[char]||[]),item].slice(-1000);state.current[char]=id;
 state.seen[char]=[...new Set([...(state.seen[char]||[]),q.id])];
 if(item.kind==='black'){state.normalSinceBlack=0;state.blackSeen=[...new Set([...(state.blackSeen||[]),q.id])];}
 else state.normalSinceBlack=Math.min(1000,(state.normalSinceBlack||0)+1);
 return item;
}
export function saveAnswer(state,reading,char,answer,notes){
 const entry={id:reading.id,character:char,qid:reading.qid,question:reading.text,theme:reading.theme,kind:isBlackReading(reading)?'black':'standard',answer:answer.trim(),notes:notes.trim(),at:reading.at||new Date().toISOString()};
 const i=state.entries.findIndex(e=>e.id===entry.id);if(i>=0)state.entries[i]=entry;else state.entries.push(entry);
 delete state.drafts[entry.id];return entry;
}
export function clearAnswers(state){state.entries=[];state.drafts={};}
// The table archive intentionally excludes preparation notes and unused questions.
export function publicAnswers(state){return state.entries.map(({id,character,question,answer,at,kind})=>({id,character,question,answer,at,kind:kind==='black'?'black':'standard'}));}
