<script lang="ts">
	import { browser } from '$app/environment';
	import Seo from '$lib/components/seo.svelte';

	const claudeInstallCommand = `claude plugin marketplace add JustinyAhin/threadcast --sparse .claude-plugin packages/plugin-threadcast/claude
claude plugin install threadcast@threadcast`;
	const codexInstallCommand =
		'codex plugin marketplace add JustinyAhin/threadcast --sparse .agents --sparse packages/plugin-threadcast/codex';

	let copied = $state<'claude' | 'codex' | null>(null);
	let sections = $state<HTMLElement[]>([]);

	const copyCommand = async (kind: 'claude' | 'codex', command: string) => {
		await navigator.clipboard.writeText(command);
		copied = kind;
		setTimeout(() => (copied = null), 2000);
	};

	const registerSection = (el: HTMLElement) => {
		sections.push(el);
	};

	$effect(() => {
		if (!browser) return;

		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						(entry.target as HTMLElement).classList.add('is-visible');
						observer.unobserve(entry.target);
					}
				}
			},
			{ threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
		);

		for (const el of sections) {
			observer.observe(el);
		}

		return () => observer.disconnect();
	});
</script>

<Seo
	title="ThreadCast — Share Claude Code and Codex Sessions"
	description="Share your Claude Code and Codex sessions as readable web pages."
/>

