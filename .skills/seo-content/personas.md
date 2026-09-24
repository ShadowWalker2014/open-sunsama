# Open Sunsama: who buys, in their own words

Research date: 24 September 2026. Sources: 33 Reddit threads (about 700 comments read), 6 Hacker News threads plus HN comment searches, Product Hunt reviews of Sunsama, Akiflow and Morgen, Sunsama's own site, pricing page, MCP docs and public roadmap, one forum thread on Motion, three blog posts and three GitHub projects. Every quote below is verbatim (typos kept) and links to its source. G2, Capterra and Trustpilot block automated reading, so review-site evidence comes from Product Hunt only.

---

## The answer in one screen

**Five personas are supported by the evidence.** Ranked by how much evidence there is and how well Open Sunsama fits them:

1. **The Sunsama boomerang.** This person loves Sunsama's daily planning, cancels, then comes back. They are the largest group and the easiest to convert. They leave because of the cost, a weak mobile app, a daily ritual that turns into a chore, and a public roadmap that doesn't move (the API request has been open since December 2019).
2. **The agent operator.** This person already says "plan my day" to Claude or ChatGPT every morning. They hold it together with third-party MCP servers, Zapier and home-made login fixes. They want one planner their agent can read and write reliably, and that they could change themselves.
3. **The owner (self-hoster).** This person wants a Sunsama-class planner on their own server with an API, so their data stays theirs. They say nothing like it exists: "So far I have not seen anything that comes close."
4. **The overwhelmed planner (often ADHD).** This person keeps overloading their day and needs rollover, a backlog, time estimates and loud reminders. They abandon any system that needs babysitting.
5. **The juggler (freelancer, consultant or founder).** This person pulls tasks from clients' Trello, Asana and Monday, plus Outlook and Gmail, into one day. There is less evidence for this group and it overlaps with personas 1 and 2, so treat it as a sub-segment.

**Five findings change the positioning:**

