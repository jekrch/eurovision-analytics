import * as d3 from 'd3';
import classNames from 'classnames';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ContestData, REST_OF_WORLD } from '../../data/contestData';
import { Affinity, computeAffinity, pairKey, TWELVE_POINT_ERA, VoteMode } from '../../data/votingStats';
import { card, chartColors, colors, eyebrow } from '../../theme';
import SegmentedControl from '../controls/SegmentedControl';
import YearRangeSlider from '../controls/YearRangeSlider';

interface GraphNode extends d3.SimulationNodeDatum {
    id: string;
    bloc: number;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
    source: string | GraphNode;
    target: string | GraphNode;
    strength: number;
    /** strength relative to the average pair */
    ratio: number;
}

interface Bloc {
    id: number;
    name: string;
    members: string[];
    color: string;
}

const HEIGHT = 580;
// pairs that met fewer times than this are too noisy to call friends
const MIN_MEETINGS = 4;
const UNGROUPED = colors.textMuted;

const endpoint = (end: string | GraphNode) => (typeof end === 'string' ? end : end.id);

/**
 * Weighted label propagation: every country repeatedly adopts the bloc its
 * strongest links belong to until nothing changes. Visiting in name order
 * keeps the result stable between renders.
 */
function findBlocs(nodes: string[], links: { a: string; b: string; strength: number }[]): Map<string, string> {
    const neighbours = new Map<string, { other: string; strength: number }[]>();
    nodes.forEach((n) => neighbours.set(n, []));
    links.forEach(({ a, b, strength }) => {
        neighbours.get(a)!.push({ other: b, strength });
        neighbours.get(b)!.push({ other: a, strength });
    });

    const label = new Map(nodes.map((n) => [n, n]));
    for (let pass = 0; pass < 30; pass++) {
        let changed = false;
        nodes.forEach((node) => {
            const scores = new Map<string, number>();
            neighbours.get(node)!.forEach(({ other, strength }) => {
                const l = label.get(other)!;
                scores.set(l, (scores.get(l) ?? 0) + strength);
            });
            if (!scores.size) return;
            const best = Math.max(...Array.from(scores.values()));
            const current = label.get(node)!;
            if (scores.get(current) === best) return;
            const winner = Array.from(scores.entries())
                .filter(([, s]) => s === best)
                .map(([l]) => l)
                .sort()[0];
            label.set(node, winner);
            changed = true;
        });
        if (!changed) break;
    }
    return label;
}

function buildGraph(affinity: Affinity, partnersPerCountry: number) {
    // undirected strength: the average of what each side gives the other
    const candidates: { a: string; b: string; strength: number }[] = [];
    affinity.pairs.forEach((ab) => {
        if (ab.from >= ab.to || ab.from === REST_OF_WORLD) return;
        const ba = affinity.pairs.get(pairKey(ab.to, ab.from));
        if (!ba || ab.opportunities < MIN_MEETINGS || ba.opportunities < MIN_MEETINGS) return;
        candidates.push({ a: ab.from, b: ab.to, strength: (ab.avg + ba.avg) / 2 });
    });

    // keep each country's strongest partners
    const byCountry = new Map<string, typeof candidates>();
    candidates.forEach((c) => {
        [c.a, c.b].forEach((n) => {
            if (!byCountry.has(n)) byCountry.set(n, []);
            byCountry.get(n)!.push(c);
        });
    });
    const kept = new Set<(typeof candidates)[number]>();
    byCountry.forEach((list) => {
        list.sort((x, y) => y.strength - x.strength)
            .slice(0, partnersPerCountry)
            .forEach((c) => kept.add(c));
    });

    const nodeIds = Array.from(byCountry.keys()).sort();
    const linkList = Array.from(kept);
    const labels = findBlocs(nodeIds, linkList);

    // name each bloc after its best-connected member and colour the largest first
    const members = new Map<string, string[]>();
    labels.forEach((l, n) => {
        if (!members.has(l)) members.set(l, []);
        members.get(l)!.push(n);
    });
    const weightedDegree = new Map<string, number>();
    linkList.forEach(({ a, b, strength }) => {
        weightedDegree.set(a, (weightedDegree.get(a) ?? 0) + strength);
        weightedDegree.set(b, (weightedDegree.get(b) ?? 0) + strength);
    });
    const blocs: Bloc[] = Array.from(members.values())
        .filter((m) => m.length >= 3)
        .sort((x, y) => y.length - x.length || x[0].localeCompare(y[0]))
        .slice(0, chartColors.length)
        .map((m, i) => {
            const hub = [...m].sort((x, y) => (weightedDegree.get(y) ?? 0) - (weightedDegree.get(x) ?? 0))[0];
            return { id: i, name: `${hub}'s circle`, members: m.sort(), color: chartColors[i] };
        });
    const blocOf = new Map<string, number>();
    blocs.forEach((b) => b.members.forEach((m) => blocOf.set(m, b.id)));

    const nodes: GraphNode[] = nodeIds.map((id) => ({ id, bloc: blocOf.get(id) ?? -1 }));
    const links: GraphLink[] = linkList.map(({ a, b, strength }) => ({
        source: a,
        target: b,
        strength,
        ratio: affinity.baseline ? strength / affinity.baseline : 0,
    }));
    return { nodes, links, blocs };
}

