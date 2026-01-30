#!/usr/bin/env bun
/**
 * Comprehensive test script for Open Sunsama MCP Server
 *
 * This script tests all MCP tools by making direct API calls and verifying
 * the responses. It requires a running API server and valid API key.
 *
 * Usage:
 *   OPENSUNSAMA_API_KEY=os_xxx bun run tests/test-all.ts
 *   OPENSUNSAMA_API_KEY=os_xxx OPENSUNSAMA_API_URL=http://localhost:3001 bun run tests/test-all.ts
 */

import { ApiClient } from "../src/lib/api-client.js";

const API_KEY = process.env.OPENSUNSAMA_API_KEY;
const API_URL = process.env.OPENSUNSAMA_API_URL || "http://localhost:3001";

if (!API_KEY) {
  console.error("Error: OPENSUNSAMA_API_KEY environment variable is required");
  process.exit(1);
}

const client = new ApiClient({ baseUrl: API_URL, apiKey: API_KEY });

// Test state tracking
let passCount = 0;
let failCount = 0;
const createdTaskIds: string[] = [];
const createdTimeBlockIds: string[] = [];
const createdSubtaskIds: string[] = [];

function log(message: string) {
  console.log(message);
}

function pass(testName: string, details?: string) {
  passCount++;
  console.log(`  ✓ ${testName}${details ? ` - ${details}` : ""}`);
}

function fail(testName: string, error: string) {
  failCount++;
  console.log(`  ✗ ${testName} - ${error}`);
}

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

function getTomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

// ============================================================
// TASK TESTS
// ============================================================
async function testTasks() {
  log("\n📋 Testing Task Operations\n");

  // Test: Create task
  try {
    const response = await client.createTask({
      title: "MCP Test Task",
      notes: "Created by MCP test script",
      scheduledDate: getToday(),
      priority: "P1",
      estimatedMins: 30,
    });
    if (response.success && response.data) {
      createdTaskIds.push(response.data.id);
      pass("Create task", `ID: ${response.data.id}`);
    } else {
      fail("Create task", response.error?.message || "Unknown error");
    }
  } catch (e) {
    fail("Create task", String(e));
  }

  // Test: Create backlog task
  try {
    const response = await client.createTask({
      title: "MCP Backlog Task",
      priority: "P3",
    });
    if (response.success && response.data) {
      createdTaskIds.push(response.data.id);
      pass("Create backlog task", `ID: ${response.data.id}`);
    } else {
      fail("Create backlog task", response.error?.message || "Unknown error");
    }
  } catch (e) {
    fail("Create backlog task", String(e));
  }

  // Test: List tasks
  try {
    const response = await client.listTasks({ date: getToday() });
    if (response.success && response.data) {
      pass("List tasks by date", `Found ${response.data.length} tasks`);
    } else {
      fail("List tasks by date", response.error?.message || "Unknown error");
    }
  } catch (e) {
    fail("List tasks by date", String(e));
  }

  // Test: List backlog tasks
  try {
    const response = await client.listTasks({ backlog: true });
    if (response.success && response.data) {
      pass("List backlog tasks", `Found ${response.data.length} tasks`);
    } else {
      fail("List backlog tasks", response.error?.message || "Unknown error");
    }
  } catch (e) {
    fail("List backlog tasks", String(e));
  }

  // Test: Get single task
  if (createdTaskIds.length > 0) {
    try {
      const response = await client.getTask(createdTaskIds[0]);
      if (response.success && response.data) {
        pass("Get task by ID", `Title: ${response.data.title}`);
      } else {
        fail("Get task by ID", response.error?.message || "Unknown error");
      }
    } catch (e) {
      fail("Get task by ID", String(e));
    }
  }

  // Test: Update task
  if (createdTaskIds.length > 0) {
    try {
      const response = await client.updateTask(createdTaskIds[0], {
        title: "MCP Test Task (Updated)",
        priority: "P0",
      });
      if (response.success && response.data) {
        pass(
          "Update task",
          `New title: ${response.data.title}, Priority: ${response.data.priority}`
        );
      } else {
        fail("Update task", response.error?.message || "Unknown error");
      }
    } catch (e) {
      fail("Update task", String(e));
    }
  }

  // Test: Complete task
  if (createdTaskIds.length > 0) {
    try {
      const response = await client.updateTask(createdTaskIds[0], {
        completedAt: new Date().toISOString(),
      });
      if (response.success && response.data && response.data.completedAt) {
        pass("Complete task", `Completed at: ${response.data.completedAt}`);
      } else {
        fail("Complete task", response.error?.message || "Task not marked complete");
      }
    } catch (e) {
      fail("Complete task", String(e));
    }
  }

  // Test: Uncomplete task
  if (createdTaskIds.length > 0) {
    try {
      const response = await client.updateTask(createdTaskIds[0], {
        completedAt: null,
      });
      if (response.success && response.data && !response.data.completedAt) {
        pass("Uncomplete task", "Task reopened");
      } else {
        fail("Uncomplete task", response.error?.message || "Task still completed");
      }
    } catch (e) {
      fail("Uncomplete task", String(e));
    }
  }

  // Test: Schedule task (move to tomorrow)
  if (createdTaskIds.length > 0) {
    try {
      const response = await client.updateTask(createdTaskIds[0], {
        scheduledDate: getTomorrow(),
      });
      if (response.success && response.data) {
        pass("Schedule task", `Moved to: ${response.data.scheduledDate}`);
      } else {
        fail("Schedule task", response.error?.message || "Unknown error");
      }
    } catch (e) {
      fail("Schedule task", String(e));
    }
  }
}

