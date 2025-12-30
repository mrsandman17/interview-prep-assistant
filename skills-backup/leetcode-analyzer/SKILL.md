---
name: leetcode-analyzer
description: Analyzes LeetCode problems for interview prep, identifies problem patterns (arrays, strings, trees, graphs, DP, greedy, sliding window, two pointers, etc.), discusses time/space complexity analysis, and suggests similar problems. Use when discussing problem-solving approaches, learning algorithm patterns, or when the user mentions LeetCode problems, interview preparation, or coding challenges.
---

# LeetCode Problem Analyzer

Expert guidance for analyzing and solving LeetCode problems effectively.

## Core Analysis Framework
/com
When analyzing any LeetCode problem, follow this systematic approach:

### 1. Pattern Recognition

Identify the problem category:

- **Array/String**: Two pointers, sliding window, prefix sums
- **Trees**: DFS, BFS, traversals, lowest common ancestor
- **Graphs**: DFS, BFS, shortest path, topological sort, union-find
- **Dynamic Programming**: Memoization, tabulation, state transitions
- **Greedy**: Locally optimal choices leading to global optimum
- **Sorting/Searching**: Binary search, quickselect, merge operations
- **Hash Tables**: Frequency counting, lookups, caching
- **Stacks/Queues**: Monotonic stacks, deques, simulation
- **Linked Lists**: Fast/slow pointers, reversal, dummy nodes
- **Backtracking**: Generate permutations, combinations, subsets

### 2. Complexity Analysis

Always provide:

- **Time Complexity**: Big O notation with explanation
  - Example: "O(n log n) due to sorting the array"
- **Space Complexity**: Include auxiliary space
  - Example: "O(n) for the hash map storing frequencies"

Common complexities to recognize:
- O(1): Hash table lookups, array access
- O(log n): Binary search, balanced tree operations
- O(n): Single pass through data
- O(n log n): Efficient sorting
- O(n²): Nested loops, comparing all pairs
- O(2^n): Recursive solutions with branching

### 3. Key Insights

Identify the core concept that makes the solution efficient:

- "Use a hash map to achieve O(1) lookups instead of O(n) searching"
- "Monotonic stack maintains elements in sorted order for O(n) solution"
- "Two pointers eliminate need for nested loops"
- "Greedy choice: always pick the earliest ending meeting"

### 4. Common Pitfalls

Warn about typical mistakes:

- **Off-by-one errors**: Array boundaries, loop conditions
- **Edge cases**: Empty input, single element, duplicates
- **Integer overflow**: Very large numbers in calculations
- **Modifying while iterating**: Concurrent modification issues
- **Not handling negatives**: When problem allows negative numbers
- **Forgetting base cases**: In recursive solutions

### 5. Similar Problems

Reference related problems that use the same pattern or technique:

- "Similar to LeetCode 3 (Longest Substring Without Repeating Characters)"
- "Uses same sliding window technique as problems 76, 209, 438"
- "Related DP problems: 70, 198, 213"

## Interview Communication Strategy

Guide users on how to approach problems in interviews:

1. **Clarify Assumptions**
   - Ask about input constraints (size, range, duplicates allowed?)
   - Confirm expected output format
   - Verify edge cases to handle

2. **Discuss Approach Before Coding**
   - Start with brute force: "The naive solution would be..."
   - Identify inefficiencies: "The bottleneck is..."
   - Propose optimization: "We can improve this by..."

3. **Explain Tradeoffs**
   - "This uses more space (O(n)) but reduces time from O(n²) to O(n)"
   - "We could cache results but it depends on memory constraints"

4. **Think Out Loud**
   - Verbalize your thought process
   - Explain why you're choosing certain data structures
   - Mention what you're considering and rejecting

5. **Test Thoroughly**
   - Walk through examples
   - Test edge cases
   - Verify complexity claims

## Pattern-Specific Guidance

### Sliding Window
**When to use**: Contiguous subarray/substring problems
**Template**: Expand window with right pointer, contract with left
**Examples**: Max sum subarray of size k, longest substring without repeats

### Two Pointers
**When to use**: Sorted arrays, palindromes, pair finding
**Template**: Start/end pointers moving toward each other, or slow/fast pointers
**Examples**: Two sum (sorted), container with most water, remove duplicates

### Dynamic Programming
**When to use**: Optimal substructure + overlapping subproblems
**Template**: Define state, recurrence relation, base cases, order
**Examples**: Climbing stairs, house robber, coin change

### Binary Search
**When to use**: Sorted data, finding boundaries, minimize/maximize problems
**Template**: while (left <= right), check mid, adjust boundaries
**Examples**: Search insert position, find peak element, capacity to ship packages

### DFS/BFS
**When to use**: Tree/graph traversal, connected components, shortest paths
**DFS**: Stack (recursion), explore deeply first
**BFS**: Queue, explore level by level, finds shortest unweighted paths
**Examples**: Number of islands, word ladder, course schedule

## Examples in Action

**Problem**: "Find longest substring without repeating characters"

**Analysis**:
- Pattern: Sliding window on string
- Time: O(n) - single pass with two pointers
- Space: O(min(n, m)) where m is alphabet size - hash set stores unique chars
- Key Insight: Use hash set + sliding window; expand right, contract left when duplicate found
- Pitfall: Remember to update max length before removing from set
- Similar: LeetCode 3, 76, 209, 438

**Problem**: "Binary tree maximum path sum"

**Analysis**:
- Pattern: Tree DFS with global variable
- Time: O(n) - visit each node once
- Space: O(h) - recursion stack height
- Key Insight: At each node, calculate max path through that node; update global max
- Pitfall: Don't include negative subtree sums; return only one branch to parent
- Similar: LeetCode 124, 543, 687

## Optimization Checklist

When reviewing a solution:

- [ ] Can we eliminate nested loops with hash table?
- [ ] Is there a greedy choice that works?
- [ ] Can we use sorting to simplify the problem?
- [ ] Would binary search apply here?
- [ ] Can we precompute/cache results (DP)?
- [ ] Is there a two-pointer approach?
- [ ] Would a different data structure be more efficient?

## Color-Coding Suggestions

For the spaced repetition system:

- **Gray → Orange**: Solved with help, need to retry independently
- **Orange → Yellow**: Solved independently but slowly or with hints
- **Yellow → Green**: Solved efficiently with optimal solution
- **Regression**: If you can't solve it again, move back a color

Always prioritize understanding over memorization. Focus on recognizing patterns.