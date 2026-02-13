# How Humans Should Learn in the Age of AI

## Scope, definitions, and evidence base

The post-2020 “age of AI” in education is best understood as two overlapping waves: (i) a longer-running wave of AI-enabled educational technology (adaptive systems, learning analytics, automated feedback), and (ii) the post‑2022 generative AI wave (large language models and multimodal models) that is widely accessible and often used outside institutional control. citeturn31view1turn11view1turn17view1

A central analytical distinction in the most influential recent synthesis work is between **AI-augmented task performance** (what a learner can produce with assistance) and **human skill development** (what the learner retains and can do independently later). The entity["organization","OECD","intergovernmental org"]’s Digital Education Outlook framing emphasizes that “successfully performing a task with GenAI does not automatically lead to learning,” and that unguided outsourcing can create “metacognitive laziness” and disengagement—especially when general-purpose chatbots are used as shortcuts rather than as pedagogically designed tutors. citeturn11view1turn23view0

This report prioritizes evidence from 2020–present peer-reviewed research and major preprints, complemented by official guidance from entity["organization","UNESCO","un specialized agency"] and other regulators, plus industry technical and education-facing whitepapers/briefs from entity["company","OpenAI","ai research company"], entity["company","Google","alphabet subsidiary"], and entity["company","Microsoft","software company"]. citeturn17view0turn17view3turn15view0turn15view3turn15view4

Two methodological cautions recur across the strongest syntheses: (a) most interventions are short-horizon (days/weeks), while durable learning requires delayed measures; and (b) many studies measure output quality or immediate performance rather than independent transfer, long-term retention, or higher-order reasoning under constraint. citeturn13view4turn23view1turn11view1

## Landscape and key themes

Recent literature converges on a small set of high-leverage themes:

**Learning conditions matter more than tool access.** The same underlying model can support learning when interaction is structured (hinting, prompting explanation, stepwise practice, feedback loops) and undermine learning when it enables copying or bypasses effortful cognition. citeturn17view8turn11view1turn23view0

**Human roles shift from content production to orchestration and judgment.** The 2024–2026 discourse increasingly centers teachers and learners as designers of workflows: deciding when AI is appropriate, what to verify, how to preserve agency, and how to avoid deskilling. citeturn17view5turn17view6turn17view0turn31view0

**Assessment redesign is becoming the dominant institutional response.** Regulators and assessment researchers argue that detection-only strategies are brittle, while “secure”/authentic assessment designs (process evidence, orals, in‑class tasks, portfolios) better align validity with AI-rich realities. citeturn23view4turn23view5turn15view5turn2search1turn2search13

**AI literacy is expanding into “generative AI literacy.”** Framework work moves beyond knowing “what AI is” to competencies for prompting, output evaluation, epistemic vigilance, ethical/legal understanding, and continuous updating as systems evolve. citeturn2search2turn31view3turn17view6turn23view2

**Equity, privacy, and governance are no longer peripheral.** Official guidance stresses that educational benefits depend on access, capacity building, cultural/linguistic inclusion, and safeguards for data and vulnerable learners—especially as enterprise AI enters classrooms. citeturn17view2turn17view3turn15view1turn15view4turn15view3

### Trend charts from a curated 2020–2026 set

The charts below summarize trends in a **curated, non-exhaustive** set of influential 2020–2026 publications used in this report (i.e., these are not field-wide bibliometrics). citeturn11view1turn31view0turn31view2turn2search2turn17view3

![Curated 2020–2026 AI-and-learning literature: items by year](sandbox:/mnt/data/chart_items_by_year.png)

![Curated literature mix by category](sandbox:/mnt/data/chart_items_by_category.png)

![Empirical studies: design types in curated set](sandbox:/mnt/data/chart_empirical_designs.png)

A complementary, larger-scale mapping study of AI in education research (across core venues) also documents rapid growth from 2020–2024 and highlights changing topic clusters and emerging frontiers—supporting the qualitative impression that post‑2022 work shifts strongly toward generative systems, interaction design, and governance questions. citeturn3search28

## Empirical evidence on learning outcomes and cognitive impacts

The empirical record since 2020 is mixed but increasingly legible if organized around **(1) design of the AI interaction** and **(2) what outcome is measured** (immediate performance vs retention/transfer vs metacognition).

