import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

interface SongwriterStats {
    name: string;
    songCount: number;
    avgPlace: number;
    bestPlace: number;
    worstPlace: number;
    wins: number;
    topTens: number;
    songs: string[];
    countries: string[];
}

const SongwriterPowerRankings: React.FC = () => {
    const svgRef = useRef<SVGSVGElement>(null);
    const [songwriters, setSongwriters] = useState<SongwriterStats[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedWriter, setSelectedWriter] = useState<string | null>(null);
    const [minSongs, setMinSongs] = useState(2);
    const [showOnlyWinners, setShowOnlyWinners] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);

            const response = await fetch('http://localhost:4000/graphql', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: `
                        query {
                            songwriters {
                                name
                                songs {
                                    name
                                    finalPlace {
                                        place
                                    }
                                    country {
                                        name
                                    }
                                    year {
                                        year
                                    }
                                }
                            }
                        }
                    `,
                }),
            });

            const result = await response.json();
            
            if (result.data && result.data.songwriters) {
                // Process songwriter data
                const writerStats: SongwriterStats[] = result.data.songwriters
                    .map((writer: any) => {
                        const songsWithPlacement = writer.songs.filter((s: any) => s.finalPlace);
                        const places = songsWithPlacement.map((s: any) => s.finalPlace.place);
                        
                        if (places.length === 0) return null;
                        
                        const uniqueCountries = new Set(songsWithPlacement
                            .filter((s: any) => s.country)
                            .map((s: any) => s.country.name));
                        
                        return {
                            name: writer.name,
                            songCount: songsWithPlacement.length,
                            avgPlace: places.reduce((a: number, b: number) => a + b, 0) / places.length,
                            bestPlace: Math.min(...places),
                            worstPlace: Math.max(...places),
                            wins: places.filter((p: number) => p === 1).length,
                            topTens: places.filter((p: number) => p <= 10).length,
                            songs: songsWithPlacement.map((s: any) => `${s.name} (${s.year?.year || 'N/A'})`),
                            countries: Array.from(uniqueCountries)
                        };
                    })
                    .filter((w: SongwriterStats | null) => w !== null)
                    .filter((w: SongwriterStats) => w.songCount >= minSongs)
                    .filter((w: SongwriterStats) => !showOnlyWinners || w.wins > 0);

                // Sort by success (combination of avg placement and song count)
                writerStats.sort((a, b) => {
                    const aScore = (26 - a.avgPlace) * Math.log(a.songCount + 1);
                    const bScore = (26 - b.avgPlace) * Math.log(b.songCount + 1);
                    return bScore - aScore;
                });

                setSongwriters(writerStats.slice(0, 100)); // Limit to top 100
            }

            setIsLoading(false);
        };

        fetchData();
    }, [minSongs, showOnlyWinners]);

    useEffect(() => {
        if (!songwriters.length || !svgRef.current) return;

        // Clear previous chart
        d3.select(svgRef.current).selectAll('*').remove();

        const margin = { top: 60, right: 80, bottom: 80, left: 80 };
        const width = 1000 - margin.left - margin.right;
        const height = 600 - margin.top - margin.bottom;

        const svg = d3.select(svgRef.current)
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom);

        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Scales
        const xScale = d3.scaleLinear()
            .domain([Math.max(...songwriters.map(w => w.avgPlace)) + 1, 
                     Math.max(0, Math.min(...songwriters.map(w => w.avgPlace)) - 1)])
            .range([0, width]);

        const yScale = d3.scaleLinear()
            .domain([Math.max(...songwriters.map(w => w.bestPlace)) + 1, 0])
            .range([height, 0]);

        const sizeScale = d3.scaleSqrt()
            .domain([0, Math.max(...songwriters.map(w => w.songCount))])
            .range([5, 40]);

        const colorScale = d3.scaleSequential(d3.interpolateViridis)
            .domain([0, Math.max(...songwriters.map(w => w.wins))]);

        // Add grid lines
        g.append('g')
            .attr('class', 'grid')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(xScale)
                .tickSize(-height)
                .tickFormat(() => ''))
            .style('stroke-dasharray', '3,3')
            .style('opacity', 0.3);

        g.append('g')
            .attr('class', 'grid')
            .call(d3.axisLeft(yScale)
                .tickSize(-width)
                .tickFormat(() => ''))
            .style('stroke-dasharray', '3,3')
            .style('opacity', 0.3);

        // Add axes
        g.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(xScale))
            .append('text')
            .attr('x', width / 2)
            .attr('y', 50)
            .attr('fill', 'black')
            .style('text-anchor', 'middle')
            .style('font-size', '14px')
            .text('Average Placement (← Better | Worse →)');

        g.append('g')
            .call(d3.axisLeft(yScale)
                .tickFormat(d => d === 0 ? '' : d.toString()))
            .append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', -50)
            .attr('x', -height / 2)
            .attr('fill', 'black')
            .style('text-anchor', 'middle')
            .style('font-size', '14px')
            .text('Best Placement (↑ Better | Worse ↓)');

        // Add title
        svg.append('text')
            .attr('x', (width + margin.left + margin.right) / 2)
            .attr('y', 30)
            .attr('text-anchor', 'middle')
            .style('font-size', '20px')
            .style('font-weight', 'bold')
            .text('Eurovision Songwriter Power Rankings');

        // Add legend for bubble size
        const sizeLegend = svg.append('g')
            .attr('transform', `translate(${width + margin.left - 100}, ${margin.top + 20})`);

        sizeLegend.append('text')
            .attr('x', 0)
            .attr('y', -10)
            .style('font-size', '12px')
            .style('font-weight', 'bold')
            .text('Songs Written');

        [1, 5, 10].forEach((size, i) => {
            sizeLegend.append('circle')
                .attr('cx', 20)
                .attr('cy', i * 30 + 10)
                .attr('r', sizeScale(size))
                .attr('fill', 'none')
                .attr('stroke', 'black');
            
            sizeLegend.append('text')
                .attr('x', 40)
                .attr('y', i * 30 + 15)
                .style('font-size', '11px')
                .text(size.toString());
        });

        // Add success zones
        const zones = g.append('g').attr('opacity', 0.1);
        
        // Elite zone (top-left)
        zones.append('rect')
            .attr('x', xScale(10))
            .attr('y', yScale(5))
            .attr('width', xScale(1) - xScale(10))
            .attr('height', yScale(1) - yScale(5))
            .attr('fill', 'green');
        
        zones.append('text')
            .attr('x', xScale(5.5))
            .attr('y', yScale(2.5))
            .attr('text-anchor', 'middle')
            .attr('font-size', '14px')
            .attr('font-weight', 'bold')
            .attr('fill', 'green')
            .attr('opacity', 0.5)
            .text('ELITE');

        // Tooltip
        const tooltip = d3.select('body').append('div')
            .attr('id', 'writer-tooltip')
            .style('position', 'absolute')
            .style('visibility', 'hidden')
            .style('background', 'rgba(0, 0, 0, 0.95)')
            .style('color', 'white')
            .style('padding', '15px')
            .style('border-radius', '8px')
            .style('font-size', '13px')
            .style('box-shadow', '0 4px 6px rgba(0, 0, 0, 0.3)')
            .style('max-width', '400px');

        // Add bubbles
        const bubbles = g.selectAll('circle')
            .data(songwriters)
            .enter().append('circle')
            .attr('cx', d => xScale(d.avgPlace))
            .attr('cy', d => yScale(d.bestPlace))
            .attr('r', d => sizeScale(d.songCount))
            .attr('fill', d => d.wins > 0 ? colorScale(d.wins) : '#888')
            .attr('stroke', d => d.wins > 0 ? '#FFD700' : '#333')
            .attr('stroke-width', d => d.wins > 0 ? 3 : 1)
            .attr('opacity', 0.7)
            .style('cursor', 'pointer')
            .on('click', (event, d) => {
                setSelectedWriter(d.name === selectedWriter ? null : d.name);
            })
            .on('mouseover', function(event, d) {
                d3.select(this).attr('opacity', 1);
                
                const songsHtml = d.songs.slice(0, 5).join('<br>');
                const moreSongs = d.songs.length > 5 ? `<br>... and ${d.songs.length - 5} more` : '';
                
                tooltip.style('visibility', 'visible')
                    .html(`
                        <div style="font-size: 16px; font-weight: bold; margin-bottom: 8px;">${d.name}</div>
                        <div style="margin-bottom: 8px;">
                            <span style="color: #FFD700;">Songs: ${d.songCount}</span> | 
                            <span style="color: #90EE90;">Wins: ${d.wins}</span> | 
                            <span style="color: #87CEEB;">Top 10s: ${d.topTens}</span>
                        </div>
                        <div>Best: ${d.bestPlace} | Average: ${d.avgPlace.toFixed(1)} | Worst: ${d.worstPlace}</div>
                        <div style="margin-top: 8px; color: #AAA;">Countries: ${d.countries.join(', ')}</div>
                        <div style="margin-top: 8px; font-size: 11px; color: #888;">
                            ${songsHtml}${moreSongs}
                        </div>
                    `);
            })
            .on('mousemove', function(event) {
                tooltip.style('top', (event.pageY - 10) + 'px')
                    .style('left', (event.pageX + 10) + 'px');
            })
            .on('mouseout', function(event, d) {
                d3.select(this).attr('opacity', 0.7);
                tooltip.style('visibility', 'hidden');
            });

        // Add labels for top songwriters
        const topWriters = songwriters
            .filter(w => w.wins > 0 || w.songCount >= 5 || (w.avgPlace <= 5 && w.songCount >= 3))
            .slice(0, 15);

        g.selectAll('.writer-label')
            .data(topWriters)
            .enter().append('text')
            .attr('x', d => xScale(d.avgPlace))
            .attr('y', d => yScale(d.bestPlace) - sizeScale(d.songCount) - 5)
            .attr('text-anchor', 'middle')
            .attr('font-size', '10px')
            .attr('font-weight', 'bold')
            .text(d => d.name.split(' ').slice(-1)[0]); // Last name only

        // Highlight selected writer
        if (selectedWriter) {
            bubbles.attr('opacity', d => d.name === selectedWriter ? 1 : 0.1);
        }

        // Add zoom behavior
        const zoom = d3.zoom()
            .scaleExtent([0.5, 5])
            .on('zoom', (event) => {
                g.attr('transform', event.transform);
            });

        svg.call(zoom as any);

        return () => {
            d3.select('#writer-tooltip').remove();
        };
    }, [songwriters, selectedWriter]);

    return (
        <div className="container mx-auto max-w-7xl px-5">
            <div className="mb-6">
                <div className="flex flex-wrap items-center gap-4 mb-4">
                    <label className="flex items-center gap-2">
                        <span>Minimum songs:</span>
                        <select 
                            value={minSongs} 
                            onChange={(e) => setMinSongs(Number(e.target.value))}
                            className="border rounded px-2 py-1"
                        >
                            <option value={1}>1+ songs</option>
                            <option value={2}>2+ songs</option>
                            <option value={3}>3+ songs</option>
                            <option value={5}>5+ songs</option>
                        </select>
                    </label>
                    
                    <label className="flex items-center gap-2">
                        <input 
                            type="checkbox" 
                            checked={showOnlyWinners}
                            onChange={(e) => setShowOnlyWinners(e.target.checked)}
                        />
                        <span>Winners only</span>
                    </label>
                    
                    {selectedWriter && (
                        <button 
                            onClick={() => setSelectedWriter(null)}
                            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                        >
                            Clear: {selectedWriter}
                        </button>
                    )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="bg-gray-100 p-3 rounded">
                        <div className="font-semibold mb-1">🎯 How to read:</div>
                        <div>• Bubble size = songs written</div>
                        <div>• Left = better average</div>
                        <div>• Top = better peak</div>
                    </div>
                    <div className="bg-gray-100 p-3 rounded">
                        <div className="font-semibold mb-1">🏆 Colors:</div>
                        <div>• Colored = contest winners</div>
                        <div>• Gold border = has wins</div>
                        <div>• Gray = no wins</div>
                    </div>
                    <div className="bg-gray-100 p-3 rounded">
                        <div className="font-semibold mb-1">✨ Elite zone:</div>
                        <div>• Top-left corner</div>
                        <div>• Consistent excellence</div>
                        <div>• Multiple top placements</div>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center h-96">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-r-2 border-b-6 border-gray-800"></div>
                </div>
            ) : (
                <div className="border rounded-lg p-4 bg-white">
                    <svg ref={svgRef}></svg>
                </div>
            )}

            <div className="mt-4 text-sm text-gray-600">
                <p>• Hover over bubbles to see songwriter details and their songs</p>
                <p>• Click to highlight a specific songwriter</p>
                <p>• Scroll to zoom, drag to pan</p>
                <p>• The most successful songwriters appear in the top-left (low average placement + achieved #1)</p>
            </div>
        </div>
    );
};

export default SongwriterPowerRankings;