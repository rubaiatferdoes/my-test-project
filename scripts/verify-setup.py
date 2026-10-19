"""Verify the QA framework wiring: commands -> agents -> skills.

Usage (from the project root):
    python scripts/verify-setup.py          # static check, free, ~1 second
    python scripts/verify-setup.py --live   # also runs every command headless (~$0.10 total)
    python scripts/verify-setup.py --live /setup:env-readiness   # live-check only the commands named

Static check:  every command points to an agent/skill that exists, every
agent's preloaded skills exist, every file a skill links to exists.
Live check:    runs each / command in DRY-RUN mode and confirms the
right agent ran with the right skills (or the right skill was loaded).
"""
import json
import pathlib
import re
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
CLAUDE_DIR = ROOT / ".claude"
problems = []


def frontmatter(path):
    text = path.read_text(encoding="utf-8-sig").replace("\r\n", "\n")
    match = re.match(r"^---\n(.*?)\n---\n(.*)$", text, re.S)
    if not match:
        problems.append(f"{path.relative_to(ROOT)}: missing frontmatter")
        return {}, text
    fields, current = {}, None
    for line in match.group(1).splitlines():
        item = re.match(r"^\s+-\s+(.+)$", line)
        if item and current:
            fields.setdefault(current, []).append(item.group(1).strip())
            continue
        kv = re.match(r"^([\w-]+):\s*(.*)$", line)
        if kv:
            current = kv.group(1)
            fields[current] = kv.group(2).strip() or []
    return fields, match.group(2)


# --- Load skills, agents, commands ---------------------------------------
skills = {}
for skill_md in sorted(CLAUDE_DIR.glob("skills/*/SKILL.md")):
    fm, body = frontmatter(skill_md)
    name = fm.get("name", "")
    if name != skill_md.parent.name:
        problems.append(f"skill folder '{skill_md.parent.name}' has name '{name}' (must match)")
    if not fm.get("description"):
        problems.append(f"skill '{name}': missing description")
    for link in re.findall(r"\]\(((?:templates|references|scripts)/[^)]+)\)", body):
        if not (skill_md.parent / link).exists():
            problems.append(f"skill '{name}': linked file not found: {link}")
    skills[name] = skill_md

agents = {}
for agent_md in sorted(CLAUDE_DIR.glob("agents/**/*.md")):
    fm, body = frontmatter(agent_md)
    name = fm.get("name", "")
    if name in agents:
        problems.append(f"duplicate agent name '{name}'")
    preload = fm.get("skills", [])
    for skill in preload:
        if skill not in skills:
            problems.append(f"agent '{name}': preloads unknown skill '{skill}'")
    agents[name] = {"path": agent_md, "skills": preload}

commands = {}
for cmd_md in sorted(CLAUDE_DIR.glob("commands/**/*.md")):
    fm, body = frontmatter(cmd_md)
    rel = cmd_md.relative_to(CLAUDE_DIR / "commands").with_suffix("")
    slash = "/" + ":".join(rel.parts)
    agent = fm.get("agent")
    skill = fm.get("skill")
    if not skill:
        # Legacy fallback for commands without a `skill:` frontmatter field.
        used_skill = re.search(r"Use the ([\w-]+) skill", body)
        skill = used_skill.group(1) if used_skill else None
    if agent:
        if fm.get("context") != "fork":
            problems.append(f"{slash}: has 'agent' but no 'context: fork' (agent is ignored)")
        if agent not in agents:
            problems.append(f"{slash}: agent '{agent}' not found")
        commands[slash] = {"agent": agent, "skills": agents.get(agent, {}).get("skills", [])}
    elif skill:
        if skill not in skills:
            problems.append(f"{slash}: uses unknown skill '{skill}'")
        commands[slash] = {"skill": skill}
    else:
        problems.append(f"{slash}: neither an agent nor a skill is wired")

# --- Print the wiring map ---------------------------------------------------
print("COMMAND -> AGENT / SKILL WIRING\n")
for slash, wiring in commands.items():
    if "agent" in wiring:
        print(f"  {slash:45} -> agent {wiring['agent']:24} skills: {', '.join(wiring['skills']) or '-'}")
    else:
        print(f"  {slash:45} -> skill {wiring['skill']}")
unused = set(skills) - {s for w in commands.values() for s in w.get("skills", []) + [w.get("skill")]}
if unused:
    print(f"\n  Skills only used directly (/name): {', '.join(sorted(unused))}")


# --- Live check ---------------------------------------------------------------
def run_live(slash, wiring):
    if "agent" in wiring:
        prompt = (f"{slash} DRY-RUN. Do not read, write, or run anything. Reply in one line: "
                  "your agent name, then the exact names of the skills preloaded into your context.")
    else:
        prompt = (f"{slash} DRY-RUN. Load the skill, but do not read, write, or run anything else. "
                  "Reply in one line with the name of the skill you loaded.")
    # Inline commands depend on the model choosing to call the Skill tool; haiku is unreliable at that.
    model = "haiku" if "agent" in wiring else "sonnet"
    try:
        proc = subprocess.run(
            ["claude", "-p", prompt, "--output-format", "stream-json", "--verbose",
             "--model", model, "--max-budget-usd", "0.25"],
            cwd=ROOT, capture_output=True, text=True, encoding="utf-8", timeout=300, shell=sys.platform == "win32")
    except subprocess.TimeoutExpired:
        return False, "claude CLI timed out after 300s", ""
    except FileNotFoundError:
        return False, "claude CLI not found on PATH", ""
    forked, skill_calls, answer = False, [], ""
    for line in proc.stdout.splitlines():
        try:
            event = json.loads(line)
        except json.JSONDecodeError:
            continue
        if str(event.get("parent_tool_use_id") or "").startswith("forked-command-"):
            forked = True
        message = event.get("message")
        content = message.get("content") if isinstance(message, dict) else None
        for block in content if isinstance(content, list) else []:
            if isinstance(block, dict) and block.get("type") == "tool_use" and block.get("name") == "Skill":
                skill_calls.append(block.get("input", {}).get("skill", ""))
        if event.get("type") == "result":
            answer = str(event.get("result", "")).lower()
    if "agent" in wiring:
        norm_answer = re.sub(r"[^a-z0-9]", "", answer)
        missing = [s for s in wiring["skills"] if re.sub(r"[^a-z0-9]", "", s) not in norm_answer]
        right_agent = all(word in answer for word in wiring["agent"].split("-"))
        ok = forked and right_agent and not missing
        detail = f"forked={forked}, agent named={right_agent}, missing skills={missing or 'none'}"
    else:
        ok = wiring["skill"] in skill_calls
        detail = f"Skill tool called with: {skill_calls or 'nothing'}"
    return ok, detail, answer[:120]


if "--live" in sys.argv:
    print("\nLIVE CHECK (headless, DRY-RUN)\n")
    only = [a for a in sys.argv[1:] if a.startswith("/")]
    for slash, wiring in commands.items():
        if only and slash not in only:
            continue
        ok, detail, answer = run_live(slash, wiring)
        if not ok:  # one retry: model behaviour varies between runs
            ok, detail, answer = run_live(slash, wiring)
        print(f"  {'PASS' if ok else 'FAIL'}  {slash:45} {detail}")
        if not ok:
            problems.append(f"live: {slash}: {detail} | reply: {answer}")

print()
if problems:
    print(f"RESULT: {len(problems)} problem(s)")
    for p in problems:
        print("  - " + p)
    sys.exit(1)
print("RESULT: all wiring OK")
