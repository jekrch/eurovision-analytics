import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import React, { useMemo, useState } from 'react';
import { ContestData } from '../../data/contestData';
import { SplitResult, splitResults, splitYears } from '../../data/votingStats';
import { applyHighchartsTheme, card, chartColors, colors, eyebrow } from '../../theme';
import Select from '../controls/Select';
import { ordinal } from '../../utils/format';
import { useVideoPip } from '../video/VideoPipContext';

applyHighchartsTheme();

const ALL = 'all';

interface JuryTelevoteScatterProps {
    data: ContestData;
}

const gap = (r: SplitResult) => r.juryRank - r.televoteRank;

const JuryTelevoteScatter: React.FC<JuryTelevoteScatterProps> = ({ data }) => {
    const years = useMemo(() => splitYears(data), [data]);
    const [year, setYear] = useState(String(years[years.length - 1]));
    const { play } = useVideoPip();

    const resultsByYear = useMemo(() => new Map(years.map((y) => [y, splitResults(data, y)])), [data, years]);
    const results = year === ALL ? years.flatMap((y) => resultsByYear.get(y)!) : resultsByYear.get(Number(year)) ?? [];

    const playResult = (r: SplitResult) => {
        const playlist = resultsByYear.get(r.entry.year.year)!.map((x) => x.entry);
        play(r.entry, playlist);
    };

    // label the winners and the entries the two audiences disagreed on most
    const labelled = new Set(
        [...results]
            .sort((a, b) => Math.abs(gap(b)) - Math.abs(gap(a)))
            .slice(0, year === ALL ? 6 : 4)
            .concat(year === ALL ? [] : results.filter((r) => r.actualPlace === 1))
    );

    const label = (r: SplitResult) => (year === ALL ? `${r.country} '${String(r.entry.year.year).slice(2)}` : r.country);

    const point = (r: SplitResult) => ({
        x: r.jury,
        y: r.televote,
        result: r,
        dataLabels: { enabled: labelled.has(r), format: label(r) },
    });

    const winners = results.filter((r) => r.actualPlace === 1);
    const others = results.filter((r) => r.actualPlace !== 1);
    const maxPoints = Math.max(10, ...results.map((r) => Math.max(r.jury, r.televote)));

    const options: Highcharts.Options = {
        chart: { type: 'scatter', height: 520, zooming: { type: 'xy' } },
        title: { text: undefined },
        xAxis: { title: { text: 'Jury points' }, min: 0, max: maxPoints, gridLineWidth: 1 },
        yAxis: { title: { text: 'Televote points' }, min: 0, max: maxPoints },
        legend: { enabled: true },
        tooltip: {
            useHTML: true,
            formatter: function (this: any) {
                const r: SplitResult | undefined = this.point.options.result;
                if (!r) return false;
                return `<b>${r.country} ${r.entry.year.year}</b> · finished ${ordinal(r.actualPlace)}<br/>
                    "${r.entry.name}" — ${r.entry.artist.name}<br/>
                    Jury: <b>${r.jury}</b> (${ordinal(r.juryRank)})<br/>
                    Televote: <b>${r.televote}</b> (${ordinal(r.televoteRank)})<br/>
                    <em>Click to play</em>`;
            },
        },
        plotOptions: {
            scatter: {
                cursor: 'pointer',
                marker: { radius: 6, lineWidth: 2, lineColor: colors.surfaceSecondary },
                dataLabels: { style: { fontSize: '11px', fontWeight: '500' }, y: -8 },
                point: {
                    events: {
                        click: function (this: any) {
                            playResult(this.options.result);
                        },
                    },
                },
            },
        },
        series: [
            {
                type: 'line',
                name: 'Equal support',
                data: [
                    [0, 0],
                    [maxPoints, maxPoints],
                ],
                color: colors.axisLine,
                dashStyle: 'Dash',
                lineWidth: 1,
                marker: { enabled: false },
                enableMouseTracking: false,
            },
            {
                type: 'scatter',
                name: 'Public favoured',
                color: chartColors[1],
                marker: { symbol: 'circle' },
                data: others.filter((r) => r.televote >= r.jury).map(point),
            },
            {
                type: 'scatter',
                name: 'Jury favoured',
                color: chartColors[0],
                marker: { symbol: 'square' },
                data: others.filter((r) => r.televote < r.jury).map(point),
            },
            {
                type: 'scatter',
                name: 'Winner',
                color: chartColors[3],
                marker: { symbol: 'diamond', radius: 9 },
                data: winners.map(point),
            },
        ],
    };

    const allResults = useMemo(() => years.flatMap((y) => resultsByYear.get(y)!), [years, resultsByYear]);
    const publicDarlings = [...allResults].sort((a, b) => gap(b) - gap(a)).slice(0, 6);
    const juryDarlings = [...allResults].sort((a, b) => gap(a) - gap(b)).slice(0, 6);

    return (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-10 mt-8">
            <div className={`${card} p-4 sm:p-6`}>
                <div className="flex flex-wrap items-end justify-between gap-3 mb-2">
                    <div>
                        <p className={eyebrow}>Final</p>
                        <Select
                            className="mt-1.5"
                            ariaLabel="Year"
                            value={year}
                            onChange={setYear}
                            options={[{ value: ALL, label: `All (${years[0]}–${years[years.length - 1]})` }].concat(
                                [...years].reverse().map((y) => ({ value: String(y), label: String(y) }))
                            )}
                        />
                    </div>
                    <p className="text-xs text-[var(--er-text-muted)]">
                        Above the line the public liked it more, below it the juries did. Drag to zoom, click a point to play.
                    </p>
                </div>
                <HighchartsReact highcharts={Highcharts} options={options} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                    <SplitTable
                        title="The public's darlings"
                        subtitle={`Televote ranked them far above the juries, ${years[0]} onward`}
                        rows={publicDarlings}
                        onPlay={playResult}
                    />
                    <SplitTable
                        title="The juries' darlings"
                        subtitle={`Juries ranked them far above the televote, ${years[0]} onward`}
                        rows={juryDarlings}
                        onPlay={playResult}
                    />
                </div>
            </div>
        </div>
    );
};

