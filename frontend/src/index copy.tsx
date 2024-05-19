import { Chart } from 'chart.js';
import './styles.css';

async function fetchData() {

  const response = await fetch('http://localhost:4000/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: `
        query {
            songs(where: { country: { name: "Croatia" }, finalPlace: { place_NOT: null } }) {
                id
                name
                year {
                  year
                }
                artist {
                  name
                }
                finalPlace {
                  place
                }
                totalPoints
              }
        }
      `,
    }),
  });

  const data = await response.json();
  return data;
}

// Use the fetched data to create charts with Chart.js
async function createChart() {
  const data = await fetchData();

  // Create a chart using the fetched data
  // Example:
  const ctx = document.getElementById('myChart') as HTMLCanvasElement;
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Label 1', 'Label 2', 'Label 3'],
      datasets: [
        {
          label: 'Dataset',
          data: [data.value1, data.value2, data.value3],
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
        },
      ],
    },
    options: {
    //   scales: {
    //     y: {
    //       beginAtZero: true,
    //     },
    //   },
    },
  });
}

// Call the createChart function when the page loads
window.onload = createChart;