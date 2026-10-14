import { StorySchema, type Story } from '../shared/schema';
const make = (
  id: string,
  title: string,
  genre: string,
  art: Story['art'],
  synopsis: string,
  location: string,
  clue: string,
): Story =>
  StorySchema.parse({
    id,
    title,
    genre,
    art,
    synopsis,
    duration: '3–5 min',
    start: 'arrival',
    characters: [
      {
        id: 'mara',
        name: 'Mara Vale',
        role: 'Your former partner',
        personality:
          'Guarded, perceptive, loyal when trusted. Carries guilt about a vanished witness.',
        voiceId: 'c70cfb98867a4bfb9ae20d2401257b92',
      },
      {
        id: 'elias',
        name: 'Elias Reed',
        role: 'The keeper of secrets',
        personality: 'Measured and evasive. Values evidence over promises.',
        voiceId: 'bf322df2096a46f18c579d0baa36f41d',
      },
    ],
    scenes: [
      {
        id: 'arrival',
        title: 'Someone remembers',
        location,
        prose:
          'You were never supposed to come back. But at 2:17 this morning, a message arrived from someone who has been missing for seven years. Now Mara is waiting where the road ends, holding an envelope with your name on it.',
        lines: [
          {
            character: 'mara',
            text: 'Seven years. You could have called before showing up here.',
            direction: 'restrained, hurt beneath a calm voice',
          },
        ],
        choices: [
          {
            id: 'honest',
            text: 'I came because I trust you. Tell me what happened.',
            target: 'evidence',
            trust: { mara: 18 },
            flag: 'trusted-mara',
          },
          {
            id: 'cold',
            text: 'Keep this professional. Show me the envelope.',
            target: 'evidence',
            trust: { mara: -18 },
            flag: 'kept-distance',
          },
        ],
      },
      {
        id: 'evidence',
        title: 'The things we buried',
        location: 'The archive · 11:48 PM',
        prose:
          'Inside the envelope: a faded photograph, a key, and a recording marked DO NOT ERASE. Elias watches you from the doorway. Mara’s silence feels heavier than the rain.',
        lines: [
          {
            character: 'mara',
            text: 'You said you trusted me. I am going to try to deserve that.',
            direction: 'softly, letting her guard down',
            whenFlag: 'trusted-mara',
          },
          {
            character: 'mara',
            text: 'Professional. Right. Then let us stick to what we can prove.',
            direction: 'clipped, concealing hurt',
            whenFlag: 'kept-distance',
          },
          {
            character: 'elias',
            text: 'There is a reason this was sealed. Once you listen, there is no putting it back.',
            direction: 'low, deliberate, warning',
          },
        ],
        choices: [
          {
            id: 'listen',
            text: 'Play the recording. We deserve the truth.',
            target: 'reckoning',
            trust: { elias: -10, mara: 8 },
            clue,
            flag: 'heard-recording',
          },
          {
            id: 'protect',
            text: 'Give Mara the key. Let her decide.',
            target: 'confession',
            trust: { mara: 12 },
            flag: 'protected-mara',
          },
          {
            id: 'ask',
            text: 'Ask Mara what she remembers that night.',
            target: 'confession',
            trust: { mara: 5 },
            minTrust: { character: 'mara', value: 60 },
            clue: 'Mara’s testimony',
          },
        ],
      },
      {
        id: 'reckoning',
        title: 'A voice from the past',
        location: 'The signal room · 12:03 AM',
        prose:
          'The recording is unmistakable. The missing witness is alive. The people who buried the evidence are still here. Somewhere below, a door closes.',
        lines: [
          {
            character: 'mara',
            text: 'I knew you would find it. I just hoped I could tell you first.',
            direction: 'voice trembling, almost a whisper',
          },
          {
            character: 'elias',
            text: 'You have evidence. Now decide what you are willing to lose.',
            direction: 'quietly, resigned',
          },
        ],
        choices: [
          {
            id: 'together',
            text: 'Release the evidence together. No more secrets.',
            target: 'dawn',
            trust: { mara: 15 },
            minTrust: { character: 'mara', value: 60 },
          },
          {
            id: 'alone',
            text: 'Send the recording anonymously. Walk away.',
            target: 'ghost',
            trust: { mara: -10 },
          },
          {
            id: 'bury',
            text: 'Destroy the recording to keep everyone safe.',
            target: 'silence',
            trust: { elias: 20 },
          },
        ],
      },
      {
        id: 'confession',
        title: 'The weight of staying',
        location: 'Outside · 12:10 AM',
        prose:
          'Mara takes the key. For a moment, she looks like the person you remember. She tells you about the witness, the bribe, the choice she has regretted every morning since.',
        lines: [
          {
            character: 'mara',
            text: 'I can open the transmitter. But I need to know you will be beside me when they come.',
            direction: 'vulnerable, gathering courage',
          },
        ],
        choices: [
          {
            id: 'stay',
            text: 'I’m staying. Let’s tell the whole story.',
            target: 'dawn',
            trust: { mara: 20 },
            clue,
          },
          {
            id: 'leave',
            text: 'I can’t carry this for you. Goodbye, Mara.',
            target: 'ghost',
            trust: { mara: -20 },
          },
        ],
      },
      {
        id: 'dawn',
        title: 'Everything in the light',
        location: 'Dawn · 05:36 AM',
        prose:
          'By sunrise, every station is carrying the recording. There will be questions. There will be consequences. But when Mara takes your hand, neither of you lets go.',
        lines: [
          {
            character: 'mara',
            text: 'Maybe coming back was the bravest thing you ever did.',
            direction: 'relieved, warm, softly smiling',
          },
        ],
        choices: [],
        ending: 'The truth, together',
      },
      {
        id: 'ghost',
        title: 'The road out',
        location: 'The highway · 04:21 AM',
        prose:
          'In the rear-view mirror, the lights grow smaller. Your phone vibrates once. You do not look. Some truths travel farther than the people who find them.',
        lines: [
          {
            character: 'elias',
            text: 'The story will get out. Whether it remembers you is another matter.',
            direction: 'distant, reflective',
          },
        ],
        choices: [],
        ending: 'A beautiful disappearance',
      },
      {
        id: 'silence',
        title: 'Nothing to report',
        location: 'The archive · 03:00 AM',
        prose:
          'The tape melts into a black ribbon. Elias locks the door. Tomorrow, this place will look exactly as it always has. That is the terrible part.',
        lines: [
          {
            character: 'mara',
            text: 'You came all this way just to leave things as they were.',
            direction: 'disappointed, barely audible',
          },
        ],
        choices: [],
        ending: 'The cost of silence',
      },
    ],
  });
