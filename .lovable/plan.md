

## Problem

The sidebar has two logout buttons:
1. A Tailwind-styled "Sign Out" button (lines 227-236) — hidden behind the auth buttons
2. A red absolute-positioned "Logout" button (line 238) — hidden behind the footer content

Both are invisible because the footer section's content covers them.

## Plan

**File: `src/components/layout/AppSidebar.tsx`**

1. **Remove the duplicate styled "Sign Out" button** (lines 227-236) — keep only the red absolute-positioned one as requested
2. **Fix the red Logout button visibility** by increasing its `z-index` so it renders above all other sidebar content. Change from `bottom: 20px` to `bottom: 8px` and add `zIndex: 50` to ensure it's always visible
3. **Add bottom padding** to the footer `<div>` (line 183) so the "Sign In / Get Started" buttons don't overlap the red Logout button — add `pb-12` to the footer container

### Result
- One single red "Logout" button always visible at bottom-left of sidebar
- No overlap with auth buttons or user info
- Hard redirect to `/login` on click — no routing logic

