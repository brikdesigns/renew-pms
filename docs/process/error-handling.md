# Error Handling: Fail Loud, Never Fake

PREFER a visible failure over a silent fallback. Priority order: works correctly → falls back visibly (banner/toast/log) → fails with a clear message. Never silently degrade to look "fine".

## Banned patterns (new code)

```ts
// ❌ Empty catch — errors vanish
try { ... } catch (e) {}
try { ... } catch { /* ignore */ }

// ❌ Swallowed promise — fire-and-forget failure
somePromise.catch(() => {})
somePromise.catch(() => null)

// ❌ Silent null return — caller has no idea why
if (!data) return null;

// ❌ Catch that fakes success — caller thinks it worked
try { ... } catch (e) { return defaultValue; }
```

## Required patterns (new code)

```ts
// ✅ Catch that surfaces the error
try { ... } catch (e) {
  console.error('[context] what failed:', e);
  throw e; // or return an error type the caller handles
}

// ✅ Fallback that discloses degraded state
if (!data) {
  console.warn('[ComponentName] data unavailable, showing fallback');
  return <ErrorState message="Could not load X" />;
}

// ✅ Null check that explains itself
if (!user) throw new Error('Expected authenticated user — missing session');
```

## Type safety rules (new code)

- **Minimize `as` assertions.** Use type guards, Zod parsing, or narrow with `if` checks. `as` is acceptable for Supabase query results where the type is known but the SDK types are loose.
- **No non-null assertions (`!`)** unless the value was just null-checked in the preceding line.
- **Optional chaining (`?.`)** is fine for 1–2 levels. Three or more levels signals a data shape problem — destructure and validate at the boundary instead.

## Existing code

These rules apply to new and modified code. Do not refactor existing files solely to fix these patterns — address them when you're already editing the file for another reason.
