import classNames from 'classnames';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import React, { useMemo, useState } from 'react';
import { ContestData, Entry } from '../../data/contestData';
import { computeAffinity, QualificationStatus, qualificationRecord, TWELVE_POINT_ERA } from '../../data/votingStats';
import { applyHighchartsTheme, card, chartColors, colors, eyebrow } from '../../theme';
import { ordinal } from '../../utils/format';
import CountryDropdown from '../CountryDropdown';
import StatTile from '../StatTile';
import { useVideoPip } from '../video/VideoPipContext';

applyHighchartsTheme();

// fewer shared contests than this and an average says more about luck than taste
const MIN_MEETINGS = 5;

const qualificationStyles: Record<QualificationStatus, { label: string; className: string }> = {
    qualified: { label: 'Qualified', className: 'bg-[var(--er-interactive-primary)]' },
    automatic: { label: 'Straight to the final', className: 'bg-[var(--er-border-tertiary)]' },
    'non-qualifier': { label: 'Out in the semi', className: 'bg-transparent ring-1 ring-inset ring-[var(--er-interactive-primary)]' },
    absent: { label: 'Did not take part', className: 'bg-white/5' },
};

type LanguageGroup = 'English' | 'Mixed with English' | 'Other languages';

function languageGroup(entry: Entry): LanguageGroup | null {
    const names = entry.languages.map((l) => l.name);
    if (!names.length) return null;
    if (!names.includes('English')) return 'Other languages';
    return names.length === 1 ? 'English' : 'Mixed with English';
}

interface CountryReportCardProps {
    data: ContestData;
}