### Comparative table of representative empirical studies

The table below prioritizes studies with clearer identification (RCTs, field experiments, or well-defined comparisons) and explicitly stated samples/outcomes.

| Study focus (year) | Setting & learners | Method & sample | Primary outcomes | Main finding for “how humans should learn” |
|---|---|---|---|---|
| Guardrails vs no guardrails in AI tutoring (2025) | High school mathematics, entity["country","Turkey","country"] | Large-scale RCT with GPT‑4 tutors (base vs tutor-with-guardrails vs control); “nearly a thousand” students; practice + subsequent exam without tools | Practice performance; exam performance without resources; behavior logs | AI access boosted practice performance substantially, but **base chatbot access reduced later exam performance**; guardrails largely mitigated harm, underscoring that **learning requires constrained help (hints/explanations) rather than answer provision**. citeturn17view8turn24search9turn11view1 |
| AI tutor vs in-class active learning (2025) | Authentic educational setting (STEM content) | RCT; N≈316; measured time on task and learning gains | Pre/post test learning gains; time; engagement/motivation ratings | Students learned more (and often faster) with a purpose-built AI tutor than in-class active learning, with higher reported engagement/motivation—consistent with **AI as structured tutor** rather than generic assistant. citeturn7view3 |
| AI as study aid and delayed retention (2025) | Undergraduates learning AI | RCT; n=120; ChatGPT study aid vs traditional study | Surprise retention test at 45 days | ChatGPT group scored lower on delayed retention, consistent with **cognitive offloading**: when AI removes effort during learning, durable memory formation can suffer. citeturn13view3turn11view1 |
| Neural/behavioral “cognitive debt” in AI-assisted writing (2025) | Adult participants writing essays | Lab study with EEG; n=54 across tool conditions | Brain connectivity during writing; essay features; recall/ownership | LLM-assisted group showed weaker brain connectivity patterns and weaker ownership/recall signals than “brain-only,” raising concern that frequent outsourcing may **reduce cognitive engagement** unless learning workflows require active processing. citeturn4search1turn11view1 |
| GPT‑4 as interactive homework tutor (2025; preprint + ACL paper) | High school ESL learning, entity["country","Italy","country"] | RCT in four classes replacing traditional homework | Learning outcomes & engagement; satisfaction | Interactive homework sessions increased satisfaction/desire to continue; learning outcomes were not harmed and in one group improved—suggesting **structured dialogic homework** can support learning if aligned with objectives and follow-up. citeturn17view9turn22view1 |
| LLM-generated adaptive feedback vs static expert feedback (2024/2025) | Pre-service teachers, entity["country","Germany","country"] | RCT; n=269; ChatGPT adaptive feedback vs identical static human feedback | Quality of written justification; decision accuracy; time/engagement | Adaptive feedback improved justification quality and increased engagement/time, but not decision accuracy—supporting targeted use of LLMs for **feedback augmentation** while recognizing limits for deeper reasoning. citeturn13view0 |
| AI feedback for critical writing (2025) | Undergraduates, entity["country","China","country"] | RCT; n=259; AI feedback vs instructor feedback; 4-week intervention | Writing development (overall and subdimensions) | AI feedback improved writing outcomes (especially organization/content development), indicating meaningful gains when AI functions as **iterative feedback channel** rather than a content generator. citeturn13view1 |
| SRL chatbot vs rule-based chatbot (2024) | Secondary students, entity["city","Hong Kong","hong kong sar, china"] | Comparative study; n=74 over 3 weeks | Science knowledge; behavioral engagement; motivation; SRL indicators | Generative SRL bot improved knowledge/engagement/motivation; interaction volume predicted SRL variation—supporting AI use that explicitly scaffolds **self-regulated learning cycles** (plan–act–reflect). citeturn23view2turn23view3 |
| When LLM feedback helps (2025; large-scale observational with adjustments) | Online tutor training, adult learners | 2,600+ lesson completions, 885 learners; propensity scoring | Posttest performance across 7 lessons | After adjustment, only 2/7 lessons showed moderate benefits (ES≈0.28–0.33), suggesting LLM feedback is **conditional on learner help-seeking propensity** and lesson design. citeturn22view2turn23view0 |

