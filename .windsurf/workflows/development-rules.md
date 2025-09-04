---
description: Always Follow these rules when building a new product. 
auto_execution_mode: 3
---

# Centralized Memory Bank
reference_memory: memory/docs/*.md
memory_files:
  - memory/docs/product_requirements.md
  - memory/docs/architecture.md
  - memory/docs/technical.md
  - memory/tasks/tasks_plan.md
  - memory/docs/development_logs.md

# File Referencing
file_reference_syntax: @filename
prioritize_referenced_files: true
cross_reference_memory: memory/docs/*.md

# Workflow Structuring
workflow:
  - project_rules/plan.md
  - project_rules/implement.md
  - project_rules/debug.md
plan_steps: analyze_requirements, break_into_subtasks, estimate_effort
implement_steps: write_modular_code, follow_technical_standards, add_comments
debug_steps: check_logs, validate_requirements, suggest_fixes

# Iterative Execution
execute_in_sandbox: true
iterate_on_errors: true
max_iterations: 3

# Code Quality
coding_standards: memory/docs/technical.md
linter: eslint
auto_fix_lint_errors: true
use_camel_case: true
require_jsdoc: true
avoid_global_variables: true

# Modularity
modular_code: true
separate_concerns:
  frontend: src/components/
  backend: src/api/
  database: src/db/
use_dependency_injection: true

# Error Detection
proactive_error_check: true
check_errors:
  - null_pointer
  - missing_imports
  - async_await_mismatch
validate_against: memory/docs/technical.md

# Contextual Fixes
analyze_logs: true
suggest_fixes_with_explanation: true
reference_logs: memory/docs/development_logs.md

# Token Optimization
response_style: concise
load_relevant_files_only: true

# Platform Features
use_platform_features:
  windsurf: cascade, @notation
  cursor: workspace_prompts
  copilot: copilot-instructions.md
  replit: ghostwriter
  cody: semantic_search

# Collaboration
generate_shareable_workflows: project_rules/*.md
document_code: true
update_logs: memory/docs/development_logs.md

# Scalability
adapt_to_project_size: true
large_project_index: memory/docs/*.md
small_project_prototype: true

# Security
security_standards: memory/docs/technical.md
sanitize_inputs: true
use_https: true
avoid_hardcoded_secrets: true
integrate_vulnerability_scan: aikido

# Documentation
auto_document: true
update_readme: true
log_decisions: memory/docs/development_logs.md