// ============================================================
// SUBTASK TESTS
// ============================================================
async function testSubtasks() {
  log("\n📝 Testing Subtask Operations\n");

  if (createdTaskIds.length === 0) {
    fail("Subtask tests", "No tasks created to test subtasks");
    return;
  }

  const parentTaskId = createdTaskIds[0];

  // Test: Create subtask
  try {
    const response = await client.createSubtask(parentTaskId, {
      title: "Subtask 1",
    });
    if (response.success && response.data) {
      createdSubtaskIds.push(response.data.id);
      pass("Create subtask", `ID: ${response.data.id}`);
    } else {
      fail("Create subtask", response.error?.message || "Unknown error");
    }
  } catch (e) {
    fail("Create subtask", String(e));
  }

  // Test: Create second subtask
  try {
    const response = await client.createSubtask(parentTaskId, {
      title: "Subtask 2",
      position: 0,
    });
    if (response.success && response.data) {
      createdSubtaskIds.push(response.data.id);
      pass("Create subtask with position", `ID: ${response.data.id}`);
    } else {
      fail("Create subtask with position", response.error?.message || "Unknown error");
    }
  } catch (e) {
    fail("Create subtask with position", String(e));
  }

  // Test: List subtasks
  try {
    const response = await client.listSubtasks(parentTaskId);
    if (response.success && response.data) {
      pass("List subtasks", `Found ${response.data.length} subtasks`);
    } else {
      fail("List subtasks", response.error?.message || "Unknown error");
    }
  } catch (e) {
    fail("List subtasks", String(e));
  }

  // Test: Update subtask (toggle completion)
  if (createdSubtaskIds.length > 0) {
    try {
      const response = await client.updateSubtask(
        parentTaskId,
        createdSubtaskIds[0],
        { completed: true }
      );
      if (response.success && response.data && response.data.completed) {
        pass("Complete subtask", "Subtask marked complete");
      } else {
        fail("Complete subtask", response.error?.message || "Unknown error");
      }
    } catch (e) {
      fail("Complete subtask", String(e));
    }
  }

  // Test: Update subtask title
  if (createdSubtaskIds.length > 0) {
    try {
      const response = await client.updateSubtask(
        parentTaskId,
        createdSubtaskIds[0],
        { title: "Subtask 1 (Updated)" }
      );
      if (response.success && response.data) {
        pass("Update subtask title", `New title: ${response.data.title}`);
      } else {
        fail("Update subtask title", response.error?.message || "Unknown error");
      }
    } catch (e) {
      fail("Update subtask title", String(e));
    }
  }

  // Test: Delete subtask
  if (createdSubtaskIds.length > 1) {
    try {
      const response = await client.deleteSubtask(
        parentTaskId,
        createdSubtaskIds[1]
      );
      if (response.success) {
        pass("Delete subtask", `Deleted: ${createdSubtaskIds[1]}`);
      } else {
        fail("Delete subtask", response.error?.message || "Unknown error");
      }
    } catch (e) {
      fail("Delete subtask", String(e));
    }
  }
}