### What meta-analyses and syntheses imply

A 2024 systematic review/meta-analysis of experimental ChatGPT studies reports overall improvements in academic performance and affective-motivational measures, plus reduced mental effort; it also flags methodological concerns (e.g., limited power analyses, post-test designs) and explicitly recommends more complex/project-based assessments and longer-term evaluation. citeturn13view4

A 2025 meta-analysis spanning studies from Nov 2022–Feb 2025 likewise finds positive average effects on learning performance and perceptions, including higher-order thinking measures, but the field’s heterogeneity remains high—consistent with the “design and outcome” explanation above. citeturn3search31turn11view1

A 2025 evidence review from Microsoft Research emphasizes that education’s goals differ from productivity settings and identifies consistent concerns: inequities, critical thinking development, social development, and learner overconfidence in their own mastery when assisted. citeturn23view0turn11view1

### Cognitive impacts: where evidence is strongest vs weakest

**Most supported risks (with direct empirical signals)**  
*Reduced durable learning when AI bypasses effort.* Evidence includes delayed retention decrements (45-day surprise test) under unrestricted ChatGPT study-aid use and post-access “reversal” effects in classroom field experiments when AI is removed. citeturn13view3turn17view8turn11view1

*Shift from doing to supervising—sometimes with weaker critical engagement.* A CHI 2025 study surveying 319 knowledge workers finds that higher confidence in GenAI is associated with less self-reported critical thinking, while higher self-confidence is associated with more critical thinking; it frames a shift from “material production” toward oversight and verification that may still be undermined by over-trust. citeturn20view0turn20view1turn20view2

**Most supported benefits (when AI is embedded as pedagogy)**  
*AI tutoring and adaptive feedback can improve learning in less time or at scale.* RCT evidence shows meaningful effects when the AI tool is purpose-built or constrained to tutoring/feedback behaviors aligned with instructional goals. citeturn7view3turn13view0turn23view2

**Largest data gaps**  
*Longitudinal and transfer outcomes.* Major reviews and evidence syntheses repeatedly emphasize that long-term learning (months/years), transfer across tasks, and broad developmental outcomes are rarely measured at scale. citeturn13view4turn23view1turn11view1  
*Social and motivational development under AI-mediated study patterns.* Syntheses highlight plausible risks to human connection and collaboration but note limited causal evidence. citeturn23view0turn11view1  
*Distributional effects.* Equity impacts (who benefits or is harmed) remain under-identified across contexts, languages, prior achievement levels, disability status, and access conditions. citeturn23view0turn17view2turn17view3

## Theoretical frameworks that organize “how humans should learn”

A notable 2024–2026 shift is toward **hybrid learning-sciences + human–AI interaction frameworks** that treat AI as part of a learning environment rather than a neutral tool.

**Duality: learning with AI and learning about AI.** The U.S. Office of Educational Technology’s 2023 report (entity["organization","U.S. Department of Education","federal education agency"]) emphasizes balancing AI used to support student learning with AI literacy and critical understanding of AI’s role in society, including privacy/bias/surveillance risks. citeturn17view6

**Human-centered governance and design.** UNESCO’s generative AI guidance is explicitly anchored in a humanistic approach that promotes human agency, inclusion, equity, gender equality, cultural and linguistic diversity, and pluralism; it explicitly states regulation and capacity development are prerequisites for beneficial use. citeturn17view0turn17view1turn17view2

**“Skeptical optimism” and ecosystem-level implications.** A nine-expert commentary synthesizes opportunities (learning design, self-regulated learning supports, automated feedback) while stressing limitations, disruptions, ethics, and the danger of hasty adoption without evidence and pedagogical soundness. citeturn31view0turn31view1

**Promises-and-challenges framing grounded in learning sciences.** A 2024 Nature Human Behaviour perspective argues GenAI may scale personalized support and feedback and innovate assessment, but cautions about model imperfections, inequities, and the possibility of GenAI becoming a “crutch”; it explicitly calls for research into cognition, metacognition, creativity, and for learners to learn *with and about* GenAI. citeturn31view2turn11view1

