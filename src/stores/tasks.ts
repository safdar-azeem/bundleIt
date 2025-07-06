import { ref, computed, watch } from 'vue'
import type { Task, ProjectTasks } from '../types'

const STORAGE_KEY = 'bundleit-tasks'

const loadTasks = (): ProjectTasks => {
   try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : {}
   } catch (error) {
      console.error('Failed to load tasks:', error)
      return {}
   }
}

const projectTasks = ref<ProjectTasks>(loadTasks())

watch(
   projectTasks,
   (newTasks) => {
      try {
         localStorage.setItem(STORAGE_KEY, JSON.stringify(newTasks))
      } catch (error) {
         console.error('Failed to save tasks:', error)
      }
   },
   { deep: true }
)

export const useTasks = () => {
   const generateId = (): string => {
      return Date.now().toString(36) + Math.random().toString(36).substr(2)
   }

   const getProjectTasks = (projectPath: string): Task[] => {
      if (!projectPath) return []
      return projectTasks.value[projectPath] || []
   }

   const addTask = (
      projectPath: string,
      taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>
   ): Task => {
      if (!projectPath) throw new Error('Project path is required')

      const now = Date.now()
      const newTask: Task = {
         ...taskData,
         id: generateId(),
         createdAt: now,
         updatedAt: now,
      }

      if (!projectTasks.value[projectPath]) {
         projectTasks.value[projectPath] = []
      }

      projectTasks.value[projectPath].unshift(newTask)
      return newTask
   }

   const updateTask = (
      projectPath: string,
      taskId: string,
      updates: Partial<Omit<Task, 'id' | 'createdAt'>>
   ): boolean => {
      if (!projectPath || !projectTasks.value[projectPath]) return false

      const taskIndex = projectTasks.value[projectPath].findIndex((task) => task.id === taskId)
      if (taskIndex === -1) return false

      projectTasks.value[projectPath][taskIndex] = {
         ...projectTasks.value[projectPath][taskIndex],
         ...updates,
         updatedAt: Date.now(),
      }

      return true
   }

   const deleteTask = (projectPath: string, taskId: string): boolean => {
      if (!projectPath || !projectTasks.value[projectPath]) return false

      const taskIndex = projectTasks.value[projectPath].findIndex((task) => task.id === taskId)
      if (taskIndex === -1) return false

      projectTasks.value[projectPath].splice(taskIndex, 1)
      return true
   }

   const toggleTaskStatus = (projectPath: string, taskId: string): boolean => {
      if (!projectPath || !projectTasks.value[projectPath]) return false

      const task = projectTasks.value[projectPath].find((task) => task.id === taskId)
      if (!task) return false

      const statusOrder: Task['status'][] = ['todo', 'inProgress', 'completed']
      const currentIndex = statusOrder.indexOf(task.status)
      const nextIndex = (currentIndex + 1) % statusOrder.length

      return updateTask(projectPath, taskId, { status: statusOrder[nextIndex] })
   }

   const getTasksByStatus = (projectPath: string, status: Task['status']): Task[] => {
      return getProjectTasks(projectPath).filter((task) => task.status === status)
   }

   const searchTasks = (projectPath: string, query: string): Task[] => {
      if (!query.trim()) return getProjectTasks(projectPath)

      const lowercaseQuery = query.toLowerCase()
      return getProjectTasks(projectPath).filter(
         (task) =>
            task.title.toLowerCase().includes(lowercaseQuery) ||
            task.description.toLowerCase().includes(lowercaseQuery)
      )
   }

   const getTaskStats = (projectPath: string) => {
      const tasks = getProjectTasks(projectPath)
      return {
         total: tasks.length,
         todo: tasks.filter((t) => t.status === 'todo').length,
         inProgress: tasks.filter((t) => t.status === 'inProgress').length,
         completed: tasks.filter((t) => t.status === 'completed').length,
      }
   }

   const clearProjectTasks = (projectPath: string): void => {
      if (projectTasks.value[projectPath]) {
         delete projectTasks.value[projectPath]
      }
   }

   const setTasks = (projectPath: string, tasks: Task[]): void => {
      projectTasks.value[projectPath] = tasks
   }

   return {
      projectTasks: computed(() => projectTasks.value),
      getProjectTasks,
      setTasks,
      addTask,
      updateTask,
      deleteTask,
      toggleTaskStatus,
      getTasksByStatus,
      searchTasks,
      getTaskStats,
      clearProjectTasks,
   }
}
