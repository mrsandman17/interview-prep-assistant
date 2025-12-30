---
name: algorithm-pattern-reference
description: Quick reference guide for common algorithm patterns including two pointers, sliding window, binary search, DFS, BFS, dynamic programming, greedy algorithms, and more. Use when identifying patterns, learning templates, or looking up specific algorithmic techniques.
---

# Algorithm Pattern Reference

Quick reference for common coding patterns and their templates.

## Array & String Patterns

### Two Pointers

**When to use:**
- Sorted arrays
- Finding pairs or triplets
- Palindrome checks
- Removing duplicates
- Partitioning arrays

**Template (opposite ends):**
```python
def two_pointers_opposite(arr):
    left, right = 0, len(arr) - 1

    while left < right:
        # Process current pair
        if condition(arr[left], arr[right]):
            # Found solution
            return result
        elif some_check:
            left += 1
        else:
            right -= 1

    return default
```

**Template (same direction):**
```python
def two_pointers_same(arr):
    slow = 0

    for fast in range(len(arr)):
        if condition(arr[fast]):
            arr[slow] = arr[fast]
            slow += 1

    return slow  # or arr[:slow]
```

**Examples:**
- Two Sum II (sorted array)
- Container With Most Water
- Remove Duplicates from Sorted Array
- Valid Palindrome

**Time**: O(n)
**Space**: O(1)

---

### Sliding Window

**When to use:**
- Contiguous subarray/substring problems
- Maximum/minimum of subarrays of size K
- Longest substring with constraint
- Finding all anagrams

**Template (fixed size):**
```python
def sliding_window_fixed(arr, k):
    window_sum = sum(arr[:k])
    max_sum = window_sum

    for i in range(k, len(arr)):
        # Slide window: remove left, add right
        window_sum = window_sum - arr[i - k] + arr[i]
        max_sum = max(max_sum, window_sum)

    return max_sum
```

**Template (variable size):**
```python
def sliding_window_variable(arr):
    left = 0
    result = 0
    window = {}  # or set, or counter

    for right in range(len(arr)):
        # Expand window
        window[arr[right]] = window.get(arr[right], 0) + 1

        # Contract window while invalid
        while not is_valid(window):
            window[arr[left]] -= 1
            if window[arr[left]] == 0:
                del window[arr[left]]
            left += 1

        # Update result
        result = max(result, right - left + 1)

    return result
```

**Examples:**
- Maximum Sum Subarray of Size K
- Longest Substring Without Repeating Characters
- Minimum Window Substring
- Find All Anagrams in a String

**Time**: O(n)
**Space**: O(k) where k is window size or alphabet size

---

### Prefix Sum

**When to use:**
- Range sum queries
- Subarray sum equals K
- Continuous subarrays

**Template:**
```python
def prefix_sum(arr):
    prefix = [0]

    for num in arr:
        prefix.append(prefix[-1] + num)

    # Range sum from i to j (inclusive)
    # sum = prefix[j + 1] - prefix[i]

    return prefix

# With hash map for subarray sum
def subarray_sum(arr, target):
    prefix_sum = 0
    sum_count = {0: 1}  # sum -> frequency
    result = 0

    for num in arr:
        prefix_sum += num

        # Check if (prefix_sum - target) exists
        if prefix_sum - target in sum_count:
            result += sum_count[prefix_sum - target]

        sum_count[prefix_sum] = sum_count.get(prefix_sum, 0) + 1

    return result
```

**Examples:**
- Range Sum Query
- Subarray Sum Equals K
- Contiguous Array

**Time**: O(n) for building, O(1) for query
**Space**: O(n)

---

## Search Patterns

### Binary Search

**When to use:**
- Sorted arrays
- Finding boundaries
- Minimizing/maximizing with condition
- Search in rotated sorted array

