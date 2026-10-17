import {characters} from './questions.mjs';
const ids=characters.map(c=>c.id);
export const emptyVisit=()=>({active:false,readings:{},last:null});
export function normaliseVisit(value,history={}){
 const visit=emptyVisit();visit.active=value?.active===true;
 for(const id of ids){const reading=value?.readings?.[id];if(typeof reading==='string'&&history[id]?.some(h=>h.id===reading))visit.readings[id]=reading;}
 if(ids.includes(value?.last)&&visit.readings[value.last])visit.last=value.last;
 return visit;
}
export function beginVisit(state){if(!state.visit?.active)state.visit={active:true,readings:{},last:null};return state.visit;}
export const deckUsed=(state,id)=>Boolean(state.visit?.readings?.[id]);
export const canDrawVisit=(state,id)=>state.visit?.active===true&&ids.includes(id)&&!deckUsed(state,id);
export function claimVisitCard(state,id,reading){if(!canDrawVisit(state,id)||typeof reading!=='string')return false;state.visit.readings[id]=reading;state.visit.last=id;return true;}
export const visitComplete=state=>ids.every(id=>deckUsed(state,id));
export const visitRemaining=state=>ids.filter(id=>!deckUsed(state,id)).length;
export function lastVisitReading(state){const id=state.visit?.last;const reading=state.history[id]?.find(h=>h.id===state.visit.readings[id]);return reading?{...reading,character:id}:null;}
export function closeVisit(state){if(state.visit)state.visit.active=false;}