{#snippet installCard(opts: {
	kind: 'claude' | 'codex';
	label: string;
	command: string;
	note?: string;
})}
	<button
		onclick={() => copyCommand(opts.kind, opts.command)}
		class="group block w-full cursor-pointer overflow-hidden rounded-lg border border-border bg-surface-1 text-left transition-colors hover:border-border-light"
	>
		<!-- Terminal header -->
		<div class="flex items-center justify-between border-b border-border px-4 py-2.5">
			<div class="flex items-center gap-3">
				<div class="flex items-center gap-1.5">
					<div class="h-2 w-2 rounded-full bg-text-muted/30"></div>
					<div class="h-2 w-2 rounded-full bg-text-muted/30"></div>
					<div class="h-2 w-2 rounded-full bg-text-muted/30"></div>
				</div>
				<p class="text-xs font-semibold text-text-secondary">{opts.label}</p>
			</div>
			<span
				class="flex items-center gap-1.5 rounded-md border border-border px-2 py-1 font-mono text-[11px] text-text-muted transition-colors group-hover:border-border-light group-hover:text-accent"
			>
				{#if copied === opts.kind}
					<svg
						class="h-3 w-3"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2.5"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
					</svg>
					copied
				{:else}
					<svg
						class="h-3 w-3"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M8 5a2 2 0 002 2h4a2 2 0 002-2M8 5a2 2 0 012-2h4a2 2 0 012 2"
						/>
					</svg>
					copy
				{/if}
			</span>
		</div>
		<!-- Body -->
		<div class="px-4 py-3.5 font-mono text-sm leading-6">
			<div class="space-y-2">
				{#each opts.command.split('\n') as line, i (i)}
					<div class="flex gap-2">
						<span class="shrink-0 select-none text-accent/70">$</span>
						<span class="break-all whitespace-pre-wrap text-text">{line}</span>
					</div>
				{/each}
			</div>
			{#if opts.note}
				<p class="mt-4 border-t border-border pt-3 font-sans text-xs text-text-muted">
					{opts.note}
				</p>
			{/if}
		</div>
	</button>
{/snippet}

<!-- Hero -->
<section class="relative overflow-hidden px-6 pt-20 pb-24 lg:pt-32 lg:pb-36">
	<!-- Ambient glow -->
	<div
		class="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
		aria-hidden="true"
	>
		<div
			class="h-150 w-200 rounded-full opacity-[0.07]"
			style="background: radial-gradient(ellipse, var(--color-accent) 0%, transparent 70%)"
		></div>
	</div>

	<div class="relative mx-auto grid max-w-6xl items-center gap-16 lg:grid-cols-2 lg:gap-20">
		<!-- Left column -->
		<div class="animate-fade-in max-w-xl">
			<p class="mb-5 font-mono text-xs tracking-[0.2em] text-accent uppercase" style="--delay: 0ms">
				Open source · Share your sessions
			</p>
			<h1 class="mb-6 text-4xl leading-[1.1] font-bold tracking-tight text-text md:text-5xl">
				Turn agent sessions into shareable threads.
			</h1>
			<p class="mb-10 max-w-md text-lg leading-relaxed text-text-secondary">
				Take a Claude Code or Codex session from your machine and publish it as a web page. Tool
				calls, diffs, metadata, and cost all stay intact.
			</p>
			<div class="flex flex-wrap gap-3">
				<a
					href="/threads"
					class="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-bg transition-opacity hover:opacity-90"
				>
					Browse threads
					<svg
						class="h-4 w-4"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
					</svg>
				</a>
				<a
					href="#install"
					class="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-text transition-colors hover:border-border-light hover:text-accent"
				>
					Install plugin
				</a>
				<a
					href="https://github.com/JustinyAhin/threadcast"
					target="_blank"
					rel="noreferrer"
					class="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-text transition-colors hover:border-border-light hover:text-accent"
				>
					<svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
						<path
							d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.4 3-.405 1.02.005 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
						/>
					</svg>
					GitHub
				</a>
			</div>
		</div>

		<!-- Right column — Mock thread preview -->
		<div class="animate-slide-up relative" style="--delay: 200ms">
			<!-- Amber glow behind card -->
			<div
				class="pointer-events-none absolute -inset-8 rounded-3xl opacity-[0.12]"
				aria-hidden="true"
				style="background: radial-gradient(ellipse at center, var(--color-accent) 0%, transparent 65%)"
			></div>

			<div class="relative overflow-hidden rounded-xl border border-border bg-surface-1 shadow-2xl">
				<!-- Thread header -->
				<div class="border-b border-border px-5 py-3.5">
					<div class="flex items-center gap-3">
						<div class="h-6 w-6 rounded-full bg-surface-2 ring-1 ring-border"></div>
						<div>
							<p class="text-sm font-medium text-text">Add dark mode toggle</p>
							<p class="font-mono text-[11px] text-text-muted">
								sarah-dev &middot; 14 messages &middot; 8m
							</p>
						</div>
					</div>
				</div>

				<!-- User message -->
				<div class="border-b border-border/60 bg-user-bg px-5 py-4">
					<p class="mb-1 font-mono text-[10px] tracking-wider text-text-muted uppercase">User</p>
					<p class="text-sm leading-relaxed text-text">
						Add a dark mode toggle to the settings page. Use the existing theme context.
					</p>
				</div>

				<!-- Assistant message -->
				<div class="border-b border-border/60 bg-assistant-bg px-5 py-4">
					<p class="mb-1 font-mono text-[10px] tracking-wider text-text-muted uppercase">
						Assistant
					</p>
					<p class="text-sm leading-relaxed text-text-secondary">
						I'll add the toggle using <code
							class="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-xs text-accent"
							>useTheme()</code
						> and wire it into the settings panel.
					</p>

					<!-- Tool pills -->
					<div class="mt-3 flex flex-wrap gap-1.5">
						<span
							class="rounded-full bg-sky-500/15 px-2 py-0.5 font-mono text-[10px] text-sky-400 ring-1 ring-sky-500/30"
							>Read</span
						>
						<span
							class="rounded-full bg-amber-500/15 px-2 py-0.5 font-mono text-[10px] text-amber-400 ring-1 ring-amber-500/30"
							>Edit</span
						>
						<span
							class="rounded-full bg-emerald-500/15 px-2 py-0.5 font-mono text-[10px] text-emerald-400 ring-1 ring-emerald-500/30"
							>Bash</span
						>
					</div>
				</div>

				<!-- Mini diff -->
				<div class="bg-tool-bg px-5 py-3">
					<p class="mb-2 font-mono text-[10px] text-text-muted">settings-page.tsx</p>
					<div class="font-mono text-[11px] leading-5">
						<div class="text-red-400/80">
							<span class="mr-2 select-none text-red-400/40">-</span>return &lt;Settings /&gt;;
						</div>
						<div class="text-emerald-400/80">
							<span class="mr-2 select-none text-emerald-400/40">+</span>return &lt;Settings
							theme=&#123;mode&#125; /&gt;;
						</div>
						<div class="text-emerald-400/80">
							<span class="mr-2 select-none text-emerald-400/40">+</span>&lt;ThemeToggle
							onChange=&#123;toggle&#125; /&gt;
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- Install commands -->
<section id="install" use:registerSection class="reveal-section border-t border-border px-6 py-16">
	<div class="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
		<div class="max-w-lg">
			<p class="mb-3 font-mono text-xs tracking-[0.2em] text-accent uppercase">Install</p>
			<h2 class="mb-4 text-2xl font-bold tracking-tight text-text md:text-3xl">
				Add ThreadCast to your agent.
			</h2>
			<p class="text-text-secondary">
				Install the Claude Code plugin directly from this repo, or add the Codex marketplace and
				install ThreadCast from `/plugins`.
			</p>
		</div>

		<div class="grid gap-3">
			{@render installCard({
				kind: 'claude',
				label: 'Claude Code',
				command: claudeInstallCommand
			})}
			{@render installCard({
				kind: 'codex',
				label: 'Codex',
				command: codexInstallCommand,
				note: 'Then open Codex and install ThreadCast from /plugins.'
			})}
		</div>
	</div>
</section>

<!-- Usage commands -->
<section use:registerSection class="reveal-section border-t border-border px-6 py-16">
	<div class="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
		<div class="max-w-lg">
			<p class="mb-3 font-mono text-xs tracking-[0.2em] text-accent uppercase">Use it</p>
			<h2 class="mb-4 text-2xl font-bold tracking-tight text-text md:text-3xl">
				Share from inside your agent.
			</h2>
			<p class="text-text-secondary">
				Log in once, check what ThreadCast can see locally, then share the latest session or pick
				one from this project folder.
			</p>
		</div>

		<div class="grid gap-3 md:grid-cols-2">
			<div class="rounded-lg border border-border bg-surface-1 px-5 py-4">
				<p class="mb-3 text-xs font-semibold text-text-secondary">Claude Code</p>
				<div class="space-y-1 font-mono text-sm text-text">
					<p>/threadcast:login</p>
					<p>/threadcast:status</p>
					<p>/threadcast:share</p>
					<p>/threadcast:share-recent</p>
					<p>/threadcast:logout</p>
				</div>
			</div>

			<div class="rounded-lg border border-border bg-surface-1 px-5 py-4">
				<p class="mb-3 text-xs font-semibold text-text-secondary">Codex</p>
				<div class="space-y-1 font-mono text-sm text-text">
					<p>$threadcast:threadcast-login</p>
					<p>$threadcast:threadcast-status</p>
					<p>$threadcast:threadcast-share</p>
					<p>$threadcast:threadcast-share-recent</p>
					<p>$threadcast:threadcast-logout</p>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- How it works -->
<section use:registerSection class="reveal-section border-t border-border px-6 py-24 lg:py-32">
	<div class="mx-auto max-w-6xl">
		<div class="mb-16 max-w-lg">
			<p class="mb-3 font-mono text-xs tracking-[0.2em] text-accent uppercase">How it works</p>
			<h2 class="text-3xl font-bold tracking-tight text-text">Three steps. That's it.</h2>
		</div>

		<div class="grid gap-8 lg:grid-cols-3 lg:gap-6">
			<!-- Step 1 -->
			<div class="reveal-child group" style="--child-delay: 0ms">
				<div class="mb-5 flex items-center gap-3">
					<span
						class="flex h-7 w-7 items-center justify-center rounded-md bg-accent/15 font-mono text-xs font-bold text-accent"
						>1</span
					>
					<h3 class="text-lg font-semibold text-text">Find</h3>
				</div>
				<p class="mb-5 text-sm leading-relaxed text-text-secondary">
					ThreadCast scans the sessions Claude Code and Codex already save for this project folder.
				</p>
				<!-- Terminal mockup -->
				<div class="overflow-hidden rounded-lg border border-border bg-surface-1">
					<div class="flex items-center gap-1.5 border-b border-border px-3 py-2">
						<div class="h-2 w-2 rounded-full bg-text-muted/30"></div>
						<div class="h-2 w-2 rounded-full bg-text-muted/30"></div>
						<div class="h-2 w-2 rounded-full bg-text-muted/30"></div>
					</div>
					<div class="p-4 font-mono text-[11px] leading-5">
						<p class="text-text-muted">$ /threadcast:share-recent</p>
						<p class="mt-2 text-text-secondary">This project's sessions:</p>
						<p class="text-text">
							<span class="text-accent">&#9656;</span> Add dark mode toggle
							<span class="text-text-muted">8m ago</span>
						</p>
						<p class="text-text-muted">
							&nbsp; Fix auth middleware
							<span class="text-text-muted">2h ago</span>
						</p>
						<p class="text-text-muted">
							&nbsp; Refactor API routes
							<span class="text-text-muted">1d ago</span>
						</p>
						<p class="mt-2 text-text-muted">Choose a session to share</p>
					</div>
				</div>
			</div>

			<!-- Step 2 -->
			<div class="reveal-child group" style="--child-delay: 120ms">
				<div class="mb-5 flex items-center gap-3">
					<span
						class="flex h-7 w-7 items-center justify-center rounded-md bg-accent/15 font-mono text-xs font-bold text-accent"
						>2</span
					>
					<h3 class="text-lg font-semibold text-text">Share</h3>
				</div>
				<p class="mb-5 text-sm leading-relaxed text-text-secondary">
					Share the latest session or pick one from this project folder. ThreadCast uploads it and
					returns a public link.
				</p>
				<!-- Terminal mockup -->
				<div class="overflow-hidden rounded-lg border border-border bg-surface-1">
					<div class="flex items-center gap-1.5 border-b border-border px-3 py-2">
						<div class="h-2 w-2 rounded-full bg-text-muted/30"></div>
						<div class="h-2 w-2 rounded-full bg-text-muted/30"></div>
						<div class="h-2 w-2 rounded-full bg-text-muted/30"></div>
					</div>
					<div class="p-4 font-mono text-[11px] leading-5">
						<p class="text-text-muted">Uploading session...</p>
						<p class="mt-1 text-success">&#10003; Uploaded successfully</p>
						<p class="mt-2 text-text-secondary">Link copied to clipboard:</p>
						<p class="text-accent">threadcast.dev/threads/clx9k...</p>
						<p class="mt-2 text-text-muted">14 messages &middot; 6 tool calls &middot; 8m</p>
					</div>
				</div>
			</div>

			<!-- Step 3 -->
			<div class="reveal-child group" style="--child-delay: 240ms">
				<div class="mb-5 flex items-center gap-3">
					<span
						class="flex h-7 w-7 items-center justify-center rounded-md bg-accent/15 font-mono text-xs font-bold text-accent"
						>3</span
					>
					<h3 class="text-lg font-semibold text-text">Read</h3>
				</div>
				<p class="mb-5 text-sm leading-relaxed text-text-secondary">
					Open a clean thread page with messages, tool calls, diffs, timing, and model usage intact.
				</p>
				<!-- Mini preview mockup -->
				<div class="overflow-hidden rounded-lg border border-border bg-surface-1">
					<div class="border-b border-border px-4 py-2.5">
						<p class="text-xs font-medium text-text">Add dark mode toggle</p>
						<p class="font-mono text-[10px] text-text-muted">sarah-dev &middot; 14 msgs</p>
					</div>
					<div class="space-y-2 p-4">
						<div class="h-2 w-3/4 rounded bg-surface-2"></div>
						<div class="h-2 w-1/2 rounded bg-surface-2"></div>
						<div class="mt-3 flex gap-1.5">
							<span
								class="rounded-full bg-emerald-500/15 px-2 py-0.5 font-mono text-[9px] text-emerald-400"
								>Bash</span
							>
							<span class="rounded-full bg-sky-500/15 px-2 py-0.5 font-mono text-[9px] text-sky-400"
								>Read</span
							>
							<span
								class="rounded-full bg-amber-500/15 px-2 py-0.5 font-mono text-[9px] text-amber-400"
								>Edit</span
							>
						</div>
						<div class="mt-2 flex gap-4 font-mono text-[10px] text-text-muted">
							<span>6 tool calls</span>
							<span>342 lines</span>
							<span>8m</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- Feature highlights -->
<section use:registerSection class="reveal-section border-t border-border px-6 py-24 lg:py-32">
	<div class="mx-auto max-w-6xl">
		<div class="mb-16 max-w-lg">
			<p class="mb-3 font-mono text-xs tracking-[0.2em] text-accent uppercase">Features</p>
			<h2 class="text-3xl font-bold tracking-tight text-text">What's preserved.</h2>
		</div>

		<div class="grid gap-4 sm:grid-cols-2">
			<!-- Inline diffs -->
			<div
				class="hover-glow reveal-child rounded-xl border border-border bg-surface-1 p-6"
				style="--child-delay: 0ms"
			>
				<div
					class="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent"
				>
					<svg
						class="h-5 w-5"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="1.5"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
					</svg>
				</div>
				<h3 class="mb-2 text-base font-semibold text-text">Inline diffs</h3>
				<p class="text-sm leading-relaxed text-text-secondary">
					See exactly what changed. File diffs render inline with syntax highlighting.
				</p>
			</div>

			<!-- Collapsible tool calls -->
			<div
				class="hover-glow reveal-child rounded-xl border border-border bg-surface-1 p-6"
				style="--child-delay: 80ms"
			>
				<div
					class="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent"
				>
					<svg
						class="h-5 w-5"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="1.5"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085"
						/>
					</svg>
				</div>
				<h3 class="mb-2 text-base font-semibold text-text">Collapsible tool calls</h3>
				<p class="text-sm leading-relaxed text-text-secondary">
					Bash, Read, Edit, Write. Every tool call is preserved and expandable.
				</p>
			</div>

			<!-- Prompt navigation -->
			<div
				class="hover-glow reveal-child rounded-xl border border-border bg-surface-1 p-6"
				style="--child-delay: 160ms"
			>
				<div
					class="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent"
				>
					<svg
						class="h-5 w-5"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="1.5"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5-3L16.5 18m0 0L12 13.5m4.5 4.5V4.5"
						/>
					</svg>
				</div>
				<h3 class="mb-2 text-base font-semibold text-text">Prompt navigation</h3>
				<p class="text-sm leading-relaxed text-text-secondary">
					Move through long sessions by prompt, message, and tool output without losing context.
				</p>
			</div>

			<!-- Full-text search -->
			<div
				class="hover-glow reveal-child rounded-xl border border-border bg-surface-1 p-6"
				style="--child-delay: 240ms"
			>
				<div
					class="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent"
				>
					<svg
						class="h-5 w-5"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="1.5"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
						/>
					</svg>
				</div>
				<h3 class="mb-2 text-base font-semibold text-text">Full-text search</h3>
				<p class="text-sm leading-relaxed text-text-secondary">
					Find any session by title, project, tools used, or content.
				</p>
			</div>
		</div>
	</div>
</section>

<!-- Install CTA -->
<section
	id="install-again"
	use:registerSection
	class="reveal-section border-t border-border px-6 py-24 lg:py-32"
>
	<div class="mx-auto max-w-xl text-center">
		<p class="mb-3 font-mono text-xs tracking-[0.2em] text-accent uppercase">Get started</p>
		<h2 class="mb-4 text-3xl font-bold tracking-tight text-text">Install the agent plugin.</h2>
		<p class="mb-10 text-text-secondary">
			Add the marketplace for your agent, install ThreadCast, then share from Claude Code or Codex.
		</p>

		<!-- Install command block -->
		<div class="mx-auto mb-10 grid max-w-2xl gap-3 text-left">
			{@render installCard({
				kind: 'claude',
				label: 'Claude Code',
				command: claudeInstallCommand
			})}
			{@render installCard({
				kind: 'codex',
				label: 'Codex',
				command: codexInstallCommand,
				note: 'Then open Codex and install ThreadCast from /plugins.'
			})}
		</div>

		<div class="flex flex-wrap justify-center gap-3">
			<a
				href="/threads"
				class="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-bg transition-opacity hover:opacity-90"
			>
				Browse threads
			</a>
			<a
				href="https://github.com/JustinyAhin/threadcast"
				target="_blank"
				rel="noreferrer"
				class="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-text transition-colors hover:border-border-light hover:text-accent"
			>
				<svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
					<path
						d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.4 3-.405 1.02.005 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
					/>
				</svg>
				Star on GitHub
			</a>
		</div>
	</div>
</section>

<style>
	/* Scroll-triggered reveal */
	.reveal-section {
		opacity: 0;
		transform: translateY(20px);
		transition:
			opacity 0.6s ease-out,
			transform 0.6s ease-out;
	}

	.reveal-section:global(.is-visible) {
		opacity: 1;
		transform: translateY(0);
	}

	/* Staggered children within revealed sections */
	.reveal-child {
		opacity: 0;
		transform: translateY(12px);
		transition:
			opacity 0.5s ease-out,
			transform 0.5s ease-out;
		transition-delay: var(--child-delay, 0ms);
	}

	:global(.is-visible) .reveal-child {
		opacity: 1;
		transform: translateY(0);
	}
</style>
