import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router';
import { Button } from '../components/Button';
import { DifficultyBadge, VerdictBadge } from '../components/Badge';
import { CodeFocusManager } from '../components/CodeFocusManager';
import { Select } from '../components/Input';
import { challengesService } from '../services/challengesService';
import { submissionsService } from '../services/submissionsService';
import { adminService } from '../services/adminService';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import Editor from "@monaco-editor/react";
import { useEditorTheme, defineMonacoThemes } from '../context/EditorThemeContext';
import { useAnticheat } from '../hooks/useAnticheat';
import {
  Play,
  Send,
  Lightbulb,
  ChevronLeft,
  Info,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Loader,
  Sparkles
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const LANGUAGES = [
  { value: 'python', label: 'Python 3' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'cpp', label: 'C++' },
  { value: 'c', label: 'C' },
  { value: 'java', label: 'Java' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
];

const LANG_EXTENSIONS: Record<string, string> = {
  python: 'py',
  javascript: 'js',
  typescript: 'ts',
  cpp: 'cpp',
  c: 'c',
  java: 'java',
  go: 'go',
  rust: 'rs',
};

// ─── Input format convention ───────────────────────────────────────────────
// Each test case is delivered via stdin.
// Lines are separated by \n. Each line may be a plain value or a JSON-encoded
// value (e.g. a list). Use the helpers below to parse them.
// Always write your answer to stdout with print() / console.log() / fmt.Println().
// ─────────────────────────────────────────────────────────────────────────────
const CODE_TEMPLATES: Record<string, string> = {
  python: `import sys
import json

def solution(lines):
    # Each line is either a plain value or JSON-encoded.
    # Example: parse a list from line 0 and an int from line 1
    # nums = json.loads(lines[0])
    # target = int(lines[1])
    # print(result)
    pass

if __name__ == "__main__":
    data = sys.stdin.read().splitlines()
    solution(data)
`,
  javascript: `const lines = require('fs').readFileSync('/dev/stdin', 'utf8').trim().split('\\n');

function solution(lines) {
  // Each line is either a plain value or JSON-encoded.
  // Example: parse a list from line 0 and an int from line 1
  // const nums = JSON.parse(lines[0]);
  // const target = parseInt(lines[1]);
  // console.log(result);
}

solution(lines);
`,
  typescript: `import * as fs from 'fs';

const lines: string[] = fs.readFileSync('/dev/stdin', 'utf8').trim().split('\\n');

function solution(lines: string[]): void {
  // Each line is either a plain value or JSON-encoded.
  // Example: parse a list from line 0 and an int from line 1
  // const nums: number[] = JSON.parse(lines[0]);
  // const target: number = parseInt(lines[1]);
  // console.log(result);
}

solution(lines);
`,
  cpp: `#include <iostream>
#include <sstream>
#include <string>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    // Read all lines from stdin
    string line;
    vector<string> lines;
    while (getline(cin, line)) lines.push_back(line);

    // Each line is either a plain value or a JSON-like array.
    // Parse and print your result:
    // cout << result << endl;

    return 0;
}
`,
  c: `#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main() {
    char line[4096];
    // Read lines from stdin
    while (fgets(line, sizeof(line), stdin)) {
        // Remove trailing newline
        line[strcspn(line, "\\n")] = 0;
        // Parse and process each line
    }
    // printf("%d\\n", result);
    return 0;
}
`,
  java: `import java.util.*;
import java.io.*;

public class Solution {
    public static void main(String[] args) throws Exception {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        List<String> lines = new ArrayList<>();
        String line;
        while ((line = br.readLine()) != null) lines.add(line);

        // Each line is either a plain value or a JSON-like array.
        // Example: parse line 0 as array, line 1 as int
        // String[] parts = lines.get(0).replaceAll("[\\\\[\\\\] ]","").split(",");
        // int target = Integer.parseInt(lines.get(1).trim());
        // System.out.println(result);
    }
}
`,
  go: `package main

import (
	"bufio"
	"fmt"
	"os"
)

func main() {
	scanner := bufio.NewScanner(os.Stdin)
	var lines []string
	for scanner.Scan() {
		lines = append(lines, scanner.Text())
	}

	// Each line is either a plain value or a JSON-like array.
	// Parse and print your result:
	_ = lines
	fmt.Println()
}
`,
  rust: `use std::io::{self, BufRead};

fn main() {
    let stdin = io::stdin();
    let lines: Vec<String> = stdin.lock().lines()
        .map(|l| l.expect("Could not read line"))
        .collect();

    // Each line is either a plain value or a JSON-like array.
    // Parse and print your result:
    // println!("{}", result);
    let _ = lines;
}
`,
};

const LANG_COMPLETIONS: Record<string, { label: string; kind: string; insertText: string; detail?: string }[]> = {
  python: [
    { label: 'print', kind: 'Function', insertText: 'print(${1})', detail: 'Print to stdout' },
    { label: 'input', kind: 'Function', insertText: 'input(${1})', detail: 'Read from stdin' },
    { label: 'range', kind: 'Function', insertText: 'range(${1})', detail: 'Generate a range' },
    { label: 'len', kind: 'Function', insertText: 'len(${1})', detail: 'Length of iterable' },
    { label: 'int', kind: 'Function', insertText: 'int(${1})', detail: 'Convert to integer' },
    { label: 'str', kind: 'Function', insertText: 'str(${1})', detail: 'Convert to string' },
    { label: 'float', kind: 'Function', insertText: 'float(${1})', detail: 'Convert to float' },
    { label: 'list', kind: 'Function', insertText: 'list(${1})', detail: 'Create a list' },
    { label: 'dict', kind: 'Function', insertText: 'dict(${1})', detail: 'Create a dict' },
    { label: 'set', kind: 'Function', insertText: 'set(${1})', detail: 'Create a set' },
    { label: 'sorted', kind: 'Function', insertText: 'sorted(${1})', detail: 'Return sorted list' },
    { label: 'enumerate', kind: 'Function', insertText: 'enumerate(${1})', detail: 'Enumerate iterable' },
    { label: 'zip', kind: 'Function', insertText: 'zip(${1})', detail: 'Zip iterables' },
    { label: 'map', kind: 'Function', insertText: 'map(${1})', detail: 'Map function' },
    { label: 'filter', kind: 'Function', insertText: 'filter(${1})', detail: 'Filter iterable' },
    { label: 'sum', kind: 'Function', insertText: 'sum(${1})', detail: 'Sum of iterable' },
    { label: 'min', kind: 'Function', insertText: 'min(${1})', detail: 'Minimum value' },
    { label: 'max', kind: 'Function', insertText: 'max(${1})', detail: 'Maximum value' },
    { label: 'abs', kind: 'Function', insertText: 'abs(${1})', detail: 'Absolute value' },
    { label: 'isinstance', kind: 'Function', insertText: 'isinstance(${1}, ${2})', detail: 'Check type' },
    { label: 'append', kind: 'Method', insertText: 'append(${1})', detail: 'Append to list' },
    { label: 'extend', kind: 'Method', insertText: 'extend(${1})', detail: 'Extend list' },
    { label: 'split', kind: 'Method', insertText: 'split(${1})', detail: 'Split string' },
    { label: 'join', kind: 'Method', insertText: 'join(${1})', detail: 'Join strings' },
    { label: 'strip', kind: 'Method', insertText: 'strip()', detail: 'Strip whitespace' },
    { label: 'replace', kind: 'Method', insertText: 'replace(${1}, ${2})', detail: 'Replace in string' },
    { label: 'for', kind: 'Keyword', insertText: 'for ${1:item} in ${2:iterable}:\n\t${3}', detail: 'for loop' },
    { label: 'while', kind: 'Keyword', insertText: 'while ${1:condition}:\n\t${2}', detail: 'while loop' },
    { label: 'if', kind: 'Keyword', insertText: 'if ${1:condition}:\n\t${2}', detail: 'if statement' },
    { label: 'elif', kind: 'Keyword', insertText: 'elif ${1:condition}:\n\t${2}', detail: 'elif clause' },
    { label: 'else', kind: 'Keyword', insertText: 'else:\n\t${1}', detail: 'else clause' },
    { label: 'def', kind: 'Keyword', insertText: 'def ${1:name}(${2:params}):\n\t${3}', detail: 'function definition' },
    { label: 'class', kind: 'Keyword', insertText: 'class ${1:Name}:\n\tdef __init__(self${2:, params}):\n\t\t${3}', detail: 'class definition' },
    { label: 'return', kind: 'Keyword', insertText: 'return ${1}', detail: 'return statement' },
    { label: 'import', kind: 'Keyword', insertText: 'import ${1}', detail: 'import module' },
    { label: 'from', kind: 'Keyword', insertText: 'from ${1} import ${2}', detail: 'from import' },
    { label: 'try', kind: 'Keyword', insertText: 'try:\n\t${1}\nexcept ${2:Exception} as e:\n\t${3}', detail: 'try/except block' },
    { label: 'lambda', kind: 'Keyword', insertText: 'lambda ${1:x}: ${2}', detail: 'lambda expression' },
    { label: 'with', kind: 'Keyword', insertText: 'with ${1} as ${2}:\n\t${3}', detail: 'with statement' },
    { label: 'collections', kind: 'Module', insertText: 'from collections import ${1:deque}', detail: 'collections module' },
    { label: 'heapq', kind: 'Module', insertText: 'import heapq', detail: 'heapq module' },
    { label: 'bisect', kind: 'Module', insertText: 'import bisect', detail: 'bisect module' },
    { label: 'itertools', kind: 'Module', insertText: 'import itertools', detail: 'itertools module' },
    { label: 'math', kind: 'Module', insertText: 'import math', detail: 'math module' },
    { label: 'sys', kind: 'Module', insertText: 'import sys', detail: 'sys module' },
  ],
  cpp: [
    { label: 'cout', kind: 'Function', insertText: 'cout << ${1} << endl;', detail: 'Print to stdout' },
    { label: 'cin', kind: 'Function', insertText: 'cin >> ${1};', detail: 'Read from stdin' },
    { label: 'endl', kind: 'Keyword', insertText: 'endl', detail: 'End line' },
    { label: 'vector', kind: 'Class', insertText: 'vector<${1:int}> ${2:v};', detail: 'std::vector' },
    { label: 'string', kind: 'Class', insertText: 'string ${1:s};', detail: 'std::string' },
    { label: 'map', kind: 'Class', insertText: 'map<${1:string}, ${2:int}> ${3:m};', detail: 'std::map' },
    { label: 'unordered_map', kind: 'Class', insertText: 'unordered_map<${1:string}, ${2:int}> ${3:m};', detail: 'std::unordered_map' },
    { label: 'set', kind: 'Class', insertText: 'set<${1:int}> ${2:s};', detail: 'std::set' },
    { label: 'unordered_set', kind: 'Class', insertText: 'unordered_set<${1:int}> ${2:s};', detail: 'std::unordered_set' },
    { label: 'queue', kind: 'Class', insertText: 'queue<${1:int}> ${2:q};', detail: 'std::queue' },
    { label: 'stack', kind: 'Class', insertText: 'stack<${1:int}> ${2:s};', detail: 'std::stack' },
    { label: 'priority_queue', kind: 'Class', insertText: 'priority_queue<${1:int}> ${2:pq};', detail: 'std::priority_queue' },
    { label: 'pair', kind: 'Class', insertText: 'pair<${1:int}, ${2:int}> ${3:p};', detail: 'std::pair' },
    { label: 'sort', kind: 'Function', insertText: 'sort(${1:v}.begin(), ${1:v}.end());', detail: 'Sort container' },
    { label: 'reverse', kind: 'Function', insertText: 'reverse(${1:v}.begin(), ${1:v}.end());', detail: 'Reverse container' },
    { label: 'push_back', kind: 'Method', insertText: 'push_back(${1});', detail: 'Add to end' },
    { label: 'size', kind: 'Method', insertText: 'size()', detail: 'Container size' },
    { label: 'empty', kind: 'Method', insertText: 'empty()', detail: 'Check if empty' },
    { label: 'begin', kind: 'Method', insertText: 'begin()', detail: 'Iterator begin' },
    { label: 'end', kind: 'Method', insertText: 'end()', detail: 'Iterator end' },
    { label: 'for', kind: 'Keyword', insertText: 'for (int ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {\n\t${3}\n}', detail: 'for loop' },
    { label: 'foreach', kind: 'Keyword', insertText: 'for (auto& ${1:x} : ${2:container}) {\n\t${3}\n}', detail: 'range-based for' },
    { label: 'while', kind: 'Keyword', insertText: 'while (${1:condition}) {\n\t${2}\n}', detail: 'while loop' },
    { label: 'if', kind: 'Keyword', insertText: 'if (${1:condition}) {\n\t${2}\n}', detail: 'if statement' },
    { label: 'include', kind: 'Keyword', insertText: '#include <${1:iostream}>', detail: '#include directive' },
    { label: 'main', kind: 'Function', insertText: 'int main() {\n\t${1}\n\treturn 0;\n}', detail: 'main function' },
  ],
  c: [
    { label: 'printf', kind: 'Function', insertText: 'printf("${1:%s}\\n", ${2});', detail: 'Print to stdout' },
    { label: 'scanf', kind: 'Function', insertText: 'scanf("${1:%d}", &${2});', detail: 'Read from stdin' },
    { label: 'malloc', kind: 'Function', insertText: 'malloc(${1:size} * sizeof(${2:int}))', detail: 'Allocate memory' },
    { label: 'free', kind: 'Function', insertText: 'free(${1:ptr});', detail: 'Free memory' },
    { label: 'strlen', kind: 'Function', insertText: 'strlen(${1:s})', detail: 'String length' },
    { label: 'strcmp', kind: 'Function', insertText: 'strcmp(${1:s1}, ${2:s2})', detail: 'Compare strings' },
    { label: 'strcpy', kind: 'Function', insertText: 'strcpy(${1:dest}, ${2:src});', detail: 'Copy string' },
    { label: 'memset', kind: 'Function', insertText: 'memset(${1:ptr}, ${2:0}, ${3:size});', detail: 'Set memory' },
    { label: 'memcpy', kind: 'Function', insertText: 'memcpy(${1:dest}, ${2:src}, ${3:size});', detail: 'Copy memory' },
    { label: 'sizeof', kind: 'Keyword', insertText: 'sizeof(${1:type})', detail: 'Size of type' },
    { label: 'for', kind: 'Keyword', insertText: 'for (int ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {\n\t${3}\n}', detail: 'for loop' },
    { label: 'while', kind: 'Keyword', insertText: 'while (${1:condition}) {\n\t${2}\n}', detail: 'while loop' },
    { label: 'if', kind: 'Keyword', insertText: 'if (${1:condition}) {\n\t${2}\n}', detail: 'if statement' },
    { label: 'struct', kind: 'Keyword', insertText: 'typedef struct {\n\t${1}\n} ${2:Name};', detail: 'struct definition' },
    { label: 'include', kind: 'Keyword', insertText: '#include <${1:stdio.h}>', detail: '#include directive' },
    { label: 'main', kind: 'Function', insertText: 'int main() {\n\t${1}\n\treturn 0;\n}', detail: 'main function' },
  ],
  java: [
    { label: 'sout', kind: 'Function', insertText: 'System.out.println(${1});', detail: 'Print to stdout' },
    { label: 'System.out.println', kind: 'Function', insertText: 'System.out.println(${1});', detail: 'Print to stdout' },
    { label: 'Scanner', kind: 'Class', insertText: 'Scanner ${1:sc} = new Scanner(System.in);', detail: 'Scanner for input' },
    { label: 'nextInt', kind: 'Method', insertText: 'nextInt()', detail: 'Read integer' },
    { label: 'nextLine', kind: 'Method', insertText: 'nextLine()', detail: 'Read line' },
    { label: 'nextDouble', kind: 'Method', insertText: 'nextDouble()', detail: 'Read double' },
    { label: 'ArrayList', kind: 'Class', insertText: 'ArrayList<${1:Integer}> ${2:list} = new ArrayList<>();', detail: 'ArrayList' },
    { label: 'HashMap', kind: 'Class', insertText: 'HashMap<${1:String}, ${2:Integer}> ${3:map} = new HashMap<>();', detail: 'HashMap' },
    { label: 'HashSet', kind: 'Class', insertText: 'HashSet<${1:Integer}> ${2:set} = new HashSet<>();', detail: 'HashSet' },
    { label: 'LinkedList', kind: 'Class', insertText: 'LinkedList<${1:Integer}> ${2:list} = new LinkedList<>();', detail: 'LinkedList' },
    { label: 'PriorityQueue', kind: 'Class', insertText: 'PriorityQueue<${1:Integer}> ${2:pq} = new PriorityQueue<>();', detail: 'PriorityQueue' },
    { label: 'Stack', kind: 'Class', insertText: 'Stack<${1:Integer}> ${2:stack} = new Stack<>();', detail: 'Stack' },
    { label: 'Arrays.sort', kind: 'Function', insertText: 'Arrays.sort(${1:arr});', detail: 'Sort array' },
    { label: 'Collections.sort', kind: 'Function', insertText: 'Collections.sort(${1:list});', detail: 'Sort collection' },
    { label: 'Math.max', kind: 'Function', insertText: 'Math.max(${1:a}, ${2:b})', detail: 'Maximum' },
    { label: 'Math.min', kind: 'Function', insertText: 'Math.min(${1:a}, ${2:b})', detail: 'Minimum' },
    { label: 'Math.abs', kind: 'Function', insertText: 'Math.abs(${1:a})', detail: 'Absolute value' },
    { label: 'String.valueOf', kind: 'Function', insertText: 'String.valueOf(${1})', detail: 'Convert to string' },
    { label: 'Integer.parseInt', kind: 'Function', insertText: 'Integer.parseInt(${1})', detail: 'Parse integer' },
    { label: 'for', kind: 'Keyword', insertText: 'for (int ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {\n\t${3}\n}', detail: 'for loop' },
    { label: 'foreach', kind: 'Keyword', insertText: 'for (${1:int} ${2:x} : ${3:arr}) {\n\t${4}\n}', detail: 'enhanced for' },
    { label: 'while', kind: 'Keyword', insertText: 'while (${1:condition}) {\n\t${2}\n}', detail: 'while loop' },
    { label: 'if', kind: 'Keyword', insertText: 'if (${1:condition}) {\n\t${2}\n}', detail: 'if statement' },
    { label: 'main', kind: 'Function', insertText: 'public static void main(String[] args) {\n\t${1}\n}', detail: 'main method' },
  ],
  go: [
    { label: 'fmt.Println', kind: 'Function', insertText: 'fmt.Println(${1})', detail: 'Print line' },
    { label: 'fmt.Printf', kind: 'Function', insertText: 'fmt.Printf("${1}\\n", ${2})', detail: 'Formatted print' },
    { label: 'fmt.Scanf', kind: 'Function', insertText: 'fmt.Scanf("${1}", &${2})', detail: 'Scan input' },
    { label: 'fmt.Scan', kind: 'Function', insertText: 'fmt.Scan(&${1})', detail: 'Scan input' },
    { label: 'fmt.Sprintf', kind: 'Function', insertText: 'fmt.Sprintf("${1}", ${2})', detail: 'Format string' },
    { label: 'make', kind: 'Function', insertText: 'make(${1:[]int}, ${2:0})', detail: 'Make slice/map/chan' },
    { label: 'append', kind: 'Function', insertText: 'append(${1:slice}, ${2:elem})', detail: 'Append to slice' },
    { label: 'len', kind: 'Function', insertText: 'len(${1})', detail: 'Length' },
    { label: 'cap', kind: 'Function', insertText: 'cap(${1})', detail: 'Capacity' },
    { label: 'sort.Ints', kind: 'Function', insertText: 'sort.Ints(${1})', detail: 'Sort ints' },
    { label: 'sort.Strings', kind: 'Function', insertText: 'sort.Strings(${1})', detail: 'Sort strings' },
    { label: 'sort.Slice', kind: 'Function', insertText: 'sort.Slice(${1:s}, func(i, j int) bool {\n\treturn ${1:s}[i] < ${1:s}[j]\n})', detail: 'Sort slice' },
    { label: 'strconv.Atoi', kind: 'Function', insertText: 'strconv.Atoi(${1})', detail: 'String to int' },
    { label: 'strconv.Itoa', kind: 'Function', insertText: 'strconv.Itoa(${1})', detail: 'Int to string' },
    { label: 'strings.Split', kind: 'Function', insertText: 'strings.Split(${1:s}, "${2: "})' , detail: 'Split string' },
    { label: 'strings.Join', kind: 'Function', insertText: 'strings.Join(${1:slice}, "${2:,}")', detail: 'Join strings' },
    { label: 'for', kind: 'Keyword', insertText: 'for ${1:i} := 0; ${1:i} < ${2:n}; ${1:i}++ {\n\t${3}\n}', detail: 'for loop' },
    { label: 'forrange', kind: 'Keyword', insertText: 'for ${1:i}, ${2:v} := range ${3:slice} {\n\t${4}\n}', detail: 'for range' },
    { label: 'if', kind: 'Keyword', insertText: 'if ${1:condition} {\n\t${2}\n}', detail: 'if statement' },
    { label: 'func', kind: 'Keyword', insertText: 'func ${1:name}(${2:params}) ${3:returnType} {\n\t${4}\n}', detail: 'function' },
    { label: 'iferr', kind: 'Keyword', insertText: 'if err != nil {\n\t${1}\n}', detail: 'if err != nil' },
    { label: 'bufio.NewReader', kind: 'Function', insertText: 'bufio.NewReader(os.Stdin)', detail: 'Buffered reader' },
    { label: 'bufio.NewScanner', kind: 'Function', insertText: 'bufio.NewScanner(os.Stdin)', detail: 'Scanner' },
  ],
  rust: [
    { label: 'println!', kind: 'Function', insertText: 'println!("${1}", ${2});', detail: 'Print line' },
    { label: 'print!', kind: 'Function', insertText: 'print!("${1}", ${2});', detail: 'Print' },
    { label: 'eprintln!', kind: 'Function', insertText: 'eprintln!("${1}", ${2});', detail: 'Print to stderr' },
    { label: 'format!', kind: 'Function', insertText: 'format!("${1}", ${2})', detail: 'Format string' },
    { label: 'vec!', kind: 'Function', insertText: 'vec![${1}]', detail: 'Create Vec' },
    { label: 'String::new', kind: 'Function', insertText: 'String::new()', detail: 'New String' },
    { label: 'String::from', kind: 'Function', insertText: 'String::from("${1}")', detail: 'String from str' },
    { label: 'Vec::new', kind: 'Function', insertText: 'Vec::new()', detail: 'New Vec' },
    { label: 'HashMap::new', kind: 'Function', insertText: 'HashMap::new()', detail: 'New HashMap' },
    { label: 'HashSet::new', kind: 'Function', insertText: 'HashSet::new()', detail: 'New HashSet' },
    { label: 'read_line', kind: 'Method', insertText: 'read_line(&mut ${1:input})', detail: 'Read line from stdin' },
    { label: 'parse', kind: 'Method', insertText: 'parse::<${1:i32}>()', detail: 'Parse string' },
    { label: 'trim', kind: 'Method', insertText: 'trim()', detail: 'Trim whitespace' },
    { label: 'split_whitespace', kind: 'Method', insertText: 'split_whitespace()', detail: 'Split by whitespace' },
    { label: 'collect', kind: 'Method', insertText: 'collect::<${1:Vec<_>}>()', detail: 'Collect iterator' },
    { label: 'iter', kind: 'Method', insertText: 'iter()', detail: 'Iterator' },
    { label: 'map', kind: 'Method', insertText: 'map(|${1:x}| ${2})', detail: 'Map iterator' },
    { label: 'filter', kind: 'Method', insertText: 'filter(|${1:x}| ${2})', detail: 'Filter iterator' },
    { label: 'unwrap', kind: 'Method', insertText: 'unwrap()', detail: 'Unwrap Result/Option' },
    { label: 'push', kind: 'Method', insertText: 'push(${1});', detail: 'Push to Vec' },
    { label: 'len', kind: 'Method', insertText: 'len()', detail: 'Length' },
    { label: 'sort', kind: 'Method', insertText: 'sort();', detail: 'Sort' },
    { label: 'for', kind: 'Keyword', insertText: 'for ${1:item} in ${2:iter} {\n\t${3}\n}', detail: 'for loop' },
    { label: 'while', kind: 'Keyword', insertText: 'while ${1:condition} {\n\t${2}\n}', detail: 'while loop' },
    { label: 'if', kind: 'Keyword', insertText: 'if ${1:condition} {\n\t${2}\n}', detail: 'if statement' },
    { label: 'let', kind: 'Keyword', insertText: 'let ${1:name} = ${2};', detail: 'Variable binding' },
    { label: 'letmut', kind: 'Keyword', insertText: 'let mut ${1:name} = ${2};', detail: 'Mutable binding' },
    { label: 'fn', kind: 'Keyword', insertText: 'fn ${1:name}(${2:params}) -> ${3:ReturnType} {\n\t${4}\n}', detail: 'Function' },
    { label: 'match', kind: 'Keyword', insertText: 'match ${1:value} {\n\t${2:pattern} => ${3},\n\t_ => ${4},\n}', detail: 'Match expression' },
    { label: 'readinput', kind: 'Keyword', insertText: 'let mut input = String::new();\nio::stdin().read_line(&mut input).unwrap();\nlet input = input.trim();', detail: 'Read stdin line' },
  ],
};

type Tab = 'statement' | 'tests' | 'submissions' | 'editorial';

export function Problem() {
  const { id } = useParams();
  const [problem, setProblem] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<Tab>('statement');
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState('');
  const [submissionResult, setSubmissionResult] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [aiReview, setAiReview] = useState<any>(null);
  const [loadingAiReview, setLoadingAiReview] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(120);

  const [hintsUsed, setHintsUsed] = useState(0);
  const { user } = useAuth();
  const { editorTheme } = useEditorTheme();

  // ── Anticheat ────────────────────────────────────────────────────────────
  const { focusLostCount, totalFocusLostTime, isFullScreen } = useAnticheat({
    autoFullscreen: true,
    blockCopyPaste: true,
  });
  const submissionIdRef = useRef<string | null>(null);

  useEffect(() => {
    const fetchProblem = async () => {
      try {
        const data = await challengesService.getById(id as string);
        setProblem(data);

        // Set default code template based on selected language
        if (data.allowedLanguages?.length > 0) {
          const firstLang = data.allowedLanguages[0];
          setLanguage(firstLang);
          setCode(CODE_TEMPLATES[firstLang] || '// Votre code ici\n');
        } else {
          setCode(CODE_TEMPLATES[language] || '// Votre code ici\n');
        }
      } catch (err) {
        toast.error('Error while loading problem');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProblem();
  }, [id]);

  // Socket connection for submission status
  useEffect(() => {
    if (!user) return;

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4001';
    const newSocket = io(`${apiUrl}/submissions`, {
      transports: ['polling'],
      withCredentials: true 
    });

    newSocket.on('connect', () => {
      newSocket.emit('subscribe_user', { userId: user.id });
    });

    newSocket.on('submission_status', (data) => {
      if (data.status === 'executing') {
        toast.loading('Running...', { id: 'submission-toast' });
      } else if (data.status === 'completed') {
        setIsRunning(false);
        const result = data.result || {};
        const firstFailedTest = Array.isArray(result.results)
          ? result.results.find((t: any) => !t.passed)
          : null;
        setSubmissionResult({
          id: data.submissionId,
          verdict: result.verdict || 'OK',
          testsPassed: result.passed || 0,
          testsTotal: result.total || 0,
          timeMs: result.totalTimeMs || result.timeMs || 0,
          memMb: result.maxMemMb || result.memMb || 0,
          stdout: result.results?.[0]?.actualOutput || result.stdout || '',
          stderr: result.stderr || firstFailedTest?.stderr || '',
          firstFailedTest,
        });
        setShowResults(true);
        toast.success('Exécution terminée !', { id: 'submission-toast' });
      } else if (data.status === 'error') {
        setIsRunning(false);
        setSubmissionResult({
          verdict: 'RE',
          stderr: data.error || 'Unknown execution error',
        });
        setShowResults(true);
        toast.error('Erreur: ' + data.error, { id: 'submission-toast' });
      } else if (data.status === 'queued') {
        toast.loading('Dans la file d\'attente...', { id: 'submission-toast' });
      }
    });

    return () => {
      newSocket.close();
    };
  }, [user]);

  // Timer logic
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isRunning && timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 60000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRunning, timeRemaining]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <Loader className="w-8 h-8 text-[var(--brand-primary)] animate-spin" />
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center text-[var(--text-primary)]">
        Problem not found
      </div>
    );
  }

  const handleRun = async () => {
    if (!problem) return;
    setIsRunning(true);
    setShowResults(false);

    try {
      const result = await submissionsService.runCode({
        challengeId: problem.id,
        language: language,
        code: code
      });
      const firstFailedTest = Array.isArray(result.results)
        ? result.results.find((t: any) => !t.passed)
        : null;

      setSubmissionResult({
        verdict: result.verdict || 'OK',
        testsPassed: result.passed || 0,
        testsTotal: result.total || problem.tests?.length || 0,
        timeMs: result.totalTimeMs || result.timeMs || 0,
        memMb: result.maxMemMb || result.memMb || 0,
        stdout: result.stdout || result.results?.[0]?.actualOutput || '',
        stderr: result.stderr || firstFailedTest?.stderr || '',
        firstFailedTest,
      });
      setShowResults(true);
      toast.success('Exécution terminée');
    } catch (err) {
      toast.error("Erreur lors de l'exécution");
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (!problem) return;
    setIsRunning(true);
    setShowResults(false);

    try {
      const submission = await submissionsService.submitCode({
        challengeId: problem.id,
        kind: 'CODE',
        language: language,
        code: code,
        context: 'solo'
      });

      submissionIdRef.current = submission?.id;
      setAiReview(null);
      toast.success('Code soumis ! En attente des résultats...');
    } catch (err) {
      toast.error('Erreur lors de la soumission');
      setIsRunning(false);
    }
  };

  const handleGetAiReview = async () => {
    if (!submissionResult?.id) return;
    setLoadingAiReview(true);
    try {
      const review = await submissionsService.getAiReview(submissionResult.id);
      setAiReview(review);
    } catch (err) {
      toast.error("Erreur lors de la récupération de l'analyse IA. Assurez-vous que la clé API Gemini est configurée.");
    } finally {
      setLoadingAiReview(false);
    }
  };

  // Convert allowed languages into react-select format
  const allowedLanguagesOptions = problem.allowedLanguages?.map((l: string) => {
    const found = LANGUAGES.find(def => def.value === l);
    return found || { value: l, label: l };
  }) || LANGUAGES;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">


      {/* Breadcrumb */}
      <div className="border-b border-[var(--border-default)] bg-[var(--surface-1)]">
        <div className="w-full px-4 sm:px-6 lg:px-10 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-caption text-[var(--text-muted)]">
              <Link to="/problems" className="hover:text-[var(--brand-primary)] flex items-center gap-1">
                <ChevronLeft className="w-4 h-4" />
                Problems
              </Link>
              <span>/</span>
              <span className="text-[var(--text-primary)]">{problem.title}</span>
            </div>

            {focusLostCount > 0 && (
              <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/30 rounded-full text-red-400 text-xs">
                <AlertTriangle className="w-3 h-3" />
                  <span>Focus Loss: {focusLostCount} times ({totalFocusLostTime}s)</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-10 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-200px)]">
          {/* Left Panel - Problem Statement */}
          <div className="flex flex-col overflow-hidden">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="mb-2">{problem.title}</h2>
                <div className="flex items-center gap-2">
                  <DifficultyBadge difficulty={problem.difficulty} />
                  {problem.tags?.map((tag: string) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 text-caption bg-[var(--surface-2)] text-[var(--text-secondary)] rounded-[var(--radius-sm)]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-4 border-b border-[var(--border-default)]">
              {(['statement', 'tests', 'submissions', 'editorial'] as Tab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`
                    px-4 py-2 text-[0.875rem] font-medium capitalize
                    border-b-2 transition-colors
                    ${activeTab === tab
                      ? 'border-[var(--brand-primary)] text-[var(--brand-primary)]'
                      : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                    }
                  `}
                >
                  {tab === 'statement' ? 'Statement' :
                    tab === 'tests' ? 'Tests' :
                      tab === 'submissions' ? 'Submissions' :
                        'Editorial'}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-[var(--radius-lg)]">
              {activeTab === 'statement' && (
                <div className="prose prose-invert max-w-none">
                  <div className="mb-6 whitespace-pre-wrap text-[var(--text-primary)]">
                    {problem.descriptionMd || problem.statementMd || 'No description provided.'}
                  </div>

                  {problem.examples && problem.examples.length > 0 && (
                    <>
                      <h3 className="mb-3">Examples</h3>
                      {problem.examples.map((example: any, i: number) => (
                        <div key={i} className="mb-4 p-4 bg-[var(--surface-2)] rounded-[var(--radius-md)] font-code text-[0.875rem]">
                          <div className="mb-2">
                            <div className="text-[var(--text-muted)] mb-1">Input:</div>
                            <div className="text-[var(--text-primary)]">{example.input}</div>
                          </div>
                          <div className="mb-2">
                            <div className="text-[var(--text-muted)] mb-1">Output:</div>
                            <div className="text-[var(--text-primary)]">{example.output}</div>
                          </div>
                          {example.explanation && (
                            <div>
                              <div className="text-[var(--text-muted)] mb-1">Explanation:</div>
                              <div className="text-[var(--text-secondary)]">{example.explanation}</div>
                            </div>
                          )}
                        </div>
                      ))}
                    </>
                  )}

                  {problem.constraints && Object.keys(problem.constraints).length > 0 && (
                    <>
                      <h3 className="mb-3">Contraintes</h3>
                      <ul className="space-y-1">
                        {Object.entries(problem.constraints).map(([key, value], i) => (
                          <li key={i} className="text-[var(--text-secondary)] font-code text-[0.875rem]">
                            {key}: {String(value)}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              )}

              {activeTab === 'tests' && (
                <div className="space-y-3">
                  <div className="text-xs text-[var(--text-muted)] bg-[var(--surface-2)] border border-[var(--border-default)] rounded-[var(--radius-md)] px-3 py-2">
                    💡 Each line of the input is a separate argument. Read them with <code className="font-code">stdin.splitlines()</code> (Python) or <code className="font-code">readFileSync('/dev/stdin').split('\n')</code> (JS/TS). JSON arrays are already formatted.
                  </div>
                  {problem.tests && problem.tests.length > 0 ? (
                    problem.tests.map((test: any, i: number) => (
                      <TestCase
                        key={i}
                        number={i + 1}
                        status={test.isHidden ? 'hidden' : 'passed'}
                        input={test.input}
                        expected={test.expectedOutput}
                      />
                    ))
                  ) : (
                    <div className="text-center py-8 text-[var(--text-muted)]">
                      Aucun test public configuré pour ce problème
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'submissions' && (
                <div className="text-center py-8 text-[var(--text-muted)]">
                  Aucune soumission pour le moment
                </div>
              )}

              {activeTab === 'editorial' && (
                <div className="text-center py-8 text-[var(--text-muted)]">
                  L'éditorial sera disponible après votre première soumission acceptée
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Code Editor */}
          <div className="flex flex-col overflow-hidden">
            {/* Editor Toolbar */}
            <div className="mb-4 flex items-center justify-between">
              <Select
                value={language}
                onChange={(e) => {
                  const newLang = e.target.value;
                  setLanguage(newLang);
                  setCode(CODE_TEMPLATES[newLang] || '// Votre code ici\n');
                }}
                options={allowedLanguagesOptions}
              />
              <div className="flex items-center gap-2">
                {problem.hints && problem.hints.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (hintsUsed < problem.hints.length) {
                        toast(problem.hints[hintsUsed], {
                          icon: '💡',
                          duration: 5000,
                          style: {
                            background: 'var(--surface-2)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border-default)',
                          }
                        });
                        setHintsUsed(prev => prev + 1);
                      } else {
                        toast.error('Plus de hints disponibles');
                      }
                    }}
                    disabled={hintsUsed >= problem.hints.length}
                  >
                    <Lightbulb className="w-4 h-4" />
                    Hint ({hintsUsed}/{problem.hints.length})
                  </Button>
                )}
                <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] bg-[var(--surface-2)] px-2 py-1 rounded">
                  <Clock size={14} />
                  <span>{timeRemaining}m restant</span>
                </div>
                <Button variant="secondary" size="sm" onClick={handleRun} loading={isRunning}>
                  <Play className="w-4 h-4" />
                  Run
                </Button>
                <Button variant="primary" size="sm" onClick={handleSubmit} loading={isRunning}>
                  <Send className="w-4 h-4" />
                  Submit
                </Button>
              </div>
            </div>

            {/* Code Editor */}
            <div className="flex-1 flex flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-default)] relative">
              {!isFullScreen && (
                <div className="absolute inset-0 z-50 bg-[var(--surface-1)]/95 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6">
                  <AlertTriangle className="w-12 h-12 text-yellow-500 mb-4" />
                  <h3 className="text-xl font-bold mb-2">Full Screen Mode Required</h3>
                  <p className="text-[var(--text-secondary)] mb-6 max-w-md">
                    To ensure fair testing, the editor is locked. Please enable full screen mode to continue.
                  </p>
                  <Button
                    size="lg"
                    variant="primary"
                    onClick={() => document.documentElement.requestFullscreen()}
                  >
                    Enable Full Screen Mode
                  </Button>
                </div>
              )}

              <div className="bg-[var(--surface-1)] px-4 py-2 border-b border-[var(--border-default)] flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[var(--state-error)]" />
                  <div className="w-3 h-3 rounded-full bg-[var(--state-warning)]" />
                  <div className="w-3 h-3 rounded-full bg-[var(--state-success)]" />
                </div>
                <span className="text-caption text-[var(--text-muted)] ml-2 font-code">
                  solution.{LANG_EXTENSIONS[language] || language}
                </span>
              </div>

              <Editor
                key={language}
                height="100%"
                language={language}
                theme={editorTheme || 'vs-dark'}
                defaultValue={code}
                path={`solution.${LANG_EXTENSIONS[language] || language}`}
                onChange={(value) => setCode(value || '')}
                beforeMount={(monaco) => {
                  // Register all custom themes (monokai, dracula, github-dark, …)
                  defineMonacoThemes(monaco);
                  // Register autocomplete providers for all languages
                  const kindMap: Record<string, number> = {
                    Function: monaco.languages.CompletionItemKind.Function,
                    Method: monaco.languages.CompletionItemKind.Method,
                    Class: monaco.languages.CompletionItemKind.Class,
                    Keyword: monaco.languages.CompletionItemKind.Keyword,
                    Module: monaco.languages.CompletionItemKind.Module,
                    Snippet: monaco.languages.CompletionItemKind.Snippet,
                  };
                  Object.entries(LANG_COMPLETIONS).forEach(([lang, completions]) => {
                    monaco.languages.registerCompletionItemProvider(lang, {
                      provideCompletionItems: (model, position) => {
                        const word = model.getWordUntilPosition(position);
                        const range = {
                          startLineNumber: position.lineNumber,
                          endLineNumber: position.lineNumber,
                          startColumn: word.startColumn,
                          endColumn: word.endColumn,
                        };
                        return {
                          suggestions: completions.map((c) => ({
                            label: c.label,
                            kind: kindMap[c.kind] || monaco.languages.CompletionItemKind.Text,
                            insertText: c.insertText,
                            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                            detail: c.detail || '',
                            range,
                          })),
                        };
                      },
                    });
                  });
                }}
                onMount={(editor) => {
                  editor.updateOptions({ contextmenu: false });
                  editor.onKeyDown((e) => {
                    const { keyCode, ctrlKey, metaKey } = e;
                    if ((ctrlKey || metaKey) && (keyCode === 33 || keyCode === 52)) {
                      e.preventDefault();
                      e.stopPropagation();
                      toast.error('Copy-paste disabled in editor', { icon: '🚫' });
                    }
                  });
                }}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  padding: { top: 16, bottom: 16 },
                }}
              />
            </div>

            {/* Console / Results */}
            {showResults && submissionResult && (
              <div className="mt-4 p-4 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-[var(--radius-lg)]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {submissionResult.verdict === 'AC' ? (
                      <CheckCircle2 className="w-5 h-5 text-[var(--state-success)]" />
                    ) : (
                      <XCircle className="w-5 h-5 text-[var(--state-error)]" />
                    )}
                    <span className="font-semibold text-[var(--text-primary)]">
                      Tests Passed: {submissionResult.testsPassed || 0}/{submissionResult.testsTotal || problem.tests?.length || 0}
                    </span>
                  </div>
                  <VerdictBadge verdict={submissionResult.verdict === 'AC' ? 'ACCEPTED' : submissionResult.verdict === 'WA' ? 'WRONG_ANSWER' : submissionResult.verdict || 'PENDING'} />
                </div>

                {submissionResult.stdout && (
                  <div className="mb-4">
                    <span className="text-[var(--text-muted)] text-sm mb-1 block">Console stdout:</span>
                    <pre className="p-3 bg-[var(--surface-2)] rounded font-code text-sm text-[var(--text-primary)] whitespace-pre-wrap">
                      {submissionResult.stdout}
                    </pre>
                  </div>
                )}

                {submissionResult.stderr && (
                  <div className="mb-4">
                    <span className="text-[var(--text-muted)] text-sm mb-1 block">Console stderr / Debug:</span>
                    <pre className="p-3 bg-[var(--state-error)]/10 border border-[var(--state-error)]/30 rounded font-code text-sm text-[var(--state-error)] whitespace-pre-wrap">
                      {submissionResult.stderr}
                    </pre>
                  </div>
                )}

                {submissionResult.firstFailedTest && (
                  <div className="mb-4 p-3 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-[var(--radius-md)]">
                    <div className="text-sm font-medium text-[var(--text-primary)] mb-2">
                      First failing test (debug)
                    </div>
                    <div className="font-code text-xs space-y-1">
                      <div>
                        <span className="text-[var(--text-muted)]">Input:</span>
                        <span className="ml-2 text-[var(--text-primary)] whitespace-pre-wrap">
                          {submissionResult.firstFailedTest.input}
                        </span>
                      </div>
                      <div>
                        <span className="text-[var(--text-muted)]">Expected:</span>
                        <span className="ml-2 text-[var(--text-primary)] whitespace-pre-wrap">
                          {submissionResult.firstFailedTest.expectedOutput}
                        </span>
                      </div>
                      <div>
                        <span className="text-[var(--text-muted)]">Actual:</span>
                        <span className="ml-2 text-[var(--text-primary)] whitespace-pre-wrap">
                          {submissionResult.firstFailedTest.actualOutput}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-caption">
                  <div>
                    <span className="text-[var(--text-muted)]">Runtime:</span>
                    <span className="ml-2 font-code text-[var(--text-primary)]">
                      {submissionResult.timeMs ? `${Math.round(submissionResult.timeMs)}ms` : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)]">Memory:</span>
                    <span className="ml-2 font-code text-[var(--text-primary)]">
                      {submissionResult.memMb ? `${Math.round(submissionResult.memMb)}MB` : 'N/A'}
                    </span>
                  </div>
                </div>

                {submissionResult.id && submissionResult.verdict === 'AC' && (
                  <div className="mt-4 pt-4 border-t border-[var(--border-default)]">
                    {!aiReview && (
                      <Button
                        variant="secondary"
                        className="w-full flex items-center justify-center gap-2 text-[var(--brand-primary)] border-[var(--brand-primary)]/30 hover:bg-[var(--brand-primary)]/10"
                        onClick={handleGetAiReview}
                        loading={loadingAiReview}
                      >
                        <Sparkles className="w-4 h-4" />
                        Get AI code analysis (Gemini)
                      </Button>
                    )}
                    
                    {aiReview && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 font-bold text-lg">
                          <Sparkles className="text-[var(--brand-primary)]" />
                          <span>AI Analysis (Score: {aiReview.score}/100)</span>
                        </div>
                        <p className="text-sm text-[var(--text-secondary)]">
                          {aiReview.summary}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-[var(--state-success)]/10 border border-[var(--state-success)]/20 p-3 rounded-lg">
                            <h4 className="text-sm font-semibold text-[var(--state-success)] mb-2 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Strengths</h4>
                            <ul className="list-disc list-inside text-xs space-y-1 text-[var(--text-secondary)]">
                              {aiReview.strengths?.map((s: string, i: number) => <li key={i}>{s}</li>)}
                            </ul>
                          </div>
                          <div className="bg-[var(--state-warning)]/10 border border-[var(--state-warning)]/20 p-3 rounded-lg">
                            <h4 className="text-sm font-semibold text-[var(--state-warning)] mb-2 flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> Improvements</h4>
                            <ul className="list-disc list-inside text-xs space-y-1 text-[var(--text-secondary)]">
                              {aiReview.improvements?.map((s: string, i: number) => <li key={i}>{s}</li>)}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {!isFullScreen && (
        <div className="w-full px-4 sm:px-6 lg:px-10 py-2">
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 flex items-center justify-between text-yellow-500 text-sm">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Full screen mode is recommended for this challenge.</span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="text-yellow-500 hover:bg-yellow-500/20"
              onClick={() => document.documentElement.requestFullscreen()}
            >
              Enable full screen
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function TestCase({
  number,
  status,
  input,
  output,
  expected,
  time
}: {
  number?: number;
  status: 'passed' | 'failed' | 'hidden';
  input?: string;
  output?: string;
  expected?: string;
  time?: string;
}) {
  if (status === 'hidden') {
    return (
      <div className="p-4 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-[var(--radius-md)]">
        <div className="flex items-center gap-2 text-[var(--text-muted)]">
          <Info className="w-4 h-4" />
          <span>Test caché #{number || '?'}</span>
        </div>
      </div>
    );
  }

  const icon = status === 'passed'
    ? <CheckCircle2 className="w-5 h-5 text-[var(--state-success)]" />
    : <XCircle className="w-5 h-5 text-[var(--state-error)]" />;

  return (
    <div className={`
      p-4 border rounded-[var(--radius-md)]
      ${status === 'passed'
        ? 'bg-[var(--state-success)]/5 border-[var(--state-success)]/20'
        : 'bg-[var(--state-error)]/5 border-[var(--state-error)]/20'
      }
    `}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium text-[var(--text-primary)]">
            Test #{number}
          </span>
        </div>
        {time && (
          <div className="flex items-center gap-1 text-caption text-[var(--text-muted)]">
            <Clock className="w-3 h-3" />
            {time}
          </div>
        )}
      </div>
      <div className="font-code text-[0.75rem] space-y-1">
        <div>
          <span className="text-[var(--text-muted)]">Input:</span>
          <span className="ml-2 text-[var(--text-primary)] whitespace-pre-wrap">{input}</span>
        </div>
        {output && (
          <div>
            <span className="text-[var(--text-muted)]">Output:</span>
            <span className="ml-2 text-[var(--text-primary)]">{output}</span>
          </div>
        )}
        {expected && (
          <div>
            <span className="text-[var(--text-muted)]">Expected:</span>
            <span className="ml-2 text-[var(--text-primary)] whitespace-pre-wrap">{expected}</span>
          </div>
        )}
      </div>
    </div>
  );
}
