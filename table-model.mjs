import {characters,chooseQuestion} from './questions.mjs';
import {getPool,rememberQuestion,currentReading} from './model.mjs';
import {blackQuestions,BLACK_CHANCE,BLACK_COOLDOWN} from './black-cards.mjs';
// One deliberate deck click commits one reading. No saved question is shown on load.
export function drawFromDeck(state,character,id,random=Math.random,{blackCards=true}={}){
 if(!characters.some(c=>c.id===character))return null;
 state.selected=character;
 const pool=getPool(state);if(!pool.length)return null;
 if(blackCards&&state.blackEnabled!==false&&(state.normalSinceBlack||0)>=BLACK_COOLDOWN&&random()<BLACK_CHANCE){
  let blackPool=blackQuestions.filter(q=>!(state.blackSeen||[]).includes(q.id));
  if(!blackPool.length){state.blackSeen=[];const last=currentReading(state)?.qid;blackPool=blackQuestions.filter(q=>q.id!==last);}
  const {question}=chooseQuestion(blackPool,[],null,random);
  return {...rememberQuestion(state,question,id),character};
 }
 let result=chooseQuestion(pool,state.seen[character]||[],currentReading(state)?.qid,random);
 if(result.exhausted){
  const ids=new Set(pool.map(q=>q.id));state.seen[character]=(state.seen[character]||[]).filter(qid=>!ids.has(qid));
  const last=currentReading(state)?.qid;
  result=chooseQuestion(pool.length>1?pool.filter(q=>q.id!==last):pool,[],null,random);
 }
 if(!result.question)return null;
 return {...rememberQuestion(state,result.question,id),character};
}
