type Bzq = (cmd: string, ...args: unknown[]) => void;

function bzq(): Bzq | null {
  return (window as unknown as { bzq?: Bzq }).bzq ?? null;
}

export function track(event: string, props: Record<string, unknown> = {}) {
  bzq()?.('track', event, props);
}

export function identify(userId: number | null) {
  bzq()?.('identify', userId);
}