- **Sunsama now has a hosted MCP server with OAuth, listed in ChatGPT's plugin directory and documented for Claude, Cursor and Claude Code.** It launched in beta in April 2026 and is included in the $17–22 a month Pro plan ([Sunsama MCP docs](https://help.sunsama.com/docs/mcp-model-context-protocol), [pricing](https://www.sunsama.com/pricing)). "Works with Claude and ChatGPT" no longer sets Open Sunsama apart on its own. The claims Sunsama cannot match are these: **open source, self-hostable, a documented public REST API, and an agent that can change the planner itself.** A roadmap commenter says Sunsama's API costs "$65/month" ([Sunsama API request, 887 votes](https://roadmap.sunsama.com/improvements/p/sunsama-api)). A Claude user found that Sunsama's MCP does not expose actual tracked time.
- **Price is the most common complaint by a wide margin.** The positioning rule says not to sell on price, and the evidence gives a better angle anyway. Behind "too expensive" people say three other things: "I'm paying for a list-with-a-calendar", "I can't get my data out", and "they don't build what I ask for". Answer those instead. Lead with **ownership, no lock-in and a roadmap you can change yourself.**
- **The daily planning ritual is both the most-loved feature and a named reason people cancel.** Offer it as a choice. Better still, let the user's agent run it.
- **Mobile is the second most common complaint about Sunsama and Akiflow.** A good mobile app is a real reason to switch, if Open Sunsama's is good.
- **The license will draw objections from self-hosters.** Open Sunsama uses a custom non-commercial license, not an OSI license ([repo README](https://github.com/ShadowWalker2014/open-sunsama)). r/selfhosted readers praise projects like Immich and mock paid tiers. Expect "is it really open source?" and have a plain answer ready.

---

## Persona 1 — The Sunsama boomerang

### Who they are
- **Role:** knowledge workers with meetings and many task sources, such as PMs, engineers, PhD students, consultants and ops leads. Many are on a trial or pay month to month. Many have cancelled at least once.
- **Tools today:** Sunsama or Akiflow, plus Todoist or Things for capture, Google Calendar or Outlook, and Notion, Linear, Asana, ClickUp, Trello or Monday.
- **Where they hang out:** r/productivity, r/ProductivityApps, r/Sunsama, r/todoist, Product Hunt, YouTube productivity channels, and Sunsama's Slack community.

### Jobs to be done
- "Turn a large backlog into a realistic daily commitment" ([r/Sunsama](https://www.reddit.com/r/Sunsama/comments/1wbevto/what_part_of_sunsamas_daily_planning_is_actually/)).
- See tasks and meetings in one place, drag tasks onto the calendar, and know what actually fits in the day.
- End the day on time and feel done. Sunsama's homepage promise is "Start Calm. Stay Focused. End Confident." and "End work on time, without guilt" ([sunsama.com](https://www.sunsama.com/)).

### Wants and needs
- An honest workload number, a timer, and planned-versus-actual time.
- Automatic rollover to the next day and a backlog that hides stale tasks.
- Two-way sync with the tools where tasks start.
- A mobile app that is as good as the desktop app.

### Pain points (verbatim)
- **The cost feels out of line with "a todo app"**, so they cancel and return:
  - "Ive canceled my subscription a few times now because I feel silly paying $20 a month for a todo app, but I come crawling back each time." — [u/trevolutionary123](https://www.reddit.com/r/productivity/comments/x6357l/sunsama_price_worth_it/in6ykzh/)
  - "I keep trying to move away from Sunsama for cost and keep coming back." — [u/Internal_Spite6426](https://www.reddit.com/r/ProductivityApps/comments/1g35bex/akiflow_vs_sunsama/m6mpdby/)
  - "6 months later, the answer is "nothing". its not worth 20." — [u/sam_najian](https://www.reddit.com/r/ProductivityApps/comments/1s70ida/what_does_sunsama_do_thats_woth_20_dollars_monthly/p9vl76v/)
- **The daily ritual turns into a chore:**
  - "for me the final straw with Sunsama was the daily ritual becoming a 20-minute chore." — [r/ProductivityApps](https://www.reddit.com/r/ProductivityApps/comments/1utkevs/people_who_pay_monthly_for_a_planner_app_motion/oxnyccj/)
  - "sunsama's beautiful but the daily ritual got old fast for me." — [u/Temporary_Yak1264](https://www.reddit.com/r/ProductivityApps/comments/1s70ida/what_does_sunsama_do_thats_woth_20_dollars_monthly/ow3tz0n/)
  - "Sunsama is great, but it feels a bit too patronizing - it forces daily routines and strict scheduling" — [u/Qllervo](https://www.reddit.com/r/ProductivityApps/comments/1b0qhwf/amie_notioncalcron_sunsama_ellie_planner_what_am/nphp52f/)
- **The mobile app is weak:**
  - "what I find truly insane is that the mobile app is trash." — [r/productivity](https://www.reddit.com/r/productivity/comments/x6357l/sunsama_price_worth_it/jx2an5k/)
  - "The iOS app is embarrassingly bad for such an expensive product." — [u/srgroj](https://www.reddit.com/r/Sunsama/comments/1dmlmsc/anyone_using_sunsama_for_personal_life/l9x1o7a/)
- **The roadmap doesn't move:**
  - "Sunsama API - 835 upvotes - stale for 7 years, no comment - Offline mode - 1.8k upvotes - stale for 7 years" — [u/No-Example75](https://www.reddit.com/r/Sunsama/comments/1qbpiha/the_whole_app_feels_so_much_behind_any_alternative/)
  - "Todo manager that does not work without internet is as good as a toilet that does not flush without an electricity." — [u/No-Example75](https://www.reddit.com/r/Sunsama/comments/1qbpiha/the_whole_app_feels_so_much_behind_any_alternative/nzmbydy/)
  - "The request threads herein are a way for us to gauge interest ... they are not necessarily things we plan to build." — Sunsama staff reply on the roadmap ([roadmap.sunsama.com](https://roadmap.sunsama.com/integrations/p/why-has-there-been-no-progress-on-integrations))
- **They are paying for AI that doesn't deliver:**
  - "They recently started testing some AI features and mentioned there might be a new pricing tier for it... what have I been spending $20 a month for if not for development of new features." — [u/GlassBug7042](https://www.reddit.com/r/ProductivityApps/comments/1s70ida/what_does_sunsama_do_thats_woth_20_dollars_monthly/odeac61/)
  - "I was disappointed with the AI tool. It's mainly dictation." — [u/AncientEmergency204](https://www.reddit.com/r/ProductivityApps/comments/1s70ida/what_does_sunsama_do_thats_woth_20_dollars_monthly/p6xjyhb/)
- **They can't get their data out, and the product is buggy:**
  - "for $20/month, it shouldn't be too much to ask to be able to retrieve them in some way." (about daily planning notes) — [u/CreativeDiscipline7](https://www.reddit.com/r/productivity/comments/x6357l/sunsama_price_worth_it/ixx38hi/)
  - "sometimes some of my calendars are just missing completely" — [u/solisse](https://www.reddit.com/r/productivity/comments/zwl11s/alternative_to_sunsama/keohn3k/)
- **Integrations still leave manual work:**
  - "I got tired of having to go manually push things from Slack to Sunsama, pull things from email" — [u/icedespresso4](https://www.reddit.com/r/ProductivityApps/comments/1g35bex/akiflow_vs_sunsama/m51qxcl/)
- **The overall feeling:**
  - "Sunsama is like a beautifully prepared meal that doesn't meet your nutritional requirements." — [u/dhb1313](https://www.reddit.com/r/Sunsama/comments/1dmlmsc/anyone_using_sunsama_for_personal_life/m3g3kne/)

### What makes them say "wow"
- A workload total that stops overplanning: "aggregating task estimates/meeting times into a "hey jackass you’re putting 13 hours worth of work on your todo list for the day" number" — [u/trevolutionary123](https://www.reddit.com/r/productivity/comments/x6357l/sunsama_price_worth_it/in6ykzh/)
- Timing tasks and feedback on estimates: "keeps you honest about not overplanning ... That exact combination is magic." — [u/HearTaHelp](https://www.reddit.com/r/Sunsama/comments/1wbevto/what_part_of_sunsamas_daily_planning_is_actually/p9nwdzd/)
- "Bye to-do lists, and hello calendar blocking." — [Product Hunt review of Sunsama](https://www.producthunt.com/products/sunsama/reviews)
- The feeling of calm: "it doesn’t give me the same sense of calm as Sunsama" (about Akiflow) — [u/Different-Ad-5798](https://www.reddit.com/r/ProductivityApps/comments/1g35bex/akiflow_vs_sunsama/lzavehe/)

### Objections, and what answers each
| Objection | What answers it |
|---|---|
| "Nothing else has the same calm." | Show the same kanban-plus-calendar layout, a focus mode, rollover and planned-versus-actual time in a 30-second clip. The phrases they reuse are "calm", "realistic day" and "end on time". |
| "Clones always miss the integrations I need." | Google and Outlook calendar sync, plus the public API and MCP as the route to everything else. Say plainly which native integrations don't exist yet. |
| "Will it still exist in two years?" | Open source means the code outlives the company. They have watched Amie pivot, Woven get bought and shut down, and Cron become Notion Calendar ([thread](https://www.reddit.com/r/ProductivityApps/comments/1b0qhwf/amie_notioncalcron_sunsama_ellie_planner_what_am/)). |
| "I don't want a 20-minute ritual." | Make planning optional, or let Claude or ChatGPT draft the plan for approval. |
| "Is the mobile app real?" | Show the mobile app first, because this is where Sunsama loses them. |

### What they search for and ask AI
- **Search:** "alternative to Sunsama", "sunsama alternative reddit", "sunsama alternative free", "sunsama alternative ios", "Akiflow vs Sunsama", "Sunsama - price worth it?", "what does sunsama do thats woth 20 dollars monthly", "sunsama vs motion", "time blocking app like sunsama", "sunsama alternatives + opinions on ellie".
- **Asking AI:** "What's a cheaper app like Sunsama?", "Sunsama vs Akiflow vs Morgen for time blocking?", "Is there an app like Sunsama with a good mobile app?"

### Vocabulary they use
"daily planning ritual", "shutdown ritual", "timebox / time block", "drag and drop into the calendar", "kanban", "backlog", "rollover", "planned vs actual", "weekly objectives", "channels and contexts", "focus mode", "calm", "realistic", "overwhelm", "keeps me honest", "single source of truth", "I keep coming back", "just so pricey", "a todo app", "mobile app is trash".

### What they already know
Sunsama's five-step daily planning ("Process, Plan, Prioritize, Prepare, Publish"), daily shutdown, weekly review, timeboxing, auto-scheduling, Todoist and Things for capture, Akiflow, Motion, Morgen, Ellie, Amie and TickTick.

### Switching triggers
- The trial ends and they see the price.
- A renewal date comes up.
- The ritual starts to feel like a chore.
- They hit a mobile bug on the go.
- A roadmap request gets closed or ignored.
- Their employer blocks the app: "J’ai dû arrêter car mon entreprise a bloqué l’accès à cette application" ("I had to stop because my company blocked access to the app") — [u/Spac3d3m](https://www.reddit.com/r/ProductivityApps/comments/1s70ida/what_does_sunsama_do_thats_woth_20_dollars_monthly/od6rj4r/).

---

## Persona 2 — The agent operator

### Who they are
- **Role:** developers, technical founders, CTOs and heavy Claude, ChatGPT or Codex users. Some are non-coders who copy their setups.
- **Tools today:** Claude Projects or Cowork, Claude Code, ChatGPT, OpenClaw or Hermes agents, the Todoist or Things MCP, the Google Calendar connector, Obsidian, Linear, n8n and Zapier, and custom OAuth relays.
- **Where they hang out:** r/ClaudeAI, r/ChatGPT, r/todoist, r/thingsapp, r/ticktick, Hacker News, GitHub, and X.

### Jobs to be done
- "Every morning I say "plan my day" and it reads my tasks and calendar, proposes a time-blocked schedule, and I approve or adjust." — [u/WarLocal5063](https://www.reddit.com/r/todoist/comments/1s2tcei/i_turned_claude_todoist_into_a_daily_planning/)
- Recover a bad day in one sentence: "I can just say “yesterday went totally off track. Let’s get back on track.” Claude will make note of all the tasks that are now overdue, then propose a plan" — [u/WarLocal5063](https://www.reddit.com/r/todoist/comments/1s2tcei/i_turned_claude_todoist_into_a_daily_planning/oevauo0/)
- Turn messy input into structured tasks. Capture is where AI earns its keep: "the capture-and-organize part of the flow was very high-leverage; I didn’t think the plan-my-day part was worth maintaining." — [u/JustinSensei412](https://www.reddit.com/r/ProductivityApps/comments/1utkn9o/would_you_use_ai_to_plan_your_day/owx9dr4/)
- Stay in control: "nothing touches your calendar until you approve the proposal." — [daily-planner-skill README](https://github.com/businessbarista/daily-planner-skill)

### Wants and needs
- A planner with a **stable, documented API and a hosted MCP server** that doesn't log them out.
- Tasks, subtasks, time blocks and the calendar in one place, so the agent doesn't have to combine three connectors.
- Tasks that carry a duration and deadline, so plans stay realistic: "The deadline + duration rule is the real unlock, otherwise AI planning just turns into wishful thinking lol." — [u/hear_a_pin_drops](https://www.reddit.com/r/todoist/comments/1s2tcei/i_turned_claude_todoist_into_a_daily_planning/oeuzbbe/)
- Source code they, or their agent, can change.

### Pain points (verbatim)
- **Closed apps block the workflow they want to build:**
  - "Layer 1: Sunsama has no official API. In 2026." / "I can only submit a feature request and check back in 2032." — [George London, "AI Agents Could Make Free Software Matter Again"](https://www.gjlondon.com/blog/ai-agents-could-make-free-software-matter-again/)
  - "The unofficial API authenticates using your actual Sunsama email and password." — [same post](https://www.gjlondon.com/blog/ai-agents-could-make-free-software-matter-again/). The community MCP needed `SUNSAMA_EMAIL` and `SUNSAMA_PASSWORD` and has since been archived ([mcp-sunsama](https://github.com/robertn702/mcp-sunsama)).
  - "Still no API y'all? I'll try the MCP but wish there was a documented API." — Ben, on the [Sunsama API request (887 votes, open since 16 Dec 2019)](https://roadmap.sunsama.com/improvements/p/sunsama-api)
  - "I'm using molt.bot as a personal assistant and Sunsama access via API would 5x how useful it is" — Ruairi McNicholas, [same thread](https://roadmap.sunsama.com/improvements/p/sunsama-api)
  - "I wish things was a little more agent friendly" — [u/vladimirxi](https://www.reddit.com/r/thingsapp/comments/1rukvlk/i_built_an_mcp_server_that_gives_claude_full/obsmrzz/)
- **Connectors break or lose the login:**
  - "I had to log back into Todoist daily, and sometimes even every few minutes." — [u/WarLocal5063](https://www.reddit.com/r/todoist/comments/1s2tcei/i_turned_claude_todoist_into_a_daily_planning/ocbkeel/)
  - "I kept getting logged out of their MCP server which was a pain." — [u/mttsmth](https://www.reddit.com/r/thingsapp/comments/1rukvlk/i_built_an_mcp_server_that_gives_claude_full/oapr1hw/)
  - "Set up automations for my daily and weekly agendas and it's not pulling my calendars." — [u/spinplasticcircles](https://www.reddit.com/r/ChatGPT/comments/1nz4srn/why_doesnt_chatgpts_google_calendar_integration/ni2e7ww/)
  - "having read-only access makes it basically useless." — [u/Odd_Mortgage_9108](https://www.reddit.com/r/ChatGPT/comments/1nz4srn/why_doesnt_chatgpts_google_calendar_integration/o6x3d3j/)
  - "the morning debriefer worked maybe once or twice a week and broke every other morning" — [bigpapikite, HN](https://news.ycombinator.com/item?id=47785456)
- **Chat alone has no lasting task list:**
  - "I’d like it to keep track of my to do list, but found it unreliable at that" — [u/yeoh909090](https://www.reddit.com/r/ChatGPT/comments/1h5y9nq/how_i_turned_chatgpt_into_my_personal/m0begzd/)
  - "It shouldn't be this hard." — [u/As13va](https://www.reddit.com/r/ChatGPT/comments/1ibac6w/best_way_to_integrate_gpt_with_google_calendar/mjlf7ka/)
- **Auto-scheduling feels like a black box:**
  - "I tried reclaim.ai, which basically does this exact thing, but I found the automation too opaque." — [u/WarLocal5063](https://www.reddit.com/r/todoist/comments/1s2tcei/i_turned_claude_todoist_into_a_daily_planning/ocj42tx/)
- **Existing planner MCPs are incomplete:** A Claude user wired up Sunsama's MCP. Claude reported: "Sunsama doesn't appear to expose separately tracked/actual time via this integration" ([Jeremiah Scanlon, Sunsama roadmap](https://roadmap.sunsama.com/improvements/p/sunsama-api)).
- **Heavy planners are too heavy even with AI:** "I replaced Sunsama with AI. ... I realized it is way too heavy and time-consuming, even with MCP." — [u/Qllervo](https://www.reddit.com/r/Sunsama/comments/1wbevto/what_part_of_sunsamas_daily_planning_is_actually/p96102m/)

### What makes them say "wow"
- **Connect once, then it keeps working:** one OAuth MCP URL that works in Claude, ChatGPT, Cursor and Claude Code, on desktop and phone, with no re-login.
- **"Get back on track"**: overdue tasks are re-planned into free calendar gaps in one prompt, and nothing is booked until they approve.
- **The agent can change the product.** Their agent can read the open-source code and add the feature they want in minutes, instead of waiting on a feature request: "“Can my agent fully customize this?” is going to become a real question that normal people ask" — [George London](https://www.gjlondon.com/blog/ai-agents-could-make-free-software-matter-again/)
- Scoped API keys, a REST API and webhooks for n8n and Home Assistant.

### Objections, and what answers each
| Objection | What answers it |
|---|---|
| "I can already do this with Todoist MCP plus Google Calendar." ("Dont invent problems that dont exist" — [u/Johny-115](https://www.reddit.com/r/ProductivityApps/comments/1utkn9o/would_you_use_ai_to_plan_your_day/owwgwfn/)) | One store holds tasks and time blocks, so the agent needs one connector instead of two that each lose the login. Show a split-screen demo of setup time. |
| "Sunsama has an MCP now." | Show what Sunsama's doesn't have: an open-source codebase, self-hosting, a documented REST API with scoped keys, actual-time data, and no premium tier for API access. |
| "AI planning is just bin-packing." ("Then the "AI" just plots my 2 hour task in a 2 hour empty slot." — [u/Early_Quality7824](https://www.reddit.com/r/ProductivityApps/comments/1utkn9o/would_you_use_ai_to_plan_your_day/owysfzb/)) | Lead with capture, re-planning after a bad day, and weekly review. Don't lead with auto-scheduling. |
| "Will the agent delete my stuff?" ("How does it do with deleting stuff? I really don’t want that to Happen" — [u/Separate_Ad4150](https://www.reddit.com/r/thingsapp/comments/1rukvlk/i_built_an_mcp_server_that_gives_claude_full/ob4j2s9/)) | Read-only scopes, approval before writing, and an undo or activity log. |

### What they search for and ask AI
- **Search:** "todoist mcp claude", "claude plan my day calendar", "best way to integrate GPT with Google Calendar", "why doesn't ChatGPT's Google Calendar integration work", "task manager with MCP server", "sunsama API", "sunsama MCP", "open source task manager API time blocking", "MCP server calendar tasks".
- **Asking AI:** "plan my day", "Show me my day", "What's on my schedule today?", "Schedule my top 3 tasks for tomorrow with 2-hour focus blocks", "yesterday went totally off track. Let's get back on track", "make this a task plan for me", "How much time did I log last month for CLIENTNAME?", "What's overdue, what's been untouched for 2+ weeks, and what am I waiting on?" (the last one paraphrases [u/davidhorison](https://www.reddit.com/r/productivity/comments/1u6nxev/automated_my_weekly_reviewplanning_sessions_with/ouuy8u9/)).

### Vocabulary they use
"MCP", "connector", "custom connector", "OAuth", "API key", "Claude Project", "Cowork", "skills.md", "scheduled task / cron", "plan my day", "morning review", "daily/weekly review", "time-blocked schedule", "approve or adjust", "audit", "task decomposition", "brain dump", "agent friendly", "reverse-engineered API", "always allow", "read/write access", "source of truth".

### What they already know
MCP and remote MCP with OAuth, Claude connectors, ChatGPT apps and plugins, the Todoist and Things MCPs, n8n and Zapier MCP, OpenClaw and Hermes, local models, GTD, and weekly review.

### Switching triggers
- Their MCP login breaks again.
- Claude or ChatGPT adds scheduled tasks, so their morning plan can run on its own.
- A usage-limit scare pushes them toward local models, and a closed SaaS can't follow them there.
- They read about the Sunsama API wait or its $65 a month API tier.
- They see a Show HN or Reddit post of an open planner with an MCP server.

---

## Persona 3 — The owner (self-hoster, privacy, open source)

### Who they are
- **Role:** homelab owners, developers, sysadmins, GDPR-bound EU workers and privacy-minded professionals.
- **Tools today:** Nextcloud, CalDAV and Radicale, Vikunja, Super Productivity, Obsidian with the Tasks plugin, Tasks.org, Plane, Home Assistant, n8n, Proxmox and Docker. Many still pay for Motion or Sunsama while they hunt for a replacement.
- **Where they hang out:** r/selfhosted, r/homelab, Hacker News, GitHub, awesome-selfhosted, F-Droid and the Fediverse.

### Jobs to be done
- "But more than anything I want to keep my data to myself so.. Any productivity tool that comes close to them but usable for my personal stack?" — [u/Unusual_Limit_6572, "Selfhosted Alternative to Ellieplanner or Sunsama?"](https://www.reddit.com/r/selfhosted/comments/1bsznau/selfhosted_alternative_to_ellieplanner_or_sunsama/)
- Get Motion or Reclaim-style planning without Google: "I use Nextcloud because I don't want Google to know everything ;-)." — [u/first_kreativmonkey](https://www.reddit.com/r/selfhosted/comments/u14tdl/selfhosted_alternative_to_reclaimai/i4eco2z/)
- Wire the planner into home automation: "I would love to be able to be able to interact with a proper todo list from home assistant." — [u/modestohagney](https://www.reddit.com/r/selfhosted/comments/1msr0en/tasktrove_a_selfhostable_modern_todo_manager/n98ndjh/)

### Wants and needs
- Docker Compose with a one-line install, an API, OIDC login, CalDAV, notifications that actually fire, mobile apps that point to their own server, data export, and multi-user support for family.

### Pain points (verbatim)
- **Nothing self-hosted matches Sunsama or Motion:**
  - "So far I have not seen anything that comes close, no, unless you count "advanced notepads" or bad kanban boards as being close." — [r/selfhosted](https://www.reddit.com/r/selfhosted/comments/1bsznau/selfhosted_alternative_to_ellieplanner_or_sunsama/kxizfpb/)
  - "No other system seems to offer the features that are standard in Motion. I will keep looking." — [u/Thunderklont](https://www.reddit.com/r/selfhosted/comments/1kholk3/self_hosted_alternative_to_motion/nbdlt8y/)
  - "It looks very nice, but seems no longer maintained?" (about FluidCalendar) — [u/inrego](https://www.reddit.com/r/selfhosted/comments/1kholk3/self_hosted_alternative_to_motion/n9ba0zi/)
- **They want control:** "if i love it, i want to have full control of it ;-)" — [u/first_kreativmonkey](https://www.reddit.com/r/selfhosted/comments/u14tdl/selfhosted_alternative_to_reclaimai/i4ed9u5/)
- **Compliance:** "We're not allowed to reclaim.ai at work because of the GDPR." — [u/AcceptableInspector2](https://www.reddit.com/r/selfhosted/comments/u14tdl/selfhosted_alternative_to_reclaimai/iwc3vjq/)
- **Invasive permissions:**
  - "The permissions were a non-starter for me." — [smt88, HN (Akiflow launch)](https://news.ycombinator.com/item?id=33459436)
  - "Downloaded the app and got to the Oauth Google Cal part of onboarding and bailed." — [kareemm, HN](https://news.ycombinator.com/item?id=33541083)
  - "I used 2 accounts, as I don't like giving apps full permission to my calendar." — [jbverschoor, HN (Sunsama launch)](https://news.ycombinator.com/item?id=24991202)
- **Lock-in and data loss:** "the app doesn't support any kind of export for tasks. I lost access to my account last week and it was really stressful not having my tasks!" — [Product Hunt review of Akiflow](https://www.producthunt.com/products/akiflow/reviews)
- **Recurring fees and paywalled basics:**
  - "I absolutely would pay for a multi user to do list that I can self host. But I avoid subscription fees like the plague." — [u/TheFeshy](https://www.reddit.com/r/selfhosted/comments/1msr0en/tasktrove_a_selfhostable_modern_todo_manager/n96uu3h/)
  - "Noooooo why are the apps limited to hosted, paid version only?" — [u/GhostGhazi](https://www.reddit.com/r/selfhosted/comments/1msr0en/tasktrove_a_selfhostable_modern_todo_manager/n99bv1p/)
- **Reminders fail on self-hosted apps:** "One of the big issues with self hosted todo apps have been reminders." — [u/sarhoshamiral](https://www.reddit.com/r/selfhosted/comments/1msr0en/tasktrove_a_selfhostable_modern_todo_manager/n98s55z/)
- **Missing platforms:** "Just signed up and it seems it is not possible to use this on Linux. Disappointing..." / "this is a basic prerequisite for any productivity app imo" — hyperupcall, HN ([1](https://news.ycombinator.com/item?id=33455017), [2](https://news.ycombinator.com/item?id=33458568))
- **Cloud apps that call themselves local-first:** "Local first. Remotely owned." — [u/soundneedle](https://www.reddit.com/r/ProductivityApps/comments/1vngda3/looking_for_that_one_perfect_app/p3j0iqm/)

### What makes them say "wow"
- `docker compose up` and a Sunsama-class planner runs on their box. "Dude it looks cool as hell ... set up was a god damn breeze." — [u/Welshlogic](https://www.reddit.com/r/selfhosted/comments/1msr0en/tasktrove_a_selfhostable_modern_todo_manager/n9laaqy/)
- A **Linux desktop app** from the same codebase, plus mobile apps.
- A real API that works with n8n and Home Assistant on day one. In the TaskTrove thread people asked "Does it have any API?" ([n975hm0](https://www.reddit.com/r/selfhosted/comments/1msr0en/tasktrove_a_selfhostable_modern_todo_manager/n975hm0/)) and tried n8n before the API was finished ([n9kdwvh](https://www.reddit.com/r/selfhosted/comments/1msr0en/tasktrove_a_selfhostable_modern_todo_manager/n9kdwvh/)).
- An MCP server they can point at a local LLM.

### Objections, and what answers each
| Objection | What answers it |
|---|---|
| "Custom non-commercial license, so it isn't open source." | State the license on page one: free to self-host for personal use, with commercial use licensed. Don't hide it, because this crowd checks. |
| "Probably abandoned in six months." | Show the commit history, release cadence and changelog. They ask "seems no longer maintained?" about every project. |
| "Paywalled basics." ("It would be super nice if you didn't make (generic) OIDC support a pro feature." — [u/olreti](https://www.reddit.com/r/selfhosted/comments/1msr0en/tasktrove_a_selfhostable_modern_todo_manager/n97utla/)) | Keep auth, API and plugins in the self-hosted build. |
| "Does it work with my CalDAV and Nextcloud?" | Say plainly what syncs today (Google and Outlook) and what doesn't. |
| "Notifications won't work." | Web push, and desktop and mobile notifications. |

### What they search for and ask AI
- **Search:** "selfhosted alternative to Ellieplanner or Sunsama", "self hosted alternative to Motion", "selfhosted alternative to reclaim.ai", "open source alternative to sunsama akiflow motion github", "open source time blocking app", "self-hosted daily planner docker", "vikunja vs super productivity".
- **Asking AI:** "Is there an open-source Sunsama I can run in Docker?", "Self-hosted task manager with an API and CalDAV?"

### Vocabulary they use
"self-hostable", "FOSS", "docker compose", "homelab", "my own server", "keep my data to myself", "full control", "OIDC", "CalDAV/WebDAV", "Nextcloud", "API", "n8n", "Home Assistant", "one-time license", "subscription plague", "no longer maintained", "local-first", "GDPR".

### What they already know
Vikunja, Super Productivity, Plane, Nextcloud Deck and Tasks, Tasks.org, Obsidian Tasks, TaskWarrior, Immich (their reference for good FOSS), FluidCalendar, Atomic and Kaboome.

### Switching triggers
- A Motion or Sunsama renewal comes up.
- A GDPR or IT review rejects the SaaS app.
- An incumbent is acquired or pivots (Reclaim went to Dropbox, Amie pivoted).
- A post on r/selfhosted or Show HN, or a listing on awesome-selfhosted.

---

## Persona 4 — The overwhelmed planner (often ADHD)

### Who they are
- **Role:** students, parents, carers, creatives and knowledge workers, often with ADHD and time blindness. Many are price-sensitive and many are on mobile.
- **Tools today:** Sunsama or Motion on trials, Structured, Tiimo, TickTick, Apple Reminders, Google Calendar, paper planners, Goblin Tools, and ChatGPT for brain dumps.
- **Where they hang out:** r/ADHD, r/productivity, r/ProductivityApps, r/Sunsama, TikTok and YouTube.

### Jobs to be done
- Stop overloading the day: "I will just keep adding tasks to my to-do-list and then never have the time do do them and get overwhelmed." — [u/TomFord07](https://www.reddit.com/r/productivity/comments/13j2wxr/sunsama_and_other_timeblocking_apps/)
- Get unfinished work out of sight without losing it: "Having tasks roll over to the next day, and eventually get backlogged if I don't get to them is incredibly helpful for me." — [u/cookiemonstah87](https://www.reddit.com/r/productivity/comments/x6357l/sunsama_price_worth_it/iwxli4g/)
- Be pulled out of hyperfocus: "I need to be shaken out of my stupor and reminded of what time it is, that time is passing, and what I should be doing." — [u/CozySweatsuit57](https://www.reddit.com/r/ADHD/comments/1ldlnt3/best_time_blocking_app_youve_found_so_far/myaqdra/)

### Wants and needs
- Time estimates they can compare against reality, and a daily cap on how much they plan.
- A gentle recovery when they fall behind.
- Loud, configurable notifications and a good phone app.
- Few settings to fiddle with.
- A brain-dump box that turns chaos into tasks.

### Pain points (verbatim)
- **They overload and burn out:**
  - "would always eventually overwhelm myself with to-dos and burn out." — [u/crystalvulpix](https://www.reddit.com/r/productivity/comments/1jd4tc2/sunsama_alternatives_opinions_on_ellie/)
  - "I'm terrible at estimating deadlines and how much time things take. I always underestimate." — [u/Power_Upper](https://www.reddit.com/r/todoist/comments/1p1o9by/todoist_sunsama_is_my_perfect_situation/)
  - "I feel like Sunsama is pretty clearly targeting folks with time blindness. It's my number one struggle in life." — [u/mahalie23](https://www.reddit.com/r/Sunsama/comments/1dmlmsc/anyone_using_sunsama_for_personal_life/ltr8g8i/)
- **Too many tools and tabs:** "I ended up switching between too many tabs and used to get lost very easily (I have ADHD btw)." — [u/Individual_Eagle_610](https://www.reddit.com/r/ClaudeAI/comments/1nslpo6/notion_todoist_google_calendar_inside_claude_this/)
- **Apps that punish falling behind:** "the thing to watch isnt features, its what the app does when you fall behind. most of these reschedule everything forward automatically, which sounds great until you have a rough week and open it to a wall of stuff its decided youre doing today." — [u/gauravyeole](https://www.reddit.com/r/ProductivityApps/comments/1vez2yb/what_are_the_best_motion_alternatives/p1l1t33/)
- **Auto-replanning takes away control:** "Sunsama has a “replanning” feature that’s kind of usable for this, but it makes decisions for you" — [u/CozySweatsuit57](https://www.reddit.com/r/ADHD/comments/1ldlnt3/best_time_blocking_app_youve_found_so_far/myaqdra/)
- **Systems that need babysitting get abandoned:**
  - "spent hours setting up elaborate systems I abandoned in two weeks" — [u/kid_90](https://www.reddit.com/r/ProductivityApps/comments/1utkevs/people_who_pay_monthly_for_a_planner_app_motion/)
  - "the ones actually worth paying for are the ones that keep working during a bad week when you've stopped babysitting them." — [u/RomeoDelta1234](https://www.reddit.com/r/ProductivityApps/comments/1utkevs/people_who_pay_monthly_for_a_planner_app_motion/ox1jpua/)
  - "Everything I’ve tried to use over 20+ years eventually becomes a list with boxes on the left side as a checklist" — [r/ADHD](https://www.reddit.com/r/ADHD/comments/1b9bz7m/are_there_any_productivity_apps_specifically/ktvna5n/)
- **Out of sight means out of mind:** "filters are great, but they are also an issue because they hide some tasks that you may be falling behind on" — [u/sourskittlenut](https://www.reddit.com/r/ADHD/comments/1b9bz7m/are_there_any_productivity_apps_specifically/ktw33s6/)
- **Mobile:** "I struggled with their iPhone/iPad apps and didn't feel like I had control of my plan unless I was on the computer." — [u/Whatwouldbuffydo77](https://www.reddit.com/r/Sunsama/comments/1dmlmsc/anyone_using_sunsama_for_personal_life/loc6qsl/). Also: "Currently on desktop I use Sunsama, but the mobile version is not helpful at all." — [u/CozySweatsuit57](https://www.reddit.com/r/ADHD/comments/1ldlnt3/best_time_blocking_app_youve_found_so_far/)
- **Fear of losing everything to a subscription:** "you don’t want to invest your time and information into a platform that you can lose access to if you don’t keep paying" — [u/lelieldirac](https://www.reddit.com/r/ADHD/comments/1b9bz7m/are_there_any_productivity_apps_specifically/ktwudxa/)

### What makes them say "wow"
- "As someone with ADHD, second only to my meds, it has been the biggest game-changer for me" (about Sunsama) — [u/Cappy2020](https://www.reddit.com/r/productivity/comments/13j2wxr/sunsama_and_other_timeblocking_apps/jkctygb/)
- "It really feels like I've just put on mental "glasses" and can see where I am and what I should be doing with clarity." (about Motion) — [dlivingston, HN](https://news.ycombinator.com/item?id=44391813)
- Brain dump to a plan: "I usually brain dump and it turns my brain dump into a task calendar." — [u/TrueTeaToo](https://www.reddit.com/r/ADHD/comments/1l1qmqx/app_to_plan_for_me_like_motion/mw37q9u/)
- A rescue after a lost week: "I had over 40 overdue to do list items ... it was completely overwhelming ... Using Claude for the scenario really simplify things." — [u/WarLocal5063](https://www.reddit.com/r/todoist/comments/1s2tcei/i_turned_claude_todoist_into_a_daily_planning/oevauo0/)
- Focus mode: "The lower visual clutter just helps me stay more calm and less stressed." — [u/Cappy2020](https://www.reddit.com/r/productivity/comments/13j2wxr/sunsama_and_other_timeblocking_apps/jke4n05/)

### Objections, and what answers each
| Objection | What answers it |
|---|---|
| "I'll abandon it in two weeks like everything else." | Get to a first plan in under 2 minutes, with no setup and useful defaults. Rollover works with zero upkeep. |
| "It will guilt-trip me when I fall behind." | Make rollover and "move to backlog" feel gentle. Offer a "catch me up" prompt, and never dump a wall of overdue tasks. |
| "The phone app will be bad." | Show the mobile app and notifications first. |
| "Another subscription I'll forget to cancel." | Point out that no card is needed to start, and that they own and can export their data. Avoid framing this as price. |

### What they search for and ask AI
- **Search:** "best time blocking app adhd", "adhd planner app", "app to plan for me like Motion", "are there any productivity apps specifically built for people with adhd", "daily planner app with drag and drop", "time blindness app".
- **Asking AI:** "Here's my brain dump, make this a task plan for me", "I only have 4 hours today, what should I drop?", "I fell behind all week, help me reset", "Break this task into small steps".

### Vocabulary they use
"overwhelm / overwhelmed", "time blindness", "brain dump", "out of sight, out of mind", "hyperfocus", "burn out", "rollover", "backlog", "game-changer", "sticks", "babysitting", "falls apart", "wall of stuff", "calm", "less stressed", "ADHD brain", "executive function".

### What they already know
Pomodoro, body doubling (Focusmate), Goblin Tools, Structured, Tiimo, TickTick, Sunsama's rollover, Motion's auto-scheduling, and paper planners.

### Switching triggers
- A Sunsama or Motion trial ends.
- A new diagnosis or new job.
- A bad week that their current app turns into a wall of overdue tasks.
- A phone app that fails them away from the desk.

---

## Persona 5 — The juggler (freelancer, consultant or founder)

This persona has less evidence and overlaps with personas 1 and 2. It is kept because the job is specific and tends to come with a willingness to pay.

### Who they are
- **Role:** consultants, agency people, virtual assistants, founders running more than one venture, and managers with 5–8 teams.
- **Tools today:** clients' Trello, Monday, Asana and Google Tasks, their own Linear or ClickUp, Outlook and Google calendars across several accounts, Granola notes, Slack and Gmail.
- **Where they hang out:** r/ProductivityApps, r/productivity, r/todoist, Hacker News, LinkedIn and Indie Hackers.

### Jobs to be done and pains (verbatim)
- "My clients use Trello, Monday, asana and google tasks. I love that I can just have it all in one place." — [u/420tacoo](https://www.reddit.com/r/ProductivityApps/comments/1k8azqp/which_apps_do_you_use_for_planning_your_work_and/mw1v57i/)
- "The idea of pulling tasks from all project managers is extremely enticing to me as a consultant and contractor as I heavily use multiple task platforms." — [six0h, HN](https://news.ycombinator.com/item?id=24993471)
- "i'm trying to keep track of 5-8 departments and multiple meeting calendars and a bunch of communications in various threads - as an aggregator it is magic." — [u/heathwilder](https://www.reddit.com/r/productivity/comments/x6357l/sunsama_price_worth_it/j6m57tg/)
- "Startup days derail by 10am every time wasted more time rearranging than actually working." — [u/bloginfun](https://www.reddit.com/r/ProductivityApps/comments/1utkevs/people_who_pay_monthly_for_a_planner_app_motion/ox35ted/)
- "I wanted a "single pane of glass" for my work (outlook and work tasks/projects) and personal stuff (gmail and chores, to-do list, etc.)" — [u/littlelorax](https://www.reddit.com/r/productivity/comments/13j2wxr/sunsama_and_other_timeblocking_apps/jkf3mfl/)
- "As soon as I can find something like Sunsama that works with Apple Calendar and Reminders, Google Calendar/Gmail/Tasks (for at least 2 Google accounts), I’ll be set." — [u/christopher_the_nerd](https://www.reddit.com/r/productivity/comments/13j2wxr/sunsama_and_other_timeblocking_apps/jkeqbgq/)
- "Many (most?) of your target "elite professionals" are running Outlook in the enterprise." — [ticmasta, HN](https://news.ycombinator.com/item?id=24991315)
- "A "bundled" export API for reporting purposes would really help. How much time does our team work on what client etc + connect with invoicing/client data." — Raoul Van Heerden, [Sunsama roadmap](https://roadmap.sunsama.com/improvements/p/sunsama-api)
- "With a daily cron job it goes through my emails and meeting notes, finds tasks, plans execution, executes and then send me a message with a summary of what it has done." — [MrsPeaches, a CEO, HN](https://news.ycombinator.com/item?id=47797891)

### Wow, objections and triggers
- **Wow:** planned-versus-actual time per client that an agent can total ("How much time did I log ... for CLIENTNAME?"). Also, Google and Outlook calendars together in one day view.
- **Objection:** "Does it pull from Monday, Asana and Jira?" **Answer:** use the API and MCP route today, with an agent that files tasks from email and Slack. Be honest about which native integrations are missing.
- **Triggers:** a new client on a new tool, an employer blocking a tool ("my work now blocks Asana" — [u/Substantial-Bet-4775](https://www.reddit.com/r/ProductivityApps/comments/1g35bex/akiflow_vs_sunsama/mpu56j0/)), and invoicing time.
- **Search:** "sunsama for freelancers", "one app for all client task managers", "time blocking outlook and google calendar", "track time per client daily planner".

---

## Top 20 recurring pains, ranked by how often they came up

Counts are distinct commenters or reviewers across the sources read. They show relative weight and are not a survey.

| # | Pain | Mentions | Example |
|---|---|---|---|
| 1 | The subscription feels too high for "a to-do app", so people cancel, return or never start | ~35 | "I feel silly paying $20 a month for a todo app" ([link](https://www.reddit.com/r/productivity/comments/x6357l/sunsama_price_worth_it/in6ykzh/)) |
| 2 | Tasks, calendar, email and notes live in too many tools and have to be stitched together by hand | ~15 | "Kinda sad that we have to join tools together to get work done." ([link](https://www.reddit.com/r/todoist/comments/1p1o9by/todoist_sunsama_is_my_perfect_situation/npt2x44/)) |
| 3 | The mobile app is weak or treated as a companion | ~12 | "the mobile app is trash" ([link](https://www.reddit.com/r/productivity/comments/x6357l/sunsama_price_worth_it/jx2an5k/)) |
| 4 | A needed integration is missing (Outlook, Apple, a second Google account, Monday, ClickUp, Things) | ~12 | "this only works with Google calendar" ([HN](https://news.ycombinator.com/item?id=24991029)) |
| 5 | There is no public API, no agent access, and it can't be customized | ~10 | "Sunsama has no official API. In 2026." ([blog](https://www.gjlondon.com/blog/ai-agents-could-make-free-software-matter-again/)) |
| 6 | Overplanning, underestimating time and overwhelm | ~9 | "I always underestimate." ([link](https://www.reddit.com/r/todoist/comments/1p1o9by/todoist_sunsama_is_my_perfect_situation/)) |
| 7 | Auto-scheduling is opaque and takes away control (Motion, Reclaim, replanning) | ~9 | "you basically have to reverse engineer how your own week got created" ([forum](https://iphonecleaner.net/t/can-anyone-share-an-honest-motion-app-review-or-experience/2002)) |
| 8 | Setup is heavy and the system is abandoned within weeks | ~8 | "abandoned in two weeks" ([link](https://www.reddit.com/r/ProductivityApps/comments/1utkevs/people_who_pay_monthly_for_a_planner_app_motion/)) |
| 9 | Bugs, sync gaps and tasks that vanish | ~8 | "I had too many tasks move across as duplicates, then one or two that vanished." ([link](https://www.reddit.com/r/productivity/comments/x6357l/sunsama_price_worth_it/inbd93v/)) |
| 10 | Invasive permissions and privacy worries (calendar, contacts, email scopes) | ~8 | "The permissions were a non-starter for me." ([HN](https://news.ycombinator.com/item?id=33459436)) |
| 11 | The daily ritual turns into a chore or feels patronizing | ~7 | "the daily ritual becoming a 20-minute chore" ([link](https://www.reddit.com/r/ProductivityApps/comments/1utkevs/people_who_pay_monthly_for_a_planner_app_motion/oxnyccj/)) |
| 12 | Fear the app will die, pivot or be acquired (Amie, Woven, Cron, Motion's founders, Reclaim to Dropbox) | ~7 | "I'll admit to feeling like this will be the beginning of the end for me." ([HN](https://news.ycombinator.com/item?id=41302726)) |
| 13 | Employer IT or compliance blocks the app (O365 lockdown, GDPR) | ~7 | "our O365 tenant will be fully locked down." ([HN](https://news.ycombinator.com/item?id=33453682)) |
| 14 | The roadmap is stale and feature requests are ignored | ~6 | "stale for 7 years, no comment" ([link](https://www.reddit.com/r/Sunsama/comments/1qbpiha/the_whole_app_feels_so_much_behind_any_alternative/)) |
| 15 | AI connectors fail or lose the login (Todoist MCP, ChatGPT Google Calendar, OpenClaw) | ~6 | "connected but nothing works." ([link](https://www.reddit.com/r/ChatGPT/comments/1nz4srn/why_doesnt_chatgpts_google_calendar_integration/nxbk4nt/)) |
| 16 | Reminders and notifications are missing or too weak | ~6 | "the lack of reminders" ([link](https://www.reddit.com/r/productivity/comments/x6357l/sunsama_price_worth_it/ld8bz17/)) |
| 17 | A platform is missing (Android, Linux, web) | ~6 | "no android app." ([link](https://www.reddit.com/r/productivity/comments/zwl11s/alternative_to_sunsama/k2x1j4l/)) |
| 18 | Lock-in: no export, and data is lost if you stop paying | ~5 | "I lost access to my account ... not having my tasks!" ([PH](https://www.producthunt.com/products/akiflow/reviews)) |
| 19 | Task depth is thin (no priorities, no due dates, no nested projects) | ~5 | "you can't even set task priorities" ([link](https://www.reddit.com/r/productivity/comments/zwl11s/alternative_to_sunsama/kzv98zk/)) |
| 20 | There is no offline mode | ~4 | "Offline mode - 1.8k upvotes" ([link](https://www.reddit.com/r/Sunsama/comments/1qbpiha/the_whole_app_feels_so_much_behind_any_alternative/)) |

Positive signals repeated just as often, and worth reusing in copy:
- "calm"
- "realistic day"
- "keeps me honest"
- "rollover and backlog"
- "planned vs actual"
- "focus mode"
- "I keep coming back"

---

## Top recurring phrases (reuse them word for word)

**Pain phrases:**
- "too expensive for a to-do app"
- "I keep coming back"
- "too many tools / too many tabs"
- "single pane of glass"
- "all in one place"
- "the mobile app is trash / embarrassingly bad"
- "overwhelm / overwhelmed"
- "time blindness"
- "falls apart when I get busy"
- "abandoned in two weeks"
- "babysitting"
- "the daily ritual got old / became a chore"
- "too opaque / black box"
- "makes decisions for you"
- "no API"
- "feature request since 2019"
- "keep my data to myself"
- "full control"
- "no longer maintained"
- "subscription plague"
- "It shouldn't be this hard."

**Job and outcome phrases:**
- "plan my day"
- "time block / timebox"
- "drag tasks onto my calendar"
- "realistic day"
- "end the day on time"
- "daily planning / shutdown ritual"
- "weekly review"
- "roll over"
- "backlog"
- "planned vs actual"
- "brain dump"
- "get back on track"
- "approve or adjust"
- "source of truth"
- "agent friendly"
- "works with Claude / ChatGPT / MCP"
- "self-hostable"
- "docker compose"

**Tools named most often (their frame of reference):**
- Sunsama
- Akiflow
- Motion
- Reclaim
- Morgen
- Todoist
- TickTick
- Things 3
- Notion
- Ellie Planner
- Amie
- Structured
- Google Calendar
- Outlook
- Linear
- Asana
- ClickUp
- Obsidian
- Super Productivity
- Vikunja
- Nextcloud

---

## What to do with this (implications for copy, not settled decisions)

1. **Headline for persona 1:** say Sunsama's promise in their words and add ownership. For example: "Plan a calm, realistic day. Tasks roll over, time blocks sit on your real calendar, and it's yours: open source, on every device, with an API."
2. **Headline for persona 2:** lead with "Connect once in Claude, ChatGPT or Cursor", then "get back on track in one sentence", then "your agent can change the code". Answer "Sunsama has MCP now" before the reader asks it.
3. **For persona 3:** post on r/selfhosted and Show HN with `docker compose`, the API, the license stated plainly, and the Linux app.
4. **For persona 4:** build around the fall-behind moment. Rollover and backlog must never produce a wall of overdue tasks, and the mobile app and notifications should come first.
5. **Never lead with price.** Turn "too expensive" into what it means: you own it, you can export it, you can extend it, and it keeps running if the company changes course.

---

## Source list

**Reddit** (all comments read in full through Reddit's RSS feeds):
- r/productivity: [Sunsama - price worth it?](https://www.reddit.com/r/productivity/comments/x6357l/sunsama_price_worth_it/), [Alternative to Sunsama?](https://www.reddit.com/r/productivity/comments/zwl11s/alternative_to_sunsama/), [Sunsama and Other Time-Blocking Apps?](https://www.reddit.com/r/productivity/comments/13j2wxr/sunsama_and_other_timeblocking_apps/), [Sunsama alternatives + opinions on ellie?](https://www.reddit.com/r/productivity/comments/1jd4tc2/sunsama_alternatives_opinions_on_ellie/), [Automated my weekly review with Claude Cowork](https://www.reddit.com/r/productivity/comments/1u6nxev/automated_my_weekly_reviewplanning_sessions_with/)
- r/ProductivityApps: [What does sunsama do thats worth 20 dollars monthly?](https://www.reddit.com/r/ProductivityApps/comments/1s70ida/what_does_sunsama_do_thats_woth_20_dollars_monthly/), [People who pay monthly for a planner app](https://www.reddit.com/r/ProductivityApps/comments/1utkevs/people_who_pay_monthly_for_a_planner_app_motion/), [Akiflow vs Sunsama](https://www.reddit.com/r/ProductivityApps/comments/1g35bex/akiflow_vs_sunsama/), [Amie, NotionCal/Cron, Sunsama, Ellie](https://www.reddit.com/r/ProductivityApps/comments/1b0qhwf/amie_notioncalcron_sunsama_ellie_planner_what_am/), [Would you use AI to plan your day?](https://www.reddit.com/r/ProductivityApps/comments/1utkn9o/would_you_use_ai_to_plan_your_day/), [Looking for that one "perfect" app](https://www.reddit.com/r/ProductivityApps/comments/1vngda3/looking_for_that_one_perfect_app/), [What are the best Motion alternatives?](https://www.reddit.com/r/ProductivityApps/comments/1vez2yb/what_are_the_best_motion_alternatives/), [Which apps do you use for planning your work and life?](https://www.reddit.com/r/ProductivityApps/comments/1k8azqp/which_apps_do_you_use_for_planning_your_work_and/)
- r/Sunsama: [What part of Sunsama's daily planning is worth paying for?](https://www.reddit.com/r/Sunsama/comments/1wbevto/what_part_of_sunsamas_daily_planning_is_actually/), [The whole app feels so much behind](https://www.reddit.com/r/Sunsama/comments/1qbpiha/the_whole_app_feels_so_much_behind_any_alternative/), [Anyone using Sunsama for personal life?](https://www.reddit.com/r/Sunsama/comments/1dmlmsc/anyone_using_sunsama_for_personal_life/)
- r/todoist: [Todoist + Sunsama is my perfect situation](https://www.reddit.com/r/todoist/comments/1p1o9by/todoist_sunsama_is_my_perfect_situation/), [I turned Claude + Todoist into a daily planning assistant](https://www.reddit.com/r/todoist/comments/1s2tcei/i_turned_claude_todoist_into_a_daily_planning/)
- r/ClaudeAI: [Claude Project that plans my day](https://www.reddit.com/r/ClaudeAI/comments/1s2tdz5/i_built_a_claude_project_that_plans_my_day_tracks/), [Notion, Todoist & Google Calendar inside Claude](https://www.reddit.com/r/ClaudeAI/comments/1nslpo6/notion_todoist_google_calendar_inside_claude_this/)
- r/ChatGPT: [How I turned ChatGPT into my productivity coach](https://www.reddit.com/r/ChatGPT/comments/1h5y9nq/how_i_turned_chatgpt_into_my_personal/), [Why doesn't ChatGPT's Google Calendar integration work?](https://www.reddit.com/r/ChatGPT/comments/1nz4srn/why_doesnt_chatgpts_google_calendar_integration/), [Best way to integrate GPT with Google Calendar](https://www.reddit.com/r/ChatGPT/comments/1ibac6w/best_way_to_integrate_gpt_with_google_calendar/)
- r/thingsapp: [MCP server with read/write access to Things 3](https://www.reddit.com/r/thingsapp/comments/1rukvlk/i_built_an_mcp_server_that_gives_claude_full/)
- r/ticktick: [Claude Cowork x TickTick](https://www.reddit.com/r/ticktick/comments/1qh0rnk/claude_cowork_x_ticktick_working_with_notion/)
- r/ADHD: [Best time blocking app](https://www.reddit.com/r/ADHD/comments/1ldlnt3/best_time_blocking_app_youve_found_so_far/), [App to plan for me like Motion](https://www.reddit.com/r/ADHD/comments/1l1qmqx/app_to_plan_for_me_like_motion/), [Apps built for people with ADHD?](https://www.reddit.com/r/ADHD/comments/1b9bz7m/are_there_any_productivity_apps_specifically/), [500 days trying productivity apps](https://www.reddit.com/r/ADHD/comments/r2zi3r/i_spent_over_500_days_trying_productivity_apps_so/)
- r/selfhosted: [Selfhosted alternative to Ellieplanner or Sunsama?](https://www.reddit.com/r/selfhosted/comments/1bsznau/selfhosted_alternative_to_ellieplanner_or_sunsama/), [Self hosted alternative to Motion?](https://www.reddit.com/r/selfhosted/comments/1kholk3/self_hosted_alternative_to_motion/), [Fluid Calendar](https://www.reddit.com/r/selfhosted/comments/1iqxmzg/fluid_calendar_an_opensource_alternative_to/), [Selfhosted alternative to reclaim.ai](https://www.reddit.com/r/selfhosted/comments/u14tdl/selfhosted_alternative_to_reclaimai/), [TaskTrove](https://www.reddit.com/r/selfhosted/comments/1msr0en/tasktrove_a_selfhostable_modern_todo_manager/)

**Hacker News:**
- [Launch HN: Sunsama](https://news.ycombinator.com/item?id=24990238)
- [Launch HN: Akiflow](https://news.ycombinator.com/item?id=33451584)
- [Show HN: local-first daily planner](https://news.ycombinator.com/item?id=45810856)
- [Coding agents could make free software matter again](https://news.ycombinator.com/item?id=47568028), including jaynate: "The SaaS platforms that will survive are busy RIGHT NOW revamping their APIs, implementing oauth" ([link](https://news.ycombinator.com/item?id=47569055))
- [Dropbox acquires Reclaim.ai](https://news.ycombinator.com/item?id=41302030)
- Individual comments linked inline above

**Review sites:**
- Product Hunt reviews of [Sunsama](https://www.producthunt.com/products/sunsama/reviews), [Akiflow](https://www.producthunt.com/products/akiflow/reviews) and [Morgen](https://www.producthunt.com/products/morgen/reviews)
- [Honest Motion review thread (iphonecleaner forum)](https://iphonecleaner.net/t/can-anyone-share-an-honest-motion-app-review-or-experience/2002)

**Sunsama's own messaging:**
- [Homepage](https://www.sunsama.com/)
- [Pricing and pricing manifesto](https://www.sunsama.com/pricing)
- [Daily planning and shutdown](https://www.sunsama.com/features/daily-planning-and-shutdown)
- [MCP docs](https://help.sunsama.com/docs/mcp-model-context-protocol)
- Roadmap: [Sunsama API](https://roadmap.sunsama.com/improvements/p/sunsama-api), [Open source Sunsama](https://roadmap.sunsama.com/integrations/p/open-source-sunsama), [No progress on integrations](https://roadmap.sunsama.com/integrations/p/why-has-there-been-no-progress-on-integrations)

**Blogs and GitHub:**
- [George London: AI Agents Could Make Free Software Matter Again](https://www.gjlondon.com/blog/ai-agents-could-make-free-software-matter-again/)
- [CTNET: Why I have stopped using Sunsama](https://www.ctnet.co.uk/why-i-have-stopped-using-sunsama/)
- [mcp-sunsama (archived)](https://github.com/robertn702/mcp-sunsama)
- [daily-planner-skill](https://github.com/businessbarista/daily-planner-skill)
- [day-planner-mcp](https://github.com/ryaker/day-planner-mcp)
