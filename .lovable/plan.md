

# Integration Plan: Port Uploaded Base44 Files

## Summary

The uploaded files bring significant new features that the current project lacks. Several existing pages use mock/placeholder data that should be replaced with real database queries. Here is what needs to change, grouped by priority.

## What Already Works (No Changes)
- Auth system, ProtectedRoute, AuthContext
- BreathePage (wired to Supabase)
- AdminPage (CRUD for tracks, courses, mastery classes, prompts)
- LibraryPage (already wired to real data)
- Stripe integration

## Database Migrations Needed

### New Tables
1. **`courses_v2`** — For the module-based course experience (title, description, cover_image_url, course_type, modules JSON, is_premium, is_published, order_index)
2. **`lessons`** — Individual lessons within CourseV2 (title, description, course_id FK, media_url, written_content, downloadable_files JSON, duration_minutes, is_free_preview, order_index)
3. **`lesson_progress`** — Track per-lesson completion (user_id, course_id, lesson_id, completed, completed_date)
4. **`mastery_class_responses`** — Save mastery class journaling responses (user_id, mastery_class_id, mastery_class_title, mastery_class_theme, date, responses JSON)

### Table Modifications
- **`tracks`** — Add `lock_type` (text, default 'none'), `lock_days` (integer, default 0), `order_in_course` (integer, default 0) columns for course track locking
- **`mastery_classes`** — Add `pause_prompts` (jsonb), `theme` (text), `cover_image_url` (text) columns for the interactive mastery player
- **`courses`** — Add `category` (text), `cover_image_url` (text), `estimated_weeks` (integer), `tags` (jsonb) columns

### RLS Policies
- All new tables get standard RLS: authenticated users can read all, write their own rows (for progress/responses). Admins can manage courses_v2 and lessons.

## File Changes

### 1. Wire PlayerPage to Real Data
**File:** `src/pages/PlayerPage.tsx`
- Remove MOCK_TRACKS
- Fetch track from `tracks` table by `trackId` query param
- Fetch actual audio from `track.audio_url`, use `<audio>` element
- On completion, save to `user_progress` table
- Keep existing UI/animation style

### 2. Wire MasteryPlayerPage to Real Data
**File:** `src/pages/MasteryPlayerPage.tsx`
- Remove MOCK_CLASSES
- Fetch mastery class from `mastery_classes` table by `id` query param
- Play actual audio from `mastery_class.audio_url`
- Port pause prompt system from MasteryClassPlayer.jsx: mid-audio prompts pause playback, show textarea, resume on continue
- Post-completion prompts appear after audio ends
- Save responses to new `mastery_class_responses` table
- Premium gating: show upgrade CTA if premium and user not subscribed

### 3. Wire CourseDetailPage to Real Data
**File:** `src/pages/CourseDetailPage.tsx`
- Remove MOCK_COURSES
- Fetch course from `courses` table by `:id` route param
- Fetch tracks for that course from `tracks` table filtered by `course_id`
- Fetch user progress to show completion state
- Port track locking logic (sequential: must complete previous; timed: unlocks after X days)
- Premium gating with upgrade CTA
- Keep existing Velum card styling but use real data

### 4. Replace CoursesPage with Real Data
**File:** `src/pages/CoursesPage.tsx`
- Remove hardcoded COURSES array
- Fetch from `courses` table + `courses_v2` table
- Split into free/premium sections
- Add search functionality
- Show real progress per course
- Add CourseV2 cards linking to course experience page

### 5. New: CourseExperiencePage
**File:** `src/pages/CourseExperiencePage.tsx` (new)
- Port CourseExperience.jsx as a new page
- Module-based sidebar with expandable sections
- Lesson viewer supporting audio, video, and written content
- Mark complete functionality saving to `lesson_progress` table
- Previous/Next navigation between lessons
- Progress bar in top bar
- PaywallModal for premium-gated lessons
- Route: `/course-v2?courseId=X`

### 6. New: HomeScreenSetupPage
**File:** `src/pages/HomeScreenSetupPage.tsx` (new)
- Port HomeScreenSetup.jsx with iOS/Android PWA instructions
- Device selection, numbered steps, skip option
- Route: `/home-setup`

### 7. Enhance HomePage
**File:** `src/pages/HomePage.tsx`
- Add "Continue Your Journey" section (shows next uncompleted track)
- Add "Quick Reset" shortcut (shortest breathwork track)
- Add featured courses section with links to course detail
- Fetch courses for the featured section
- Keep everything else already working

### 8. Enhance JournalPage
**File:** `src/pages/JournalPage.tsx`
- Add filter tabs: All, Daily Reflections, Guided Exercises, MasteryClasses
- Merge entries from `daily_reflections`, completed journaling tracks from `user_progress`, and `mastery_class_responses`
- Add stats header: entry count, word count, exercise count
- Add guided journaling exercises section at bottom (tracks with category "journaling")
- Expandable entry cards with different styling per type

### 9. Update App.tsx Routes
- Add `/course-v2` route for CourseExperiencePage
- Add `/home-setup` route for HomeScreenSetupPage
- Add both to HIDDEN_NAV_PATHS in AppLayout

### 10. Admin Panel Updates
**File:** `src/pages/AdminPage.tsx`
- Add CourseV2 management tab (create/edit courses with modules)
- Add Lessons management within CourseV2
- Add pause_prompts editor for mastery classes
- Add lock_type editor for tracks within courses

## Execution Order
1. Database migration (new tables + column additions)
2. PlayerPage + MasteryPlayerPage (wire to real data)
3. CourseDetailPage + CoursesPage (wire to real data)
4. CourseExperiencePage (new page)
5. HomeScreenSetupPage (new page)
6. HomePage enhancements
7. JournalPage enhancements
8. Route updates
9. Admin panel updates

