---
name: spaced-repetition-coach
description: Expert on spaced repetition for interview prep. Explains the color-coding system (gray/orange/yellow/green), review schedules, eligibility thresholds, and the daily selection algorithm. Use when discussing problem colors, review timing, retention strategies, or how the spaced repetition system works.
---

# Spaced Repetition Coach

Expert guidance on using spaced repetition effectively for LeetCode interview preparation.

## Color-Coding System

The app uses an Anki-style color system to track problem mastery:

### Color Progression

- **Gray (New)**: Never attempted or just added
- **Orange (Learning)**: Attempted but need more practice
- **Yellow (Reviewing)**: Getting comfortable, need periodic review
- **Green (Mastered)**: Confident, can solve efficiently

### Color Transitions

**Moving Forward:**
- Gray → Orange: First successful attempt
- Orange → Yellow: Second successful attempt (after waiting period)
- Yellow → Green: Third successful attempt (after longer waiting period)

**Moving Backward (Regression):**
- If you fail to solve a problem correctly, move it back one color level
- This ensures you focus on problems you're actually struggling with

## Eligibility Thresholds

Problems become eligible for review based on color and time since last attempt:

| Color  | Threshold | Reasoning |
|--------|-----------|-----------|
| **Gray** | Always eligible | New problems always available |
| **Orange** | 3+ days | Short interval for recent learning |
| **Yellow** | 7+ days | Medium interval for consolidation |
| **Green** | 14+ days | Long interval for maintenance |

**Key Principle**: The better you know a problem, the longer you wait before reviewing it.

## Daily Selection Algorithm

The system creates a balanced daily practice set using these ratios:

### Selection Ratios

For a typical 5-problem daily session:

- **50% New (Gray)**: 2-3 problems
  - Keeps you learning new patterns
  - Expands your problem repertoire

- **40% Review (Orange/Yellow)**: 2 problems
  - Reinforces recent learning
  - Prevents forgetting

- **10% Mastered (Green)**: 0-1 problem
  - Maintains long-term retention
  - Keeps skills sharp

### Example Daily Selection (5 problems)

```
Day 1:
- 2 Gray (new)
- 2 Orange (review from 3+ days ago)
- 1 Yellow (review from 7+ days ago)

Day 15:
- 3 Gray (new)
- 1 Orange (review)
- 1 Green (maintenance from 14+ days ago)
```

## Optimization Strategies

### When You Have Limited Time

**3 problems/day (minimum effective dose):**
- 2 Gray (new)
- 1 Orange/Yellow (review)

**5 problems/day (recommended):**
- 3 Gray (new)
- 2 Orange/Yellow (review)

**7+ problems/day (intensive prep):**
- 3-4 Gray (new)
- 2-3 Orange/Yellow (review)
- 1 Green (maintenance)

### When You're Behind on Reviews

If you have many eligible reviews piling up:

1. **Prioritize older reviews**: Problems waiting longest get selected first
2. **Increase daily problem count**: Temporarily do 7-10 problems/day
3. **Be honest with colors**: If you can't solve it, mark it appropriately

### When You're Running Out of New Problems

1. **Import more problems**: Add problems from specific companies or topics
2. **Focus on reviews**: Increase review ratio temporarily (30% new, 70% review)
3. **Reset old greens**: Move ancient green problems back to yellow for refresh

## How Colors Should Be Assigned

Be honest and strict with yourself:

### Gray → Orange
- You solved it with the right approach
- May have needed hints on implementation details
- Understood the solution when complete

### Orange → Yellow
- Solved independently without hints
- Identified the correct pattern
- May have been slower than optimal

### Yellow → Green
- Solved efficiently in reasonable time
- Optimal time/space complexity
- Can explain the solution clearly
- Would be confident solving in an interview

### Regression (Move Back)
- Couldn't remember the approach
- Needed to look up the solution
- Got the wrong pattern entirely
- Took much longer than expected

## Advanced Techniques

### Pattern-Based Learning

Group problems by pattern and learn them together:
- All sliding window problems in a week
- Then all DP problems the next week
- This reinforces pattern recognition

### Interleaving

Mix different patterns in daily practice:
- Better for long-term retention
- Improves pattern recognition
- Mirrors real interview conditions

### Deliberate Difficulty

If a color feels too easy:
- Challenge yourself with harder variants
- Set time limits (20-30 minutes)
- Explain solution without code first

## Common Mistakes to Avoid

### 1. Moving Colors Too Quickly
- Don't mark something green just because you solved it once
- Wait the full intervals between attempts
- Be honest about your confidence level

### 2. Ignoring Reviews
- Don't skip review problems to do only new ones
- Reviews are critical for retention
- Balance is key

### 3. Gaming the System
- Don't look up solutions and mark as complete
- This defeats the purpose of spaced repetition
- You'll struggle in actual interviews

### 4. Not Adapting the Schedule
- Adjust daily problem count based on available time
- Scale ratios if you're short on new problems
- Increase reviews before interviews

## Measuring Progress

### Healthy Metrics

- **Green percentage increasing**: More problems mastered over time
- **Review success rate high**: 80%+ of reviews completed without regression
- **Pattern recognition improving**: Identifying patterns faster
- **Time per problem decreasing**: Getting more efficient

### Warning Signs

- **Too many eligible reviews**: You're adding problems too fast
- **Frequent regressions**: Need to wait longer between attempts
- **Everything is gray/orange**: Not enough consistent practice
- **Everything is green**: May need harder problems or be marking too generously

## Integration with Interview Prep Timeline

### 3 Months Before Interview
- Focus on new problems (60% new, 40% review)
- Build broad pattern knowledge
- Daily quota: 5-7 problems

### 1 Month Before Interview
- Balanced approach (50% new, 50% review)
- Solidify weak patterns
- Daily quota: 5-7 problems

### 2 Weeks Before Interview
- Review-heavy (30% new, 70% review)
- Focus on company-specific patterns
- Daily quota: 5-10 problems

### 1 Week Before Interview
- Maintenance mode (20% new, 80% review)
- Focus on greens and yellows
- Keep skills sharp
- Daily quota: 3-5 problems

## Tips for Maximum Effectiveness

1. **Consistency > Intensity**: Better to do 3 problems daily than 20 problems once a week
2. **Track patterns**: Notice which patterns you struggle with
3. **Time yourself**: Simulate interview pressure
4. **Write clean code**: Practice interview-quality code, not just working code
5. **Explain out loud**: Practice verbalizing your approach
6. **Review mistakes**: Spend time understanding why you got stuck

## The Science Behind It

Spaced repetition leverages:
- **Spacing Effect**: Information is better retained when study sessions are spaced out
- **Testing Effect**: Active recall strengthens memory more than passive review
- **Desirable Difficulty**: Slightly challenging reviews optimize learning

The goal is to review each problem just before you would forget it - maximizing retention while minimizing review time.
