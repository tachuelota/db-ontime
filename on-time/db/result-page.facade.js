const cheerio = require('cheerio');

const getDelayMessages = async (page, exactDepartureTime, minDelay) => {
    await page.waitFor(2 * 1000);
    const content = await page.content();
    return parseContent(content, exactDepartureTime, minDelay);
};

const parseContent = (domContent, exactDepartureTime, minDelay) => {
    const messages = [];
    const resultSelector = '#resultsOverview';
    const $ = cheerio.load(domContent);
    const connections = $(resultSelector).children('.boxShadow.scheduledCon');
    connections.each((index, connection) => {
        const tableRows = $(connection).children('tr');
        const departureRow = $(tableRows).eq(0).children('td');
        const arrivalRow = $(tableRows).eq(1).children('td');
        const scheduledStartTime = $(departureRow).eq(1);
        const startStationName = $(departureRow).eq(0).text().trim();
        const destinationStationName = $(arrivalRow).eq(0).text().trim();
        const scheduledDepartureTime = $(scheduledStartTime).clone().children().remove().end().text().trim();
        const delay = $(scheduledStartTime).children('span.ontime').first().text();
        const hardDelay = $(scheduledStartTime).children('span.delay').first().text();
        const delayTime = parseInt(delay.replace(/\+/g, ''), 10);
        const hardDelayTime = parseInt(hardDelay.replace(/\+/g, ''), 10);
        let finalDelayTime = hardDelayTime;
        if (isNaN(hardDelayTime)) {
            finalDelayTime = delayTime;
        }
        //logConnectionInfo(startStationName, destinationStationName, scheduledDepartureTime, finalDelayTime);
        if (trainHasDelay(delayTime, hardDelayTime, minDelay) && exactTimeIsMatching(scheduledDepartureTime, exactDepartureTime)) {
            const text = `*${scheduledDepartureTime} Uhr +${finalDelayTime}*\n${startStationName} → ${destinationStationName}\n`;
            messages.push(text);
        }
    });
    return messages;
};

const trainHasDelay = (delayTime, hardDelayTime, minDelay) => {
    const hasDelay = (delayTime > minDelay) || (hardDelayTime > minDelay);
    return hasDelay;
};

const exactTimeIsMatching = (scheduledStartTime, exactDepartureTime) => {
    if (!exactDepartureTime) {
        return true;
    }
    return scheduledStartTime.trim() == exactDepartureTime.trim();
};

const logConnectionInfo = (startStationName, destinationStationName, scheduledDepartureTime, delayTime) => {
    console.log('Connection from ' + startStationName + ' to ' + destinationStationName + ' at ' + scheduledDepartureTime + ' has a delay of: ' + delayTime);
};

module.exports = {
    getDelayMessages,
    parseContent,
    trainHasDelay,
    exactTimeIsMatching
};
