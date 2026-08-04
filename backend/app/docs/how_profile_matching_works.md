# Profile Matching - Simple Testing Checklist

## What to Test

### 1. Profile Status Check
- ✅ Only show profiles that are "complete" 
- ✅ Only show profiles that are "verified"
- ✅ Don't show the user's own profile

### 2. Gender Matching
- ✅ If user wants to see men → only show men
- ✅ If user wants to see women → only show women
- ✅ Make sure the other person is also interested in the user's gender

### 3. Age Filter
- ✅ If user sets min age 25 → don't show anyone younger than 25
- ✅ If user sets max age 35 → don't show anyone older than 35

### 4. Relationship Type
- ✅ If user wants "serious relationship" → only show others who also want "serious relationship"
- ✅ Same for "casual dating", "friendship", etc.

### 5. Ethnicity
- ✅ If user selects a specific ethnicity → only show that ethnicity
- ✅ If user doesn't select anything → show all ethnicities

### 6. Distance/Location
- ✅ If user sets 50km distance → only show people within 50km
- ✅ If someone has location turned off → don't show them in distance results
- ✅ If user has location turned off → ignore distance filter

### 7. Ranking (Who Shows Up First)
People with more things in common show up first:
- ✅ Same hobbies = higher score
- ✅ Same interests = higher score
- ✅ Has the hobbies user prefers = even higher score
- ✅ Has the interests user prefers = even higher score

### 8. Result Limit
- ✅ If asked for 20 results → show maximum 20 people
- ✅ If only 5 people match → show those 5 (don't need to reach 20)

### 9. No Preferences Set
- ✅ If user hasn't set any preferences → just show complete, verified profiles with correct gender match
- ✅ Don't filter by age, distance, ethnicity, or relationship type

---

## Quick Test Scenarios

**Test 1:** User is 30-year-old male looking for women aged 25-35
- Result: Only show verified, complete women aged 25-35 who are interested in men

**Test 2:** User wants matches within 10km
- Result: Only show people within 10km who have location enabled

**Test 3:** User loves hiking and cooking
- Result: People who also love hiking and cooking appear first in the list

**Test 4:** User sets no preferences
- Result: Show any verified, complete profiles (just basic gender matching)

---

## Things That Should NEVER Happen

❌ User sees their own profile in results
❌ Incomplete profiles show up
❌ Unverified profiles show up
❌ Someone outside the age range shows up
❌ Someone outside the distance shows up
❌ A man shows up when user wants women (or vice versa)
❌ Someone who's not interested in user's gender shows up

---
