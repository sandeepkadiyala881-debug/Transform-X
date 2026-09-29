"""AI layer — architectural boundary for Phase 4 (source intelligence) and
Phase 5 (transformation engine).

Phase 2 establishes the package structure only; no AI provider is required
or configured. Future modules:

- ``source_analyzer``      — topics, entities, language, confidence (Phase 4)
- ``transformation_engine``— generates deliverables from analysed sources (Phase 5)
- ``prompt_manager``       — prompt templates per output type and configuration
- ``validation_engine``    — output validation and grounding checks
"""
