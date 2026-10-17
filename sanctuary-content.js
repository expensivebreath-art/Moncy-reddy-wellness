/* "Open When You Need Me" — all words, prompts and media references live here.
   Edit freely. To add a real voice message, drop an mp3 into assets/voice/ using the
   file name listed in `voice` below; the player only appears when the file actually loads.
   To use real nature recordings, add rain.mp3, wind.mp3, forest.mp3, water.mp3 to assets/nature/;
   otherwise soft generated sounds are used. */
window.SANCTUARY_CONTENT = {
  entry: {
    title: "You’re here.",
    text: "Take a gentle breath. You don’t have to figure everything out right now.",
    button: "Step into your peaceful place →"
  },
  walk: {
    text: "You don’t have to solve your entire life tonight. Just be here for this moment.",
    signs: ["Let Go", "Breathe", "You Are Enough", "One Step at a Time"]
  },
  letGo: {
    title: "Let it rest by the water",
    intro: "If something is weighing on you, you can look at it here. Or just watch the lake. Both are fine.",
    worries: [
      { id: "overthinking", label: "Overthinking", message: "You don’t need to find every answer tonight. Some things can remain unanswered while you rest." },
      { id: "self-doubt", label: "Self-doubt", message: "You are allowed to be learning. You do not have to be perfect to be worthy of kindness." },
      { id: "fear", label: "Fear", message: "Fear often shows up around things that matter to you. You can feel it and still move at your own pace." },
      { id: "pressure", label: "Pressure", message: "You can take life one step at a time. Your pace does not have to match anyone else’s." },
      { id: "past-hurts", label: "Past hurts", message: "What happened then doesn’t decide your worth now. You can be gentle with the part of you that still remembers." },
      { id: "expectations", label: "Expectations", message: "Other people’s expectations are not a measure of your value. You get to choose which ones are truly yours." }
    ],
    keepNote: "You don’t have to stop feeling it. Letting go can simply mean setting it down for a while.",
    releasedNote: "Set down. You can always pick it up again, and you don’t have to."
  },
  nook: {
    title: "A space for your heart.",
    text: "Breathe slower. Feel lighter. You are allowed to rest without earning it.",
    choices: [
      { id: "comfort", label: "I need comfort.", action: "Wrap yourself in the blanket", lines: ["Nothing is asked of you here.", "Let your shoulders drop, just a little.", "You are held by this quiet, for as long as you like."] },
      { id: "overwhelmed", label: "I feel overwhelmed.", action: "Look around the room", lines: ["Find one thing you can see. The lantern, the cup, the window.", "Now one thing you can hear. Even the quiet counts.", "Now one thing you can feel: the floor, the blanket, your breath. That’s enough for this moment."] },
      { id: "encouragement", label: "I need encouragement.", action: "Light a lantern", lines: ["You have gotten through every hard day so far.", "Being tired doesn’t mean you’re failing.", "Small steps still move you forward.", "You are doing better than you think you are.", "Who you are is already enough to be cared about."] },
      { id: "rest", label: "I just want to rest.", action: "Let the room go quiet", lines: ["There is nothing to do. Stay as long as you like."] }
    ]
  },
  categories: [
    {
      id: "sad", title: "When You Feel Sad", blurb: "Let’s make room for what you’re feeling, without judging it.",
      voice: "assets/voice/sad.mp3",
      lines: ["It’s okay to feel sad. You don’t have to explain it or fix it right now.", "Sadness is not a sign that something is wrong with you. It is often a sign that you care.", "You can let this feeling be here for a while. It will not stay at exactly this size forever."],
      prompt: "If you’d like, write what’s sitting on your heart. It will fall away like rain and won’t be saved unless you choose to keep it."
    },
    {
      id: "overthinking", title: "When You’re Overthinking", blurb: "You don’t have to solve every possibility right now.",
      voice: "assets/voice/overthinking.mp3",
      lines: ["Your mind is trying to protect you. You can thank it and still put things down.", "Not every thought needs an answer tonight. Some can wait for morning light.", "Set one thought on the water. It will float on without you carrying it."],
      prompt: "Write the thought that keeps circling. Then place it on the lake."
    },
    {
      id: "motivation", title: "When You Need Motivation", blurb: "One small step is enough to begin again.",
      voice: "assets/voice/motivation.mp3",
      lines: ["You don’t need a big burst of energy. You only need one small, kind beginning.", "Starting small is not weak. It is how most good things begin.", "Choose a tiny step and let that be enough for now."],
      steps: ["Drink a glass of water", "Open a window or step outside for a minute", "Tidy one small corner", "Write down one thing for today", "Stretch for two minutes"],
      stepDone: "That counts. You began, and beginning is the hard part."
    },
    {
      id: "miss-me", title: "When You Miss Me", blurb: "A little reminder of the care and good wishes I’m sending you.",
      voice: "assets/voice/miss-me.mp3",
      lines: ["I’m thinking of you, even when we’re not together.", "Missing someone means there is something good between you. Let it be a warm feeling and not a heavy one.", "I’m wishing you a calm day, a good meal, and a gentle night. Take care of yourself for both of us."],
      note: "These words are written for you. Replace them with your own whenever you like."
    },
    {
      id: "laugh", title: "When You Need a Laugh", blurb: "A tiny break for something lighthearted.",
      voice: "assets/voice/laugh.mp3",
      lines: ["A small break is allowed. Here are a few silly ones."],
      jokes: [
        ["Why did the scarecrow win an award?", "Because he was outstanding in his field."],
        ["What do you call a sleeping bull?", "A bulldozer."],
        ["Why don’t eggs tell jokes?", "They’d crack each other up."],
        ["What did the ocean say to the beach?", "Nothing, it just waved."],
        ["Why did the bicycle fall over?", "It was two tired."],
        ["What do you call cheese that isn’t yours?", "Nacho cheese."],
        ["Why did the cookie go to the doctor?", "It felt crummy."],
        ["What’s a cat’s favourite colour?", "Purr-ple."],
        ["Why can’t you trust stairs?", "They’re always up to something."],
        ["What do you call a fake noodle?", "An impasta."]
      ]
    },
    {
      id: "sleep", title: "When You Need to Sleep", blurb: "Let the day end. You can return to everything else tomorrow.",
      voice: "assets/voice/sleep.mp3",
      lines: ["The day has done enough. You’ve done enough.", "Let your jaw soften. Let your hands be heavy.", "Whatever is unfinished will still be there in the morning, and you’ll meet it with more rest."],
      prompt: "What can wait until tomorrow? Write it down and watch it drift away like a lantern.",
      goodnight: "Goodnight. You did enough today."
    },
    {
      id: "not-enough", title: "When You Feel Not Good Enough", blurb: "You do not have to prove your worth to deserve kindness.",
      voice: "assets/voice/not-enough.mp3",
      lines: ["Feeling not good enough is a feeling, not a fact.", "You don’t have to earn rest, kindness or love by being perfect.", "Let’s notice a few true things, however small."],
      fields: ["Something I did that took effort", "Something kind I did, or felt, lately", "Something I’m learning"],
      mirror: "These are true about you right now. They don’t disappear on a hard day."
    },
    {
      id: "lost", title: "When You Feel Lost", blurb: "You can discover your direction gradually. You do not need your whole future figured out.",
      voice: "assets/voice/lost.mp3",
      lines: ["Feeling lost often happens right before something shifts. It doesn’t mean you’ve gone wrong.", "You don’t need a map of the whole road. Only a sense of the next few steps.", "Here are a few gentle questions. Take one, or all, or none."],
      questions: ["What feels even a little alive in me lately?", "Who do I feel most like myself around?", "What would I try if I knew I wouldn’t be judged?", "What is one small thing I could do this week to learn more about what I want?"],
      closing: "Direction usually arrives gradually, one small choice at a time."
    }
  ],
  activities: [
    { id: "breathe", title: "Breathe With the Lake", blurb: "A slow, gentle breathing guide." },
    { id: "sunset", title: "Watch the Sunset", blurb: "Let the sky change at its own pace." },
    { id: "nature", title: "Listen to Nature", blurb: "Soft rain, wind, forest or water." },
    { id: "note", title: "Read a Note", blurb: "A few kind words, one at a time." },
    { id: "write", title: "Write to Yourself", blurb: "A private page, saved only if you choose." },
    { id: "good", title: "Notice Three Good Things", blurb: "Ordinary things count." }
  ],
  sunsetMessage: "You can let this moment be enough.",
  breatheReminder: "Breathe in gently for four, out slowly for six. Don’t force or deepen your breath, and stop any time if it’s uncomfortable. This is a calming exercise, not medical treatment.",
  /* Starter notes. Add your own sentences to hisNotes; they are shown as “A note from Shashanth”. */
  notes: [
    "You don’t have to be productive to be worthy of rest.",
    "A hard day does not erase the good in you.",
    "You are allowed to take up space, to need things, and to change your mind.",
    "Be as patient with yourself as you would be with someone you love.",
    "Rest is not giving up. It’s how you get ready to keep going.",
    "You’ve survived every difficult day so far. That counts for a lot."
  ],
  hisNotes: [],
  writePrompts: [
    "What am I feeling right now?",
    "What do I need most?",
    "What can wait until tomorrow?",
    "What would I say to someone I love if they felt this way?"
  ],
  goodThingsIntro: "Notice three small things that feel pleasant, meaningful or comforting. They can be completely ordinary: warm tea, a stretch, a song.",
  ending: {
    title: "Whatever today held, you made it to this moment.",
    text: "You don’t have to have everything figured out. You deserve patience, kindness, and the chance to begin again.",
    line: "You matter. Your feelings matter. Your life is still unfolding.",
    support: "If things feel too heavy to carry alone, consider reaching out to someone you trust: a close friend, family member, or professional. You deserve support beyond this screen, too.",
    helplines: "In India, Tele-MANAS offers free, 24×7 mental health support on 14416 or 1-800-891-4416. In an emergency, call 112."
  },
  natureSounds: [
    { id: "rain", label: "Rain", file: "assets/nature/rain.mp3" },
    { id: "wind", label: "Wind", file: "assets/nature/wind.mp3" },
    { id: "forest", label: "Forest", file: "assets/nature/forest.mp3" },
    { id: "water", label: "Water", file: "assets/nature/water.mp3" }
  ],
  a11y: {
    world: "A calm mountain valley at sunset with a lake, a stone path through a flower garden, cherry blossoms, and a small wooden cabin with glowing windows.",
    nook: "A cosy resting nook beside a lake with a blanket, cushions, books, a cup of tea, warm lanterns, and an open view of the mountains."
  }
};
