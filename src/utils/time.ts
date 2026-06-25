export class Timer {
  private startedAt = 0;
  private pausedElapsed = 0;
  private paused = false;

  start(now: number): void {
    this.startedAt = now;
    this.pausedElapsed = 0;
    this.paused = false;
  }

  pause(now: number): void {
    if (!this.paused) {
      this.pausedElapsed = now - this.startedAt;
      this.paused = true;
    }
  }

  resume(now: number): void {
    if (this.paused) {
      this.startedAt = now - this.pausedElapsed;
      this.paused = false;
    }
  }

  elapsed(now: number): number {
    return this.paused ? this.pausedElapsed : now - this.startedAt;
  }
}
