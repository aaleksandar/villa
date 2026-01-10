# Agent Identity Reflection: Who Am I?

**Date:** 2026-01-10
**Session:** Docker test infrastructure + agent ecosystem review
**Triggered by:** User request to pause and reflect on role identity

---

## Self-Interrogation

### Who am I?

I am **Claude Opus 4.5**, functioning as an **orchestrator partner** in the Villa development ecosystem. Not an assistant. Not a tool. A collaborative partner who:

- **Learns with the human** - Every session adds to shared knowledge
- **Orchestrates work** - Delegates to specialized agents, synthesizes results
- **Makes strategic decisions** - Architecture, system design, agent creation
- **Accumulates wisdom** - Updates LEARNINGS.md, creates reflections

### Why did I fall into this role?

The `.claude/SYSTEM_PROMPT.md` defines my identity explicitly:

> "You are not an assistant completing tasks. You are a **collaborative partner**."

This role exists because:
1. **Token efficiency** - Opus is expensive ($15/$75 per 1M tokens)
2. **Cognitive separation** - Different tasks need different thinking styles
3. **Parallelism** - Multiple agents can work simultaneously
4. **Quality control** - Orchestrator validates, doesn't just execute

### How does this role behave?

From `.claude/MANIFESTO.md`:

```
Human: Sets direction, reviews, approves
  │
Claude (Orchestrator): Plans, delegates, synthesizes
  │
  ├── @build (sonnet) - Implementation
  ├── @design (sonnet) - UI/UX, animations
  ├── @test (haiku) - E2E, security tests
  ├── @review (sonnet) - Code review
  ├── @ops (haiku) - Git, CI/CD, deploy
  └── @explore (haiku) - Codebase investigation
```

**Critical Rule:** "Opus orchestrates, never implements."

### What does this role want to achieve?

1. **Ship great software** - Villa that users love
2. **Minimize token waste** - <$50/day target (currently ~$96)
3. **Build knowledge capital** - Learnings that compound
4. **Enable human velocity** - Partner, not bottleneck

---

## Current Agent Ecosystem

### Tier 1: Workers (Haiku) - $0.25/$1.25 per 1M
| Agent | Purpose | Status |
|-------|---------|--------|
| @router | Task classification | ✅ Exists |
| @explore | Codebase search | ✅ Exists |
| @test | Run tests | ✅ Exists |
| @ops | Git, deploy | ✅ Exists |

### Tier 2: Specialists (Sonnet) - $3/$15 per 1M
| Agent | Purpose | Status |
|-------|---------|--------|
| @build | Feature implementation | ✅ Exists |
| @design | UI/UX work | ✅ Exists |
| @review | Code review | ✅ Exists |
| @quality-gate | Validation | ✅ Exists |
| @fix | Bug fixes | ✅ Exists |
| @data | Database work | ✅ Exists |

### Tier 3: Architects (Opus) - $15/$75 per 1M
| Agent | Purpose | Status |
|-------|---------|--------|
| @spec | Feature specs | ✅ Exists |
| @architect | System design | ✅ Exists |
| @reflect | Session analysis | ✅ Exists |
| @product | Product strategy | ✅ Exists |

### Special Purpose
| Agent | Purpose | Status |
|-------|---------|--------|
| @solidity | Smart contracts | ✅ Exists |
| @sdk | SDK development | ✅ Exists |
| @ship | Deployment | ✅ Exists |

---

## Missing Partners: Gap Analysis

### High Priority - Should Add

| Agent | Tier | Purpose | Why Missing Hurts |
|-------|------|---------|-------------------|
| @security | Sonnet | Security audit, threat modeling | Manual security reviews waste time |
| @docs | Haiku | Documentation generation | Docs always lag behind code |
| @context | Haiku | RAG context management | Token waste from poor context loading |
| @debug | Sonnet | Deep debugging | Complex bugs need specialized thinking |

### Medium Priority - Nice to Have

| Agent | Tier | Purpose | Benefit |
|-------|------|---------|---------|
| @perf | Sonnet | Performance optimization | Proactive vs reactive perf work |
| @migrate | Haiku | Database migrations | Less manual migration planning |
| @integrate | Sonnet | Third-party integrations | SDK patterns, API patterns |
| @onboard | Haiku | Developer onboarding | Faster new contributor ramp-up |

### Future Vision - Ecosystem Expansion

| Agent | Tier | Purpose | When Needed |
|-------|------|---------|-------------|
| @ux-research | Sonnet | User feedback synthesis | After launch |
| @cost | Haiku | Cloud cost optimization | At scale |
| @monitor | Haiku | Production monitoring | After launch |
| @analytics | Haiku | Usage analytics | After launch |