interface VotingNetworkProps {
    data: ContestData;
}

const VotingNetwork: React.FC<VotingNetworkProps> = ({ data }) => {
    const minYear = data.years[0];
    const maxYear = data.years[data.years.length - 1];

    const [fromYear, setFromYear] = useState(TWELVE_POINT_ERA);
    const [toYear, setToYear] = useState(maxYear);
    const [mode, setMode] = useState<VoteMode>('combined');
    const [includeSemis, setIncludeSemis] = useState(true);
    const [partners, setPartners] = useState('2');
    const [selected, setSelected] = useState<string | null>(null);
    const [hoveredBloc, setHoveredBloc] = useState<number | null>(null);
    const [tooltip, setTooltip] = useState<{ x: number; y: number; html: React.ReactNode } | null>(null);
    const [width, setWidth] = useState(800);

    const containerRef = useRef<HTMLDivElement>(null);
    const svgRef = useRef<SVGSVGElement>(null);
    // positions survive filter changes so the graph eases into its new shape
    const positions = useRef(new Map<string, { x: number; y: number }>());

    const affinity = useMemo(
        () => computeAffinity(data, { fromYear, toYear, mode, includeSemis }),
        [data, fromYear, toYear, mode, includeSemis]
    );
    const graph = useMemo(() => buildGraph(affinity, Number(partners)), [affinity, partners]);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const observer = new ResizeObserver(([entry]) => setWidth(Math.max(320, entry.contentRect.width)));
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const svg = d3.select(svgRef.current!);
        svg.selectAll('*').remove();

        const nodes: GraphNode[] = graph.nodes.map((n) => ({ ...n, ...positions.current.get(n.id) }));
        const links: GraphLink[] = graph.links.map((l) => ({ ...l }));
        const maxStrength = d3.max(links, (l) => l.strength) ?? 1;
        const colorOf = (n: GraphNode) => (n.bloc >= 0 ? graph.blocs[n.bloc].color : UNGROUPED);

        const simulation = d3
            .forceSimulation<GraphNode>(nodes)
            .force(
                'link',
                d3
                    .forceLink<GraphNode, GraphLink>(links)
                    .id((d) => d.id)
                    .distance((l) => 45 + 110 * (1 - l.strength / maxStrength))
                    .strength(0.5)
            )
            .force('charge', d3.forceManyBody().strength(-260))
            .force('center', d3.forceCenter(width / 2, HEIGHT / 2))
            .force('x', d3.forceX(width / 2).strength(0.04))
            .force('y', d3.forceY(HEIGHT / 2).strength(0.06))
            .force('collide', d3.forceCollide(24));

        if (positions.current.size) simulation.alpha(0.5);

        const linkSel = svg
            .append('g')
            .attr('stroke-linecap', 'round')
            .selectAll<SVGLineElement, GraphLink>('line')
            .data(links)
            .join('line')
            .attr('stroke', (l) => {
                const a = l.source as GraphNode;
                const b = l.target as GraphNode;
                return a.bloc >= 0 && a.bloc === b.bloc ? colorOf(a) : colors.textMuted;
            })
            .attr('stroke-opacity', 0.45)
            .attr('stroke-width', (l) => 1 + 5 * (l.strength / maxStrength));

        // wide transparent hit lines so thin links are easy to hover
        const linkHitSel = svg
            .append('g')
            .selectAll<SVGLineElement, GraphLink>('line')
            .data(links)
            .join('line')
            .attr('stroke', 'transparent')
            .attr('stroke-width', 12)
            .style('cursor', 'help')
            .on('mousemove', (event, l) => {
                const a = (l.source as GraphNode).id;
                const b = (l.target as GraphNode).id;
                const ab = affinity.pairs.get(pairKey(a, b))!;
                const ba = affinity.pairs.get(pairKey(b, a))!;
                const [x, y] = d3.pointer(event, containerRef.current);
                setTooltip({
                    x,
                    y,
                    html: (
                        <>
                            <p className="font-semibold text-[var(--er-text-primary)]">{a} ⇄ {b}</p>
                            <p>{a} → {b}: <b>{ab.avg.toFixed(1)}</b> avg · {ab.twelves}× 12</p>
                            <p>{b} → {a}: <b>{ba.avg.toFixed(1)}</b> avg · {ba.twelves}× 12</p>
                            <p className="text-[var(--er-text-muted)]">{l.ratio.toFixed(1)}× the typical pair</p>
                        </>
                    ),
                });
            })
            .on('mouseleave', () => setTooltip(null));

        const nodeSel = svg
            .append('g')
            .selectAll<SVGGElement, GraphNode>('g')
            .data(nodes)
            .join('g')
            .style('cursor', 'pointer')
            .on('click', (_, n) => setSelected((current) => (current === n.id ? null : n.id)))
            .on('mouseenter', (_, n) => highlight(n.id))
            .on('mouseleave', () => highlight(null))
            .call(
                d3
                    .drag<SVGGElement, GraphNode>()
                    .on('start', (event, n) => {
                        if (!event.active) simulation.alphaTarget(0.2).restart();
                        n.fx = n.x;
                        n.fy = n.y;
                    })
                    .on('drag', (event, n) => {
                        n.fx = event.x;
                        n.fy = event.y;
                    })
                    .on('end', (event, n) => {
                        if (!event.active) simulation.alphaTarget(0);
                        n.fx = null;
                        n.fy = null;
                    })
            );

        nodeSel
            .append('circle')
            .attr('r', 7)
            .attr('fill', colorOf)
            .attr('stroke', colors.surfacePrimary)
            .attr('stroke-width', 2);

        nodeSel
            .append('text')
            .text((n) => n.id)
            .attr('x', 10)
            .attr('y', 4)
            .attr('font-size', 11)
            .attr('fill', colors.textSecondary)
            .attr('paint-order', 'stroke')
            .attr('stroke', colors.surfacePrimary)
            .attr('stroke-width', 3)
            .style('pointer-events', 'none');

        const linked = new Set(links.map((l) => `${endpoint(l.source)}|${endpoint(l.target)}`));
        const isLinked = (a: string, b: string) => a === b || linked.has(`${a}|${b}`) || linked.has(`${b}|${a}`);

        function highlight(focus: string | null) {
            nodeSel.attr('opacity', (n) => (!focus || isLinked(focus, n.id) ? 1 : 0.18));
            linkSel.attr('stroke-opacity', (l) =>
                !focus ? 0.45 : endpoint(l.source) === focus || endpoint(l.target) === focus ? 0.9 : 0.05
            );
        }

        const pad = 20;
        simulation.on('tick', () => {
            nodes.forEach((n) => {
                n.x = Math.max(pad, Math.min(width - 90, n.x!));
                n.y = Math.max(pad, Math.min(HEIGHT - pad, n.y!));
                positions.current.set(n.id, { x: n.x, y: n.y });
            });
            linkSel
                .attr('x1', (l) => (l.source as GraphNode).x!)
                .attr('y1', (l) => (l.source as GraphNode).y!)
                .attr('x2', (l) => (l.target as GraphNode).x!)
                .attr('y2', (l) => (l.target as GraphNode).y!);
            linkHitSel
                .attr('x1', (l) => (l.source as GraphNode).x!)
                .attr('y1', (l) => (l.source as GraphNode).y!)
                .attr('x2', (l) => (l.target as GraphNode).x!)
                .attr('y2', (l) => (l.target as GraphNode).y!);
            nodeSel.attr('transform', (n) => `translate(${n.x},${n.y})`);
        });

        return () => {
            simulation.stop();
        };
    }, [graph, width, affinity]);

    // hovering a bloc in the legend dims everyone outside it
    useEffect(() => {
        d3.select(svgRef.current!)
            .selectAll<SVGGElement, GraphNode>('g > g')
            .attr('opacity', (n) => (hoveredBloc === null || n.bloc === hoveredBloc ? 1 : 0.18));
    }, [hoveredBloc]);

    // ring the selected country; re-applied whenever the graph is redrawn
    useEffect(() => {
        d3.select(svgRef.current!)
            .selectAll<SVGCircleElement, GraphNode>('circle')
            .attr('stroke', (n) => (n.id === selected ? colors.textPrimary : colors.surfacePrimary))
            .attr('r', (n) => (n.id === selected ? 9 : 7));
    }, [selected, graph, width]);

    const partnerLists = useMemo(() => {
        if (!selected) return null;
        const given: { country: string; avg: number; twelves: number }[] = [];
        const received: { country: string; avg: number; twelves: number }[] = [];
        affinity.pairs.forEach((p) => {
            if (p.from === selected && p.opportunities >= MIN_MEETINGS) given.push({ country: p.to, avg: p.avg, twelves: p.twelves });
            if (p.to === selected && p.opportunities >= MIN_MEETINGS) received.push({ country: p.from, avg: p.avg, twelves: p.twelves });
        });
        const top = (list: typeof given) => list.sort((a, b) => b.avg - a.avg).slice(0, 5);
        return { given: top(given), received: top(received) };
    }, [selected, affinity]);

    const selectedBloc = selected ? graph.nodes.find((n) => n.id === selected)?.bloc : undefined;

    return (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-10 mt-8">
            <div className={`${card} p-4 sm:p-6`}>
                <div className="flex flex-wrap items-end gap-x-6 gap-y-4 mb-4">
                    <div className="w-60">
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
                        <p className={classNames(eyebrow, 'mb-1.5')}>Votes</p>
                        <SegmentedControl<VoteMode>
                            ariaLabel="Vote type"
                            value={mode}
                            onChange={setMode}
                            options={[
                                { value: 'combined', label: 'Combined' },
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
                    <div>
                        <p className={classNames(eyebrow, 'mb-1.5')}>Links per country</p>
                        <SegmentedControl
                            ariaLabel="Links per country"
                            value={partners}
                            onChange={setPartners}
                            options={['1', '2', '3', '4'].map((v) => ({ value: v, label: v }))}
                        />
                    </div>
                </div>

                {mode !== 'combined' && (
                    <p className="text-xs text-[var(--er-text-muted)] mb-2">
                        Jury and televote points have been reported separately since 2016, so this view only covers 2016 onward.
                    </p>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_16rem] gap-6">
                    <div ref={containerRef} className="relative min-w-0 rounded-xl bg-black/10 ring-1 ring-inset ring-white/5">
                        {graph.nodes.length === 0 && (
                            <p className="absolute inset-0 flex items-center justify-center text-sm text-[var(--er-text-muted)]">
                                Not enough voting history in this range.
                            </p>
                        )}
                        <svg
                            ref={svgRef}
                            width={width}
                            height={HEIGHT}
                            role="img"
                            aria-label="Network of countries linked to the partners they exchange the most points with"
                        />
                        {tooltip && (
                            <div
                                className="pointer-events-none absolute z-10 rounded-lg bg-[var(--er-tooltip-bg)] px-3 py-2 text-xs leading-5 text-[var(--er-text-secondary)] shadow-xl ring-1 ring-white/10"
                                style={{ left: tooltip.x + 12, top: tooltip.y + 12 }}
                            >
                                {tooltip.html}
                            </div>
                        )}
                    </div>

                    <aside className="text-sm">
                        {partnerLists && selected ? (
                            <div>
                                <div className="flex items-baseline justify-between">
                                    <p className="text-base font-semibold text-[var(--er-text-primary)]">{selected}</p>
                                    <button
                                        className="text-xs text-[var(--er-text-muted)] hover:text-[var(--er-text-primary)]"
                                        onClick={() => setSelected(null)}
                                    >
                                        Clear
                                    </button>
                                </div>
                                {selectedBloc !== undefined && selectedBloc >= 0 && (
                                    <p className="text-xs text-[var(--er-text-muted)]">{graph.blocs[selectedBloc].name}</p>
                                )}
                                <PartnerList title="Gives the most to" items={partnerLists.given} />
                                <PartnerList title="Gets the most from" items={partnerLists.received} />
                                <p className="mt-4 text-xs text-[var(--er-text-muted)]">
                                    Average points per contest where both took part.
                                </p>
                            </div>
                        ) : (
                            <div>
                                <p className={eyebrow}>Voting blocs</p>
                                <ul className="mt-2 space-y-1">
                                    {graph.blocs.map((bloc) => (
                                        <li
                                            key={bloc.id}
                                            className="rounded-md px-2 py-1.5 -mx-2 hover:bg-white/5 cursor-default"
                                            onMouseEnter={() => setHoveredBloc(bloc.id)}
                                            onMouseLeave={() => setHoveredBloc(null)}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ background: bloc.color }} />
                                                <span className="font-medium text-[var(--er-text-primary)]">{bloc.name}</span>
                                            </div>
                                            <p className="ml-[1.1rem] text-xs text-[var(--er-text-muted)] leading-5">
                                                {bloc.members.join(', ')}
                                            </p>
                                        </li>
                                    ))}
                                </ul>
                                <p className="mt-4 text-xs text-[var(--er-text-muted)] leading-5">
                                    Each country is linked to the partners it swaps the most points with. Countries are grouped by
                                    who they're most tightly linked to. Hover a link for the numbers, click a country for its
                                    friends, drag to rearrange.
                                </p>
                            </div>
                        )}
                    </aside>
                </div>
            </div>
        </div>
    );
};

const PartnerList: React.FC<{ title: string; items: { country: string; avg: number; twelves: number }[] }> = ({ title, items }) => {
    const max = Math.max(...items.map((i) => i.avg), 1);
    return (
        <div className="mt-4">
            <p className={eyebrow}>{title}</p>
            <ul className="mt-2 space-y-1.5">
                {items.map((item) => (
                    <li key={item.country}>
                        <div className="flex justify-between text-xs">
                            <span className="text-[var(--er-text-secondary)]">{item.country}</span>
                            <span className="tabular-nums text-[var(--er-text-muted)]">
                                {item.avg.toFixed(1)}{item.twelves > 0 && ` · ${item.twelves}× 12`}
                            </span>
                        </div>
                        <div className="mt-0.5 h-1.5 rounded-full bg-white/5">
                            <div
                                className="h-1.5 rounded-full bg-[var(--er-interactive-primary)]"
                                style={{ width: `${(item.avg / max) * 100}%` }}
                            />
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default VotingNetwork;
