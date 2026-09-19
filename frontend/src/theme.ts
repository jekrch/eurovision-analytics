import Highcharts from 'highcharts';

// Chart libraries draw to canvas/SVG attributes and can't resolve CSS
// variables, so the palette in theme.css is mirrored here. Change both together.
export const colors = {
    surfacePrimary: '#1a1118',
    surfaceSecondary: '#241a20',
    surfaceTertiary: '#342528',
    tooltipBg: '#3d2f31',
    textPrimary: '#e5d8d2',
    textSecondary: '#d5c5be',
    textTertiary: '#c5b5ae',
    textMuted: '#a59490',
    borderSubtle: '#4d3555',
    grid: 'rgba(229, 216, 210, 0.08)',
    axisLine: 'rgba(229, 216, 210, 0.18)',
    copper: '#c8926d',
    plum: '#8a6897',
    gold: '#e0b25b',
};

// Series colors: the ranker's copper and plum lead, followed by warm and cool
// companions that stay distinguishable on the dark plum surfaces.
export const chartColors = [
    '#c8926d', // copper
    '#8a6897', // plum
    '#75c8ae', // mint
    '#e0b25b', // gold
    '#c46f86', // rose
    '#6d9fb8', // dusk blue
    '#e5d0c8', // blush
    '#a3805f', // bronze
    '#b39ddb', // lavender
    '#5e8072', // sage
    '#d8a27d', // light copper
    '#6a4876', // deep plum
    '#9fc5b8', // pale teal
    '#cd853f', // peru
    '#7a5348', // umber
];

// Shared surface vocabulary, modeled on eurovision-ranker's modalStyles.ts, so
// cards, dividers and labels read as one family across the dashboards.

/** A raised panel sitting on the page gradient. */
export const card =
    'bg-[var(--er-card-surface)] rounded-2xl ring-1 ring-white/10 shadow-xl shadow-black/30';

/** Divider that fades out at both ends. */
export const hairline = 'h-px bg-gradient-to-r from-transparent via-white/15 to-transparent';

/** Small tracked label above a title or value. */
export const eyebrow =
    'text-[0.6rem] font-medium uppercase tracking-[0.2em] text-[var(--er-text-subtle)]';

/** Loading spinner in the theme's accent. */
export const spinner =
    'animate-spin rounded-full h-10 w-10 border-2 border-white/10 border-t-[var(--er-interactive-primary)]';

let highchartsThemed = false;

/** Applies the theme to Highcharts' global defaults. Safe to call repeatedly. */
export function applyHighchartsTheme() {
    if (highchartsThemed) return;
    highchartsThemed = true;

    Highcharts.setOptions({
        colors: chartColors,
        chart: {
            backgroundColor: 'transparent',
            style: {
                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
            }
        },
        title: {
            style: {
                color: colors.textPrimary,
                fontSize: '15px',
                fontWeight: '600'
            }
        },
        xAxis: {
            labels: { style: { color: colors.textMuted } },
            title: { style: { color: colors.textMuted } },
            lineColor: colors.axisLine,
            tickColor: colors.axisLine,
            gridLineColor: colors.grid
        },
        yAxis: {
            labels: { style: { color: colors.textMuted } },
            title: { style: { color: colors.textMuted } },
            gridLineColor: colors.grid
        },
        legend: {
            itemStyle: {
                color: colors.textSecondary,
                fontWeight: '400'
            },
            itemHoverStyle: {
                color: colors.textPrimary
            },
            itemHiddenStyle: {
                color: colors.borderSubtle
            }
        },
        tooltip: {
            backgroundColor: colors.tooltipBg,
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: 10,
            shadow: false,
            style: {
                color: colors.textPrimary
            }
        },
        plotOptions: {
            series: {
                dataLabels: {
                    style: {
                        color: colors.textPrimary,
                        textOutline: `1px ${colors.surfacePrimary}`
                    }
                }
            },
            pie: {
                borderColor: colors.surfaceSecondary,
                borderWidth: 2
            }
        },
        credits: {
            enabled: false
        }
    });
}
