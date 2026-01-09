/**
 * Module Registry
 * 
 * Registry of all available modules for lazy loading.
 * Add new modules here when created.
 */

export const moduleRegistry = {
  studio: () => import('@/modules/studio'),
  // challenges: () => import('@/modules/challenges'),
  // akademie: () => import('@/modules/akademie'),
  // game: () => import('@/modules/game'),
  // 'ai-coach': () => import('@/modules/ai-coach'),
} as const;

export type ModuleKey = keyof typeof moduleRegistry;

/**
 * Load a module dynamically
 * 
 * @param moduleId - Module ID to load
 * @returns Module component
 */
export async function loadModule(moduleId: string) {
  const loader = moduleRegistry[moduleId as ModuleKey];
  
  if (!loader) {
    throw new Error(`Module "${moduleId}" not found in registry`);
  }

  try {
    const module = await loader();
    return module;
  } catch (error) {
    console.error(`Error loading module "${moduleId}":`, error);
    throw new Error(`Failed to load module "${moduleId}"`);
  }
}
