# Testing Guide - Media Loading & Scroll Fix

## Quick Testing Checklist

Use this guide to verify all fixes are working correctly.

---

## Test 1: Scroll Position on Initial Load ✅

### Test Case 1.1: Text Messages Only
**Steps**:
1. Open a conversation with only text messages (10+ messages)
2. Verify scroll is at the BOTTOM
3. Last message should be fully visible
4. No need to manually scroll ✅

**Expected**: Bottom message visible immediately

### Test Case 1.2: Messages with Images
**Steps**:
1. Open a conversation with 5+ images
2. Observe: Skeleton blocks appear (should show aspect-ratio)
3. Images start loading from WhatsApp API
4. Verify scroll STAYS AT BOTTOM as images load
5. No scroll jumping up ✅

**Expected**: All messages visible at bottom, skeletons replaced smoothly

### Test Case 1.3: Messages with Video
**Steps**:
1. Open a conversation with video messages
2. Video skeleton appears (16:9 aspect ratio)
3. Video loads
4. Scroll stays at bottom ✅

**Expected**: Video in correct position, scroll stable

### Test Case 1.4: Messages with Audio
**Steps**:
1. Open a conversation with audio messages
2. Audio skeleton appears (40px height)
3. Audio loads, player visible
4. Scroll stays at bottom ✅

**Expected**: Audio controls visible, scroll correct

### Test Case 1.5: Mixed Media Types
**Steps**:
1. Open a conversation with images, videos, audio, documents
2. Observe all skeletons appear with correct dimensions
3. All media loads asynchronously
4. Scroll position never changes ✅

**Expected**: All media types load correctly, scroll stable

---

## Test 2: Category Tab Updates (Real-Time) ✅

### Test Case 2.1: Customer Message → Chat to Requesting
**Setup**: Have a conversation in the "Chat" tab

**Steps**:
1. Open the app, keep "Chat" tab selected
2. Have a customer send a message in WhatsApp
3. Watch the conversation in real-time
4. Verify it IMMEDIATELY moves to "Requesting" tab
5. NO page refresh needed ✅

**Expected**: 
- Conversation disappears from "Chat" tab
- Appears in "Requesting" tab
- Tab counts update automatically

### Test Case 2.2: Your Reply → Requesting to Intervened
**Setup**: Have a conversation in the "Requesting" tab

**Steps**:
1. Open the app, keep "Requesting" tab selected
2. Select a conversation
3. Send a reply message
4. Verify conversation IMMEDIATELY moves to "Intervened" tab
5. NO page refresh needed ✅

**Expected**:
- Conversation disappears from "Requesting" tab
- Appears in "Intervened" tab

### Test Case 2.3: 24-Hour Window Close → Intervened to Chat
**Setup**: Have a conversation in "Intervened" tab where 24 hours passed

**Steps**:
1. Wait for 24-hour window to close on a conversation
2. When window closes, conversation should move to "Chat" tab
3. NO page refresh needed ✅

**Expected**:
- Conversation moves from "Intervened" to "Chat"
- Updates in real-time

### Test Case 2.4: Multiple Conversations Switching Tabs
**Setup**: Multiple conversations in different tabs

**Steps**:
1. Keep app open with multiple conversations visible
2. Receive messages in customer WhatsApp
3. Watch multiple conversations move tabs simultaneously
4. All updates happen in real-time ✅

**Expected**:
- All conversations update correctly
- Tab counts change dynamically

---

## Test 3: Lazy Loading (Media Only Loads When Visible) ✅

### Test Case 3.1: Scroll Down to Load Media
**Steps**:
1. Open a conversation with 20+ images
2. Observe: Only visible images have their src set
3. Scroll down slowly
4. Images enter viewport → IntersectionObserver fires → Images load
5. No images loaded until scrolled to ✅

**Expected**:
- Top images: Just skeleton (no media fetch)
- Visible images: Load on scroll
- Bottom images: Not loaded until scrolled to

### Test Case 3.2: Scroll Up to Use Cached Media
**Steps**:
1. Scroll down through images (they load)
2. Scroll back up to top
3. Verify images are instant (from cache) ✅

**Expected**:
- Images show instantly when scrolling back (browser cache)
- No re-fetching

### Test Case 3.3: Long Conversation Performance
**Steps**:
1. Open a conversation with 50+ messages including images
2. Verify initial load is fast (only nearby images load)
3. Scroll smoothly through conversation
4. No lag or jank ✅

**Expected**:
- Initial load: < 2 seconds
- Scrolling: Smooth, no freezing

---

## Test 4: Loading States ✅

### Test Case 4.1: Skeleton Display
**Steps**:
1. Open a conversation with images
2. For a brief moment (before images load), observe skeletons
3. Skeletons should match final image size ✅

**Expected**:
- Skeleton appears: aspect-ratio placeholder
- No layout shift when replaced with actual image

### Test Case 4.2: Error Handling
**Steps**:
1. Manually test error state:
   - Modify a mediaId to invalid value
   - Open conversation
2. Verify error placeholder appears:
   - "Image unavailable" / "Video unavailable" message
   - Red alert icon ✅

**Expected**:
- Clear error message instead of broken image
- No broken image icon

### Test Case 4.3: Timeout Handling
**Steps**:
1. Slow down network (DevTools Network tab → Slow 3G)
2. Open a conversation with images
3. Images take time to load
4. Skeleton shows for extended period ✅

**Expected**:
- Skeleton visible while loading
- Smooth transition when image appears
- No timeout errors

---

## Test 5: Responsive Design ✅

### Test Case 5.1: Mobile View (iPhone SE - 375px)
**Steps**:
1. Resize browser to 375px width
2. Open conversation with images
3. Images should be narrow but still visible
4. Scroll works smoothly ✅