**AI literacy → generative AI literacy.**  
- A widely cited 2020 definition frames AI literacy as competencies enabling people to critically evaluate AI, collaborate/communicate effectively with AI, and use AI as a tool across contexts—useful as a base layer for education systems. citeturn2search2  
- Newer competency models specify additional skills specific to generative systems: prompting, assessing outputs, ethical/legal context, and continuous updating. A 12‑competency model includes “basic AI literacy,” “knowledge of generative models,” “capacity/limitations,” “skill in prompting,” and “ethical/legal aspects,” explicitly describing this as a roadmap for curricula and assessments. citeturn31view3turn25view2

**Assessment validity under AI.** The AI Assessment Scale (AIAS) treats AI-use policy as an assessment design problem: selecting permissible AI involvement levels aligned with learning outcomes and transparency, rather than relying purely on detection or prohibition. citeturn23view4turn23view5turn2search0

## Pedagogical strategies aligned with the evidence

The strongest cross-source conclusion is that effective learning in the AI era requires **designing for cognitive work**, not for AI-aided output. The strategies below are organized by what the evidence suggests about *mechanisms* (effortful processing, feedback, self-regulation, calibration).

### Design learners’ workflow to prevent “false mastery”

Instructional guidance from OECD and research syntheses warn that learners can confuse output quality with mastery; learning design needs explicit **calibration** steps (prediction, explanation, checking, delayed retrieval). citeturn11view1turn23view0turn13view4

A practical pattern consistent with multiple empirical findings is **“attempt → feedback → revise → explain → re-attempt without AI.”** This mirrors why guardrails matter in tutoring studies and why delayed tests reveal harms when AI is used as an answer source. citeturn17view8turn13view3turn11view1

### Use AI as a tutor and feedback provider, not an answer engine

Field evidence suggests “tutor-like” interaction designs (incremental hints, prompting student reasoning, discouraging full solutions) reduce harmful copying behaviors and protect learning outcomes. citeturn17view8turn11view1

Similarly, RCT evidence on adaptive feedback indicates that personalized feedback can improve justification quality and motivation-related measures even when deeper decision accuracy does not change—supporting targeted adoption for feedback bottlenecks in large classes. citeturn13view0turn23view0

### Explicitly teach self-regulated learning with AI

A practical implication of SRL chatbot evidence is that AI can scaffold planning, monitoring, and reflection—but only if the activity structure expects those phases (e.g., plan–act–reflect cycles) and if teachers can specify objectives and constraints. citeturn23view2turn23view3turn17view1

Given that teacher capability is a limiting factor, systems-level data show major professional learning gaps: TALIS 2024 results indicate substantial teacher concern about integrity and widespread self-reported lack of knowledge/skills to teach using AI. citeturn16view0

### Prioritize “epistemic vigilance” as a core learning outcome

Multiple sources emphasize that learners must learn to **evaluate** AI outputs: fact-checking, identifying uncertainty, and recognizing bias or hallucinations. This is treated as both a literacy goal and a learning safeguard. citeturn13view5turn17view6turn17view1turn15view0

The CHI 2025 evidence suggests that higher trust/confidence in AI can reduce critical thinking effort; instruction should therefore incorporate “trust calibration” routines: require justifications, compare sources, and audit AI outputs against rubrics. citeturn20view0turn20view2

### Build generative AI literacy as curriculum, not an add-on

Competency models suggest a progression from foundational concepts to generative-model specific skills (prompting, evaluation, context, ethics/legal). A key takeaway is that “prompt skill” is only one component; learners also need evaluation and contextual judgment skills. citeturn31view3turn2search2turn17view6

## Assessment methods, equity/ethics, and governance

### Assessment: shift from policing to redesign

The AIAS framework operationalizes assessment redesign by specifying levels of AI involvement and emphasizing transparency, alignment to outcomes, and validity. Its later refinements explicitly position AI policy as a communication tool and redesign framework rather than a surveillance approach. citeturn23view4turn23view5turn2search0

Regulatory guidance from entity["organization","TEQSA","australia higher ed regulator"] similarly focuses on supporting institutions with assessment reform and integrity resources rather than implying detection alone is sufficient. citeturn21view0turn15view5

