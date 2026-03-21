Mastery Class and Daily Journaling architecture decisions.

## Mastery Class Journaling
- Prompts appear BELOW the player at their timestamp — audio NEVER auto-pauses
- Prompts animate in with framer-motion when timestamp is reached
- Journaling is entirely optional — save button requires at least one response
- Saved to mastery_class_responses table with prompt_text + response arrays

## Daily Journaling (JournalPage)
- Daily prompt from journaling_prompts table (rotated by day of year)
- Saves to daily_reflections table
- Past entries: filterable by all/reflection/exercise/mastery
- Reverse chronological, expandable accordion entries

## Access Model
- No "premium" language anywhere in the UI
- Users are either: on a trial, a paying member, or do not have access
- Internal code uses is_premium DB columns and /premium route — that's fine
- All user-facing copy uses "Subscribe", "Full Access", "Begin My Journey"
