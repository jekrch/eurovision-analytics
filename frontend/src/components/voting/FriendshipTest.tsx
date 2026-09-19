import classNames from 'classnames';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import React, { useMemo, useState } from 'react';
import { ContestData } from '../../data/contestData';
import { computeAffinity, friendshipVerdict, pairKey, PairStat, VoteMode, yearlyExchange } from '../../data/votingStats';
import { applyHighchartsTheme, card, chartColors, colors, eyebrow } from '../../theme';
import CountryDropdown from '../CountryDropdown';
import SegmentedControl from '../controls/SegmentedControl';
import YearRangeSlider from '../controls/YearRangeSlider';

applyHighchartsTheme();

interface FriendshipTestProps {
    data: ContestData;
}

const FriendshipTest: React.FC<FriendshipTestProps> = ({ data }) => {
    const minYear = data.years[0];
    const maxYear = data.years[data.years.length - 1];

    const [countryA, setCountryA] = useState('Greece');
    const [countryB, setCountryB] = useState('Cyprus');
    const [fromYear, setFromYear] = useState(minYear);
    const [toYear, setToYear] = useState(maxYear);
    const [includeSemis, setIncludeSemis] = useState(true);
    const mode: VoteMode = 'combined';

    const filter = useMemo(() => ({ fromYear, toYear, mode, includeSemis }), [fromYear, toYear, includeSemis]);
    const affinity = useMemo(() => computeAffinity(data, filter), [data, filter]);

    const ab = affinity.pairs.get(pairKey(countryA, countryB));
    const ba = affinity.pairs.get(pairKey(countryB, countryA));
    const verdict = friendshipVerdict(countryA, countryB, ab, ba, affinity.baseline);

    const countryOptions = data.countries.map((name) => ({ id: name, name }));

    const chartOptions = useMemo((): Highcharts.Options => {
        const aToB = yearlyExchange(data, filter, countryA, countryB);
        const bToA = yearlyExchange(data, filter, countryB, countryA);
        const years = Array.from(new Set([...Array.from(aToB.keys()), ...Array.from(bToA.keys())])).sort((x, y) => x - y);

        // real scoreboard points; from 2016 that's the jury and televote sets added together
        const value = (map: typeof aToB, year: number) => {
            const row = map.get(year);
            return row ? row.total + row.jury + row.televote : null;
        };

        return {
            chart: { type: 'column', height: 320 },
            title: { text: undefined },
            xAxis: { categories: years.map(String), labels: { step: years.length > 30 ? 2 : 1 } },
            yAxis: {
                title: { text: 'Points' },
                labels: { formatter: function () { return String(Math.abs(Number(this.value))); } },
                plotLines: [{ value: 0, color: colors.axisLine, width: 1 }],
            },
            legend: { enabled: true },
            tooltip: {
                shared: true,
                formatter: function (this: any) {
                    const year = Number(this.x ?? this.points?.[0]?.key);
                    const line = (from: string, to: string, row?: { total: number; jury: number; televote: number }) => {
                        if (!row) return `${from} → ${to}: <i>didn't meet</i>`;
                        if (row.jury || row.televote) {
                            return `${from} → ${to}: <b>${row.jury + row.televote}</b> (jury ${row.jury}, televote ${row.televote})`;
                        }
                        return `${from} → ${to}: <b>${row.total}</b>`;
                    };
                    return `<b>${year}</b><br/>${line(countryA, countryB, aToB.get(year))}<br/>${line(countryB, countryA, bToA.get(year))}`;
                },
            },
            plotOptions: {
                column: { stacking: 'normal', borderWidth: 0, borderRadius: 2, groupPadding: 0.1, pointPadding: 0.05 },
            },
            series: [
                {
                    type: 'column',
                    name: `${countryA} → ${countryB}`,
                    stack: 'exchange',
                    color: chartColors[0],
                    data: years.map((y) => value(aToB, y)),
                },
                {
                    type: 'column',
                    name: `${countryB} → ${countryA}`,
                    stack: 'exchange',
                    color: chartColors[1],
                    data: years.map((y) => {
                        const v = value(bToA, y);
                        return v === null ? null : -v;
                    }),
                },
            ],
        };
    }, [data, filter, countryA, countryB]);

    return (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-10 mt-8">
            <div className={`${card} p-4 sm:p-6`}>
                <div className="flex flex-wrap items-end gap-x-4 gap-y-4 mb-6">
                    <div>
                        <p className={eyebrow}>Country</p>
                        <CountryDropdown id="friendship-country-a" className="mt-1.5" countries={countryOptions} selectedCountry={countryA} onCountryChange={setCountryA} />
                    </div>
                    <button
                        type="button"
                        title="Swap countries"
                        aria-label="Swap countries"
                        onClick={() => {
                            setCountryA(countryB);
                            setCountryB(countryA);
                        }}
                        className="h-[2.25em] w-9 rounded-lg text-[var(--er-text-subtle)] hover:text-[var(--er-text-primary)] hover:bg-white/5"
                    >
                        ⇄
                    </button>
                    <div>
                        <p className={eyebrow}>and</p>
                        <CountryDropdown id="friendship-country-b" className="mt-1.5" countries={countryOptions} selectedCountry={countryB} onCountryChange={setCountryB} />
                    </div>
                    <div className="w-60 sm:ml-4">
                        <p className={eyebrow}>Years</p>
                        <YearRangeSlider
                            className="mt-1"
                            min={minYear}
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

                {countryA === countryB ? (
                    <p className="text-sm text-[var(--er-text-muted)]">Pick two different countries.</p>
                ) : (
                    <>
                        <div className="rounded-xl bg-white/[0.04] ring-1 ring-inset ring-white/10 p-4 sm:p-5 mb-6 text-center">
                            <p className={eyebrow}>Verdict</p>
                            <p className="mt-1 text-2xl font-semibold text-[var(--er-accent-gold)]">{verdict.label}</p>
                            <p className="mt-1 text-sm text-[var(--er-text-secondary)]">{verdict.description}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <DirectionCard from={countryA} to={countryB} stat={ab} baseline={affinity.baseline} color={chartColors[0]} />
                            <DirectionCard from={countryB} to={countryA} stat={ba} baseline={affinity.baseline} color={chartColors[1]} />
                        </div>

                        <p className={classNames(eyebrow, 'mb-2')}>Points exchanged each year</p>
                        <HighchartsReact highcharts={Highcharts} options={chartOptions} />
                    </>
                )}
            </div>
        </div>
    );
};

