/**
 * Fair Housing Scanner Test Suite
 * Comprehensive tests for the Fair Housing Compliance Scanner
 */

import { describe, it, expect, beforeEach } from 'vitest';

// Import the scanner (assuming ESM export)
const FairHousingScanner = await import('../scripts/fair-housing-scanner.js').then(m => m.default || m);

describe('FairHousingScanner', () => {

    // ============================================
    // CORE FUNCTION TESTS
    // ============================================

    describe('scan()', () => {

        it('should return empty array for compliant text', () => {
            const text = 'Beautiful 3-bedroom home with hardwood floors, updated kitchen, and large backyard.';
            const violations = FairHousingScanner.scan(text);
            expect(violations).toEqual([]);
        });

        it('should return empty array for empty input', () => {
            expect(FairHousingScanner.scan('')).toEqual([]);
            expect(FairHousingScanner.scan(null)).toEqual([]);
            expect(FairHousingScanner.scan(undefined)).toEqual([]);
        });

        it('should detect race/national origin violations', () => {
            const text = 'Great property in a white neighborhood with caucasian families.';
            const violations = FairHousingScanner.scan(text);
            expect(violations.length).toBeGreaterThan(0);
            expect(violations.some(v => v.type.includes('Race') || v.type.includes('National Origin'))).toBe(true);
        });

        it('should detect familial status violations', () => {
            const text = 'Adults only property. No children allowed.';
            const violations = FairHousingScanner.scan(text);
            expect(violations.length).toBeGreaterThan(0);
            expect(violations.some(v => v.type.includes('Familial Status'))).toBe(true);
        });

        it('should detect disability violations', () => {
            const text = 'No wheelchairs. Must be able-bodied. No service animals.';
            const violations = FairHousingScanner.scan(text);
            expect(violations.length).toBeGreaterThan(0);
            expect(violations.some(v => v.type.includes('Disability'))).toBe(true);
        });

        it('should detect religion violations', () => {
            const text = 'Christian families preferred. Close to the church.';
            const violations = FairHousingScanner.scan(text);
            expect(violations.length).toBeGreaterThan(0);
            expect(violations.some(v => v.type.includes('Religion'))).toBe(true);
        });

        it('should detect sex/gender violations', () => {
            const text = 'Female tenants only. No men allowed.';
            const violations = FairHousingScanner.scan(text);
            expect(violations.length).toBeGreaterThan(0);
            expect(violations.some(v => v.type.includes('Sex') || v.type.includes('Gender'))).toBe(true);
        });

        it('should detect steering language', () => {
            const text = 'Safe neighborhood. You\'ll fit in with the quality neighbors.';
            const violations = FairHousingScanner.scan(text);
            expect(violations.length).toBeGreaterThan(0);
            expect(violations.some(v => v.type.includes('Steering'))).toBe(true);
        });

        it('should sort violations by severity (high first)', () => {
            const text = 'No children. Master bedroom. Safe area.';
            const violations = FairHousingScanner.scan(text);

            if (violations.length > 1) {
                const severityOrder = { high: 0, medium: 1, low: 2 };
                for (let i = 1; i < violations.length; i++) {
                    expect(severityOrder[violations[i-1].severity]).toBeLessThanOrEqual(severityOrder[violations[i].severity]);
                }
            }
        });
    });

    // ============================================
    // STATE-SPECIFIC TESTS
    // ============================================

    describe('State-specific violations', () => {

        it('should detect source of income violations in CA', () => {
            const text = 'No Section 8. No vouchers accepted.';
            const violations = FairHousingScanner.scan(text, 'CA');
            expect(violations.some(v => v.type.includes('Source of Income'))).toBe(true);
        });

        it('should NOT detect source of income violations in states without protection', () => {
            const text = 'No Section 8.';
            const violations = FairHousingScanner.scan(text, 'AL'); // Alabama has no SOI protection
            expect(violations.some(v => v.type === 'Source of Income')).toBe(false);
        });

        it('should detect marital status violations in protected states', () => {
            const text = 'Married couples only.';
            const violations = FairHousingScanner.scan(text, 'CA');
            expect(violations.some(v => v.type.includes('Marital Status'))).toBe(true);
        });

        it('should detect military status violations in TX', () => {
            const text = 'No military personnel.';
            const violations = FairHousingScanner.scan(text, 'TX');
            expect(violations.some(v => v.type.includes('Military'))).toBe(true);
        });

        it('should detect immigration status violations in CA', () => {
            const text = 'Must have green card. US citizens only.';
            const violations = FairHousingScanner.scan(text, 'CA');
            expect(violations.some(v => v.type.includes('Immigration') || v.type.includes('Ancestry'))).toBe(true);
        });

        it('should detect student status violations in DC', () => {
            const text = 'No students allowed.';
            const violations = FairHousingScanner.scan(text, 'DC');
            expect(violations.some(v => v.type.includes('Student'))).toBe(true);
        });

        it('should detect primary language violations in CA', () => {
            const text = 'English only. Must speak English.';
            const violations = FairHousingScanner.scan(text, 'CA');
            expect(violations.some(v => v.type.includes('Language') || v.type.includes('National Origin'))).toBe(true);
        });
    });

    // ============================================
    // QUICK SCAN TESTS
    // ============================================

    describe('quickScan()', () => {

        it('should return isCompliant: true for clean text', () => {
            const result = FairHousingScanner.quickScan('Nice 2BR apartment with parking.');
            expect(result.isCompliant).toBe(true);
            expect(result.count).toBe(0);
            expect(result.score).toBe(100);
        });

        it('should return isCompliant: false for violating text', () => {
            const result = FairHousingScanner.quickScan('No kids allowed.');
            expect(result.isCompliant).toBe(false);
            expect(result.count).toBeGreaterThan(0);
            expect(result.hasHighRisk).toBe(true);
        });

        it('should calculate correct risk level', () => {
            const highRisk = FairHousingScanner.quickScan('No blacks. No mexicans.');
            expect(highRisk.riskLevel.level).toBe('high');

            const compliant = FairHousingScanner.quickScan('Beautiful home.');
            expect(compliant.riskLevel.level).toBe('compliant');
        });
    });

    // ============================================
    // BATCH SCAN TESTS
    // ============================================

    describe('batchScan()', () => {

        it('should scan multiple listings', () => {
            const listings = [
                'Nice apartment with view.',
                'No children allowed.',
                'Adults only community.'
            ];
            const results = FairHousingScanner.batchScan(listings);

            expect(results.length).toBe(3);
            expect(results[0].isCompliant).toBe(true);
            expect(results[1].isCompliant).toBe(false);
            expect(results[2].isCompliant).toBe(false);
        });

        it('should handle listing objects with id', () => {
            const listings = [
                { id: 'listing-1', text: 'Nice home.' },
                { id: 'listing-2', text: 'No kids.' }
            ];
            const results = FairHousingScanner.batchScan(listings);

            expect(results[0].id).toBe('listing-1');
            expect(results[1].id).toBe('listing-2');
        });
    });

    // ============================================
    // AUTO-FIX TESTS
    // ============================================

    describe('autoFix()', () => {

        it('should return original text if compliant', () => {
            const text = 'Beautiful home with 3 bedrooms.';
            const result = FairHousingScanner.autoFix(text);
            expect(result.text).toBe(text);
            expect(result.changes.length).toBe(0);
        });

        it('should fix master bedroom references', () => {
            const text = 'Large master bedroom with ensuite.';
            const result = FairHousingScanner.autoFix(text);
            expect(result.text.toLowerCase()).not.toContain('master bedroom');
        });

        it('should track changes made', () => {
            const text = 'Master suite with walk-in closet.';
            const result = FairHousingScanner.autoFix(text);
            if (result.changes.length > 0) {
                expect(result.changes[0]).toHaveProperty('original');
                expect(result.changes[0]).toHaveProperty('replacement');
                expect(result.changes[0]).toHaveProperty('type');
            }
        });

        it('should clean up extra spaces after fixes', () => {
            const text = 'This is a  master bedroom  test.';
            const result = FairHousingScanner.autoFix(text);
            expect(result.text).not.toMatch(/\s{2,}/);
        });
    });

    // ============================================
    // SCORING TESTS
    // ============================================

    describe('calculateScore()', () => {

        it('should return 100 for no violations', () => {
            expect(FairHousingScanner.calculateScore([])).toBe(100);
        });

        it('should deduct 25 points for high severity', () => {
            const violations = [{ severity: 'high' }];
            expect(FairHousingScanner.calculateScore(violations)).toBe(75);
        });

        it('should deduct 10 points for medium severity', () => {
            const violations = [{ severity: 'medium' }];
            expect(FairHousingScanner.calculateScore(violations)).toBe(90);
        });

        it('should deduct 5 points for low severity', () => {
            const violations = [{ severity: 'low' }];
            expect(FairHousingScanner.calculateScore(violations)).toBe(95);
        });

        it('should not go below 0', () => {
            const violations = Array(10).fill({ severity: 'high' });
            expect(FairHousingScanner.calculateScore(violations)).toBe(0);
        });
    });

    // ============================================
    // GET STATE PROTECTIONS TESTS
    // ============================================

    describe('getStateProtections()', () => {

        it('should return 7 federal protections by default', () => {
            const protections = FairHousingScanner.getStateProtections(null);
            expect(protections.length).toBe(7);
            expect(protections).toContain('Race');
            expect(protections).toContain('Disability');
            expect(protections).toContain('Familial Status');
        });

        it('should return additional protections for CA', () => {
            const protections = FairHousingScanner.getStateProtections('CA');
            expect(protections.length).toBeGreaterThan(7);
            expect(protections).toContain('Source of Income');
            expect(protections).toContain('Arbitrary (Unruh)');
        });

        it('should return additional protections for DC', () => {
            const protections = FairHousingScanner.getStateProtections('DC');
            expect(protections.length).toBeGreaterThan(10); // DC has most protections
            expect(protections).toContain('Student Status');
            expect(protections).toContain('Lawful Occupation');
        });

        it('should return only federal for states without extra protections', () => {
            const protections = FairHousingScanner.getStateProtections('WY');
            expect(protections.length).toBe(7);
        });
    });

    // ============================================
    // EXPORT TESTS
    // ============================================

    describe('exportResults()', () => {

        const sampleViolations = [
            {
                type: 'Familial Status',
                matches: ['no children'],
                suggestion: 'Remove restriction',
                severity: 'high',
                level: 'Federal',
                law: 'FHA §3604'
            }
        ];

        it('should export to JSON format', () => {
            const result = FairHousingScanner.exportResults(sampleViolations, 'json');
            const parsed = JSON.parse(result);
            expect(parsed).toHaveProperty('timestamp');
            expect(parsed).toHaveProperty('violations');
            expect(parsed.violations.length).toBe(1);
        });

        it('should export to CSV format', () => {
            const result = FairHousingScanner.exportResults(sampleViolations, 'csv');
            expect(result).toContain('Type,Severity,Level,Law,Matches,Suggestion');
            expect(result).toContain('Familial Status');
        });

        it('should export to text format', () => {
            const result = FairHousingScanner.exportResults(sampleViolations, 'text');
            expect(result).toContain('Fair Housing Compliance Report');
            expect(result).toContain('Familial Status');
        });

        it('should export to HTML format', () => {
            const result = FairHousingScanner.exportResults(sampleViolations, 'html');
            expect(result).toContain('<!DOCTYPE html>');
            expect(result).toContain('Familial Status');
        });
    });

    // ============================================
    // COMPLIANT ALTERNATIVES TESTS
    // ============================================

    describe('getCompliantAlternatives()', () => {

        it('should return alternatives for master bedroom', () => {
            const alternatives = FairHousingScanner.getCompliantAlternatives('master bedroom');
            expect(alternatives).toContain('primary bedroom');
        });

        it('should return alternatives for handicap accessible', () => {
            const alternatives = FairHousingScanner.getCompliantAlternatives('handicap accessible');
            expect(alternatives).toContain('accessible');
        });

        it('should return null for unknown phrases', () => {
            const alternatives = FairHousingScanner.getCompliantAlternatives('random phrase');
            expect(alternatives).toBeNull();
        });

        it('should be case-insensitive', () => {
            const alternatives = FairHousingScanner.getCompliantAlternatives('MASTER BEDROOM');
            expect(alternatives).not.toBeNull();
        });
    });

    // ============================================
    // STATE LAWS DATA TESTS
    // ============================================

    describe('State data completeness', () => {

        it('should have all 50 states plus DC', () => {
            const states = FairHousingScanner.statesList;
            expect(states.length).toBeGreaterThanOrEqual(51); // 50 states + DC
        });

        it('should have law info for major states', () => {
            const majorStates = ['CA', 'NY', 'TX', 'FL', 'IL', 'DC'];
            majorStates.forEach(code => {
                expect(FairHousingScanner.stateLaws[code]).toBeDefined();
                expect(FairHousingScanner.stateLaws[code].name).toBeDefined();
                expect(FairHousingScanner.stateLaws[code].law).toBeDefined();
            });
        });
    });

    // ============================================
    // EDGE CASE TESTS
    // ============================================

    describe('Edge cases', () => {

        it('should handle very long text', () => {
            const longText = 'Beautiful home. '.repeat(1000);
            const violations = FairHousingScanner.scan(longText);
            expect(Array.isArray(violations)).toBe(true);
        });

        it('should handle special characters', () => {
            const text = 'Nice home! @#$%^&*() Great location!!!';
            const violations = FairHousingScanner.scan(text);
            expect(Array.isArray(violations)).toBe(true);
        });

        it('should handle unicode characters', () => {
            const text = 'Beautiful home with café nearby. Prix: $500,000';
            const violations = FairHousingScanner.scan(text);
            expect(Array.isArray(violations)).toBe(true);
        });

        it('should handle mixed case violations', () => {
            const text = 'NO CHILDREN ALLOWED';
            const violations = FairHousingScanner.scan(text);
            expect(violations.length).toBeGreaterThan(0);
        });

        it('should not flag safe phrases', () => {
            const text = 'Walking distance to schools. Family-friendly amenities. Pet-friendly.';
            const violations = FairHousingScanner.scan(text);
            expect(violations.length).toBe(0);
        });
    });

    // ============================================
    // REAL-WORLD LISTING TESTS
    // ============================================

    describe('Real-world listing scenarios', () => {

        it('should pass a compliant listing', () => {
            const listing = `
                Stunning 3-bedroom, 2-bathroom home in desirable location!
                Features include hardwood floors throughout, updated kitchen with
                stainless steel appliances and granite countertops. Primary bedroom
                with en-suite bathroom. Large backyard perfect for entertaining.
                Central AC, 2-car garage. Walking distance to parks and shopping.
                Move-in ready! Schedule your showing today.
            `;
            const result = FairHousingScanner.quickScan(listing);
            expect(result.isCompliant).toBe(true);
        });

        it('should flag a problematic listing', () => {
            const listing = `
                Perfect for young professionals! This adult-only community offers
                quiet living away from noisy children. Located in a safe, exclusive
                neighborhood with great schools. Christian families will love the
                proximity to St. Mary's Church. No Section 8 or vouchers.
                Must speak English. Employed tenants only.
            `;
            const result = FairHousingScanner.quickScan(listing, 'CA');
            expect(result.isCompliant).toBe(false);
            expect(result.count).toBeGreaterThan(5);
        });

        it('should handle a listing with subtle violations', () => {
            const listing = `
                Charming home in an established, exclusive neighborhood.
                You'll fit right in with the quality neighbors.
                Traditional family values community. Quiet, no drama.
                Master bedroom with man cave potential.
            `;
            const result = FairHousingScanner.quickScan(listing);
            expect(result.isCompliant).toBe(false);
        });
    });

    // ============================================
    // VERSION AND METADATA
    // ============================================

    describe('Module metadata', () => {

        it('should have version info', () => {
            expect(FairHousingScanner.version).toBeDefined();
            expect(typeof FairHousingScanner.version).toBe('string');
        });

        it('should have lastUpdated info', () => {
            expect(FairHousingScanner.lastUpdated).toBeDefined();
        });

        it('should expose all public methods', () => {
            expect(typeof FairHousingScanner.scan).toBe('function');
            expect(typeof FairHousingScanner.quickScan).toBe('function');
            expect(typeof FairHousingScanner.batchScan).toBe('function');
            expect(typeof FairHousingScanner.autoFix).toBe('function');
            expect(typeof FairHousingScanner.calculateScore).toBe('function');
            expect(typeof FairHousingScanner.getRiskLevel).toBe('function');
            expect(typeof FairHousingScanner.getStateProtections).toBe('function');
            expect(typeof FairHousingScanner.exportResults).toBe('function');
            expect(typeof FairHousingScanner.getCompliantAlternatives).toBe('function');
        });
    });
});
