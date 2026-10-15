import { describe, it, expect } from 'vitest';
import { useAppStore } from '../store/useAppStore';

describe('Agent Telemetry & Debug HUD — Unit Tests', () => {
  it('initializes with default agent telemetry state and HUD closed', () => {
    const state = useAppStore.getState();
    expect(state.isAgentTelemetryOpen).toBe(false);
    expect(state.agentTelemetry.activeAgent).toBe('Antigravity');
    expect(state.agentTelemetry.currentPhase.percent).toBe(100);
    expect(state.agentTelemetry.health.vitestTests).toBe(576);
  });

  it('toggles agent telemetry HUD visibility correctly', () => {
    const store = useAppStore.getState();
    expect(useAppStore.getState().isAgentTelemetryOpen).toBe(false);

    store.toggleAgentTelemetry();
    expect(useAppStore.getState().isAgentTelemetryOpen).toBe(true);

    store.setAgentTelemetryOpen(false);
    expect(useAppStore.getState().isAgentTelemetryOpen).toBe(false);
  });

  it('updates agent telemetry partial state seamlessly', () => {
    const store = useAppStore.getState();

    store.updateAgentTelemetry({
      activeAgent: 'Jules AI',
      statusMessage: 'Executando otimização com Bolt ⚡',
      currentPhase: {
        index: 3,
        total: 5,
        name: 'Build & Lint',
        percent: 60,
        etaSeconds: 8,
        currentAction: 'Otimizando bundle chunks',
      },
    });

    const updated = useAppStore.getState().agentTelemetry;
    expect(updated.activeAgent).toBe('Jules AI');
    expect(updated.statusMessage).toBe('Executando otimização com Bolt ⚡');
    expect(updated.currentPhase.index).toBe(3);
    expect(updated.currentPhase.percent).toBe(60);
  });

  it('appends and tracks tool logs with auto-generated id and timestamp', () => {
    const store = useAppStore.getState();
    const initialCount = store.agentTelemetry.recentLogs.length;

    store.addAgentLog({
      toolName: 'npm run lint',
      target: '146 files',
      durationMs: 88,
      status: 'success',
      summary: '0 warnings e 0 errors confirmados',
    });

    const updatedLogs = useAppStore.getState().agentTelemetry.recentLogs;
    expect(updatedLogs.length).toBe(initialCount + 1);
    expect(updatedLogs[0].toolName).toBe('npm run lint');
    expect(updatedLogs[0].status).toBe('success');
    expect(updatedLogs[0].id).toBeDefined();
    expect(updatedLogs[0].timestamp).toBeGreaterThan(0);
  });
});
