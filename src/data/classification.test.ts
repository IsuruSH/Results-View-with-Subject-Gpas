import { describe, it, expect } from 'vitest';
import { isCoreCourse, getCourseClassification } from './src/data/courseClassifications';

describe('Course Classification Group Overrides', () => {
    it('should correctly identify MAT313β as Optional for BCS', () => {
        const cls = getCourseClassification("MAT313β", "bcs");
        expect(cls?.type).toBe("optional");
        expect(isCoreCourse("MAT313β", "bcs")).toBe(false);
    });

    it('should correctly identify MAT313β as Core for BSC', () => {
        const cls = getCourseClassification("MAT313β", "bsc");
        expect(cls?.type).toBe("core");
        expect(isCoreCourse("MAT313β", "bsc")).toBe(true);
    });

    it('should fall back to global for shared core subjects like MAT225β', () => {
        // MAT225β is registered as global core
        expect(isCoreCourse("MAT225β", "bcs")).toBe(true);
        expect(isCoreCourse("MAT225β", "bsc")).toBe(true);
    });

    it('should handle case insensitivity and Greek character normalization', () => {
        expect(isCoreCourse("mat313\u03b2", "bsc")).toBe(true); // beta
        expect(isCoreCourse("MAT313B", "bsc")).toBe(true); // normalized 'b'
    });
});
