import classNames from 'classnames';
import React, { useMemo, useState } from 'react';
import { ContestData } from '../../data/contestData';
import { SplitResult, splitResults, splitYears, VoteMode } from '../../data/votingStats';
import { card, chartColors, eyebrow } from '../../theme';
import { ordinal } from '../../utils/format';
import SegmentedControl from '../controls/SegmentedControl';
import Select from '../controls/Select';
import StatTile from '../StatTile';
import { useVideoPip } from '../video/VideoPipContext';

const ROW_HEIGHT = 44;

const score = (r: SplitResult, mode: VoteMode) =>
    mode === 'jury' ? r.jury : mode === 'televote' ? r.televote : r.combined;

/** Finalists ranked by one vote type; the combined ranking keeps the official places (and tie-breaks). */
function rank(results: SplitResult[], mode: VoteMode): SplitResult[] {
    if (mode === 'combined') return [...results].sort((a, b) => a.actualPlace - b.actualPlace);
    return [...results].sort((a, b) =>
        mode === 'jury' ? a.juryRank - b.juryRank : a.televoteRank - b.televoteRank
    );
}

interface WhatIfRerankProps {
    data: ContestData;
}

const WhatIfRerank: React.FC<WhatIfRerankProps> = ({ data }) => {
    const years = useMemo(() => splitYears(data), [data]);
    const [year, setYear] = useState(years[years.length - 1]);
    const [mode, setMode] = useState<VoteMode>('combined');
    const { play } = useVideoPip();

    const results = useMemo(() => splitResults(data, year), [data, year]);
    const ranked = rank(results, mode);
    const position = new Map(ranked.map((r, i) => [r, i]));
    const maxScore = Math.max(1, ...results.map((r) => score(r, mode)));

    const winnerOf = (m: VoteMode) => rank(results, m)[0];

    const history = useMemo(
        () =>
            years.map((y) => {
                const rs = splitResults(data, y);
                return { year: y, actual: rank(rs, 'combined')[0], jury: rank(rs, 'jury')[0], televote: rank(rs, 'televote')[0] };
            }).reverse(),
        [data, years]
    );

    return (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-10 mt-8">
            <div className={`${card} p-4 sm:p-6`}>
                <div className="flex flex-wrap items-end gap-x-6 gap-y-4 mb-5">
                    <div>
                        <p className={eyebrow}>Final</p>
                        <Select
                            className="mt-1.5"
                            ariaLabel="Year"
                            value={String(year)}
                            onChange={(v) => setYear(Number(v))}
                            options={[...years].reverse().map((y) => ({ value: String(y), label: String(y) }))}
                        />
                    </div>
                    <div>
                        <p className={classNames(eyebrow, 'mb-1.5')}>Count only</p>
                        <SegmentedControl<VoteMode>
                            ariaLabel="Scoring"
                            value={mode}
                            onChange={setMode}
                            options={[
                                { value: 'combined', label: 'Both (actual)' },
                                { value: 'jury', label: 'Jury' },
                                { value: 'televote', label: 'Televote' },
                            ]}
                        />
                    </div>
                </div>

                {results.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                        {(['combined', 'jury', 'televote'] as VoteMode[]).map((m) => {
                            const w = winnerOf(m);
                            return (
                                <button key={m} type="button" className="text-left" onClick={() => setMode(m)}>
                                    <StatTile
                                        label={m === 'combined' ? 'Actual winner' : m === 'jury' ? 'Jury winner' : 'Televote winner'}
                                        value={
                                            <span className={classNames(m === mode && 'text-[var(--er-accent-gold)]')}>
                                                {w.country}
                                            </span>
                                        }
                                    />
                                </button>
                            );
                        })}
                    </div>
                )}

                <div className="flex items-center gap-4 mb-2 text-xs text-[var(--er-text-muted)]">
                    <span className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-sm" style={{ background: chartColors[0] }} /> Jury
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-sm" style={{ background: chartColors[1] }} /> Televote
                    </span>
                    <span className="ml-auto">▲▼ places gained or lost against the real result</span>
                </div>

                {/* rows are absolutely positioned so switching the count slides them into their new places */}
                <div className="relative" style={{ height: results.length * ROW_HEIGHT }}>
                    {results.map((r) => {
                        const index = position.get(r)!;
                        const change = r.actualPlace - (index + 1);
                        const juryWidth = mode === 'televote' ? 0 : (r.jury / maxScore) * 100;
                        const televoteWidth = mode === 'jury' ? 0 : (r.televote / maxScore) * 100;
                        return (
                            <div
                                key={r.entry.id}
                                className="absolute inset-x-0 flex items-center gap-3 px-2 rounded-lg hover:bg-white/[0.03] transition-[top] duration-700 ease-in-out"
                                style={{ top: index * ROW_HEIGHT, height: ROW_HEIGHT }}
                            >
                                <span
                                    className={classNames(
                                        'w-7 text-right text-sm font-semibold tabular-nums',
                                        index === 0 ? 'text-[var(--er-accent-gold)]' : 'text-[var(--er-text-muted)]'
                                    )}
                                >
                                    {index + 1}
                                </span>
                                <span className="w-9 text-xs tabular-nums">
                                    {mode !== 'combined' && change !== 0 && (
                                        <span style={{ color: change > 0 ? chartColors[2] : chartColors[4] }}>
                                            {change > 0 ? '▲' : '▼'}
                                            {Math.abs(change)}
                                        </span>
                                    )}
                                </span>
                                <button
                                    type="button"
                                    className="w-40 sm:w-56 min-w-0 text-left"
                                    title="Play video"
                                    onClick={() => play(r.entry, ranked.map((x) => x.entry))}
                                >
                                    <p className="truncate text-sm font-medium text-[var(--er-text-primary)] hover:underline">{r.country}</p>
                                    <p className="truncate text-xs text-[var(--er-text-muted)]">
                                        {r.entry.artist.name} · "{r.entry.name}"
                                    </p>
                                </button>
                                <div className="flex-1 flex h-3 min-w-0 gap-[2px]">
                                    <div
                                        className="h-3 rounded-l transition-[width] duration-700 ease-in-out"
                                        style={{ width: `${juryWidth}%`, background: chartColors[0] }}
                                    />
                                    <div
                                        className="h-3 rounded-r transition-[width] duration-700 ease-in-out"
                                        style={{ width: `${televoteWidth}%`, background: chartColors[1] }}
                                    />
                                </div>
                                <span className="w-24 text-right text-sm tabular-nums text-[var(--er-text-secondary)]">
                                    {score(r, mode)}
                                    <span className="text-xs text-[var(--er-text-muted)]"> pts</span>
                                </span>
                            </div>
                        );
                    })}
                </div>

                <p className={classNames(eyebrow, 'mt-10 mb-2')}>Every split-vote final</p>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left">
                                <th className={`${eyebrow} py-2 pr-4 font-medium`}>Year</th>
                                <th className={`${eyebrow} py-2 pr-4 font-medium`}>Winner</th>
                                <th className={`${eyebrow} py-2 pr-4 font-medium`}>Juries alone</th>
                                <th className={`${eyebrow} py-2 font-medium`}>Televote alone</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {history.map((h) => (
                                <tr
                                    key={h.year}
                                    className={classNames('cursor-pointer hover:bg-white/[0.03]', h.year === year && 'bg-white/[0.04]')}
                                    onClick={() => setYear(h.year)}
                                >
                                    <td className="py-2 pr-4 tabular-nums text-[var(--er-text-muted)]">{h.year}</td>
                                    <td className="py-2 pr-4 text-[var(--er-text-primary)]">{h.actual?.country}</td>
                                    <HistoryCell winner={h.jury} actual={h.actual} />
                                    <HistoryCell winner={h.televote} actual={h.actual} />
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const HistoryCell: React.FC<{ winner?: SplitResult; actual?: SplitResult }> = ({ winner, actual }) => {
    const same = winner?.country === actual?.country;
    return (
        <td className={classNames('py-2 pr-4', same ? 'text-[var(--er-text-muted)]' : 'text-[var(--er-accent-gold)] font-medium')}>
            {winner?.country}
            {winner && !same && <span className="ml-1.5 text-xs font-normal text-[var(--er-text-muted)]">(really {ordinal(winner.actualPlace)})</span>}
        </td>
    );
};

export default WhatIfRerank;
