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
      const pathParts = relativePath.split(/[/\\]/)

      console.log('pathParts :>> ', pathParts);
      console.log('relativePath :>> ', relativePath);
      console.log('excludePatterns :>> ', this.excludePatterns);

      const isExcluded = this.excludePatterns.some((pattern) => )
      if (isExcluded) {
         return true
      }

      if (this.gitignorePatterns.length === 0) {
         return false
      }

      let ignored = false

      for (const { pattern, isNegated, isDirectory } of this.gitignorePatterns) {
         if (isDirectory && !path.endsWith('/')) {
            continue
         }

         const matches =
            this.matchPattern(pattern, relativePath) ||
            pathParts.some((part) => this.matchPattern(pattern, part))

         if (matches) {
            if (isNegated) {
               return false
            }
            ignored = true
         }
      }

      return ignored
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