Peer-reviewed recommendations for **oral examinations** and other “secure” human-authentic assessments have gained traction as a response to generative systems’ ability to produce plausible written work. citeturn2search1turn13view4

### Equity: access, disability supports, language, and stratification risks

UNESCO’s AI-and-education guidance stresses that AI’s educational impacts will vary by national and socioeconomic circumstance and warns that “blindly” moving forward risks increased inequality and harm to technologically disadvantaged and underrepresented groups. citeturn17view3turn17view4

UNESCO’s generative AI guidance adds a human-centered regulatory agenda and highlights inclusive access, protections, and capacity building as prerequisites for ethical and meaningful use. citeturn17view2turn17view1

At the evidence-review level, Microsoft Research notes that equity effects are mixed: in some contexts GenAI can support marginalized groups (including disability-related supports), while in other contexts it can entrench performance gaps if access and learning conditions differ. citeturn23view0

### Privacy and data governance: enterprise AI makes this unavoidable

Industry education deployments increasingly stress enterprise privacy boundaries:

- OpenAI’s ChatGPT Edu announcement emphasizes administrative controls and states that conversations/data are not used to train OpenAI models. citeturn15view1  
- OpenAI’s ChatGPT for Teachers similarly positions education-grade privacy/security and FERPA-aligned safeguards in an educator workspace. citeturn15view2  
- Microsoft’s Copilot privacy documentation describes tenant-boundary controls, permission-based access, and non-use of prompts/responses for training foundation models in the Microsoft 365 Copilot context. citeturn15view4  
- Google’s Gemini security/privacy/compliance whitepaper positioning emphasizes governance controls and certifications as part of enterprise deployment. citeturn15view3  

The governance implication for educational institutions is that “AI use policy” cannot be separated from procurement, data retention, access control, and auditability. citeturn17view5turn15view4turn17view2

## Policy recommendations and open research questions

### Policy recommendations grounded in the literature

**Adopt a “learning-first” standard for AI procurement and classroom adoption.** The U.S. Department of Education’s recommended qualities include centering students/teachers, alignment to educational goals, privacy/data security, transparency/inspectability, discrimination protections, and human alternatives/override. citeturn17view5

**Treat GenAI as a regulated educational intervention, not a generic app.** UNESCO calls for regulation and capacity development to ensure ethical, safe, equitable, and meaningful use, including inclusive access and protections for vulnerable groups. citeturn17view2turn17view1

**Invest in system-wide professional learning.** TALIS 2024 results show adoption is already substantial in many systems while teacher confidence/training lags; policy should fund practical training for teachers on learning design, assessment redesign, and AI literacy instruction. citeturn16view0turn11view1

**Mandate assessment redesign pathways rather than detection dependence.** TEQSA’s reform-oriented resources and the spread of AIAS-like frameworks suggest a policy direction: require transparent AI-use labeling, adopt mixed “secure + authentic” assessment portfolios, and evaluate validity under AI availability. citeturn15view5turn21view0turn23view5turn13view4

**Make equity auditable.** In line with UNESCO’s equity warnings and the Microsoft evidence review, institutions should track who benefits (and who is harmed) by access differences, language availability, assistive use cases, and differential teacher capacity—before scaling. citeturn17view3turn23view0

### Open research questions and priority data gaps

**Long-term learning trajectories.** How do sustained AI-mediated study practices affect retention, transfer, and professional competence over semesters/years—especially when AI is intermittently available? Existing evidence strongly motivates this question but rarely measures it. citeturn17view8turn13view3turn23view1

**Mechanisms of harm vs benefit.** What interaction features (hinting policies, explanation prompts, forced retrieval, reflection loops) causally determine whether AI reduces or increases durable learning? The guardrails evidence makes this tractable, but more cross-domain replications are needed. citeturn17view8turn11view1turn13view4

**Metacognitive calibration and overconfidence.** How can systems and instruction reduce “false mastery” and help learners accurately estimate what they know? This appears repeatedly in OECD and Microsoft syntheses but is not yet backed by broad interventions research. citeturn11view1turn23view0

**Social development and collaboration.** Does frequent AI “companion” assistance reduce peer interaction or collaboration quality, and what designs preserve the social foundations of higher-order skill development? citeturn23view0turn31view2

