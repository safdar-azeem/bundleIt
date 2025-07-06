import type { Task } from '../types'

export interface DragDropConfig {
   debounceDelay: number
   batchUpdateSize: number
   animationDuration: number

   ghostClass: string
   chosenClass: string
   dragClass: string

   scrollSensitivity: number
   scrollSpeed: number
   swapThreshold: number
   emptyInsertThreshold: number

   maxTasksPerColumn: number
   allowCrossColumnDrag: boolean

   statusFlow: Record<Task['status'], Task['status'][]>
}

export const defaultDragDropConfig: DragDropConfig = {
   debounceDelay: 100,
   batchUpdateSize: 50,
   animationDuration: 200,

   ghostClass: 'ghost-task',
   chosenClass: 'chosen-task',
   dragClass: 'drag-task',

   scrollSensitivity: 100,
   scrollSpeed: 20,
   swapThreshold: 0.65,
   emptyInsertThreshold: 5,

   maxTasksPerColumn: 100,
   allowCrossColumnDrag: true,

   statusFlow: {
      todo: ['todo', 'inProgress'],
      inProgress: ['todo', 'inProgress', 'completed'],
      completed: ['inProgress', 'completed'],
   },
}

export const boardConfigs: Record<
   Task['status'],
   {
      icon: string
      iconClass: string
      dotClass: string
      bgClass: string
      borderClass: string
      maxItems?: number
   }
> = {
   todo: {
      icon: 'lucide:circle',
      iconClass: 'text-gray-500',
      dotClass: 'bg-gray-400',
      bgClass: 'bg-gray-50',
      borderClass: 'border-gray-200',
      maxItems: 20,
   },
   inProgress: {
      icon: 'lucide:clock',
      iconClass: 'text-blue-500',
      dotClass: 'bg-blue-500',
      bgClass: 'bg-blue-50',
      borderClass: 'border-blue-200',
      maxItems: 5,
   },
   completed: {
      icon: 'lucide:check-circle',
      iconClass: 'text-green-500',
      dotClass: 'bg-green-500',
      bgClass: 'bg-green-50',
      borderClass: 'border-green-200',
   },
}

export const validateStatusTransition = (
   fromStatus: Task['status'],
   toStatus: Task['status'],
   config: DragDropConfig = defaultDragDropConfig
): boolean => {
   if (!config.allowCrossColumnDrag && fromStatus !== toStatus) {
      return false
   }

   const allowedTransitions = config.statusFlow[fromStatus]
   return allowedTransitions?.includes(toStatus) ?? true
}

export const validateColumnCapacity = (
   status: Task['status'],
   currentCount: number,
   config: DragDropConfig = defaultDragDropConfig
): boolean => {
   const boardConfig = boardConfigs[status]
   const maxItems = boardConfig.maxItems ?? config.maxTasksPerColumn
   return currentCount < maxItems
}

export const shouldBatchUpdate = (
   updateCount: number,
   config: DragDropConfig = defaultDragDropConfig
): boolean => {
   return updateCount >= config.batchUpdateSize
}

export const getDragOptions = (config: DragDropConfig = defaultDragDropConfig) => ({
   group: 'kanban-tasks',
   animation: config.animationDuration,
   ghostClass: config.ghostClass,
   dragClass: config.dragClass,
   scroll: true,
   scrollSensitivity: config.scrollSensitivity,
   scrollSpeed: config.scrollSpeed,
   forceFallback: false,
   fallbackOnBody: true,
   swapThreshold: config.swapThreshold,
   emptyInsertThreshold: config.emptyInsertThreshold,
   // Performance optimizations
   removeCloneOnHide: true,
   preventOnFilter: true,
   chosenClass: config.chosenClass,
   'aria-describedby': 'drag-instructions',
})
