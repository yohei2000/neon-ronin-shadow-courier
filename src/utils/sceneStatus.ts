export function markSceneStatus(sceneKey: string): void {
  if (typeof document !== 'undefined') {
    document.body.dataset.scene = sceneKey;
  }
}