**Equity effects under real constraints.** Which student populations benefit most (e.g., second-language learners, students with disabilities) and which are at risk of harm (e.g., weaker foundational skills, low-access settings)? How do costs, device availability, and language coverage shape outcomes? citeturn17view3turn23view0turn22view1

**Validity and fairness of assessment in AI-rich conditions.** What combinations of assessment formats best measure authentic competence while remaining inclusive and feasible? The rapid growth of frameworks outpaces comparative validation studies. citeturn23view5turn2search1turn2search13turn15view5

## Prioritized annotated reading list

The list below is prioritized for (a) decision usefulness, (b) methodological strength, and (c) influence/citation footprint, while balancing empirical studies, syntheses, and governance.

**High-priority empirical evidence (start here for “what works/what harms”)**

1) *Generative AI without guardrails can harm learning: Evidence from high school mathematics* (2025). Field experiment/RCT showing that chatbot-style access can harm later independent performance, while guardrails mitigate harm—arguably the clearest causal evidence for “design determines learning.” citeturn17view8turn24search1  
2) *AI tutoring outperforms in-class active learning* (2025). RCT indicating large learning gains and time efficiency from a purpose-built AI tutor aligned to pedagogical best practices. citeturn7view3  
3) *ChatGPT as a cognitive crutch: Evidence from a randomized controlled trial on knowledge retention* (2025). Clean delayed-test design (45 days) showing retention harm under unrestricted ChatGPT study-aid use—high relevance for study skill guidance. citeturn13view3  
4) *GPT‑4 as a Homework Tutor Can Improve Student Engagement and Learning Outcomes* (2025). RCT in high-school ESL homework replacement, showing the promise of structured interactive tutoring sessions and measuring engagement as well as outcomes. citeturn17view9turn22view1  
5) *Effects of adaptive feedback generated by a large language model* (2024/2025). RCT comparing adaptive LLM feedback vs static expert feedback; useful for evidence-based adoption of LLMs as feedback scalers in teacher education and beyond. citeturn13view0  
6) *Empowering student self-regulated learning and science education through ChatGPT* (2024). Comparative study in secondary education showing gains in knowledge, engagement, motivation when ChatGPT is embedded as an SRL scaffold with structured routines. citeturn23view2turn23view3  
7) *Your Brain on ChatGPT: Accumulation of Cognitive Debt…* (2025, arXiv). Early neuro/behavioral evidence of reduced engagement under LLM-assisted writing; best treated as provisional but important for hypothesis formation and cautious pedagogy. citeturn4search1  
8) *The Impact of Generative AI on Critical Thinking… Survey of Knowledge Workers* (2025). Not a student study, but a strong HCI paper that clarifies how confidence and trust shape critical thinking effort—useful for designing “trust calibration” pedagogy. citeturn20view0turn20view2  

**Best syntheses and conceptual frameworks (use to structure programs and research agendas)**

9) *Does ChatGPT enhance student learning? A systematic review and meta-analysis of experimental studies* (2024). The most directly policy-relevant synthesis for “average effects + limitations,” with explicit recommendations for stronger outcome measures and designs. citeturn13view4  
10) *The effect of ChatGPT on students’ learning performance…: meta-analysis (Nov 2022–Feb 2025)* (2025). Broad quantitative synthesis; useful for estimating average effects while recognizing heterogeneity and measurement variation. citeturn3search31  
11) *The promise and challenges of generative AI in education* (2024). Nine-expert commentary offering a research agenda, emphasizing human-centric design, continuous evidence, and ecosystem-level implications. citeturn31view0turn31view1  
12) *Promises and challenges of generative AI for human learning* (2024). High-impact perspective integrating learning sciences + HCI; frames GenAI as both scalable learning support and a potential crutch, calling for rigorous cognition/metacognition research. citeturn31view2  
13) *ChatGPT for good? On opportunities and challenges of LLMs for education* (2023). Influential early framing of opportunities, risks (bias, brittleness, misuse), and the need for competencies, critical thinking, and fact checking. citeturn13view5  
14) *What is AI Literacy? Competencies and Design Considerations* (2020). Foundational definition and competencies that still anchor most post‑2022 literacy models and curriculum work. citeturn2search2  
15) *Generative AI Literacy: Twelve Defining Competencies* (2024/2025). Concrete competency roadmap expanding AI literacy into generative-specific skills (prompting, evaluation, context, ethics/legal, continuous learning). citeturn31view3turn28search5  

