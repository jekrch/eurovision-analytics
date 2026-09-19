import { Contest, ContestData, Entry, entryKey, PointsByType, VoteType } from './contestData';

export type VoteMode = 'combined' | 'jury' | 'televote';

export interface VoteFilter {
    fromYear: number;
    toYear: number;
    mode: VoteMode;
    includeSemis: boolean;
}

/** The 1–8, 10, 12 scoreboard dates from 1975; earlier years used other scales. */
export const TWELVE_POINT_ERA = 1975;
/** First year jury and televote points were reported separately. */
export const SPLIT_VOTE_ERA = 2016;

export const modeLabels: Record<VoteMode, string> = {
    combined: 'Combined',
    jury: 'Jury',
    televote: 'Televote',
};

/** How one country has voted for another over a filtered set of contests. */
export interface PairStat {
    from: string;
    to: string;
    /** Contests where `from` voted and `to` was performing. */
    opportunities: number;
    /** Contests where `from` gave `to` any points. */
    timesScored: number;
    /** Points on a 0–12 scale per contest (see pointsInMode). */
    points: number;
    avg: number;
    /** Raw 12s given; a split-vote year can hold one from the jury and one from the televote. */
    twelves: number;
}

export const pairKey = (from: string, to: string) => `${from}|${to}`;

function contestMatches(contest: Contest, filter: VoteFilter) {
    if (contest.year < filter.fromYear || contest.year > filter.toYear) return false;
    if (!filter.includeSemis && !contest.isFinal) return false;
    if (filter.mode !== 'combined' && !contest.split) return false;
    return true;
}

/**
 * Points from one voter in one contest on a single 0–12 scale, so that
 * split-vote years compare with earlier ones: in combined mode the jury and
 * televote sets are averaged rather than summed.
 */
function pointsInMode(p: PointsByType | undefined, types: Set<VoteType>, contest: Contest, mode: VoteMode): number {
    if (!p) return 0;
    if (mode === 'jury') return p.jury;
    if (mode === 'televote') return p.televote;
    if (!contest.split) return p.total;
    const sets = (types.has('Jury') ? 1 : 0) + (types.has('Televote') ? 1 : 0);
    return sets ? (p.jury + p.televote) / sets : 0;
}

function rawCount(p: PointsByType | undefined, mode: VoteMode, value: number): number {
    if (!p) return 0;
    if (mode === 'jury') return p.jury === value ? 1 : 0;
    if (mode === 'televote') return p.televote === value ? 1 : 0;
    return (p.total === value ? 1 : 0) + (p.jury === value ? 1 : 0) + (p.televote === value ? 1 : 0);
}

function voterCastMode(types: Set<VoteType>, mode: VoteMode) {
    if (mode === 'jury') return types.has('Jury');
    if (mode === 'televote') return types.has('Televote');
    return true;
}

export interface Affinity {
    pairs: Map<string, PairStat>;
    /** Average points per opportunity across every pair, the baseline "normal" amount. */
    baseline: number;
}

/** Every directed voter → recipient relationship within the filter. */
export function computeAffinity(data: ContestData, filter: VoteFilter): Affinity {
    const pairs = new Map<string, PairStat>();
    let totalPoints = 0;
    let totalOpportunities = 0;

    data.contests.forEach((contest) => {
        if (!contestMatches(contest, filter)) return;

        contest.voterTypes.forEach((types, from) => {
            if (!voterCastMode(types, filter.mode)) return;
            const given = contest.points.get(from);

            contest.competitors.forEach((to) => {
                if (to === from) return;
                const p = given?.get(to);
                const points = pointsInMode(p, types, contest, filter.mode);

                const key = pairKey(from, to);
                let stat = pairs.get(key);
                if (!stat) {
                    stat = { from, to, opportunities: 0, timesScored: 0, points: 0, avg: 0, twelves: 0 };
                    pairs.set(key, stat);
                }
                stat.opportunities += 1;
                stat.points += points;
                if (points > 0) stat.timesScored += 1;
                stat.twelves += rawCount(p, filter.mode, 12);

                totalPoints += points;
                totalOpportunities += 1;
            });
        });
    });

    pairs.forEach((stat) => {
        stat.avg = stat.points / stat.opportunities;
    });

    return { pairs, baseline: totalOpportunities ? totalPoints / totalOpportunities : 0 };
}

export interface YearlyExchange {
    year: number;
    /** Real points, summed over the rounds in the filter. */
    total: number;
    jury: number;
    televote: number;
}

/** Points `from` gave `to` each year, as they appeared on the scoreboard. */
export function yearlyExchange(data: ContestData, filter: VoteFilter, from: string, to: string): Map<number, YearlyExchange> {
    const byYear = new Map<number, YearlyExchange>();
    data.contests.forEach((contest) => {
        if (!contestMatches(contest, filter)) return;
        const types = contest.voterTypes.get(from);
        if (!types || !contest.competitors.has(to)) return;

        const p = contest.points.get(from)?.get(to);
        let row = byYear.get(contest.year);
        if (!row) byYear.set(contest.year, (row = { year: contest.year, total: 0, jury: 0, televote: 0 }));
        if (!p) return;
        if (filter.mode !== 'televote') {
            row.total += p.total;
            row.jury += p.jury;
        }
        if (filter.mode !== 'jury') row.televote += p.televote;
    });
    return byYear;
}

export interface Verdict {
    label: string;
    description: string;
}

