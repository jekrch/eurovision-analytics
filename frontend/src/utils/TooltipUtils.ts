const getOrCreateTooltip = (chart: any) => {
    let tooltipEl = chart.canvas.parentNode.querySelector('div');
  
    if (!tooltipEl) {
      tooltipEl = document.createElement('div');
      tooltipEl.style.zIndex = '9999';
      tooltipEl.style.background = 'rgba(0, 0, 0, 0.5)';
      tooltipEl.style.borderRadius = '3px';
      tooltipEl.style.color = 'white';
      tooltipEl.style.opacity = 1;
      tooltipEl.style.pointerEvents = 'none';
      tooltipEl.style.position = 'absolute';
      tooltipEl.style.transform = 'translate(-50%, 0)';
      tooltipEl.style.transition = 'all .1s ease';
  
      const table = document.createElement('table');
      table.style.margin = '0px';
  
      tooltipEl.appendChild(table);
      chart.canvas.parentNode.appendChild(tooltipEl);
    }
  
    return tooltipEl;
  };
  
  export const externalTooltipHandler = (context: any) => {
    
    const {
      chart,
      tooltip
    } = context;
    const tooltipEl = getOrCreateTooltip(chart);
  
    const song = context.chart.data.datasets[tooltip.dataPoints[0].datasetIndex].meta[tooltip.dataPoints[0].dataIndex] as any;
    console.log(song)

    // hide if no tooltip
    if (tooltip.opacity === 0) {
      tooltipEl.style.opacity = 0;
      return;
    }
  
    // Set Text
    if (tooltip.body) {
      const titleLines = tooltip.title || [];
      const bodyLines = tooltip.body.map((b: any) => b.lines);
  
      titleLines.push(`"${song.name}"`);
      titleLines.push(`${song.artist.name}`);

      const tableHead = document.createElement('thead');
  
      titleLines.forEach((title: any, index: number) => {

        const tr = document.createElement('tr') as any;
        tr.style.borderWidth = 0;
  
        const th = document.createElement('th') as any;
        th.style.borderWidth = 0;
        const text = document.createTextNode(title);
        th.appendChild(text);
  
        const imageTh = document.createElement('th');
        th.style.borderWidth = 0;

        // reduce the size/weight of song name and artist
        if (index > 0) {
            //th.style.color = '#e9f0f2';
            th.style.fontSize = '15px'
            th.style.fontWeight = 'lighter';
        }
        tr.appendChild(th);
        tr.appendChild(imageTh);
        tableHead.appendChild(tr);
      });
  
      const tableBody = document.createElement('tbody');
      bodyLines.forEach((body: any, i: any) => {
        const colors = tooltip.labelColors[i];
  
        const span = document.createElement('span');
        span.style.background = colors.backgroundColor;
        span.style.borderColor = colors.borderColor;
        span.style.borderWidth = '2px';
        span.style.marginRight = '10px';
        span.style.height = '10px';
        span.style.width = '10px';
        span.style.display = 'inline-block';
  
        const tr = document.createElement('tr') as any;
        tr.style.backgroundColor = 'inherit';
        tr.style.borderWidth = 0;
  
        const td = document.createElement('td') as any;
        td.style.borderWidth = 0;
  
        const text = document.createTextNode(body);
  
        td.appendChild(span);
        td.appendChild(text);
        tr.appendChild(td);
        tableBody.appendChild(tr);
      });
  
      const tableRoot = tooltipEl.querySelector('table');
  
      // Remove old children
      while (tableRoot.firstChild) {
        tableRoot.firstChild.remove();
      }
  
      // Add new children
      tableRoot.appendChild(tableHead);
      tableRoot.appendChild(tableBody);
    }
  
    const {
      offsetLeft: positionX,
      offsetTop: positionY
    } = chart.canvas;
  
    // Display, position, and set styles for font
    tooltipEl.style.opacity = 1;
    tooltipEl.style.left = positionX + tooltip.caretX + 'px';
    tooltipEl.style.top = positionY + tooltip.caretY + 'px';
    tooltipEl.style.font = tooltip.options.bodyFont.string;
    tooltipEl.style.padding = tooltip.options.padding + 'px ' + tooltip.options.padding + 'px';
  };