**Assessment, integrity, and measurement (for institutions redesigning evaluation)**

16) *AI Assessment Scale (AIAS): Framework for Ethical Integration…* (2024). Practical assessment-leveling tool; valuable because it operationalizes policy in terms of learning outcomes and transparency rather than surveillance. citeturn23view4turn2search0  
17) *Reimagining the AIAS… refined framework for educational assessment* (2025). Updates AIAS and explicitly positions it as assessment redesign for validity, including equity/access considerations. citeturn23view5  
18) *Should oral examination be reimagined in the era of AI?* (2025). Argues for orals as a meaningful authenticity check when integrated thoughtfully, rather than as punitive afterthought. citeturn2search1  
19) *Embracing a new world: authentic assessment designs in an age of GenAI* (2026 preprint). Rapid review arguing for assessment redesign and authenticity as design, not policing; useful for practical assessment workshops and policy discussions. citeturn2search13  

**Policy and governance anchors (use to set system-level strategy)**

20) UNESCO — *Guidance for generative AI in education and research* (2023). The most cited global governance anchor forGenAI-in-education; emphasizes human agency, inclusion, equity, and regulation/capacity development. citeturn17view0turn17view1turn17view2  
21) UNESCO — *AI and education: Guidance for policy-makers* (2021). Pre-GenAI but still essential for equity-first framing and governance, explicitly warning about inequality risks under uneven technological capacity. citeturn17view3turn17view4  
22) U.S. Dept. of Education OET — *Artificial Intelligence and the Future of Teaching and Learning* (2023). Strong system-level framework, especially the “learning with and about AI” duality and the “qualities of AI tools for education.” citeturn17view6turn17view5  
23) OECD — *OECD Digital Education Outlook 2026* (summary page accessible via DOI). Key messages: performance≠learning, risks of metacognitive laziness, need for pedagogical guidance, and teacher adoption statistics connected to TALIS 2024. citeturn11view1  
24) OECD — *Results from TALIS 2024* (published 2025). Best comparative data on teacher AI use and concerns across systems; crucial for policy realism about readiness and training needs. citeturn16view0  
25) TEQSA — *Enacting assessment reform in a time of artificial intelligence* (2025). Practical regulatory resource illustrating assessment reform implementation and encouraging responsible student use. citeturn15view5turn21view0  

**Industry whitepapers/technical governance (use for implementation constraints, privacy/security)**

26) OpenAI — *Teaching with AI* (2023). Teacher-facing guide explicitly addressing limitations, bias, and the limits of AI detectors; useful for classroom policy and professional learning modules. citeturn15view0  
27) OpenAI — *Introducing ChatGPT Edu* (2024). Enterprise education positioning emphasizing admin controls and non-training on customer data—relevant for institutional adoption evaluations. citeturn15view1  
28) Microsoft — *Learning outcomes with GenAI in the classroom: a review of empirical evidence* (2025). A compact synthesis translating evidence into educator decision points (equity, overconfidence, social development, tutor vs chatbot distinction). citeturn23view0turn23view1  
29) Microsoft — *AI in Education: A Microsoft Special Report* (2025). Adoption-oriented global report; useful for understanding perceived use cases and institutional narratives (lower evidentiary weight than the empirical review). citeturn17view7  
30) Microsoft Learn — *Data, Privacy, and Security for Microsoft 365 Copilot* (updated through 2026). Implementation-relevant explanation of boundaries, permissions, and retention—important for governance rather than pedagogy. citeturn15view4  
31) Google Workspace — *Gemini security, privacy, compliance whitepaper* (download-gated landing page). Governance and compliance framing for enterprise Gemini deployments; useful for procurement and risk assessment. citeturn15view3  

**Note on a key access limitation:** the OECD Digital Education Outlook 2026 PDF download link repeatedly returned an error in the research tool environment, so OECD findings above are drawn from the OECD publication’s accessible summary/key-messages page and related OECD/TALIS pages rather than the full PDF text. citeturn11view1turn12view0