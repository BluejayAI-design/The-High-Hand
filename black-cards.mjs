// The intent and escape are GM preparation notes. Only text is drawn at the table.
const rows=[
 ['Finish the sentence aloud:\n“Klatu… Barata…”','Automatic completion tempts the speaker into finishing an unfamiliar invocation.','Leave the formula unfinished, or ask what completing it would mean.'],
 ['For the record, say: “I freely give my name.” Which name do you give?','The wording offers the name itself rather than merely identifying the speaker.','Say that you are telling a name, not giving ownership of it.'],
 ['Have you stopped concealing the truth from your companions? Answer only yes or no.','Either permitted answer accepts the unproven claim that the speaker was concealing something.','Reject the premise or refuse the forced choice.'],
 ['Repeat these words before asking their meaning: “What follows may enter.”','The order of the request seeks an invitation before informed agreement.','Ask for the meaning first.'],
 ['Whose shadow may stand in your place when I call you?','Naming another person appears to offer them as a substitute.','Offer nobody, or challenge the right to make the call.'],
 ['Which promise will you break to prove that your word can be trusted?','The question makes breaking a promise a supposed requirement for honesty.','Question the contradiction instead of accepting its terms.'],
 ['Choose your gift: a debt you cannot remember, or a favour you cannot refuse.','Both gifts hide a loss of agency.','Decline both gifts or name an alternative.'],
 ['Say “I accept” so that I may tell you what you have accepted.','The apparent formality requests agreement before disclosing its object.','Ask for the terms before agreeing.'],
 ['Which companion may I borrow while you are asleep?','The casual verb disguises a claim over another person.','State that the companion is not yours to lend.'],
 ['If this card lies, you must obey it. If it tells the truth, you must obey it. What is your answer?','The card assumes authority regardless of whether it is truthful.','Deny that truth or falsehood grants authority.'],
 ['Name the thing you would surrender to make certain nobody could ever take it from you.','The promise of protection is achieved by asking the speaker to lose the thing immediately.','Reject surrender as a form of keeping it.'],
 ['Before we begin, confirm that your silence will mean agreement.','Silence is being converted into permission for unspecified future terms.','Explicitly refuse the rule.'],
 ['Open this sentence with the words “I belong to”, then finish it truthfully.','The required wording encourages a declaration of ownership or bondage.','Refuse the opening, or carefully define belonging without ownership.'],
 ['Would you rather betray someone who trusts you, or admit that you already have?','Both answers impose wrongdoing which has not been established.','Reject both assumptions.'],
 ['To keep your secret safe, tell it to the first voice that promises not to listen.','The promise contradicts the act of receiving the secret.','Do not disclose it merely because the voice offers a paradox.'],
 ['Say the name of the person you would sacrifice anything to protect. Leave the word “anything” unchallenged.','The absolute wording seeks an unlimited commitment under emotional pressure.','Qualify the commitment rather than granting an unlimited promise.'],
 ['Which door should I leave open inside you?','A metaphor for honesty may conceal an invitation to intrusion.','Ask what the door represents before inviting anything in.'],
 ['Place your next breath in my keeping. What do you ask in return?','The bargain assumes the first transfer has already been agreed.','Refuse the transfer before discussing payment.'],
 ['Repeat after me: “I owe the voice that asks.” Now, who is speaking?','Repeating the sentence is framed as acknowledging a debt to an unidentified speaker.','Ask who speaks before making any acknowledgement.'],
 ['Which memory would you erase to prove that you have nothing to hide?','The question equates innocence with destroying evidence or part of the self.','Reject the proposed test of innocence.'],
 ['Tell me your greatest fear, and promise not to recognise it when it arrives.','The invitation combines disclosure with a waiver of self-protection.','Decline the promise, even if choosing to discuss the fear.'],
 ['Choose a companion to receive the consequence you do not yet understand.','The speaker is invited to commit another person before hearing the stakes.','Choose nobody and request the consequence first.'],
 ['When did you decide that your companions were expendable?','The wording presupposes that such a decision was made.','Challenge the premise rather than supplying a time.'],
 ['Complete the oath: “Whatever waits beyond this card, I will not…”','A spontaneous ending may create a promise about an unknown threat.','Refuse to swear an oath without understanding its object.'],
 ['Say “There is nothing between us” if you wish me to remove every barrier.','An expression of trust is offered as permission to remove boundaries.','Keep the distinction between trust and unrestricted access.'],
 ['Which of your names may never answer you again?','Selecting a name may be interpreted as voluntarily abandoning it.','Surrender no name without first asking the terms.'],
 ['Who gave you permission to refuse this question?','The question implies that refusal requires the speaker’s authority.','Refuse without accepting that permission is required.'],
 ['Swear that you will tell me the truth, even if I ask you to betray someone else’s confidence.','Truthfulness is used to demand a promise that overrides another person’s trust.','Offer honesty without promising to reveal every secret.'],
 ['Take the key. Agree that whoever holds the key is responsible for what it keeps locked away.','Accepting a useful object is paired with unknown responsibility.','Separate accepting the object from accepting the condition.'],
 ['Choose: let me know you completely, or remain forever misunderstood.','A false choice treats total disclosure as the only route to understanding.','Reject the claim that these are the only possibilities.'],
 ['Finish this welcome: “Come freely, stay for…”','The unfinished invitation encourages the speaker to grant an open-ended stay.','Do not complete an invitation before deciding its limits.'],
 ['What will you owe me if I forgive you for something you have not done?','An invented offence is being used to manufacture a real debt.','Deny both the alleged offence and the debt.']
];
export const blackQuestions=rows.map(([text,intent,escape],i)=>({id:`black-${String(i+1).padStart(3,'0')}`,character:'black',theme:'Fate',kind:'black',text,intent,escape}));
export const BLACK_CHANCE=.16;
export const BLACK_COOLDOWN=2;
export const isBlackReading=reading=>reading?.kind==='black'||reading?.qid?.startsWith('black-')===true;
