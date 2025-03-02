import { readTextFile } from '@tauri-apps/plugin-fs'
import { join } from '@tauri-apps/api/path'

export class PathMatcher {
   private gitignorePatterns: Array<{
      pattern: string
      isNegated: boolean
      isDirectory: boolean
   }> = []
   private excludePatterns: string[] = []
   private rootPath: string = ''

   constructor(rootPath: string, excludePatterns: string[] = []) {
      this.rootPath = rootPath
      this.excludePatterns = excludePatterns

      console.log('this.excludePatterns :>> ', this.excludePatterns)
   }

   async initialize(): Promise<void> {
      try {
         const gitignorePath = await join(this.rootPath, '.gitignore')
         const content = await readTextFile(gitignorePath)
         this.gitignorePatterns = this.parseGitignore(content)
      } catch (error) {
         this.gitignorePatterns = []
      }
   }

   private parseGitignore(content: string): Array<{
      pattern: string
      isNegated: boolean
      isDirectory: boolean
   }> {
      return content
         .split('\n')
         .map((line) => line.trim())
         .filter((line) => line && !line.startsWith('#'))
         .map((pattern) => ({
            pattern: pattern
               .replace(/^!\.?\//, '!')
               .replace(/^\.\//, '')
               .replace(/\/$/, ''),
            isNegated: pattern.startsWith('!'),
            isDirectory: pattern.endsWith('/'),
         }))
   }

   private matchPattern(pattern: string, path: string): boolean {
      const regexPattern = pattern
         .replace(/[.+^${}()|[\]\\]/g, '\\$&')
         .replace(/\*/g, '.*')
         .replace(/\?/g, '.')
         .replace(/\*\*\//g, '(.*/)*')

      const regex = new RegExp(`^${regexPattern}$`)
      return regex.test(path)
   }

   shouldExclude(path: string): boolean {
      const relativePath = path.replace(this.rootPath, '').replace(/^[/\\]/, '')
      const excludePatterns = this.excludePatterns

      return excludePatterns.some((pattern) => {
         // Handle exact matches and directory patterns
         if (pattern.startsWith('/')) {
            // For patterns starting with '/', check if path starts with this pattern
            return relativePath.startsWith(pattern.slice(1))
         } else if (pattern.endsWith('/')) {
            // For patterns ending with '/', check if path includes this directory
            return relativePath.includes(pattern)
         } else {
            // For simple patterns, check if they're present anywhere in the path
            // Split the path into segments and check each part
            const pathSegments = relativePath.split(/[/\\]/)
            return (
               pathSegments.some((segment) => {
                  // Exact match for filenames or directory names
                  if (segment === pattern) return true
                  // Check for file extensions (like .log)
                  if (pattern.startsWith('.') && segment.endsWith(pattern)) return true
                  return false
               }) || relativePath === pattern
            ) // Check full relative path match
         }
      })
   }
}

const pathMatchers = new Map<string, PathMatcher>()

export async function getPathMatcher(
   rootPath: string,
   excludePatterns: string[]
): Promise<PathMatcher> {
   const key = `${rootPath}-${excludePatterns.join(',')}`
   if (!pathMatchers.has(key)) {
      const matcher = new PathMatcher(rootPath, excludePatterns)
      await matcher.initialize()
      pathMatchers.set(key, matcher)
   }
   return pathMatchers.get(key)!
}
