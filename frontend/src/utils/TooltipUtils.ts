import { Song } from "../models/Song";

interface Tooltip {
  opacity: number;
  body: Array<{ lines: string[] }>;
  labelColors: Array<{ backgroundColor: string; borderColor: string }>;
  options: {
    bodyFont: { string: string };
    padding: number;
  };
  caretX: number;
  caretY: number;
  dataPoints: Array<{ datasetIndex: number; dataIndex: number }>;
  title?: string[];
}

const getOrCreateTooltip = (chart: any): HTMLDivElement => {
  const existingTooltip = chart.canvas.parentNode?.querySelector('div');
  if (existingTooltip) {
    return existingTooltip as HTMLDivElement;
  }

  const newTooltip = document.createElement('div');
  newTooltip.classList.add('tooltip');

  const table = document.createElement('table');
  table.classList.add('tooltip-table');
  newTooltip.appendChild(table);

  chart.canvas.parentNode?.appendChild(newTooltip);
  return newTooltip;
};

export const songTooltipHandler = (context: any): void => {
  tooltipHandler(context, createSongMetadataHeader);
};

export const countTooltipHandler = (context: any): void => {
  tooltipHandler(context, createCountHeader);
};

const tooltipHandler = (
  context: { chart: Chart; tooltip: Tooltip },
  createMetadataHeader: (tooltip: Tooltip, chart: Chart) => HTMLTableSectionElement
): void => {
  const { chart, tooltip } = context;
  const tooltipEl = getOrCreateTooltip(chart);

  if (tooltip.opacity === 0) {
    tooltipEl.style.opacity = '0';
    return;
  }

  if (tooltip.body) {
    const tableHead = createMetadataHeader(tooltip, chart);
    const tableBody = createTableBody(tooltip);
    buildTooltipRoot(tooltipEl, tableHead, tableBody);
  }

  assignTooltipPosition(chart, tooltipEl, tooltip);
};

const buildTooltipRoot = (
  tooltipEl: HTMLDivElement,
  tableHead: HTMLTableSectionElement,
  tableBody: HTMLTableSectionElement
): void => {
  const tableRoot = tooltipEl.querySelector('table')!;

  while (tableRoot.firstChild) {
    tableRoot.firstChild.remove();
  }

  tableRoot.appendChild(tableHead);
  tableRoot.appendChild(tableBody);
};

const assignTooltipPosition = (chart: any, tooltipEl: HTMLDivElement, tooltip: Tooltip): void => {
  
  const { offsetLeft: positionX, offsetTop: positionY } = chart.canvas;

  tooltipEl.style.opacity = '1';
  tooltipEl.style.left = `${positionX + tooltip.caretX}px`;
  tooltipEl.style.top = `${positionY + tooltip.caretY}px`;
  tooltipEl.style.font = tooltip.options.bodyFont.string;
  tooltipEl.style.padding = `${tooltip.options.padding}px`;
};

const createTableBody = (tooltip: Tooltip): HTMLTableSectionElement => {
  const tableBody = document.createElement('tbody');

  tooltip.body.forEach((bodyItem, index) => {
    const colors = tooltip.labelColors[index];

    const row = document.createElement('tr');
    row.classList.add('tooltip-row');

    const cell = document.createElement('td');
    cell.classList.add('tooltip-cell');

    const colorBox = document.createElement('span');
    colorBox.classList.add('tooltip-color');
    colorBox.style.backgroundColor = colors.backgroundColor;
    colorBox.style.borderColor = colors.borderColor;

    const labelText = document.createElement('span');
    labelText.classList.add('tooltip-text');
    labelText.textContent = bodyItem.lines.join(' ');

    cell.appendChild(colorBox);
    cell.appendChild(labelText);
    row.appendChild(cell);
    tableBody.appendChild(row);
  });

  return tableBody;
};

const createSongMetadataHeader = (tooltip: Tooltip, chart: any): HTMLTableSectionElement => {

  const song = chart.data.datasets[tooltip.dataPoints[0].datasetIndex].meta[
    tooltip.dataPoints[0].dataIndex
  ] as Song;

  const titleLines = tooltip.title || [];
  titleLines.push(`"${song.name}"`);
  titleLines.push(`${song.artist.name}`);
  titleLines.push('');

  const tableHead = document.createElement('thead');

  titleLines.forEach((title, index) => {
    const row = document.createElement('tr');
    row.classList.add('tooltip-header-row');

    const titleCell = document.createElement('th');
    titleCell.classList.add('tooltip-header-cell');
    titleCell.textContent = title;

    if (index > 0) {
      titleCell.classList.add('tooltip-header-cell-secondary');
    } else {
      titleCell.classList.add('tooltip-header-cell-primary');
    }

    if (index === 1) {
      titleCell.classList.add('tooltip-header-cell-artist');
    }

    if (index === 3) {
      const separator = document.createElement('hr');
      separator.classList.add('tooltip-separator');
      titleCell.appendChild(separator);
    }

    row.appendChild(titleCell);
    tableHead.appendChild(row);
  });

  return tableHead;
};

const createCountHeader = (tooltip: Tooltip, chart: Chart): HTMLTableSectionElement => {
  const titleLines = tooltip.title || [];
  titleLines.push('');

  const tableHead = document.createElement('thead');

  titleLines.forEach((title, index) => {
    const row = document.createElement('tr');
    row.classList.add('tooltip-header-row');

    const titleCell = document.createElement('th');
    titleCell.classList.add('tooltip-header-cell');
    titleCell.textContent = title;

    if (index > 0) {
      titleCell.classList.add('tooltip-header-cell-secondary');
    } else {
      titleCell.classList.add('tooltip-header-cell-primary');
    }

    if (index === 1) {
      titleCell.classList.add('tooltip-header-cell-artist');
    }

    if (index === 3) {
      const separator = document.createElement('hr');
      separator.classList.add('tooltip-separator');
      titleCell.appendChild(separator);
    }

    row.appendChild(titleCell);
    tableHead.appendChild(row);
  });

  return tableHead;
};