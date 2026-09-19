import classNames from 'classnames';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import React, { useMemo, useState } from 'react';
import { ContestData } from '../../data/contestData';
import { computeAffinity, SPLIT_VOTE_ERA, TWELVE_POINT_ERA, VoteMode } from '../../data/votingStats';
import { applyHighchartsTheme, card, chartColors, eyebrow } from '../../theme';
import SegmentedControl from '../controls/SegmentedControl';
import YearRangeSlider from '../controls/YearRangeSlider';

applyHighchartsTheme();

const TOP = 15;
// voters with fewer 12s than this haven't given enough to judge how spread out they are
const MIN_TWELVES_GIVEN = 20;

interface DouzePointsProps {
    data: ContestData;
}

const DouzePoints: React.FC<DouzePointsProps> = ({ data }) => {
    const maxYear = data.years[data.years.length - 1];

    const [fromYear, setFromYear] = useState(TWELVE_POINT_ERA);
    const [toYear, setToYear] = useState(maxYear);
    const [mode, setMode] = useState<VoteMode>('combined');
    const [includeSemis, setIncludeSemis] = useState(true);
    const [focus, setFocus] = useState<string | null>(null);

    const affinity = useMemo(
        () => computeAffinity(data, { fromYear, toYear, mode, includeSemis }),
        [data, fromYear, toYear, mode, includeSemis]
    );

    const { received, loyalPairs, independents, donorsByCountry } = useMemo(() => {
        const receivedMap = new Map<string, number>();
        const donors = new Map<string, { from: string; twelves: number }[]>();
        const pairs = Array.from(affinity.pairs.values());

        pairs.forEach((p) => {
            if (!p.twelves) return;
            receivedMap.set(p.to, (receivedMap.get(p.to) ?? 0) + p.twelves);
            if (!donors.has(p.to)) donors.set(p.to, []);
            donors.get(p.to)!.push({ from: p.from, twelves: p.twelves });
        });
        donors.forEach((list) => list.sort((a, b) => b.twelves - a.twelves || a.from.localeCompare(b.from)));

        return {
            received: Array.from(receivedMap.entries())
                .map(([country, twelves]) => ({ country, twelves }))
                .sort((a, b) => b.twelves - a.twelves || a.country.localeCompare(b.country))
                .slice(0, TOP),
            loyalPairs: pairs
                .filter((p) => p.twelves > 0)
                .sort((a, b) => b.twelves - a.twelves || b.avg - a.avg)
                .slice(0, 10),
            // the opposite of loyalty: voters whose 12s went to the most different countries
            independents: Array.from(
                pairs.reduce((byVoter, p) => {
                    if (!p.twelves) return byVoter;
                    const v = byVoter.get(p.from) ?? { country: p.from, twelves: 0, recipients: 0 };
                    v.twelves += p.twelves;
                    v.recipients += 1;
                    return byVoter.set(p.from, v);
                }, new Map<string, { country: string; twelves: number; recipients: number }>()).values()
            )
                .filter((v) => v.twelves >= MIN_TWELVES_GIVEN)
                .sort((a, b) => b.recipients / b.twelves - a.recipients / a.twelves || b.twelves - a.twelves)
                .slice(0, 10),
            donorsByCountry: donors,
        };
    }, [affinity]);

    const focused = focus && received.some((r) => r.country === focus) ? focus : received[0]?.country ?? null;
    const focusDonors = focused ? donorsByCountry.get(focused) ?? [] : [];

    const chartOptions: Highcharts.Options = {
        chart: { type: 'bar', height: 30 * received.length + 60 },
        title: { text: undefined },
        xAxis: { categories: received.map((r) => r.country), title: { text: null } },
        yAxis: { title: { text: '12-point scores received' }, allowDecimals: false },
        legend: { enabled: false },
        tooltip: {
            formatter: function (this: any) {
                return `<b>${this.key}</b><br/>${this.y} × 12 points<br/><em>Click to see who gave them</em>`;
            },
        },
        plotOptions: {
            bar: {
                cursor: 'pointer',
                borderWidth: 0,
                borderRadius: 4,
                dataLabels: { enabled: true },
                point: {
                    events: {
                        click: function (this: any) {
                            setFocus(this.category);
                        },
                    },
                },
            },
        },
        series: [
            {
                type: 'bar',
                name: '12 points',
                data: received.map((r) => ({
                    y: r.twelves,
                    color: r.country === focused ? chartColors[3] : chartColors[0],
                })),
            },
        ],
    };

    return (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-10 mt-8">
            <div className={`${card} p-4 sm:p-6`}>
                <div className="flex flex-wrap items-end gap-x-6 gap-y-4 mb-4">
                    <div className="w-60">
                        <p className={eyebrow}>Years</p>
                        <YearRangeSlider
                            className="mt-1"
                            min={TWELVE_POINT_ERA}
                            max={maxYear}
                            from={fromYear}
                            to={toYear}
                            onChange={(f, t) => {
                                setFromYear(f);
                                setToYear(t);
                            }}
                        />
                    </div>
                    <div>
                        <p className={classNames(eyebrow, 'mb-1.5')}>Votes</p>
                        <SegmentedControl<VoteMode>
                            ariaLabel="Vote type"
                            value={mode}
                            onChange={setMode}
                            options={[
                                { value: 'combined', label: 'All' },
                                { value: 'jury', label: 'Jury' },
                                { value: 'televote', label: 'Televote' },
                            ]}
                        />
                    </div>
                    <div>
                        <p className={classNames(eyebrow, 'mb-1.5')}>Rounds</p>
                        <SegmentedControl<'all' | 'final'>
                            ariaLabel="Rounds"
                            value={includeSemis ? 'all' : 'final'}
                            onChange={(v) => setIncludeSemis(v === 'all')}
                            options={[
                                { value: 'all', label: 'All rounds' },
                                { value: 'final', label: 'Finals only' },
                            ]}
                        />
                    </div>
                </div>
                <p className="text-xs text-[var(--er-text-muted)] mb-4">
                    Counts start in {TWELVE_POINT_ERA}, when 12 became the top score.
                    {mode === 'combined'
                        ? ` Since ${SPLIT_VOTE_ERA} a country's jury and televote each award their own 12.`
                        : ` Separate ${mode} results start in ${SPLIT_VOTE_ERA}.`}
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_18rem] gap-6">
                    <div className="min-w-0">
                        <p className={eyebrow}>Most 12s received</p>
                        <HighchartsReact highcharts={Highcharts} options={chartOptions} />
                    </div>
                    <div>
                        <p className={eyebrow}>Who gave {focused ?? '…'} their 12s</p>
                        <ul className="mt-2 max-h-[26rem] overflow-y-auto pr-1 space-y-1">
                            {focusDonors.map((d) => (
                                <li key={d.from} className="flex justify-between text-sm">
                                    <span className="text-[var(--er-text-secondary)]">{d.from}</span>
                                    <span className="tabular-nums text-[var(--er-text-muted)]">{d.twelves}×</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                    <PairTable
                        title="Most loyal douze points"
                        subtitle="The most 12s from one country to another"
                        rows={loyalPairs.map((p) => ({ from: p.from, to: p.to, value: `${p.twelves}× 12`, detail: `of ${p.opportunities} chances` }))}
                    />
                    <PairTable
                        title="Most independent voters"
                        subtitle="Countries whose 12s went to the most different places"
                        rows={independents.map((v) => ({
                            from: v.country,
                            value: `${v.recipients} countries`,
                            detail: `from ${v.twelves}× 12`,
                        }))}
                    />
                </div>
            </div>
        </div>
    );
};

const PairTable: React.FC<{
    title: string;
    subtitle: string;
    rows: { from: string; to?: string; value: string; detail: string }[];
}> = ({ title, subtitle, rows }) => (
    <div>
        <p className="text-sm font-semibold text-[var(--er-text-primary)]">{title}</p>
        <p className="text-xs text-[var(--er-text-muted)]">{subtitle}</p>
        <table className="mt-3 w-full text-sm">
            <tbody className="divide-y divide-white/5">
                {rows.map((row, i) => (
                    <tr key={`${row.from}|${row.to}`}>
                        <td className="py-1.5 pr-2 w-6 tabular-nums text-[var(--er-text-muted)]">{i + 1}</td>
                        <td className="py-1.5 text-[var(--er-text-secondary)]">
                            {row.from}
                            {row.to && (
                                <>
                                    {' '}<span className="text-[var(--er-text-muted)]">→</span> {row.to}
                                </>
                            )}
                        </td>
                        <td className="py-1.5 text-right whitespace-nowrap">
                            <span className="font-semibold tabular-nums text-[var(--er-text-primary)]">{row.value}</span>
                            <span className="ml-2 text-xs text-[var(--er-text-muted)]">{row.detail}</span>
                        </td>
                    </tr>
                ))}
                {rows.length === 0 && (
                    <tr>
                        <td className="py-2 text-[var(--er-text-muted)]">Nothing in this range.</td>
                    </tr>
                )}
            </tbody>
        </table>
    </div>
);

export default DouzePoints;
