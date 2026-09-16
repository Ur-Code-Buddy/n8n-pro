import { InsightsSettings } from '../insights.settings';

describe('InsightsSettings', () => {
	let insightsSettings: InsightsSettings;

	beforeAll(() => {
		insightsSettings = new InsightsSettings();
	});

	test('returns correct summary and dashboard licenses', () => {
		const result = insightsSettings.settings();

		expect(result.summary).toBe(true);
		expect(result.dashboard).toBe(true);
	});

	describe('dateRanges', () => {
		test('returns correct ranges', () => {
			const result = insightsSettings.settings();

			expect(result.dateRanges).toEqual([
				{ key: 'day', licensed: true, granularity: 'hour' },
				{ key: 'week', licensed: true, granularity: 'day' },
				{ key: '2weeks', licensed: true, granularity: 'day' },
				{ key: 'month', licensed: true, granularity: 'day' },
				{ key: 'quarter', licensed: true, granularity: 'week' },
				{ key: '6months', licensed: true, granularity: 'week' },
				{ key: 'year', licensed: true, granularity: 'week' },
			]);
		});
	});
});
