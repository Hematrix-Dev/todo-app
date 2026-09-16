import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@todo_app_tasks_v1";

const categories = ["Study", "Personal", "Work", "Other"];
const priorities = ["High", "Medium", "Low"];

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [category, setCategory] = useState("Study");
  const [priority, setPriority] = useState("Medium");

  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    if (loaded) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    }
  }, [tasks, loaded]);

  async function loadTasks() {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);

      if (saved) {
        setTasks(JSON.parse(saved));
      }
    } catch (error) {
      console.log("Could not load tasks:", error);
    } finally {
      setLoaded(true);
    }
  }

  function resetForm() {
    setTitle("");
    setDate("");
    setTime("");
    setCategory("Study");
    setPriority("Medium");
    setEditingId(null);
  }

  function addOrUpdateTask() {
    if (!title.trim()) {
      Alert.alert("Task required", "Please enter a task name.");
      return;
    }

    if (editingId) {
      setTasks((current) =>
        current.map((task) =>
          task.id === editingId
            ? {
                ...task,
                title: title.trim(),
                date,
                time,
                category,
                priority,
              }
            : task
        )
      );

      resetForm();
      return;
    }

    const newTask = {
      id: Date.now().toString(),
      title: title.trim(),
      date,
      time,
      category,
      priority,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    setTasks((current) => [newTask, ...current]);
    resetForm();
  }

  function toggleTask(id) {
    setTasks((current) =>
      current.map((task) =>
        task.id === id
          ? { ...task, completed: !task.completed }
          : task
      )
    );
  }

  function deleteTask(id) {
    setTasks((current) => current.filter((task) => task.id !== id));
  }

  function startEditing(task) {
    setEditingId(task.id);
    setTitle(task.title);
    setDate(task.date);
    setTime(task.time);
    setCategory(task.category);
    setPriority(task.priority);

    setTimeout(() => {
      scrollRef?.current?.scrollTo({ y: 0, animated: true });
    }, 50);
  }

  function clearCompleted() {
    setTasks((current) => current.filter((task) => !task.completed));
  }

  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    if (filter === "Active") {
      result = result.filter((task) => !task.completed);
    }

    if (filter === "Completed") {
      result = result.filter((task) => task.completed);
    }

    if (filter === "Today") {
      result = result.filter((task) => task.date === getToday());
    }

    if (search.trim()) {
      const query = search.toLowerCase();

      result = result.filter(
        (task) =>
          task.title.toLowerCase().includes(query) ||
          task.category.toLowerCase().includes(query)
      );
    }

    return result;
  }, [tasks, filter, search]);

  const completedCount = tasks.filter((task) => task.completed).length;
  const activeCount = tasks.length - completedCount;

  const todayCount = tasks.filter(
    (task) => task.date === getToday() && !task.completed
  ).length;

  const progress =
    tasks.length === 0
      ? 0
      : Math.round((completedCount / tasks.length) * 100);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.mainArea}>
          <ScrollView
            ref={(ref) => {
              scrollRef = ref;
            }}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* HEADER */}
            <View style={styles.header}>
              <View>
                <Text style={styles.greeting}>Good day 👋</Text>
                <Text style={styles.heading}>My Tasks</Text>
                <Text style={styles.dateText}>{formatToday()}</Text>
              </View>

              <View style={styles.progressCircle}>
                <Text style={styles.progressNumber}>{progress}%</Text>
                <Text style={styles.progressLabel}>done</Text>
              </View>
            </View>

            {/* STATS */}
            <View style={styles.statsRow}>
              <StatBox number={activeCount} label="Active" />
              <StatBox number={todayCount} label="Today" />
              <StatBox number={completedCount} label="Completed" />
            </View>

            {/* ADD / EDIT TASK */}
            <View style={styles.formCard}>
              <Text style={styles.sectionTitle}>
                {editingId ? "Edit Task ✏️" : "Add New Task ➕"}
              </Text>

              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="What do you need to do?"
                placeholderTextColor="#777"
                style={styles.titleInput}
              />

              <View style={styles.inputRow}>
                <View style={styles.halfInput}>
                  <Text style={styles.inputLabel}>📅 Date</Text>

                  <TextInput
                    value={date}
                    onChangeText={setDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#777"
                    style={styles.smallInput}
                    keyboardType="numbers-and-punctuation"
                  />
                </View>

                <View style={styles.halfInput}>
                  <Text style={styles.inputLabel}>⏰ Time</Text>

                  <TextInput
                    value={time}
                    onChangeText={setTime}
                    placeholder="e.g. 07:00 PM"
                    placeholderTextColor="#777"
                    style={styles.smallInput}
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Category</Text>

              <View style={styles.chipRow}>
                {categories.map((item) => (
                  <Pressable
                    key={item}
                    onPress={() => setCategory(item)}
                    style={[
                      styles.chip,
                      category === item && styles.selectedChip,
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        category === item && styles.selectedChipText,
                      ]}
                    >
                      {item}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.inputLabel}>Priority</Text>

              <View style={styles.chipRow}>
                {priorities.map((item) => (
                  <Pressable
                    key={item}
                    onPress={() => setPriority(item)}
                    style={[
                      styles.chip,
                      priority === item && styles.selectedChip,
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        priority === item && styles.selectedChipText,
                      ]}
                    >
                      {item}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <View style={styles.buttonRow}>
                <Pressable
                  onPress={addOrUpdateTask}
                  style={styles.addButton}
                >
                  <Text style={styles.addButtonText}>
                    {editingId ? "Update Task" : "Add Task"}
                  </Text>
                </Pressable>

                {editingId && (
                  <Pressable
                    onPress={resetForm}
                    style={styles.cancelButton}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </Pressable>
                )}
              </View>
            </View>

            {/* SEARCH */}
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="🔎 Search tasks..."
              placeholderTextColor="#777"
              style={styles.searchInput}
            />

            {/* FILTERS */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterScroll}
            >
              {["All", "Today", "Active", "Completed"].map((item) => (
                <Pressable
                  key={item}
                  onPress={() => setFilter(item)}
                  style={[
                    styles.filterButton,
                    filter === item && styles.activeFilter,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterText,
                      filter === item && styles.activeFilterText,
                    ]}
                  >
                    {item}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* TASK LIST */}
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>
                {filter === "All" ? "Your Tasks" : filter}
              </Text>

              {completedCount > 0 && (
                <Pressable onPress={clearCompleted}>
                  <Text style={styles.clearText}>Clear completed</Text>
                </Pressable>
              )}
            </View>

            {filteredTasks.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyEmoji}>📝</Text>

                <Text style={styles.emptyTitle}>No tasks here</Text>

                <Text style={styles.emptyText}>
                  Add a task above and start getting things done.
                </Text>
              </View>
            ) : (
              filteredTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggle={toggleTask}
                  onDelete={deleteTask}
                  onEdit={startEditing}
                />
              ))
            )}
       { /* PRODUCTIVITY LINE */}
<Text style={styles.bottomFooterText}>
  {tasks.length === 0
    ? "Your productivity starts here."
    : `${completedCount} of ${tasks.length} tasks completed`}
</Text>

</ScrollView>

{/* DEVELOPER FOOTER */}
<View style={styles.bottomFooter}>
  <Text style={styles.developerText}>
    Designed & developed by Hema
  </Text>

  <Text style={styles.copyrightText}>
    © 2026 Hema. All rights reserved.
  </Text>
</View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

let scrollRef = null;

function StatBox({ number, label }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statNumber}>{number}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function TaskCard({ task, onToggle, onDelete, onEdit }) {
  return (
    <View
      style={[
        styles.taskCard,
        task.completed && styles.completedCard,
      ]}
    >
      <Pressable
        onPress={() => onToggle(task.id)}
        style={[
          styles.checkbox,
          task.completed && styles.checkedBox,
        ]}
      >
        {task.completed && (
          <Text style={styles.checkMark}>✓</Text>
        )}
      </Pressable>

      <View style={styles.taskContent}>
        <Text
          style={[
            styles.taskTitle,
            task.completed && styles.completedTaskTitle,
          ]}
        >
          {task.title}
        </Text>

        <View style={styles.taskMeta}>
          {task.date ? (
            <Text style={styles.metaText}>📅 {task.date}</Text>
          ) : null}

          {task.time ? (
            <Text style={styles.metaText}>⏰ {task.time}</Text>
          ) : null}
        </View>

        <View style={styles.badgeRow}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>
              {task.category}
            </Text>
          </View>

          <View
            style={[
              styles.priorityBadge,
              task.priority === "High" && styles.highPriority,
              task.priority === "Low" && styles.lowPriority,
            ]}
          >
            <Text style={styles.priorityText}>
              {task.priority}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.actionColumn}>
        <Pressable
          onPress={() => onEdit(task)}
          style={styles.actionButton}
        >
          <Text>✏️</Text>
        </Pressable>

        <Pressable
          onPress={() => onDelete(task.id)}
          style={styles.actionButton}
        >
          <Text>🗑️</Text>
        </Pressable>
      </View>
    </View>
  );
}

function getToday() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatToday() {
  return new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0B0D12",
  },

  container: {
    flex: 1,
  },

  mainArea: {
    flex: 1,
  },

  scrollContent: {
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
    padding: 20,
    paddingBottom: 25,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 22,
  },

  greeting: {
    color: "#9A9DA8",
    fontSize: 15,
    marginBottom: 4,
  },

  heading: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "800",
  },

  dateText: {
    color: "#7D8290",
    fontSize: 14,
    marginTop: 5,
  },

  progressCircle: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: "#171A22",
    borderWidth: 2,
    borderColor: "#6C63FF",
    alignItems: "center",
    justifyContent: "center",
  },

  progressNumber: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
  },

  progressLabel: {
    color: "#888D9B",
    fontSize: 11,
  },

  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 18,
  },

  statBox: {
    flex: 1,
    backgroundColor: "#151820",
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#232733",
  },

  statNumber: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
  },

  statLabel: {
    color: "#858A98",
    fontSize: 12,
    marginTop: 3,
  },

  formCard: {
    backgroundColor: "#151820",
    borderRadius: 20,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#232733",
  },

  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 14,
  },

  titleInput: {
    backgroundColor: "#0E1016",
    color: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#292D38",
    marginBottom: 14,
  },

  inputRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },

  halfInput: {
    flex: 1,
  },

  inputLabel: {
    color: "#A5A9B4",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 7,
  },

  smallInput: {
    backgroundColor: "#0E1016",
    color: "#FFFFFF",
    borderRadius: 11,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: "#292D38",
    fontSize: 13,
  },

  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 15,
  },

  chip: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#0E1016",
    borderWidth: 1,
    borderColor: "#292D38",
  },

  selectedChip: {
    backgroundColor: "#6C63FF",
    borderColor: "#6C63FF",
  },

  chipText: {
    color: "#9296A3",
    fontSize: 12,
    fontWeight: "600",
  },

  selectedChipText: {
    color: "#FFFFFF",
  },

  buttonRow: {
    flexDirection: "row",
    gap: 10,
  },

  addButton: {
    flex: 1,
    backgroundColor: "#6C63FF",
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
  },

  addButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },

  cancelButton: {
    paddingHorizontal: 18,
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#252934",
  },

  cancelButtonText: {
    color: "#D4D6DD",
    fontWeight: "700",
  },

  searchInput: {
    backgroundColor: "#151820",
    color: "#FFFFFF",
    borderRadius: 13,
    paddingHorizontal: 15,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: "#232733",
    marginBottom: 12,
  },

  filterScroll: {
    marginBottom: 20,
  },

  filterButton: {
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: "#151820",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#252934",
  },

  activeFilter: {
    backgroundColor: "#6C63FF",
    borderColor: "#6C63FF",
  },

  filterText: {
    color: "#858A98",
    fontSize: 12,
    fontWeight: "700",
  },

  activeFilterText: {
    color: "#FFFFFF",
  },

  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  listTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
  },

  clearText: {
    color: "#8E88FF",
    fontSize: 12,
    fontWeight: "700",
  },

  taskCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#151820",
    borderRadius: 17,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#232733",
  },

  completedCard: {
    opacity: 0.62,
  },

  checkbox: {
    width: 25,
    height: 25,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#555B6A",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    marginTop: 2,
  },

  checkedBox: {
    backgroundColor: "#6C63FF",
    borderColor: "#6C63FF",
  },

  checkMark: {
    color: "#FFFFFF",
    fontWeight: "900",
  },

  taskContent: {
    flex: 1,
  },

  taskTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 21,
  },

  completedTaskTitle: {
    textDecorationLine: "line-through",
    color: "#858A98",
  },

  taskMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 7,
  },

  metaText: {
    color: "#858A98",
    fontSize: 11,
  },

  badgeRow: {
    flexDirection: "row",
    gap: 7,
    marginTop: 9,
  },

  categoryBadge: {
    backgroundColor: "#222633",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },

  categoryText: {
    color: "#B6B9C4",
    fontSize: 10,
    fontWeight: "700",
  },

  priorityBadge: {
    backgroundColor: "#332F20",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },

  highPriority: {
    backgroundColor: "#3A2428",
  },

  lowPriority: {
    backgroundColor: "#20312B",
  },

  priorityText: {
    color: "#D5C986",
    fontSize: 10,
    fontWeight: "700",
  },

  actionColumn: {
    marginLeft: 8,
    gap: 5,
  },

  actionButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9,
    backgroundColor: "#20232C",
  },

  emptyCard: {
    backgroundColor: "#151820",
    borderRadius: 18,
    padding: 35,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#232733",
  },

  emptyEmoji: {
    fontSize: 36,
    marginBottom: 10,
  },

  emptyTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
  },

  emptyText: {
    color: "#777C89",
    textAlign: "center",
    marginTop: 7,
    lineHeight: 19,
    fontSize: 12,
  },

  bottomFooterText: {
    color: "#FFFFFF",
    textAlign: "center",
    fontSize: 11,
    marginTop: 8,
  },

  bottomFooter: {
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    marginTop: 100,
  },

  footerText: {
    color: "#555A68",
    textAlign: "center",
    fontSize: 11,
    marginTop: 8,
    marginBottom:0,
  },

  developerText: {
    color: "#8E88FF",
    textAlign: "center",
    fontSize: 11,
    fontWeight: "600",
  },

  copyrightText: {
    color: "#555A68",
    textAlign: "center",
    fontSize: 10,
    marginTop: 4,
  },
});