**Template (find exact):**
```python
def binary_search(arr, target):
    left, right = 0, len(arr) - 1

    while left <= right:
        mid = left + (right - left) // 2

        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1

    return -1  # not found
```

**Template (find boundary):**
```python
def find_first(arr, target):
    left, right = 0, len(arr) - 1
    result = -1

    while left <= right:
        mid = left + (right - left) // 2

        if arr[mid] == target:
            result = mid
            right = mid - 1  # keep searching left
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1

    return result

def find_last(arr, target):
    left, right = 0, len(arr) - 1
    result = -1

    while left <= right:
        mid = left + (right - left) // 2

        if arr[mid] == target:
            result = mid
            left = mid + 1  # keep searching right
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1

    return result
```

**Template (minimize/maximize):**
```python
def minimize_max(arr, condition):
    left, right = min(arr), max(arr)

    while left < right:
        mid = left + (right - left) // 2

        if is_feasible(arr, mid):
            right = mid  # try smaller
        else:
            left = mid + 1

    return left
```

**Examples:**
- Binary Search
- Find First and Last Position
- Search in Rotated Sorted Array
- Capacity To Ship Packages Within D Days

**Time**: O(log n)
**Space**: O(1)

---

## Tree Patterns

### DFS (Depth-First Search)

**When to use:**
- Tree traversal (preorder, inorder, postorder)
- Path finding
- Tree depth/height
- Validate BST

**Template (recursive):**
```python
def dfs_recursive(root):
    if not root:
        return base_case

    # Preorder: process current, then children
    result = process(root.val)
    left = dfs_recursive(root.left)
    right = dfs_recursive(root.right)

    # Postorder: process children, then current
    return combine(result, left, right)

# With helper for global state
def dfs_with_state(root):
    result = []

    def dfs(node, state):
        if not node:
            return

        # Update state
        state.append(node.val)

        # Leaf node check
        if not node.left and not node.right:
            result.append(state[:])

        dfs(node.left, state)
        dfs(node.right, state)

        # Backtrack
        state.pop()

    dfs(root, [])
    return result
```

**Template (iterative):**
```python
def dfs_iterative(root):
    if not root:
        return []

    stack = [root]
    result = []

    while stack:
        node = stack.pop()
        result.append(node.val)

        # Push right first so left is processed first
        if node.right:
            stack.append(node.right)
        if node.left:
            stack.append(node.left)

    return result
```

**Examples:**
- Binary Tree Paths
- Maximum Depth of Binary Tree
- Path Sum
- Validate Binary Search Tree

**Time**: O(n)
**Space**: O(h) where h is height (recursion stack)

---

### BFS (Breadth-First Search)

**When to use:**
- Level-order traversal
- Shortest path in unweighted graph/tree
- Finding nodes at specific level
- Minimum depth

**Template:**
```python
from collections import deque

def bfs(root):
    if not root:
        return []

    queue = deque([root])
    result = []

    while queue:
        level_size = len(queue)
        level = []

        for _ in range(level_size):
            node = queue.popleft()
            level.append(node.val)

            if node.left:
                queue.append(node.left)
            if node.right:
                queue.append(node.right)

        result.append(level)

    return result
```

**Examples:**
- Binary Tree Level Order Traversal
- Minimum Depth of Binary Tree
- Zigzag Level Order Traversal
- Binary Tree Right Side View

**Time**: O(n)
**Space**: O(w) where w is maximum width

---

## Graph Patterns

### Graph DFS

**When to use:**
- Connected components
- Cycle detection
- Topological sort
- Path finding

**Template:**
```python
def graph_dfs(graph):
    visited = set()

    def dfs(node):
        if node in visited:
            return

        visited.add(node)

        for neighbor in graph[node]:
            dfs(neighbor)

    # Visit all components
    for node in graph:
        if node not in visited:
            dfs(node)

    return visited
```

**Examples:**
- Number of Islands
- Clone Graph
- Course Schedule
- All Paths From Source to Target

