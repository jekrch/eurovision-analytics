import { useEffect, useState } from 'react';
import { Song } from '../models/Song';

export const GRAPHQL_URL = 'http://localhost:4000/graphql';

export type VoteType = 'Total' | 'Jury' | 'Televote';

export interface Vote {
    year: number;
    round: string;
    voteType: VoteType;
    fromCountry: string;
    toCountry: string;
    points: number;
}

/** A song with the extra fields the voting pages need. finalPlace is null for non-qualifiers. */
export interface Entry extends Song {
    finalRunningOrder: number | null;
    languages: { name: string }[];
}

export interface PointsByType {
    total: number;
    jury: number;
    televote: number;
}

/** One round of one year's contest (e.g. 2019 Semi-Final 2). */
export interface Contest {
    key: string;
    year: number;
    round: string;
    isFinal: boolean;
    /** Jury and televote were reported separately (2016 onward). */
    split: boolean;
    /** Countries performing in this round. */
    competitors: Set<string>;
    /** Vote types each voting country cast in this round. */
    voterTypes: Map<string, Set<VoteType>>;
    /** points[from][to] */
    points: Map<string, Map<string, PointsByType>>;
}

export interface ContestData {
    votes: Vote[];
    entries: Entry[];
    contests: Contest[];
    /** Countries that have competed, sorted by name. */
    countries: string[];
    /** Years a contest took place, ascending. */
    years: number[];
    /** Entries keyed by `${year}|${country}`. */
    entryByYearCountry: Map<string, Entry>;
}

export const REST_OF_WORLD = 'Rest of World';

export const entryKey = (year: number, country: string) => `${year}|${country}`;

async function graphql<T>(query: string): Promise<T> {
    const response = await fetch(GRAPHQL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
    });
    const result = await response.json();
    if (result.errors?.length) {
        throw new Error(result.errors[0].message);
    }
    return result.data as T;
}

function buildContests(votes: Vote[], entries: Entry[]): Contest[] {
    const byKey = new Map<string, Contest>();

    const contestFor = (year: number, round: string) => {
        const key = `${year}|${round}`;
        let contest = byKey.get(key);
        if (!contest) {
            contest = {
                key,
                year,
                round,
                isFinal: round === 'Final',
                split: false,
                competitors: new Set(),
                voterTypes: new Map(),
                points: new Map(),
            };
            byKey.set(key, contest);
        }
        return contest;
    };

    votes.forEach((vote) => {
        const contest = contestFor(vote.year, vote.round);
        if (vote.voteType !== 'Total') contest.split = true;

        contest.competitors.add(vote.toCountry);

        let types = contest.voterTypes.get(vote.fromCountry);
        if (!types) contest.voterTypes.set(vote.fromCountry, (types = new Set()));
        types.add(vote.voteType);

        let given = contest.points.get(vote.fromCountry);
        if (!given) contest.points.set(vote.fromCountry, (given = new Map()));
        let pair = given.get(vote.toCountry);
        if (!pair) given.set(vote.toCountry, (pair = { total: 0, jury: 0, televote: 0 }));
        if (vote.voteType === 'Total') pair.total += vote.points;
        if (vote.voteType === 'Jury') pair.jury += vote.points;
        if (vote.voteType === 'Televote') pair.televote += vote.points;
    });

    // finalists who scored nothing never appear as a recipient
    entries.forEach((entry) => {
        if (entry.finalPlace?.place) {
            contestFor(entry.year.year, 'Final').competitors.add(entry.country.name);
        }
    });

    return Array.from(byKey.values()).sort((a, b) => a.year - b.year || a.round.localeCompare(b.round));
}

let contestDataPromise: Promise<ContestData> | null = null;

/** Loads every vote and entry once and shares them across the pages that need them. */
export function loadContestData(): Promise<ContestData> {
    if (!contestDataPromise) {
        contestDataPromise = Promise.all([
            graphql<{ votes: Vote[] }>(`
                query {
                    votes { year round voteType fromCountry toCountry points }
                }
            `),
            graphql<{ songs: Entry[] }>(`
                query {
                    songs {
                        id
                        name
                        youtubeUrl
                        totalPoints
                        finalRunningOrder
                        finalPlace { place }
                        country { name }
                        year { year }
                        artist { name }
                        languages { name }
                    }
                }
            `),
        ])
            .then(([{ votes }, { songs }]) => {
                const entries = songs.sort((a, b) => a.year.year - b.year.year || a.country.name.localeCompare(b.country.name));
                const entryByYearCountry = new Map(entries.map((e) => [entryKey(e.year.year, e.country.name), e]));
                return {
                    votes,
                    entries,
                    contests: buildContests(votes, entries),
                    countries: Array.from(new Set(entries.map((e) => e.country.name))).sort(),
                    years: Array.from(new Set(entries.map((e) => e.year.year))).sort((a, b) => a - b),
                    entryByYearCountry,
                };
            })
            .catch((error) => {
                // let the next mount retry
                contestDataPromise = null;
                throw error;
            });
    }
    return contestDataPromise;
}

export function useContestData(): { data: ContestData | null; error: string | null } {
    const [data, setData] = useState<ContestData | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;
        loadContestData()
            .then((d) => active && setData(d))
            .catch((e) => active && setError(e.message ?? String(e)));
        return () => {
            active = false;
        };
    }, []);

    return { data, error };
}
