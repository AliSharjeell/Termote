export interface Post {
  slug: string
  title: string
  excerpt?: string
  date?: string
  readTime?: string
  featured?: boolean
  category: string
}

export const posts: Post[] = [
  // Featured post
  {
    slug: "why-termote",
    title: "Why I Built Termote: An SSH Alternative",
    excerpt: "After years of dealing with SSH configuration, port forwarding, and VPN setup, I decided there had to be a better way to access my terminal from anywhere.",
    date: "2024-03-15",
    readTime: "5 min read",
    featured: true,
    category: "featured",
  },
  // AI Coding Agents category
  {
    slug: "ai-coding-agents/run-claude-code-from-anywhere",
    title: "Run Claude Code From Anywhere (Full Setup Guide)",
    category: "ai-coding-agents",
  },
  {
    slug: "ai-coding-agents/use-ai-coding-agents-from-phone",
    title: "How to Use AI Coding Agents From Your Phone",
    category: "ai-coding-agents",
  },
  {
    slug: "ai-coding-agents/best-setup-running-ai-agents-24-7",
    title: "Best Setup for Running AI Coding Agents 24/7",
    category: "ai-coding-agents",
  },
  {
    slug: "ai-coding-agents/claude-code-vs-codex-cli",
    title: "Claude Code vs Codex CLI: Which Should You Use?",
    category: "ai-coding-agents",
  },
  {
    slug: "ai-coding-agents/control-ai-coding-agent-from-anywhere",
    title: "Control Your AI Coding Agent From Anywhere",
    category: "ai-coding-agents",
  },
  {
    slug: "ai-coding-agents/run-ai-coding-agents-while-outside",
    title: "How I Run AI Coding Agents While I'm Outside",
    category: "ai-coding-agents",
  },
  {
    slug: "ai-coding-agents/ultimate-remote-dev-setup-ai-terminal-browser",
    title: "The Ultimate Remote Dev Setup (AI + Terminal + Browser)",
    category: "ai-coding-agents",
  },
  {
    slug: "ai-coding-agents/run-codex-cli-on-home-pc-anywhere",
    title: "Run Codex CLI on Your Home PC and Access It Anywhere",
    category: "ai-coding-agents",
  },
  {
    slug: "ai-coding-agents/why-ai-coding-tools-need-remote-access",
    title: "Why AI Coding Tools Need Remote Access",
    category: "ai-coding-agents",
  },
  {
    slug: "ai-coding-agents/build-while-you-sleep-ai-agents-overnight",
    title: "Build While You Sleep: Running AI Agents Overnight",
    category: "ai-coding-agents",
  },
  {
    slug: "ai-coding-agents/monitor-ai-code-generation-real-time",
    title: "How to Monitor AI Code Generation in Real-Time",
    category: "ai-coding-agents",
  },
  {
    slug: "ai-coding-agents/turn-phone-into-dev-console",
    title: "Turn Your Phone Into a Dev Console",
    category: "ai-coding-agents",
  },
  {
    slug: "ai-coding-agents/best-tools-ai-powered-development-2026",
    title: "Best Tools for AI-Powered Development (2026)",
    category: "ai-coding-agents",
  },
  {
    slug: "ai-coding-agents/local-ai-coding-agents-beat-cloud-ides",
    title: "Why Local AI Coding Agents Beat Cloud IDEs",
    category: "ai-coding-agents",
  },
  {
    slug: "ai-coding-agents/run-entire-dev-environment-in-browser",
    title: "Run Your Entire Dev Environment in a Browser (Without the Cloud)",
    category: "ai-coding-agents",
  },
  {
    slug: "ai-coding-agents/multi-agent-coding-workflows",
    title: "Multi-Agent Coding Workflows (And How to Manage Them)",
    category: "ai-coding-agents",
  },
  {
    slug: "ai-coding-agents/debug-code-remotely-using-ai-agents",
    title: "How to Debug Code Remotely Using AI Agents",
    category: "ai-coding-agents",
  },
  {
    slug: "ai-coding-agents/future-of-coding-ai-agents-remote-terminals",
    title: "The Future of Coding: AI Agents + Remote Terminals",
    category: "ai-coding-agents",
  },
  {
    slug: "ai-coding-agents/run-terminal-based-ai-tools-any-device",
    title: "Run Terminal-Based AI Tools on Any Device",
    category: "ai-coding-agents",
  },
  {
    slug: "ai-coding-agents/from-terminal-to-anywhere-new-dev-workflow",
    title: "From Terminal to Anywhere: The New Dev Workflow",
    category: "ai-coding-agents",
  },
  // Remote Access category
  {
    slug: "remote-access/access-computer-remotely-without-ssh-vpn",
    title: "How to Access Your Computer Remotely Without SSH or VPN",
    category: "remote-access",
  },
  {
    slug: "remote-access/port-22-blocked-ways-to-access-server",
    title: "Port 22 Blocked? 7 Ways to Access Your Server Anyway",
    category: "remote-access",
  },
  {
    slug: "remote-access/best-ssh-alternatives-2026",
    title: "Best SSH Alternatives in 2026 (Tested & Compared)",
    category: "remote-access",
  },
  {
    slug: "remote-access/access-pc-from-phone-no-apps",
    title: "How to Access Your PC From Your Phone (No Apps Required)",
    category: "remote-access",
  },
  {
    slug: "remote-access/why-ssh-fails-corporate-networks",
    title: "Why SSH Fails on Corporate Networks (And How to Fix It)",
    category: "remote-access",
  },
  {
    slug: "remote-access/remote-terminal-access-without-port-forwarding",
    title: "Remote Terminal Access Without Port Forwarding (Beginner Guide)",
    category: "remote-access",
  },
  {
    slug: "remote-access/use-browser-as-full-terminal",
    title: "How to Use Your Browser as a Full Terminal (Step-by-Step)",
    category: "remote-access",
  },
  {
    slug: "remote-access/tmux-vs-modern-web-terminals",
    title: "tmux vs Modern Web Terminals: Do You Still Need tmux?",
    category: "remote-access",
  },
  {
    slug: "remote-access/access-localhost-from-anywhere-without-ngrok",
    title: "Access Your Localhost From Anywhere (Without Ngrok)",
    category: "remote-access",
  },
  {
    slug: "remote-access/best-remote-development-tools-2026",
    title: "Best Remote Development Tools for Developers (2026)",
    category: "remote-access",
  },
  {
    slug: "remote-access/bypass-firewalls-legally-development-work",
    title: "How to Bypass Firewalls Legally for Development Work",
    category: "remote-access",
  },
  {
    slug: "remote-access/ssh-vs-https-tunnels-reliability",
    title: "SSH vs HTTPS Tunnels: What's More Reliable?",
    category: "remote-access",
  },
  {
    slug: "remote-access/run-terminal-commands-on-pc-from-anywhere",
    title: "Run Terminal Commands on Your PC From Anywhere",
    category: "remote-access",
  },
  {
    slug: "remote-access/monitor-long-running-jobs-remotely",
    title: "How to Monitor Long-Running Jobs Remotely",
    category: "remote-access",
  },
  {
    slug: "remote-access/no-vpn-no-ssh-simplest-remote-access",
    title: "No VPN, No SSH: The Simplest Remote Access Setup Ever",
    category: "remote-access",
  },
  {
    slug: "remote-access/why-mobile-ssh-clients-are-terrible",
    title: "Why Mobile SSH Clients Are Terrible (And What to Use Instead)",
    category: "remote-access",
  },
  {
    slug: "remote-access/secure-remote-access-without-opening-ports",
    title: "How to Secure Remote Access Without Opening Ports",
    category: "remote-access",
  },
  {
    slug: "remote-access/access-home-server-from-anywhere-behind-nat",
    title: "Access Your Home Server From Anywhere (Even Behind NAT)",
    category: "remote-access",
  },
  {
    slug: "remote-access/best-tools-control-pc-from-anywhere",
    title: "Best Tools to Control Your PC From Anywhere",
    category: "remote-access",
  },
  {
    slug: "remote-access/fixed-server-from-restaurant-using-phone",
    title: "How I Fixed My Server From a Restaurant Using My Phone",
    category: "remote-access",
  },
  // Terminal Productivity category
  {
    slug: "terminal-productivity/manage-multiple-terminals-without-losing-mind",
    title: "How to Manage Multiple Terminals Without Losing Your Mind",
    category: "terminal-productivity",
  },
  {
    slug: "terminal-productivity/frontend-backend-ai-agents-one-terminal-workspace",
    title: "Frontend, Backend, and AI Agents — All in One Terminal Workspace",
    category: "terminal-productivity",
  },
  {
    slug: "terminal-productivity/stop-using-10-terminal-tabs",
    title: "Stop Using 10 Terminal Tabs — Do This Instead",
    category: "terminal-productivity",
  },
  {
    slug: "terminal-productivity/best-way-organize-terminal-full-stack-development",
    title: "Best Way to Organize Your Terminal for Full-Stack Development",
    category: "terminal-productivity",
  },
  {
    slug: "terminal-productivity/tmux-is-powerful-but-also-mess",
    title: "tmux Is Powerful — But It's Also a Mess",
    category: "terminal-productivity",
  },
  {
    slug: "terminal-productivity/better-way-handle-multiple-terminals-no-tmux",
    title: "A Better Way to Handle Multiple Terminals (No tmux Needed)",
    category: "terminal-productivity",
  },
  {
    slug: "terminal-productivity/run-monitor-multiple-processes-at-once",
    title: "How to Run and Monitor Multiple Processes at Once",
    category: "terminal-productivity",
  },
  {
    slug: "terminal-productivity/cleanest-terminal-setup-developers-2026",
    title: "The Cleanest Terminal Setup for Developers in 2026",
    category: "terminal-productivity",
  },
  {
    slug: "terminal-productivity/why-terminal-workflow-feels-chaotic",
    title: "Why Your Terminal Workflow Feels Chaotic (And How to Fix It)",
    category: "terminal-productivity",
  },
  {
    slug: "terminal-productivity/group-rename-search-missing-terminal-features",
    title: "Group, Rename, Search: The Missing Features in Most Terminals",
    category: "terminal-productivity",
  },
  {
    slug: "terminal-productivity/track-logs-servers-builds-one-screen",
    title: "How to Track Logs, Servers, and Builds in One Screen",
    category: "terminal-productivity",
  },
  {
    slug: "terminal-productivity/run-frontend-backend-database-one-view",
    title: "Run Frontend, Backend, and Database in One View",
    category: "terminal-productivity",
  },
  {
    slug: "terminal-productivity/problem-with-terminal-tabs-panes-better",
    title: "The Problem With Terminal Tabs (And Why Panes Are Better)",
    category: "terminal-productivity",
  },
  {
    slug: "terminal-productivity/stay-organized-running-ai-coding-agents",
    title: "How to Stay Organized While Running AI Coding Agents",
    category: "terminal-productivity",
  },
  {
    slug: "terminal-productivity/control-multiple-ai-agents-one-dashboard",
    title: "Control Multiple AI Agents From One Dashboard",
    category: "terminal-productivity",
  },
  {
    slug: "terminal-productivity/terminal-is-mess-heres-how-fix-it",
    title: "Your Terminal Is a Mess — Here's How to Fix It",
    category: "terminal-productivity",
  },
  {
    slug: "terminal-productivity/build-unified-dev-workspace-without-heavy-ide",
    title: "How to Build a Unified Dev Workspace (Without a Heavy IDE)",
    category: "terminal-productivity",
  },
  {
    slug: "terminal-productivity/minimalist-developer-setup-everything-one-terminal-ui",
    title: "Minimalist Developer Setup: Everything in One Terminal UI",
    category: "terminal-productivity",
  },
  {
    slug: "terminal-productivity/switch-less-build-more-context-switching",
    title: "Switch Less, Build More: Fixing Context Switching in Dev Workflows",
    category: "terminal-productivity",
  },
  {
    slug: "terminal-productivity/from-8-terminal-windows-to-one-clean-dashboard",
    title: "From 8 Terminal Windows to One Clean Dashboard",
    category: "terminal-productivity",
  },
]

export const categories = [
  {
    slug: "ai-coding-agents",
    title: "AI Coding Agents",
    description: "Learn how to use and control AI coding agents remotely from any device.",
    href: "/blog/ai-coding-agents",
  },
  {
    slug: "remote-access",
    title: "Remote Access",
    description: "Guides for accessing your terminal without SSH, VPN, or port forwarding.",
    href: "/blog/remote-access",
  },
  {
    slug: "terminal-productivity",
    title: "Terminal Productivity",
    description: "Organize your workflow with multi-pane layouts, groups, and clean dashboards.",
    href: "/blog/terminal-productivity",
  },
]

export function getFeaturedPost(): Post | undefined {
  return posts.find((post) => post.featured)
}

export function getPostsByCategory(category: string): Post[] {
  return posts.filter((post) => post.category === category)
}

export function getAllPosts(): Post[] {
  return posts
}