**Time**: O(V + E)
**Space**: O(V)

---

### Graph BFS

**When to use:**
- Shortest path in unweighted graph
- Level-by-level exploration
- Finding distance

**Template:**
```python
from collections import deque

def graph_bfs(graph, start):
    queue = deque([start])
    visited = {start}
    distance = {start: 0}

    while queue:
        node = queue.popleft()

        for neighbor in graph[node]:
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append(neighbor)
                distance[neighbor] = distance[node] + 1

    return distance
```

**Examples:**
- Word Ladder
- Shortest Path in Binary Matrix
- Rotting Oranges

**Time**: O(V + E)
**Space**: O(V)

---

### Union-Find (Disjoint Set)

**When to use:**
- Connected components in dynamic graph
- Cycle detection in undirected graph
- Kruskal's algorithm

**Template:**
```python
class UnionFind:
    def __init__(self, n):
        self.parent = list(range(n))
        self.rank = [0] * n

    def find(self, x):
        if self.parent[x] != x:
            self.parent[x] = self.find(self.parent[x])  # path compression
        return self.parent[x]

    def union(self, x, y):
        root_x, root_y = self.find(x), self.find(y)

        if root_x == root_y:
            return False  # already connected

        # Union by rank
        if self.rank[root_x] < self.rank[root_y]:
            self.parent[root_x] = root_y
        elif self.rank[root_x] > self.rank[root_y]:
            self.parent[root_y] = root_x
        else:
            self.parent[root_y] = root_x
            self.rank[root_x] += 1

        return True

    def connected(self, x, y):
        return self.find(x) == self.find(y)
```

**Examples:**
- Number of Connected Components
- Redundant Connection
- Accounts Merge

**Time**: O(α(n)) amortized per operation (nearly constant)
**Space**: O(n)

---

## Dynamic Programming Patterns

### 1D DP

**When to use:**
- Fibonacci-like problems
- House robber variants
- Climbing stairs

**Template:**
```python
def dp_1d(arr):
    n = len(arr)
    if n == 0:
        return 0

    dp = [0] * n
    dp[0] = base_case

    for i in range(1, n):
        dp[i] = max(
            dp[i-1] + arr[i],  # include current
            dp[i-1]             # exclude current
        )

    return dp[n-1]

# Space optimized
def dp_1d_optimized(arr):
    prev, curr = 0, 0

    for num in arr:
        prev, curr = curr, max(curr, prev + num)

    return curr
```

**Examples:**
- Climbing Stairs
- House Robber
- Decode Ways

**Time**: O(n)
**Space**: O(n) or O(1) optimized

---

### 2D DP

**When to use:**
- Grid problems
- String matching
- Knapsack variants

**Template:**
```python
def dp_2d(grid):
    m, n = len(grid), len(grid[0])
    dp = [[0] * n for _ in range(m)]

    # Initialize base cases
    dp[0][0] = grid[0][0]

    # Fill first row and column
    for i in range(1, m):
        dp[i][0] = dp[i-1][0] + grid[i][0]
    for j in range(1, n):
        dp[0][j] = dp[0][j-1] + grid[0][j]

    # Fill rest of table
    for i in range(1, m):
        for j in range(1, n):
            dp[i][j] = grid[i][j] + min(
                dp[i-1][j],   # from top
                dp[i][j-1]    # from left
            )

    return dp[m-1][n-1]
```

**Examples:**
- Unique Paths
- Minimum Path Sum
- Edit Distance
- Longest Common Subsequence

**Time**: O(m * n)
**Space**: O(m * n) or O(n) optimized

---

### Knapsack Pattern

**When to use:**
- Subset sum
- Target sum
- Partition problems

