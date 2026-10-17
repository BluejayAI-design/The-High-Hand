import {moreQuestions} from './more-questions.mjs';
export const characters = [
  {id:'corvidae',name:'Corvidae',role:'The thief',sigil:'key',themes:'Theft · aliases · desire',intro:'There are many ways to enter a locked room. Let us see which doors you leave closed.'},
  {id:'elas',name:'Elas',role:'The wizard',sigil:'eye',themes:'Knowledge · wonder · the unknown',intro:'A question need not have an answer to be worth keeping. What will you make of mine?'},
  {id:'frostheart',name:'Frostheart',role:'The sorcerer',sigil:'star',themes:'Power · pride · belonging',intro:'Some gifts arrive before we know what to ask of them. Tell me what you ask of yours.'},
  {id:'rov',name:'Rov',role:'The paladin',sigil:'sun',themes:'Faith · mercy · promises',intro:'An oath tells me what you promise. Your answer may tell me what the promise means.'},
  {id:'firebrand',name:'Firebrand',role:'The fighter',sigil:'flame',themes:'Strength · craft · purpose',intro:'Steel remembers the hand that shaped it. I wonder what your hands remember.'}
];
// Authored prompts, not prophecies or claims about established character history.
const decks = {
corvidae:[
 ['Identity','What makes someone a thief: what they take, who they take it from or why they take it?'],
 ['Desire','What is something you would steal but would never accept as a gift?'],
 ['Power','Does a stolen thing ever truly become yours? What would have to happen for you to believe it did?'],
 ['Bonds','What do you notice about people when they think nobody is watching?'],
 ['Identity','What is the difference between a thief’s honour and an honest person’s honour?'],
 ['Desire','When does taking what you need become taking too much? Who gets to decide?'],
 ['Power','What can you learn about someone from what they choose to lock away?'],
 ['Identity','Would you rather your greatest theft remain a perfect secret or become a story everyone tells? What would each give you?'],
 ['Bonds','What could someone steal from you that no amount of gold could replace?'],
 ['Bonds','When you return something you stole, what remains unpaid?'],
 ['Identity','When you give someone a false name, what part of yourself do you still give them honestly?'],
 ['Desire','What is the difference between wanting someone and wanting them to want you? How do you recognise it in yourself?'],
 ['Bonds','What does someone have to understand about you before you can trust their affection?'],
 ['Power','What is satisfying about opening a lock when you have no intention of taking anything?'],
 ['Fate','When someone expects you to live up to a legend, what do you want them to see that the legend cannot tell them?']
],
elas:[
 ['Desire','What kind of question makes you forget that you were meant to be doing something else?'],
 ['Power','What is the difference between knowing the words of a spell and understanding what you are asking the world to do?'],
 ['Identity','When someone calls you clever, what do you hope they have noticed about you?'],
 ['Fate','What do shadows help you notice that you would miss in a room full of light?'],
 ['Bonds','How do you decide whether someone is wise enough to teach you?'],
 ['Power','What knowledge would you hesitate to share? What makes keeping it safer than giving it away?'],
 ['Identity','When grown-ups disagree with you, how do you decide whether to listen or stand your ground?'],
 ['Desire','What do you hope magic will let you experience that an ordinary life could not?'],
 ['Fate','If you learnt how your own story ends, what would you do with the days before it?'],
 ['Bonds','What could a person who knows nothing about magic teach you that no spellbook could?'],
 ['Power','How do you tell the difference between something that cannot be done and something nobody has understood yet?'],
 ['Identity','What do you enjoy being bad at? What makes it worth doing anyway?'],
 ['Desire','Which matters more when you discover something: that it is true or that nobody else has found it?'],
 ['Bonds','When does asking another question become a way of avoiding an answer?'],
 ['Fate','What do you hope you will never grow out of?']
],
frostheart:[
 ['Power','What does it mean to deserve a power you were born with? Who could fairly judge that?'],
 ['Identity','Which part of being noble belongs to your name and which part belongs to your actions?'],
 ['Bonds','When someone admires you, how do you tell what they are actually admiring?'],
 ['Desire','What is a luxury you would keep even if nobody else could ever see you enjoying it?'],
 ['Power','When your feelings are strongest, do you trust your power more or less? What makes the difference?'],
 ['Identity','What would remain recognisably yours if your magic were silent for a year?'],
 ['Bonds','What kind of kindness is hardest for you to accept? Why does it ask so much of you?'],
 ['Fate','What would frighten you more: reaching the limit of your power or discovering that it has no limit?'],
 ['Desire','How do you recognise the moment when wanting something becomes needing to prove you can have it?'],
 ['Power','What makes restraint a sign of strength? When might it simply be fear?'],
 ['Identity','What is the difference between being exceptional and needing to be treated as exceptional?'],
 ['Bonds','What does keeping a family heirloom mean to you? Can you treasure what it represents without accepting everything it asks of you?'],
 ['Desire','What can a fine glass of wine give you that victory cannot?'],
 ['Fate','What would a peaceful future have to contain to keep you interested in living it?'],
 ['Power','When is it right to let someone struggle with something you could easily do for them?']
],
rov:[
 ['Identity','What makes a promise sacred: the words, the witness or what it costs you to keep it?'],
 ['Power','When does mercy ask more courage of you than punishment? How would you know you were ready to offer it?'],
 ['Bonds','What can sharing a meal tell you about someone that fighting beside them cannot?'],
 ['Fate','If doing what is right brought no blessing and no reward, what would still make it worth doing?'],
 ['Identity','How do you tell the difference between keeping your oath and hiding behind it?'],
 ['Bonds','What does caring for something small ask of you that defending something great does not?'],
 ['Power','What gives you the right to decide that another person deserves forgiveness?'],
 ['Desire','What do you want for yourself that you find difficult to ask for?'],
 ['Identity','If telling the truth would hurt someone, what does honesty require of you beyond simply saying the words?'],
 ['Bonds','What would make you accept help from someone whose beliefs you cannot share?'],
 ['Power','When does protecting someone begin to take away their freedom?'],
 ['Fate','What would a world that no longer needed paladins look like to you? Would you feel at home in it?'],
 ['Desire','What is the difference between wanting to be good and wanting to be needed?'],
 ['Bonds','What makes a place a sanctuary? Can one person carry that feeling with them?'],
 ['Identity','Which act of goodness would you continue even if everyone mistook it for a weakness?']
],
firebrand:[
 ['Identity','What does a well-made thing reveal about the person who made it?'],
 ['Power','What is the difference between being strong enough to win and strong enough to stop?'],
 ['Desire','What would you choose to make if it never had to be sold, used or admired?'],
 ['Bonds','When you repair something for another person, what do you hope they understand about the gesture?'],
 ['Identity','When does a tool become more than a tool? Does the hand decide, or the work it has done?'],
 ['Power','What can patience achieve that force cannot? How do you know when to change from one to the other?'],
 ['Fate','What can a people keep when the place they called home is lost? How would you recognise it in something they made?'],
 ['Bonds','How can you tell whether someone beside you in battle is brave or simply unwilling to be seen afraid?'],
 ['Identity','What part of your craft could you never explain properly in words?'],
 ['Power','When is breaking something the most careful thing you can do?'],
 ['Desire','What makes a victory worth the wear it leaves on you?'],
 ['Bonds','What do you respect in someone who could never hold their own in a fight?'],
 ['Fate','If there were no more battles to fight, what would you do with the strength they taught you?'],
 ['Identity','What does a mistake at the forge teach you about how to judge mistakes in people?'],
 ['Desire','What is the difference between making something perfect and knowing when it is finished?']
],
shared:[
 ['Fate','What do you believe chance has given you that you could never have earned?'],
 ['Identity','What do strangers see in you that your companions have stopped noticing?'],
 ['Bonds','What can a companion do that makes silence beside them feel comfortable?'],
 ['Desire','What is something you want that becomes harder to explain the more honestly you try?'],
 ['Power','What kind of power would you rather nobody possessed, including you?'],
 ['Fate','How do you recognise a moment that will matter long after it has passed?'],
 ['Bonds','What makes a debt worth keeping instead of paying?'],
 ['Identity','What do you mean when you call somewhere home?'],
 ['Desire','What part of adventure would you miss if all danger were removed from it?'],
 ['Fate','What would make you turn back when everyone else wanted to continue?'],
 ['Power','What is the difference between having a choice and being free?'],
 ['Bonds','What do you owe the people who will never know that you helped them?'],
 ['Identity','What do you do differently when you believe nobody will remember it?'],
 ['Desire','What do you hope you will still be curious about when you are old?'],
 ['Fate','What would make an unfinished journey feel complete?']
]};
export const questions = [...Object.entries(decks).flatMap(([character,rows])=>rows.map(([theme,text],index)=>({id:`${character}-${index+1}`,character,theme,text}))),...moreQuestions];
export const themes=['All themes','Identity','Desire','Bonds','Power','Fate'];
export function poolFor(character,theme='All themes',includeShared=false,custom=[]){return [...questions,...custom].filter(q=>(q.character===character||(includeShared&&q.character==='shared'))&&(theme==='All themes'||q.theme===theme));}
export function chooseQuestion(pool,seen=[],lastId=null,random=Math.random){
  const fresh=pool.filter(q=>!seen.includes(q.id));
  if(!fresh.length)return {question:null,exhausted:true};
  const candidates=fresh.length>1?fresh.filter(q=>q.id!==lastId):fresh;
  return {question:candidates[Math.floor(random()*candidates.length)],exhausted:false};
}
