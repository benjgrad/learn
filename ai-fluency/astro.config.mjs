// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
	integrations: [
		starlight({
			title: 'AI Fluency',
			description: 'A developer education platform teaching AI fluency through evidence-based learning science.',
			customCss: [
				'./src/styles/global.css',
				'./src/styles/custom-starlight.css',
				'./src/styles/learning-components.css',
			],
			components: {
				Header: './src/components/overrides/Header.astro',
				Hero: './src/components/overrides/Hero.astro',
				PageSidebar: './src/components/overrides/PageSidebar.astro',
				ContentPanel: './src/components/overrides/ContentPanel.astro',
			},
			sidebar: [
				{
					label: 'Getting Started',
					items: [
						{ label: 'Welcome', slug: 'getting-started' },
						{ label: 'Competency Map', slug: 'competency-map' },
					],
				},
				{
					label: 'Foundations',
					items: [
						{ label: 'Overview', slug: 'foundations' },
						{ label: 'F.1 Tokens & Language', slug: 'foundations/tokens-and-language' },
						{ label: 'F.2 Context Windows', slug: 'foundations/context-windows' },
						{ label: 'F.3 Probabilistic Thinking', slug: 'foundations/probabilistic-thinking' },
						{ label: 'F.4 Linear Algebra', slug: 'foundations/math-linear-algebra' },
						{ label: 'F.5 Calculus', slug: 'foundations/math-calculus' },
						{ label: 'F.6 Probability & Statistics', slug: 'foundations/math-probability' },
						{ label: 'F.7 Optimization', slug: 'foundations/math-optimization' },
					],
				},
				{
					label: 'Level 1: Casual Consumer',
					items: [
						{ label: 'Overview', slug: 'level-1' },
						{ label: '1.1 AI as Inference Engine', slug: 'level-1/ai-as-inference-engine' },
						{ label: '1.2 Probabilistic Nature of AI', slug: 'level-1/probabilistic-nature' },
						{ label: '1.3 Basic Prompting Patterns', slug: 'level-1/basic-prompting' },
						{ label: '1.4 Choosing the Right Model', slug: 'level-1/choosing-models' },
						{ label: '1.5 AI Is Not Thinking', slug: 'level-1/ai-is-not-thinking' },
						{ label: '1.6 When Not to Trust AI', slug: 'level-1/when-not-to-trust-ai' },
						{ label: '1.7 Checkpoint', slug: 'level-1/checkpoint' },
					],
				},
				{
					label: 'Level 2: Prompt Engineer',
					items: [
						{ label: 'Overview', slug: 'level-2' },
						{ label: '2.1 Zero-Shot & Few-Shot', slug: 'level-2/zero-shot-and-few-shot' },
						{ label: '2.2 Chain-of-Thought', slug: 'level-2/chain-of-thought' },
						{ label: '2.3 Roles & Personas', slug: 'level-2/roles-and-personas' },
						{ label: '2.4 Parameters & Control', slug: 'level-2/parameters-and-control' },
						{ label: '2.5 Recursive Self-Improvement', slug: 'level-2/recursive-self-improvement' },
						{ label: '2.6 Prompt Libraries', slug: 'level-2/prompt-libraries' },
						{ label: '2.7 Local Models & Privacy', slug: 'level-2/local-models' },
						{ label: '2.8 Structured Output Basics', slug: 'level-2/structured-output-basics' },
						{ label: '2.9 Agentic Loops Intro', slug: 'level-2/agentic-loops-intro' },
						{ label: '2.10 Checkpoint', slug: 'level-2/checkpoint' },
					],
				},
				{
					label: 'Level 3: Context Engineer',
					items: [
						{ label: 'Overview', slug: 'level-3' },
						{ label: '3.1 Embeddings & Vector Space', slug: 'level-3/embeddings-and-vector-space' },
						{ label: '3.2 Vector Databases', slug: 'level-3/vector-databases' },
						{ label: '3.3 RAG Pipeline', slug: 'level-3/rag-pipeline' },
						{ label: '3.4 Chunking & Retrieval', slug: 'level-3/chunking-and-retrieval' },
						{ label: '3.5 Grounding for Accuracy', slug: 'level-3/grounding-for-accuracy' },
						{ label: '3.6 Model Architecture Awareness', slug: 'level-3/model-architecture-awareness' },
						{ label: '3.7 Model Economics & ROI', slug: 'level-3/model-economics' },
						{ label: '3.8 Context Compression', slug: 'level-3/context-compression' },
						{ label: '3.9 Checkpoint', slug: 'level-3/checkpoint' },
					],
				},
				{
					label: 'Level 4: Component Engineer',
					items: [
						{ label: 'Overview', slug: 'level-4' },
						{ label: '4.1 AI as Software Component', slug: 'level-4/ai-as-software-component' },
						{ label: '4.2 Engineering Patterns', slug: 'level-4/engineering-patterns' },
						{ label: '4.3 API Integration', slug: 'level-4/api-integration' },
						{ label: '4.4 Deterministic Wrappers', slug: 'level-4/deterministic-wrappers' },
						{ label: '4.5 Testing & CI/CD', slug: 'level-4/testing-and-cicd' },
						{ label: '4.6 Context Compression Patterns', slug: 'level-4/context-compression-patterns' },
						{ label: '4.7 Can vs. Should', slug: 'level-4/can-vs-should' },
						{ label: '4.8 Checkpoint', slug: 'level-4/checkpoint' },
					],
				},
				{
					label: 'Level 5: System Engineer',
					items: [
						{ label: 'Overview', slug: 'level-5' },
						{ label: '5.1 Transformer Architecture', slug: 'level-5/transformer-architecture' },
						{ label: '5.2 Attention Mechanism', slug: 'level-5/attention-mechanism' },
						{ label: '5.3 Fine-Tuning', slug: 'level-5/fine-tuning' },
						{ label: '5.4 Evaluation Metrics', slug: 'level-5/evaluation-metrics' },
						{ label: '5.5 Agentic Workflows', slug: 'level-5/agentic-workflows' },
						{ label: '5.6 Orchestration Frameworks', slug: 'level-5/orchestration-frameworks' },
						{ label: '5.7 Human-in-the-Loop Design', slug: 'level-5/human-in-the-loop' },
						{ label: '5.8 Multi-AI System Architecture', slug: 'level-5/multi-ai-system-architecture' },
						{ label: '5.9 System Cost & Performance', slug: 'level-5/system-cost-performance' },
						{ label: '5.10 Checkpoint', slug: 'level-5/checkpoint' },
					],
				},
				{
					label: 'Level 6: Platformizer',
					items: [
						{ label: 'Overview', slug: 'level-6' },
						{ label: '6.1 MLOps Fundamentals', slug: 'level-6/mlops-fundamentals' },
						{ label: '6.2 Inference Serving', slug: 'level-6/inference-serving' },
						{ label: '6.3 Monitoring & Drift', slug: 'level-6/monitoring-and-drift' },
						{ label: '6.4 Governance & Compliance', slug: 'level-6/governance-and-compliance' },
						{ label: '6.5 Cost Management', slug: 'level-6/cost-management' },
						{ label: '6.6 Distributed AI Computing', slug: 'level-6/distributed-computing' },
						{ label: '6.7 Sovereignty & Residency', slug: 'level-6/sovereignty-and-residency' },
						{ label: '6.8 Checkpoint', slug: 'level-6/checkpoint' },
					],
				},
				{
					label: 'Level 7: AI Pioneer',
					items: [
						{ label: 'Overview', slug: 'level-7' },
						{ label: '7.1 Alignment & Safety', slug: 'level-7/alignment-and-safety' },
						{ label: '7.2 Emergent Behavior', slug: 'level-7/emergent-behavior' },
						{ label: '7.3 Ethics of AI Content', slug: 'level-7/ethics-of-ai-content' },
						{ label: '7.4 Frontier Research', slug: 'level-7/frontier-research' },
						{ label: '7.5 Training Objectives', slug: 'level-7/training-objectives' },
						{ label: '7.6 Architecture Innovation', slug: 'level-7/architecture-innovation' },
						{ label: '7.7 Checkpoint', slug: 'level-7/checkpoint' },
					],
				},
				{
					label: 'Resources',
					autogenerate: { directory: 'resources' },
				},
				{
					label: 'Glossary',
					items: [
						{ label: 'Glossary', slug: 'glossary' },
					],
				},
			],
		}),
		react(),
		tailwind({ applyBaseStyles: false }),
	],
});