**Expected**:
- Images: max-w-[280px] (fits on screen)
- Text readable
- Scroll works

### Test Case 5.2: Tablet View (iPad - 768px)
**Steps**:
1. Resize browser to 768px width
2. Open conversation with images
3. Images use `sm:max-w-xs` (slightly larger)
4. Scroll works ✅

**Expected**:
- Images larger than mobile but responsive
- Still fits on screen

### Test Case 5.3: Desktop View (1920px)
**Steps**:
1. Full browser width
2. Open conversation with images
3. Images max at 280px (don't get too large)
4. Sidebar and chat area visible ✅

**Expected**:
- Images capped at reasonable size
- Layout balanced

---

## Test 6: Media Type Specific ✅

### Test Case 6.1: Image
**Steps**:
1. Open conversation with image
2. Verify:
   - Aspect ratio 4:3
   - Skeleton shows before image loads
   - Click to view in lightbox
   - Caption shows below image ✅

**Expected**:
- Image displays correctly
- Lightbox opens on click
- Caption visible

### Test Case 6.2: Video
**Steps**:
1. Open conversation with video
2. Verify:
   - Aspect ratio 16:9
   - Skeleton shows before video loads
   - Play button overlay visible
   - Click to play in lightbox ✅

**Expected**:
- Video thumbnail/frame visible
- Lightbox plays video on click
- Controls work

### Test Case 6.3: Audio
**Steps**:
1. Open conversation with audio
2. Verify:
   - Audio controls visible (play, pause, timeline)
   - Skeleton shows before audio loads
   - Can play/pause ✅

**Expected**:
- Audio player works
- Can control playback
- No layout shift

### Test Case 6.4: Document
**Steps**:
1. Open conversation with document (PDF)
2. Verify:
   - Document link visible
   - Icon + filename shown
   - Click opens in new tab
   - Can download ✅

**Expected**:
- Document accessible
- Can open/download

---

## Test 7: Edge Cases ✅

### Test Case 7.1: No Media
**Steps**:
1. Text-only conversation
2. No skeletons should appear
3. Scroll to bottom ✅

**Expected**:
- Normal text message rendering
- No media loading

### Test Case 7.2: Mixed Content
**Steps**:
1. Message with text + image + caption
2. Verify all parts render correctly
3. Scroll position correct ✅

**Expected**:
- Text shows
- Image shows
- Caption shows below

### Test Case 7.3: Rapid Scrolling
**Steps**:
1. Scroll very quickly through conversation
2. Multiple images loading simultaneously
3. No errors or layout shifts ✅

**Expected**:
- All images load in parallel
- Smooth scrolling
- No flicker

### Test Case 7.4: Many Images (20+)
**Steps**:
1. Scroll through conversation with 20+ images
2. Verify lazy loading works
3. Only ~3-4 images loaded at once ✅

**Expected**:
- Efficient memory usage
- Smooth performance
- Not all images loaded

---

## Test 8: Browser DevTools Verification ✅

### Test Case 8.1: Network Tab
**Steps**:
1. Open DevTools → Network tab
2. Open conversation with images
3. Observe: Images NOT in initial request
4. Scroll down → Images fetch on scroll ✅

**Expected**:
- No initial media requests
- Media requests start when image comes into view

### Test Case 8.2: React DevTools
**Steps**:
1. Open React DevTools
2. Select MediaContainer component
3. Verify:
   - `isLoading` state changes true → false
   - `mediaUrl` populated on scroll
   - `hasError` false (unless error) ✅

**Expected**:
- State changes visible
- Props flowing correctly

### Test Case 8.3: Redux DevTools
**Steps**:
1. Open Redux DevTools
2. Send/receive message while conversation open
3. Watch `conversationUpdated` action
4. Verify `category` is correct in payload ✅

**Expected**:
- Action contains category
- Category matches expected value

---

## Performance Metrics (Optional)

### Metrics to Track
- **Initial Load Time**: < 2 seconds (with lazy loading)
- **Scroll Frame Rate**: 60 FPS (no jank)
- **Memory Usage**: Should not grow unbounded
- **Network**: Fewer requests (lazy loading saves bandwidth)

### How to Measure
```javascript
// In browser console:
// Measure scroll performance
performance.mark('scroll-start');
// Scroll...
performance.mark('scroll-end');
performance.measure('scroll', 'scroll-start', 'scroll-end');
console.log(performance.getEntriesByName('scroll')[0]);
```

---

## Sign-Off Checklist

- [ ] Test 1: Scroll position correct on load
- [ ] Test 2: Category tabs update in real-time
- [ ] Test 3: Lazy loading works (media only loads on scroll)
- [ ] Test 4: Loading states show correctly
- [ ] Test 5: Responsive on mobile, tablet, desktop
- [ ] Test 6: All media types work (image, video, audio, document)
- [ ] Test 7: Edge cases handled
- [ ] Test 8: DevTools show expected behavior
- [ ] Performance: No noticeable slowdowns

---

## Troubleshooting

### Images still scrolling up
- Check: Is MediaContainer rendering with lazy load?
- Check: Are images in viewport before loading?
- Try: Hard refresh browser (Cmd+Shift+R)

### Category not updating
- Check: Redux DevTools shows `conversationUpdated` action?
- Check: Payload includes `category` field?
- Try: Close and reopen conversation

### Skeleton not showing
- Check: Browser DevTools → Elements tab → Is skeleton in DOM?
- Check: CSS aspect-ratio property applied?
- Try: Check console for errors

### Scroll position off
- Check: Is container height calculated correctly?
- Check: Are all elements rendered before scroll?
- Try: Add small delay to scroll (100ms setTimeout)

---

**Remember**: Test on real device and slow network to catch issues! 📱🌐
