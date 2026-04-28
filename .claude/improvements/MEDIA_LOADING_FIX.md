# Media Loading Bug Fix

## Issue
When opening a conversation with media messages (images, videos, audio), the media would not load:
- Skeleton placeholder continues to show indefinitely
- Media API (`/api/media/:mediaId`) is never called
- No error message shown

## Root Cause
The IntersectionObserver callback was checking stale closure values of `mediaUrl` and `hasError`:

```tsx
// BROKEN - stale closure values
useEffect(() => {
  if (!containerRef.current || !mediaId || mediaUrl) return;

  const observer = new IntersectionObserver(
    ([entry]) => {
      // These values are captured from closure when effect ran
      // If values change, the closure still has OLD values!
      if (entry.isIntersecting && !mediaUrl && !hasError) {
        setMediaUrl(`/api/media/${mediaId}`);
      }
    },
    { threshold: 0.1 },
  );

  observer.observe(containerRef.current);
  return () => observer.disconnect();
}, [mediaId, mediaUrl, hasError]); // ❌ Dependencies cause effect to re-run
```

### Why This Failed
1. Effect depends on `mediaUrl` and `hasError`
2. IntersectionObserver callback captures these values in a closure
3. When effect re-runs (due to dependency changes), closure has stale values
4. Even if observer fires, the condition `!mediaUrl && !hasError` checks stale values
5. If mediaUrl or hasError changed between effect setup and observer firing, the callback won't work correctly

## Solution
Use a `ref` to track if we've already fetched the media, instead of relying on closure values:

```tsx
// FIXED - use ref to track fetch state
const hasTriedToFetchRef = useRef(false);

useEffect(() => {
  if (!containerRef.current || !mediaId) return;

  const observer = new IntersectionObserver(
    ([entry]) => {
      // Use ref instead of closure - always accurate
      if (entry.isIntersecting && !hasTriedToFetchRef.current) {
        hasTriedToFetchRef.current = true;
        setMediaUrl(`/api/media/${mediaId}`);
      }
    },
    { threshold: 0.1 },
  );

  observer.observe(containerRef.current);
  return () => observer.disconnect();
}, [mediaId]); // ✅ Only depend on mediaId (stable)
```

### How This Works
1. `hasTriedToFetchRef` is a mutable ref that persists across renders
2. First time observer fires with `entry.isIntersecting=true`:
   - Check: `!hasTriedToFetchRef.current` = true (haven't fetched yet)
   - Set: `hasTriedToFetchRef.current = true` (mark as fetched)
   - Call: `setMediaUrl(`/api/media/${mediaId}`)`
3. If observer fires again later:
   - Check: `!hasTriedToFetchRef.current` = false (already fetched)
   - Skip: Don't call setMediaUrl again
4. Effect only depends on `mediaId`:
   - Won't re-run due to state changes
   - No stale closure values
   - More predictable behavior

## Changes Made

### File: `client/src/components/conversations/MediaContainer.tsx`

**Added**:
```tsx
const hasTriedToFetchRef = useRef(false);
```

**Updated IntersectionObserver callback**:
- Changed condition from `!mediaUrl && !hasError` to `!hasTriedToFetchRef.current`
- Set the ref flag when fetching: `hasTriedToFetchRef.current = true`
- Added comment explaining the fix

**Updated effect dependencies**:
- Changed from `[mediaId, mediaUrl, hasError]` to `[mediaId]`
- Removed unnecessary dependencies that caused re-runs

## Testing

### Quick Test
1. Open a conversation with media messages
2. Media should load immediately (or when scrolled into view)
3. Check DevTools Network tab:
   - Should see `GET /api/media/:mediaId` requests
   - Should see image/video/audio loading
4. Skeleton should be replaced with actual media

### Expected Behavior
```
User opens conversation with image
  ↓
Skeleton placeholder appears
  ↓
User scrolls to message (or message is visible)
  ↓
IntersectionObserver fires
  ↓
setMediaUrl called with "/api/media/123"
  ↓
img src set to "/api/media/123"
  ↓
Browser fetches the image
  ↓
Image loads, onLoad fires
  ↓
Skeleton hidden, image shown ✅
```

### Before Fix (BROKEN)
```
IntersectionObserver fires
  ↓
Checks: !mediaUrl (closure value)
  ↓
Closure has stale value (checks against old mediaUrl)
  ↓
Condition fails or behaves unexpectedly
  ↓
setMediaUrl never called ❌
  ↓
Image never loads ❌
```

### After Fix (WORKING)
```
IntersectionObserver fires
  ↓
Checks: !hasTriedToFetchRef.current (always current)
  ↓
Condition is true (ref always accurate)
  ↓
setMediaUrl called
  ↓
Image loads ✅
```

## Why This Pattern Matters

### Closure Pitfalls in React Hooks
- Callbacks (like IntersectionObserver callback) capture values from the scope they're defined in
- These captured values don't update automatically
- If dependencies change, the effect re-runs and creates a NEW callback with NEW captured values
- But old callbacks with old captured values might still be active!

### Solution Patterns
1. **Use refs for mutable state that shouldn't trigger re-renders** ✅
2. **Minimize effect dependencies** ✅
3. **Don't capture state values in callbacks unless necessary** ✅
4. **Use `useCallback` if you need to pass callbacks with current state** (not used here)

## Impact

- ✅ Media now loads correctly when messages are visible
- ✅ Lazy loading works as intended
- ✅ API calls are made at the right time
- ✅ Skeleton properly transitions to actual media
- ✅ No more "media stuck on skeleton" bug

## Build Status
✅ No TypeScript errors
✅ No ESLint errors
✅ Production build successful

---

**Summary**: Fixed IntersectionObserver stale closure issue by using a `ref` to track fetch state instead of relying on closure values of `mediaUrl` and `hasError`.
