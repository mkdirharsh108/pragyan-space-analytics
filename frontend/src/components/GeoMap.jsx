import { Chart } from "react-google-charts";

import { useMemo } from 'react';

export default function GeoMap({ allData, loading }) {
  const geoData = useMemo(() => {
    if (!allData || allData.length === 0) return [["Country", "Launches"]];
    const COUNTRY_NAMES = {
      'US': 'United States', 'RU': 'Russia', 'SU': 'Russia', 'CN': 'China', 'IN': 'India',
      'J': 'Japan', 'F': 'France', 'NZ': 'New Zealand', 'IL': 'Israel', 'IR': 'Iran',
      'KP': 'North Korea', 'KR': 'South Korea', 'BR': 'Brazil', 'UK': 'United Kingdom',
      'I': 'Italy', 'I-ESA': 'France', 'I-ELDO': 'France', 'D': 'Germany',
      'CYM': 'Cayman Islands', 'AU': 'Australia'
    };

    // Group by full country name
    const map = {};
    allData.forEach(d => {
      let name = COUNTRY_NAMES[d.state_code];
      if (!name) return; // Skip unknown
      map[name] = (map[name] || 0) + 1;
    });

    const result = [["Country", "Launches"]];
    Object.keys(map).forEach(key => {
      result.push([key, map[key]]);
    });
    return result;
  }, [allData]);

  if (loading) return <div className="w-full h-full flex items-center justify-center text-space-400">Loading Map...</div>;

  return (
    <div className="w-full h-full rounded-xl overflow-hidden border border-space-600/50 geomap-container">
        <Chart
          chartEvents={[
            {
              eventName: "select",
              callback: ({ chartWrapper }) => {
                const chart = chartWrapper.getChart();
                const selection = chart.getSelection();
                if (selection.length === 1) {
                  // selection captured, ready for future implementation
                }
              },
            },
          ]}
          chartType="GeoChart"
          width="100%"
          height="100%"
          data={geoData}
          options={{
            backgroundColor: '#0F111A',
            datalessRegionColor: '#1E2235',
            defaultColor: '#3B82F6',
            domain: 'IN',
            colorAxis: { colors: ['#0EA5E9', '#8B5CF6', '#E11D48'] },
            legend: { textStyle: { color: '#E2E8F0', fontSize: 14, bold: false } },
            tooltip: { textStyle: { color: '#1E293B', fontSize: 14, bold: false } }
          }}
          formatters={[
            {
              type: "NumberFormat",
              column: 1,
              options: {
                pattern: "#,###",
              },
            },
          ]}
        />
      </div>
  );
}