**Template (0/1 Knapsack):**
```python
def knapsack(weights, values, capacity):
    n = len(weights)
    dp = [[0] * (capacity + 1) for _ in range(n + 1)]

    for i in range(1, n + 1):
        for w in range(1, capacity + 1):
            if weights[i-1] <= w:
                dp[i][w] = max(
                    values[i-1] + dp[i-1][w - weights[i-1]],  # include
                    dp[i-1][w]                                  # exclude
                )
            else:
                dp[i][w] = dp[i-1][w]

    return dp[n][capacity]
```

**Examples:**
- Partition Equal Subset Sum
- Target Sum
- Coin Change

**Time**: O(n * capacity)
**Space**: O(n * capacity)

---

## Other Important Patterns

### Backtracking

**When to use:**
- Generate all permutations/combinations
- Subsets
- N-Queens
- Sudoku solver

**Template:**
```python
def backtrack(nums):
    result = []

    def helper(path, remaining):
        # Base case: found valid solution
        if is_complete(path):
            result.append(path[:])
            return

        # Try all possibilities
        for i, num in enumerate(remaining):
            # Make choice
            path.append(num)

            # Recurse with updated state
            helper(path, remaining[:i] + remaining[i+1:])

            # Undo choice (backtrack)
            path.pop()

    helper([], nums)
    return result
```

**Examples:**
- Permutations
- Subsets
- Combination Sum
- Generate Parentheses

**Time**: Varies (often O(2^n) or O(n!))
**Space**: O(n) recursion depth

---

### Monotonic Stack

**When to use:**
- Next greater/smaller element
- Histogram problems
- Stock span

**Template:**
```python
def monotonic_stack(arr):
    stack = []  # stores indices
    result = [-1] * len(arr)

    for i in range(len(arr)):
        # Maintain monotonic property
        while stack and arr[stack[-1]] < arr[i]:
            idx = stack.pop()
            result[idx] = arr[i]  # arr[i] is next greater

        stack.append(i)

    return result
```

**Examples:**
- Next Greater Element
- Daily Temperatures
- Largest Rectangle in Histogram

**Time**: O(n)
**Space**: O(n)

---

### Fast & Slow Pointers

**When to use:**
- Cycle detection in linked list
- Finding middle of linked list
- Happy number

**Template:**
```python
def has_cycle(head):
    slow = fast = head

    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next

        if slow == fast:
            return True

    return False

def find_cycle_start(head):
    slow = fast = head

    # Find meeting point
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
        if slow == fast:
            break

    if not fast or not fast.next:
        return None

    # Find cycle start
    slow = head
    while slow != fast:
        slow = slow.next
        fast = fast.next

    return slow
```

**Examples:**
- Linked List Cycle
- Find Duplicate Number
- Happy Number

**Time**: O(n)
**Space**: O(1)

---

### Greedy

**When to use:**
- Locally optimal choice leads to global optimum
- Interval scheduling
- Jump game

**Template:**
```python
def greedy(arr):
    # Sort if needed
    arr.sort(key=lambda x: some_criteria)

    result = 0
    current_state = initial_state

    for item in arr:
        if can_take(item, current_state):
            result += 1
            current_state = update(current_state, item)

    return result
```

**Examples:**
- Jump Game
- Meeting Rooms II
- Gas Station

**Time**: Varies, often O(n log n) due to sorting
**Space**: O(1) typically

---

## Quick Pattern Identification

| Keywords | Pattern |
|----------|---------|
| Sorted array | Binary search, two pointers |
| Substring/subarray | Sliding window |
| All pairs | Nested loops or hash map |
| Tree traversal | DFS or BFS |
| Graph connectivity | Union-find or DFS |
| Shortest path | BFS (unweighted), Dijkstra (weighted) |
| Optimal/max/min subproblem | Dynamic programming |
| Generate all | Backtracking |
| Next greater/smaller | Monotonic stack |
| Top K | Heap |
| Cycle detection | Fast & slow pointers |
| Local optimal → global | Greedy |

Use this reference to quickly identify which pattern applies to your problem!