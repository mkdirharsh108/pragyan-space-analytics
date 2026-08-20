

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function levenshtein(a, b) {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function fuzzyMatch(input, target) {
  const inputLower = input.toLowerCase();
  const targetLower = target.toLowerCase();
  
  const regex = new RegExp(`\\b${escapeRegExp(targetLower)}\\b`);
  if (regex.test(inputLower)) return true;

  const inputWords = inputLower.split(/[^\w.-]+/).filter(w => w.length > 0);
  const targetWords = targetLower.split(/[^\w.-]+/).filter(w => w.length > 0);

  if (targetWords.length === 0) return false;

  for (let i = 0; i <= inputWords.length - targetWords.length; i++) {
    let isMatch = true;
    for (let j = 0; j < targetWords.length; j++) {
      const iw = inputWords[i + j];
      const tw = targetWords[j];
      
      if (tw.length <= 4) {
        if (iw !== tw) { isMatch = false; break; }
      } else {
        const allowedDistance = tw.length > 5 ? 2 : 1;
        if (levenshtein(iw, tw) > allowedDistance) {
           isMatch = false; break; 
        }
      }
    }
    if (isMatch) return true;
  }
  return false;
}

function hasKeyword(text, keywords) {
    const textLower = text.toLowerCase();
    for (const kw of keywords) {
        if (new RegExp(`\\b${escapeRegExp(kw)}\\b`).test(textLower)) {
            return true;
        }
    }
    return false;
}

const ALIASES = {
  'usa': 'US',
  'america': 'US',
  'united states': 'US',
  'russia': 'RU',
  'ussr': 'SU',
  'soviet': 'SU',
  'russian': 'RU',
  'space x': 'SpaceX',
  'india': 'IN',
  'europe': 'ESA',
  'china': 'CN',
  'chinese': 'CN',
  'japan': 'JAXA',
  'japanese': 'JAXA'
};

export const parseCommand = async (input, allData) => {
  let text = input.toLowerCase();
  
  const config = {
    chartType: 'Bar',
    xAxis: 'dashboard_agency',
    yAxis: 'count',
    splitBy: 'none',
    filters: []
  };

  let explicitChartType = false;

  if (hasKeyword(text, ['line', 'trend'])) {
    config.chartType = 'Line';
    explicitChartType = true;
  } else if (hasKeyword(text, ['pie', 'share', 'distribution'])) {
    config.chartType = 'Pie';
    explicitChartType = true;
  } else if (hasKeyword(text, ['area', 'volume graph'])) {
    config.chartType = 'Area';
    explicitChartType = true;
  } else if (hasKeyword(text, ['scatter'])) {
    config.chartType = 'Scatter';
    explicitChartType = true;
  } else if (hasKeyword(text, ['bar', 'bar chart'])) {
    config.chartType = 'Bar';
    explicitChartType = true;
  }

  if (hasKeyword(text, ['year', 'timeline', 'time', 'years'])) {
    config.xAxis = 'year';
  } else if (hasKeyword(text, ['rocket', 'vehicle', 'rockets'])) {
    config.xAxis = 'rocket_type';
  } else if (hasKeyword(text, ['country', 'state', 'location', 'countries'])) {
    config.xAxis = 'state_code';
  } else if (hasKeyword(text, ['agency', 'company', 'agencies', 'companies'])) {
    config.xAxis = 'dashboard_agency';
  }

  if (hasKeyword(text, ['success rate', 'reliability'])) {
    config.yAxis = 'success_rate';
  } else if (hasKeyword(text, ['fail', 'anomalies', 'failure', 'failures', 'explode', 'disaster'])) {
    config.yAxis = 'failures';
  } else if (hasKeyword(text, ['success', 'successful'])) {
    config.yAxis = 'successes';
  } else {
    config.yAxis = 'count';
  }

  if (hasKeyword(text, ['vs', 'compared to', 'by agency', 'agencies', 'companies'])) {
    config.splitBy = 'dashboard_agency';
  } else if (hasKeyword(text, ['by outcome', 'success vs failure'])) {
    config.splitBy = 'is_success';
  } else if (hasKeyword(text, ['by country', 'countries', 'states'])) {
    config.splitBy = 'state_code';
  } else if (hasKeyword(text, ['status', 'statuses'])) {
    config.splitBy = 'success_status';
  }

  // Prevent grouping and splitting by the same exact property, which breaks chart rendering
  if (config.xAxis === config.splitBy) {
    config.splitBy = 'none';
  }

  if (allData && allData.length > 0) {
    const uniqueAgencies = new Set(allData.map(d => d.dashboard_agency));
    const uniqueRockets = new Set(allData.map(d => d.rocket_type));
    const uniqueStateCodes = new Set(allData.map(d => d.state_code));

    uniqueStateCodes.forEach(code => {
      if (!code) return;
      let matched = fuzzyMatch(text, code);
      if (!matched) {
        for (const [alias, official] of Object.entries(ALIASES)) {
          if (official === code && fuzzyMatch(text, alias)) {
            matched = true;
            break;
          }
        }
      }
      if (matched) {
        config.filters.push({ key: 'state_code', value: code });
      }
    });


    uniqueAgencies.forEach(agency => {
      if (!agency) return;
      let matched = fuzzyMatch(text, agency);
      if (!matched) {
        for (const [alias, official] of Object.entries(ALIASES)) {
          if (official === agency && fuzzyMatch(text, alias)) {
            matched = true;
            break;
          }
        }
      }
      if (matched) {
        config.filters.push({ key: 'dashboard_agency', value: agency });
      }
    });

    uniqueRockets.forEach(rocket => {
      if (!rocket) return;
      if (fuzzyMatch(text, rocket)) {
        config.filters.push({ key: 'rocket_type', value: rocket });
      }
    });
  }

  if (!explicitChartType) {
    if (config.xAxis === 'year') {
      config.chartType = config.splitBy !== 'none' ? 'Line' : 'Area';
    } else if (config.yAxis === 'success_rate') {
      config.chartType = 'Bar';
    } else if (config.splitBy === 'none' && text.includes('distribution')) {
      config.chartType = 'Pie';
    } else if (config.splitBy !== 'none') {
      config.chartType = 'StackedBar';
    } else {
      config.chartType = 'Bar';
    }
  }

  return config;
};
