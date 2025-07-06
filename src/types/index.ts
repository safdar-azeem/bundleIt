export interface FileNode {
   name: string
   path: string
   isDirectory: boolean
   isFile: boolean
   children?: FileNode[]
}

export interface Toast {
   show: boolean
   message: string
   type: 'success' | 'error' | 'info'
}

export interface SaveResult {
   filePath: string
   success: boolean
}

export interface FileOperation {
   filePath: string
   success: boolean
}

export interface Task {
   id: string
   title: string
   description: string
   status: 'todo' | 'inProgress' | 'completed'
   position: number
   createdAt: number
   updatedAt: number
}

export interface ProjectTasks {
   [projectPath: string]: Task[]
}
