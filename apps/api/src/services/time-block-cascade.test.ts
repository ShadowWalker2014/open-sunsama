/**
 * Unit tests for pushing later time blocks when one is resized: only
 * blocks the resized one now overlaps move, and they keep their gaps.
 */
import { describe, it, expect } from 'vitest';
import { calculateCascadeShifts } from './time-block-cascade.js';

const resize = (startTime: string, endTime: string, originalStartTime: string, originalEndTime: string) => ({
  id: 'target',
  startTime,
  endTime,
  originalStartTime,
  originalEndTime,
});

describe('calculateCascadeShifts', () => {
  it('leaves a block hours later alone when a block grows by 30 minutes', () => {
    const { updatedBlocks } = calculateCascadeShifts(resize('07:30', '09:00', '07:30', '08:30'), [
      { id: 'afternoon', startTime: '14:30', endTime: '15:00' },
    ]);
    expect(updatedBlocks).toEqual([{ id: 'target', startTime: '07:30', endTime: '09:00' }]);
  });

  it('pushes an overlapped block and the chain behind it, keeping their gaps', () => {
    const { updatedBlocks } = calculateCascadeShifts(resize('09:00', '10:30', '09:00', '10:00'), [
      { id: 'next', startTime: '10:00', endTime: '10:30' },
      { id: 'after-gap', startTime: '10:45', endTime: '11:00' },
      { id: 'far', startTime: '15:00', endTime: '16:00' },
    ]);
    expect(updatedBlocks).toEqual([
      { id: 'target', startTime: '09:00', endTime: '10:30' },
      { id: 'next', startTime: '10:30', endTime: '11:00' },
      { id: 'after-gap', startTime: '11:15', endTime: '11:30' },
    ]);
  });

  it('shifts nothing when a block shrinks', () => {
    const { updatedBlocks } = calculateCascadeShifts(resize('09:00', '09:30', '09:00', '10:00'), [
      { id: 'next', startTime: '10:00', endTime: '11:00' },
    ]);
    expect(updatedBlocks).toHaveLength(1);
  });

  it('never moves blocks that start before the resized one', () => {
    const { updatedBlocks } = calculateCascadeShifts(resize('08:30', '10:00', '09:00', '10:00'), [
      { id: 'earlier', startTime: '08:00', endTime: '08:45' },
    ]);
    expect(updatedBlocks.map((u) => u.id)).toEqual(['target']);
  });
});