// ============================================================
// TIME BLOCK TESTS
// ============================================================
async function testTimeBlocks() {
  log("\n⏰ Testing Time Block Operations\n");

  // Test: Create time block
  try {
    const response = await client.createTimeBlock({
      title: "MCP Test Block",
      date: getToday(),
      startTime: "09:00",
      endTime: "10:30",
      description: "Created by MCP test script",
      color: "#3B82F6",
    });
    if (response.success && response.data) {
      createdTimeBlockIds.push(response.data.id);
      pass("Create time block", `ID: ${response.data.id}`);
    } else {
      fail("Create time block", response.error?.message || "Unknown error");
    }
  } catch (e) {
    fail("Create time block", String(e));
  }

  // Test: Create time block linked to task
  if (createdTaskIds.length > 0) {
    try {
      const response = await client.createTimeBlock({
        title: "MCP Linked Block",
        date: getToday(),
        startTime: "14:00",
        endTime: "15:30",
        taskId: createdTaskIds[0],
      });
      if (response.success && response.data) {
        createdTimeBlockIds.push(response.data.id);
        pass("Create linked time block", `Linked to task: ${createdTaskIds[0]}`);
      } else {
        fail("Create linked time block", response.error?.message || "Unknown error");
      }
    } catch (e) {
      fail("Create linked time block", String(e));
    }
  }

  // Test: List time blocks
  try {
    const response = await client.listTimeBlocks({ date: getToday() });
    if (response.success && response.data) {
      pass("List time blocks by date", `Found ${response.data.length} blocks`);
    } else {
      fail("List time blocks by date", response.error?.message || "Unknown error");
    }
  } catch (e) {
    fail("List time blocks by date", String(e));
  }

  // Test: Get single time block
  if (createdTimeBlockIds.length > 0) {
    try {
      const response = await client.getTimeBlock(createdTimeBlockIds[0]);
      if (response.success && response.data) {
        pass("Get time block by ID", `Title: ${response.data.title}`);
      } else {
        fail("Get time block by ID", response.error?.message || "Unknown error");
      }
    } catch (e) {
      fail("Get time block by ID", String(e));
    }
  }

  // Test: Update time block
  if (createdTimeBlockIds.length > 0) {
    try {
      const response = await client.updateTimeBlock(createdTimeBlockIds[0], {
        title: "MCP Test Block (Updated)",
        startTime: "10:00",
        endTime: "11:30",
      });
      if (response.success && response.data) {
        pass(
          "Update time block",
          `New time: ${response.data.startTime}-${response.data.endTime}`
        );
      } else {
        fail("Update time block", response.error?.message || "Unknown error");
      }
    } catch (e) {
      fail("Update time block", String(e));
    }
  }

  // Test: Link task to time block
  if (createdTimeBlockIds.length > 0 && createdTaskIds.length > 0) {
    try {
      const response = await client.updateTimeBlock(createdTimeBlockIds[0], {
        taskId: createdTaskIds[0],
      });
      if (response.success && response.data && response.data.taskId) {
        pass("Link task to time block", `Linked to: ${response.data.taskId}`);
      } else {
        fail("Link task to time block", response.error?.message || "Unknown error");
      }
    } catch (e) {
      fail("Link task to time block", String(e));
    }
  }

  // Test: Unlink task from time block
  if (createdTimeBlockIds.length > 0) {
    try {
      const response = await client.updateTimeBlock(createdTimeBlockIds[0], {
        taskId: null,
      });
      if (response.success && response.data && !response.data.taskId) {
        pass("Unlink task from time block", "Task unlinked");
      } else {
        fail("Unlink task from time block", response.error?.message || "Unknown error");
      }
    } catch (e) {
      fail("Unlink task from time block", String(e));
    }
  }
}

// ============================================================
// USER TESTS
// ============================================================
async function testUser() {
  log("\n👤 Testing User Operations\n");

  // Test: Get user profile
  try {
    const response = await client.getMe();
    if (response.success && response.data) {
      pass("Get user profile", `Email: ${response.data.email}`);
    } else {
      fail("Get user profile", response.error?.message || "Unknown error");
    }
  } catch (e) {
    fail("Get user profile", String(e));
  }

  // Test: Update user profile (timezone)
  try {
    const response = await client.updateMe({
      timezone: "America/New_York",
    });
    if (response.success && response.data) {
      pass("Update user timezone", `Timezone: ${response.data.timezone}`);
    } else {
      fail("Update user timezone", response.error?.message || "Unknown error");
    }
  } catch (e) {
    fail("Update user timezone", String(e));
  }
}

// ============================================================
// CLEANUP
// ============================================================
async function cleanup() {
  log("\n🧹 Cleaning up test data\n");

  // Delete time blocks
  for (const id of createdTimeBlockIds) {
    try {
      const response = await client.deleteTimeBlock(id);
      if (response.success) {
        pass("Delete time block", id);
      } else {
        fail("Delete time block", `${id}: ${response.error?.message}`);
      }
    } catch (e) {
      fail("Delete time block", `${id}: ${String(e)}`);
    }
  }

  // Delete tasks (subtasks are deleted automatically)
  for (const id of createdTaskIds) {
    try {
      const response = await client.deleteTask(id);
      if (response.success) {
        pass("Delete task", id);
      } else {
        fail("Delete task", `${id}: ${response.error?.message}`);
      }
    } catch (e) {
      fail("Delete task", `${id}: ${String(e)}`);
    }
  }
}

// ============================================================
// MAIN
// ============================================================
async function main() {
  console.log("═".repeat(60));
  console.log("  Open Sunsama MCP Server - Test Suite");
  console.log("═".repeat(60));
  console.log(`\nAPI URL: ${API_URL}`);
  console.log(`API Key: ${API_KEY?.substring(0, 10)}...`);
  console.log(`Date: ${getToday()}`);

  try {
    await testTasks();
    await testSubtasks();
    await testTimeBlocks();
    await testUser();
    await cleanup();

    console.log("\n" + "═".repeat(60));
    console.log("  Test Results");
    console.log("═".repeat(60));
    console.log(`\n  ✓ Passed: ${passCount}`);
    console.log(`  ✗ Failed: ${failCount}`);
    console.log(`  Total: ${passCount + failCount}\n`);

    if (failCount > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error("\nFatal error:", error);
    process.exit(1);
  }
}

main();
