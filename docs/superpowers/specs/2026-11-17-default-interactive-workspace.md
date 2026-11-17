# Default interactive workspace

The production main URL opens the same client-local interactive workspace previously reached with `?demo=1`. Existing UI copy and layout stay as designed. A fresh visitor can start a personal VM without an unexpected expired-session dialog. The explicit `?demo=fixture` view remains available for design fixtures. Client-local resource records continue to persist in browser storage, and existing VM quota rules remain unchanged.

The production login and role-selection pages still work when visited directly; a signed-out profile remains signed out until the user signs in. The backend API code remains available for later integration but is not used for the default interactive workspace.
