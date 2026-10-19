import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const region = process.env.AWS_REGION || "ap-south-1";
const client = new DynamoDBClient({
  region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const docClient = DynamoDBDocumentClient.from(client);
const PROBLEMS_TABLE = "LearnixCodingProblems";
const TESTCASES_TABLE = "LearnixCodingTestCases";

const problems = [
  {
    problemId: "add-two-numbers",
    title: "Add Two Numbers",
    slug: "add-two-numbers",
    difficulty: "Easy",
    tags: ["Math", "Basics"],
    description: "Given two integers `a` and `b`, return their sum.",
    inputFormat: "Two integers `a` and `b`.",
    outputFormat: "Return a single integer: `a + b`.",
    constraints: ["-10^9 <= a, b <= 10^9"],
    functionName: "addTwoNumbers",
    parameters: [{ name: "a", type: "number" }, { name: "b", type: "number" }],
    returnType: "number",
    templates: {
      javascript: `/**
 * @param {number} a
 * @param {number} b
 * @return {number}
 */
function addTwoNumbers(a, b) {
    // Write your code here
    return a + b;
}`
    },
    order: 1,
    isActive: true,
    testCases: [
      { id: "tc_01", input: [2, 3], raw: "a = 2, b = 3", out: 5, sample: true, exp: "2 + 3 = 5" },
      { id: "tc_02", input: [-5, 10], raw: "a = -5, b = 10", out: 5, sample: true },
      { id: "tc_03", input: [0, 0], raw: "a = 0, b = 0", out: 0, sample: true },
      { id: "tc_04", input: [100, 250], raw: "a = 100, b = 250", out: 350, sample: false },
      { id: "tc_05", input: [-50, -30], raw: "a = -50, b = -30", out: -80, sample: false },
    ]
  },
  {
    problemId: "two-sum",
    title: "Two Sum",
    slug: "two-sum",
    difficulty: "Easy",
    tags: ["Array", "Hash Table"],
    description: "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.",
    inputFormat: "An array of numbers `nums` and an integer `target`.",
    outputFormat: "Return an array of two indices `[i, j]`.",
    constraints: ["2 <= nums.length <= 10^4", "-10^9 <= nums[i] <= 10^9", "Exactly one valid answer exists."],
    functionName: "twoSum",
    parameters: [{ name: "nums", type: "number[]" }, { name: "target", type: "number" }],
    returnType: "number[]",
    templates: {
      javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
function twoSum(nums, target) {
    // Write your code here
    const map = new Map();
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        if (map.has(complement)) {
            return [map.get(complement), i];
        }
        map.set(nums[i], i);
    }
}`
    },
    order: 2,
    isActive: true,
    testCases: [
      { id: "tc_01", input: [[2, 7, 11, 15], 9], raw: "nums = [2,7,11,15], target = 9", out: [0, 1], sample: true, exp: "nums[0] + nums[1] == 9" },
      { id: "tc_02", input: [[3, 2, 4], 6], raw: "nums = [3,2,4], target = 6", out: [1, 2], sample: true },
      { id: "tc_03", input: [[3, 3], 6], raw: "nums = [3,3], target = 6", out: [0, 1], sample: true },
      { id: "tc_04", input: [[1, 5, 8, 12, 19], 20], raw: "nums = [1,5,8,12,19], target = 20", out: [0, 4], sample: false },
    ]
  },
  {
    problemId: "reverse-string",
    title: "Reverse String",
    slug: "reverse-string",
    difficulty: "Easy",
    tags: ["String", "Two Pointers"],
    description: "Write a function that reverses a given string `s` and returns the reversed string.",
    inputFormat: "A single string `s`.",
    outputFormat: "Return the reversed string.",
    constraints: ["1 <= s.length <= 10^5"],
    functionName: "reverseString",
    parameters: [{ name: "s", type: "string" }],
    returnType: "string",
    templates: {
      javascript: `/**
 * @param {string} s
 * @return {string}
 */
function reverseString(s) {
    // Write your code here
    return s.split("").reverse().join("");
}`
    },
    order: 3,
    isActive: true,
    testCases: [
      { id: "tc_01", input: ["hello"], raw: 's = "hello"', out: "olleh", sample: true },
      { id: "tc_02", input: ["Learnix"], raw: 's = "Learnix"', out: "xinraeL", sample: true },
      { id: "tc_03", input: ["a"], raw: 's = "a"', out: "a", sample: true },
      { id: "tc_04", input: ["racecar"], raw: 's = "racecar"', out: "racecar", sample: false },
    ]
  },
  {
    problemId: "palindrome-number",
    title: "Palindrome Number",
    slug: "palindrome-number",
    difficulty: "Easy",
    tags: ["Math"],
    description: "Given an integer `x`, return `true` if `x` is a palindrome, and `false` otherwise.",
    inputFormat: "An integer `x`.",
    outputFormat: "Return a boolean (`true` or `false`).",
    constraints: ["-2^31 <= x <= 2^31 - 1"],
    functionName: "isPalindrome",
    parameters: [{ name: "x", type: "number" }],
    returnType: "boolean",
    templates: {
      javascript: `/**
 * @param {number} x
 * @return {boolean}
 */
function isPalindrome(x) {
    // Write your code here
    if (x < 0) return false;
    const str = String(x);
    return str === str.split("").reverse().join("");
}`
    },
    order: 4,
    isActive: true,
    testCases: [
      { id: "tc_01", input: [121], raw: "x = 121", out: true, sample: true, exp: "121 reads as 121 from left to right." },
      { id: "tc_02", input: [-121], raw: "x = -121", out: false, sample: true, exp: "From left to right, it reads -121. Therefore it is not a palindrome." },
      { id: "tc_03", input: [10], raw: "x = 10", out: false, sample: true },
      { id: "tc_04", input: [12321], raw: "x = 12321", out: true, sample: false },
    ]
  },
  {
    problemId: "fizz-buzz",
    title: "Fizz Buzz",
    slug: "fizz-buzz",
    difficulty: "Easy",
    tags: ["Math", "Simulation"],
    description: "Given an integer `n`, return a 1-indexed string array `answer` where:\n- `answer[i] == 'FizzBuzz'` if `i` is divisible by 3 and 5.\n- `answer[i] == 'Fizz'` if `i` is divisible by 3.\n- `answer[i] == 'Buzz'` if `i` is divisible by 5.\n- `answer[i] == i` (as a string) otherwise.",
    inputFormat: "An integer `n`.",
    outputFormat: "An array of strings.",
    constraints: ["1 <= n <= 10^4"],
    functionName: "fizzBuzz",
    parameters: [{ name: "n", type: "number" }],
    returnType: "string[]",
    templates: {
      javascript: `/**
 * @param {number} n
 * @return {string[]}
 */
function fizzBuzz(n) {
    // Write your code here
    const res = [];
    for (let i = 1; i <= n; i++) {
        if (i % 15 === 0) res.push("FizzBuzz");
        else if (i % 3 === 0) res.push("Fizz");
        else if (i % 5 === 0) res.push("Buzz");
        else res.push(String(i));
    }
    return res;
}`
    },
    order: 5,
    isActive: true,
    testCases: [
      { id: "tc_01", input: [3], raw: "n = 3", out: ["1", "2", "Fizz"], sample: true },
      { id: "tc_02", input: [5], raw: "n = 5", out: ["1", "2", "Fizz", "4", "Buzz"], sample: true },
      { id: "tc_03", input: [15], raw: "n = 15", out: ["1","2","Fizz","4","Buzz","Fizz","7","8","Fizz","Buzz","11","Fizz","13","14","FizzBuzz"], sample: true },
    ]
  },
  {
    problemId: "find-maximum",
    title: "Find Maximum in Array",
    slug: "find-maximum",
    difficulty: "Easy",
    tags: ["Array", "Basics"],
    description: "Given an array of numbers `nums`, return the largest number in the array.",
    inputFormat: "An array of numbers `nums`.",
    outputFormat: "A single number representing the maximum value.",
    constraints: ["1 <= nums.length <= 10^5", "-10^9 <= nums[i] <= 10^9"],
    functionName: "findMaximum",
    parameters: [{ name: "nums", type: "number[]" }],
    returnType: "number",
    templates: {
      javascript: `/**
 * @param {number[]} nums
 * @return {number}
 */
function findMaximum(nums) {
    // Write your code here
    return Math.max(...nums);
}`
    },
    order: 6,
    isActive: true,
    testCases: [
      { id: "tc_01", input: [[1, 9, 3, 7, 2]], raw: "nums = [1, 9, 3, 7, 2]", out: 9, sample: true },
      { id: "tc_02", input: [[-10, -5, -20]], raw: "nums = [-10, -5, -20]", out: -5, sample: true },
      { id: "tc_03", input: [[42]], raw: "nums = [42]", out: 42, sample: true },
      { id: "tc_04", input: [[100, 500, 250, 999, 10]], raw: "nums = [100, 500, 250, 999, 10]", out: 999, sample: false },
    ]
  },
  {
    problemId: "valid-parentheses",
    title: "Valid Parentheses",
    slug: "valid-parentheses",
    difficulty: "Medium",
    tags: ["String", "Stack"],
    description: "Given a string `s` containing just the characters `'('`, `')'`, `'{'`, `'}'`, `'['` and `']'`, determine if the input string is valid.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n3. Every close bracket has a corresponding open bracket of the same type.",
    inputFormat: "A string `s` consisting of parentheses.",
    outputFormat: "Boolean (`true` or `false`).",
    constraints: ["1 <= s.length <= 10^4"],
    functionName: "isValid",
    parameters: [{ name: "s", type: "string" }],
    returnType: "boolean",
    templates: {
      javascript: `/**
 * @param {string} s
 * @return {boolean}
 */
function isValid(s) {
    // Write your code here
    const stack = [];
    const map = { ')': '(', '}': '{', ']': '[' };
    for (const char of s) {
        if (char === '(' || char === '{' || char === '[') {
            stack.push(char);
        } else {
            if (stack.pop() !== map[char]) return false;
        }
    }
    return stack.length === 0;
}`
    },
    order: 7,
    isActive: true,
    testCases: [
      { id: "tc_01", input: ["()"], raw: 's = "()"', out: true, sample: true },
      { id: "tc_02", input: ["()[]{}"], raw: 's = "()[]{}"', out: true, sample: true },
      { id: "tc_03", input: ["(]"], raw: 's = "(]"', out: false, sample: true },
      { id: "tc_04", input: ["([)]"], raw: 's = "([)]"', out: false, sample: false },
      { id: "tc_05", input: ["{[]}"], raw: 's = "{[]}"', out: true, sample: false },
    ]
  },
  {
    problemId: "factorial",
    title: "Factorial of a Number",
    slug: "factorial",
    difficulty: "Easy",
    tags: ["Math", "Recursion"],
    description: "Given a non-negative integer `n`, compute its factorial `n!`. By definition, `0! = 1`.",
    inputFormat: "A non-negative integer `n`.",
    outputFormat: "An integer representing `n!`.",
    constraints: ["0 <= n <= 18"],
    functionName: "factorial",
    parameters: [{ name: "n", type: "number" }],
    returnType: "number",
    templates: {
      javascript: `/**
 * @param {number} n
 * @return {number}
 */
function factorial(n) {
    // Write your code here
    let res = 1;
    for (let i = 2; i <= n; i++) res *= i;
    return res;
}`
    },
    order: 8,
    isActive: true,
    testCases: [
      { id: "tc_01", input: [5], raw: "n = 5", out: 120, sample: true, exp: "5! = 5 * 4 * 3 * 2 * 1 = 120" },
      { id: "tc_02", input: [0], raw: "n = 0", out: 1, sample: true, exp: "0! is defined as 1" },
      { id: "tc_03", input: [3], raw: "n = 3", out: 6, sample: true },
      { id: "tc_04", input: [10], raw: "n = 10", out: 3628800, sample: false },
    ]
  },
  {
    problemId: "count-vowels",
    title: "Count Vowels",
    slug: "count-vowels",
    difficulty: "Easy",
    tags: ["String"],
    description: "Given a string `s`, return the count of vowels (`'a'`, `'e'`, `'i'`, `'o'`, `'u'`, case-insensitive) contained in the string.",
    inputFormat: "A single string `s`.",
    outputFormat: "An integer count of vowels.",
    constraints: ["0 <= s.length <= 10^5"],
    functionName: "countVowels",
    parameters: [{ name: "s", type: "string" }],
    returnType: "number",
    templates: {
      javascript: `/**
 * @param {string} s
 * @return {number}
 */
function countVowels(s) {
    // Write your code here
    const vowels = new Set(['a', 'e', 'i', 'o', 'u', 'A', 'E', 'I', 'O', 'U']);
    let count = 0;
    for (const ch of s) {
        if (vowels.has(ch)) count++;
    }
    return count;
}`
    },
    order: 9,
    isActive: true,
    testCases: [
      { id: "tc_01", input: ["hello"], raw: 's = "hello"', out: 2, sample: true, exp: "'e' and 'o' are vowels" },
      { id: "tc_02", input: ["Learnix"], raw: 's = "Learnix"', out: 3, sample: true },
      { id: "tc_03", input: ["xyz"], raw: 's = "xyz"', out: 0, sample: true },
      { id: "tc_04", input: ["AEIOUaeiou"], raw: 's = "AEIOUaeiou"', out: 10, sample: false },
    ]
  },
  {
    problemId: "fibonacci-number",
    title: "Fibonacci Number",
    slug: "fibonacci-number",
    difficulty: "Easy",
    tags: ["Math", "Dynamic Programming"],
    description: "The Fibonacci numbers form a sequence, such that each number is the sum of the two preceding ones, starting from `0` and `1`. That is:\n`F(0) = 0`, `F(1) = 1`\n`F(n) = F(n - 1) + F(n - 2)`, for `n > 1`.\n\nGiven `n`, calculate `F(n)`.",
    inputFormat: "An integer `n`.",
    outputFormat: "Return `F(n)` as an integer.",
    constraints: ["0 <= n <= 30"],
    functionName: "fib",
    parameters: [{ name: "n", type: "number" }],
    returnType: "number",
    templates: {
      javascript: `/**
 * @param {number} n
 * @return {number}
 */
function fib(n) {
    // Write your code here
    if (n <= 1) return n;
    let a = 0, b = 1;
    for (let i = 2; i <= n; i++) {
        const c = a + b;
        a = b;
        b = c;
    }
    return b;
}`
    },
    order: 10,
    isActive: true,
    testCases: [
      { id: "tc_01", input: [2], raw: "n = 2", out: 1, sample: true, exp: "F(2) = F(1) + F(0) = 1 + 0 = 1." },
      { id: "tc_02", input: [3], raw: "n = 3", out: 2, sample: true, exp: "F(3) = F(2) + F(1) = 1 + 1 = 2." },
      { id: "tc_03", input: [4], raw: "n = 4", out: 3, sample: true, exp: "F(4) = F(3) + F(2) = 2 + 1 = 3." },
      { id: "tc_04", input: [10], raw: "n = 10", out: 55, sample: false },
    ]
  }
];

async function seed() {
  console.log(`Seeding ${problems.length} problems into DynamoDB...`);
  const now = new Date().toISOString();

  for (const p of problems) {
    const { testCases, ...problemItem } = p;
    problemItem.createdAt = now;
    problemItem.updatedAt = now;

    console.log(`Saving problem #${p.order}: ${p.title}`);
    await docClient.send(
      new PutCommand({
        TableName: PROBLEMS_TABLE,
        Item: problemItem,
      })
    );

    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      await docClient.send(
        new PutCommand({
          TableName: TESTCASES_TABLE,
          Item: {
            problemId: p.problemId,
            testCaseId: tc.id,
            order: i + 1,
            input: tc.input,
            rawInput: tc.raw || JSON.stringify(tc.input),
            expectedOutput: tc.out,
            isSample: Boolean(tc.sample),
            explanation: tc.exp || "",
            createdAt: now,
          },
        })
      );
    }
  }

  console.log("✓ Successfully seeded 10 problems with test cases!");
}

seed().catch(console.error);
