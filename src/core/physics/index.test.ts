import { describe, it, expect } from 'vitest';
import * as PhysicsIndex from './index';

describe('Physics Index', () => {
  it('should export all expected physics utility functions', () => {
    // physicsUtils
    expect(PhysicsIndex.formatUnit).toBeDefined();
    expect(PhysicsIndex.degToRad).toBeDefined();
    expect(PhysicsIndex.radToDeg).toBeDefined();
    expect(PhysicsIndex.sinDeg).toBeDefined();
    expect(PhysicsIndex.cosDeg).toBeDefined();
    expect(PhysicsIndex.convertKmHToMS).toBeDefined();
    expect(PhysicsIndex.convertMSToKmH).toBeDefined();
    expect(PhysicsIndex.kmhToMs).toBeDefined();
    expect(PhysicsIndex.msToKmh).toBeDefined();
  });

  it('should export all main calculation functions', () => {
    expect(PhysicsIndex.calculateMRU).toBeDefined();
    expect(PhysicsIndex.calculateMRUV).toBeDefined();
    expect(PhysicsIndex.calculateQuedaLivre).toBeDefined();
    expect(PhysicsIndex.calculateLancamentoVertical).toBeDefined();
    expect(PhysicsIndex.calculateLancamentoHorizontal).toBeDefined();
    expect(PhysicsIndex.calculateLancamentoObliquo).toBeDefined();
    expect(PhysicsIndex.calculateMCU).toBeDefined();
    expect(PhysicsIndex.calculateMHS).toBeDefined();
    expect(PhysicsIndex.calculatePlanoInclinado).toBeDefined();
    expect(PhysicsIndex.calculateEnergiaTrabalho).toBeDefined();
  });
});
