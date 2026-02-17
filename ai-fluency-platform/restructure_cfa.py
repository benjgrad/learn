#!/usr/bin/env python3
"""Split CFA single-level courses into topic-based levels."""
import json
import os
import shutil
from collections import OrderedDict

BASE = os.path.dirname(os.path.abspath(__file__))
CONTENT = os.path.join(BASE, "content")

COLORS = [
    "#3b82f6", "#059669", "#d97706", "#7c3aed", "#e11d48",
    "#0891b2", "#ca8a04", "#4f46e5", "#16a34a", "#dc2626", "#6366f1",
]

TOPIC_SUBTITLES = {
    # CFA-1 & CFA-2
    "Quantitative Methods": "Statistical tools and mathematical foundations for investment analysis",
    "Economics": "Micro and macroeconomic theory applied to financial markets",
    "Corporate Issuers": "Corporate structure, governance, and capital allocation",
    "Financial Statement Analysis": "Analyzing financial statements for investment decisions",
    "Equity Investments": "Equity markets, valuation, and security analysis",
    "Fixed Income": "Bond markets, valuation, and risk management",
    "Derivatives": "Forwards, futures, options, and swaps",
    "Alternative Investments": "Private equity, real estate, hedge funds, and more",
    "Portfolio Management": "Portfolio theory, construction, and risk management",
    "Ethical and Professional Standards": "CFA Institute Code of Ethics and Standards of Practice",
    "Mock Exam": "Full-length practice exams simulating real test conditions",
    # CFA-3
    "Asset Allocation": "Capital market expectations, asset allocation, and behavioral finance",
    "Derivatives and Risk Management": "Option strategies, swaps, futures, and currency management",
    "Portfolio Construction": "Equity, fixed-income, and alternative portfolio management",
    "Performance Measurement": "Performance evaluation, manager selection, and GIPS",
    "Pathway: Portfolio Management": "Advanced portfolio strategies and private wealth management",
    "Pathway: Private Wealth": "Wealth planning, taxes, estate planning, and risk management",
    "Pathway: Private Markets": "Private equity, debt, real estate, and infrastructure",
}

TOPIC_DESCRIPTIONS = {
    "Quantitative Methods": "Master statistical methods, probability, hypothesis testing, regression analysis, and data science techniques used in investment analysis.",
    "Economics": "Understand market structures, business cycles, monetary and fiscal policy, international trade, and exchange rate mechanics.",
    "Corporate Issuers": "Analyze corporate governance, capital structure, working capital management, and business models for investment evaluation.",
    "Financial Statement Analysis": "Develop expertise in analyzing income statements, balance sheets, cash flows, and financial ratios across accounting standards.",
    "Equity Investments": "Learn equity market structure, security analysis, industry analysis, and valuation techniques for equity investments.",
    "Fixed Income": "Master bond valuation, yield analysis, duration and convexity, credit analysis, and structured products.",
    "Derivatives": "Understand derivative instruments, pricing models, and their applications in hedging and speculation.",
    "Alternative Investments": "Explore private equity, real estate, hedge funds, commodities, and digital assets as portfolio diversifiers.",
    "Portfolio Management": "Apply portfolio theory, risk management, and behavioral finance to construct and manage investment portfolios.",
    "Ethical and Professional Standards": "Apply the CFA Institute Code of Ethics and Standards of Professional Conduct to investment scenarios.",
    "Mock Exam": "Test your knowledge with full-length mock exams that simulate the actual CFA exam experience.",
    "Asset Allocation": "Develop capital market expectations, apply asset allocation frameworks, and understand behavioral finance impacts.",
    "Derivatives and Risk Management": "Construct option strategies, apply swaps and futures for risk management, and manage currency exposure.",
    "Portfolio Construction": "Build and manage equity, fixed-income, and alternative investment portfolios for institutional investors.",
    "Performance Measurement": "Evaluate portfolio performance, select investment managers, and apply GIPS standards.",
    "Pathway: Portfolio Management": "Advanced strategies in liability-driven investing, yield curve management, credit, equity, and multi-asset portfolios.",
    "Pathway: Private Wealth": "Comprehensive wealth planning including taxes, estate planning, concentrated positions, and goals-based investing.",
    "Pathway: Private Markets": "Analyze private equity, debt, real estate, infrastructure, and natural resources investments.",
}

COURSES = {
    "cfa-1": "level-1",
    "cfa-2": "level-2",
    "cfa-3": "level-3",
}


