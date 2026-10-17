export const AUDIO_STORAGE_KEY='high-hand-audio-v1';
export const audioAssets={music:'assets/audio/parlor-of-secrets.mp3',entry:'assets/audio/high-hand-entry.mp3',pull:'assets/audio/card-pull.wav',flip:'assets/audio/card-flip.wav',discard:'assets/audio/card-discard.wav',appear:'assets/audio/nef-appear.mp3',vortex:'assets/audio/vortex-swirl.mp3',welcome:'assets/audio/welcome.mp3','leaving-1':'assets/audio/leaving-1.mp3','leaving-2':'assets/audio/leaving-2.mp3',shuffle:'assets/audio/deck-shuffle.wav','black-1':'assets/audio/black-card-1.mp3','black-2':'assets/audio/black-card-2.mp3','black-3':'assets/audio/black-card-3.mp3','deck-corvidae':'assets/audio/deck-corvidae.mp3','deck-elas':'assets/audio/deck-elas.mp3','deck-frostheart':'assets/audio/deck-frostheart.mp3','deck-rov':'assets/audio/deck-rov.mp3','deck-firebrand':'assets/audio/deck-firebrand.wav'};
const effectNames=Object.keys(audioAssets).filter(name=>!['music','entry'].includes(name));
const effectLevel=name=>name.startsWith('deck-')||name.startsWith('black-')||name==='welcome'||name.startsWith('leaving-') ? .8 : ({entry:.55,appear:.6,vortex:.5,shuffle:.65}[name]||1);
export const DEFAULT_AUDIO_SETTINGS={music:.25,effects:.6,muted:false,blackCueIndex:0,leavingCueIndex:0};
export function normaliseAudioSettings(value){
 const volume=(key)=>typeof value?.[key]==='number'&&Number.isFinite(value[key])?Math.max(0,Math.min(1,value[key])):DEFAULT_AUDIO_SETTINGS[key];
 return {music:volume('music'),effects:volume('effects'),muted:value?.muted===true,blackCueIndex:Number.isInteger(value?.blackCueIndex)&&value.blackCueIndex>=0&&value.blackCueIndex<3?value.blackCueIndex:0,leavingCueIndex:value?.leavingCueIndex===1?1:0};
}
// Resume the context during the entry click so timed effects can play after animations.
export function createTableAudio({settings,onSettings=()=>{},onMusicBlocked=()=>{},makeAudio=src=>new Audio(src),makeContext=()=>{const Context=globalThis.AudioContext||globalThis.webkitAudioContext;return Context?new Context():null;},loadBuffer=async(src,context)=>{const response=await fetch(src);if(!response.ok)throw Error('Sound unavailable');return context.decodeAudioData(await response.arrayBuffer());}}={}){
 let preferences=normaliseAudioSettings(settings),started=false,context=null,effectsGain=null,loading=null,reportedMusicError=false,activeCue=null;
 const music=makeAudio(audioAssets.music),entryCue=makeAudio(audioAssets.entry),buffers=new Map(),fallbackEffects=new Map(),sources=new Set(),pending=new Set();
 music.loop=true;music.preload='none';music.volume=preferences.music;music.muted=preferences.muted;
 // Preload the title cue so its first play can occur inside the click gesture.
 entryCue.preload='auto';entryCue.volume=preferences.effects*effectLevel('entry');entryCue.muted=preferences.muted;
 function sync(){
  music.volume=preferences.music;music.muted=preferences.muted;
  entryCue.volume=preferences.effects*effectLevel('entry');entryCue.muted=preferences.muted;
  if(effectsGain)effectsGain.gain.value=preferences.muted?0:preferences.effects;
  for(const [name,audio] of fallbackEffects)audio.volume=preferences.muted?0:preferences.effects*effectLevel(name);
  if(!started||preferences.muted||preferences.music===0){music.pause();return;}
  if(music.paused){try{Promise.resolve(music.play()).then(()=>{reportedMusicError=false;}).catch(()=>{if(!reportedMusicError){reportedMusicError=true;onMusicBlocked();}});}catch{if(!reportedMusicError){reportedMusicError=true;onMusicBlocked();}}}
 }
 function unlock(){
  if(!context){try{context=makeContext();if(context){effectsGain=context.createGain();effectsGain.gain.value=preferences.muted?0:preferences.effects;effectsGain.connect(context.destination);}}catch{context=null;}}
  if(context?.state==='suspended')void context.resume().catch(()=>{});
  if(loading)return loading;
  if(context)loading=Promise.all(effectNames.map(async name=>{try{buffers.set(name,await loadBuffer(audioAssets[name],context));}catch{/* Card actions remain available if a sound cannot load. */}}));
  else{for(const name of effectNames){const audio=makeAudio(audioAssets[name]);audio.preload='auto';audio.volume=preferences.muted?0:preferences.effects*effectLevel(name);audio.load();fallbackEffects.set(name,audio);}loading=Promise.resolve();}
  return loading;
 }
 function start(){started=true;const ready=unlock();sync();if(!preferences.muted&&preferences.effects>0){try{entryCue.currentTime=0;void Promise.resolve(entryCue.play()).catch(()=>{});}catch{}}return ready;}
 function setSettings(patch){preferences=normaliseAudioSettings({...preferences,...patch});if(started)void unlock();sync();onSettings({...preferences});}
 function playEffect(name,delay=0){
  const isCue=(name.startsWith('deck-')||name.startsWith('black-')||name==='welcome'||name.startsWith('leaving-'))&&effectNames.includes(name);
  if(isCue&&activeCue){try{if(activeCue.stop)activeCue.stop();else activeCue.pause();}catch{}activeCue=null;}
  if(!started||preferences.muted||preferences.effects===0||!effectNames.includes(name))return false;
  const wait=Number.isFinite(delay)?Math.max(0,Math.min(2,delay)):0;
  try{
   if(context){if(context.state!=='running'||!buffers.has(name))return false;const source=context.createBufferSource(),level=context.createGain();level.gain.value=effectLevel(name);source.buffer=buffers.get(name);source.connect(level);level.connect(effectsGain);sources.add(source);source.onended=()=>{sources.delete(source);source.disconnect();level.disconnect();if(activeCue===source)activeCue=null;};source.start(context.currentTime+wait);if(isCue)activeCue=source;}
   else{const audio=fallbackEffects.get(name);if(!audio)return false;const play=()=>{if(!started||preferences.muted||preferences.effects===0)return;audio.currentTime=0;if(isCue)activeCue=audio;void Promise.resolve(audio.play()).catch(()=>{});};if(wait){const timer=setTimeout(()=>{pending.delete(timer);play();},wait*1000);pending.add(timer);}else play();}
   return true;
  }catch{return false;}
 }
 function playBlackReveal(delay=0){
  if(!started)return false;
  const played=playEffect(`black-${preferences.blackCueIndex+1}`,delay);
  preferences={...preferences,blackCueIndex:(preferences.blackCueIndex+1)%3};onSettings({...preferences});return played;
 }
 function stopEffects(){
  for(const timer of pending)clearTimeout(timer);pending.clear();
  for(const source of sources){try{source.stop();}catch{}}sources.clear();activeCue=null;
  for(const audio of fallbackEffects.values()){audio.pause();audio.currentTime=0;}
  entryCue.pause();entryCue.currentTime=0;
 }
 function playFarewell(){
  stopEffects();const index=preferences.leavingCueIndex;
  const played=playEffect(`leaving-${index+1}`);
  preferences={...preferences,leavingCueIndex:(index+1)%2};onSettings({...preferences});
  return played&&!preferences.muted&&preferences.effects>0?7100:2400;
 }
 function stop(){stopEffects();started=false;music.pause();music.currentTime=0;}
 return {start,stop,unlock,setSettings,playEffect,playBlackReveal,playFarewell,get settings(){return {...preferences};}};
}