const CountryReportCard: React.FC<CountryReportCardProps> = ({ data }) => {
    const [country, setCountry] = useState('Sweden');
    const { play } = useVideoPip();

    const affinity = useMemo(
        () => computeAffinity(data, { fromYear: TWELVE_POINT_ERA, toYear: data.years[data.years.length - 1], mode: 'combined', includeSemis: true }),
        [data]
    );

    const entries = useMemo(() => data.entries.filter((e) => e.country.name === country), [data, country]);
    const finals = entries.filter((e) => e.finalPlace?.place);
    const places = finals.map((e) => e.finalPlace.place);
    const wins = finals.filter((e) => e.finalPlace.place === 1);

    const finalSizes = useMemo(() => {
        const sizes = new Map<number, number>();
        data.entries.forEach((e) => {
            if (e.finalPlace?.place) sizes.set(e.year.year, Math.max(sizes.get(e.year.year) ?? 0, e.finalPlace.place));
        });
        return sizes;
    }, [data]);
    const lastPlaces = finals.filter((e) => e.finalPlace.place === finalSizes.get(e.year.year));
    const nulPoints = finals.filter((e) => e.totalPoints === 0);

    const record = useMemo(() => qualificationRecord(data, country), [data, country]);
    const semis = record.filter((r) => r.status === 'qualified' || r.status === 'non-qualifier');
    const qualified = semis.filter((r) => r.status === 'qualified').length;

    const { fans, favourites } = useMemo(() => {
        const fanList: { country: string; avg: number; twelves: number }[] = [];
        const favouriteList: typeof fanList = [];
        affinity.pairs.forEach((p) => {
            if (p.opportunities < MIN_MEETINGS) return;
            if (p.to === country) fanList.push({ country: p.from, avg: p.avg, twelves: p.twelves });
            if (p.from === country) favouriteList.push({ country: p.to, avg: p.avg, twelves: p.twelves });
        });
        const top = (list: typeof fanList) => list.sort((a, b) => b.avg - a.avg).slice(0, 6);
        return { fans: top(fanList), favourites: top(favouriteList) };
    }, [affinity, country]);

    const byPlace = [...finals].sort((a, b) => a.finalPlace.place - b.finalPlace.place || b.year.year - a.year.year);
    const best = byPlace.slice(0, 3);
    const worst = byPlace.slice(-3).reverse().filter((e) => !best.includes(e));

    const firstYear = entries[0]?.year.year;
    const lastYear = entries[entries.length - 1]?.year.year;
    const span = firstYear ? data.years.filter((y) => y >= firstYear && y <= lastYear) : [];

    const placeChart: Highcharts.Options = {
        chart: { type: 'line', height: 240 },
        title: { text: undefined },
        xAxis: { categories: span.map(String), labels: { step: span.length > 30 ? 5 : 2 } },
        yAxis: { reversed: true, min: 1, title: { text: 'Final place' }, allowDecimals: false },
        legend: { enabled: false },
        tooltip: {
            formatter: function (this: any) {
                const e: Entry | undefined = this.point.options.entry;
                if (!e) return false;
                return `<b>${e.year.year}</b> · ${ordinal(e.finalPlace.place)}<br/>"${e.name}" — ${e.artist.name}<br/><em>Click to play</em>`;
            },
        },
        plotOptions: {
            line: {
                cursor: 'pointer',
                connectNulls: true,
                lineWidth: 2,
                point: {
                    events: {
                        click: function (this: any) {
                            if (this.options.entry) play(this.options.entry, finals);
                        },
                    },
                },
            },
        },
        series: [
            {
                type: 'line',
                name: 'Final place',
                color: chartColors[0],
                marker: { radius: 3 },
                data: span.map((year) => {
                    const e = finals.find((f) => f.year.year === year);
                    if (!e) return null;
                    const won = e.finalPlace.place === 1;
                    return {
                        y: e.finalPlace.place,
                        entry: e,
                        marker: won ? { symbol: 'diamond', radius: 7, fillColor: chartColors[3] } : undefined,
                    };
                }),
            },
        ],
    };

    const languageChart = useMemo((): Highcharts.Options => {
        const groups: LanguageGroup[] = ['English', 'Mixed with English', 'Other languages'];
        const decades = Array.from(new Set(entries.map((e) => Math.floor(e.year.year / 10) * 10))).sort();
        const count = (decade: number, group: LanguageGroup) =>
            entries.filter((e) => Math.floor(e.year.year / 10) * 10 === decade && languageGroup(e) === group).length;
        return {
            chart: { type: 'column', height: 240 },
            title: { text: undefined },
            xAxis: { categories: decades.map((d) => `${d}s`) },
            yAxis: { title: { text: 'Share of entries' }, labels: { format: '{value}%' }, max: 100 },
            legend: { enabled: true },
            tooltip: { shared: true, pointFormat: '{series.name}: <b>{point.y}</b> ({point.percentage:.0f}%)<br/>' },
            plotOptions: { column: { stacking: 'percent', borderWidth: 0, borderRadius: 2 } },
            series: groups.map((group, i) => ({
                type: 'column' as const,
                name: group,
                color: [chartColors[0], chartColors[3], chartColors[1]][i],
                data: decades.map((d) => count(d, group)),
            })),
        };
    }, [entries]);

    return (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-10 mt-8">
            <div className={`${card} p-4 sm:p-6`}>
                <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
                    <div>
                        <p className={eyebrow}>Country</p>
                        <CountryDropdown
                            id="report-card-country"
                            className="mt-1.5"
                            countries={data.countries.map((name) => ({ id: name, name }))}
                            selectedCountry={country}
                            onCountryChange={setCountry}
                        />
                    </div>
                    {firstYear && (
                        <p className="text-sm text-[var(--er-text-muted)]">
                            {entries.length} entries since {firstYear}
                        </p>
                    )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatTile
                        label="Wins"
                        value={
                            <>
                                {wins.length}
                                {wins.length > 0 && (
                                    <span className="block text-xs font-normal text-[var(--er-text-muted)]">
                                        {wins.map((w) => w.year.year).join(', ')}
                                    </span>
                                )}
                            </>
                        }
                    />
                    <StatTile label="Top 10 finishes" value={places.filter((p) => p <= 10).length} />
                    <StatTile
                        label="Average final place"
                        value={places.length ? (places.reduce((a, b) => a + b, 0) / places.length).toFixed(1) : '–'}
                    />
                    <StatTile
                        label="Qualification rate"
                        value={
                            semis.length ? (
                                <>
                                    {Math.round((qualified / semis.length) * 100)}%
                                    <span className="text-sm font-normal text-[var(--er-text-muted)]"> {qualified}/{semis.length}</span>
                                </>
                            ) : (
                                '–'
                            )
                        }
                    />
                    <StatTile label="Finals" value={finals.length} />
                    <StatTile label="Best result" value={best[0] ? `${ordinal(best[0].finalPlace.place)} (${best[0].year.year})` : '–'} />
                    <StatTile label="Last places" value={lastPlaces.length} />
                    <StatTile label="Nul points" value={nulPoints.length} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                    <div className="min-w-0">
                        <p className={eyebrow}>Final placings</p>
                        <HighchartsReact highcharts={Highcharts} options={placeChart} />
                    </div>
                    <div>
                        <p className={eyebrow}>Semi-final record since 2004</p>
                        <div className="mt-4 grid grid-cols-6 sm:grid-cols-8 gap-2">
                            {record.map((r) => (
                                <div key={r.year} className="flex flex-col items-center gap-1" title={`${r.year}: ${qualificationStyles[r.status].label}`}>
                                    <span className={classNames('h-5 w-5 rounded-full', qualificationStyles[r.status].className)} />
                                    <span className="text-[0.65rem] tabular-nums text-[var(--er-text-muted)]">{r.year}</span>
                                </div>
                            ))}
                        </div>
                        <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--er-text-muted)]">
                            {(Object.keys(qualificationStyles) as QualificationStatus[]).map((status) => (
                                <li key={status} className="flex items-center gap-1.5">
                                    <span className={classNames('h-3 w-3 rounded-full', qualificationStyles[status].className)} />
                                    {qualificationStyles[status].label}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                    <PartnerBars
                        title="Biggest fans"
                        subtitle={`Who gives ${country} the most, per contest since ${TWELVE_POINT_ERA}`}
                        items={fans}
                        onSelect={setCountry}
                        selectable={(c) => data.countries.includes(c)}
                    />
                    <PartnerBars
                        title="Favourite countries"
                        subtitle={`Who ${country} gives the most to`}
                        items={favourites}
                        onSelect={setCountry}
                        selectable={(c) => data.countries.includes(c)}
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                    <div className="min-w-0">
                        <p className={eyebrow}>Language of the entries</p>
                        <HighchartsReact highcharts={Highcharts} options={languageChart} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <ResultList title="Best results" entries={best} onPlay={(e) => play(e, finals)} />
                        <ResultList title="Lowest finishes" entries={worst} onPlay={(e) => play(e, finals)} />
                    </div>
                </div>
            </div>
        </div>
    );
};

const PartnerBars: React.FC<{
    title: string;
    subtitle: string;
    items: { country: string; avg: number; twelves: number }[];
    onSelect: (country: string) => void;
    selectable: (country: string) => boolean;
}> = ({ title, subtitle, items, onSelect, selectable }) => {
    const max = Math.max(1, ...items.map((i) => i.avg));
    return (
        <div>
            <p className="text-sm font-semibold text-[var(--er-text-primary)]">{title}</p>
            <p className="text-xs text-[var(--er-text-muted)]">{subtitle}</p>
            <ul className="mt-3 space-y-2">
                {items.map((item) => (
                    <li key={item.country}>
                        <button
                            type="button"
                            disabled={!selectable(item.country)}
                            onClick={() => onSelect(item.country)}
                            className="group w-full text-left disabled:cursor-default"
                            title={selectable(item.country) ? `Open ${item.country}'s report card` : undefined}
                        >
                            <div className="flex justify-between text-sm">
                                <span className={classNames('text-[var(--er-text-secondary)]', selectable(item.country) && 'group-hover:underline')}>
                                    {item.country}
                                </span>
                                <span className="tabular-nums text-[var(--er-text-muted)]">
                                    {item.avg.toFixed(1)} avg{item.twelves > 0 && ` · ${item.twelves}× 12`}
                                </span>
                            </div>
                            <div className="mt-1 h-1.5 rounded-full bg-white/5">
                                <div className="h-1.5 rounded-full" style={{ width: `${(item.avg / max) * 100}%`, background: colors.copper }} />
                            </div>
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

const ResultList: React.FC<{ title: string; entries: Entry[]; onPlay: (e: Entry) => void }> = ({ title, entries, onPlay }) => (
    <div>
        <p className={eyebrow}>{title}</p>
        <ul className="mt-2 space-y-2">
            {entries.map((e) => (
                <li key={e.id}>
                    <button type="button" className="group text-left w-full" onClick={() => onPlay(e)} title="Play video">
                        <p className="text-sm text-[var(--er-text-primary)] group-hover:underline">
                            <span className="tabular-nums font-semibold">{ordinal(e.finalPlace.place)}</span>
                            <span className="text-[var(--er-text-muted)]"> in {e.year.year}</span>
                        </p>
                        <p className="text-xs text-[var(--er-text-muted)] truncate">
                            "{e.name}" — {e.artist.name}
                        </p>
                    </button>
                </li>
            ))}
        </ul>
    </div>
);

export default CountryReportCard;