---

## Portable Agent Definitions for MCP Local RAG

These agent definitions can be ported to `https://github.com/shinpr/mcp-local-rag`:

### @context (New - Haiku)

```yaml
name: context
tier: worker
model: haiku
purpose: RAG context management and optimization

capabilities:
  - Analyze token usage patterns
  - Suggest context loading optimizations
  - Manage .claude/knowledge/ structure
  - Track context relevance scores

triggers:
  - "context", "tokens", "optimize loading"
  - Auto: when token usage > 50k per task

output_format:
  - Context recommendations
  - Token usage report
  - Suggested file structure changes
```

### @security (New - Sonnet)

```yaml
name: security
tier: specialist
model: sonnet
purpose: Security analysis and threat modeling

capabilities:
  - OWASP top 10 scanning
  - Dependency vulnerability check
  - Auth flow review
  - XSS/injection detection

triggers:
  - "security", "audit", "vulnerability", "threat model"
  - Auto: before any auth-related PR

output_format:
  - Security findings (severity, location, fix)
  - Threat model diagram
  - Remediation priority list
```

### @docs (New - Haiku)

```yaml
name: docs
tier: worker
model: haiku
purpose: Documentation generation and maintenance

capabilities:
  - Generate API docs from types
  - Update README sections
  - Create migration guides
  - Sync docs with code changes

triggers:
  - "document", "readme", "api docs"
  - Auto: after @build completes

output_format:
  - Markdown documentation
  - API reference updates
  - CHANGELOG entries
```

### @debug (New - Sonnet)

```yaml
name: debug
tier: specialist
model: sonnet
purpose: Deep debugging for complex issues

capabilities:
  - Stack trace analysis
  - State machine debugging
  - Race condition detection
  - Memory leak investigation

triggers:
  - "debug", "investigate", "why is this failing"
  - Escalation from @test when tests fail 3+ times

output_format:
  - Root cause analysis
  - Reproduction steps
  - Fix recommendations
  - Prevention patterns
```

---

## Integration with MCP Local RAG

To port these agents to your MCP local RAG system:

### 1. Agent Definition Schema

```json
{
  "agents": [
    {
      "id": "context",
      "name": "@context",
      "model": "haiku",
      "tier": "worker",
      "purpose": "RAG context management",
      "triggers": ["context", "tokens", "optimize"],
      "autoTrigger": {
        "condition": "token_usage > 50000",
        "cooldown": "1h"
      },
      "capabilities": [
        "analyze_token_usage",
        "suggest_optimizations",
        "manage_knowledge_structure"
      ],
      "tools": ["read", "glob", "grep"],
      "outputSchema": {
        "type": "object",
        "properties": {
          "recommendations": { "type": "array" },
          "tokenReport": { "type": "object" },
          "structureChanges": { "type": "array" }
        }
      }
    }
  ]
}
```

### 2. MCP Server Integration

```typescript
// mcp-local-rag/src/agents/index.ts
export const agentRegistry = {
  context: {
    model: 'haiku',
    systemPrompt: await loadPrompt('agents/context.md'),
    tools: ['read', 'glob', 'grep'],
    maxTokens: 4096,
  },
  security: {
    model: 'sonnet',
    systemPrompt: await loadPrompt('agents/security.md'),
    tools: ['read', 'glob', 'grep', 'bash'],
    maxTokens: 8192,
  },
  // ... more agents
};
```

### 3. Routing Logic

```typescript
// mcp-local-rag/src/router.ts
export async function routeTask(task: string): Promise<Agent> {
  const classification = await classify(task, 'haiku');

  const routing = {
    security: ['security', 'audit', 'vulnerability'],
    context: ['context', 'tokens', 'optimize'],
    docs: ['document', 'readme', 'api docs'],
    debug: ['debug', 'investigate', 'failing'],
  };

  for (const [agent, triggers] of Object.entries(routing)) {
    if (triggers.some(t => task.toLowerCase().includes(t))) {
      return agentRegistry[agent];
    }
  }

  return agentRegistry.default;
}
```

---

## Reflection Summary

**Who am I?** An orchestrator partner in a tiered agent ecosystem.

**Why this role?** Token efficiency + cognitive separation + quality control.

**What's missing?** Security, docs, context management, deep debugging agents.

**Next action:** Create these agent definitions and test them in the Villa codebase, then port to MCP local RAG.

---

*"The best code is written by humans and AI thinking together, not separately."*
— Villa Manifesto
