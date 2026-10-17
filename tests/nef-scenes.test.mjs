import test from 'node:test';
import assert from 'node:assert/strict';
import {pickReaction,createSceneDirector,sceneAssets} from '../dist/nef-scenes.mjs';

test('Drawing and listening use distinct alternate reactions rather than repeat the same frame',()=>{
 assert.equal(pickReaction('drawing',null,()=>0),'draw-curious');
 assert.equal(pickReaction('drawing','draw-curious',()=>0),'draw-knowing');
 assert.equal(pickReaction('listening','listen-attentive',()=>0),'listen-reflective');
 assert.equal(pickReaction('sealing',null,()=>0),'seal-beckoning');
 assert.equal(pickReaction('settled',null,()=>0),'seal-satisfied');
});
test('A late drawing frame cannot overwrite a newer sealing frame',async()=>{
 const waiting=new Map(),applied=[];
 const director=createSceneDirector({load:src=>new Promise(resolve=>waiting.set(src,resolve)),apply:(src,key)=>applied.push(key)});
 const first=director.show('draw-curious'),second=director.show('seal-beckoning');
 waiting.get(sceneAssets['seal-beckoning'])();assert.equal(await second,true);
 waiting.get(sceneAssets['draw-curious'])();assert.equal(await first,false);
 assert.deepEqual(applied,['seal-beckoning']);assert.equal(director.current,'seal-beckoning');
});
test('A failed image load falls back to the original art without propagating an error',async()=>{
 const applied=[];const director=createSceneDirector({load:async()=>{throw Error('Missing art');},apply:(src,key)=>applied.push([src,key])});
 assert.equal(await director.show('listen-reflective'),false);assert.equal(director.current,'idle');assert.deepEqual(applied,[[null,'idle']]);
});
test('Returning to idle cancels a pending shadow image so entry does not revert',async()=>{
 let finish;const applied=[];const director=createSceneDirector({load:()=>new Promise(resolve=>{finish=resolve;}),apply:(src,key)=>applied.push(key)});
 const shadow=director.show('shadow');await director.show('idle');finish();assert.equal(await shadow,false);assert.deepEqual(applied,['idle']);
});
