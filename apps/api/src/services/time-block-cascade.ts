/**
 * Time block cascade resize service
 * Handles the calculation of cascade shifts when resizing a time block
 */

/**
 * Convert time string (HH:MM) to minutes since midnight
 */
function timeToMinutes(time: string): number {
  const [hour, min] = time.split(':').map(Number);
  return (hour ?? 0) * 60 + (min ?? 0);
}

/**
 * Convert minutes since midnight to time string (HH:MM)
 */
function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60) % 24;
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Result of cascade calculation
 */
export interface CascadeResult {
  updatedBlocks: Array<{ id: string; startTime: string; endTime: string }>;
}

/**
 * Block info needed for cascade calculation
 */
export interface BlockInfo {
  id: string;
  startTime: string;
  endTime: string;
}

/**
 * Resized block info with original start time for reference
 */
export interface ResizedBlockInfo extends BlockInfo {
  originalStartTime: string;
  originalEndTime: string;
}

/**
 * Calculate cascade shifts when a time block is resized.
 * 
 * Only shifts blocks when there's ACTUAL overlap (block starts before previous ends).
 * When shifting, maintains the ORIGINAL gap between blocks.
 * 
 * @param resizedBlock - The block being resized with its new and original times
 * @param allBlocks - All blocks for the same date (excluding the resized block)
 * @returns CascadeResult with list of blocks that need to be updated
 */
export function calculateCascadeShifts(
  resizedBlock: ResizedBlockInfo,
  allBlocks: BlockInfo[],
): CascadeResult {
  const { id, startTime: newStartTime, endTime: newEndTime, originalStartTime, originalEndTime } = resizedBlock;
  
  // Use the minimum of original and new start time to handle cases where
  // the start time moves earlier (we might need to cascade blocks that were "before")
  const filterStartMinutes = Math.min(
    timeToMinutes(originalStartTime),
    timeToMinutes(newStartTime)
  );
  
  // Filter to blocks that start AFTER the minimum start time (excluding the target)
  // Sort by start time to process in order
  const subsequentBlocks = allBlocks
    .filter((block) => block.id !== id && timeToMinutes(block.startTime) > filterStartMinutes)
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  const updates: Array<{ id: string; startTime: string; endTime: string }> = [];

  // First, add the resized block's update
  updates.push({
    id,
    startTime: newStartTime,
    endTime: newEndTime,
  });

  // Track the current "end boundary" - blocks need to shift if they start before this
  let currentEndMinutes = timeToMinutes(newEndTime);
  const originalEndMinutes = timeToMinutes(originalEndTime);

  // Process subsequent blocks in order
  for (let i = 0; i < subsequentBlocks.length; i++) {
    const block = subsequentBlocks[i]!;
    const blockStartMinutes = timeToMinutes(block.startTime);
    const blockEndMinutes = timeToMinutes(block.endTime);
    const blockDuration = blockEndMinutes - blockStartMinutes;

    // Calculate the original gap between this block and the previous one
    let originalGap = 0;
    if (i === 0) {
      // Gap from the target block's ORIGINAL end to this block's start
      originalGap = Math.max(0, blockStartMinutes - originalEndMinutes);
    } else {
      // Gap from the previous subsequent block's ORIGINAL end to this block's start
      const prevBlock = subsequentBlocks[i - 1]!;
      const prevEndMinutes = timeToMinutes(prevBlock.endTime);
      originalGap = Math.max(0, blockStartMinutes - prevEndMinutes);
    }

    // Only shift if there's ACTUAL OVERLAP: block starts before the current end boundary
    // This is the key fix - we don't shift just to maintain gaps, only when there's overlap
    if (blockStartMinutes < currentEndMinutes) {
      // Shift this block: new start = current end boundary + original gap
      const newBlockStartMinutes = currentEndMinutes + originalGap;
      const newBlockEndMinutes = newBlockStartMinutes + blockDuration;

      updates.push({
        id: block.id,
        startTime: minutesToTime(newBlockStartMinutes),
        endTime: minutesToTime(newBlockEndMinutes),
      });

      // Update the end boundary for the next block
      currentEndMinutes = newBlockEndMinutes;
    } else {
      // This block doesn't need to shift, but we still need to update the boundary
      // for cascade detection of following blocks
      currentEndMinutes = blockEndMinutes;
    }
  }

  return { updatedBlocks: updates };
}
