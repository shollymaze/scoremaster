let allFixtures = [];

function poisson(avg, goals) {
  return (Math.pow(avg, goals) * Math.exp(-avg)) / factorial(goals);
}

function factorial(n) {
  return n <= 1 ? 1 : n * factorial(n - 1);
}

function dixonColes(h, a, rho = 0.13) {
  if (h === 0 && a === 0) return 1 - rho;
  if ((h === 0 && a === 1) || (h === 1 && a === 0)) return 1 + rho;
  if (h === 1 && a === 1) return 1 - rho;
  return 1;
}

window.onload = async () => {
  const res = await fetch("fixtures.json");
  const data = await res.json();
  allFixtures = data.fixtures;

  const leagues = [...new Set(allFixtures.map(f => f.league))];
  const leagueSelector = document.getElementById("leagueSelector");

  leagues.forEach(league => {
    const opt = document.createElement("option");
    opt.value = league;
    opt.text = league;
    leagueSelector.appendChild(opt);
  });

  filterByLeague(); // Load default fixtures
};

function filterByLeague() {
  const selectedLeague = document.getElementById("leagueSelector").value;
  const fixtureSelector = document.getElementById("fixtureSelector");
  fixtureSelector.innerHTML = "";

  const filtered = selectedLeague === "All"
    ? allFixtures
    : allFixtures.filter(f => f.league === selectedLeague);

  filtered.forEach(match => {
    const opt = document.createElement("option");
    opt.value = JSON.stringify(match);
    opt.text = `${match.homeTeam} vs ${match.awayTeam}`;
    fixtureSelector.appendChild(opt);
  });

  if (filtered.length > 0) {
    fixtureSelector.selectedIndex = 0;
    onFixtureSelect();
  }
}

function onFixtureSelect() {
  const match = JSON.parse(document.getElementById("fixtureSelector").value);
  const homeExp = (match.homeXG + match.awayXGA) / 2;
  const awayExp = (match.awayXG + match.homeXGA) / 2;
  predictScores(homeExp, awayExp);
}

function confidence(prob) {
  if (prob >= 75) return "✅ High";
  if (prob >= 60) return "☑️ Medium";
  return "⚠️ Low";
}

function predictScores(home, away) {
  const output = document.getElementById("output");
  output.innerHTML = `<h2>Score Probabilities</h2><table border="1"><tr><th></th>`;
  let matrix = [], labels = [], BTTS = 0, Over25 = 0, Draw = 0;

  for (let a = 0; a <= 5; a++) output.innerHTML += `<th>${a}</th>`;
  output.innerHTML += `</tr>`;

  for (let h = 0; h <= 5; h++) {
    output.innerHTML += `<tr><th>${h}</th>`;
    for (let a = 0; a <= 5; a++) {
      const prob = poisson(home, h) * poisson(away, a) * dixonColes(h, a);
      const pct = (prob * 100).toFixed(2);
      output.innerHTML += `<td>${pct}%</td>`;
      matrix.push(parseFloat(pct));
      labels.push(`${h}-${a}`);
      if (h >= 1 && a >= 1) BTTS += prob * 100;
      if (h + a > 2.5) Over25 += prob * 100;
      if (h === a) Draw += prob * 100;
    }
    output.innerHTML += `</tr>`;
  }

  output.innerHTML += `
    <h3>Betting Insights</h3>
    <ul>
      <li>BTTS: ${BTTS.toFixed(2)}% ${confidence(BTTS)}</li>
      <li>Over 2.5 Goals: ${Over25.toFixed(2)}% ${confidence(Over25)}</li>
      <li>Draw: ${Draw.toFixed(2)}%</li>
    </ul>
  `;

  new Chart(document.getElementById("scoreChart").getContext("2d"), {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: "Scoreline Probabilities (%)",
        data: matrix,
        backgroundColor: "steelblue"
      }]
    },
    options: {
      scales: { y: { beginAtZero: true, max: 20 } },
      responsive: false
    }
  });
}