export const seeds = [
  make(
    'the-last-light',
    'The Last Light',
    'Mystery',
    'coast',
    'A missing voice. A town that keeps its secrets. One last chance to bring everything into the light.',
    'Blackwater coast · 11:32 PM',
    'The lighthouse recording',
  ),
  make(
    'neon-testament',
    'Neon Testament',
    'Sci-fi',
    'city',
    'In a city that sells its memories, the one you lost might be the only one worth keeping.',
    'District 09 · 02:17 AM',
    'The memory-market ledger',
  ),
  make(
    'where-we-disappear',
    'Where We Disappear',
    'Drama',
    'forest',
    'Seven years after the summer that changed everything, an old friend asks you to come home.',
    'Pine Hollow · 08:42 PM',
    'The summer photograph',
  ),
];

// The compact starter stories share graph mechanics, but have their own fictional worlds.
const city = seeds[1];
city.characters[0] = {
  ...city.characters[0],
  name: 'Iris Venn',
  role: 'A memory courier',
  personality:
    'Precise, suspicious of institutions, terrified of forgetting her sister.',
};
city.characters[1] = {
  ...city.characters[1],
  name: 'Dr. Soren',
  role: 'A memory-market archivist',
  personality: 'Speaks gently while treating human experience as inventory.',
};
const cityScenes: [string, string, string, string[]][] = [
  [
    'The memory you sold',
    'District 09 · 02:17 AM',
    'Your apartment recognizes your face, but you do not recognize the photograph on its wall. At the memory exchange, Iris is waiting with a stolen cartridge. The label is in your handwriting.',
    [
      'You paid to forget her. Before I hand this over, I need to know whether you will do it again.',
    ],
  ],
  [
    'An unlicensed life',
    'The exchange · 02:34 AM',
    'Soren leads you beneath the auction floor. On a screen, a young woman repeats the same four seconds of a birthday party. Your receipt says she never existed. The cartridge says otherwise.',
    [
      'You are trusting me with your past. I will not sell it.',
      'Just business, then. That is how they took her from you the first time.',
      'That memory is classified as an asset. Restoring it would breach your contract.',
    ],
  ],
  [
    'The sister in the signal',
    'The upload room · 02:49 AM',
    'The cartridge opens. Your sister did not die; the exchange removed her from every memory in the district. Iris has the broadcast access codes. Soren reaches for the security alarm.',
    [
      'You asked me to find her. I promised I would, even if you forgot asking.',
      'If you broadcast this, everyone gets back the grief they paid to lose.',
    ],
  ],
  [
    'What Iris kept',
    'A service elevator · 02:52 AM',
    'Iris shows you her own receipt. She sold the memory of your sister to buy the cartridge back. She has been helping you save someone she can no longer picture.',
    ['I know she mattered to me. I need you to help me remember why.'],
  ],
  [
    'A city remembers',
    'District 09 · sunrise',
    'The broadcast reaches every sleeping implant. By morning the streets are full of strangers recognizing each other. You find your sister on a train platform. Iris asks her name. This time, you can answer.',
    ['Tell me about her again. Start at the beginning.'],
  ],
  [
    'A private recovery',
    'The outbound train · 04:00 AM',
    'You keep one copy and leave the district. Your sister is a voice in your head now, a face you can almost place. Behind you, a million other stolen lives remain in storage.',
    ['One restored life. A respectable return on your investment.'],
  ],
  [
    'A clean slate',
    'The exchange · 03:00 AM',
    'You sign the receipt. Soren deletes the cartridge. In the elevator, a courier you have never met is crying. You wonder why.',
    ['You promised you would remember this time.'],
  ],
];
city.scenes.forEach((scene, i) => {
  const [title, location, prose, texts] = cityScenes[i];
  Object.assign(scene, { title, location, prose });
  scene.lines.forEach((line, j) => (line.text = texts[j] ?? texts[0]));
});
const cityChoices: Record<string, string> = {
  honest: 'I trust you. Show me what I chose to forget.',
  cold: 'This is a transaction. Hand over the cartridge.',
  listen: 'Restore the cartridge. I need to know who she is.',
  protect: 'Give Iris the access codes. Let her choose.',
  ask: 'Ask Iris why she kept searching for my sister.',
  together: 'Broadcast the stolen memories to the whole city.',
  alone: 'Restore only my memories and leave the district.',
  bury: 'Delete the cartridge. Some pain should stay forgotten.',
  stay: 'Help Iris restore her memories, then broadcast everything.',
  leave: 'Take the cartridge and leave alone.',
};
city.scenes.forEach((s) =>
  s.choices.forEach((c) => {
    c.text = cityChoices[c.id];
  }),
);
city.scenes[4].ending = 'A city remembers';
city.scenes[5].ending = 'A private recovery';
city.scenes[6].ending = 'A clean slate';
const forest = seeds[2];
forest.characters[0] = {
  ...forest.characters[0],
  name: 'June Ellis',
  role: 'Your oldest friend',
  personality: 'Warm, stubborn and ashamed of a decision made as a teenager.',
};
forest.characters[1] = {
  ...forest.characters[1],
  name: 'Arthur Ellis',
  role: 'June’s father',
  personality:
    'Protective, laconic. Believes keeping the family together excuses old lies.',
};
const forestScenes: [string, string, string, string[]][] = [
  [
    'The house by the pines',
    'Pine Hollow · 08:42 PM',
    'June has invited you to the house before it is sold. You have not spoken since the summer her brother disappeared. There are two cups on the porch, and a third still in the cupboard.',
    ['I kept thinking I would call. Then another year would go by.'],
  ],
  [
    'A box marked summer',
    'The attic · 09:18 PM',
    'Inside a shoebox are letters addressed to June. Every one is unopened. Arthur stands in the attic doorway, suddenly looking much older than he did at dinner.',
    [
      'Thank you for believing I wanted to find him. I did.',
      'You want the facts. I understand. I would not trust me either.',
      'Some letters are kinder left unread. He made his choice.',
    ],
  ],
  [
    'The return address',
    'The kitchen · 09:31 PM',
    'June opens the oldest letter. Her brother left willingly, but wrote every month for a year. Arthur intercepted them. The last envelope has an address only an hour away.',
    [
      'All these years I thought he did not want us. You let me think that.',
      'I thought if I could keep this family here, we would stop falling apart.',
    ],
  ],
  [
    'A number on a postcard',
    'The porch · 09:45 PM',
    'June turns the postcard over and finds a phone number. Her hands shake so much that she cannot dial. The crickets have gone quiet. You can hear Arthur washing the same plate again.',
    ['What if he answers? What if he does not? I do not know which is worse.'],
  ],
  [
    'Room for one more',
    'The porch · the following morning',
    'The call lasts until dawn. There is anger, and then a silence with space inside it. June puts the third cup on the table. Down the road, a car slows beside the pines.',
    ['Stay for breakfast. I want you here when he arrives.'],
  ],
  [
    'The long way home',
    'County road · 11:22 PM',
    'You leave June with the letters. In the car, you remember the summer before any of this happened. For the first time, it feels like a memory instead of unfinished business.',
    ['Thank you for coming back, even if you cannot stay.'],
  ],
  [
    'An empty cupboard',
    'The house · midnight',
    'The letters burn in the kitchen stove. June packs the third cup without wrapping it. By next week, strangers will live here and wonder about the mark above the door.',
    ['I will never know why we thought silence would save us.'],
  ],
];
forest.scenes.forEach((scene, i) => {
  const [title, location, prose, texts] = forestScenes[i];
  Object.assign(scene, { title, location, prose });
  scene.lines.forEach((line, j) => (line.text = texts[j] ?? texts[0]));
});
const forestChoices: Record<string, string> = {
  honest: 'I am here now. We do not have to do this alone.',
  cold: 'I came for answers. What really happened that summer?',
  listen: 'Open the letters. June has waited long enough.',
  protect: 'Let June decide whether she wants to read them.',
  ask: 'Ask June what she wishes she had said to him.',
  together: 'Stay with June while she calls her brother.',
  alone: 'Leave the letters with June and go home.',
  bury: 'Burn the letters. Let the past stay in the past.',
  stay: 'Dial the number and stay beside June.',
  leave: 'Tell June you need to leave before she calls.',
};
forest.scenes.forEach((s) =>
  s.choices.forEach((c) => {
    c.text = forestChoices[c.id];
  }),
);
forest.scenes[4].ending = 'Room for one more';
forest.scenes[5].ending = 'The long way home';
forest.scenes[6].ending = 'The silence we inherit';
