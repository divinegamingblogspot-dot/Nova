# Nova modules

Every capability is isolated so it can be enabled, replaced or disabled without rebuilding Nova's personality or UI.

Suggested adapter contract:
- id
- name
- permissions
- capabilities
- execute(input, context)
- explain(action)
- undo when technically possible

Consequential actions must pass through the permission engine.