/** A plain-language read on a pair, judged against how much an average country gives. */
export function friendshipVerdict(a: string, b: string, ab: PairStat | undefined, ba: PairStat | undefined, baseline: number): Verdict {
    if (!ab || !ba || ab.opportunities < 3 || ba.opportunities < 3 || baseline === 0) {
        return {
            label: 'Not enough history',
            description: `${a} and ${b} haven't shared enough contests in this range to say.`,
        };
    }
    const x = ab.avg / baseline;
    const y = ba.avg / baseline;

    if (x >= 2.5 && y >= 2.5) {
        return { label: 'Strong allies', description: `Both give each other well over twice the usual points.` };
    }
    if (x >= 1.5 && y >= 1.5) {
        return { label: 'Allies', description: `A reliable exchange of points in both directions.` };
    }
    if (x >= 1.8 && y < 1) {
        return { label: 'One-sided', description: `${a} consistently backs ${b}, but it isn't returned.` };
    }
    if (y >= 1.8 && x < 1) {
        return { label: 'One-sided', description: `${b} consistently backs ${a}, but it isn't returned.` };
    }
    if (x < 0.5 && y < 0.5) {
        return { label: 'Indifferent', description: `They rarely give each other anything.` };
    }
    if (x >= 1 && y >= 1) {
        return { label: 'Favourable', description: `Slightly warmer than the average pair of countries.` };
    }
    return { label: 'Neutral', description: `About what you'd expect from any two countries.` };
}

// === Jury vs televote ===

export interface SplitResult {
    entry: Entry;
    country: string;
    jury: number;
    televote: number;
    combined: number;
    actualPlace: number;
    juryRank: number;
    televoteRank: number;
}

function rankBy(results: SplitResult[], score: (r: SplitResult) => number): Map<SplitResult, number> {
    const sorted = [...results].sort((a, b) => score(b) - score(a) || a.actualPlace - b.actualPlace);
    return new Map(sorted.map((r, i) => [r, i + 1]));
}

/** Each finalist's jury and televote score for a split-vote final. */
export function splitResults(data: ContestData, year: number): SplitResult[] {
    const contest = data.contests.find((c) => c.year === year && c.isFinal);
    if (!contest?.split) return [];

    const received = new Map<string, { jury: number; televote: number }>();
    contest.points.forEach((given) => {
        given.forEach((p, to) => {
            const r = received.get(to) ?? { jury: 0, televote: 0 };
            r.jury += p.jury;
            r.televote += p.televote;
            received.set(to, r);
        });
    });

    const results: SplitResult[] = [];
    contest.competitors.forEach((country) => {
        const entry = data.entryByYearCountry.get(entryKey(year, country));
        if (!entry?.finalPlace?.place) return;
        const r = received.get(country) ?? { jury: 0, televote: 0 };
        results.push({
            entry,
            country,
            jury: r.jury,
            televote: r.televote,
            combined: r.jury + r.televote,
            actualPlace: entry.finalPlace.place,
            juryRank: 0,
            televoteRank: 0,
        });
    });

    const juryRanks = rankBy(results, (r) => r.jury);
    const televoteRanks = rankBy(results, (r) => r.televote);
    results.forEach((r) => {
        r.juryRank = juryRanks.get(r)!;
        r.televoteRank = televoteRanks.get(r)!;
    });
    return results.sort((a, b) => a.actualPlace - b.actualPlace);
}

export function splitYears(data: ContestData): number[] {
    return data.contests.filter((c) => c.isFinal && c.split).map((c) => c.year);
}

// === Country report card ===

export type QualificationStatus = 'qualified' | 'non-qualifier' | 'automatic' | 'absent';

const BIG_FOUR = ['United Kingdom', 'France', 'Germany', 'Spain'];
// guests and one-offs that went straight to the final
const EXTRA_AUTOMATIC: Record<number, string[]> = { 2015: ['Australia'] };

function isAutomaticQualifier(data: ContestData, country: string, year: number): boolean {
    if (BIG_FOUR.includes(country)) return true;
    if (country === 'Italy' && year >= 2011) return true;
    if (EXTRA_AUTOMATIC[year]?.includes(country)) return true;
    const previousYear = [...data.years].reverse().find((y) => y < year);
    const previousWinner = data.entries.find((e) => e.year.year === previousYear && e.finalPlace?.place === 1);
    return previousWinner?.country.name === country;
}

/** Whether every semi-final of a year has vote data, so semi participants can be read from it. */
function semiDataComplete(data: ContestData, year: number): boolean {
    const rounds = new Set(data.contests.filter((c) => c.year === year && !c.isFinal).map((c) => c.round));
    return rounds.has('Semi-Final') || (rounds.has('Semi-Final 1') && rounds.has('Semi-Final 2'));
}

/** How a country reached (or missed) each final since semi-finals began in 2004. */
export function qualificationRecord(data: ContestData, country: string): { year: number; status: QualificationStatus }[] {
    return data.years
        .filter((year) => year >= 2004)
        .map((year) => {
            const entry = data.entryByYearCountry.get(entryKey(year, country));
            if (!entry) return { year, status: 'absent' as const };
            if (!entry.finalPlace?.place) return { year, status: 'non-qualifier' as const };

            const inSemi = semiDataComplete(data, year)
                ? data.contests.some((c) => c.year === year && !c.isFinal && c.competitors.has(country))
                : !isAutomaticQualifier(data, country, year);
            return { year, status: inSemi ? ('qualified' as const) : ('automatic' as const) };
        });
}