def process_course(course_name, old_level_slug):
    course_dir = os.path.join(CONTENT, course_name)
    curriculum_path = os.path.join(course_dir, "curriculum.json")
    old_level_dir = os.path.join(course_dir, old_level_slug)
    staging_dir = os.path.join(course_dir, f"_staging_{old_level_slug}")

    with open(curriculum_path) as f:
        curriculum = json.load(f)

    old_modules = curriculum["modules"][old_level_slug]

    # Group modules by cfaTopic, preserving first-appearance order
    # Skip the overview index page (isIndex: true, no cfaTopic)
    topic_groups = OrderedDict()
    for mod in old_modules:
        if mod.get("isIndex") and not mod.get("cfaTopic"):
            continue  # Skip course overview
        topic = mod.get("cfaTopic", "Uncategorized")
        if topic not in topic_groups:
            topic_groups[topic] = []
        topic_groups[topic].append(mod)

    print(f"\n{course_name}: {len(topic_groups)} topics from {len(old_modules)} modules")
    for topic, mods in topic_groups.items():
        print(f"  {topic}: {len(mods)} modules")

    # Stage: rename old dir to avoid collision
    os.rename(old_level_dir, staging_dir)

    # Build new levels and modules
    new_levels = []
    new_modules = {}
    # Track old->new level mapping for progress migration
    slug_migration = {}  # old_path -> new_path

    for idx, (topic, mods) in enumerate(topic_groups.items()):
        level_num = idx + 1
        level_slug = f"level-{level_num}"
        new_level_dir = os.path.join(course_dir, level_slug)
        os.makedirs(new_level_dir, exist_ok=True)

        color = COLORS[idx % len(COLORS)]
        subtitle = TOPIC_SUBTITLES.get(topic, topic)
        description = TOPIC_DESCRIPTIONS.get(topic, f"Study materials for {topic}.")

        # Create index.json for this level
        index_meta = {
            "title": topic if topic != "Mock Exam" else "Mock Exams",
            "description": description,
            "level": level_slug,
            "slug": "index",
            "order": 0,
            "isCheckpoint": False,
            "isIndex": True,
        }
        index_content = {
            "meta": index_meta,
            "blocks": [
                {
                    "type": "markdown",
                    "content": f"## {topic}\n\n{description}"
                }
            ]
        }
        with open(os.path.join(new_level_dir, "index.json"), "w") as f:
            json.dump(index_content, f, indent=2)
            f.write("\n")

        # Move and update each module
        level_modules = [index_meta]  # Start with index
        for order_idx, mod in enumerate(mods):
            slug = mod["slug"]
            old_path = os.path.join(staging_dir, f"{slug}.json")
            new_path = os.path.join(new_level_dir, f"{slug}.json")

            # Move file
            if os.path.exists(old_path):
                shutil.move(old_path, new_path)
            else:
                print(f"    WARNING: {old_path} not found!")
                continue

            # Update meta.level inside the JSON file
            with open(new_path) as f:
                file_data = json.load(f)
            file_data["meta"]["level"] = level_slug
            file_data["meta"]["order"] = order_idx + 1  # 0 is index
            with open(new_path, "w") as f:
                json.dump(file_data, f, indent=2)
                f.write("\n")

            # Update curriculum entry
            new_mod = dict(mod)
            new_mod["level"] = level_slug
            new_mod["order"] = order_idx + 1
            level_modules.append(new_mod)

            # Track migration
            old_key = f"{course_name}/{old_level_slug}/{slug}"
            new_key = f"{course_name}/{level_slug}/{slug}"
            if old_key != new_key:
                slug_migration[old_key] = new_key

        # Build level entry
        module_count = len(level_modules) - 1  # Exclude index
        new_levels.append({
            "level": level_num,
            "title": topic if topic != "Mock Exam" else "Mock Exams",
            "subtitle": subtitle,
            "color": color,
            "description": description,
            "moduleCount": module_count,
        })
        new_modules[level_slug] = level_modules

    # Write updated curriculum.json
    new_curriculum = {
        "levels": new_levels,
        "modules": new_modules,
    }
    with open(curriculum_path, "w") as f:
        json.dump(new_curriculum, f, indent=2)
        f.write("\n")

    # Clean up staging dir
    remaining = os.listdir(staging_dir)
    if remaining:
        # The old index.json that we skipped
        for leftover in remaining:
            print(f"  Removing leftover: {leftover}")
            os.remove(os.path.join(staging_dir, leftover))
    os.rmdir(staging_dir)

    total_modules = sum(len(mods) for mods in new_modules.values())
    print(f"  Result: {len(new_levels)} levels, {total_modules} total entries (including indices)")

    return slug_migration


def main():
    print("Restructuring CFA courses into topic-based levels...")
    all_migrations = {}

    for course_name, old_level_slug in COURSES.items():
        migrations = process_course(course_name, old_level_slug)
        all_migrations.update(migrations)

    # Write migration map for progress store
    migration_path = os.path.join(BASE, "src", "lib", "store", "cfa-level-migration.json")
    with open(migration_path, "w") as f:
        json.dump(all_migrations, f, indent=2)
        f.write("\n")

    print(f"\nWrote {len(all_migrations)} progress migration entries to {migration_path}")
    print("Done!")


if __name__ == "__main__":
    main()