const SplitTable: React.FC<{ title: string; subtitle: string; rows: SplitResult[]; onPlay: (r: SplitResult) => void }> = ({
    title,
    subtitle,
    rows,
    onPlay,
}) => (
    <div>
        <p className="text-sm font-semibold text-[var(--er-text-primary)]">{title}</p>
        <p className="text-xs text-[var(--er-text-muted)]">{subtitle}</p>
        <table className="mt-3 w-full text-sm">
            <thead>
                <tr className="text-left">
                    <th className={`${eyebrow} py-1.5 font-medium`}>Entry</th>
                    <th className={`${eyebrow} py-1.5 font-medium text-right`}>Jury</th>
                    <th className={`${eyebrow} py-1.5 font-medium text-right`}>Public</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
                {rows.map((r) => (
                    <tr
                        key={r.entry.id}
                        className="cursor-pointer hover:bg-white/[0.03]"
                        onClick={() => onPlay(r)}
                        title="Play video"
                    >
                        <td className="py-1.5 pr-2">
                            <span className="text-[var(--er-text-primary)]">{r.country}</span>{' '}
                            <span className="text-[var(--er-text-muted)] tabular-nums">{r.entry.year.year}</span>
                            <p className="text-xs text-[var(--er-text-muted)] truncate max-w-[14rem]">"{r.entry.name}"</p>
                        </td>
                        <td className="py-1.5 text-right tabular-nums text-[var(--er-text-secondary)] whitespace-nowrap">
                            {ordinal(r.juryRank)} <span className="text-xs text-[var(--er-text-muted)]">({r.jury})</span>
                        </td>
                        <td className="py-1.5 text-right tabular-nums text-[var(--er-text-secondary)] whitespace-nowrap">
                            {ordinal(r.televoteRank)} <span className="text-xs text-[var(--er-text-muted)]">({r.televote})</span>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

export default JuryTelevoteScatter;
