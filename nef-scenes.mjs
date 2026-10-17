export const sceneAssets=Object.freeze({
 idle:'assets/madam-nef.webp',
 shadow:'assets/nef-reactions/shadow.webp',
 'draw-curious':'assets/nef-reactions/draw-curious.webp',
 'draw-knowing':'assets/nef-reactions/draw-knowing.webp',
 'listen-attentive':'assets/nef-reactions/listen-attentive.webp',
 'listen-reflective':'assets/nef-reactions/listen-reflective.webp',
 'seal-beckoning':'assets/nef-reactions/seal-beckoning.webp',
 'seal-satisfied':'assets/nef-reactions/seal-satisfied.webp',
 'idle-calm':'assets/nef-reactions/idle-calm.webp',
 'idle-shuffle':'assets/nef-reactions/idle-shuffle.webp',
 'pose-inviting':'assets/nef-reactions/pose-inviting.webp',
 'pose-amused':'assets/nef-reactions/pose-amused.webp',
 'black-scrutiny':'assets/nef-reactions/black-scrutiny.webp',
 farewell:'assets/nef-reactions/farewell.webp'
});
const groups={idle:['idle','idle-calm','idle-shuffle'],drawing:['draw-curious','draw-knowing','pose-inviting'],reading:['draw-knowing','draw-curious','pose-inviting'],listening:['listen-attentive','listen-reflective'],sealing:['seal-beckoning'],settled:['seal-satisfied','pose-amused'],black:['black-scrutiny']};
export function pickReaction(phase,previous=null,random=Math.random){
 const options=groups[phase]||['idle'];const fresh=options.filter(key=>key!==previous);const pool=fresh.length?fresh:options;
 return pool[Math.floor(random()*pool.length)];
}
// Asset loading is independent of game state. A late image can never overwrite
// a newer event (for example, listening over a card already being sealed).
export function createSceneDirector({load,apply}){
 let revision=0,current='idle';
 return {
  get current(){return current;},
  async show(key){
   if(!Object.hasOwn(sceneAssets,key))key='idle';const request=++revision;
   if(key==='idle'){current=key;apply(null,key);return true;}
   try{await load(sceneAssets[key]);}catch{if(request===revision){current='idle';apply(null,'idle');}return false;}
   if(request!==revision)return false;
   current=key;apply(sceneAssets[key],key);return true;
  },
  cancel(){revision++;}
 };
}
