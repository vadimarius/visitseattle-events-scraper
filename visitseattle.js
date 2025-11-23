const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');


const FIRST_PAGE_URL =
  'https://visitseattle.org/events/?frm=events&event_type&s';


function buildUrl(page) {
  if (page === 1) return FIRST_PAGE_URL;
  return `https://visitseattle.org/events/page/${page}/?frm=events&event_type&s`;
}

async function scrapePage(page) {
  const url = buildUrl(page);
  console.log(`\n=== Скачиваю страницу ${page}: ${url}`);

  const response = await axios.get(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
    },
  });

  const $ = cheerio.load(response.data);
  const events = [];

  $('.search-result').each((index, el) => {
    const card = $(el);

    
    const titleLink = card.find('h3.event-title a').first();
    const title = titleLink.text().trim();
    const eventPageUrl = titleLink.attr('href') || null;
    if (!title) return; 

    
    const emphasize = card.find('.search-result-meta p.emphasize-result');
    const venue = emphasize.eq(0).text().trim() || null;
    const date = emphasize.eq(1).text().trim() || null;

    
    const description =
      card
        .find('.search-result-meta p')
        .not('.emphasize-result')
        .first()
        .text()
        .trim() || null;

    
    const externalUrl =
      card.find('.search-result-meta a.button').attr('href') || null;

    events.push({
      page,
      title,
      eventPageUrl,
      venue,
      date,
      description,
      externalUrl,
    });
  });

  console.log(`Страница ${page}: найдено ${events.length} событий`);
  return events;
}

async function main() {
  let allEvents = [];

  const LAST_PAGE = 11; 

  for (let page = 1; page <= LAST_PAGE; page++) {
    try {
      const events = await scrapePage(page);
      allEvents = allEvents.concat(events);
    } catch (err) {
      console.log(`Ошибка на странице ${page}: ${err.message}`);
    }
  }

  console.log(`\nВсего собрано событий: ${allEvents.length}`);

  
  const output = `module.exports = ${JSON.stringify(allEvents, null, 2)};\n`;

  fs.writeFileSync('events_data.js', output, 'utf8');

  console.log('\nФайл создан: events_data.js');
}

main();
