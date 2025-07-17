import requests
from bs4 import BeautifulSoup
import json

teams_by_league = {
    "Premier League": {
        "Arsenal": "arsenal",
        "Chelsea": "chelsea",
        "Manchester City": "manchester_city",
        "Liverpool": "liverpool"
    },
    "La Liga": {
        "Barcelona": "barcelona",
        "Real Madrid": "real_madrid",
        "Atletico Madrid": "atletico_madrid",
        "Valencia": "valencia"
    },
    "Serie A": {
        "AC Milan": "ac_milan",
        "Inter": "inter",
        "Juventus": "juventus",
        "Napoli": "napoli"
    }
}

def get_team_xg(team_slug):
    url = f"https://understat.com/team/{team_slug}/2024"
    res = requests.get(url)
    soup = BeautifulSoup(res.text, 'html.parser')
    
    scripts = soup.find_all('script')
    for script in scripts:
        if 'teamsData' in script.text:
            json_text = script.text.split('=', 1)[1].strip()[:-1]
            data = json.loads(json_text)
            break

    team_data = list(data.values())[0]
    matches = team_data['history'][-5:]

    xg_values = [float(m['xG']) for m in matches]
    xga_values = [float(m['xGA']) for m in matches]

    return {
        "xg": xg_values,
        "xga": xga_values,
        "avg_xg": round(sum(xg_values) / len(xg_values), 2),
        "avg_xga": round(sum(xga_values) / len(xga_values), 2)
    }

fixtures = []

for league, teams in teams_by_league.items():
    team_list = list(teams.items())
    for i in range(0, len(team_list), 2):
        if i + 1 < len(team_list):
            home_name, home_slug = team_list[i]
            away_name, away_slug = team_list[i+1]

            home_stats = get_team_xg(home_slug)
            away_stats = get_team_xg(away_slug)

            fixtures.append({
                "league": league,
                "homeTeam": home_name,
                "awayTeam": away_name,
                "homeXG": home_stats["avg_xg"],
                "homeXGA": home_stats["avg_xga"],
                "awayXG": away_stats["avg_xg"],
                "awayXGA": away_stats["avg_xga"]
            })

with open("fixtures.json", "w") as f:
    json.dump({"fixtures": fixtures}, f, indent=2)

print("✅ ScoreMaster updated: fixtures.json saved.")