const DirectionCard: React.FC<{ from: string; to: string; stat?: PairStat; baseline: number; color: string }> = ({
    from,
    to,
    stat,
    baseline,
    color,
}) => (
    <div className="rounded-xl bg-white/[0.04] ring-1 ring-inset ring-white/10 p-4">
        <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: color }} />
            <p className="text-sm font-semibold text-[var(--er-text-primary)]">
                {from} → {to}
            </p>
        </div>
        {stat ? (
            <dl className="mt-3 grid grid-cols-3 gap-3">
                <div>
                    <dt className={eyebrow}>Avg points</dt>
                    <dd className="mt-0.5 text-xl font-semibold tabular-nums text-[var(--er-text-primary)]">{stat.avg.toFixed(1)}</dd>
                    <dd className="text-xs text-[var(--er-text-muted)]">
                        {baseline ? `${(stat.avg / baseline).toFixed(1)}× typical` : ''}
                    </dd>
                </div>
                <div>
                    <dt className={eyebrow}>Douze points</dt>
                    <dd className="mt-0.5 text-xl font-semibold tabular-nums text-[var(--er-text-primary)]">{stat.twelves}</dd>
                </div>
                <div>
                    <dt className={eyebrow}>Scored</dt>
                    <dd className="mt-0.5 text-xl font-semibold tabular-nums text-[var(--er-text-primary)]">
                        {stat.timesScored}
                        <span className="text-sm font-normal text-[var(--er-text-muted)]"> / {stat.opportunities}</span>
                    </dd>
                </div>
            </dl>
        ) : (
            <p className="mt-3 text-sm text-[var(--er-text-muted)]">{from} never voted while {to} was on stage in this range.</p>
        )}
    </div>
);

export default FriendshipTest;
